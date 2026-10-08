import { createClient } from '@supabase/supabase-js';
import { AccessToken, RoomServiceClient, TrackSource } from 'livekit-server-sdk';

type RequestBody = {
  roomId?: string;
  action?: 'token' | 'sync-permissions';
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });

const readRequiredEnv = (name: string) => {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
};

const readSupabaseKey = (
  modernName: 'SUPABASE_PUBLISHABLE_KEYS' | 'SUPABASE_SECRET_KEYS',
  legacyName: 'SUPABASE_ANON_KEY' | 'SUPABASE_SERVICE_ROLE_KEY',
) => {
  const modern = Deno.env.get(modernName)?.trim();
  if (modern) {
    try {
      const parsed = JSON.parse(modern) as Record<string, string>;
      const value = parsed.default?.trim();
      if (value) return value;
    } catch {
      // Fall through to legacy keys for compatibility.
    }
  }
  return readRequiredEnv(legacyName);
};

// Custom MediaStreamDestination tracks published by the existing beta client
// use Track.Source.Unknown, not Microphone. Only authorized owner/moderators on
// an unmuted seat receive the extra music source grant; all other users are mic-only.
const audioPermissions = (canPublish: boolean, mayPublishMusic: boolean) => ({
  canSubscribe: true,
  canPublish,
  canPublishData: false,
  canPublishSources: canPublish ? [
    TrackSource.MICROPHONE,
    ...(mayPublishMusic ? [TrackSource.UNKNOWN, TrackSource.SCREEN_SHARE_AUDIO] : []),
  ] : [],
});

const toServerApiUrl = (url: string) =>
  url.replace(/^wss:/i, 'https:').replace(/^ws:/i, 'http:');

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    if (req.method !== 'POST') return json(405, { error: 'METHOD_NOT_ALLOWED' });

    const authorization = req.headers.get('authorization');
    if (!authorization) return json(401, { error: 'UNAUTHORIZED' });

    let body: RequestBody;
    try {
      const value = await req.json();
      if (!value || typeof value !== 'object' || Array.isArray(value) ||
          (value.roomId !== undefined && typeof value.roomId !== 'string')) {
        return json(400, { error: 'INVALID_BODY' });
      }
      body = value;
    } catch {
      return json(400, { error: 'INVALID_JSON' });
    }

    const roomId = body.roomId?.trim();
    const action = body.action ?? 'token';
    if (!roomId) return json(400, { error: 'ROOM_ID_REQUIRED' });
    if (action !== 'token' && action !== 'sync-permissions') {
      return json(400, { error: 'INVALID_ACTION' });
    }

    try {
      const supabaseUrl = readRequiredEnv('SUPABASE_URL');
      const publishableKey = readSupabaseKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY');
      const secretKey = readSupabaseKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY');

      const authClient = createClient(supabaseUrl, publishableKey, {
        global: { headers: { Authorization: authorization } },
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: userData, error: userError } = await authClient.auth.getUser();
      const user = userData.user;
      if (userError || !user) return json(401, { error: 'UNAUTHORIZED' });

      const admin = createClient(supabaseUrl, secretKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const [roomResult, membershipResult, banResult] = await Promise.all([
        admin.from('rooms').select('id,is_active,owner_id').eq('id', roomId).maybeSingle(),
        admin.from('room_members')
          .select('room_id,user_id,seat_number,is_muted,role')
          .eq('room_id', roomId)
          .eq('user_id', user.id)
          .maybeSingle(),
        admin.from('room_bans')
          .select('room_id,user_id')
          .eq('room_id', roomId)
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (roomResult.error || membershipResult.error || banResult.error) {
        console.error('livekit-room database lookup failed', {
          roomError: roomResult.error?.message,
          membershipError: membershipResult.error?.message,
          banError: banResult.error?.message,
        });
        return json(500, { error: 'ROOM_AUTHORIZATION_LOOKUP_FAILED' });
      }

      const room = roomResult.data;
      const membership = membershipResult.data;
      const ban = banResult.data;

      if (!room || room.is_active !== true) return json(403, { error: 'ROOM_NOT_AVAILABLE' });
      if (ban) return json(403, { error: 'ROOM_BANNED' });
      if (!membership) return json(403, { error: 'ROOM_MEMBERSHIP_REQUIRED' });

      const livekitUrl = readRequiredEnv('LIVEKIT_URL');
      const livekitApiUrl = toServerApiUrl(livekitUrl);
      const apiKey = readRequiredEnv('LIVEKIT_API_KEY');
      const apiSecret = readRequiredEnv('LIVEKIT_API_SECRET');
      const roomName = room.id;
      const identity = user.id;
      const canPublish = membership.seat_number !== null && membership.is_muted === false;
      const isMusicController = room.owner_id === user.id || membership.role === 'moderator';
      let musicEnabled = false;
      if (canPublish && isMusicController) {
        const {data: flag, error: flagError} = await admin.from('beta_feature_flags')
          .select('enabled').eq('id','music_enabled').maybeSingle();
        if (flagError) console.error('music flag lookup failed', {message:flagError.message});
        musicEnabled = !flagError && flag?.enabled === true;
      }
      const permissions = audioPermissions(canPublish, musicEnabled && isMusicController);

      if (action === 'sync-permissions') {
        const roomService = new RoomServiceClient(livekitApiUrl, apiKey, apiSecret);
        try {
          await roomService.updateParticipant(roomName, identity, { permission: permissions });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (/not found|participant/i.test(message)) {
            return json(409, { error: 'LIVEKIT_PARTICIPANT_NOT_CONNECTED', canPublish });
          }
          console.error('livekit permission sync failed', { message });
          return json(502, { error: 'LIVEKIT_PERMISSION_SYNC_FAILED' });
        }

        return json(200, { ok: true, roomName, identity, canPublish });
      }

      const accessToken = new AccessToken(apiKey, apiSecret, { identity, ttl: '15m' });
      accessToken.addGrant({
        roomJoin: true,
        room: roomName,
        canSubscribe: true,
        canPublish,
        canPublishData: false,
        canPublishSources: permissions.canPublishSources,
        canUpdateOwnMetadata: false,
      });

      const token = await accessToken.toJwt();
      return json(200, {
        token,
        url: livekitUrl,
        roomName,
        identity,
        canPublish,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('livekit-room server configuration error', { message });
      if (message.startsWith('Missing server configuration: LIVEKIT_')) {
        return json(503, { error: 'LIVEKIT_NOT_CONFIGURED' });
      }
      return json(500, { error: 'INTERNAL_ERROR' });
    }
  },
};

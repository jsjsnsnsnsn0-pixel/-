import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabase';
import { Room } from '../types';
import { useLegacyRoomAudio } from './useLegacyRoomAudio';

type LiveKitGlobal = {
  Room?: new (...args: any[]) => any;
  RoomEvent?: Record<string, string>;
};

type TokenResponse = {
  token?: string;
  url?: string;
  roomName?: string;
  identity?: string;
  canPublish?: boolean;
  error?: string;
};

const liveKit = (): LiveKitGlobal | undefined => (globalThis as any).LivekitClient as LiveKitGlobal | undefined;

const friendlyAudioError = (error: unknown) => {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error || '');
  if (/LIVEKIT_NOT_CONFIGURED/i.test(message)) return 'خدمة الصوت غير مهيأة على الخادم بعد.';
  if (/ROOM_BANNED/i.test(message)) return 'لا يمكنك الاتصال بصوت هذه الغرفة لأنك محظور منها.';
  if (/ROOM_MEMBERSHIP_REQUIRED/i.test(message)) return 'انضم إلى الغرفة أولاً قبل تشغيل الصوت.';
  if (/ROOM_NOT_AVAILABLE/i.test(message)) return 'الغرفة غير متاحة للصوت حالياً.';
  if (/NotAllowedError|Permission|denied/i.test(message)) return 'تم رفض إذن المايكروفون. اسمح لتوتي شات باستخدام المايكروفون من إعدادات الهاتف ثم حاول مجدداً.';
  return 'تعذر إعداد الصوت الحقيقي. تحقق من الاتصال وحاول مجدداً.';
};

function useLiveKitRoomAudio(
  room: Room | null,
  authId: string | undefined,
  muted: boolean,
  speaker: boolean,
  onError: (message: string) => void,
  noiseSuppression = true,
) {
  const [connected, setConnected] = useState(false);
  const [speakingIds, setSpeakingIds] = useState<string[]>([]);
  const clientRef = useRef<any>(null);
  const generation = useRef(0);
  const pendingEnable = useRef(false);
  const speakerRef = useRef(speaker); speakerRef.current = speaker;
  const mutedRef = useRef(muted); mutedRef.current = muted;
  const noiseRef = useRef(noiseSuppression); noiseRef.current = noiseSuppression;
  const remoteAudio = useRef(new Map<string, HTMLMediaElement>());
  const roomId = room?.id;
  const hasSeat = Boolean(authId && room?.seats.some(seat => seat.user?.authId === authId));

  const invokeAudio = useCallback(async (action: 'token' | 'sync-permissions'): Promise<TokenResponse> => {
    if (!roomId) throw new Error('ROOM_MEMBERSHIP_REQUIRED');
    const { data, error } = await supabase.functions.invoke('livekit-room', { body: { roomId, action } });
    if (error) throw error;
    const response = (data || {}) as TokenResponse;
    if (response.error) throw new Error(response.error);
    return response;
  }, [roomId]);

  const removeRemoteAudio = useCallback((key: string) => {
    const element = remoteAudio.current.get(key);
    if (!element) return;
    try { element.pause(); } catch {}
    element.srcObject = null;
    element.remove();
    remoteAudio.current.delete(key);
  }, []);

  const clearRemoteAudio = useCallback(() => {
    for (const key of [...remoteAudio.current.keys()]) removeRemoteAudio(key);
  }, [removeRemoteAudio]);

  useEffect(() => {
    if (!roomId || !authId) return;
    const SDK = liveKit();
    const RoomCtor = SDK?.Room;
    const Events = SDK?.RoomEvent;
    if (!RoomCtor || !Events) {
      onError('تعذر تحميل محرك LiveKit. تحقق من اتصال الإنترنت ثم أعد فتح التطبيق.');
      return;
    }

    const currentGeneration = ++generation.current;
    let disposed = false;
    const client = new RoomCtor();
    clientRef.current = client;

    const keyFor = (publication: any, participant: any) => String(publication?.trackSid || `${participant?.identity || 'remote'}:${Date.now()}`);
    const onTrackSubscribed = (track: any, publication: any, participant: any) => {
      if (track?.kind !== 'audio') return;
      const key = keyFor(publication, participant);
      removeRemoteAudio(key);
      const element = track.attach?.() as HTMLMediaElement | undefined;
      if (!element) return;
      element.autoplay = true;
      element.muted = !speakerRef.current;
      element.setAttribute('data-totichat-livekit-audio', participant?.identity || 'remote');
      element.style.display = 'none';
      document.body.appendChild(element);
      remoteAudio.current.set(key, element);
      void element.play().catch(() => {});
    };
    const onTrackUnsubscribed = (track: any, publication: any, participant: any) => {
      const key = keyFor(publication, participant);
      try { track?.detach?.(); } catch {}
      removeRemoteAudio(key);
    };
    const onActiveSpeakers = (participants: any[]) => {
      setSpeakingIds((participants || []).map(p => String(p.identity || '')).filter(Boolean));
    };
    const onDisconnected = () => {
      if (!disposed) {
        setConnected(false);
        setSpeakingIds([]);
      }
    };
    const onReconnecting = () => { if (!disposed) setConnected(false); };
    const onReconnected = () => { if (!disposed) setConnected(true); };

    if (Events.TrackSubscribed) client.on(Events.TrackSubscribed, onTrackSubscribed);
    if (Events.TrackUnsubscribed) client.on(Events.TrackUnsubscribed, onTrackUnsubscribed);
    if (Events.ActiveSpeakersChanged) client.on(Events.ActiveSpeakersChanged, onActiveSpeakers);
    if (Events.Disconnected) client.on(Events.Disconnected, onDisconnected);
    if (Events.Reconnecting) client.on(Events.Reconnecting, onReconnecting);
    if (Events.Reconnected) client.on(Events.Reconnected, onReconnected);

    void (async () => {
      try {
        const tokenData = await invokeAudio('token');
        if (disposed || currentGeneration !== generation.current) return;
        if (!tokenData.token || !tokenData.url) throw new Error('LIVEKIT_TOKEN_INVALID');
        await client.connect(tokenData.url, tokenData.token, { autoSubscribe: true });
        if (disposed || currentGeneration !== generation.current) {
          void client.disconnect?.();
          return;
        }
        setConnected(true);
        void client.startAudio?.().catch?.(() => {});
        void invokeAudio('sync-permissions').catch(() => {});
      } catch (error) {
        if (!disposed) {
          setConnected(false);
          onError(friendlyAudioError(error));
        }
      }
    })();

    return () => {
      disposed = true;
      generation.current++;
      pendingEnable.current = false;
      setConnected(false);
      setSpeakingIds([]);
      clearRemoteAudio();
      if (clientRef.current === client) clientRef.current = null;
      try { void client.disconnect?.(); } catch {}
    };
  }, [roomId, authId, invokeAudio, clearRemoteAudio, removeRemoteAudio, onError]);

  useEffect(() => {
    for (const element of remoteAudio.current.values()) {
      element.muted = !speaker;
      if (speaker) void element.play().catch(() => {});
    }
    if (speaker) void clientRef.current?.startAudio?.().catch?.(() => {});
  }, [speaker]);

  useEffect(() => {
    const client = clientRef.current;
    if (!connected || !client || !roomId || !authId) return;
    let cancelled = false;

    void (async () => {
      try {
        const permission = await invokeAudio('sync-permissions');
        if (cancelled || client !== clientRef.current) return;
        const allowed = hasSeat && !muted && permission.canPublish !== false;
        if (!allowed) {
          pendingEnable.current = false;
          await client.localParticipant?.setMicrophoneEnabled?.(false);
          return;
        }
        if (pendingEnable.current) {
          await client.localParticipant?.setMicrophoneEnabled?.(true, {
            echoCancellation: true,
            noiseSuppression: noiseRef.current,
          });
          pendingEnable.current = false;
          void client.startAudio?.().catch?.(() => {});
        }
      } catch (error) {
        if (!cancelled) onError(friendlyAudioError(error));
      }
    })();

    return () => { cancelled = true; };
  }, [connected, roomId, authId, hasSeat, muted, invokeAudio, onError]);

  useEffect(() => {
    const client = clientRef.current;
    if (!client || !connected) return;
    const publications = client.localParticipant?.audioTrackPublications;
    if (!publications) return;
    for (const publication of publications.values?.() || []) {
      const mediaTrack = publication?.track?.mediaStreamTrack;
      if (mediaTrack?.applyConstraints) {
        void mediaTrack.applyConstraints({ echoCancellation: true, noiseSuppression }).catch(() => {});
      }
    }
  }, [noiseSuppression, connected]);

  const enableMicrophone = useCallback(async () => {
    if (!roomId || !authId) throw new Error('ادخل الغرفة أولاً.');
    if (!hasSeat) throw new Error('اختر مقعداً أولاً لتشغيل المايكروفون.');
    if (!connected || !clientRef.current) throw new Error('تعذر الاتصال بخدمة الصوت. حاول بعد لحظة.');
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('يحتاج المايكروفون متصفحاً يدعم الصوت واتصال HTTPS.');

    const preview = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: noiseRef.current },
      video: false,
    });
    preview.getTracks().forEach(track => track.stop());
    pendingEnable.current = true;
    void clientRef.current?.startAudio?.().catch?.(() => {});

    if (!mutedRef.current) {
      const permission = await invokeAudio('sync-permissions');
      if (permission.canPublish === false) throw new Error('MIC_PUBLISH_NOT_ALLOWED');
      await clientRef.current.localParticipant?.setMicrophoneEnabled?.(true, {
        echoCancellation: true,
        noiseSuppression: noiseRef.current,
      });
      pendingEnable.current = false;
    }
  }, [roomId, authId, hasSeat, connected, invokeAudio]);

  return { connected, enableMicrophone, speakingIds };
}

// index.html loads the pinned LiveKit SDK before the app module. Browser automation keeps
// the existing custom WebRTC engine so transport-independent UI/lifecycle checks remain
// deterministic and do not call the real LiveKit Edge Function. Real browsers/WebViews
// prefer LiveKit whenever the SDK loaded successfully.
const automatedBrowser = typeof navigator !== 'undefined' && navigator.webdriver === true;
const useLiveKitAtModuleLoad = !automatedBrowser && Boolean(liveKit()?.Room && liveKit()?.RoomEvent);
export const useRoomAudio = useLiveKitAtModuleLoad ? useLiveKitRoomAudio : useLegacyRoomAudio;

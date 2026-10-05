import { useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabase';
import { Room } from '../types';

type Signal = {id: string; sender_id: string; kind: 'ready' | 'offer' | 'answer' | 'ice'; payload: any};
type Peer = {connection: RTCPeerConnection; audio: HTMLAudioElement; candidates: RTCIceCandidateInit[]};

// Signaling rows are authorized by sender, recipient and room membership through RLS.
export function useRoomAudio(room: Room | null, authId: string | undefined, muted: boolean, speaker: boolean, onError: (message: string) => void, noiseSuppression = true) {
  const [connected, setConnected] = useState(false);
  const peers = useRef(new Map<string, Peer>());
  const stream = useRef<MediaStream | null>(null);
  const speakerRef = useRef(speaker); speakerRef.current = speaker;
  const membersRef = useRef(room?.members || []); membersRef.current = room?.members || [];
  const sendRef = useRef<(to: string, kind: Signal['kind'], payload: object) => Promise<void>>(async () => {});
  const mutedRef = useRef(muted); mutedRef.current = muted;

  useEffect(() => {
    for (const track of stream.current?.getAudioTracks() || []) track.enabled = !muted;
  }, [muted]);
  useEffect(() => {
    for (const track of stream.current?.getAudioTracks() || []) void track.applyConstraints({echoCancellation: true, noiseSuppression}).catch(() => {});
  }, [noiseSuppression]);
  useEffect(() => { for (const peer of peers.current.values()) peer.audio.muted = !speaker; }, [speaker]);

  useEffect(() => {
    if (!room?.id || !authId || typeof RTCPeerConnection === 'undefined') return;
    const roomId = room.id;
    let stopped = false;
    const seen = new Set<string>();
    const serial = new Map<string, Promise<void>>();
    const startedAt = new Date().toISOString();
    const send = async (to: string, kind: Signal['kind'], payload: object) => {
      if (stopped) return;
      const {error} = await supabase.from('room_audio_signals').insert({room_id: roomId, recipient_id: to, kind, payload});
      if (error && !stopped) throw error;
    };
    sendRef.current = send;
    const getPeer = (id: string): Peer => {
      const existing = peers.current.get(id); if (existing) return existing;
      const connection = new RTCPeerConnection({iceServers: [{urls: 'stun:stun.l.google.com:19302'}]});
      const audio = new Audio(); audio.autoplay = true; audio.muted = !speakerRef.current;
      const transceiver = connection.addTransceiver('audio', {direction: 'sendrecv'});
      const track = stream.current?.getAudioTracks()[0];
      if (track) void transceiver.sender.replaceTrack(track);
      const peer: Peer = {connection, audio, candidates: []}; peers.current.set(id, peer);
      connection.onicecandidate = event => { if (event.candidate) void send(id, 'ice', event.candidate.toJSON()).catch(() => onError('تعذر ربط الصوت. تحقق من اتصالك.')); };
      connection.ontrack = event => { audio.srcObject = event.streams[0] || new MediaStream([event.track]); void audio.play().catch(() => {}); };
      connection.onconnectionstatechange = () => {
        if (connection.connectionState === 'failed') onError('تعذر الاتصال الصوتي بهذا المستخدم. أعد دخول الغرفة.');
      };
      return peer;
    };
    const handle = async (signal: Signal) => {
      if (stopped || seen.has(signal.id) || signal.sender_id === authId) return;
      // Membership can change between the last room refresh and receipt; RLS is the authority.
      seen.add(signal.id);
      const peer = getPeer(signal.sender_id); const pc = peer.connection;
      if (signal.kind === 'ready') {
        // One deterministic offerer prevents negotiation glare.
        if (authId < signal.sender_id && pc.signalingState === 'stable' && !pc.localDescription) {
          await pc.setLocalDescription(await pc.createOffer());
          await send(signal.sender_id, 'offer', pc.localDescription!.toJSON());
        }
      } else if (signal.kind === 'offer') {
        if (authId < signal.sender_id) return;
        await pc.setRemoteDescription(signal.payload);
        for (const candidate of peer.candidates.splice(0)) await pc.addIceCandidate(candidate);
        await pc.setLocalDescription(await pc.createAnswer());
        await send(signal.sender_id, 'answer', pc.localDescription!.toJSON());
      } else if (signal.kind === 'answer') {
        if (pc.signalingState !== 'have-local-offer') return;
        await pc.setRemoteDescription(signal.payload);
        for (const candidate of peer.candidates.splice(0)) await pc.addIceCandidate(candidate);
      } else if (signal.kind === 'ice') {
        if (pc.remoteDescription) await pc.addIceCandidate(signal.payload);
        else peer.candidates.push(signal.payload);
      }
      // Acknowledged signals are short-lived and do not accumulate during normal use.
      const {error} = await supabase.from('room_audio_signals').delete().eq('id', signal.id);
      if (error) console.error('Signal cleanup failed', error);
    };
    const queue = (signal: Signal) => {
      const previous = serial.get(signal.sender_id) || Promise.resolve();
      serial.set(signal.sender_id, previous.then(() => handle(signal)).catch(() => {
        if (!stopped) onError('تعذر إعداد الصوت. أعد دخول الغرفة.');
      }));
    };
    const channel = supabase.channel(`audio:${roomId}:${authId}`).on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'room_audio_signals', filter: `recipient_id=eq.${authId}`,
    }, event => { if (event.new.room_id === roomId) queue(event.new as Signal); }).subscribe(async status => {
      if (status === 'SUBSCRIBED' && !stopped) {
        setConnected(true);
        const {data, error} = await supabase.from('room_audio_signals').select('*').eq('room_id', roomId)
          .eq('recipient_id', authId).gte('created_at', startedAt).order('created_at');
        if (error) onError('تعذر إعداد الاتصال الصوتي.');
        else for (const signal of data || []) queue(signal);
        for (const member of membersRef.current) if (member.authId && member.authId !== authId) {
          void send(member.authId, 'ready', {}).catch(() => onError('تعذر إعداد الاتصال الصوتي.'));
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { setConnected(false); onError('انقطع اتصال الغرفة الصوتية.'); }
    });
    return () => {
      stopped = true; setConnected(false); void supabase.removeChannel(channel);
      for (const peer of peers.current.values()) { peer.connection.close(); peer.audio.pause(); peer.audio.srcObject = null; }
      peers.current.clear();
      for (const track of stream.current?.getTracks() || []) track.stop(); stream.current = null;
      void supabase.from('room_audio_signals').delete().eq('room_id', roomId).eq('sender_id', authId).then(() => {});
    };
  }, [room?.id, authId]);

  // Tell existing participants when the room membership changes; establish only missing peers.
  const memberIds = (room?.members || []).map(m => m.authId).filter(Boolean).sort().join(',');
  useEffect(() => {
    if (!connected || !authId) return;
    const ids = new Set(memberIds.split(','));
    for (const [id, peer] of peers.current) if (!ids.has(id)) { peer.connection.close(); peer.audio.pause(); peers.current.delete(id); }
    for (const id of ids) if (id && id !== authId && !peers.current.has(id)) void sendRef.current(id, 'ready', {}).catch(() => {});
  }, [memberIds, connected, authId]);

  const enableMicrophone = async () => {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('يحتاج المايكروفون متصفحاً يدعم الصوت واتصال HTTPS.');
    if (!stream.current) {
      const captured = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true, noiseSuppression}, video: false});
      stream.current = captured;
      const track = captured.getAudioTracks()[0]; track.enabled = !mutedRef.current;
      await Promise.all([...peers.current.values()].map(p => p.connection.getSenders().find(s => s.track?.kind === 'audio' || !s.track)?.replaceTrack(track)));
    }
    for (const peer of peers.current.values()) void peer.audio.play().catch(() => {});
  };
  return {connected, enableMicrophone};
}

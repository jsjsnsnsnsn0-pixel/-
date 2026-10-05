import {useAudioActivity, AudioSource} from './useAudioActivity';
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Room } from '../types';

type Signal = {id: string; sender_id: string; kind: 'ready' | 'offer' | 'answer' | 'ice'; payload: any};
type Peer = {connection: RTCPeerConnection; audio: HTMLAudioElement; candidates: RTCIceCandidateInit[]};

// Signaling rows are authorized by sender, recipient and room membership through RLS.
export function useRoomAudio(room: Room | null, authId: string | undefined, muted: boolean, speaker: boolean, onError: (message: string) => void, noiseSuppression = true) {
  const [connected, setConnected] = useState(false);
  const peers = useRef(new Map<string, Peer>());
  const stream = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const capture = useRef<Promise<void> | null>(null);
  const speakerRef = useRef(speaker); speakerRef.current = speaker;
  const membersRef = useRef(room?.members || []); membersRef.current = room?.members || [];
  const sendRef = useRef<(to: string, kind: Signal['kind'], payload: object) => Promise<void>>(async () => {});
  const mutedRef = useRef(muted); mutedRef.current = muted;
  const roomRef = useRef(room); roomRef.current = room;
  const readAudioSources = useCallback(() => {
    const active = new Map<string, AudioSource>();
    if (authId && stream.current) active.set(authId,{stream:stream.current,muted:mutedRef.current});
    for (const [id,peer] of peers.current) {
      if (typeof MediaStream !== 'undefined' && peer.audio.srcObject instanceof MediaStream) active.set(id,{stream:peer.audio.srcObject,
        muted:roomRef.current?.seats.find(seat => seat.user?.authId === id)?.isMuted ?? true});
    }
    return active;
  },[authId]);
  const speakingIds = useAudioActivity(room?.id, readAudioSources);

  useEffect(() => {
    for (const track of stream.current?.getAudioTracks() || []) track.enabled = !muted;
  }, [muted]);
  useEffect(() => {
    for (const track of stream.current?.getAudioTracks() || []) void track.applyConstraints({echoCancellation: true, noiseSuppression}).catch(() => {});
  }, [noiseSuppression]);
  useEffect(() => { for (const peer of peers.current.values()) peer.audio.muted = !speaker; }, [speaker]);

  useEffect(() => {
    if (!room?.id || !authId || typeof RTCPeerConnection === 'undefined') return;
    generation.current++;
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
      if (seen.size > 2000) seen.delete(seen.values().next().value!);
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
    }, event => { if (event.new.room_id === roomId) queue(event.new as Signal); }).subscribe(status => {
      void (async () => {
      if (status === 'SUBSCRIBED' && !stopped) {
        setConnected(true);
        const {data, error} = await supabase.from('room_audio_signals').select('*').eq('room_id', roomId)
          .eq('recipient_id', authId).gte('created_at', startedAt).order('created_at');
        if (stopped) return;
        if (error) onError('تعذر إعداد الاتصال الصوتي.');
        else for (const signal of data || []) queue(signal);
        for (const member of membersRef.current) if (member.authId && member.authId !== authId) {
          void send(member.authId, 'ready', {}).catch(() => onError('تعذر إعداد الاتصال الصوتي.'));
        }
      } else if (!stopped && (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')) { setConnected(false); onError('انقطع اتصال الغرفة الصوتية.'); }
      })().catch(() => {if (!stopped) onError('تعذر إعداد الاتصال الصوتي.');});
    });
    return () => {
      stopped = true; generation.current++; capture.current = null; sendRef.current = async () => {}; setConnected(false); void supabase.removeChannel(channel);
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
    for (const [id, peer] of peers.current) if (!ids.has(id)) { peer.connection.close(); peer.audio.pause(); peer.audio.srcObject = null; peers.current.delete(id); }
    for (const id of ids) if (id && id !== authId && !peers.current.has(id)) void sendRef.current(id, 'ready', {}).catch(() => {});
  }, [memberIds, connected, authId]);

  const enableMicrophone = async () => {
    if (!room?.id || !authId) throw new Error('ادخل الغرفة أولاً.');
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('يحتاج المايكروفون متصفحاً يدعم الصوت واتصال HTTPS.');
    const current = generation.current;
    if (!stream.current && !capture.current) {
      const pending = (async () => {
        const captured = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true, noiseSuppression}, video: false});
        if (current !== generation.current) { captured.getTracks().forEach(track => track.stop()); throw new Error('انتهت جلسة الغرفة.'); }
        const track = captured.getAudioTracks()[0];
        if (!track) { captured.getTracks().forEach(t => t.stop()); throw new Error('لم يتم العثور على الميكروفون.'); }
        stream.current = captured; track.enabled = !mutedRef.current;
        await Promise.all([...peers.current.values()].map(p => p.connection.getSenders().find(s => s.track?.kind === 'audio' || !s.track)?.replaceTrack(track)));
      })();
      capture.current = pending;
      try { await pending; } finally { if (capture.current === pending) capture.current = null; }
    } else if (capture.current) await capture.current;
    if (current !== generation.current) throw new Error('انتهت جلسة الغرفة.');
    for (const peer of peers.current.values()) void peer.audio.play().catch(() => {});
  };
  return {connected, enableMicrophone, speakingIds};
}

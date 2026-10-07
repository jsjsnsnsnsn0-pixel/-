import {RoomMusicPublisher} from '../services/roomMusic';
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
  if (/MIC_PUBLISH_NOT_ALLOWED/i.test(message)) return 'المقعد أو صلاحية المايك لم تتزامن بعد. حاول مرة أخرى.';
  if (/NotAllowedError|Permission|denied/i.test(message)) return 'تم رفض إذن المايكروفون. اسمح لتوتي شات باستخدام المايكروفون من إعدادات الهاتف ثم حاول مجدداً.';
  return 'تعذر إعداد الصوت الحقيقي. تحقق من الاتصال وحاول مجدداً.';
};

export function useLiveKitRoomAudio(
  room: Room | null,
  authId: string | undefined,
  muted: boolean,
  speaker: boolean,
  onError: (message: string) => void,
  noiseSuppression = true,
) {
  const [musicName,setMusicName]=useState('');
  const [musicPaused,setMusicPaused]=useState(false);
  const musicRef=useRef<RoomMusicPublisher|null>(null);
  if(!musicRef.current)musicRef.current=new RoomMusicPublisher(name=>{setMusicName(name);if(!name)setMusicPaused(false)});
  const [connected, setConnected] = useState(false);
  const [speakingIds, setSpeakingIds] = useState<string[]>([]);
  const clientRef = useRef<any>(null);
  const generation = useRef(0);
  const pendingEnable = useRef(false);
  const playbackWarningShown = useRef(false);
  const speakerRef = useRef(speaker); speakerRef.current = speaker;
  const mutedRef = useRef(muted); mutedRef.current = muted;
  const noiseRef = useRef(noiseSuppression); noiseRef.current = noiseSuppression;
  const remoteAudio = useRef(new Map<string, HTMLMediaElement>());
  const roomId = room?.id;
  const hasSeat = Boolean(authId && room?.seats.some(seat => seat.user?.authId === authId));
  const hasSeatRef = useRef(hasSeat); hasSeatRef.current = hasSeat;

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

  const resumePlayback = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;
    try { await client.startAudio?.(); } catch {}
    if (!speakerRef.current) return;
    let blocked = false;
    for (const element of remoteAudio.current.values()) {
      element.muted = false;
      try { await element.play(); } catch { blocked = true; }
    }
    if (blocked && !playbackWarningShown.current) {
      playbackWarningShown.current = true;
      onError('تعذر تشغيل صوت الغرفة تلقائياً. اضغط زر السماعة داخل الغرفة مرة واحدة.');
    }
  }, [onError]);

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
    playbackWarningShown.current = false;
    const client = new RoomCtor();
    clientRef.current = client;

    const keyFor = (publication: any, participant: any) => String(publication?.trackSid || `${participant?.identity || 'remote'}:${Date.now()}`);
    const onTrackSubscribed = (track: any, publication: any, participant: any) => {
      if (disposed || track?.kind !== 'audio') return;
      const key = keyFor(publication, participant);
      removeRemoteAudio(key);
      const element = track.attach?.() as HTMLMediaElement | undefined;
      if (!element) return;
      element.autoplay = true;
      element.muted = !speakerRef.current;
      element.setAttribute('playsinline', 'true');
      element.setAttribute('data-totichat-livekit-audio', participant?.identity || 'remote');
      element.style.display = 'none';
      document.body.appendChild(element);
      remoteAudio.current.set(key, element);
      if (speakerRef.current) void resumePlayback();
    };
    const onTrackUnsubscribed = (track: any, publication: any, participant: any) => {
      const key = keyFor(publication, participant);
      try { track?.detach?.(); } catch {}
      removeRemoteAudio(key);
    };
    const onActiveSpeakers = (participants: any[]) => {
      if (disposed) return;
      setSpeakingIds((participants || []).map(p => String(p.identity || '')).filter(Boolean));
    };
    const onDisconnected = () => {
      if (!disposed) {
        setConnected(false);
        setSpeakingIds([]);
      }
    };
    const onReconnecting = () => { if (!disposed) setConnected(false); };
    const onReconnected = () => {
      if (disposed) return;
      setConnected(true);
      void invokeAudio('sync-permissions').catch(() => {});
      void resumePlayback();
    };

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
        await resumePlayback();
        await invokeAudio('sync-permissions').catch(() => undefined);
      } catch (error) {
        if (!disposed) {
          setConnected(false);
          onError(friendlyAudioError(error));
        }
      }
    })();

    return () => {
      musicRef.current?.stop();
      disposed = true;
      generation.current++;
      pendingEnable.current = false;
      playbackWarningShown.current = false;
      setConnected(false);
      setSpeakingIds([]);
      clearRemoteAudio();
      if (clientRef.current === client) clientRef.current = null;
      try { void client.disconnect?.(); } catch {}
    };
  }, [roomId, authId, invokeAudio, clearRemoteAudio, removeRemoteAudio, onError, resumePlayback]);

  useEffect(() => {
    for (const element of remoteAudio.current.values()) element.muted = !speaker;
    if (speaker) { playbackWarningShown.current = false; void resumePlayback(); }
  }, [speaker, resumePlayback]);

  useEffect(() => {
    const client = clientRef.current;
    if (!connected || !client || !roomId || !authId) return;
    let cancelled = false;

    // Stop locally immediately; a failed permission request must not leave capture running.
    if (!hasSeat || muted) {
      musicRef.current?.stop();
      pendingEnable.current = false;
      void client.localParticipant?.setMicrophoneEnabled?.(false).catch?.(() => {});
    }

    void (async () => {
      try {
        const permission = await invokeAudio('sync-permissions');
        if (cancelled || client !== clientRef.current) return;
        const allowed = hasSeat && !muted && permission.canPublish === true;
        if (!allowed) {
          musicRef.current?.stop();
          pendingEnable.current = false;
          await client.localParticipant?.setMicrophoneEnabled?.(false);
          return;
        }
        if (pendingEnable.current) {
          await client.localParticipant?.setMicrophoneEnabled?.(true, {
            echoCancellation: true,
            noiseSuppression: noiseRef.current,
          });
          if (cancelled || client !== clientRef.current || mutedRef.current || !hasSeatRef.current) {
            await client.localParticipant?.setMicrophoneEnabled?.(false);
          }
          pendingEnable.current = false;
          await resumePlayback();
        }
      } catch (error) {
        if (!cancelled) onError(friendlyAudioError(error));
      }
    })();

    return () => { cancelled = true; };
  }, [connected, roomId, authId, hasSeat, muted, invokeAudio, onError, resumePlayback]);

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

  useEffect(() => {
    if (!connected) return;
    const resume = () => {
      if (document.visibilityState !== 'visible') return;
      void resumePlayback();
      void invokeAudio('sync-permissions').then(async permission => {
        const client = clientRef.current;
        if (!client || !hasSeatRef.current || mutedRef.current || permission.canPublish !== true) return;
        const publications = client.localParticipant?.audioTrackPublications;
        const hasLiveTrack = publications && [...(publications.values?.() || [])].some((p:any) => p?.track?.mediaStreamTrack?.readyState === 'live');
        if (!hasLiveTrack) await client.localParticipant?.setMicrophoneEnabled?.(true, {echoCancellation:true, noiseSuppression:noiseRef.current});
      }).catch(() => {});
    };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('focus', resume);
    return () => { document.removeEventListener('visibilitychange', resume); window.removeEventListener('focus', resume); };
  }, [connected, invokeAudio, resumePlayback]);

  const enableMicrophone = useCallback(async () => {
    if (!roomId || !authId) throw new Error('ادخل الغرفة أولاً.');
    if (!hasSeat) throw new Error('اختر مقعداً أولاً لتشغيل المايكروفون.');
    if (!connected || !clientRef.current) throw new Error('تعذر الاتصال بخدمة الصوت. حاول بعد لحظة.');
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('يحتاج المايكروفون متصفحاً يدعم الصوت واتصال HTTPS.');
    const client = clientRef.current;
    const currentGeneration = generation.current;
    const stillCurrent = () => client === clientRef.current && currentGeneration === generation.current && hasSeatRef.current;

    const preview = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: noiseRef.current },
      video: false,
    });
    preview.getTracks().forEach(track => track.stop());
    if (!stillCurrent()) throw new Error('ROOM_SESSION_ENDED');
    pendingEnable.current = true;
    await resumePlayback();

    if (!mutedRef.current) {
      const permission = await invokeAudio('sync-permissions');
      if (!stillCurrent() || mutedRef.current) { pendingEnable.current = false; return; }
      if (permission.canPublish !== true) { pendingEnable.current = false; throw new Error('MIC_PUBLISH_NOT_ALLOWED'); }
      await client.localParticipant?.setMicrophoneEnabled?.(true, {
        echoCancellation: true,
        noiseSuppression: noiseRef.current,
      });
      if (!stillCurrent() || mutedRef.current) await client.localParticipant?.setMicrophoneEnabled?.(false);
      pendingEnable.current = false;
    }
  }, [roomId, authId, hasSeat, connected, invokeAudio, resumePlayback]);

  const startMusic=useCallback(async(file:File)=>{
    const client=clientRef.current;
    if(!client||!connected)throw new Error('انتظر اتصال صوت الغرفة.');
    const permission=await invokeAudio('sync-permissions');
    if(permission.canPublish!==true)throw new Error('لا تملك صلاحية بث الموسيقى الآن.');
    await musicRef.current!.start(file,client.localParticipant,()=>client===clientRef.current&&hasSeatRef.current&&!mutedRef.current);
    setMusicPaused(false);
  },[connected,invokeAudio]);
  const stopMusic=useCallback(()=>{musicRef.current?.stop();setMusicPaused(false)},[]);
  const pauseMusic=useCallback(()=>{if(musicRef.current?.pause())setMusicPaused(true)},[]);
  const resumeMusic=useCallback(async()=>{if(await musicRef.current?.resume())setMusicPaused(false)},[]);
  return { connected, enableMicrophone, speakingIds, startMusic,stopMusic,pauseMusic,resumeMusic,musicName,musicPaused };
}

// main.tsx bundles the pinned LiveKit SDK before the app module. Browser automation keeps
// the existing custom WebRTC engine so transport-independent UI/lifecycle checks remain
// deterministic and do not call the real LiveKit Edge Function. Real browsers/WebViews
// prefer LiveKit whenever the SDK loaded successfully.
const automatedBrowser = typeof navigator !== 'undefined' && navigator.webdriver === true;
const useLiveKitAtModuleLoad = !automatedBrowser && Boolean(liveKit()?.Room && liveKit()?.RoomEvent);
export const useRoomAudio = useLiveKitAtModuleLoad ? useLiveKitRoomAudio : useLegacyRoomAudio;

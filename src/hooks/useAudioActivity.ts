import {useEffect, useState} from 'react';
import {isSpeakingSamples} from '../utils/audioActivity';

export interface AudioSource {stream: MediaStream; muted: boolean}
// Indicators come from actual local/received audio, never a timer animation or
// a fabricated member flag. Lack of audio/permission means no speaking signal.
export function useAudioActivity(roomId: string | undefined, sources: () => Map<string, AudioSource>) {
  const [snapshot,setSnapshot] = useState<{roomId: string; ids: string[]}>({roomId:'',ids:[]});
  useEffect(() => {
    if (!roomId || typeof AudioContext === 'undefined') return;
    let context: AudioContext | null = null;
    const probes = new Map<string, {stream: MediaStream; input: MediaStreamAudioSourceNode; analyser: AnalyserNode; samples: Uint8Array<ArrayBuffer>}>();
    const timer = setInterval(() => {
      const active = sources(); const speaking: string[] = [];
      for (const [id,probe] of probes) if (active.get(id)?.stream !== probe.stream) {
        probe.input.disconnect(); probe.analyser.disconnect(); probes.delete(id);
      }
      for (const [id,source] of active) {
        const track = source.stream.getAudioTracks()[0];
        if (!track || track.readyState !== 'live') continue;
        try {
          let probe = probes.get(id);
          if (!probe) {
            context ||= new AudioContext();
            void context.resume().catch(() => {});
            const input = context.createMediaStreamSource(source.stream);
            const analyser = context.createAnalyser(); analyser.fftSize = 256;
            input.connect(analyser); // No connection to speakers: avoid feedback.
            probe = {stream:source.stream,input,analyser,samples:new Uint8Array(256)};
            probes.set(id,probe);
          }
          probe.analyser.getByteTimeDomainData(probe.samples);
          if (context?.state === 'running' && isSpeakingSamples(probe.samples,source.muted || !track.enabled)) speaking.push(id);
        } catch { /* An unsupported audio meter must not interrupt the room. */ }
      }
      speaking.sort();
      setSnapshot(previous => previous.roomId === roomId && previous.ids.join(',') === speaking.join(',') ? previous : {roomId,ids:speaking});
    }, 250);
    return () => {
      clearInterval(timer);
      for (const probe of probes.values()) {probe.input.disconnect();probe.analyser.disconnect();}
      probes.clear(); if (context) void context.close().catch(() => {});
    };
  },[roomId,sources]);
  return snapshot.roomId === roomId ? snapshot.ids : [];
}

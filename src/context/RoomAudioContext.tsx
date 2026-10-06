import React, { createContext, ReactNode, useContext } from 'react';
import { useApp } from './AppContext';
import { useRoomAudio } from '../hooks/useRoomAudio';
const Context = createContext<{connected: boolean; speakingIds: string[]; enableMicrophone: () => Promise<void>; musicName:string; startMusic:(file:File)=>Promise<void>; stopMusic:()=>void} | null>(null);
export function RoomAudioProvider({children}: {children: ReactNode}) {
  const {activeRoom, user, isMyMicMuted, isSpeakerOn, reportError, noiseSuppression} = useApp();
  const audio = useRoomAudio(activeRoom, user.authId, isMyMicMuted, isSpeakerOn, reportError, noiseSuppression);
  const unsupported=async()=>{reportError('بث الموسيقى يحتاج محرك LiveKit؛ الصوت الحالي يستخدم المحرك الاحتياطي.');};
  const value={...audio,musicName:'musicName' in audio?String(audio.musicName):'',startMusic:'startMusic' in audio?audio.startMusic as (file:File)=>Promise<void>:unsupported,stopMusic:'stopMusic' in audio?audio.stopMusic as ()=>void:()=>{}};
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useRoomAudioContext() {
  const context = useContext(Context);
  if (!context) throw new Error('RoomAudioProvider is required');
  return context;
}

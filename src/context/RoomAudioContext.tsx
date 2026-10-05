import React, { createContext, ReactNode, useContext } from 'react';
import { useApp } from './AppContext';
import { useRoomAudio } from '../hooks/useRoomAudio';
const Context = createContext<{connected: boolean; enableMicrophone: () => Promise<void>} | null>(null);
export function RoomAudioProvider({children}: {children: ReactNode}) {
  const {activeRoom, user, isMyMicMuted, isSpeakerOn, reportError, noiseSuppression} = useApp();
  const audio = useRoomAudio(activeRoom, user.authId, isMyMicMuted, isSpeakerOn, reportError, noiseSuppression);
  return <Context.Provider value={audio}>{children}</Context.Provider>;
}
export function useRoomAudioContext() {
  const context = useContext(Context);
  if (!context) throw new Error('RoomAudioProvider is required');
  return context;
}

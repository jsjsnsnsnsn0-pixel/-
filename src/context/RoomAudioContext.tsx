import React,{createContext,useContext,type ReactNode} from 'react';
const Context=createContext<any>(null);
export function RoomAudioProvider({children}:{children:ReactNode}){
 const mock={connected:true,speakingIds:[],enableMicrophone:async()=>{},disconnect:async()=>{},isConnecting:false,isPlaying:false,isMuted:false};
 return <Context.Provider value={mock}>{children}</Context.Provider>;
}
export function useRoomAudioContext():any{
 return useContext(Context)??{connected:true,speakingIds:[],enableMicrophone:async()=>{}};
}

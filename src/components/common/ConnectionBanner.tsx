import React,{useCallback,useEffect,useRef,useState} from 'react';
import {Wifi,WifiOff,RefreshCw,SignalLow} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {useRoomAudioContext} from '../../context/RoomAudioContext';
import {supabase} from '../../services/supabase';

export type ConnectionPhase='connected'|'weak'|'disconnected'|'reconnecting'|'restored';

export function ConnectionBanner(){
 const {activeRoom,user,refreshRooms,leaveRoom}=useApp();
 const {connected:audioConnected}=useRoomAudioContext();
 const [phase,setPhase]=useState<ConnectionPhase>(
  ()=>typeof navigator!=='undefined'&&!navigator.onLine?'disconnected':'connected');
 const [retrying,setRetrying]=useState(false);
 const consecutiveFailures=useRef(0);
 const previousPhase=useRef<ConnectionPhase>(phase);
 const restoreTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const roomEntered=useRef(Date.now());
 useEffect(()=>{roomEntered.current=Date.now()},[activeRoom?.id]);
 const applyPhase=useCallback((next:ConnectionPhase)=>{
  setPhase(prev=>{
   if(next==='connected'&&['disconnected','reconnecting'].includes(prev))return 'restored';
   return next;
  });
 },[]);
 const probe=useCallback(async()=>{
  if(!navigator.onLine){applyPhase('disconnected');return;}
  if(!user.authId){consecutiveFailures.current=0;applyPhase('connected');return;}
  const timeout=new AbortController();
  const timer=setTimeout(()=>timeout.abort(),7500);
  try{
   const {error}=await supabase.from('profiles').select('id',{head:true})
    .eq('id',user.authId).abortSignal(timeout.signal);
   if(error)throw error;
   consecutiveFailures.current=0;
   const connection=(navigator as Navigator & {connection?:{effectiveType?:string}}).connection;
   applyPhase(connection?.effectiveType==='2g'||connection?.effectiveType==='slow-2g'?'weak':'connected');
  }catch{
   consecutiveFailures.current++;
   if(consecutiveFailures.current>=2)applyPhase('reconnecting');
  }finally{clearTimeout(timer);}
 },[user.authId,applyPhase]);
 useEffect(()=>{
  const offline=()=>{consecutiveFailures.current=0;applyPhase('disconnected')};
  const online=()=>{applyPhase('reconnecting');void probe()};
  window.addEventListener('offline',offline);window.addEventListener('online',online);
  void probe();
  const timer=setInterval(()=>void probe(),25000);
  return()=>{clearInterval(timer);window.removeEventListener('offline',offline);window.removeEventListener('online',online)};
 },[probe,applyPhase]);
 useEffect(()=>{
  if(!activeRoom||!navigator.onLine||phase==='disconnected')return;
  const timer=setTimeout(()=>{
   if(!audioConnected&&navigator.onLine)setPhase(p=>p==='connected'?'reconnecting':p);
  },6500);
  return()=>clearTimeout(timer);
 },[activeRoom?.id,audioConnected,phase]);
 useEffect(()=>{
  if(restoreTimer.current)clearTimeout(restoreTimer.current);
  if(phase==='restored')restoreTimer.current=setTimeout(()=>setPhase('connected'),2800);
  previousPhase.current=phase;
  return()=>{if(restoreTimer.current)clearTimeout(restoreTimer.current)};
 },[phase]);
 const tryAgain=async()=>{
  if(retrying)return;setRetrying(true);
  await Promise.allSettled([probe(),refreshRooms()]);
  setRetrying(false);
 };
 if(phase==='connected')return null;
 const disconnected=phase==='disconnected';
 const recovering=phase==='reconnecting';
 const recovered=phase==='restored';
 const title=disconnected?'انقطع الاتصال بالإنترنت':recovering?'جاري إعادة الاتصال…':recovered?'تم استعادة الاتصال':'الاتصال ضعيف';
 return <div className="fixed inset-0 z-[235] flex items-center justify-center pointer-events-none px-5" role="status" aria-live="polite" dir="rtl">
  <div className="pointer-events-auto w-full max-w-[300px] rounded-2xl border border-white/20 bg-[#101526]/85 backdrop-blur-lg shadow-2xl p-4 text-white text-center">
   <div className="flex items-center justify-center gap-2">
    {disconnected?<WifiOff size={21} className="text-rose-300"/>:recovering?<RefreshCw size={20} className="text-amber-300 animate-spin"/>:recovered?<Wifi size={21} className="text-emerald-300"/>:<SignalLow size={21} className="text-amber-300"/>}
    <strong className="text-sm">{title}</strong>
   </div>
   {!recovered&&<p className="mt-2 text-[11px] text-slate-300 leading-5">سنحاول استعادة الغرفة والصوت تلقائياً دون إخراجك منها.</p>}
   {(disconnected||recovering)&&<div className="flex justify-center gap-2 mt-3">
    <button type="button" disabled={retrying} onClick={()=>void tryAgain()} className="rounded-lg bg-cyan-600/80 px-3 py-2 text-xs font-bold disabled:opacity-50">{retrying?'جاري المحاولة…':'إعادة المحاولة'}</button>
    {activeRoom&&<button type="button" onClick={()=>void leaveRoom()} className="rounded-lg border border-white/20 px-3 py-2 text-xs">مغادرة الغرفة</button>}
   </div>}
  </div>
 </div>;
}

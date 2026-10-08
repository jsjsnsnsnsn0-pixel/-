import {useEffect,useRef,useState} from 'react';
import {AnimatePresence,motion} from 'motion/react';
import {X,ChevronLeft} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {supabase} from '../../services/supabase';
import {GiftAnnouncement,parseGiftAnnouncement,enqueueAnnouncement,ANNOUNCEMENT_MAX_AGE} from '../../services/giftAnnouncements';
import {sampleGifts} from '../../data/mockData';
import {getReducedMotion} from '../../services/displayPreferences';

export function GlobalGiftBanner(){
 const {isAuthenticated,user,authLoading,needsProfile,activeRoom,setActiveSubScreen,refreshRooms,joinRoom,reportError}=useApp();
 const [queue,setQueue]=useState<GiftAnnouncement[]>([]);
 const [busy,setBusy]=useState(false);
 const seen=useRef(new Map<string,number>());
 const generation=useRef(0);
 const current=queue[0];
 useEffect(()=>{
  const session=++generation.current;
  seen.current.clear();setQueue([]);setBusy(false);
  if(!isAuthenticated||authLoading||needsProfile)return;
  let disposed=false,pending=false;
  const receive=(raw:Record<string,unknown>)=>{
   if(disposed||document.visibilityState==='hidden')return;
   const item=parseGiftAnnouncement(raw);if(!item||seen.current.has(item.id))return;
   const now=Date.now();for(const [id,time]of seen.current)if(now-time>ANNOUNCEMENT_MAX_AGE)seen.current.delete(id);
   seen.current.set(item.id,now);setQueue(old=>enqueueAnnouncement(old,item));
  };
  const sync=async()=>{
   if(disposed||pending||document.visibilityState==='hidden')return;pending=true;
   try{
    const {data,error}=await supabase.from('global_gift_announcements').select('id,room_id,gift_id,gift_name,sender_name,recipient_name,created_at').gte('created_at',new Date(Date.now()-ANNOUNCEMENT_MAX_AGE).toISOString()).order('created_at',{ascending:false}).limit(3);
    if(!error&&data&&session===generation.current)for(const row of [...data].reverse())receive(row);
   }finally{pending=false}
  };
  const channel=supabase.channel(`global-gifts:${user.id}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'global_gift_announcements'},event=>receive(event.new)).subscribe(status=>{if(status==='SUBSCRIBED')void sync().catch(()=>{})});
  void sync().catch(()=>{});
  const timer=setInterval(()=>void sync().catch(()=>{}),8000);
  const resume=()=>{if(document.visibilityState!=='hidden'){setQueue(old=>old.filter(row=>parseGiftAnnouncement({...row})!==null));void sync().catch(()=>{})}};
  document.addEventListener('visibilitychange',resume);window.addEventListener('online',resume);
  return()=>{disposed=true;++generation.current;clearInterval(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('online',resume);void supabase.removeChannel(channel)};
 },[isAuthenticated,user.id,authLoading,needsProfile]);
 useEffect(()=>{
  if(!current)return;
  const remaining=Math.min(4200,ANNOUNCEMENT_MAX_AGE-(Date.now()-Date.parse(current.created_at)));
  const timer=setTimeout(()=>setQueue(old=>old.filter(row=>row.id!==current.id)),Math.max(0,remaining));
  return()=>clearTimeout(timer);
 },[current?.id,current?.created_at]);
 useEffect(()=>{
  const visible=Boolean(current)&&isAuthenticated&&!authLoading&&!needsProfile;
  document.documentElement.style.setProperty('--toti-gift-banner-space',visible?'calc(64px + env(safe-area-inset-top, 0px))':'0px');
  return()=>{document.documentElement.style.removeProperty('--toti-gift-banner-space')};
 },[Boolean(current),isAuthenticated,authLoading,needsProfile]);
 if(!isAuthenticated||authLoading||needsProfile)return null;
 const open=async(item:GiftAnnouncement)=>{
  if(busy)return;setBusy(true);const session=generation.current;
  try{
   if(activeRoom?.id===item.room_id){setActiveSubScreen(null);setQueue(old=>old.filter(row=>row.id!==item.id));return}
   const rooms=await refreshRooms();if(session!==generation.current)return;
   const target=rooms.find(room=>room.id===item.room_id&&room.isActive!==false);
   if(!target){reportError('الغرفة غير متاحة حالياً.');return}
   // join_room checks access and switches membership atomically; failed entry keeps the current room.
   await joinRoom(target);if(session===generation.current)setQueue(old=>old.filter(row=>row.id!==item.id));
  }catch{if(session===generation.current)reportError('تعذر فتح الغرفة. حاول مرة أخرى.')}finally{if(session===generation.current)setBusy(false)}
 };
 return <div className="global-gift-lane" style={{height:current?'calc(64px + env(safe-area-inset-top, 0px))':0}} aria-live="polite"><AnimatePresence>{current&&<motion.div key={current.id} dir="rtl" initial={{opacity:0,x:getReducedMotion()?0:70}} animate={{opacity:1,x:0}} exit={{opacity:0,x:getReducedMotion()?0:-70}} transition={{duration:getReducedMotion()?0:0.22}} className="fixed z-[40] left-3 right-3 mx-auto max-w-[400px] flex items-center rounded-2xl border border-amber-300/35 bg-gradient-to-l from-[#341546]/95 to-[#161324]/95 text-white shadow-lg backdrop-blur-md" style={{top:'calc(env(safe-area-inset-top, 0px) + 8px)'}}>
 <button type="button" disabled={busy} onClick={()=>void open(current)} aria-label={`${current.sender_name} أهدى ${current.gift_name} إلى ${current.recipient_name}، افتح الغرفة`} className="flex items-center gap-2 min-w-0 flex-1 text-right px-3 py-2 cursor-pointer disabled:opacity-60 focus-visible:outline-amber-300 rounded-2xl">
 <span aria-hidden="true" className="text-2xl shrink-0">{sampleGifts.find(gift=>gift.id===current.gift_id)?.icon||'🎁'}</span>
 <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-amber-200">{current.gift_name}</span><span className="block truncate text-[11px]">{current.sender_name} <span className="text-white/65">أهدى إلى</span> {current.recipient_name}</span></span><ChevronLeft size={16} className="shrink-0 text-amber-200"/>
 </button><button type="button" aria-label="إخفاء إشعار الهدية" onClick={()=>setQueue(old=>old.filter(row=>row.id!==current.id))} className="w-11 h-11 shrink-0 flex items-center justify-center cursor-pointer text-white/70 focus-visible:outline-amber-300 rounded-xl"><X size={15}/></button>
 </motion.div>}</AnimatePresence></div>;
}

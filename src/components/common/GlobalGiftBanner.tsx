import React from 'react';
import {Gift, X} from 'lucide-react';
import {motion, AnimatePresence} from 'motion/react';
import {supabase} from '../../services/supabase';
import {useApp} from '../../context/AppContext';

interface GlobalGiftAnnouncement {
  id: string;
  room_id: string;
  gift_id: string;
  gift_name: string;
  sender_name: string;
  recipient_name: string;
  created_at: string;
}

/**
 * App-wide announcement for gifts explicitly marked by the server as global.
 * Visibility/eligibility is enforced by RLS. Tapping the banner joins/returns
 * to the source room; the banner itself never fabricates room data.
 */
export const GlobalGiftBanner: React.FC = () => {
  const {isAuthenticated, rooms, activeRoom, refreshRooms, joinRoom, setActiveSubScreen, reportError} = useApp();
  const [announcement,setAnnouncement]=React.useState<GlobalGiftAnnouncement|null>(null);
  const [busy,setBusy]=React.useState(false);
  const hideTimer=React.useRef<ReturnType<typeof setTimeout>|null>(null);

  const show=React.useCallback((row:GlobalGiftAnnouncement|null)=>{
    if(!row)return;
    if(hideTimer.current)clearTimeout(hideTimer.current);
    setAnnouncement(row);
    hideTimer.current=setTimeout(()=>setAnnouncement(current=>current?.id===row.id?null:current),5200);
  },[]);

  React.useEffect(()=>{
    if(!isAuthenticated){setAnnouncement(null);return;}
    let disposed=false;
    void supabase.from('global_gift_announcements').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle()
      .then(({data,error})=>{if(!disposed&&!error&&data)show(data as GlobalGiftAnnouncement);});
    const channel=supabase.channel('global-gift-announcements-ui')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'global_gift_announcements'},event=>{
        if(!disposed)show(event.new as GlobalGiftAnnouncement);
      }).subscribe();
    return()=>{disposed=true;if(hideTimer.current)clearTimeout(hideTimer.current);hideTimer.current=null;void supabase.removeChannel(channel);};
  },[isAuthenticated,show]);

  const openRoom=async()=>{
    const current=announcement;
    if(!current||busy)return;
    setBusy(true);
    try{
      if(activeRoom?.id===current.room_id){setActiveSubScreen(null);setAnnouncement(null);return;}
      let target=rooms.find(room=>room.id===current.room_id);
      if(!target){
        const refreshed=await refreshRooms();
        target=refreshed.find(room=>room.id===current.room_id);
      }
      if(!target){reportError('الغرفة التي صدرت منها الهدية لم تعد متاحة.');setAnnouncement(null);return;}
      await joinRoom(target);
      setAnnouncement(null);
    } finally {setBusy(false);}
  };

  return <AnimatePresence>
    {announcement&&<motion.div
      initial={{x:'110%',opacity:0,scale:.98}}
      animate={{x:0,opacity:1,scale:1}}
      exit={{x:'-110%',opacity:0,scale:.98}}
      transition={{duration:.38,ease:'easeOut'}}
      dir="rtl"
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 z-[180] max-w-md mx-auto pointer-events-none"
      style={{top:'max(68px, calc(env(safe-area-inset-top) + 56px))'}}
    >
      <div className="pointer-events-auto rounded-[20px] border border-amber-300/35 bg-[linear-gradient(105deg,rgba(31,13,54,.94),rgba(65,20,76,.96),rgba(31,13,54,.94))] backdrop-blur-2xl shadow-[0_12px_34px_rgba(0,0,0,.34)] text-white flex items-center gap-2 p-2">
        <button type="button" disabled={busy} onClick={()=>void openRoom()} aria-label={`فتح غرفة هدية ${announcement.gift_name}`} className="min-w-0 flex-1 flex items-center gap-2.5 text-right rounded-xl p-1 disabled:opacity-60 active:scale-[0.99] transition-transform">
          <span className="w-10 h-10 shrink-0 rounded-[14px] bg-gradient-to-br from-amber-300/20 to-fuchsia-500/15 border border-amber-200/25 flex items-center justify-center text-amber-300 shadow-inner"><Gift size={19}/></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-black text-amber-300">هدية كبيرة · اضغط للدخول للغرفة</span>
            <span className="block text-xs mt-0.5 truncate"><b className="text-white">{announcement.sender_name}</b> أرسل <b className="text-pink-300">{announcement.gift_name}</b> إلى <b className="text-white">{announcement.recipient_name}</b></span>
          </span>
        </button>
        <button type="button" aria-label="إخفاء إعلان الهدية" onClick={()=>setAnnouncement(null)} className="w-9 h-9 shrink-0 rounded-full bg-white/[0.06] border border-white/[0.05] flex items-center justify-center text-slate-300"><X size={16}/></button>
      </div>
    </motion.div>}
  </AnimatePresence>;
};

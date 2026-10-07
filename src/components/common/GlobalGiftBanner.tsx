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
    hideTimer.current=setTimeout(()=>setAnnouncement(current=>current?.id===row.id?null:current),6500);
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
      initial={{y:-80,opacity:0,scale:.96}}
      animate={{y:0,opacity:1,scale:1}}
      exit={{y:-60,opacity:0,scale:.97}}
      transition={{duration:.28,ease:'easeOut'}}
      dir="rtl"
      className="fixed top-[max(10px,env(safe-area-inset-top))] inset-x-3 z-[180] max-w-md mx-auto"
    >
      <div className="rounded-2xl border border-amber-300/45 bg-gradient-to-r from-[#25113f]/95 via-[#39154d]/95 to-[#25113f]/95 backdrop-blur-xl shadow-2xl text-white flex items-center gap-2 p-2">
        <button type="button" disabled={busy} onClick={()=>void openRoom()} aria-label={`فتح غرفة هدية ${announcement.gift_name}`} className="min-w-0 flex-1 flex items-center gap-3 text-right rounded-xl p-1 disabled:opacity-60">
          <span className="w-10 h-10 shrink-0 rounded-full bg-amber-400/15 border border-amber-300/30 flex items-center justify-center text-amber-300"><Gift size={19}/></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-black text-amber-300">هدية مميزة · اضغط للدخول إلى الغرفة</span>
            <span className="block text-xs mt-0.5 truncate"><b>{announcement.sender_name}</b> أرسل <b className="text-pink-300">{announcement.gift_name}</b> إلى <b>{announcement.recipient_name}</b></span>
          </span>
        </button>
        <button type="button" aria-label="إخفاء إعلان الهدية" onClick={()=>setAnnouncement(null)} className="w-9 h-9 shrink-0 rounded-full bg-white/5 flex items-center justify-center text-slate-300"><X size={16}/></button>
      </div>
    </motion.div>}
  </AnimatePresence>;
};

import { useTimeouts } from '../../hooks/useTimeouts';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../services/supabase';
import { Room } from '../../types';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { X, Shield, MicOff, UserX, Lock, Unlock, Volume2, UserPlus, Ban, Check, Settings, Save, Power } from 'lucide-react';

interface RoomManagementModalProps { isOpen: boolean; onClose: () => void; room: Room; }

export const RoomManagementModal: React.FC<RoomManagementModalProps> = ({ isOpen, onClose, room }) => {
  const { lockSeat, unlockSeat, muteSeatUser, kickSeatUser, user, reportError } = useApp();
  const scheduleTimeout = useTimeouts(isOpen);
  const [activeTab, setActiveTab] = useState<'seats' | 'members' | 'settings'>('seats');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [roomName, setRoomName] = useState(room.title);
  const [welcomeMessage, setWelcomeMessage] = useState(room.description || '');
  const [chatEnabled, setChatEnabled] = useState(true);
  const [giftEffects, setGiftEffects] = useState(true);
  const [vehicleEffects, setVehicleEffects] = useState(true);
  const [entranceEffects, setEntranceEffects] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!isOpen) setSuccessToast(null); }, [isOpen]);
  useEffect(() => { setRoomName(room.title); setWelcomeMessage(room.description || ''); }, [room.id, room.title, room.description]);

  const showToast = (msg: string) => { setSuccessToast(msg); scheduleTimeout(() => setSuccessToast(null), 2000); };
  const ownerOnly = room.ownerAuthId === user.authId;

  const saveSettings = async () => {
    if (!ownerOnly || !roomName.trim() || busy) return;
    setBusy(true);
    const { error } = await supabase.rpc('update_room_settings', {
      p_room_id: room.id, p_name: roomName.trim(), p_welcome_message: welcomeMessage.trim(), p_image_url: null,
      p_chat_enabled: chatEnabled, p_gift_effects_enabled: giftEffects, p_vehicle_effects_enabled: vehicleEffects, p_entrance_effects_enabled: entranceEffects,
    });
    setBusy(false);
    if (error) reportError('تعذر حفظ إعدادات الغرفة.'); else showToast('تم حفظ إعدادات الغرفة');
  };

  const toggleRoom = async () => {
    if (!ownerOnly || busy) return;
    const closing = room.isActive !== false;
    if (closing && !window.confirm('هل أنت متأكد من إغلاق الروم؟')) return;
    setBusy(true);
    const { error } = await supabase.rpc(closing ? 'close_room' : 'reopen_room', { p_room_id: room.id });
    setBusy(false);
    if (error) reportError(closing ? 'تعذر إغلاق الغرفة.' : 'تعذر إعادة فتح الغرفة.'); else showToast(closing ? 'تم إغلاق الغرفة' : 'تم إعادة فتح الغرفة');
  };

  if (!isOpen || !room.canModerate) return null;
  const tabClass = (tab: typeof activeTab) => `flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === tab ? 'bg-purple-600 text-white' : 'bg-[#181a2e] text-slate-400 hover:text-slate-200'}`;

  return <AnimatePresence><div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="absolute inset-0 bg-black/75 backdrop-blur-xs" />
    <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring',damping:25,stiffness:280}} className="relative w-full max-w-md bg-[#111322] border-t border-purple-500/30 rounded-t-3xl p-4 shadow-2xl z-10 max-h-[85vh] flex flex-col" dir="rtl">
      <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mb-3" />
      <div className="flex items-center justify-between pb-3 border-b border-purple-500/10"><div className="flex items-center gap-2"><Shield className="text-purple-400" size={20}/><div><h3 className="font-bold text-slate-100 text-sm">إدارة الغرفة والمقاعد</h3><span className="text-[11px] text-slate-400">صلاحيات المالك والمشرفين</span></div></div><button onClick={onClose} className="p-1 rounded-full text-slate-400"><X size={20}/></button></div>
      {successToast && <div className="mt-2 text-xs bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 p-2 rounded-xl flex items-center gap-1.5 justify-center"><Check size={14}/><span>{successToast}</span></div>}
      <div className="flex items-center gap-2 mt-3 pb-2 border-b border-purple-500/10"><button onClick={()=>setActiveTab('seats')} className={tabClass('seats')}>المقاعد والمايكات</button><button onClick={()=>setActiveTab('members')} className={tabClass('members')}>الأعضاء والمشرفون</button>{ownerOnly && <button onClick={()=>setActiveTab('settings')} className={tabClass('settings')}>الإعدادات</button>}</div>
      <div className="py-3 overflow-y-auto max-h-[60vh] no-scrollbar space-y-2">
        {activeTab === 'seats' && <div className="space-y-2"><span className="text-xs text-slate-400 block mb-1">إدارة مقاعد التحدث ({room.seats.length} مقاعد):</span>{room.seats.map(seat => <div key={seat.seatIndex} className="flex items-center justify-between p-2.5 rounded-xl bg-[#16182c] border border-purple-500/15"><div className="flex items-center gap-2.5">{seat.user ? <UserAvatar user={seat.user} size="xs"/> : <div className="w-8 h-8 rounded-full bg-purple-950/50 border border-purple-500/20 flex items-center justify-center text-xs text-purple-400">{seat.seatIndex+1}</div>}<div><span className="text-xs font-semibold text-slate-200">المقعد {seat.seatIndex+1}</span><span className="text-[11px] text-slate-400 block">{seat.user ? seat.user.name : 'مقعد شاغر'}</span></div></div><div className="flex items-center gap-1">{seat.user && <><button onClick={async()=>{if(await muteSeatUser(seat.seatIndex)) showToast(seat.isMuted?'تم إلغاء الكتم':'تم كتم المستخدم')}} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300" disabled={seat.seatIndex===0}>{seat.isMuted?<Volume2 size={14}/>:<MicOff size={14}/>}</button><button onClick={async()=>{if(await kickSeatUser(seat.seatIndex)) showToast('تم إنزال المستخدم من المايك')}} className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300" disabled={seat.seatIndex===0}><UserX size={14}/></button></>}<button onClick={async()=>{if(seat.isLocked){if(await unlockSeat(seat.seatIndex))showToast('تم فتح المقعد')}else if(await lockSeat(seat.seatIndex))showToast('تم قفل المقعد')}} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300" disabled={seat.seatIndex===0||!ownerOnly}>{seat.isLocked?<Unlock size={14}/>:<Lock size={14}/>}</button></div></div>)}</div>}
        {activeTab === 'members' && <div className="space-y-3"><div className="flex items-center justify-between p-2.5 rounded-xl bg-[#16182c] border border-purple-500/15"><div className="flex items-center gap-2"><UserAvatar user={room.owner} size="xs"/><div><span className="text-xs font-bold text-amber-300">{room.owner.name}</span><span className="text-[10px] text-slate-400 block">صاحب الغرفة</span></div></div></div><div className="grid grid-cols-2 gap-2"><button onClick={async()=>{const id=window.prompt('أدخل معرف المستخدم');if(!id||!/^\d{1,18}$/.test(id))return;const {error}=await supabase.rpc('invite_room_user',{p_room_id:room.id,p_target_public_id:Number(id)});if(error)reportError('تعذر إرسال الدعوة.');else showToast('تم إرسال دعوة الغرفة')}} className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs"><UserPlus size={14}/>دعوة مستخدم</button><button onClick={()=>reportError('سيتم عرض قائمة الحظر بعد تحميل بياناتها من الخادم.')} className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-300 text-xs"><Ban size={14}/>قائمة الحظر</button></div></div>}
        {activeTab === 'settings' && ownerOnly && <div className="space-y-4"><div className="flex items-center gap-2 text-purple-300"><Settings size={16}/><span className="text-sm font-bold">إعدادات الغرفة</span></div><label className="block text-xs text-slate-300">اسم الغرفة<input value={roomName} maxLength={60} onChange={e=>setRoomName(e.target.value)} className="mt-1 w-full bg-[#181a2e] border border-slate-700 rounded-xl p-2.5 text-white outline-none"/></label><label className="block text-xs text-slate-300">رسالة الترحيب<textarea value={welcomeMessage} maxLength={300} onChange={e=>setWelcomeMessage(e.target.value)} rows={3} className="mt-1 w-full bg-[#181a2e] border border-slate-700 rounded-xl p-2.5 text-white outline-none resize-none"/></label>{[['الدردشة العامة',chatEnabled,setChatEnabled],['تأثير الهدية',giftEffects,setGiftEffects],['تأثير المركبة عند الدخول',vehicleEffects,setVehicleEffects],['تأثيرات الدخول',entranceEffects,setEntranceEffects]].map(([label,value,setter])=><button type="button" key={String(label)} onClick={()=> (setter as React.Dispatch<React.SetStateAction<boolean>>)(!(value as boolean))} className="w-full flex items-center justify-between p-3 rounded-xl bg-[#181a2e] border border-slate-700 text-xs text-slate-200"><span>{String(label)}</span><span className={`px-2 py-1 rounded-full ${(value as boolean)?'bg-emerald-500/20 text-emerald-300':'bg-slate-700 text-slate-400'}`}>{(value as boolean)?'مفعّل':'متوقف'}</span></button>)}<button onClick={saveSettings} disabled={busy||!roomName.trim()} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 text-white font-bold disabled:opacity-50"><Save size={16}/>{busy?'جارٍ الحفظ...':'حفظ الإعدادات'}</button><button onClick={toggleRoom} disabled={busy} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300 font-bold"><Power size={16}/>{room.isActive===false?'إعادة فتح الروم':'إغلاق الروم'}</button></div>}
      </div>
    </motion.div>
  </div></AnimatePresence>;
};

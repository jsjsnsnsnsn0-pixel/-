import { useTimeouts } from '../../hooks/useTimeouts';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../services/supabase';
import { Room } from '../../types';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { X, Shield, MicOff, UserX, Lock, Unlock, Volume2, UserPlus, Ban, Check, Settings, Save, Power, ShieldCheck, ShieldOff, RotateCcw } from 'lucide-react';

interface RoomManagementModalProps { isOpen: boolean; onClose: () => void; room: Room; }
type MemberRow={public_id:number;display_name:string;avatar_url:string|null;role:string;is_muted:boolean;seat_number:number|null};
type BanRow={public_id:number;display_name:string;avatar_url:string|null;reason:string|null;created_at:string};

export const RoomManagementModal: React.FC<RoomManagementModalProps> = ({ isOpen, onClose, room }) => {
  const { lockSeat, unlockSeat, muteSeatUser, kickSeatUser, user, reportError, refreshRooms, setActiveTab: navigateTab } = useApp();
  const scheduleTimeout = useTimeouts(isOpen);
  const [activeTab,setActiveTab]=useState<'seats'|'members'|'bans'|'settings'>('seats');
  const [successToast,setSuccessToast]=useState<string|null>(null);
  const [roomName,setRoomName]=useState(room.title); const [welcomeMessage,setWelcomeMessage]=useState(room.welcomeMessage ?? room.description);
  const [chatEnabled,setChatEnabled]=useState(room.chatEnabled ?? true); const [giftEffects,setGiftEffects]=useState(room.giftEffectsEnabled ?? true); const [vehicleEffects,setVehicleEffects]=useState(room.vehicleEffectsEnabled ?? true); const [entranceEffects,setEntranceEffects]=useState(room.entranceEffectsEnabled ?? true);
  const [members,setMembers]=useState<MemberRow[]>([]); const [bans,setBans]=useState<BanRow[]>([]); const [loadingList,setLoadingList]=useState(false); const [busy,setBusy]=useState(false);
  const ownerOnly=Boolean(user.authId && room.ownerAuthId===user.authId);
  const showToast=(msg:string)=>{setSuccessToast(msg);scheduleTimeout(()=>setSuccessToast(null),2000)};

  const loadMembers=useCallback(async()=>{setLoadingList(true);const {data,error}=await supabase.rpc('get_room_management_members',{p_room_id:room.id});setLoadingList(false);if(error)reportError('تعذر تحميل أعضاء الغرفة.');else setMembers((data||[]) as MemberRow[])},[room.id,reportError]);
  const loadBans=useCallback(async()=>{setLoadingList(true);const {data,error}=await supabase.rpc('get_room_bans',{p_room_id:room.id});setLoadingList(false);if(error)reportError('تعذر تحميل قائمة الحظر.');else setBans((data||[]) as BanRow[])},[room.id,reportError]);
  useEffect(()=>{if(!isOpen)setSuccessToast(null)},[isOpen]);
  useEffect(()=>{if(!isOpen)return;setRoomName(room.title);setWelcomeMessage(room.description||'');setChatEnabled(room.chatEnabled!==false);setGiftEffects(room.giftEffectsEnabled!==false);setVehicleEffects(room.vehicleEffectsEnabled!==false);setEntranceEffects(room.entranceEffectsEnabled!==false)},[isOpen,room.id]);
  useEffect(()=>{if(!isOpen)return;if(activeTab==='members')void loadMembers();if(activeTab==='bans')void loadBans()},[isOpen,activeTab,loadMembers,loadBans]);

  const setModerator=async(publicId:number,enabled:boolean)=>{if(!ownerOnly||busy)return;setBusy(true);const {error}=await supabase.rpc('set_room_moderator',{p_room_id:room.id,p_target_public_id:publicId,p_enabled:enabled});setBusy(false);if(error)reportError('تعذر تعديل صلاحية المشرف.');else{showToast(enabled?'تم تعيين المشرف':'تمت إزالة الإشراف');await loadMembers()}};
  const unban=async(publicId:number)=>{if(busy)return;setBusy(true);const {error}=await supabase.rpc('unban_room_user',{p_room_id:room.id,p_public_id:publicId});setBusy(false);if(error)reportError('تعذر إزالة الحظر.');else{showToast('تمت إزالة الحظر');await loadBans()}};
  const saveSettings=async()=>{
    if(!ownerOnly||!roomName.trim()||busy)return;
    setBusy(true);
    try {
      const {error}=await supabase.rpc('update_room_settings',{p_room_id:room.id,p_name:roomName.trim(),p_welcome_message:welcomeMessage.trim(),p_image_url:null,p_chat_enabled:chatEnabled,p_gift_effects_enabled:giftEffects,p_vehicle_effects_enabled:vehicleEffects,p_entrance_effects_enabled:entranceEffects});
      if(error)throw error;
      try { await refreshRooms(); }
      catch { reportError('تم الحفظ، لكن تعذر تحديث بيانات الغرفة. أعد فتحها للتحقق.'); return; }
      showToast('تم حفظ إعدادات الغرفة');
    } catch { reportError('تعذر حفظ إعدادات الغرفة.'); }
    finally { setBusy(false); }
  };
  const toggleRoom=async()=>{
    if(!ownerOnly||busy)return;
    const closing=room.isActive!==false;
    if(closing&&!window.confirm('هل أنت متأكد من إغلاق الروم؟'))return;
    setBusy(true);
    try {
      const {error}=await supabase.rpc(closing?'close_room':'reopen_room',{p_room_id:room.id});
      if(error)throw error;
      await refreshRooms();
      if (closing) navigateTab('rooms');
      onClose();
    } catch { reportError(closing?'تعذر إغلاق الغرفة أو تحديث حالتها.':'تعذر إعادة فتح الغرفة أو تحديث حالتها.'); }
    finally { setBusy(false); }
  };
  if(!isOpen||!room.canModerate)return null;
  const tabClass=(tab:typeof activeTab)=>`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${activeTab===tab?'bg-purple-600 text-white':'bg-[#181a2e] text-slate-400'}`;

  return <AnimatePresence><div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto"><motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="absolute inset-0 bg-black/75 backdrop-blur-xs"/><motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring',damping:25,stiffness:280}} className="relative w-full max-w-md bg-[#111322] border-t border-purple-500/30 rounded-t-3xl p-4 shadow-2xl z-10 max-h-[85vh] flex flex-col" dir="rtl">
    <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mb-3"/><div className="flex items-center justify-between pb-3 border-b border-purple-500/10"><div className="flex items-center gap-2"><Shield className="text-purple-400" size={20}/><div><h3 className="font-bold text-slate-100 text-sm">إدارة الغرفة</h3><span className="text-[11px] text-slate-400">المالك والمشرفون</span></div></div><button onClick={onClose} className="p-1 text-slate-400"><X size={20}/></button></div>
    {successToast&&<div className="mt-2 text-xs bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 p-2 rounded-xl flex items-center gap-1.5 justify-center"><Check size={14}/>{successToast}</div>}
    <div className="grid grid-cols-4 gap-1.5 mt-3 pb-2 border-b border-purple-500/10"><button onClick={()=>setActiveTab('seats')} className={tabClass('seats')}>المايكات</button><button onClick={()=>setActiveTab('members')} className={tabClass('members')}>الأعضاء</button><button onClick={()=>setActiveTab('bans')} className={tabClass('bans')}>الحظر</button>{ownerOnly?<button onClick={()=>setActiveTab('settings')} className={tabClass('settings')}>الإعدادات</button>:<span/>}</div>
    <div className="py-3 overflow-y-auto max-h-[62vh] no-scrollbar space-y-2">
      {activeTab==='seats'&&<div className="space-y-2"><span className="text-xs text-slate-400">إدارة مقاعد التحدث ({room.seats.length})</span>{room.seats.map(seat=><div key={seat.seatIndex} className="flex items-center justify-between p-2.5 rounded-xl bg-[#16182c] border border-purple-500/15"><div className="flex items-center gap-2.5">{seat.user?<UserAvatar user={seat.user} size="xs"/>:<div className="w-8 h-8 rounded-full bg-purple-950/50 flex items-center justify-center text-xs text-purple-400">{seat.seatIndex+1}</div>}<div><span className="text-xs font-semibold text-slate-200">المقعد {seat.seatIndex+1}</span><span className="text-[11px] text-slate-400 block">{seat.user?seat.user.name:'مقعد شاغر'}</span></div></div><div className="flex gap-1">{seat.user&&<><button onClick={async()=>{if(await muteSeatUser(seat.seatIndex))showToast(seat.isMuted?'تم إلغاء الكتم':'تم الكتم')}} className="p-1.5 rounded-lg bg-slate-800 text-slate-300" disabled={seat.seatIndex===0}>{seat.isMuted?<Volume2 size={14}/>:<MicOff size={14}/>}</button><button onClick={async()=>{if(await kickSeatUser(seat.seatIndex))showToast('تم إنزال المستخدم')}} className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300" disabled={seat.seatIndex===0}><UserX size={14}/></button></>}<button onClick={async()=>{if(seat.isLocked){if(await unlockSeat(seat.seatIndex))showToast('تم فتح المقعد')}else if(await lockSeat(seat.seatIndex))showToast('تم قفل المقعد')}} className="p-1.5 rounded-lg bg-slate-800 text-slate-300" disabled={seat.seatIndex===0||!ownerOnly}>{seat.isLocked?<Unlock size={14}/>:<Lock size={14}/>}</button></div></div>)}</div>}
      {activeTab==='members'&&<div className="space-y-2">{loadingList?<p className="text-center text-xs text-slate-400 py-5">جارٍ تحميل الأعضاء…</p>:members.map(m=><div key={m.public_id} className="flex items-center justify-between p-3 rounded-xl bg-[#16182c] border border-purple-500/15"><div className="min-w-0"><span className="text-xs font-bold text-white truncate block">{m.display_name}</span><span className="text-[10px] text-slate-400">ID: {m.public_id} • {m.role==='owner'?'مالك':m.role==='moderator'?'مشرف':'عضو'}{m.is_muted?' • مكتوم':''}</span></div>{ownerOnly&&m.role!=='owner'&&<button disabled={busy} onClick={()=>void setModerator(m.public_id,m.role!=='moderator')} className={`p-2 rounded-lg text-xs flex items-center gap-1 ${m.role==='moderator'?'bg-rose-500/15 text-rose-300':'bg-purple-500/15 text-purple-300'}`}>{m.role==='moderator'?<ShieldOff size={14}/>:<ShieldCheck size={14}/>} {m.role==='moderator'?'إزالة':'مشرف'}</button>}</div>)}<button onClick={async()=>{const id=window.prompt('أدخل معرف المستخدم');if(!id||!/^\d{1,18}$/.test(id))return;const {error}=await supabase.rpc('invite_room_user',{p_room_id:room.id,p_target_public_id:Number(id)});if(error)reportError('تعذر إرسال الدعوة.');else showToast('تم إرسال الدعوة')}} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-600/20 text-purple-300 text-xs"><UserPlus size={14}/>دعوة مستخدم</button></div>}
      {activeTab==='bans'&&<div className="space-y-2">{loadingList?<p className="text-center text-xs text-slate-400 py-5">جارٍ تحميل قائمة الحظر…</p>:bans.length===0?<div className="text-center py-8 text-slate-500"><Ban className="mx-auto mb-2"/><p className="text-xs">لا يوجد مستخدمون محظورون</p></div>:bans.map(b=><div key={b.public_id} className="flex items-center justify-between p-3 rounded-xl bg-[#16182c] border border-rose-500/15"><div><span className="text-xs font-bold text-white block">{b.display_name}</span><span className="text-[10px] text-slate-400">ID: {b.public_id}{b.reason?` • ${b.reason}`:''}</span></div><button disabled={busy} onClick={()=>void unban(b.public_id)} className="p-2 rounded-lg bg-emerald-500/15 text-emerald-300 text-xs flex items-center gap-1"><RotateCcw size={14}/>إلغاء الحظر</button></div>)}</div>}
      {activeTab==='settings'&&ownerOnly&&<div className="space-y-4"><div className="flex items-center gap-2 text-purple-300"><Settings size={16}/><span className="text-sm font-bold">إعدادات الغرفة</span></div><label className="block text-xs text-slate-300">اسم الغرفة<input value={roomName} maxLength={60} onChange={e=>setRoomName(e.target.value)} className="mt-1 w-full bg-[#181a2e] border border-slate-700 rounded-xl p-2.5 text-white"/></label><label className="block text-xs text-slate-300">رسالة الترحيب<textarea value={welcomeMessage} maxLength={300} onChange={e=>setWelcomeMessage(e.target.value)} rows={3} className="mt-1 w-full bg-[#181a2e] border border-slate-700 rounded-xl p-2.5 text-white resize-none"/></label>{[['الدردشة العامة',chatEnabled,setChatEnabled],['تأثير الهدية',giftEffects,setGiftEffects],['تأثير المركبة',vehicleEffects,setVehicleEffects],['تأثيرات الدخول',entranceEffects,setEntranceEffects]].map(([label,value,setter])=><button type="button" key={String(label)} disabled={busy} aria-pressed={value as boolean} onClick={()=>(setter as React.Dispatch<React.SetStateAction<boolean>>)(!(value as boolean))} className="w-full flex justify-between p-3 rounded-xl bg-[#181a2e] text-xs text-slate-200"><span>{String(label)}</span><span className={(value as boolean)?'text-emerald-300':'text-slate-500'}>{(value as boolean)?'مفعّل':'متوقف'}</span></button>)}<button onClick={saveSettings} disabled={busy||!roomName.trim()} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 text-white font-bold disabled:opacity-50"><Save size={16}/>{busy?'جارٍ الحفظ…':'حفظ الإعدادات'}</button><button onClick={toggleRoom} disabled={busy} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300 font-bold"><Power size={16}/>{room.isActive===false?'إعادة فتح الروم':'إغلاق الروم'}</button></div>}
    </div>
  </motion.div></div></AnimatePresence>;
};

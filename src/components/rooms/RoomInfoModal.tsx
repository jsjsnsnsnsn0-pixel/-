import {useApp} from '../../context/AppContext';
import {supabase} from '../../services/supabase';
import {Heart} from 'lucide-react';
import {useDismissableLayer} from '../../hooks/useDismissableLayer';
import React from 'react';
import {Room, User} from '../../types';
import {UserAvatar} from '../common/UserAvatar';
import {X, Users} from 'lucide-react';

interface Props {
  room: Room;
  membersOnly?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSelectMember: (member: User) => void;
}

export function RoomInfoModal({room,isOpen,onClose,onSelectMember,membersOnly=false}: Props) {

  const {refreshRooms,reportError}=useApp();const [busy,setBusy]=React.useState(false);
  const layerRef=useDismissableLayer(isOpen,onClose);
  if (!isOpen) return null;
  return <div ref={layerRef} className="fixed inset-0 z-[100] bg-black/70 flex items-end justify-center" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-label="معلومات الغرفة والموجودون" dir="rtl" onClick={event=>event.stopPropagation()} className="ui-sheet w-full max-w-md bg-[#100725] rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto text-white">
      <header className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-bold text-lg">{membersOnly?"الموجودون في الغرفة":"معلومات الغرفة"}</h2>
        <button type="button" aria-label="إغلاق معلومات الغرفة" onClick={onClose} className="ui-icon-button rounded-full bg-white/10"><X size={20}/></button>
      </header>
      {!membersOnly&&<><img src={room.coverImage} alt="" className="w-20 h-20 rounded-2xl object-cover mb-3"/>      <div className="flex items-center justify-between gap-3"><h3 className="font-bold break-words">{room.title}</h3><button type="button" aria-label={room.isFollowed?'إلغاء متابعة الغرفة':'متابعة الغرفة'} aria-pressed={Boolean(room.isFollowed)} disabled={busy} className="ui-icon-button text-pink-400" onClick={async()=>{if(busy)return;setBusy(true);try{const {error}=await supabase.rpc('follow_room',{p_room_id:room.id,p_followed:!room.isFollowed});if(error)throw error;await refreshRooms()}catch{reportError('تعذر تحديث متابعة الغرفة.')}finally{setBusy(false)}}}><Heart fill={room.isFollowed?'currentColor':'none'}/></button></div>
      <p className="ui-id text-xs text-slate-400 mt-1">ID: {room.id}</p>
      <p className="text-sm text-slate-300 break-words mt-3">{room.welcomeMessage ?? room.description}</p>
      <p className="text-xs text-slate-400 mt-2">{room.category} • {room.isPrivate?'غرفة خاصة':'غرفة عامة'}{room.isVIP?' • VIP':''}</p>
</>}
      <h3 className="flex items-center gap-2 text-sm font-bold mt-5 mb-3"><Users size={16}/>الموجودون ({room.members?.length ?? 0})</h3>
      {!room.members?.length && <p className="text-sm text-slate-400 py-3">لا يوجد أعضاء لعرضهم حالياً.</p>}<div className="space-y-2">{(room.members || []).map((member,index)=><button type="button" key={member.authId || member.id || index} onClick={()=>{onClose();onSelectMember(member);}} className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 text-right" aria-label={`عرض ملف ${member.name}`}>
        <UserAvatar user={member} size="xs"/>
        <span className="min-w-0 flex-1"><span className="font-semibold text-sm block truncate">{member.name}</span><span className="text-xs text-slate-400 block">{member.id?`ID: ${member.id}`:'معرف المستخدم غير متاح'}</span></span>
        {room.seats.some(seat=>seat.user?.authId===member.authId)&&<span className="text-xs text-purple-300">{room.seats.find(seat=>seat.user?.authId===member.authId)?.isMuted?'مكتوم':'على المايك'}</span>}
        {member.roomRole==='moderator'&&<span className="text-xs text-cyan-300">مشرف</span>}
        {member.vipLevel>0&&<span className="text-xs text-amber-300">VIP{member.vipLevel}</span>}
        {member.hasPublicLevel!==false&&<span className="text-xs text-slate-300">LV.{member.level}</span>}
        {member.authId===room.ownerAuthId&&<span className="text-xs text-amber-300">المالك</span>}
      </button>)}</div>
    </section>
  </div>;
}

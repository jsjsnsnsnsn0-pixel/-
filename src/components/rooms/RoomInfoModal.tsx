import React from 'react';
import {Room, User} from '../../types';
import {UserAvatar} from '../common/UserAvatar';
import {X, Users} from 'lucide-react';

interface Props {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
  onSelectMember: (member: User) => void;
}

export function RoomInfoModal({room,isOpen,onClose,onSelectMember}: Props) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[100] bg-black/70 flex items-end justify-center" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-label="معلومات الغرفة والموجودون" dir="rtl" onClick={event=>event.stopPropagation()} className="w-full max-w-md bg-[#111322] rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto text-white">
      <header className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-bold text-lg">معلومات الغرفة</h2>
        <button type="button" aria-label="إغلاق معلومات الغرفة" onClick={onClose} className="p-2 rounded-full bg-white/10"><X size={20}/></button>
      </header>
      <h3 className="font-bold break-words">{room.title}</h3>
      <p className="text-xs text-slate-400 break-all mt-1">ID: {room.id}</p>
      <p className="text-sm text-slate-300 break-words mt-3">{room.welcomeMessage ?? room.description}</p>
      <p className="text-xs text-slate-400 mt-2">{room.category} • {room.isPrivate?'غرفة خاصة':'غرفة عامة'}{room.isVIP?' • VIP':''}</p>
      <h3 className="flex items-center gap-2 text-sm font-bold mt-5 mb-3"><Users size={16}/>الموجودون ({room.members?.length ?? 0})</h3>
      <div className="space-y-2">{(room.members || []).map((member,index)=><button type="button" key={member.authId || member.id || index} onClick={()=>{onClose();onSelectMember(member);}} className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 text-right" aria-label={`عرض ملف ${member.name}`}>
        <UserAvatar user={member} size="xs"/>
        <span className="min-w-0 flex-1"><span className="font-semibold text-sm block truncate">{member.name}</span><span className="text-xs text-slate-400 block">{member.id?`ID: ${member.id}`:'معرف المستخدم غير متاح'}</span></span>
        {member.authId===room.ownerAuthId&&<span className="text-xs text-amber-300">المالك</span>}
      </button>)}</div>
    </section>
  </div>;
}

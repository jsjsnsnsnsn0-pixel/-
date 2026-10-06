import React from 'react';
import {useApp} from '../../context/AppContext';
import {RoomCard} from './RoomCard';
export function RoyalRooms() {
  const {rooms,ownedClosedRooms,user,joinRoom,reopenRoom}=useApp();
  const [busy,setBusy]=React.useState(false);
  const own=rooms.filter(room=>room.ownerAuthId===user.authId);
  const followed=rooms.filter(room=>room.isFollowed&&room.ownerAuthId!==user.authId);
  const visited=rooms.filter(room=>room.lastVisitedAt&&!room.isFollowed&&room.ownerAuthId!==user.authId).sort((a,b)=>(b.lastVisitedAt||'').localeCompare(a.lastVisitedAt||''));
  return <section className="px-4 py-5 text-slate-800 space-y-6" dir="rtl" aria-label="غرف ملكي">
    {([['غرفتي',own],['الغرف التي أتابعها',followed],['الغرف التي انضممت إليها',visited]] as const).map(([title,list])=><section key={title}><h2 className="font-bold mb-3">{title}</h2>{list.length?<div className="grid grid-cols-2 gap-3">{list.map(room=><RoomCard key={room.id} room={room} onJoin={joinRoom}/>)}</div>:<p className="text-sm text-slate-500">لا توجد غرف هنا بعد.</p>}{title==='غرفتي'&&ownedClosedRooms.map(room=><div key={room.id} className="flex justify-between items-center gap-3 mt-3 p-3 rounded-2xl bg-white"><span>{room.title} · مغلقة</span><button type="button" disabled={busy} className="text-sm text-emerald-700" onClick={async()=>{setBusy(true);try{await reopenRoom(room)}finally{setBusy(false)}}}>إعادة فتح</button></div>)}</section>)}
  </section>;
}

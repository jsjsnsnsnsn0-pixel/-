import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MicrophoneSeat } from '../rooms/MicrophoneSeat';
import { RoomUserProfileModal } from '../rooms/RoomUserProfileModal';
import { GiftStoreModal } from '../rooms/GiftStoreModal';
import { RoomManagementModal } from '../rooms/RoomManagementModal';
import { GiftOverlayAnimation } from '../common/GiftOverlayAnimation';
import { User } from '../../types';
import { supabase } from '../../services/supabase';
import { useRoomAudioContext } from '../../context/RoomAudioContext';
import { Mic, MicOff, Volume2, VolumeX, ChevronRight, Settings, Gift, Hand, Send } from 'lucide-react';

export const VoiceRoomScreen: React.FC = () => {
  const {activeRoom, user, leaveRoom, takeSeat, leaveSeat, isMyMicMuted, toggleMyMic,
    toggleRaiseHand, isHandRaised, isSpeakerOn, toggleSpeaker, activeGiftOverlay,
    setActiveSubScreen, setSelectedChatUser, reportError} = useApp();
  const [giftOpen, setGiftOpen] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [micBusy, setMicBusy] = useState(false);
  const {connected, enableMicrophone, speakingIds} = useRoomAudioContext();

  useEffect(() => {
    if (!activeRoom) return;
    const roomId = activeRoom.id;
    setMessages([]); setSelectedUser(null);
    let disposed = false;
    const load = async () => {
      const {data, error} = await supabase.from('room_messages').select('*').eq('room_id', roomId)
        .order('created_at', {ascending: false}).limit(100);
      if (disposed) return;
      if (error) reportError('تعذر تحميل دردشة الغرفة.');
      else setMessages(prev => [...new Map([...(data || []).reverse(), ...prev].map(m => [m.id, m])).values()].sort((a,b) => new Date(a.created_at).getTime()-new Date(b.created_at).getTime()).slice(-100));
    };
    void load().catch(() => { if (!disposed) reportError('تعذر تحميل دردشة الغرفة.'); });
    const channel = supabase.channel(`chat:${roomId}`).on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}`,
    }, event => { if (disposed) return; setMessages(prev => prev.some(m => m.id === event.new.id) ? prev : [...prev.slice(-99), event.new]); }).subscribe();
    return () => { disposed = true; void supabase.removeChannel(channel); };
  }, [activeRoom?.id]);

  if (!activeRoom) return null;
  const mySeat = activeRoom.seats.find(s => s.user?.authId === user.authId);
  const handleMic = async () => {
    if (micBusy) return;
    if (!mySeat) { reportError('اختر مقعداً أولاً لتشغيل المايكروفون.'); return; }
    setMicBusy(true);
    try { if (isMyMicMuted) await enableMicrophone(); await toggleMyMic(); }
    catch { reportError('تعذر تشغيل المايكروفون. اسمح بالوصول إليه من إعدادات المتصفح.'); }
    finally { setMicBusy(false); }
  };
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); if (!text.trim() || sending) return;
    setSending(true);
    try {
      const {error} = await supabase.from('room_messages').insert({room_id: activeRoom.id, content: text.trim()});
      if (error) throw error;
      setText('');
    } catch { reportError('تعذر إرسال الرسالة. حاول مجدداً.'); }
    finally { setSending(false); }
  };
  const clickSeat = (index: number) => {
    const seat = activeRoom.seats[index];
    if (!seat) return;
    if (seat.user) setSelectedUser(seat.user);
    else if (!seat.isLocked) void takeSeat(index);
    else reportError('هذا المقعد مقفل.');
  };

  return <div dir="rtl" className="min-h-[100dvh] bg-[#011b17] text-white relative flex flex-col pb-24 overflow-x-hidden">
    <div className="absolute inset-0 pointer-events-none"><img src={activeRoom.coverImage} alt="" className="w-full h-full object-cover opacity-45" /><div className="absolute inset-0 bg-gradient-to-b from-[#021b1bd9] via-[#031b1c8c] to-[#01150fe8]" /></div>
    <header className="relative mx-2 mt-3 p-3 flex gap-3 items-center rounded-[20px] border border-[#b3995b] bg-gradient-to-l from-[#073d32d9] via-[#042922de] to-[#01221dee] shadow-[0_4px_16px_#0008]">
      <button onClick={leaveRoom} aria-label="مغادرة الغرفة" className="p-2 rounded-full border border-[#d7b770] bg-[#05352acc] text-[#ffe5a8]"><ChevronRight /></button>
      <div className="flex-1 min-w-0"><h1 className="font-black text-[#ffdfa5] truncate">{activeRoom.title}</h1><p className="text-[11px] text-[#cce4d5]">{activeRoom.usersCount} أعضاء · {connected ? 'متصل' : 'جارٍ الاتصال…'}</p><p className="text-[10px] text-[#91cfb7] truncate">Room ID: {activeRoom.id}</p></div>
      {activeRoom.canModerate && <button onClick={() => setManagementOpen(true)} aria-label="إدارة الغرفة" className="p-2 rounded-full bg-white/10"><Settings /></button>}
    </header>
    <div className="relative px-3 pt-5 pb-3"><p className="text-xs text-[#d2e5d6] mb-4 text-center">{activeRoom.description}</p>
      <div className="grid grid-cols-5 gap-x-1 gap-y-5 rounded-[22px] border border-[#7aab8857] bg-[#001a17a3] shadow-[inset_0_0_22px_#00826031] px-1 py-5">{activeRoom.seats.map(seat => <MicrophoneSeat key={seat.seatIndex} seat={{...seat,isSpeaking:Boolean(seat.user?.authId && speakingIds.includes(seat.user.authId)) && !seat.isMuted}} onSeatClick={clickSeat} isCurrentUserSeat={seat.user?.authId === user.authId} />)}</div>
      <p className="text-[10px] text-[#9ac6b0] text-center mt-3">اضغط مقعداً فارغاً للجلوس، واضغط صورة مستخدم لعرض ملفه.</p>
    </div>
    <div className="relative mx-3 mt-3 flex-1 rounded-[20px] border border-[#af945a82] bg-[#011e19cc] p-3 shadow-[inset_0_0_13px_#24a08022]">
      <h2 className="text-sm font-bold text-[#f4d68f] mb-3">✦ دردشة الغرفة</h2>
      <div className="max-h-64 overflow-y-auto space-y-2" aria-live="polite">{messages.length ? messages.map(m => <p key={m.id} className="text-sm break-words"><span className="text-[#7cf3c1] font-bold">{m.sender_display_name || 'مستخدم'}: </span>{m.content}</p>) : <p className="text-slate-400 text-xs">ابدأ الحديث برسالة.</p>}</div>
      <form onSubmit={send} className="mt-3 flex gap-2 border-t border-[#d6b56d40] pt-3"><input value={text} onChange={e => setText(e.target.value)} maxLength={1000} placeholder="اكتب رسالة…" aria-label="رسالة الغرفة" className="min-w-0 flex-1 bg-[#0f443b] border border-[#80ac926e] focus:border-[#f4d78c] outline-none rounded-xl p-2.5 text-sm text-[#fff1d3] placeholder:text-[#a9cbb9]" /><button disabled={sending || !text.trim()} aria-label="إرسال" className="p-2 text-[#f4d588] bg-[#0b4235] border border-[#b99659] rounded-xl disabled:opacity-40"><Send size={20}/></button></form>
    </div>
    <footer className="fixed bottom-0 inset-x-0 max-w-md mx-auto z-20 bg-gradient-to-r from-[#001c18f5] via-[#07372cf5] to-[#01251efa] border-t border-[#b49a62] flex justify-around items-center gap-1 p-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-5px_18px_#0008]">
      <button onClick={handleMic} disabled={micBusy} aria-label={isMyMicMuted ? 'تشغيل المايكروفون' : 'كتم المايكروفون'} className="p-3 rounded-full border border-[#b59458] bg-[#0a4538] text-[#f7dca7]">{isMyMicMuted ? <MicOff className="text-rose-400"/> : <Mic className="text-teal-300"/>}</button>
      {mySeat && <button onClick={() => void leaveSeat(mySeat.seatIndex)} aria-label="مغادرة المقعد" className="text-xs text-slate-300">مغادرة المقعد</button>}
      <button onClick={toggleSpeaker} aria-label="تبديل الصوت" className="p-3 rounded-full bg-white/10">{isSpeakerOn ? <Volume2/> : <VolumeX/>}</button>
      <button onClick={() => setGiftOpen(true)} aria-label="إرسال هدية" className="p-3 rounded-full border border-[#ffe3a3] bg-gradient-to-br from-[#edc16a] to-[#9b6b2f] text-[#261b10] shadow-[0_0_8px_#e5c27976]"><Gift/></button>
      <button onClick={toggleRaiseHand} aria-label="طلب المايكروفون" className={`p-3 rounded-full border border-[#d4b575] text-[#fce2a7] ${isHandRaised ? 'bg-[#a77827]' : 'bg-[#0a4538]'}`}><Hand/></button>
      <button onClick={() => setActiveSubScreen('recharge')} className="text-xs font-black text-[#ffdf9a] border border-[#b9965c] rounded-xl px-2 py-3 bg-[#094135]">شحن</button>
    </footer>
    {activeGiftOverlay && <GiftOverlayAnimation overlayData={activeGiftOverlay}/>}
    <RoomUserProfileModal isOpen={Boolean(selectedUser)} targetUser={selectedUser} onClose={() => setSelectedUser(null)} onOpenMore={() => { if (!selectedUser) return; setSelectedChatUser(selectedUser); setSelectedUser(null); setActiveSubScreen('user_detail_profile'); }}/>
    <GiftStoreModal isOpen={giftOpen} onClose={() => setGiftOpen(false)} room={activeRoom} onRechargeClick={() => {setGiftOpen(false); setActiveSubScreen('recharge');}}/>
    <RoomManagementModal isOpen={managementOpen} onClose={() => setManagementOpen(false)} room={activeRoom}/>
  </div>;
};

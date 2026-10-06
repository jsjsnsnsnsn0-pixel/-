import React, { useEffect, useRef, useState } from 'react';
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
  const reloadMessages = useRef<() => Promise<void>>(async () => {});
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
    reloadMessages.current = load;
    void load().catch(() => { if (!disposed) reportError('تعذر تحميل دردشة الغرفة.'); });
    const channel = supabase.channel(`chat:${roomId}`).on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}`,
    }, event => { if (disposed) return; setMessages(prev => prev.some(m => m.id === event.new.id) ? prev : [...prev.slice(-99), event.new]); }).subscribe(status => {
      if (status === 'SUBSCRIBED') void load().catch(() => { if (!disposed) reportError('تعذر تحميل دردشة الغرفة.'); });
    });
    const timer = setInterval(() => { void load().catch(() => { if (!disposed) reportError('تعذر تحميل دردشة الغرفة.'); }); }, 15000);
    return () => { disposed = true; clearInterval(timer); reloadMessages.current = async () => {}; void supabase.removeChannel(channel); };
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
      await reloadMessages.current();
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

  return <div dir="rtl" className="min-h-screen bg-[#080914] text-white relative flex flex-col pb-24">
    <div className="absolute inset-0 pointer-events-none"><img src={activeRoom.coverImage} alt="" className="w-full h-full object-cover opacity-25" /></div>
    <header className="relative p-4 flex gap-3 items-center border-b border-white/10">
      <button onClick={leaveRoom} aria-label="مغادرة الغرفة" className="p-2 rounded-full bg-white/10"><ChevronRight /></button>
      <div className="flex-1"><h1 className="font-bold">{activeRoom.title}</h1><p className="text-xs text-slate-300">{activeRoom.usersCount} أعضاء · {connected ? 'متصل' : 'جارٍ الاتصال…'}</p></div>
      {activeRoom.canModerate && <button onClick={() => setManagementOpen(true)} aria-label="إدارة الغرفة" className="p-2 rounded-full bg-white/10"><Settings /></button>}
    </header>
    <div className="relative p-4"><p className="text-sm text-slate-300 mb-5">{activeRoom.description}</p>
      <div className="grid grid-cols-4 gap-x-2 gap-y-5">{activeRoom.seats.map(seat => <MicrophoneSeat key={seat.seatIndex} seat={{...seat,isSpeaking:Boolean(seat.user?.authId && speakingIds.includes(seat.user.authId)) && !seat.isMuted}} onSeatClick={clickSeat} isCurrentUserSeat={seat.user?.authId === user.authId} />)}</div>
      <p className="text-xs text-slate-400 mt-4">اضغط مقعداً فارغاً للجلوس، واضغط صورة مستخدم لعرض ملفه.</p>
    </div>
    <div className="relative mx-4 mt-4 flex-1 rounded-2xl bg-black/40 p-3">
      <h2 className="text-sm font-bold text-amber-300 mb-3">دردشة الغرفة</h2>
      <div className="max-h-64 overflow-y-auto space-y-2" aria-live="polite">{messages.length ? messages.map(m => <p key={m.id} className="text-sm break-words"><span className="text-teal-300">{m.sender_display_name || 'مستخدم'}: </span>{m.content}</p>) : <p className="text-slate-400 text-xs">ابدأ الحديث برسالة.</p>}</div>
      <form onSubmit={send} className="mt-3 flex gap-2"><input value={text} onChange={e => setText(e.target.value)} maxLength={1000} placeholder="اكتب رسالة…" aria-label="رسالة الغرفة" className="min-w-0 flex-1 bg-white/10 rounded-xl p-2 text-sm" /><button disabled={sending || !text.trim()} aria-label="إرسال" className="p-2 text-teal-300 disabled:opacity-40"><Send size={20}/></button></form>
    </div>
    <footer className="fixed bottom-0 inset-x-0 max-w-md mx-auto z-20 bg-[#080914]/95 border-t border-white/10 flex justify-around items-center p-4">
      <button onClick={handleMic} disabled={micBusy} aria-label={isMyMicMuted ? 'تشغيل المايكروفون' : 'كتم المايكروفون'} className="p-3 rounded-full bg-white/10">{isMyMicMuted ? <MicOff className="text-rose-400"/> : <Mic className="text-teal-300"/>}</button>
      {mySeat && <button onClick={() => void leaveSeat(mySeat.seatIndex)} aria-label="مغادرة المقعد" className="text-xs text-slate-300">مغادرة المقعد</button>}
      <button onClick={toggleSpeaker} aria-label="تبديل الصوت" className="p-3 rounded-full bg-white/10">{isSpeakerOn ? <Volume2/> : <VolumeX/>}</button>
      <button onClick={() => setGiftOpen(true)} aria-label="إرسال هدية" className="p-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500"><Gift/></button>
      <button onClick={toggleRaiseHand} aria-label="طلب المايكروفون" className={`p-3 rounded-full ${isHandRaised ? 'bg-amber-500' : 'bg-white/10'}`}><Hand/></button>
      <button onClick={() => setActiveSubScreen('recharge')} className="text-xs text-amber-300">شحن</button>
    </footer>
    {activeGiftOverlay && <GiftOverlayAnimation overlayData={activeGiftOverlay}/>}
    <RoomUserProfileModal isOpen={Boolean(selectedUser)} targetUser={selectedUser} onClose={() => setSelectedUser(null)} onOpenMore={() => { if (!selectedUser) return; setSelectedChatUser(selectedUser); setSelectedUser(null); setActiveSubScreen('user_detail_profile'); }}/>
    <GiftStoreModal isOpen={giftOpen} onClose={() => setGiftOpen(false)} room={activeRoom} onRechargeClick={() => {setGiftOpen(false); setActiveSubScreen('recharge');}}/>
    <RoomManagementModal isOpen={managementOpen} onClose={() => setManagementOpen(false)} room={activeRoom}/>
  </div>;
};

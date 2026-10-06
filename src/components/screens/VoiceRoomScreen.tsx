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
import { Mic, MicOff, Volume2, VolumeX, ChevronRight, Settings, Gift, Hand, Send, Minimize2, LogOut, X } from 'lucide-react';

export const VoiceRoomScreen: React.FC = () => {
  const {activeRoom, user, leaveRoom, takeSeat, leaveSeat, isMyMicMuted, toggleMyMic,
    toggleRaiseHand, isHandRaised, isSpeakerOn, toggleSpeaker, activeGiftOverlay,
    setActiveSubScreen, setSelectedChatUser, reportError} = useApp();
  const [giftOpen, setGiftOpen] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
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
    try {
      if (isMyMicMuted) await enableMicrophone();
      await toggleMyMic();
    } catch (error) {
      const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') reportError('تم رفض إذن المايكروفون. اسمح لتوتي شات باستخدام المايكروفون من إعدادات الهاتف ثم حاول مجدداً.');
      else if (name === 'NotFoundError') reportError('لم يتم العثور على مايكروفون متاح على هذا الجهاز.');
      else if (name === 'NotReadableError' || name === 'AbortError') reportError('المايكروفون مستخدم من تطبيق آخر أو غير متاح حالياً. أغلق التطبيق الآخر ثم حاول مجدداً.');
      else if (name === 'NotSupportedError') reportError('تشغيل المايكروفون غير مدعوم في هذه البيئة.');
      else reportError('تعذر تشغيل المايكروفون. تحقق من الإذن والاتصال ثم حاول مجدداً.');
    } finally { setMicBusy(false); }
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

  const minimizeRoom = () => {
    setExitOpen(false);
    // Keep activeRoom and the audio provider alive. A dedicated persistent mini-room
    // surface will be added at the app-shell level; until then Messages provides a
    // safe browse surface without calling leaveRoom.
    setActiveSubScreen('messages');
  };

  const confirmLeaveRoom = async () => {
    setExitOpen(false);
    await leaveRoom();
  };

  return <div dir="rtl" className="min-h-screen bg-[#080914] text-white relative flex flex-col pb-24">
    <div className="absolute inset-0 pointer-events-none"><img src={activeRoom.coverImage} alt="" className="w-full h-full object-cover opacity-25" /></div>
    <header className="relative p-4 flex gap-3 items-center border-b border-white/10">
      <button onClick={() => setExitOpen(true)} aria-label="خيارات الغرفة" className="p-2 rounded-full bg-white/10"><ChevronRight /></button>
      <button type="button" onClick={() => setManagementOpen(true)} className="flex-1 text-right min-w-0" aria-label="معلومات الغرفة">
        <h1 className="font-bold truncate">{activeRoom.title}</h1>
        <p className="text-xs text-slate-300">{activeRoom.usersCount} أعضاء · {connected ? 'متصل' : 'جارٍ الاتصال…'}</p>
      </button>
      {activeRoom.canModerate && <button onClick={() => setManagementOpen(true)} aria-label="إدارة الغرفة" className="p-2 rounded-full bg-white/10"><Settings /></button>}
    </header>

    <div className="relative p-4"><p className="text-sm text-slate-300 mb-5">{activeRoom.description}</p>
      <div className="grid grid-cols-4 gap-x-2 gap-y-5">{activeRoom.seats.map(seat => <MicrophoneSeat key={seat.seatIndex} seat={{...seat,isSpeaking:Boolean(seat.user?.authId && speakingIds.includes(seat.user.authId)) && !seat.isMuted}} onSeatClick={clickSeat} isCurrentUserSeat={seat.user?.authId === user.authId} />)}</div>
      <p className="text-xs text-slate-400 mt-4">اضغط مقعداً فارغاً للجلوس أو الانتقال إليه، واضغط صورة مستخدم لعرض ملفه.</p>
    </div>

    <div className="relative mx-4 mt-auto border-t border-white/10 pt-3 pb-2">
      <div className="max-h-48 overflow-y-auto space-y-2 px-1" aria-live="polite">{messages.length ? messages.map(m => <p key={m.id} className="text-sm break-words drop-shadow"><span className="text-teal-300 font-semibold">{m.sender_display_name || 'مستخدم'}: </span>{m.content}</p>) : <p className="text-slate-400 text-xs">ابدأ الحديث برسالة.</p>}</div>
      <form onSubmit={send} className="mt-3 flex gap-2 items-center bg-black/35 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10"><input value={text} onChange={e => setText(e.target.value)} maxLength={1000} placeholder="اكتب رسالة…" aria-label="رسالة الغرفة" className="min-w-0 flex-1 bg-transparent outline-none p-2 text-sm" /><button disabled={sending || !text.trim()} aria-label="إرسال" className="p-2 text-teal-300 disabled:opacity-40"><Send size={20}/></button></form>
    </div>

    <footer className="fixed bottom-0 inset-x-0 max-w-md mx-auto z-20 bg-[#080914]/95 border-t border-white/10 flex justify-around items-center p-4">
      <button onClick={handleMic} disabled={micBusy} aria-label={isMyMicMuted ? 'تشغيل المايكروفون' : 'كتم المايكروفون'} className="p-3 rounded-full bg-white/10 disabled:opacity-50">{isMyMicMuted ? <MicOff className="text-rose-400"/> : <Mic className="text-teal-300"/>}</button>
      {mySeat && <button onClick={() => void leaveSeat(mySeat.seatIndex)} aria-label="مغادرة المقعد" className="text-xs text-slate-300">مغادرة المقعد</button>}
      <button onClick={toggleSpeaker} aria-label="تبديل الصوت" className="p-3 rounded-full bg-white/10">{isSpeakerOn ? <Volume2/> : <VolumeX/>}</button>
      <button onClick={() => setGiftOpen(true)} aria-label="إرسال هدية" className="p-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500"><Gift/></button>
      <button onClick={toggleRaiseHand} aria-label="طلب المايكروفون" className={`p-3 rounded-full ${isHandRaised ? 'bg-amber-500' : 'bg-white/10'}`}><Hand/></button>
      <button onClick={() => setActiveSubScreen('recharge')} className="text-xs text-amber-300">شحن</button>
    </footer>

    {exitOpen && <div className="fixed inset-0 z-[120] bg-black/65 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="خيارات مغادرة الغرفة" onClick={() => setExitOpen(false)}>
      <div className="w-full max-w-md rounded-t-3xl bg-[#11131f] border-t border-white/10 p-5 pb-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5"><h2 className="font-bold text-lg">خيارات الغرفة</h2><button onClick={() => setExitOpen(false)} aria-label="إغلاق" className="p-2 rounded-full bg-white/10"><X size={20}/></button></div>
        <p className="text-sm text-slate-300 mb-5">اختر تصغير الغرفة للبقاء متصلاً، أو الخروج لإنهاء وجودك في الغرفة.</p>
        <div className="grid gap-3">
          <button onClick={minimizeRoom} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-slate-950 font-bold p-4"><Minimize2 size={20}/>تصغير الغرفة</button>
          <button onClick={() => void confirmLeaveRoom()} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-600 font-bold p-4"><LogOut size={20}/>الخروج من الغرفة</button>
        </div>
      </div>
    </div>}

    {activeGiftOverlay && <GiftOverlayAnimation overlayData={activeGiftOverlay}/>}
    <RoomUserProfileModal isOpen={Boolean(selectedUser)} targetUser={selectedUser} onClose={() => setSelectedUser(null)} onOpenMore={() => { if (!selectedUser) return; setSelectedChatUser(selectedUser); setSelectedUser(null); setActiveSubScreen('user_detail_profile'); }}/>
    <GiftStoreModal isOpen={giftOpen} onClose={() => setGiftOpen(false)} room={activeRoom} onRechargeClick={() => {setGiftOpen(false); setActiveSubScreen('recharge');}}/>
    <RoomManagementModal isOpen={managementOpen} onClose={() => setManagementOpen(false)} room={activeRoom}/>
  </div>;
};

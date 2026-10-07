import React, { useEffect, useState } from 'react';
import {AnimatePresence, motion} from 'motion/react';
import { useApp } from '../../context/AppContext';
import { MicrophoneSeat } from '../rooms/MicrophoneSeat';
import { RoomUserProfileModal } from '../rooms/RoomUserProfileModal';
import { GiftStoreModal } from '../rooms/GiftStoreModal';
import {RoomInfoModal} from '../rooms/RoomInfoModal';
import { RoomManagementModal } from '../rooms/RoomManagementModal';
import { GiftOverlayAnimation } from '../common/GiftOverlayAnimation';
import { User } from '../../types';
import { supabase } from '../../services/supabase';
import { useRoomAudioContext } from '../../context/RoomAudioContext';
import {RoomExitOverlay} from '../rooms/ui/RoomExitOverlay';
import {SeatActions} from '../rooms/ui/SeatActions';
import {RoomStage, RoomChatMessage} from '../rooms/ui/RoomStage';

type RoomLuckyBonus = {
  gift_event_id:string; sender_name:string; recipient_name:string; gift_name:string;
  multiplier:number; lucky_points:number; quantity:number;
};
export const VoiceRoomScreen: React.FC = () => {
  const {activeRoom,user,leaveRoom,takeSeat,leaveSeat,isMyMicMuted,toggleMyMic,toggleRaiseHand,isHandRaised,isSpeakerOn,toggleSpeaker,activeGiftOverlay,setActiveSubScreen,setSelectedChatUser,reportError,lockSeat,unlockSeat}=useApp();
  const [infoOpen,setInfoOpen]=useState(false); const [membersOnly,setMembersOnly]=useState(false);
  const [luckyBonus,setLuckyBonus]=useState<RoomLuckyBonus|null>(null);
  const [giftRecipient,setGiftRecipient]=useState<User|null>(null);
  const [giftOpen,setGiftOpen]=useState(false); const [managementOpen,setManagementOpen]=useState(false); const [exitOpen,setExitOpen]=useState(false); const [selectedUser,setSelectedUser]=useState<User|null>(null);
  const [messages,setMessages]=useState<RoomChatMessage[]>([]); const [giftTotals,setGiftTotals]=useState<Record<string,number>>({}); const [text,setText]=useState(''); const [sending,setSending]=useState(false); const [micBusy,setMicBusy]=useState(false);
  const [micUiMuted,setMicUiMuted]=useState(isMyMicMuted);
  useEffect(()=>{
    if(!activeRoom?.id)return;
    let disposed=false;
    const channel=supabase.channel('room-lucky:'+activeRoom.id)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'lucky_bonus_results',filter:`room_id=eq.${activeRoom.id}`},event=>{
        if(disposed)return;
        const row=event.new as Partial<RoomLuckyBonus>;
        if(typeof row.gift_event_id==='string'&&Number(row.lucky_points)>0){
          setLuckyBonus({
            gift_event_id:row.gift_event_id,
            sender_name:String(row.sender_name||'مستخدم'),
            recipient_name:String(row.recipient_name||'مستخدم'),
            gift_name:String(row.gift_name||'هدية حظ'),
            multiplier:Number(row.multiplier)||1,
            lucky_points:Number(row.lucky_points)||0,
            quantity:Number(row.quantity)||1,
          });
        }
      }).subscribe();
    return()=>{disposed=true;void supabase.removeChannel(channel);};
  },[activeRoom?.id]);
  useEffect(()=>{
    if(!luckyBonus)return;
    const timer=window.setTimeout(()=>setLuckyBonus(null),4500);
    return()=>window.clearTimeout(timer);
  },[luckyBonus?.gift_event_id]);
  const [emptySeat,setEmptySeat]=useState<number|null>(null); const [seatBusy,setSeatBusy]=useState(false);
  useEffect(()=>{const open=()=>setExitOpen(true);window.addEventListener("toti:room-options",open);return()=>window.removeEventListener("toti:room-options",open);},[]);
  useEffect(()=>{
    if(!activeRoom||typeof window==='undefined'||!window.sessionStorage)return;
    const userId=window.sessionStorage.getItem('totichat.pendingGiftRecipient');
    if(!userId)return;
    window.sessionStorage.removeItem('totichat.pendingGiftRecipient');
    const recipient=activeRoom.members?.find(member=>member.id===userId)||activeRoom.seats.find(seat=>seat.user?.id===userId)?.user;
    if(recipient){setGiftRecipient(recipient);setGiftOpen(true);}
  },[activeRoom?.id]);
  const {connected,enableMicrophone,speakingIds,startMusic,stopMusic,pauseMusic,resumeMusic,musicName,musicPaused}=useRoomAudioContext();
  useEffect(()=>{if(!micBusy)setMicUiMuted(isMyMicMuted)},[isMyMicMuted,micBusy,activeRoom?.id]);
  useEffect(()=>{
    if(!activeRoom)return;
    const roomId=activeRoom.id;
    setMessages([]);setGiftTotals({});setSelectedUser(null);
    let disposed=false;let loading=false;let pendingMessages:RoomChatMessage[]=[];let pendingGifts:any[]=[];
    const normalizeGift=(row:any):RoomChatMessage=>{
      const quantity=Math.max(1,Number(row.quantity)||1);
      return {id:`gift:${row.id}`,sender_display_name:row.sender_name||'مستخدم',content:`أرسل ${row.gift_name||'هدية'}${quantity>1?` ×${quantity}`:''} إلى ${row.recipient_name||'مستخدم'}`,kind:'gift',deletable:false,created_at:row.created_at};
    };
    const load=async()=>{
      if(loading)return;loading=true;pendingMessages=[];pendingGifts=[];
      const [chat,gifts]=await Promise.all([
        supabase.from('room_messages').select('*').eq('room_id',roomId).order('created_at',{ascending:false}).limit(100),
        supabase.from('room_gift_feed').select('*').eq('room_id',roomId).order('created_at',{ascending:false}).limit(1000)
      ]);
      loading=false;if(disposed)return;
      if(chat.error||gifts.error){reportError('تعذر تحميل دردشة الغرفة.');return;}
      const textMessages:RoomChatMessage[]=[...(chat.data||[]).map((row:any)=>({...row,kind:'text',deletable:true})),...pendingMessages];
      const giftRows=[...new Map([...(gifts.data||[]),...pendingGifts].map((row:any)=>[String(row.id),row])).values()];
      const giftMessages:RoomChatMessage[]=giftRows.slice(0,100).map(normalizeGift);
      const combined=[...textMessages,...giftMessages].sort((a,b)=>String(a.created_at||'').localeCompare(String(b.created_at||'')));
      setMessages([...new Map(combined.map(message=>[message.id,message])).values()].slice(-100));
      const totals:Record<string,number>={};
      for(const row of giftRows){const recipient=String((row as any).recipient_public_id);totals[recipient]=(totals[recipient]||0)+Math.max(1,Number((row as any).quantity)||1);}
      setGiftTotals(totals);
    };
    void load();
    const channel=supabase.channel(`chat:${roomId}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'room_messages',filter:`room_id=eq.${roomId}`},event=>{
        if(disposed)return;
        const next:RoomChatMessage={...(event.new as any),kind:'text',deletable:true};
        if(loading)pendingMessages.push(next);
        setMessages(prev=>prev.some(m=>m.id===next.id)?prev:[...prev.slice(-99),next]);
      })
      .on('postgres_changes',{event:'DELETE',schema:'public',table:'room_messages'},event=>{
        if(!disposed)setMessages(previous=>previous.filter(message=>message.id!==event.old.id));
      })
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'room_gift_feed',filter:`room_id=eq.${roomId}`},event=>{
        if(disposed)return;
        const row=event.new as any;const next=normalizeGift(row);const quantity=Math.max(1,Number(row.quantity)||1);const recipient=String(row.recipient_public_id);
        if(loading)pendingGifts.push(row);
        setMessages(prev=>prev.some(m=>m.id===next.id)?prev:[...prev.slice(-99),next]);
        setGiftTotals(prev=>({...prev,[recipient]:(prev[recipient]||0)+quantity}));
      }).subscribe();
    const timer=setInterval(()=>{void load()},15000);
    return()=>{disposed=true;clearInterval(timer);void supabase.removeChannel(channel)};
  },[activeRoom?.id]);
  if(!activeRoom)return null;
  const mySeat=activeRoom.seats.find(s=>s.user?.authId===user.authId);
  const handleMic=async()=>{if(micBusy)return;if(!mySeat){reportError('اختر مقعداً أولاً لتشغيل المايكروفون.');return}const targetMuted=!isMyMicMuted;setMicUiMuted(targetMuted);setMicBusy(true);try{if(isMyMicMuted)await enableMicrophone();await toggleMyMic()}catch(error){setMicUiMuted(isMyMicMuted);const name=error&&typeof error==='object'&&'name'in error?String(error.name):'';if(name==='NotAllowedError'||name==='SecurityError')reportError('تم رفض إذن المايكروفون. اسمح لتوتي شات باستخدام المايكروفون من إعدادات الهاتف ثم حاول مجدداً.');else reportError('تعذر تشغيل المايكروفون. تحقق من الإذن والاتصال ثم حاول مجدداً.')}finally{setMicBusy(false)}};
  const send=async(e:React.FormEvent)=>{e.preventDefault();if(!text.trim()||sending||activeRoom.chatEnabled===false)return;setSending(true);try{const {error}=await supabase.from('room_messages').insert({room_id:activeRoom.id,content:text.trim()});if(error)throw error;setText('')}catch{reportError('تعذر إرسال الرسالة. حاول مجدداً.')}finally{setSending(false)}};
  const clickSeat=(index:number)=>{const seat=activeRoom.seats[index];if(!seat)return;if(seat.user)setSelectedUser(seat.user);else setEmptySeat(index)};
  const minimizeRoom=()=>{setExitOpen(false);setActiveSubScreen('home')}; const confirmLeaveRoom=async()=>{setExitOpen(false);await leaveRoom()};
  const openInfo=()=>{setMembersOnly(false);setInfoOpen(true)};
  const openMembers=()=>{setMembersOnly(true);setInfoOpen(true)};
  return <>
    <AnimatePresence>
      {luckyBonus&&<motion.div key={luckyBonus.gift_event_id}
        initial={{opacity:0,scale:.82,y:-35}} animate={{opacity:1,scale:1,y:0}}
        exit={{opacity:0,scale:.9,y:-28}} transition={{duration:.3}}
        role="status" aria-live="polite" data-testid="lucky-cosmetic-announcement"
        className="fixed top-[max(75px,calc(env(safe-area-inset-top)+62px))] inset-x-3 z-[160] pointer-events-none flex justify-center">
        <div className="w-full max-w-sm rounded-2xl border border-amber-300/40 bg-gradient-to-l from-[#2a124d]/95 via-[#5a2787]/95 to-[#211431]/95 p-3 backdrop-blur-xl shadow-[0_12px_40px_rgba(92,41,137,.5)] text-center text-white">
          <div className="font-black text-amber-200 text-lg">✨ ×{luckyBonus.multiplier} Lucky Bonus ✨</div>
          <div className="mt-1 text-xs leading-5"><strong>{luckyBonus.recipient_name}</strong> حصل على <strong className="text-amber-200">{luckyBonus.lucky_points.toLocaleString('ar-IQ')} نقطة حظ</strong> من {luckyBonus.gift_name}</div>
          <div className="mt-1 text-[10px] text-white/65">نقاط تجميلية فقط — غير قابلة للتحويل إلى Coins أو Diamonds</div>
        </div>
      </motion.div>}
    </AnimatePresence>
    <RoomStage title={activeRoom.title} cover={activeRoom.internalBackground||'/assets/images/room_screen_bg_1790556227206.jpg'} thumbnail={activeRoom.coverImage} count={activeRoom.usersCount}
      welcome={(activeRoom.welcomeMessage ?? activeRoom.description)||'أهلاً وسهلاً بكم ❤️'}
      seats={activeRoom.seats.map(seat=><MicrophoneSeat key={seat.seatIndex} seat={{...seat,isSpeaking:Boolean(seat.user?.authId&&speakingIds.includes(seat.user.authId))&&!seat.isMuted}} onSeatClick={clickSeat} isCurrentUserSeat={seat.user?.authId===user.authId} isOwner={Boolean(seat.user?.authId&&seat.user.authId===activeRoom.ownerAuthId)} giftCount={seat.user?giftTotals[seat.user.id]||0:0}/>)}
      onDeleteMessage={activeRoom.canModerate?(id)=>{if(window.confirm('حذف هذه الرسالة؟'))void supabase.rpc('clear_room_chat',{p_room_id:activeRoom.id,p_message_id:id}).then(({error})=>{if(error)reportError('تعذر حذف الرسالة.');else setMessages(previous=>previous.filter(message=>message.id!==id))})}:undefined}
      messages={messages} chatEnabled={activeRoom.chatEnabled!==false} text={text} sending={sending}
      muted={micUiMuted} micBusy={micBusy} seated={Boolean(mySeat)} speaker={isSpeakerOn} handRaised={isHandRaised} canModerate={Boolean(activeRoom.canModerate)} audioConnected={connected}
      musicName={musicName} musicPaused={musicPaused} onMusic={file=>{void startMusic(file).catch(error=>reportError(error instanceof Error?error.message:'تعذر تشغيل الموسيقى.'))}} onStopMusic={stopMusic} onPauseMusic={pauseMusic} onResumeMusic={()=>{void resumeMusic().catch(error=>reportError(error instanceof Error?error.message:'تعذر استئناف الموسيقى.'))}}
      onText={setText} onSend={send} onInfo={openInfo} onUsers={openMembers} onExit={()=>setExitOpen(true)} onGift={()=>{setGiftRecipient(null);setGiftOpen(true)}}
      onMic={()=>void handleMic()} onSpeaker={toggleSpeaker} onHand={()=>void toggleRaiseHand()} onLeaveSeat={()=>{if(mySeat)void leaveSeat(mySeat.seatIndex)}}
      onManage={()=>setManagementOpen(true)} onMessages={()=>setActiveSubScreen('messages')}/>
    <RoomExitOverlay open={exitOpen} onClose={()=>setExitOpen(false)} onLeave={()=>void confirmLeaveRoom()} onMinimize={minimizeRoom}/>
    <SeatActions index={emptySeat} locked={emptySeat!==null&&Boolean(activeRoom.seats[emptySeat]?.isLocked)} canLock={user.authId===activeRoom.ownerAuthId&&emptySeat!==0} busy={seatBusy} onClose={()=>setEmptySeat(null)}
      onTake={async()=>{if(emptySeat===null||seatBusy)return;setSeatBusy(true);try{await takeSeat(emptySeat);setEmptySeat(null)}finally{setSeatBusy(false)}}}
      onLock={async()=>{if(emptySeat===null||seatBusy)return;setSeatBusy(true);try{const action=activeRoom.seats[emptySeat]?.isLocked?unlockSeat:lockSeat;if(await action(emptySeat))setEmptySeat(null)}finally{setSeatBusy(false)}}}/>
    {activeRoom.giftEffectsEnabled!==false&&activeGiftOverlay&&<GiftOverlayAnimation overlayData={activeGiftOverlay}/>}<RoomUserProfileModal isOpen={Boolean(selectedUser)} targetUser={selectedUser} onClose={()=>setSelectedUser(null)} onGift={()=>{if(!selectedUser)return;setGiftRecipient(selectedUser);setSelectedUser(null);setGiftOpen(true)}} onManage={()=>{setSelectedUser(null);setManagementOpen(true)}} selfMicMuted={micUiMuted} onToggleSelfMic={()=>void handleMic()} onLeaveSelfSeat={()=>{if(mySeat)void leaveSeat(mySeat.seatIndex)}} onMention={()=>{if(!selectedUser)return;setText(previous=>`${previous}${previous?' ':''}@${selectedUser.name} `);setSelectedUser(null)}} onMessage={()=>{if(!selectedUser)return;setSelectedChatUser(selectedUser);setSelectedUser(null);setActiveSubScreen('chat_detail')}} onOpenMore={()=>{if(!selectedUser)return;setSelectedChatUser(selectedUser);setSelectedUser(null);setActiveSubScreen('user_detail_profile')}}/><GiftStoreModal initialRecipient={giftRecipient} isOpen={giftOpen} onClose={()=>setGiftOpen(false)} room={activeRoom} onRechargeClick={()=>{setGiftOpen(false);setActiveSubScreen('recharge')}}/><RoomInfoModal isOpen={infoOpen} onClose={()=>setInfoOpen(false)} room={activeRoom} membersOnly={membersOnly} onSelectMember={setSelectedUser}/><RoomManagementModal isOpen={managementOpen} onClose={()=>setManagementOpen(false)} room={activeRoom}/>
  </>;
};

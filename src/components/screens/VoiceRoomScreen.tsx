import React, { useEffect, useState } from 'react';
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

export const VoiceRoomScreen: React.FC = () => {
  const {activeRoom,user,leaveRoom,takeSeat,leaveSeat,isMyMicMuted,toggleMyMic,toggleRaiseHand,isHandRaised,isSpeakerOn,toggleSpeaker,activeGiftOverlay,setActiveSubScreen,setSelectedChatUser,reportError,lockSeat,unlockSeat}=useApp();
  const [infoOpen,setInfoOpen]=useState(false); const [membersOnly,setMembersOnly]=useState(false);
  const [giftRecipient,setGiftRecipient]=useState<User|null>(null);
  const [giftOpen,setGiftOpen]=useState(false); const [managementOpen,setManagementOpen]=useState(false); const [exitOpen,setExitOpen]=useState(false); const [selectedUser,setSelectedUser]=useState<User|null>(null);
  const [messages,setMessages]=useState<RoomChatMessage[]>([]); const [giftTotals,setGiftTotals]=useState<Record<string,number>>({}); const [text,setText]=useState(''); const [sending,setSending]=useState(false); const [micBusy,setMicBusy]=useState(false);
  const [emptySeat,setEmptySeat]=useState<number|null>(null); const [seatBusy,setSeatBusy]=useState(false);
  useEffect(()=>{const open=()=>setExitOpen(true);window.addEventListener("toti:room-options",open);return()=>window.removeEventListener("toti:room-options",open);},[]);
  const {connected,enableMicrophone,speakingIds,startMusic,stopMusic,musicName}=useRoomAudioContext();
  useEffect(()=>{
    if(!activeRoom)return;
    const roomId=activeRoom.id;
    setMessages([]);setGiftTotals({});setSelectedUser(null);
    let disposed=false;let loading=false;
    const normalizeGift=(row:any):RoomChatMessage=>{
      const quantity=Math.max(1,Number(row.quantity)||1);
      return {id:`gift:${row.id}`,sender_display_name:row.sender_name||'مستخدم',content:`أرسل ${row.gift_name||'هدية'}${quantity>1?` ×${quantity}`:''} إلى ${row.recipient_name||'مستخدم'}`,kind:'gift',deletable:false,created_at:row.created_at};
    };
    const load=async()=>{
      if(loading)return;loading=true;
      const [chat,gifts,totals]=await Promise.all([
        supabase.from('room_messages').select('*').eq('room_id',roomId).order('created_at',{ascending:false}).limit(100),
        supabase.from('room_gift_feed').select('*').eq('room_id',roomId).order('created_at',{ascending:false}).limit(50),
        supabase.rpc('room_gift_totals',{p_room_id:roomId})
      ]);
      loading=false;if(disposed)return;
      if(chat.error||gifts.error){reportError('تعذر تحميل دردشة الغرفة.');return;}
      const textMessages:RoomChatMessage[]=(chat.data||[]).map((row:any)=>({...row,kind:'text',deletable:true}));
      const giftMessages:RoomChatMessage[]=(gifts.data||[]).map(normalizeGift);
      const combined=[...textMessages,...giftMessages].sort((a,b)=>String(a.created_at||'').localeCompare(String(b.created_at||'')));
      setMessages([...new Map(combined.map(message=>[message.id,message])).values()].slice(-100));
      if(!totals.error)setGiftTotals(Object.fromEntries((totals.data||[]).map((row:any)=>[String(row.recipient_public_id),Number(row.quantity)||0])));
    };
    void load();
    const channel=supabase.channel(`chat:${roomId}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'room_messages',filter:`room_id=eq.${roomId}`},event=>{
        if(disposed)return;
        const next:RoomChatMessage={...(event.new as any),kind:'text',deletable:true};
        setMessages(prev=>prev.some(m=>m.id===next.id)?prev:[...prev.slice(-99),next]);
      })
      .on('postgres_changes',{event:'DELETE',schema:'public',table:'room_messages'},event=>{
        if(!disposed)setMessages(previous=>previous.filter(message=>message.id!==event.old.id));
      })
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'room_gift_feed',filter:`room_id=eq.${roomId}`},event=>{
        if(disposed)return;
        const row=event.new as any;const next=normalizeGift(row);const quantity=Math.max(1,Number(row.quantity)||1);const recipient=String(row.recipient_public_id);
        setMessages(prev=>prev.some(m=>m.id===next.id)?prev:[...prev.slice(-99),next]);
        setGiftTotals(prev=>({...prev,[recipient]:(prev[recipient]||0)+quantity}));
      }).subscribe();
    const timer=setInterval(()=>{void load()},15000);
    return()=>{disposed=true;clearInterval(timer);void supabase.removeChannel(channel)};
  },[activeRoom?.id]);
  if(!activeRoom)return null;
  const mySeat=activeRoom.seats.find(s=>s.user?.authId===user.authId);
  const handleMic=async()=>{if(micBusy)return;if(!mySeat){reportError('اختر مقعداً أولاً لتشغيل المايكروفون.');return}setMicBusy(true);try{if(isMyMicMuted)await enableMicrophone();await toggleMyMic()}catch(error){const name=error&&typeof error==='object'&&'name'in error?String(error.name):'';if(name==='NotAllowedError'||name==='SecurityError')reportError('تم رفض إذن المايكروفون. اسمح لتوتي شات باستخدام المايكروفون من إعدادات الهاتف ثم حاول مجدداً.');else reportError('تعذر تشغيل المايكروفون. تحقق من الإذن والاتصال ثم حاول مجدداً.')}finally{setMicBusy(false)}};
  const send=async(e:React.FormEvent)=>{e.preventDefault();if(!text.trim()||sending||activeRoom.chatEnabled===false)return;setSending(true);try{const {error}=await supabase.from('room_messages').insert({room_id:activeRoom.id,content:text.trim()});if(error)throw error;setText('')}catch{reportError('تعذر إرسال الرسالة. حاول مجدداً.')}finally{setSending(false)}};
  const clickSeat=(index:number)=>{const seat=activeRoom.seats[index];if(!seat)return;if(seat.user)setSelectedUser(seat.user);else setEmptySeat(index)};
  const minimizeRoom=()=>{setExitOpen(false);setActiveSubScreen('home')}; const confirmLeaveRoom=async()=>{setExitOpen(false);await leaveRoom()};
  const openInfo=()=>{setMembersOnly(false);setInfoOpen(true)};
  const openMembers=()=>{setMembersOnly(true);setInfoOpen(true)};
  return <>
    <RoomStage title={activeRoom.title} cover={activeRoom.internalBackground||'/assets/images/room_screen_bg_1790556227206.jpg'} thumbnail={activeRoom.coverImage} count={activeRoom.usersCount}
      welcome={(activeRoom.welcomeMessage ?? activeRoom.description)||'أهلاً وسهلاً بكم ❤️'}
      seats={activeRoom.seats.map(seat=><MicrophoneSeat key={seat.seatIndex} seat={{...seat,isSpeaking:Boolean(seat.user?.authId&&speakingIds.includes(seat.user.authId))&&!seat.isMuted}} onSeatClick={clickSeat} isCurrentUserSeat={seat.user?.authId===user.authId} isOwner={Boolean(seat.user?.authId&&seat.user.authId===activeRoom.ownerAuthId)} giftCount={seat.user?giftTotals[seat.user.id]||0:0}/>)}
      onDeleteMessage={activeRoom.canModerate?(id)=>{if(window.confirm('حذف هذه الرسالة؟'))void supabase.rpc('clear_room_chat',{p_room_id:activeRoom.id,p_message_id:id}).then(({error})=>{if(error)reportError('تعذر حذف الرسالة.');else setMessages(previous=>previous.filter(message=>message.id!==id))})}:undefined}
      messages={messages} chatEnabled={activeRoom.chatEnabled!==false} text={text} sending={sending}
      muted={isMyMicMuted} micBusy={micBusy} seated={Boolean(mySeat)} speaker={isSpeakerOn} handRaised={isHandRaised} canModerate={Boolean(activeRoom.canModerate)}
      musicName={musicName} onMusic={file=>{void startMusic(file).catch(error=>reportError(error instanceof Error?error.message:'تعذر تشغيل الموسيقى.'))}} onStopMusic={stopMusic}
      onText={setText} onSend={send} onInfo={openInfo} onUsers={openMembers} onExit={()=>setExitOpen(true)} onGift={()=>{setGiftRecipient(null);setGiftOpen(true)}}
      onMic={()=>void handleMic()} onSpeaker={toggleSpeaker} onHand={()=>void toggleRaiseHand()} onLeaveSeat={()=>{if(mySeat)void leaveSeat(mySeat.seatIndex)}}
      onManage={()=>setManagementOpen(true)} onMessages={()=>setActiveSubScreen('messages')}/>
    <RoomExitOverlay open={exitOpen} onClose={()=>setExitOpen(false)} onLeave={()=>void confirmLeaveRoom()} onMinimize={minimizeRoom}/>
    <SeatActions index={emptySeat} locked={emptySeat!==null&&Boolean(activeRoom.seats[emptySeat]?.isLocked)} canLock={user.authId===activeRoom.ownerAuthId&&emptySeat!==0} busy={seatBusy} onClose={()=>setEmptySeat(null)}
      onTake={async()=>{if(emptySeat===null||seatBusy)return;setSeatBusy(true);try{await takeSeat(emptySeat);setEmptySeat(null)}finally{setSeatBusy(false)}}}
      onLock={async()=>{if(emptySeat===null||seatBusy)return;setSeatBusy(true);try{const action=activeRoom.seats[emptySeat]?.isLocked?unlockSeat:lockSeat;if(await action(emptySeat))setEmptySeat(null)}finally{setSeatBusy(false)}}}/>
    {activeRoom.giftEffectsEnabled!==false&&activeGiftOverlay&&<GiftOverlayAnimation overlayData={activeGiftOverlay}/>}<RoomUserProfileModal isOpen={Boolean(selectedUser)} targetUser={selectedUser} onClose={()=>setSelectedUser(null)} onGift={()=>{if(!selectedUser)return;setGiftRecipient(selectedUser);setSelectedUser(null);setGiftOpen(true)}} onManage={()=>{setSelectedUser(null);setManagementOpen(true)}} onMention={()=>{if(!selectedUser)return;setText(previous=>`${previous}${previous?' ':''}@${selectedUser.name} `);setSelectedUser(null)}} onMessage={()=>{if(!selectedUser)return;setSelectedChatUser(selectedUser);setSelectedUser(null);setActiveSubScreen('chat_detail')}} onOpenMore={()=>{if(!selectedUser)return;setSelectedChatUser(selectedUser);setSelectedUser(null);setActiveSubScreen('user_detail_profile')}}/><GiftStoreModal initialRecipient={giftRecipient} isOpen={giftOpen} onClose={()=>setGiftOpen(false)} room={activeRoom} onRechargeClick={()=>{setGiftOpen(false);setActiveSubScreen('recharge')}}/><RoomInfoModal isOpen={infoOpen} onClose={()=>setInfoOpen(false)} room={activeRoom} membersOnly={membersOnly} onSelectMember={setSelectedUser}/><RoomManagementModal isOpen={managementOpen} onClose={()=>setManagementOpen(false)} room={activeRoom}/>
  </>;
};

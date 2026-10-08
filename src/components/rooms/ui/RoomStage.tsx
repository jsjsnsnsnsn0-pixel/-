import {useDismissableLayer} from '../../../hooks/useDismissableLayer';
import React, {useEffect, useRef, useState} from 'react';
import {Gift, Hand, MessageCircle, Mic, MicOff, Pause, Play, Power, Smile, Send, Settings, Music, Users, Volume2, VolumeX, Wifi, WifiOff, X} from 'lucide-react';
import './room-ui.css';

export interface RoomChatMessage {id: string; content: string; sender_display_name?: string; gift?:boolean; kind?: 'text'|'gift'; deletable?: boolean; created_at?: string}
interface Props {
  title: string; roomId?:string; cover: string; thumbnail?:string; count: number; welcome: string; seats: React.ReactNode;
  onDeleteMessage?:(id:string)=>void;
  messages: RoomChatMessage[]; chatEnabled: boolean; text: string; sending: boolean;
  muted: boolean; micBusy: boolean; seated: boolean; speaker: boolean; handRaised: boolean; canModerate: boolean; audioConnected: boolean;
  onText: (value: string) => void; onSend: (event: React.FormEvent) => void;
  onInfo: () => void; onUsers: () => void; onExit: () => void; onGift: () => void;
  onMic: () => void; onSpeaker: () => void; onHand: () => void; onLeaveSeat: () => void;
  musicName?: string; musicPaused?: boolean; onMusic?: (file:File) => void; onStopMusic?:()=>void; onPauseMusic?:()=>void; onResumeMusic?:()=>void;
  onManage: () => void; onMessages: () => void;
}

/** Shared by the real room and the review page; session/audio remain with the provider. */
export function RoomStage(props: Props) {
  const [emoji,setEmoji]=useState(false);
  const emojiRef=useDismissableLayer(emoji,()=>setEmoji(false));
  const [tools, setTools] = useState(false);
  const toolsRef=useDismissableLayer(tools,()=>setTools(false));
  const fileRef=useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const atBottom = useRef(true);
  useEffect(() => {
    const chat = chatRef.current;
    if (chat && atBottom.current) chat.scrollTop = chat.scrollHeight;
  }, [props.messages]);
  return <main dir="rtl" className="room-stage">
    <img className="room-wallpaper" src={props.cover} alt=""/>
    <div className="room-shade"/>
    <header className="room-header">
      <button type="button" aria-label="معلومات الغرفة" onClick={props.onInfo} className="room-summary"><img src={props.thumbnail||props.cover} alt=""/><span><strong>{props.title}</strong>{props.roomId&&<small dir="ltr" title={props.roomId}>ID: {props.roomId}</small>}</span></button>
      <div className="room-header-spacer"/>
      <span role="status" aria-label={props.audioConnected?'الصوت متصل':'الصوت يعيد الاتصال'} className={`room-presence ${props.audioConnected?'text-emerald-300':'text-amber-300'}`}>{props.audioConnected?<Wifi size={14}/>:<WifiOff size={14}/>}<span>{props.audioConnected?'متصل':'اتصال'}</span></span>
      <button type="button" aria-label="الموجودون في الغرفة" onClick={props.onUsers} className="room-presence"><Users size={17}/><span>USR {props.count}</span></button>
      <button type="button" aria-label="خيارات الغرفة" onClick={props.onExit} className="room-icon"><Power/></button>
    </header>
    <section aria-label="المقاعد الصوتية" className="room-seats">{props.seats}</section>
    <button type="button" onClick={props.onMessages} aria-label="المحادثات الخاصة" className="room-private room-icon"><MessageCircle/></button>
    <section className="room-chat-area" aria-label="دردشة الغرفة">
      <div ref={chatRef} className="room-chat" role="log" aria-live="polite" onScroll={event=>{const el=event.currentTarget;atBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<48;}}>
        {props.welcome&&<p className="room-welcome">{props.welcome}</p>}
        {props.messages.map(message=><p className={`room-message ${message.kind==='gift'?'text-pink-200':''}`} key={message.id}><b>{message.sender_display_name||'مستخدم'} </b><span>{message.kind==='gift'?'🎁 ':''}{message.content}</span>{props.onDeleteMessage&&!message.gift&&message.deletable!==false&&<button type="button" aria-label={`حذف رسالة ${message.sender_display_name||'مستخدم'}`} onClick={()=>props.onDeleteMessage?.(message.id)} className="inline-flex align-middle p-2 opacity-60"><X size={12}/></button>}</p>)}
      </div>
      {!props.chatEnabled&&<p role="status" className="room-chat-status">الدردشة العامة متوقفة</p>}
      <form className="room-compose" onSubmit={props.onSend}>
        <input ref={inputRef} aria-label="رسالة الغرفة" disabled={!props.chatEnabled} value={props.text} onChange={event=>props.onText(event.target.value)} maxLength={1000} placeholder="اكتب رسالة…"/>
        <button type="submit" aria-label="إرسال رسالة الغرفة" disabled={props.sending||!props.text.trim()||!props.chatEnabled} className="room-icon"><Send size={19}/></button>
      </form>
    </section>
    <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)props.onMusic?.(file)}}/>
    {props.musicName&&<div className="px-4 flex items-center justify-between gap-2 text-xs text-cyan-200"><span className="truncate">♫ {props.musicName}</span><div className="flex items-center gap-2"><button type="button" aria-label={props.musicPaused?'استئناف الموسيقى':'إيقاف الموسيقى مؤقتاً'} onClick={props.musicPaused?props.onResumeMusic:props.onPauseMusic} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10">{props.musicPaused?<><Play size={13}/>متابعة</>:<><Pause size={13}/>إيقاف مؤقت</>}</button><button type="button" onClick={props.onStopMusic} className="px-2 py-1 rounded-lg bg-white/10">إيقاف</button></div></div>}
    {emoji&&<div ref={emojiRef} role="dialog" aria-label="اختيار إيموجي" className="room-emoji">{['❤️','😂','👏','🌹','✨','👍','🎉','😊'].map(symbol=><button type="button" key={symbol} aria-label={`إضافة ${symbol}`} onClick={()=>{props.onText(props.text+symbol);setEmoji(false);inputRef.current?.focus()}}>{symbol}</button>)}<button type="button" aria-label="إغلاق الإيموجي" onClick={()=>setEmoji(false)}><X size={16}/></button></div>}
    <footer className="room-footer">
      <button type="button" aria-label="الإيموجي" aria-expanded={emoji} disabled={!props.chatEnabled} className="room-icon" onClick={()=>setEmoji(v=>!v)}><Smile/></button>
      <button type="button" aria-label="إرسال هدية" onClick={props.onGift} className="room-icon room-gift"><Gift/></button>
      <button type="button" aria-label="كتابة رسالة" disabled={!props.chatEnabled} onClick={()=>inputRef.current?.focus()} className="room-icon"><MessageCircle/></button>
      <button type="button" aria-label={props.muted?'تشغيل المايكروفون':'كتم المايكروفون'} aria-pressed={!props.muted} aria-busy={props.micBusy} disabled={props.micBusy} onClick={props.onMic} className="room-icon">{props.muted?<MicOff className="text-rose-300"/>:<Mic className="text-emerald-300"/>}</button>
      {props.onMusic&&<button type="button" aria-label="موسيقى الهاتف" className="room-icon" onClick={()=>fileRef.current?.click()}><Music size={20}/></button>}
      <button type="button" aria-label="أدوات الغرفة" aria-expanded={tools} onClick={()=>setTools(value=>!value)} className="room-icon"><Settings/></button>
    </footer>
    {tools&&<div ref={toolsRef} className="absolute inset-0 z-30 bg-black/50" onClick={()=>setTools(false)}><div role="dialog" aria-modal="true" aria-label="أدوات الغرفة" className="room-tools" dir="rtl" onClick={event=>event.stopPropagation()}><div className="flex items-center justify-between mb-3"><h2>أدوات الغرفة</h2><button type="button" className="room-icon" aria-label="إغلاق الأدوات" onClick={()=>setTools(false)}><X size={18}/></button></div><div className="grid grid-cols-2 gap-3">      <button type="button" aria-label={props.speaker?'كتم سماعة الغرفة':'تشغيل سماعة الغرفة'} aria-pressed={props.speaker} onClick={props.onSpeaker} className="room-icon">{props.speaker?<Volume2/>:<VolumeX/>}</button>
      <button type="button" aria-label={props.handRaised?'إنزال اليد':'رفع اليد'} aria-pressed={props.handRaised} onClick={props.onHand} className="room-icon"><Hand className={props.handRaised?'text-amber-300':''}/></button>
{props.canModerate&&<button type="button" onClick={()=>{setTools(false);props.onManage();}}>إدارة الغرفة</button>}<button type="button" onClick={()=>{setTools(false);props.onInfo();}}>معلومات الغرفة</button><button type="button" onClick={()=>{setTools(false);props.onUsers();}}>المستخدمون</button>{props.seated&&<button type="button" aria-label="مغادرة المقعد" onClick={()=>{setTools(false);props.onLeaveSeat();}}>النزول من المايك</button>}</div></div></div>}
  </main>;
}

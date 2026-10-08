import {useEffect,useState} from 'react';
import {supabase} from '../services/supabase';
export function useRoomGiftMessages(roomId?:string){
 const [messages,setMessages]=useState<any[]>([]);
 useEffect(()=>{
  setMessages([]);if(!roomId)return;
  let disposed=false,busy=false,again=false;const rows=new Map<string,any>();
  const merge=(row:any)=>{if(row.room_id!==roomId)return;rows.set(String(row.id),row)};
  const publish=()=>{if(disposed)return;const sorted=[...rows.values()].sort((a,b)=>Date.parse(a.created_at)-Date.parse(b.created_at)).slice(-100);rows.clear();sorted.forEach(row=>rows.set(String(row.id),row));setMessages(sorted.map(row=>({id:`gift:${row.id}`,gift:true,created_at:row.created_at,sender_display_name:'🎁',content:`أرسل ${row.sender_name} ${row.quantity>1?`${row.quantity} × `:''}${row.gift_name} إلى ${row.recipient_name}`})))};
  const load=async()=>{if(disposed)return;if(busy){again=true;return}busy=true;try{const {data,error}=await supabase.from('room_gift_feed').select('*').eq('room_id',roomId).order('created_at',{ascending:false}).limit(100);if(!error&&!disposed){(data||[]).forEach(merge);publish()}}catch{/* Keep confirmed feed messages during transient failures. */}finally{busy=false;if(again&&!disposed){again=false;void load()}}};
  const confirmed=(event:Event)=>{if((event as CustomEvent).detail?.roomId===roomId)void load()};
  const channel=supabase.channel(`gift-chat:${roomId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'room_gift_feed',filter:`room_id=eq.${roomId}`},event=>{if(!disposed){merge(event.new);publish()}}).subscribe();
  window.addEventListener('toti:gift-confirmed',confirmed);void load();const timer=window.setInterval(()=>{if(!document.hidden)void load()},15000);
  return()=>{disposed=true;clearInterval(timer);window.removeEventListener('toti:gift-confirmed',confirmed);void supabase.removeChannel(channel)};
 },[roomId]);return messages;
}

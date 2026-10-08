import React,{useCallback,useState} from 'react';
import {rpc,backendMessage} from '../../services/backend';
import {useServerData} from '../../hooks/useServerData';
import {EmptyState,ErrorState,InlineLoading} from '../common/UIState';
import {RefreshCw} from 'lucide-react';

type Ticket={id:string;category:string;message:string;status:string;response:string|null;
 created_at:string;updated_at:string;public_id:number;display_name:string};
type Room={id:string;name:string;is_active:boolean;is_private:boolean;max_seats:number;created_at:string;
 owner_public_id:number|null;owner_name:string|null;members:number;active_mics:number;moderation_actions:number};
const tm=(s:string)=>new Date(s).toLocaleString('ar-IQ');
const layout='rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3';
export function AdminModerationPanel({kind,canAct}:{kind:'tickets'|'rooms';canAct:boolean}){
 const [editing,setEditing]=useState<string|null>(null);
 const [reason,setReason]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const loadTickets=useCallback(()=>kind==='tickets'?rpc<Ticket[]>('dashboard_support_tickets'):Promise.resolve([] as Ticket[]),[kind]);
 const loadRooms=useCallback(()=>kind==='rooms'?rpc<Room[]>('dashboard_rooms'):Promise.resolve([] as Room[]),[kind]);
 const tickets=useServerData(loadTickets,[] as Ticket[]);
 const rooms=useServerData(loadRooms,[] as Room[]);
 const act=async(id:string)=>{
  if(busy||!canAct)return;
  if(reason.trim().length<10){setError('يرجى كتابة سبب واضح لا يقل عن عشرة حروف.');return;}
  if(kind==='rooms'&&!window.confirm('هل تريد إغلاق الغرفة فعلاً؟ لا يمكن التراجع عن هذا الإجراء من هنا.'))return;
  setBusy(true);setError('');setNotice('');
  try{
   if(kind==='rooms')await rpc('dashboard_close_room',{p_room_id:id,p_reason:reason.trim()});
   else await rpc('dashboard_reply_support_ticket',{p_ticket_id:id,p_reply:reason.trim()});
   await (kind==='rooms'?rooms.reload():tickets.reload());
   setNotice(kind==='rooms'?'أُغلقت الغرفة وسُجل الإجراء في سجل الإدارة.':'أُرسل الرد وتم إشعار صاحب الطلب.');
   setEditing(null);setReason('');
  }catch(e){setError(backendMessage(e))}
  finally{setBusy(false)}
 };
 const loading=kind==='rooms'?rooms.loading:tickets.loading;
 const loadingError=kind==='rooms'?rooms.error:tickets.error;
 const retry=kind==='rooms'?rooms.reload:tickets.reload;
 return <section dir="rtl" className="space-y-4">
  <div className="flex items-center justify-between"><h2 className="text-lg font-black">{kind==='rooms'?'إدارة الغرف':'بلاغات وتذاكر الدعم'}</h2><button aria-label="تحديث البيانات" type="button" onClick={()=>void retry()} className="rounded-xl bg-white/10 p-3"><RefreshCw size={16}/></button></div>
  <p className="text-xs text-slate-400">{kind==='rooms'?'تُحسب الأعداد من بيانات الغرف والأعضاء النشطين؛ إغلاق الغرفة لا يحذف هداياها أو سجلاتها.':'الرسائل والبلاغات حقيقية من قاعدة البيانات؛ الرد يحتاج صلاحية على الخادم ويُسجّل في سجل الإدارة.'}</p>
  {error&&<p role="alert" className="rounded-xl bg-rose-950/50 p-3 text-sm text-rose-200">{error}</p>}
  {notice&&<p role="status" className="rounded-xl bg-emerald-950/40 p-3 text-sm text-emerald-200">{notice}</p>}
  {loading?<InlineLoading>جاري تحميل البيانات…</InlineLoading>:loadingError?<ErrorState message={loadingError} onRetry={()=>void retry()}/>:kind==='rooms'?
   rooms.data.length===0?<EmptyState title="لا توجد غرف"/>:rooms.data.map(room=><article key={room.id} className={layout}>
    <div className="flex justify-between gap-3"><div className="min-w-0"><strong className="block truncate">{room.name}</strong><p className="text-xs text-slate-400">المالك: {room.owner_name||'حساب غير معروف'} · {room.owner_public_id||'—'}</p></div><span className={'text-xs '+(room.is_active?'text-emerald-300':'text-rose-300')}>{room.is_active?'مفتوحة':'مغلقة'}</span></div>
    <div className="flex flex-wrap gap-3 text-xs text-slate-300"><span>المستخدمون: {room.members}</span><span>مايك نشط: {room.active_mics}</span><span>إجراءات إشراف: {room.moderation_actions}</span></div>
    {canAct&&room.is_active&&<><button disabled={busy} type="button" className="rounded-xl bg-rose-600/20 border border-rose-400/20 px-3 py-2 text-xs" onClick={()=>{setEditing(room.id);setReason('');setError('')}}>إغلاق إداري</button>
     {editing===room.id&&<div className="space-y-2"><textarea aria-label="سبب إغلاق الغرفة" rows={2} maxLength={300} value={reason} onChange={e=>setReason(e.target.value)} placeholder="اكتب سبب الإغلاق بالتفصيل" className="w-full bg-[#14192c] border border-white/15 rounded-xl p-3 text-sm"/><button disabled={busy} onClick={()=>void act(room.id)} className="rounded-xl bg-rose-700 px-4 py-2 text-sm disabled:opacity-50">تأكيد الإغلاق</button><button disabled={busy} onClick={()=>setEditing(null)} className="p-2 text-xs">إلغاء</button></div>}
    </>}
   </article>)
   :tickets.data.length===0?<EmptyState title="لا توجد طلبات دعم"/>:tickets.data.map(ticket=><article key={ticket.id} className={layout}>
    <div className="flex justify-between gap-2"><strong>{ticket.category} · {ticket.display_name}</strong><span className="text-xs text-amber-200">{ticket.status}</span></div>
    <p className="text-xs text-slate-400">ID {ticket.public_id} · {tm(ticket.created_at)}</p>
    <p className="text-sm whitespace-pre-wrap break-words">{ticket.message}</p>
    {ticket.response&&<p className="text-xs text-cyan-200 bg-cyan-500/10 rounded-xl p-3">رد سابق: {ticket.response}</p>}
    {canAct&&ticket.status!=='closed'&&<><button type="button" onClick={()=>{setEditing(ticket.id);setReason(ticket.response||'');setError('')}} className="rounded-xl bg-cyan-600/20 border border-cyan-400/25 px-3 py-2 text-xs">{ticket.response?'تعديل الرد':'الرد على التذكرة'}</button>
     {editing===ticket.id&&<div className="space-y-2"><textarea aria-label="رد الدعم الفني" maxLength={1000} rows={3} value={reason} onChange={e=>setReason(e.target.value)} className="w-full rounded-xl bg-[#14192c] border border-white/15 p-3 text-sm"/><button disabled={busy} onClick={()=>void act(ticket.id)} className="rounded-xl bg-cyan-600 px-4 py-2 text-xs">حفظ الرد وإشعار المستخدم</button><button onClick={()=>setEditing(null)} className="p-2 text-xs">إلغاء</button></div>}
    </>}
   </article>)
  }
 </section>;
}

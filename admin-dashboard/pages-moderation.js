import {state,rpc,load,change,allowed} from './context.js';
import {el,box,panel,title,note,btn,field,rows,date} from './ui.js';

export function rooms(work){
 const holder=panel(title('غرف TotiChat'));work.append(holder);
 load(holder,()=>rpc('dashboard_rooms'),data=>{
  holder.append(title('مراقبة الغرف الفعلية'));
  rows(holder,data,room=>{
   const card=box('item',el('b',{},room.name),
    note('المالك '+room.owner_name+' • ID '+room.owner_public_id),
    note('الحالة: '+(room.is_active?'مفتوحة':'مغلقة')+' • الأعضاء '+room.members+' • المايكات '+room.active_mics));
   if(room.is_active&&allowed('rooms.close')){
    const reason=field('سبب الإغلاق (10 أحرف على الأقل)');
    card.append(reason.label,btn('إغلاق الغرفة',()=>{
     const memo=reason.input.value.trim();
     if(memo.length<10)return state.notify('يرجى كتابة سبب الإغلاق.','error');
     if(!confirm('إغلاق غرفة '+room.name+' وإشعار صاحبها؟'))return;
     change(()=>rpc('dashboard_close_room',{p_room_id:room.id,p_reason:memo}),
      'تم إغلاق الغرفة مع حفظ سجل الإشراف.');
    },'btn danger'));
   }
   return card;
  });
 });
}
export function tickets(work){
 const holder=panel(title('طلبات الدعم'));work.append(holder);
 load(holder,()=>rpc('dashboard_support_tickets'),data=>{
  holder.append(title('التذاكر والبلاغات'));
  rows(holder,data,ticket=>{
   const card=box('item',el('b',{},ticket.category+' • ID '+ticket.public_id),
    note(ticket.message),note('الحالة: '+ticket.status+' • '+date(ticket.created_at)));
   if(ticket.response)card.append(note('الرد السابق: '+ticket.response));
   if(!['support','customer_service'].includes(state.session?.role)&&allowed('reports.manage')&&ticket.status!=='closed'){
    const response=field('رد الدعم الفني الرسمي');
    card.append(response.label,btn('إرسال الرد',()=>{
     const memo=response.input.value.trim();
     if(memo.length<5)return state.notify('الرد قصير جداً.','error');
     change(()=>rpc('dashboard_reply_support_ticket',{p_ticket_id:ticket.id,p_reply:memo}),
      'تم إرسال الرد وتوثيقه.');
    },'btn primary'));
   }
   return card;
  });
 });
}

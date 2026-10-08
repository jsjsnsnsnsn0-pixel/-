import {state,rpc,load,change,allowed} from './context.js';
import {el,box,panel,title,note,btn,field,rows,date} from './ui.js';

export function agencies(work){
 const holder=panel(title('طلبات فتح الوكالات'));work.append(holder);
 load(holder,()=>rpc('dashboard_agency_registrations'),data=>{
  holder.append(title('طلبات الوكالات الحقيقية'));
  rows(holder,data,application=>{
   const reason=field('ملاحظة الإدارة');
   const card=box('item',el('b',{},application.agency_name+' • ID '+application.applicant_public_id),
    note('الاسم: '+application.full_name+' • '+application.country_code+' • '+application.agent_number),
    note('الحالة: '+application.status+' • '+date(application.submitted_at)),reason.label);
   const actions=box('actions');
   const choices=[
    ['approve','قبول وإنشاء الوكالة','agencies.approve','btn primary'],
    ['reject','رفض الطلب','agencies.reject','btn danger'],
    ['request_changes','طلب تعديل','agencies.reject','btn warn']
   ];
   for(const [action,label,permission,style] of choices){
    if(!allowed(permission)||application.status!=='pending')continue;
    actions.append(btn(label,()=>{
     const memo=reason.input.value.trim();
     if(action!=='approve'&&memo.length<5){
      state.notify('السبب مطلوب ولا يقل عن خمسة أحرف.','error');return;
     }
     if(!confirm('تأكيد قرار '+label+' للوكالة '+application.agency_name+'؟'))return;
     change(()=>rpc('dashboard_agency_review',{p_application_id:application.id,p_action:action,p_note:memo}),
      'تم حفظ قرار الوكالة وإبلاغ مقدم الطلب.');
    },style));
   }
   card.append(actions);
   return card;
  });
 });
}

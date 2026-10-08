import {state,rpc,load,change} from './context.js';
import {el,box,panel,title,note,btn,field,metric,rows,money} from './ui.js';

export function settlements(work){
 const month=field('شهر التسوية','month');
 const now=new Date(),previous=new Date(now.getFullYear(),now.getMonth()-1,1);
 month.input.value=previous.getFullYear()+'-'+String(previous.getMonth()+1).padStart(2,'0');
 month.input.max=month.input.value;
 const form=el('form',{class:'toolbar'},month.label);
 form.append(btn('عرض الشهر',()=>form.requestSubmit(),'btn primary'));
 const target=panel(title('سجلات التسوية'));
 form.addEventListener('submit',e=>{e.preventDefault();refresh()});
 work.append(panel(title('الماس والمضيفون والوكالات'),
  note('عرض التقارير لا يصفر الماس ولا يدفع المستحقات. الإقفال قرار مالي نهائي للمالك بعد المراجعة.'),form),target);
 function refresh(){
  const value=month.input.value;
  if(!/^\d{4}-\d\d$/.test(value))return;
  load(target,()=>rpc('dashboard_monthly_settlements',{p_month:value+'-01'}),report=>{
   target.append(title('تقرير '+value));
   const t=report.totals||{};
   target.append(box('metrics',...[
    ['عدد المضيفين',t.hosts],['الماس المكتسب',t.earned_diamonds],
    ['الماس المتبقي',t.unredeemed_diamonds],['رواتب المضيفين',t.host_salaries],
    ['عمولات الوكلاء',report.total_agent_commissions],
    ['Coins المحوّلة',t.generated_coins],['تمت تسويتها',t.settled],['بانتظار التسوية',t.pending]
   ].map(x=>metric(x[0],x[1]))));
   rows(target,report.entries,record=>{
    const card=box('item',el('b',{},record.display_name+' • ID '+record.public_id),
     note('الحالة: '+record.status+' | ماس مكتسب: '+money(record.diamonds_earned)+
      ' | ماس متبقٍ: '+money(record.diamonds_remaining)),
     note('راتب المضيف: '+(record.host_salary==null?'غير محدد':money(record.host_salary))+
      ' | Coins الناتجة: '+money(record.coins_generated)));
    for(const agency of record.agencies||[])card.append(
     note('وكالة '+(agency.name||agency.agency_id)+' — تارجت '+money(agency.agency_target)+
      ' — العمولة '+(agency.agent_commission==null?'غير محددة':money(agency.agent_commission))));
    if(state.session.owner&&record.status!=='settled'){
     const salary=field('راتب المضيف','number',record.host_salary==null?'':String(record.host_salary));
     const commissions=(record.agencies||[]).map(x=>({
      id:x.agency_id,...field('عمولة وكالة '+(x.name||x.agency_id),'number',
       x.agent_commission==null?'':String(x.agent_commission))
     }));
     const save=btn('حفظ الرواتب والعمولات',async()=>{
      const amount=Number(salary.input.value);
      if(salary.input.value===''||!Number.isFinite(amount)||amount<0||
         commissions.some(x=>x.input.value===''||!Number.isFinite(Number(x.input.value))||Number(x.input.value)<0)){
       state.notify('أدخل راتب المضيف وجميع عمولات الوكالات بصورة صحيحة.','error');return;
      }
      const ok=await change(()=>rpc('dashboard_monthly_save_compensation',{
       p_public_id:record.public_id,p_month_start:value+'-01',p_host_salary:amount,
       p_commissions:Object.fromEntries(commissions.map(x=>[String(x.id),Number(x.input.value)]))
      }),'تم توثيق المستحقات.',false);
      if(ok)refresh();
     });
     const finalize=btn('إقفال وتسوية نهائية',async()=>{
      const typed=prompt('تحذير: إقفال نهائي للماس الشهري بعد تثبيت المستحقات. اكتب ID '+record.public_id+' للتأكيد.');
      if(typed!==String(record.public_id))return;
      const key=record.id+':'+value;
      const request=state.settlementRequests.get(key)||crypto.randomUUID();
      state.settlementRequests.set(key,request);
      const ok=await change(()=>rpc('dashboard_monthly_finalize',{
       p_public_id:record.public_id,p_month_start:value+'-01',p_request_id:request
      }),'تمت التسوية وحفظ السجلات المالية.',false);
      if(ok){state.settlementRequests.delete(key);refresh()}
     },'btn danger');
     card.append(box('fields',salary.label,...commissions.map(x=>x.label)),
      box('actions',save,finalize));
    }
    return card;
   },'لا توجد سجلات تسوية محضّرة لهذا الشهر.');
  });
 }
 refresh();
}

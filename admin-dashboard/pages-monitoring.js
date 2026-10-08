import {state,rpc,load,change} from './context.js';
import {el,box,panel,title,note,btn,metric,rows,money} from './ui.js';

export function health(work){
 const target=panel(title('مراقبة النسخة التجريبية'));work.append(target);
 load(target,()=>rpc('dashboard_beta_health'),data=>{
  target.append(title('مؤشرات Beta'));
  target.append(box('metrics',metric('أحداث آخر 7 أيام',data.last_7_days),
   ...Object.entries(data.last_24h||{}).map(([label,value])=>metric(label,value))));
  target.append(title('أكثر الأحداث تكراراً'));
  rows(target,data.recent_codes,row=>box('item',
   el('b',{},row.category+' / '+row.code),note('العدد: '+money(row.total))));
 });
}
export function settings(work){
 const target=panel(title('إعدادات نسخة Beta'));work.append(target);
 load(target,()=>rpc('beta_flags_state'),data=>{
  target.append(title('Feature Flags'));
  rows(target,Object.entries(data||{}),([name,enabled])=>
   box('item',box('rowHead',el('b',{},name),
    el('span',{class:'pill'},enabled?'مفعّل':'موقوف')),
   btn(enabled?'إيقاف':'تفعيل',()=>{
    if(!state.session.owner||!confirm('تأكيد تغيير الإعداد '+name+'؟'))return;
    change(()=>rpc('dashboard_set_beta_flag',{p_id:name,p_enabled:!enabled}));
   },'btn',!state.session.owner)));
 });
}

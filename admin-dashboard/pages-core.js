import {state,rpc,load,allowed} from './context.js';
import {el,box,panel,title,note,btn,field,metric,rows,money,date} from './ui.js';
export {wallet} from './pages-wallet.js';
export {health,settings} from './pages-monitoring.js';

export function overview(work){
 // Layout follows the Owner-approved 2026-10-07 Admin Dashboard.
 // No preview/demo numbers enter this authenticated view.
 const head=box('approvedOverviewHeading',
  box('',el('h2',{},'نظرة عامة'),note('مؤشرات تشغيل TotiChat من قاعدة البيانات الحقيقية')),
  el('span',{class:'agencyBadge live'},'●  مؤشرات فعلية'));
 const content=box('metrics approvedOverviewMetrics');
 const left=panel(box('rowHead',title('بيانات النظام'),el('span',{class:'liveLabel'},'● اتصال محمي')),
  note('تُعرض الأرقام المتاحة حالياً فقط. لا توجد نسب نمو تقديرية أو رسوم وهمية.'));
 const right=panel(box('rowHead',title('آخر النشاطات الحساسة'),
  allowed('audit.view')?btn('عرض السجل',()=>{state.section='audit';state.refresh()},'btn ghost'):el('span',{},'')));
 const quick=panel(title('الوصول السريع'));
 const actions=box('approvedQuickActions');
 for(const [id,label,permission] of [
  ['users','👥 إدارة المستخدمين','users.view'],
  ['rooms','🎙 إدارة الغرف','rooms.view'],
  ['tickets','🛡 البلاغات','reports.view'],
  ['agencies','🏢 إدارة الوكالات','agencies.view'],
  ['roles','🔐 صلاحيات الموظفين','roles.view'],
  ['audit','≡ السجل الإداري','audit.view']
 ]){
  if(id==='agencies'&&!state.session?.owner&&!state.session?.primary_partner)continue;
  if(!allowed(permission))continue;
  actions.append(btn(label,()=>{state.section=id;state.refresh()},'btn ghost'));
 }
 if(actions.childNodes.length)quick.append(actions);
 const activityList=box('approvedActivityList');
 right.append(activityList);
 work.append(head,content,box('approvedOverviewColumns',left,right));
 if(actions.childNodes.length)work.append(quick);
 load(content,()=>rpc('dashboard_overview'),data=>{
  const cards=[
   ['إجمالي المستخدمين',data.users,'👥'],
   ['النشطون الآن',data.active_users,'●'],
   ['الغرف النشطة',data.active_rooms,'🎙'],
   ['هدايا اليوم',data.gifts_today,'🎁']
  ];
  content.append(...cards.map(([label,value,icon])=>box('approvedStat',
   box('approvedStatTop',el('span',{},label),el('span',{class:'approvedStatIcon'},icon)),
   el('strong',{},money(value)),el('small',{},'بيانات مباشرة')));
  left.append(box('approvedCompactStats',
   box('approvedInfoRow',note('Coins المتداولة'),el('strong',{},money(data.coins_in_circulation))),
   ...(state.session?.owner||state.session?.primary_partner===true?
    [box('approvedInfoRow',note('وكالات المضيفين'),el('strong',{},money(data.agencies))),
     box('approvedInfoRow',note('المضيفون'),el('strong',{},money(data.hosts))]:[])));
 });
 if(allowed('audit.view')){
  load(activityList,()=>rpc('dashboard_audit_history'),data=>{
   const entries=(Array.isArray(data)?data:[]).slice(0,6);
   if(!entries.length){activityList.append(note('لا توجد إجراءات إدارية مسجلة بعد.'));return}
   for(const item of entries){
    activityList.append(box('approvedActivityItem',
     box('approvedActivityIcon','≡'),
     box('approvedActivityCopy',
      el('strong',{},item.action||'إجراء إداري'),
      note((item.operator_name||'حساب مخوّل')+' • '+date(item.created_at)))));
   }
  });
 }else activityList.append(note('سجل الإجراءات متاح للمخولين فقط.'));
}
export function users(work){
 const search=field('ابحث بـ ID أو الاسم أو البريد');
 search.input.value=state.userSearchQuery||'';
 const form=el('form',{class:'toolbar'},search.label);
 form.append(btn('بحث',()=>form.requestSubmit(),'btn primary'));
 const target=panel(title('المستخدمون'));
 work.append(panel(title('البحث عن حساب'),form),target);
 form.addEventListener('submit',event=>{event.preventDefault();state.userSearchQuery=search.input.value.trim();refresh()});
 function refresh(){
  load(target,()=>rpc('dashboard_users',{p_search:search.input.value.trim(),p_limit:50}),data=>{
   target.append(title('المستخدمون'));
   rows(target,data,u=>{
    const item=box('item',el('b',{},u.display_name||u.username||'حساب'),
     note('ID '+u.public_id+' • @'+u.username+' • المستوى '+u.level+' • VIP'+u.vip_level),
     note('Coins '+money(u.gold)+' • Diamonds '+money(u.diamonds)+(u.email?' • '+u.email:'')));
    if(allowed('wallet.credit')||allowed('wallet.debit')){
     item.append(btn('إدارة المحفظة',()=>{
      state.section='wallet';state.refresh();
      const el=document.getElementById('walletTarget');if(el)el.value=u.public_id;
     }));
    }
    return item;
   },'لا توجد حسابات مطابقة.');
  });
 }
 refresh();
}
export function audit(work){
 const target=panel(title('السجل الإداري'));work.append(target);
 load(target,()=>rpc('dashboard_audit_history'),data=>{
  target.append(title('كل إجراءات الموظفين'));
  rows(target,data,t=>box('item',el('b',{},t.action),
   note('المسؤول '+t.operator_name+' • '+date(t.created_at)),
   el('p',{class:'details'},JSON.stringify(t.metadata||{}))));
 });
}

import {state,rpc,load,allowed} from './context.js';
import {el,box,panel,title,note,btn,field,metric,rows,money,date} from './ui.js';
export {wallet} from './pages-wallet.js';
export {health,settings} from './pages-monitoring.js';

export function overview(work){
 const content=box('metrics');
 const hero=box('overviewHero',box('heroCopy',
  el('span',{class:'heroEyebrow'},'TotiChat / CONTROL CENTER'),
  el('h2',{},'إدارة المنصة بثقة ووضوح'),
  note('البيانات أدناه تُقرأ مباشرة من قاعدة TotiChat. كل إجراء إداري يخضع لصلاحيات حسابك.')));
 const quick=box('quickActions');
 for(const [id,label,permission] of [['users','إدارة المستخدمين','users.view'],['rooms','متابعة الغرف','rooms.view'],['roles','الرتب والصلاحيات','roles.view']]){
  if(!allowed(permission))continue;
  quick.append(btn(label,()=>{state.section=id;state.refresh()},'btn ghost'));
 }
 if(quick.childNodes.length)hero.append(quick);
 work.append(hero,panel(box('rowHead',title('مؤشرات المنصة'),el('span',{class:'liveLabel'},'● بيانات مباشرة')),
  note('الأرقام الفعلية من دوال Supabase المحمية.'),content));
 load(content,()=>rpc('dashboard_overview'),data=>{
  content.append(...[
   ['المستخدمون',data.users],['النشطون',data.active_users],
   ['الغرف المفتوحة',data.active_rooms],['هدايا اليوم',data.gifts_today],
   ['Coins المتداولة',data.coins_in_circulation],['الوكالات',data.agencies],
   ['المضيفون',data.hosts],['طلبات الوكالة المعلقة',data.pending_agency_registrations]
  ].map(([label,n])=>metric(label,n)));
 });
}
export function users(work){
 const search=field('ابحث بـ ID أو الاسم أو البريد');
 const form=el('form',{class:'toolbar'},search.label);
 form.append(btn('بحث',()=>form.requestSubmit(),'btn primary'));
 const target=panel(title('المستخدمون'));
 work.append(panel(title('البحث عن حساب'),form),target);
 form.addEventListener('submit',event=>{event.preventDefault();refresh()});
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

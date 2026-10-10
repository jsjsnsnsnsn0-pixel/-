import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import {state,rpc,allowed,load,change} from './context.js';
import {overview as legacyOverview, audit as auditPage} from './pages-core.js';
import {wallet} from './pages-wallet.js';
import {rooms,tickets} from './pages-moderation.js';
import {roles} from './pages-roles.js';
import {catalog} from './pages-catalog.js';
import {settlements} from './pages-finance.js';
import {health,settings} from './pages-monitoring.js';
import {el,box,panel,title,note,btn,field,money,date} from './ui.js';

// This is the actual authenticated frontend for the Owner-approved Oct 7 design.
// No mock accounts, seed arrays or decorative financial metrics are used here.
const $=id=>document.getElementById(id);
const shell=$('dashboardShell');
const gate=$('authGate');
const notice=$('authNotice');
const config=window.TOTICHAT_ADMIN_CONFIG;
let sequence=0;
let usersCache=[];
const principal=()=>state.session?.owner===true||state.session?.primary_partner===true;
const isDB=()=>['agency_manager','db_employee'].includes(state.session?.role);
const isSupport=()=>['support','customer_service'].includes(state.session?.role);
const rules={
 overview:'dashboard.view',users:'users.view',rooms:'rooms.view',moderation:'reports.view',
 vip:'vip.manage',economy:'wallet.history',agents:'agencies.view',agencies:'agencies.view',
 store:'gifts.manage',cp:'cp.manage',badges:'roles.view',staff:'roles.view',
 audit:'audit.view',notifications:'reports.view',settings:'system.settings',
 security:'audit.view',reports:'reports.view','agency-requests':'agencies.view'
};
function permitted(id){
 if(id==='agency-requests')return isDB()&&(allowed('agencies.view')||allowed('agencies.approve'));
 if(isDB())return false;
 if(isSupport())return id==='moderation'||id==='notifications';
 if(['agencies','agents'].includes(id))return principal()&&allowed('agencies.view');
 if(id==='economy')return (allowed('wallet.history')||allowed('wallet.credit')||allowed('wallet.debit'));
 if(id==='store')return allowed('store.manage')||allowed('gifts.manage');
 if(id==='reports')return allowed('reports.view')||allowed('settlements.view');
 return allowed(rules[id]||'dashboard.view');
}
function say(msg,error=false){
 const t=$('toast');t.textContent=msg;t.className='toast show'+(error?' error':'');
 clearTimeout(say.timeout);say.timeout=setTimeout(()=>t.classList.remove('show'),4000);
}
state.notify=(msg,severity)=>say(msg,severity==='error');
state.refresh=()=>navigate(state.section||'overview',true);
function safeText(node,value){node.textContent=value==null?'—':String(value)}
function placeholder(text){return box('realEmpty',note(text))}
function permittedNav(){
 for(const button of document.querySelectorAll('#nav [data-page],.mobile-nav [data-jump]')){
  const id=button.dataset.page||button.dataset.jump;
  button.hidden=!permitted(id);
 }
 for(const shortcut of document.querySelectorAll('[data-jump]')){
  if(shortcut.closest('.mobile-nav'))continue;
  shortcut.hidden=!permitted(shortcut.dataset.jump);
 }
 if(isDB()){
  let db=$('dbNavButton');
  if(!db){
   db=el('button',{id:'dbNavButton',type:'button','data-page':'agency-requests'},
    el('span',{class:'ico'},'🏢'),'فتح وكالات المضيفين');
   $('nav').append(db);db.addEventListener('click',()=>navigate('agency-requests'));
  }
  db.hidden=false;
 }else $('dbNavButton')?.remove();
}
function resetPreview(){
 // Clear all original illustrative amounts/actions BEFORE revealing the secure shell.
 document.querySelectorAll('#overview .stat strong,#users .mini-kpi b,#agencies .mini-kpi b')
  .forEach(node=>safeText(node,'—'));
 document.querySelectorAll('#overview .trend').forEach(node=>safeText(node,'بيانات حقيقية فقط'));
 $('chart')?.replaceChildren(placeholder('بيانات السلاسل الزمنية غير متاحة حالياً من واجهة الخادم.'));
 document.querySelector('#overview .activity')?.replaceChildren(placeholder('جارٍ تحميل النشاطات الإدارية…'));
 $('userRows')?.replaceChildren();
 $('agencyRequests')?.replaceChildren();
 document.querySelector('#audit tbody')?.replaceChildren();
 document.querySelector('#staff .roles')?.replaceChildren();
 // Original cards had hardcoded fake statuses and counters.
 document.querySelector('#agencies .agency-grid')?.replaceChildren();
 document.querySelector('#agencies .kpis-small')?.replaceChildren();
 const userDrawer=$('userDrawer');
 userDrawer?.querySelectorAll('.info b').forEach(x=>safeText(x,'—'));
 userDrawer?.querySelectorAll('[onclick]')?.forEach(x=>x.removeAttribute('onclick'));
 document.querySelectorAll('.date-filter button').forEach(x=>{x.disabled=true;x.title='الفترات تحتاج إحصاءات زمنية من الخادم'});
 document.querySelector('#overview .header-row p').textContent='مؤشرات مباشرة من قاعدة TotiChat — بدون بيانات تجريبية.';
 $('exportUsers').textContent='تصدير نتائج البحث CSV';
 $('exportUsers').disabled=false;
 $('newAgencyBtn').hidden=true; // agency creation only through reviewed, auditable backend workflows
 document.querySelector('#users .toolbar select')?.remove(); // no server-side status filter yet
 document.querySelector('#overview .card-title .link')?.addEventListener('click',()=>navigate('audit'));
 document.querySelectorAll('.sidebar-foot .owner-mini b,.owner-pill span').forEach(x=>safeText(x,state.user?.email||''));
 document.querySelectorAll('.sidebar-foot .owner-mini small').forEach(x=>safeText(x,state.session?.owner?'Owner':state.session?.role));
 document.querySelectorAll('.owner-pill b').forEach(x=>safeText(x,state.session?.owner?'المالك':'موظف مخوّل'));
}
function navigate(id,force=false){
 if(!permitted(id)){say('هذا القسم غير متاح لصلاحيات حسابك.','error');return}
 const target=$(id);
 if(!target&&id==='agency-requests'){
  const elSection=el('section',{class:'section',id});
  document.querySelector('.content').append(elSection);
 }else if(!target){say('هذا القسم غير موجود.','error');return}
 state.section=id;state.version++;sequence++;
 document.querySelectorAll('.section').forEach(x=>x.classList.toggle('active',x.id===id));
 document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===id));
 document.querySelectorAll('.mobile-nav button').forEach(x=>x.classList.toggle('active',x.dataset.jump===id));
 $('sidebar').classList.remove('open');
 window.scrollTo({top:0,behavior:'instant'});
 if(!force&&id==='overview'&&$('overview').dataset.loaded==='true')return;
 const seq=sequence;
 if(id==='overview')renderOverview(seq);
 else if(id==='users')renderUsers();
 else if(id==='agencies'||id==='agency-requests')renderApplications(id);
 else if(id==='audit')renderAudit();
 else renderSupported(id);
}
async function loadDirect(fn,render,container){
 const seq=sequence;
 container?.replaceChildren(placeholder('جاري تحميل البيانات الفعلية من Supabase…'));
 try{const data=await fn();if(seq!==sequence)return;render(data)}
 catch(err){if(seq!==sequence)return;container?.replaceChildren(box('message error',err.message||'تعذر التحميل'))}
}
function renderOverview(seq){
 $('overview').dataset.loaded='true';
 const stats=[...document.querySelectorAll('#overview .stat')];
 const activities=document.querySelector('#overview .activity');
 loadDirect(()=>rpc('dashboard_overview'),data=>{
  if(seq!==sequence)return;
  const values=[['إجمالي المستخدمين',data.users],['النشطون الآن',data.active_users],
    ['الغرف النشطة',data.active_rooms],['هدايا اليوم',data.gifts_today]];
  values.forEach(([label,value],i)=>{
   stats[i]?.querySelector('label')&&(stats[i].querySelector('label').textContent=label);
   stats[i]?.querySelector('strong')&&(stats[i].querySelector('strong').textContent=money(value));
   stats[i]?.querySelector('.trend')&&(stats[i].querySelector('.trend').textContent='بيانات Supabase');
  });
 },null);
 if(allowed('audit.view')){
  loadDirect(()=>rpc('dashboard_audit_history'),rows=>{
   activities.replaceChildren();
   if(!Array.isArray(rows)||!rows.length){activities.append(placeholder('لا توجد نشاطات مسجلة.'));return}
   rows.slice(0,5).forEach(a=>{
    activities.append(box('activity-row',box('bubble','≡'),
     box('',el('b',{},a.action||'إجراء إداري'),el('p',{},a.operator_name||'حساب إداري')),
     el('time',{},date(a.created_at))));
   });
  },activities);
 }else activities.replaceChildren(placeholder('لا تملك صلاحية مشاهدة السجل الإداري.'));
}
function online(user){
 if(!user.last_seen_at)return 'غير محدد';
 const dt=Date.parse(user.last_seen_at);
 return Number.isFinite(dt)&&Date.now()-dt<15*60*1000?'نشط':'غير متصل';
}
async function renderUsers(){
 const tbody=$('userRows');
 tbody.replaceChildren(el('tr',{},el('td',{colspan:'8'},'جارٍ تحميل المستخدمين…')));
 const q=$('userSearch').value.trim().slice(0,100);
 const seq=sequence;
 try{
  const data=await rpc('dashboard_users',{p_search:q,p_limit:50});
  if(seq!==sequence)return;
  usersCache=Array.isArray(data)?data:[];
  tbody.replaceChildren();
  if(!usersCache.length){tbody.append(el('tr',{},el('td',{colspan:'8'},'لا توجد نتائج مطابقة.')));return}
  for(const u of usersCache){
   const name=u.display_name||u.username||'حساب';
   const open=el('button',{type:'button'},'فتح');
   open.addEventListener('click',()=>openUser(u));
   tbody.append(el('tr',{},
    el('td',{},box('user-cell',box('small-avatar',name.slice(0,1)),
     box('',el('b',{},name),el('div',{class:'muted'},'@'+(u.username||'—'))))),
    el('td',{},u.public_id??'—'),
    el('td',{},el('span',{class:'status'},online(u))),
    el('td',{},'VIP '+(u.vip_level??'—')),
    el('td',{},u.level??'—'),
    el('td',{class:'money'},money(u.gold)),
    el('td',{},'—'),el('td',{},box('actions',open))));
  }
 }catch(err){if(seq===sequence)tbody.replaceChildren(el('tr',{},el('td',{colspan:'8'},err.message||'تعذر التحميل')))}
}
function openUser(u){
 const name=u.display_name||u.username||'مستخدم';
 safeText($('drawerName'),name);safeText($('drawerId'),'User ID: '+u.public_id);
 safeText($('drawerVip'),'VIP '+u.vip_level);safeText($('drawerLevel'),u.level);
 safeText($('drawerAvatar'),name.slice(0,1));
 const vals=[online(u),'VIP '+(u.vip_level??'—'),u.level??'—',money(u.gold),
  date(u.last_seen_at),'غير متوفر من واجهة البحث'];
 $('userDrawer').querySelectorAll('.info b').forEach((node,i)=>safeText(node,vals[i]));
 $('userDrawer').classList.add('open');
}
async function renderApplications(id){
 const section=$(id);
 // Only Owner or specifically trusted primary partner may enter agency management.
 if(id==='agencies'&&!principal()){section.replaceChildren(placeholder('قسم إدارة الوكالات محمي.'));return}
 section.replaceChildren();
 section.append(box('header-row',box('',el('h2',{},id==='agencies'?'إدارة وكالات المضيفين':'فتح وكالات المضيفين'),
  note('الطلبات الفعلية من قاعدة البيانات. القرارات المعتمدة تُسجّل في الخادم.'))));
 const list=box('agencyRealList');
 section.append(panel(title('طلبات وكالات المضيفين'),list));
 const seq=sequence;
 try{
  const rows=await rpc('dashboard_agency_registrations');
  if(seq!==sequence)return;
  list.replaceChildren();
  if(!Array.isArray(rows)||!rows.length){list.append(placeholder('لا توجد طلبات.'));return}
  for(const r of rows){
   const reason=field('ملاحظة القرار');
   const actionArea=box('req-actions');
   const card=box('agency-request',
    box('agency-logo','★'),
    box('',el('h4',{},r.agency_name||'وكالة'),
     note((r.full_name||'—')+' • User ID '+(r.applicant_public_id||'—')+' • '+(r.country_code||'—')),
     note('الحالة: '+(r.status||'—')+' • '+date(r.submitted_at))));
   if(r.status==='pending'){
    for(const [action,label,p] of [['approve','قبول وإنشاء','agencies.approve'],['reject','رفض','agencies.reject']]){
     if(!allowed(p))continue;
     const button=btn(label,async()=>{
      const memo=reason.input.value.trim();
      if(action==='reject'&&memo.length<5)return say('سبب الرفض مطلوب (5 أحرف على الأقل).',true);
      if(!confirm('تأكيد قرار '+label+' للوكالة '+r.agency_name+'؟'))return;
      const ok=await change(()=>rpc('dashboard_agency_review',{
       p_application_id:r.id,p_action:action,p_note:memo
      }),'تم حفظ القرار.');
      if(ok)navigate(id,true);
     },'btn '+(action==='reject'?'danger':'primary'));
     actionArea.append(button);
    }
   }
   if(actionArea.childNodes.length)card.append(reason.label,actionArea);
   list.append(card);
  }
 }catch(e){if(seq===sequence)list.replaceChildren(box('message error',e.message))}
}
function renderAudit(){
 const section=$('audit');section.replaceChildren();
 const area=panel(title('سجل الإدارة'),note('كل إجراء موثق من النظام الحقيقي'));
 section.append(box('header-row',el('h2',{},'سجل التدقيق')),area);
 auditPage(area);
}
function supportedNotice(section,heading,description){
 section.replaceChildren(box('header-row',box('',el('h2',{},heading),note(description))),
  box('card',placeholder('لا توجد واجهة إدارة معتمدة من الخادم لهذا الإجراء بعد. تم الحفاظ على التصميم، ولم تُنشأ وظيفة وهمية.')));
}
function renderSupported(id){
 const section=$(id);section.replaceChildren();
 const titles={rooms:'إدارة الغرف الصوتية',moderation:'المراقبة والبلاغات',vip:'VIP والمستويات',
  economy:'الاقتصاد والخزينة',agents:'وكالات الشحن',store:'الهدايا والمتجر',
  cp:'CP والعلاقات',badges:'الشارات والوظائف',staff:'الموظفون والصلاحيات',
  notifications:'الإعلانات والإشعارات',settings:'إعدادات التطبيق',
  security:'مركز الأمان',reports:'التقارير والتحليلات'};
 section.append(box('header-row',box('',el('h2',{},titles[id]||id),note('عرض من Supabase وفق صلاحيات حسابك.'))));
 if(id==='rooms')rooms(section);
 else if(id==='moderation')tickets(section);
 else if(id==='economy')wallet(section);
 else if(id==='staff')roles(section);
 else if(id==='store'){
  if(allowed('gifts.manage'))catalog(section,'gift');
  if(allowed('store.manage'))catalog(section,'store');
 }
 else if(id==='settings')settings(section);
 else if(id==='security')health(section);
 else if(id==='reports'){
  health(section);
  if(principal()&&allowed('settlements.view'))settlements(section);
 }
 else supportedNotice(section,titles[id]||id,'الواجهة جاهزة بصرياً؛ الإجراء الإداري غير متاح دون دالة خادم مصرح بها.');
}
function showLogin(message=''){
 shell.hidden=true;gate.hidden=false;
 const info=$('authNotice');safeText(info,message);
}
function showDashboard(){
 resetPreview();permittedNav();
 gate.hidden=true;shell.hidden=false;
 navigate(isDB()?'agency-requests':isSupport()?'moderation':'overview',true);
}
async function authenticate(){
 const {data,error}=await state.client.auth.getUser();
 if(error||!data?.user){showLogin('للدخول استخدم حساب Google الإداري المخوّل.');return}
 state.user=data.user;
 await rpc('dashboard_claim_email_role');
 state.session=await rpc('dashboard_session');
 if(!state.session?.allowed){showLogin('حسابك غير مصرح له بفتح لوحة الإدارة.');return}
 showDashboard();
}
async function start(){
 if(!config?.url||!config?.key)return showLogin('لم يتم إعداد اتصال قاعدة بيانات TotiChat.');
 state.client=createClient(config.url,config.key,{
  auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 $('googleLogin').addEventListener('click',async()=>{
  $('googleLogin').disabled=true;
  try{
   const redirectTo=new URL(location.pathname,location.origin).href;
   const {error}=await state.client.auth.signInWithOAuth({
    provider:'google',options:{redirectTo,queryParams:{prompt:'select_account'}}});
   if(error)throw error;
  }catch(e){showLogin(e.message);$('googleLogin').disabled=false}
 });
 state.client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){state.session=null;state.user=null;showLogin('تم تسجيل الخروج.')}});
 document.querySelectorAll('#nav button').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page)));
 document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.jump)));
 $('menuBtn').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
 $('drawerBackdrop').addEventListener('click',()=>$('userDrawer').classList.remove('open'));
 $('drawerClose').addEventListener('click',()=>$('userDrawer').classList.remove('open'));
 $('globalSearch').addEventListener('keydown',e=>{
  if(e.key!=='Enter')return;e.preventDefault();
  if(!allowed('users.view'))return say('البحث غير مصرح لك.',true);
  $('userSearch').value=e.target.value;navigate('users',true);
 });
 $('userSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();renderUsers()}});
 $('userSearch').addEventListener('input',()=>{clearTimeout(renderUsers.timer);renderUsers.timer=setTimeout(renderUsers,350)});
 $('exportUsers').addEventListener('click',()=>{
  if(!usersCache.length)return say('لا توجد نتائج بحث لتصديرها.',true);
  const data=[['User ID','Name','Username','VIP','Level','Coins'],
   ...usersCache.map(u=>[u.public_id,u.display_name,u.username,u.vip_level,u.level,u.gold])];
  const csv=data.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
  const anchor=el('a',{href:url,download:'totichat-users.csv'});
  anchor.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
 });
 // Legacy preview controls with no real safe handler must not trigger pretend success.
 document.querySelectorAll('[onclick]').forEach(x=>x.removeAttribute('onclick'));
 document.querySelectorAll('#overview .date-filter button').forEach(x=>x.disabled=true);
 window.addEventListener('keydown',event=>{if(event.key==='Escape'){
  $('sidebar').classList.remove('open');$('userDrawer').classList.remove('open')}});
 await authenticate();
 setInterval(async()=>{
  if(!state.session?.allowed)return;
  try{const next=await rpc('dashboard_session');
   if(!next?.allowed){state.session=null;showLogin('تم إلغاء صلاحيتك الإدارية.');return}
   if(JSON.stringify(next)!==JSON.stringify(state.session)){state.session=next;permittedNav();state.refresh()}
  }catch{}
 },20000);
}
start().catch(e=>showLogin(e.message||'تعذر تشغيل اللوحة'));

import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import {state,rpc,allowed} from './context.js';
import {el,box,title,note,panel,btn,field} from './ui.js';
import {overview,users,wallet,audit,health,settings} from './pages-core.js';
import {roles,catalog,rooms,tickets} from './pages-admin.js';
import {agencies,agencyApplications} from './pages-agencies.js';
import {settlements} from './pages-finance.js';

const root=document.getElementById('app');
const config=window.TOTICHAT_ADMIN_CONFIG;
const sections=[
 ['overview','الرئيسية','dashboard.view','▦',overview],
 ['users','المستخدمون','users.view','♙',users],
 ['wallet','الخزينة والعملات','wallet.history','◈',wallet],
 ['roles','الرتب والصلاحيات','roles.view','⚿',roles],
 ['agencies','إدارة وكالات المضيفين','agencies.view','⌂',agencies],
 ['agency-applications','فتح وكالات المضيفين','agencies.view','✛',agencyApplications],
 ['settlements','تسويات الماس','settlements.view','▤',settlements],
 ['gifts','الهدايا','gifts.manage','✧',root=>catalog(root,'gift')],
 ['store','المتجر','store.manage','◇',root=>catalog(root,'store')],
 ['rooms','إدارة الغرف','rooms.view','◉',rooms],
 ['tickets','الدعم الفني','reports.view','▣',tickets],
 ['audit','سجل الإدارة','audit.view','☷',audit],
 ['health','مراقبة Beta','reports.view','◌',health],
 ['settings','إعدادات Beta','system.settings','⚙',settings]
];
const agencyPrincipal=()=>Boolean(state.session?.owner||state.session?.primary_partner===true);
const agencyOpener=()=>agencyPrincipal()||['db_employee','agency_manager'].includes(state.session?.role);
const visible=s=>{
 if(['support','customer_service'].includes(state.session?.role)&&!['tickets'].includes(s[0]))return false;
 if(['agencies','settlements'].includes(s[0]))
  return agencyPrincipal()&&allowed(s[2]);
 if(s[0]==='agency-applications')
  return agencyOpener()&&allowed('agencies.view');
 return allowed(s[2])||(s[0]==='wallet'&&(allowed('wallet.credit')||allowed('wallet.debit')));
};
function inform(message,severity='success'){
 const feedback=document.getElementById('feedback');
 if(feedback)feedback.replaceChildren(box('message'+(severity==='error'?' error':''),message));
}
state.notify=inform;
function login(message=''){
 state.version++;root.replaceChildren();
 const msg=box('loginFeedback');
 if(message)msg.append(box('message error',message));
 const google=btn('المتابعة باستخدام Google',async()=>{
  google.disabled=true;msg.replaceChildren();
  try{
   // OAuth must return to this standalone admin origin AND path, never to the user app.
   const redirectTo=new URL(window.location.pathname,window.location.origin).href;
   const {error}=await state.client.auth.signInWithOAuth({
    provider:'google',options:{redirectTo,queryParams:{prompt:'select_account'}}
   });
   if(error)throw error;
  }catch(err){
   msg.replaceChildren(box('message error',err?.message||'تعذر تسجيل الدخول. تأكد من السماح لرابط الداشبورد ضمن إعدادات Google OAuth.'));
   google.disabled=false;
  }
 },'btn primary oauthButton');
 root.append(box('loginPage',
  box('loginGlow'),
  box('login',
   box('loginLogo',
    box('logo','T'),
    el('span',{class:'loginKicker'},'ADMINISTRATIVE CONSOLE'),
    el('h1',{},'TotiChat Admin'),
    note('لوحة التحكم الرسمية المستقلة')),
   panel(box('loginHeadline',el('h2',{},'تسجيل الدخول'),note('للمالك والموظفين المخوّلين فقط')),
    msg,google)
  )
 ));
}
function render(){
 if(!state.session?.allowed){login('غير مصرح لهذا الحساب بفتح لوحة الإدارة.');return}
 const allowedTabs=sections.filter(visible);
 const selected=allowedTabs.find(s=>s[0]===state.section)||allowedTabs[0];
 if(!selected){login('لا توجد صلاحيات متاحة لهذا الحساب.');return}
 state.section=selected[0];state.version++;root.replaceChildren();
 const groupFor=id=>['overview','users','rooms','tickets'].includes(id)?'التشغيل والمتابعة':
  ['wallet','agencies','agency-applications','settlements','gifts','store'].includes(id)?'المالية والمحتوى':'الإدارة والنظام';
 const description={
  overview:'نظرة موحدة على نشاط المنصة ومؤشراتها المباشرة',
  users:'البحث عن الحسابات ومتابعة بيانات المستخدمين',
  wallet:'إدارة العملات والسجلات المالية وفق الصلاحيات',
  roles:'تعيين الموظفين وتحديد صلاحيات الوصول',
  agencies:'إدارة الوكالات والمضيفين والتارجت والمستحقات للشريكين فقط',
  'agency-applications':'فتح وكالات المضيفين ومراجعة طلباتها',
  settlements:'متابعة مستحقات المضيفين والوكالات الشهرية',
  gifts:'إدارة عناصر الهدايا وأسعارها',
  store:'مراجعة عناصر المتجر وحالتها',
  rooms:'متابعة الغرف وإجراءات الإشراف',
  tickets:'متابعة بلاغات المستخدمين والرد عليها',
  audit:'سجل موثق لإجراءات الإدارة',
  health:'مراقبة الحالة الفنية للنسخة التجريبية',
  settings:'التحكم بميزات النسخة التجريبية'
 };
 const navigation=el('nav',{'aria-label':'أقسام الإدارة',class:'navSections'});
 const closeNav=()=>{const shell=root.querySelector('.shell');shell?.classList.remove('nav-open');const trigger=root.querySelector('#mobileNavToggle');trigger?.setAttribute('aria-expanded','false')};
 let group='';
 for(const s of allowedTabs){
  const g=groupFor(s[0]);
  if(g!==group){group=g;navigation.append(el('p',{class:'navGroupLabel'},g))}
  const isActive=s[0]===state.section;
  const item=btn('',()=>{closeNav();state.section=s[0];render()},'nav'+(isActive?' active':''));
  item.append(el('span',{class:'navIcon','aria-hidden':'true'},s[3]),el('span',{class:'navText'},s[1]));
  if(isActive)item.setAttribute('aria-current','page');
  navigation.append(item);
 }
 const sidebar=el('aside',{class:'sidebar',id:'admin-sidebar'},box('brand',
   box('logo','T'),box('brandCopy',el('b',{},'TotiChat'),el('span',{},'ADMIN CENTER'))),
  box('navScroll',navigation),
  box('sidebarFoot',
   box('databaseStatus',el('span',{class:'statusDot','aria-hidden':'true'}),'قاعدة البيانات متصلة'),
   box('staffIdentity',el('span',{},state.user?.email||'—'),el('b',{},state.session.owner?'المالك الرئيسي':state.session.role))
  ));
 const feedback=box('feedback');feedback.id='feedback';feedback.setAttribute('aria-live','polite');
 const work=box('stack');work.id='workspace';
 const menuToggle=btn('☰',()=>{
  const shell=root.querySelector('.shell');
  const open=shell?.classList.toggle('nav-open');
  menuToggle.setAttribute('aria-expanded',String(Boolean(open)));
 },'btn menuToggle');
 menuToggle.id='mobileNavToggle';menuToggle.setAttribute('aria-label','فتح القائمة');
 menuToggle.setAttribute('aria-controls','admin-sidebar');menuToggle.setAttribute('aria-expanded','false');
 const logout=btn('تسجيل الخروج',async()=>{
  await state.client.auth.signOut();state.session=null;state.user=null;login();
 },'btn ghost logout');
 const main=el('main',{class:'main'},box('topbar',
  box('topbarHeading',menuToggle,box('pageHeading',
    el('div',{class:'breadcrumb'},'TotiChat Admin  /  '+groupFor(selected[0])),
    el('h1',{},selected[1]),note(description[selected[0]]||''))),
  box('toolbar',
   box('pill rolePill',state.session.owner?'المالك الرئيسي':state.session.role),
   btn('↻ تحديث',()=>render(),'btn ghost refresh'),logout)),
  feedback,work,box('mainFoot','© TotiChat • الإدارة الرسمية'));
 const backdrop=btn('',closeNav,'navBackdrop');
 backdrop.setAttribute('aria-label','إغلاق قائمة الأقسام');
 root.append(box('shell',sidebar,main,backdrop));
 selected[4](work);
}

state.refresh=render;
document.addEventListener('keydown',event=>{if(event.key==='Escape'){const shell=root.querySelector('.shell');shell?.classList.remove('nav-open');root.querySelector('#mobileNavToggle')?.setAttribute('aria-expanded','false')}});
async function authenticate(){
 try{
  const {data,error}=await state.client.auth.getUser();
  if(error||!data?.user){state.session=null;state.user=null;login();return}
  state.user=data.user;
  // Secure server-side claim links an Owner-approved email invitation to the
  // verified Google account on first sign-in; it grants no uninvited permissions.
  await rpc('dashboard_claim_email_role');
  state.session=await rpc('dashboard_session');
  if(!state.session?.allowed){login('الحساب لا يمتلك صلاحية لوحة الإدارة.');return}
  render();
 }catch(err){login(err?.message||'تعذر التحقق من الدخول.')}
}
async function start(){
 if(!config?.url||!config?.key){
  root.replaceChildren(box('message error','لم يتم تهيئة اتصال قاعدة TotiChat.'));return;
 }
 state.client=createClient(config.url,config.key,{
  auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
 });
 state.client.auth.onAuthStateChange(event=>{
  if(event==='SIGNED_OUT'){state.session=null;state.user=null;login()}
 });
 await authenticate();
 setInterval(()=>{
  if(!state.session?.allowed)return;
  void rpc('dashboard_session').then(next=>{
   if(!next?.allowed){state.session=null;login('تم إلغاء صلاحية حسابك.');return}
   if(next.role!==state.session.role||JSON.stringify(next.permissions)!==JSON.stringify(state.session.permissions)){
    state.session=next;render();
   }
  }).catch(()=>{});
 },20000);
}

start().catch(err=>root.replaceChildren(box('message error',err?.message||'تعذر تشغيل لوحة الإدارة')));

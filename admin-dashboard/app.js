import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import {state,rpc,allowed} from './context.js';
import {el,box,title,note,panel,btn,field} from './ui.js';
import {overview,users,wallet,audit,health,settings} from './pages-core.js';
import {roles,agencies,catalog,rooms,tickets} from './pages-admin.js';
import {settlements} from './pages-finance.js';

const root=document.getElementById('app');
const config=window.TOTICHAT_ADMIN_CONFIG;
const sections=[
 ['overview','الرئيسية','dashboard.view','▦',overview],
 ['users','المستخدمون','users.view','♙',users],
 ['wallet','الخزينة والعملات','wallet.history','◈',wallet],
 ['roles','الرتب والصلاحيات','roles.view','⚿',roles],
 ['agencies','الوكالات','agencies.view','⌂',agencies],
 ['settlements','تسويات الماس','settlements.view','▤',settlements],
 ['gifts','الهدايا','gifts.manage','✧',root=>catalog(root,'gift')],
 ['store','المتجر','store.manage','◇',root=>catalog(root,'store')],
 ['rooms','إدارة الغرف','rooms.view','◉',rooms],
 ['tickets','الدعم الفني','reports.view','▣',tickets],
 ['audit','سجل الإدارة','audit.view','☷',audit],
 ['health','مراقبة Beta','reports.view','◌',health],
 ['settings','إعدادات Beta','system.settings','⚙',settings]
];
const visible=s=>allowed(s[2])||(s[0]==='wallet'&&(allowed('wallet.credit')||allowed('wallet.debit')));
function inform(message,severity='success'){
 const feedback=document.getElementById('feedback');
 if(feedback)feedback.replaceChildren(box('message'+(severity==='error'?' error':''),message));
}
state.notify=inform;
function login(message=''){
 state.version++;root.replaceChildren();
 const email=field('البريد الإلكتروني','email'),password=field('كلمة المرور','password');
 const msg=box('');if(message)msg.append(box('message error',message));
 const form=el('form',{class:'stack'},email.label,password.label);
 form.append(btn('تسجيل الدخول',()=>form.requestSubmit(),'btn primary'));
 form.addEventListener('submit',async e=>{
  e.preventDefault();const b=form.querySelector('button');b.disabled=true;msg.replaceChildren();
  try{
   const {error}=await state.client.auth.signInWithPassword({email:email.input.value.trim(),password:password.input.value});
   if(error)throw error;await authenticate();
  }catch(err){msg.append(box('message error',err?.message||'فشل تسجيل الدخول'))}
  finally{b.disabled=false}
 });
 const google=btn('الدخول عبر Google',async()=>{
  const {error}=await state.client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+'/'}});
  if(error)msg.replaceChildren(box('message error',error.message));
 });
 root.append(box('login',box('loginLogo',box('logo','T'),el('h1',{},'TotiChat Admin'),
  note('لوحة الإدارة المستقلة • نفس حساب تطبيق TotiChat')),
  panel(msg,form,box('divider'),google,
   note('لا يحصل أي شخص على صلاحية بمجرد استلام الرابط. يجب أن يعيّنه المالك أولاً.'))));
}
function render(){
 if(!state.session?.allowed){login('غير مصرح لهذا الحساب بفتح لوحة الإدارة.');return}
 const allowedTabs=sections.filter(visible);
 const selected=allowedTabs.find(s=>s[0]===state.section)||allowedTabs[0];
 if(!selected){login('لا توجد صلاحيات متاحة لهذا الحساب.');return}
 state.section=selected[0];state.version++;root.replaceChildren();
 const navigation=el('nav',{'aria-label':'أقسام الإدارة'});
 for(const s of allowedTabs)navigation.append(btn(s[3]+'  '+s[1],()=>{state.section=s[0];render()},'nav'+(s[0]===state.section?' active':'')));
 const sidebar=el('aside',{class:'sidebar'},box('brand',box('logo','T'),box('',el('b',{},'TotiChat'),note('ADMIN CONTROL CENTER'))),
  navigation,box('sidebarFoot','واجهة مستقلة مرتبطة مباشرة بنفس قاعدة Supabase، مع تدقيق وصلاحيات الخادم.'));
 const feedback=box('');feedback.id='feedback';
 const work=box('stack');work.id='workspace';
 const main=el('main',{class:'main'},box('header',box('',note('المنصة الرسمية'),
  el('h1',{},selected[1]),note((state.user?.email||'—')+' • '+state.session.role)),
  box('toolbar',el('span',{class:'pill'},state.session.owner?'المالك الرئيسي':state.session.role),
  btn('تحديث',()=>render(),'btn ghost'),btn('تسجيل الخروج',async()=>{
   await state.client.auth.signOut();state.session=null;state.user=null;login();
  },'btn danger'))),feedback,work);
 root.append(box('shell',sidebar,main));
 selected[4](work);
}
state.refresh=render;
async function authenticate(){
 try{
  const {data,error}=await state.client.auth.getUser();
  if(error||!data?.user){state.session=null;state.user=null;login();return}
  state.user=data.user;state.session=await rpc('dashboard_session');
  if(!state.session?.allowed){login('الحساب لا يمتلك صلاحية لوحة الإدارة.');return}
  render();
 }catch(err){login(err?.message||'تعذر التحقق من الدخول.')}
}
async function start(){
 if(!config?.url||!config?.key){root.replaceChildren(box('message error','لم يتم ضبط عنوان Supabase ومفتاحه العام على Vercel.'));return}
 state.client=createClient(config.url,config.key,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
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

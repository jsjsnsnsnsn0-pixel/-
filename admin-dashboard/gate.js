import {el,box,panel,note,btn,field} from './ui.js';
/**
 * DEMO-ONLY convenience gate. Deliberately NEVER authenticates to Supabase.
 * Credentials are a public, weak preview convention and not security.
 * Real owner privileges require Supabase Auth AND database permissions.
 */
const previewFlag='totichat-admin-preview-open-v1';
export function clearPreviewGate(){try{sessionStorage.removeItem(previewFlag)}catch{}}
export function previewGate(root){
 try{if(sessionStorage.getItem(previewFlag)==='1')return Promise.resolve()}catch{}
 return new Promise(resolve=>{
  root.replaceChildren();
  const username=field('اسم المستخدم','text'),password=field('كلمة المرور','password');
  username.input.autocomplete='username';
  password.input.autocomplete='off';
  username.input.required=true;password.input.required=true;
  const message=box('');
  const form=el('form',{class:'stack'},username.label,password.label);
  const submit=el('button',{type:'submit',class:'btn primary'},'دخول لوحة المعاينة');
  form.append(submit);
  form.addEventListener('submit',event=>{
   event.preventDefault();message.replaceChildren();
   if(username.input.value==='admin'&&password.input.value==='admin'){
    try{sessionStorage.setItem(previewFlag,'1')}catch{}
    password.input.value='';
    resolve();
    return;
   }
   message.append(box('message error','اسم المستخدم أو كلمة المرور غير صحيحة.'));
   password.input.value='';
  });
  root.append(box('login',
   box('loginLogo',box('logo','T'),el('h1',{},'TotiChat Admin'),
    note('بوابة الدخول المؤقتة للمعاينة')),
   panel(el('h2',{},'تسجيل الدخول'),message,form,
    note('بيانات الدخول الحالية للمعاينة فقط. لا تسمح بالتحكم بالعملات أو الحسابات الحقيقية.'),
    note('للعمليات الفعلية يلزم تسجيل دخول المالك والتحقق من صلاحيات Supabase.'))
  ));
  username.input.focus();
 });
}

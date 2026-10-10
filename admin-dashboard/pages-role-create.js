import {state,rpc,change} from './context.js';
import {el,box,btn,note} from './ui.js';

// Only the pre-existing Owner and individually verified main Super Admin partner
// can edit delegated permissions. Never offer Owner or main-partner creation.
const ROLE_CATALOG=[
 {key:'extra_super',label:'Super Admin — إضافي',description:'صلاحيات مفوّضة بصورة فردية. إدارة وكالات المضيفين ليست قابلة للمنح.'},
 {key:'admin',id:'admin',label:'Admin — الإدارة',description:'تقدر تشغل وتطفي صلاحيات الإدارة المسموح تفويضها.'},
 {key:'support',id:'support',label:'Customer Service — خدمة العملاء',description:'صلاحيات الخدمة والبلاغات فقط، بدون حظر أو أموال.'},
 {key:'db',id:'agency_manager',label:'DB Employee — وكالات المضيفين',description:'فتح وكالات المضيفين ومراجعة طلباتها فقط، بدون إدارة الوكالات أو الشحن.'},
 {key:'charging_agent',label:'Charging Agent — وكيل الشحن',description:'صلاحيات داخل تطبيق TotiChat فقط؛ لا يملك دخول لوحة الإدارة.'},
 {key:'host_agent',label:'Host Agent — وكيل المضيفين',description:'صلاحيات الوكيل على مضيفيه فقط داخل التطبيق.'}
];
const APP_ONLY={
 charging_agent:[['agent_app.recharge','شحن المستخدمين'],['agent_app.history','سجل عمليات الشحن']],
 host_agent:[['host_app.own_hosts','إدارة مضيفي الوكالة'],['host_app.own_target','متابعة التارجت']]
};
const ADMIN_ALLOWED=new Set(['dashboard.view','users.view','users.edit','users.ban','users.unban','users.verify',
 'rooms.view','rooms.moderate','rooms.manage','rooms.close','reports.view','vip.manage','levels.manage','cp.manage']);
const SUPPORT_ALLOWED=new Set(['dashboard.view','reports.view']);
const DB_ALLOWED=new Set(['dashboard.view','agencies.view','agencies.approve','agencies.reject','reports.view']);
const PERMISSION_LABELS={
 'dashboard.view':'عرض لوحة التحكم',
 'users.view':'عرض المستخدمين','users.edit':'تعديل بيانات المستخدمين',
 'users.ban':'حظر مستخدم','users.unban':'رفع الحظر','users.verify':'توثيق الحسابات',
 'rooms.view':'مشاهدة الغرف','rooms.manage':'إدارة الغرف',
 'rooms.close':'إغلاق غرفة','rooms.moderate':'الإشراف على الغرف',
 'reports.view':'عرض التقارير',
 'agencies.view':'عرض طلبات وكالات المضيفين','agencies.approve':'قبول وفتح وكالة مضيفين',
 'agencies.reject':'رفض طلب وكالة',
 'agencies.manage':'إدارة وكالات المضيفين — محمية',
 'wallet.view':'عرض المحفظة','wallet.history':'سجل العملات',
 'wallet.credit':'إضافة Coins','wallet.debit':'خصم Coins',
 'settlements.view':'عرض التسويات','settlements.run':'تنفيذ التسويات',
 'audit.view':'عرض السجل الإداري','roles.manage':'تعديل صلاحيات الموظفين'
};
const OWNER_ONLY=/^(wallet\.|settlements\.|system\.|roles\.|audit\.|hosts\.|agencies\.manage$)/;
const EXTRA_BLOCKED=/^(agencies\.|hosts\.|settlements\.|roles\.|system\.)/;
const isPrincipal=()=>state.session?.owner===true||state.session?.primary_partner===true;
const sectionOf=p=>{
 if(p.startsWith('dashboard.'))return 'الدخول للوحة';
 if(p.startsWith('users.'))return 'إدارة المستخدمين';
 if(p.startsWith('rooms.'))return 'الغرف الصوتية';
 if(p.startsWith('reports.'))return 'التقارير والبلاغات';
 if(p.startsWith('agencies.')||p.startsWith('hosts.'))return 'الوكالات';
 if(p.startsWith('wallet.'))return 'العملات والخزينة';
 if(p.startsWith('agent_app.')||p.startsWith('host_app.'))return 'وظائف داخل التطبيق';
 return 'إدارة النظام والمحتوى';
};
function capabilities(role,all){
 if(role.key==='admin')return all.filter(p=>ADMIN_ALLOWED.has(p));
 if(role.key==='support')return all.filter(p=>SUPPORT_ALLOWED.has(p));
 if(role.key==='db')return all.filter(p=>DB_ALLOWED.has(p));
 if(role.key==='extra_super')return all.filter(p=>!EXTRA_BLOCKED.test(p)&&!OWNER_ONLY.test(p));
 if(APP_ONLY[role.key])return APP_ONLY[role.key].map(p=>p[0]);
 return [];
}
const getTemplate=(data,role)=>(data.roles||[]).find(r=>r.id===role.id);
const roles=ROLE_CATALOG;
export function addRoleToolbar(work,data){
 document.querySelectorAll('.rankModal').forEach(el=>el.remove());
 const principal=isPrincipal();
 const trigger=btn('＋ إضافة رتبة / تعديل صلاحيات',()=>open(),'btn primary rankAddButton',!principal);
 const header=work.closest('.section')?.querySelector('.header-row')||work.querySelector('.header-row');
 const headingBar=box('rankActionBar',
  box('rankActionTitle',el('strong',{},'التحكم بتشغيل وإيقاف الصلاحيات'),
   note('إنت وشريكك الرئيسي فقط تكدرون تختارون الرتبة وتفعّلون أو توقفون صلاحياتها.')),
  trigger);
 if(header)header.append(trigger);else work.insertBefore(headingBar,work.firstChild);
 if(!principal)return trigger;
 const modal=box('rankModal');modal.hidden=true;
 let activeKey='',active=new Set(),original=new Set(),focusBefore;
 const shading=box('rankModalShade');shading.addEventListener('click',close);
 const selector=el('select',{id:'rankRoleSelect','aria-label':'اختر الرتبة'},
  el('option',{value:''},'اختر الرتبة...'),
  ...roles.map(r=>el('option',{value:r.key},r.label)));
 const currentActor=box('rankActorInfo',
  el('span',{class:'rankActorIcon'},'✦'),
  box('',el('strong',{},state.session?.owner?'التحكم: المالك الرئيسي':'التحكم: الشريك الرئيسي Super Admin'),
   note('حساب إداري مخوّل • كل عملية حفظ تخضع لتصريح الخادم')));
 const help=box('rankDialogInfo','اختر رتبة حتى تشوف صلاحياتها.');
 const permittedCounter=el('span',{class:'rankPermissionCounter'},'0 صلاحيات مفعّلة');
 const grid=box('rankPermissionGrid');
 const warning=box('rankSecurityNote','Owner والشريك الرئيسي حسابان محميان؛ إدارة وكالات المضيفين حصرية لهما.');
 const feedback=box('rankPreviewNote',
  'تگدر تشغل وتطفي أي صلاحية قابلة للتفويض. الحفظ الفعلي يحتاج اعتماد الـBackend، وماكو تعديل وهمي على قاعدة البيانات.');
 const saveButton=btn('حفظ تغييرات الصلاحيات',()=>void save(),'btn primary rankSave',true);
 const cancel=btn('إلغاء',close,'btn ghost');
 const dialog=el('section',{class:'rankModalDialog',role:'dialog','aria-modal':'true',
  'aria-labelledby':'rankDialogTitle',tabindex:'-1'},
  box('rankModalHeader',
   box('',el('small',{},'TOTICHAT / RBAC'),el('h2',{id:'rankDialogTitle'},'تشغيل وإيقاف الصلاحيات')),
   btn('×',close,'rankModalClose')),
  box('rankModalBody',currentActor,feedback,
   el('label',{class:'rankLabel',htmlFor:'rankRoleSelect'},'الرتبة التي تريد التحكم بصلاحياتها'),
   selector,help,box('rankDivider',el('strong',{},'الصلاحيات القابلة للتحكم'),permittedCounter),
   grid,warning),
  box('rankModalFooter',cancel,saveButton));
 modal.append(shading,dialog);document.body.append(modal);
 function open(){
  focusBefore=document.activeElement;
  modal.hidden=false;document.body.classList.add('rankModalOpen');
  selector.value='';renderPermissions();selector.focus();
 }
 function close(){
  modal.hidden=true;document.body.classList.remove('rankModalOpen');
  focusBefore?.focus?.();
 }
 function count(){
  permittedCounter.textContent=active.size+' صلاحيات مفعّلة';
  for(const sw of grid.querySelectorAll('[role="switch"]')){
   sw.setAttribute('aria-checked',String(sw.checked));
  }
 }
 function renderPermissions(){
  activeKey=selector.value;
  grid.replaceChildren();active=new Set();original=new Set();
  const role=roles.find(r=>r.key===activeKey);
  if(!role){help.textContent='اختر رتبة حتى تگدر تشغل وتطفي صلاحياتها.';warning.textContent='رتبة Owner غير متاحة للإضافة أو التعديل.';saveButton.disabled=true;count();return}
  help.textContent=role.description;
  const template=getTemplate(data,role);
  const current=new Set(template?.permissions||[]);
  original=current;
  const serverPermissions=data.permissions||[];
  const permitted=capabilities(role,serverPermissions);
  // Show previously granted permissions too, even if no longer delegable.
  // Such legacy privileges may be switched OFF, but cannot be switched ON.
  const shown=[...new Set([...permitted,...current])];
  const isAppOnly=Boolean(APP_ONLY[role.key]);
  const supported=Boolean(template)&&['admin','support','db'].includes(role.key);
  for(const name of shown){
   const canStart=current.has(name);
   if(canStart)active.add(name);
  }
  const categories={};
  for(const name of shown){
   const group=sectionOf(name);
   (categories[group]??=[]).push(name);
  }
  for(const [group,names] of Object.entries(categories)){
   const panel=box('rankGroup',el('h3',{},group));
   for(const permission of names){
    const isEnabled=active.has(permission);
    const canEnable=permitted.includes(permission);
    const check=el('input',{type:'checkbox',value:permission,checked:isEnabled,role:'switch',
     disabled:!canEnable&&!isEnabled,
     'aria-label':'تشغيل أو إيقاف '+(PERMISSION_LABELS[permission]||permission),
     'aria-checked':String(isEnabled)});
    check.addEventListener('change',()=>{
     if(check.checked&&!canEnable){check.checked=false;return}
     if(check.checked)active.add(permission);else active.delete(permission);
     // An existing legacy privilege can be revoked, not re-granted.
     if(!canEnable&&!check.checked)check.disabled=true;
     count();
    });
    panel.append(el('label',{class:'rankPermission rankPermissionSwitch'},
      box('rankPermissionInfo',el('strong',{},PERMISSION_LABELS[permission]||permission),
       el('small',{},permission+' • '+(isAppOnly?'داخل التطبيق؛ الربط مطلوب':
        canEnable?'شغّل أو طفّي الصلاحية':'صلاحية سابقة — الإيقاف فقط'))),
      check));
   }
   grid.append(panel);
  }
  if(!permitted.length){
   grid.append(note('لا توجد صلاحيات قابلة للتفويض لهذه الرتبة في قائمة الخادم الحالية.'));
  }
  if(role.key==='extra_super')
   warning.textContent='لا يمكن منح Super Admin إضافي إدارة وكالات المضيفين. حفظ التفويض الفردي يتطلب API محمياً لكل حساب.';
  else if(role.key==='db')
   warning.textContent='موظف DB لا يحصل على إدارة وكالات المضيفين ولا وكالات الشحن؛ صلاحياته ضمن الطلبات فقط.';
  else if(isAppOnly)
   warning.textContent='هذه صلاحيات داخل التطبيق وليست دخولاً للداشبورد. يمكن تجربتها بصرياً، لكن حفظها يحتاج Backend التطبيق.';
  else warning.textContent='Owner والشريك الرئيسي محميان. أي تغيير هنا يطبّق على قالب الرتبة، وليس على صلاحيات Owner.';
  // The exact RPC exists, but currently only permits Owner. The partner can
  // operate all switches; the server will deny save until trusted identity
  // and delegated role changes are deployed. Never simulate success.
  saveButton.disabled=!supported||!permitted.length;
  saveButton.textContent=supported?'حفظ تشغيل/إيقاف الصلاحيات':'الحفظ يحتاج ربطاً محمياً';
  feedback.textContent=supported
   ?(state.session?.owner?'الخيارات تعمل فعلياً. حفظ التغييرات يستخدم RPC الخادم الموجود، ولا يتم قبل التأكيد.':
      'إنت كشريك تگدر تتحكم بالخيارات، لكن الخادم الحالي ما يسمح بحفظ الشريك بعد؛ ما راح نسوي حفظ وهمي.')
   :'تشغيل وإيقاف الخيارات قابل للتجربة. الحفظ الفعلي لهذه الرتبة يحتاج API محمياً مناسباً.';
  count();
 }
 async function save(){
  const role=roles.find(r=>r.key===activeKey),template=role&&getTemplate(data,role);
  if(!isPrincipal()||!template||!['admin','support','db'].includes(role.key))return;
  const safe=new Set(capabilities(role,data.permissions||[]));
  // Revoke legacy permissions that the operator explicitly switched off.
  // No forbidden permission can be granted through this editor.
  const payload=[...new Set([...original].filter(x=>active.has(x)),
   ...[...active].filter(x=>safe.has(x)))];
  // Work with the existing RPC; it enforces Owner server-side and currently
  // refuses the partner. A rejected RPC yields an honest error, not fake UI.
  if(!confirm('تأكيد تعديل قالب '+role.label+'؟ راح تتغير صلاحيات كل موظف عنده نفس الرتبة.'))return;
  saveButton.disabled=true;
  const ok=await change(()=>rpc('dashboard_save_role',{
   p_role:role.id,p_label:template.label,p_permissions:payload
  }),'تم حفظ التغييرات بالصلاحيات الحقيقية.',false);
  if(ok){close();state.refresh?.()}else saveButton.disabled=false;
 }
 selector.addEventListener('change',renderPermissions);
 document.addEventListener('keydown',event=>{
  if(modal.hidden)return;
  if(event.key==='Escape'){event.preventDefault();close()}
 });
 return trigger;
}

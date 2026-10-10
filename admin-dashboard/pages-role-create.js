import {state,rpc,change} from './context.js';
import {el,box,btn,note} from './ui.js';

// Approved TotiChat roles: this UI never promotes a user, alters balances or
// creates new database role identifiers by itself. The server is authoritative.
const roles=[
 {key:'owner',label:'Owner — المالك الرئيسي',description:'حساب المالك الوحيد، محمي من الاستنساخ أو تعديل صلاحياته.',readonly:true},
 {key:'primary_partner',label:'Super Admin — الشريك الرئيسي',description:'هوية الشريك الرئيسي محمية؛ لا تُمنح صلاحياته لرتبة Super Admin أخرى.',readonly:true},
 {key:'extra_super',label:'Super Admin — إضافي',description:'صلاحيات الموظف الإضافي فردية؛ ليس له دخول إدارة وكالات المضيفين.',readonly:true},
 {key:'admin',id:'admin',label:'Admin — الإدارة',description:'السياسات والتقارير والطلبات، مع صلاحيات إضافية محدودة بالتفويض.',readonly:false},
 {key:'support',id:'support',label:'Customer Service — خدمة العملاء',description:'البنرات والتقارير ومشاهدة البلاغات فقط.',readonly:true},
 {key:'db',id:'agency_manager',label:'DB Employee — وكالات المضيفين',description:'فتح وكالات المضيفين والتقرير اليومي فقط؛ دون إدارة الوكالات أو فتح وكالات الشحن.',readonly:true},
 {key:'charging_agent',label:'Charging Agent — وكيل الشحن',description:'صلاحيات داخل تطبيق TotiChat فقط، دون دخول لوحة الإدارة.',readonly:true},
 {key:'host_agent',label:'Host Agent — وكيل المضيفين',description:'صلاحيات داخل تطبيق TotiChat فقط، دون دخول لوحة الإدارة.',readonly:true}
];
const category=name=>{
 if(name.startsWith('users.'))return 'المستخدمون';
 if(name.startsWith('rooms.'))return 'الغرف الصوتية';
 if(name.startsWith('reports.')||name.startsWith('tickets.'))return 'التقارير والبلاغات';
 if(name.startsWith('agencies.'))return 'وكالات المضيفين';
 if(name.startsWith('wallet.'))return 'الخزينة والعملات';
 if(name.startsWith('roles.'))return 'الموظفون والرتب';
 return 'عمليات أخرى';
};
const blockedForAdmin=name=>/^(wallet\.|agencies\.|settlements\.|roles\.|system\.|audit\.|staff\.|treasury\.)/.test(name);
function originalRole(data,id){return (data.roles||[]).find(r=>r.id===id)}
function permissionSet(data,role){
 if(role.key==='owner'||role.key==='primary_partner')return data.permissions||[];
 if(role.key==='extra_super'){
  return (data.permissions||[]).filter(x=>!/^agencies\.|^settlements\.|^roles\.|^system\./.test(x));
 }
 if(role.key==='admin')return (data.permissions||[]).filter(p=>!blockedForAdmin(p));
 if(role.key==='support')return (data.permissions||[]).filter(p=>['reports.view','reports.submit','tickets.view','banners.submit'].includes(p));
 if(role.key==='db')return (data.permissions||[]).filter(p=>['agencies.approve','agencies.reject','reports.submit'].includes(p));
 return [];
}
export function addRoleToolbar(work,data){
 // Reuses the existing Supabase-provided role/permission catalog. The active
 // Owner alone can edit the Admin role template via the existing RPC.
 const openButton=btn('＋ إضافة رتبة',open,'btn primary rankAddButton',!state.session?.owner);
 const bar=box('rankActionBar',
  box('rankActionTitle',el('strong',{},'إنشاء وتحديد صلاحيات رتبة'),note('اختر من الرتب المتفق عليها وراجع الصلاحيات المسموحة.')),
  openButton);
 work.insertBefore(bar,work.firstChild);
 const modal=box('rankModal');
 modal.hidden=true;
 const shade=box('rankModalShade');
 shade.addEventListener('click',close);
 const heading=el('h2',{id:'rankDialogTitle'},'إضافة رتبة');
 const closeButton=btn('×',close,'rankModalClose');
 closeButton.setAttribute('aria-label','إغلاق');
 const select=el('select',{id:'rankRoleSelect'},el('option',{value:''},'اختر الرتبة...'),
  ...roles.map(r=>el('option',{value:r.key},r.label)));
 const intro=box('rankDialogInfo','اختر الرتبة حتى تظهر الصلاحيات');
 const counter=el('span',{class:'rankPermissionCounter'},'0 صلاحيات');
 const grid=box('rankPermissionGrid');
 const warning=box('rankSecurityNote','إدارة وكالات المضيفين محفوظة فقط للمالك وشريكه الرئيسي.');
 const saveButton=btn('حفظ إعدادات الرتبة',save,'btn primary rankSave',true);
 const cancelButton=btn('إلغاء',close,'btn ghost');
 const body=box('rankModalBody',
  box('rankPreviewNote','تُقرأ الصلاحيات من Supabase. الحفظ الفعلي متاح فقط للرتب التي يدعمها الخادم ومصرح لك بتعديلها.'),
  el('label',{class:'rankLabel',htmlFor:'rankRoleSelect'},'الرتبة المعتمدة'),
  select,intro,box('rankDivider',el('strong',{},'الصلاحيات'),counter),grid,warning);
 const dialog=el('section',{class:'rankModalDialog',role:'dialog','aria-modal':'true',
  'aria-labelledby':'rankDialogTitle',tabindex:'-1'},
  box('rankModalHeader',box('',el('small',{},'TotiChat • ROLES'),heading),closeButton),
  body,box('rankModalFooter',cancelButton,saveButton));
 modal.append(shade,dialog);
 document.body.append(modal);
 let current='',selected=new Set(),lastFocus=null;
 const groups=(data.permissions||[]).reduce((acc,p)=>{
  const name=category(p);(acc[name]??=[]).push(p);return acc;
 },{});
 function open(){
  lastFocus=document.activeElement;modal.hidden=false;document.body.classList.add('rankModalOpen');
  select.value='';fill();select.focus();
 }
 function close(){modal.hidden=true;document.body.classList.remove('rankModalOpen');lastFocus?.focus?.()}
 function fill(){
  current=select.value;
  const role=roles.find(x=>x.key===current);
  grid.replaceChildren();selected.clear();
  if(!role){intro.textContent='اختر رتبة لتظهر صلاحياتها.';saveButton.disabled=true;counter.textContent='0 صلاحيات';return}
  intro.textContent=role.description;
  const template=originalRole(data,role.id);
  selected=new Set(template?.permissions||[]);
  const canSave=state.session?.owner===true&&role.key==='admin'&&Boolean(template);
  const permitted=permissionSet(data,role);
  const permissibleSet=new Set(permitted);
  // Avoid promoting existing templates indirectly. Non-supported roles are
  // intentionally visible but read-only until server individual grants exist.
  warning.textContent=role.key==='extra_super'
   ?'صلاحيات Super Admin الإضافي يجب أن تُحفظ لكل حساب فردياً. الخادم الحالي لا يدعم إنشاء هذا التفويض بعد.'
   :role.key==='owner'||role.key==='primary_partner'
   ?'المالك والشريك الرئيسي حسابان محميان، ولا يمكن إنشاء نسخة أخرى من أي منهما.'
   :role.key==='db'?'موظف DB لا يستطيع فتح وكالات الشحن أو إدارة وكالات المضيفين بعد فتحها.'
   :role.key==='charging_agent'||role.key==='host_agent'
   ?'هذه الرتبة تعمل داخل التطبيق ولا تفتح Admin Dashboard.'
   :role.key==='support'?'خدمة العملاء لديها الصلاحيات الثلاث المحددة بالاتفاق فقط.'
   :'صلاحيات الوكالات والأموال والرتب الحساسة غير قابلة للإضافة إلى قالب Admin.';
  for(const [groupName,items] of Object.entries(groups)){
   const column=box('rankGroup',el('h3',{},groupName));
   for(const p of items){
    const editable=canSave&&permissibleSet.has(p);
    const input=el('input',{type:'checkbox',value:p,checked:selected.has(p),disabled:!editable});
    input.addEventListener('change',()=>{if(input.checked)selected.add(p);else selected.delete(p);count()});
    column.append(el('label',{class:'rankPermission'+(editable?'':' locked')},
     input,box('',el('strong',{},p),el('small',{},editable?'يمكن تفويضها لهذه الرتبة':'محمية أو غير متاحة لهذه الرتبة'))));
   }
   grid.append(column);
  }
  if(!Object.keys(groups).length)grid.append(note('لا توجد قائمة صلاحيات من الخادم حالياً.'));
  saveButton.disabled=!canSave;saveButton.textContent=canSave?'حفظ صلاحيات Admin':'تتطلب إعداداً محمياً على الخادم';
  count();
 }
 function count(){counter.textContent=selected.size+' صلاحيات'}
 async function save(){
  const role=roles.find(x=>x.key===current);
  if(!role||role.key!=='admin'||!state.session?.owner)return;
  const baseline=new Set(originalRole(data,role.id)?.permissions||[]);
  const safe=new Set(permissionSet(data,role));
  // Never silently remove preexisting protected privileges from a template
  // nor grant new ones outside the allowed set.
  const keep=[...baseline].filter(p=>!safe.has(p));
  const granted=[...selected].filter(p=>safe.has(p));
  const permissions=[...new Set([...keep,...granted])];
  if(!confirm('حفظ صلاحيات قالب Admin؟ هذا التعديل يطال جميع الحسابات بهذه الرتبة.'))return;
  saveButton.disabled=true;
  const ok=await change(()=>rpc('dashboard_save_role',{
   p_role:role.id,p_label:originalRole(data,role.id)?.label||role.label,p_permissions:permissions
  }),'تم تحديث قالب Admin في قاعدة البيانات.',false);
  if(ok){close();state.refresh?.()}else saveButton.disabled=false;
 }
 select.addEventListener('change',fill);
 cancelButton.addEventListener('click',close);
 const esc=e=>{
  if(modal.hidden)return;
  if(e.key==='Escape'){e.preventDefault();close()}
 };
 document.addEventListener('keydown',esc);
 // Clear modal on route cleanup is handled by the host view lifecycle. A
 // detached modal never receives privileged account data.
 return openButton;
}

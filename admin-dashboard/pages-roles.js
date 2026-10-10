import {state,rpc,change,load} from './context.js';
import {el,box,panel,title,note,btn,field} from './ui.js';
import {addRoleToolbar} from './pages-role-create.js';

const ROLE_LABELS={
 owner:'Owner — المالك',super_admin:'Super Admin',
 admin:'Admin — الإدارة',support:'خدمة العملاء',
 agency_manager:'DB Employee — وكالات المضيفين',
 agent:'وكيل الشحن',host:'وكيل المضيفين'
};
export function roles(work){
 const result=panel(title('الصلاحيات والرتب الحالية'));
 work.append(result);
 load(result,()=>rpc('dashboard_roles_state'),data=>{
  const principal=state.session?.owner===true||state.session?.primary_partner===true;
  const templates=data.roles||[];
  if(principal)addRoleToolbar(work,data);
  result.append(title('الرتب المسجلة في النظام'),
   note('يتم قراءة الرتب والصلاحيات الحقيقية من Supabase. المالك وشريكه الرئيسي وحدهما يملكان واجهة تشغيل وإيقاف الصلاحيات.'));
  const listing=box('rankRegisteredList');
  for(const role of templates.filter(r=>r.id!=='user')){
   const protectedRole=['owner','super_admin'].includes(role.id);
   const item=box('rankRegisteredCard',
    box('rankRegisteredTitle',
     el('strong',{},ROLE_LABELS[role.id]||role.label||role.id),
     el('span',{class:'rankRegisteredCount'},(role.permissions||[]).length+' صلاحيات')),
    note(protectedRole?'رتبة محمية — لا يمكن إنشاء نسخة ثانية أو تفويض إدارة وكالات المضيفين لرتبة إضافية':
      'تقدر تشغل وتطفي الصلاحيات المتاحة من زر إضافة رتبة / تعديل صلاحيات'));
   listing.append(item);
  }
  if(!listing.childNodes.length)listing.append(note('لا توجد رتب متاحة.'));
  result.append(listing);
  if(!state.session?.owner)return;
  const staffEmail=field('البريد الإلكتروني للموظف','email');
  staffEmail.input.required=true;staffEmail.input.placeholder='employee@gmail.com';
  staffEmail.input.autocomplete='email';
  const choices=templates.filter(r=>['admin','support','agency_manager'].includes(r.id));
  const rank=el('select',{ 'aria-label':'رتبة الموظف'},
   ...choices.map(r=>el('option',{value:r.id},ROLE_LABELS[r.id]||r.label)),
   el('option',{value:'user'},'إلغاء صلاحية الداشبورد'));
  const assign=el('form',{class:'stack'},
   staffEmail.label,el('label',{class:'field'},el('span',{},'الرتبة'),rank));
  assign.append(btn('حفظ رتبة الموظف',()=>assign.requestSubmit(),'btn primary'));
  assign.addEventListener('submit',async event=>{
   event.preventDefault();
   const email=staffEmail.input.value.trim().toLowerCase();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return state.notify('اكتب بريداً إلكترونياً صحيحاً.','error');
   const role=rank.value;
   if(!confirm('تأكيد '+(role==='user'?'إلغاء صلاحيات':'منح رتبة '+role)+' للحساب '+email+'؟'))return;
   await change(()=>rpc('dashboard_assign_role_by_email',{p_email:email,p_role:role}),
    role==='user'?'تم إلغاء صلاحيات هذا البريد.':'تم حفظ الصلاحية في قاعدة البيانات.');
  });
  work.append(panel(title('تعيين موظف عبر Google'),
   note('الربط عبر بريد Google المؤكد. لا يمكن تعيين Owner أو شريك رئيسي إضافي من هذا النموذج.'),
   assign));
  const staffPanel=panel(title('الموظفون والدعوات'));work.append(staffPanel);
  load(staffPanel,()=>rpc('dashboard_staff_email_invites_list'),items=>{
   staffPanel.append(title('سجل الموظفين'));
   if(!items?.length){staffPanel.append(note('لا توجد دعوات موظفين.'));return}
   const entries=box('list');
   for(const item of items){
    entries.append(box('item',el('b',{},item.email),
     note('الرتبة: '+(ROLE_LABELS[item.role]||item.role)+' • '+(item.active?'حساب Google مرتبط':'بانتظار التسجيل'))));
   }
   staffPanel.append(entries);
  });
 });
}

import {state,rpc,change,load} from './context.js';
import {el,box,panel,title,note,btn,field} from './ui.js';

export function roles(work){
 const result=panel(title('نظام رتب الموظفين'));work.append(result);
 load(result,()=>rpc('dashboard_roles_state'),data=>{
  const choices=data.roles||[],permissions=data.permissions||[];
  result.append(title('صلاحيات كل رتبة'));
  const picker=el('select',{},...choices.filter(x=>['super_admin','admin','support','agency_manager'].includes(x.id))
   .map(x=>el('option',{value:x.id},x.label)));
  const roleId=field('كود الرتبة'),label=field('اسم الرتبة');
  const checkGrid=box('checks');
  function fill(){
   const current=choices.find(x=>x.id===picker.value);
   roleId.input.value=current?.id||'';label.input.value=current?.label||'';
   checkGrid.replaceChildren(...permissions.map(permission=>
    el('label',{},el('input',{type:'checkbox',value:permission,
     checked:current?.permissions?.includes(permission),disabled:!state.session.owner||picker.value==='super_admin'}),permission)));
  }
  picker.addEventListener('change',fill);fill();
  const editor=el('form',{class:'stack'},el('label',{class:'field'},el('span',{},'الرتبة'),picker),
   box('fields',roleId.label,label.label),checkGrid);
  editor.append(note('تنبيه: تعديل قالب رتبة يغير صلاحيات جميع أصحابها. قوالب Super Admin محمية إلى حين تفعيل الصلاحيات الفردية.'),btn('حفظ الرتبة والصلاحيات',()=>editor.requestSubmit(),'btn primary',!state.session.owner||picker.value==='super_admin'));
  editor.addEventListener('submit',event=>{
   event.preventDefault();if(!state.session.owner||picker.value==='super_admin')return;
   const grants=[...checkGrid.querySelectorAll('input:checked')].map(x=>x.value);
   change(()=>rpc('dashboard_save_role',{p_role:roleId.input.value.trim(),
    p_label:label.input.value.trim(),p_permissions:grants}));
  });
  result.append(editor);
  if(!state.session.owner)return;
  const staffEmail=field('البريد الإلكتروني للموظف','email');
  staffEmail.input.required=true;
  staffEmail.input.placeholder='employee@gmail.com';
  staffEmail.input.autocomplete='email';
  const rank=el('select',{},
   ...choices.filter(x=>['admin','support','agency_manager'].includes(x.id))
     .map(x=>el('option',{value:x.id},x.label)),
   el('option',{value:'user'},'إلغاء صلاحية الداش بورد'));
  const assign=el('form',{class:'stack'},
   staffEmail.label,
   el('label',{class:'field'},el('span',{},'الرتبة'),rank));
  const assignButton=btn('حفظ رتبة الموظف',()=>assign.requestSubmit(),'btn primary');
  assign.append(assignButton);
  assign.addEventListener('submit',async event=>{
   event.preventDefault();
   const email=staffEmail.input.value.trim().toLowerCase();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return state.notify('اكتب بريداً إلكترونياً صحيحاً.','error');
   const role=rank.value;
   if(!confirm('تأكيد '+(role==='user'?'إلغاء صلاحيات':'منح رتبة '+role)+' للحساب '+email+'؟'))return;
   await change(()=>rpc('dashboard_assign_role_by_email',{
    p_email:email,p_role:role
   }),role==='user'?'تم إلغاء صلاحيات هذا البريد.':'تم حفظ الصلاحية في قاعدة البيانات.');
  });
  work.append(panel(title('تعيين الموظفين عن طريق البريد'),
   note('تعيين Super Admin إضافي يحتاج نظام صلاحيات فردية محمي في الخادم قبل تفعيله. وكلاء الشحن والمضيفين يستخدمون التطبيق ولا يسجلون دخولاً إدارياً.'),
   note('حدد بريد الموظف المرتبط بحسابه في Google، ثم اختر الرتبة. إذا لم يسجل بعد، تحفظ الدعوة وتتفعل عند دخوله بنفس البريد.'),
   assign));
  const staffPanel=panel(title('الموظفون والدعوات'));
  work.append(staffPanel);
  load(staffPanel,()=>rpc('dashboard_staff_email_invites_list'),items=>{
   staffPanel.append(title('سجل رتب الموظفين'));
   if(!items?.length){staffPanel.append(note('لا توجد رتب موظفين معيّنة بالبريد حالياً.'));return}
   const entries=box('list');
   for(const item of items){
    entries.append(box('item',
     el('b',{},item.email),
     note('الرتبة: '+item.role+' • '+(item.active?'مرتبطة بحساب فعلي':'بانتظار تسجيل Google'))));
   }
   staffPanel.append(entries);
  });
 });
}

import {state,rpc,change,load} from './context.js';
import {el,box,panel,title,note,btn,field} from './ui.js';

export function roles(work){
 const result=panel(title('نظام رتب الموظفين'));work.append(result);
 load(result,()=>rpc('dashboard_roles_state'),data=>{
  const choices=data.roles||[],permissions=data.permissions||[];
  result.append(title('صلاحيات كل رتبة'));
  const picker=el('select',{},...choices.filter(x=>!['owner','user'].includes(x.id))
   .map(x=>el('option',{value:x.id},x.label)));
  const roleId=field('كود الرتبة'),label=field('اسم الرتبة');
  const checkGrid=box('checks');
  function fill(){
   const current=choices.find(x=>x.id===picker.value);
   roleId.input.value=current?.id||'';label.input.value=current?.label||'';
   checkGrid.replaceChildren(...permissions.map(permission=>
    el('label',{},el('input',{type:'checkbox',value:permission,
     checked:current?.permissions?.includes(permission),disabled:!state.session.owner}),permission)));
  }
  picker.addEventListener('change',fill);fill();
  const editor=el('form',{class:'stack'},el('label',{class:'field'},el('span',{},'الرتبة'),picker),
   box('fields',roleId.label,label.label),checkGrid);
  editor.append(btn('حفظ الرتبة والصلاحيات',()=>editor.requestSubmit(),'btn primary',!state.session.owner));
  editor.addEventListener('submit',event=>{
   event.preventDefault();if(!state.session.owner)return;
   const grants=[...checkGrid.querySelectorAll('input:checked')].map(x=>x.value);
   change(()=>rpc('dashboard_save_role',{p_role:roleId.input.value.trim(),
    p_label:label.input.value.trim(),p_permissions:grants}));
  });
  result.append(editor);
  if(!state.session.owner)return;
  const person=field('ID الموظف','number');
  const rank=el('select',{},...choices.filter(x=>x.id!=='owner')
   .map(x=>el('option',{value:x.id},x.label)));
  const assign=el('form',{class:'stack'},box('fields',person.label,
   el('label',{class:'field'},el('span',{},'رتبة الموظف'),rank)));
  assign.append(btn('تعيين الصلاحيات للموظف',()=>assign.requestSubmit(),'btn primary'));
  assign.addEventListener('submit',event=>{
   event.preventDefault();const id=Number(person.input.value);
   if(!Number.isSafeInteger(id)||id<1)return state.notify('ID غير صحيح','error');
   if(!confirm('تأكيد منح رتبة '+rank.value+' للمستخدم ID '+id+'؟'))return;
   change(()=>rpc('dashboard_assign_role',{p_public_id:id,p_role:rank.value}));
  });
  work.append(panel(title('تعيين الموظفين'),note('رابط الموقع وحده لا يمنح الصلاحيات.'),assign));
 });
}

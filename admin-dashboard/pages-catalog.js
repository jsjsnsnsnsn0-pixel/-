import {state,rpc,load,change} from './context.js';
import {el,box,panel,title,note,btn,field,rows,money} from './ui.js';

export function catalog(work,kind){
 const gift=kind==='gift';
 const label=gift?'الهدايا':'المتجر';
 const holder=panel(title('إدارة '+label));work.append(holder);
 const reader=gift?'dashboard_gift_catalog':'dashboard_store_catalog';
 const writer=gift?'dashboard_update_gift':'dashboard_update_store';
 load(holder,()=>rpc(reader),data=>{
  holder.append(title('عناصر '+label));
  rows(holder,data,item=>{
   const amount=field('سعر الوحدة','number',String(item.price));
   const reason=field('سبب تعديل العنصر (10 أحرف على الأقل)');
   const enabled=el('select',{},el('option',{value:'true'},'مفعّل'),el('option',{value:'false'},'معطّل'));
   enabled.value=String(item.is_active);
   const card=box('item',el('b',{},item.name+' • '+item.id),
    note('السعر الحالي: '+money(item.price)),
    box('fields',amount.label,el('label',{class:'field'},el('span',{},'الحالة'),enabled)),reason.label);
   card.append(btn('حفظ تعديلات العنصر',()=>{
    const value=Number(amount.input.value),memo=reason.input.value.trim();
    if(!Number.isSafeInteger(value)||value<1||value>1e10||memo.length<10){
     state.notify('السعر أو سبب التعديل غير صالح.','error');return;
    }
    if(!confirm('تأكيد تحديث '+item.name+'؟'))return;
    change(()=>rpc(writer,{p_id:item.id,p_price:value,p_enabled:enabled.value==='true',p_reason:memo}),
     'حُفظت التغييرات في قاعدة البيانات.');
   },'btn primary'));
   return card;
  });
 });
}

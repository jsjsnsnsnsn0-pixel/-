import {state,rpc,load,change,allowed} from './context.js';
import {el,box,panel,title,note,btn,field,rows,money,date,toNumber} from './ui.js';

export function wallet(work){
 if(allowed('wallet.credit')||allowed('wallet.debit')){
  const target=field('ID المستخدم','number'),amount=field('تعديل Coins (+ إضافة / − خصم)','number');
  const reason=field('سبب العملية (10 أحرف على الأقل)');
  target.input.id='walletTarget';
  for(const i of [target.input,amount.input,reason.input])
   i.addEventListener('input',()=>{state.walletRequest=null});
  const form=el('form',{class:'stack'},box('fields',target.label,amount.label),reason.label);
  form.append(btn('تأكيد حركة الخزينة',()=>form.requestSubmit(),'btn primary'));
  form.addEventListener('submit',async event=>{
   event.preventDefault();
   const id=toNumber(target.input.value),delta=toNumber(amount.input.value),why=reason.input.value.trim();
   if(!Number.isSafeInteger(id)||id<=0||!Number.isSafeInteger(delta)||delta===0||Math.abs(delta)>1e9||why.length<10){
    state.notify('تحقق من ID والمبلغ والسبب المطلوب.','error');return;
   }
   if(delta>0&&!allowed('wallet.credit')||delta<0&&!allowed('wallet.debit')){
    state.notify('لا توجد صلاحية لهذه الحركة.','error');return;
   }
   if(!confirm('تأكيد حركة '+money(delta)+' Coins للحساب ID '+id+'؟'))return;
   state.walletRequest=state.walletRequest||crypto.randomUUID();
   const ok=await change(()=>rpc('dashboard_wallet_adjust',{
    p_public_id:id,p_delta:delta,p_reason:why,p_request_id:state.walletRequest
   }),'تم تسجيل التعديل المالي ورصيده الجديد.');
   if(ok)state.walletRequest=null;
  });
  work.append(panel(title('Treasury Wallet'),form,
   note('العملية تتم بقاعدة البيانات، مع سجل تدقيق ورقم طلب يمنع التكرار.')));
 }
 const history=panel(title('سجل حركات Coins'));work.append(history);
 if(!allowed('wallet.history')){
  history.append(note('حسابك لا يسمح بمشاهدة السجل المالي.'));return;
 }
 load(history,()=>rpc('dashboard_wallet_history'),transactions=>{
  history.append(title('سجل الخزينة الإدارية'));
  rows(history,transactions,t=>box('item',
   el('b',{},(t.delta>0?'+':'')+money(t.delta)+' Coins إلى ID '+t.target_public_id),
   note('قبل '+money(t.previous_balance)+' • بعد '+money(t.new_balance)),
   note(t.reason+' • '+t.operator_name+' • '+date(t.created_at))));
 });
}

export const state={
 client:null,user:null,session:null,section:'overview',version:0,busy:false,
 refresh:null,notify:null,walletRequest:null,settlementRequests:new Map()
};
export const allowed=p=>Boolean(state.session?.owner||state.session?.permissions?.includes(p));
export const numbers=n=>Number(n||0).toLocaleString('ar-IQ');
export async function rpc(name,params={}){
 const {data,error}=await state.client.rpc(name,params);
 if(error){
  const hint=error.code==='PGRST202'?' — دوال لوحة الإدارة لم تُنشر في قاعدة Supabase بعد.':'';
  throw new Error(error.message+hint);
 }
 return data;
}
export async function change(operation,success='تم تنفيذ العملية على الخادم.',reload=true){
 if(state.busy)return false;
 state.busy=true;
 try{
  await operation();
  state.notify?.(success,'success');
  if(reload)state.refresh?.();
  return true;
 }catch(e){
  state.notify?.(e?.message||'تعذر تنفيذ العملية.','error');
  return false;
 }finally{state.busy=false}
}
export function load(box,fn,draw){
 const version=state.version;
 box.replaceChildren(document.createTextNode('جاري قراءة بيانات Supabase الحقيقية…'));
 Promise.resolve().then(fn).then(data=>{
  if(version!==state.version)return;
  box.replaceChildren();draw(data,box);
 }).catch(e=>{
  if(version!==state.version)return;
  const p=document.createElement('p');p.className='message error';p.textContent=e?.message||'فشل الاتصال';
  const retry=document.createElement('button');retry.type='button';retry.className='btn';retry.textContent='إعادة المحاولة';
  retry.addEventListener('click',()=>load(box,fn,draw));
  box.replaceChildren(p,retry);
 });
}

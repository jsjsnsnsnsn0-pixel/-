import React,{useCallback,useState} from 'react';
import {rpc,backendMessage} from '../../services/backend';
import {useServerData} from '../../hooks/useServerData';
import {EmptyState,ErrorState,InlineLoading} from '../common/UIState';
import {RefreshCw} from 'lucide-react';
type Kind='gifts'|'store';
type Product={id:string;name:string;price:number;is_active:boolean;preview_url:string|null;icon:string;
 category_id?:string;diamond_source_type?:string;animation_type?:string;rarity?:string;
 category?:string;currency?:string;is_reward?:boolean;duration_days?:number;vip_level?:number};
const money=(n:number)=>Number(n||0).toLocaleString('ar-IQ');
export function AdminCatalogPanel({kind}:{kind:Kind}){
 const [selected,setSelected]=useState<string|null>(null);
 const [amount,setAmount]=useState('');
 const [enabled,setEnabled]=useState(true);
 const [reason,setReason]=useState('');
 const [busy,setBusy]=useState(false);
 const [failure,setFailure]=useState('');
 const [success,setSuccess]=useState('');
 const load=useCallback(()=>rpc<Product[]>(kind==='gifts'?'dashboard_gift_catalog':'dashboard_store_catalog'),[kind]);
 const rows=useServerData(load,[] as Product[]);
 const select=(product:Product)=>{
  setSelected(product.id);setAmount(String(product.price));setEnabled(product.is_active);
  setReason('');setFailure('');setSuccess('');
 };
 const save=async()=>{
  if(!selected||busy)return;
  const price=Number(amount);
  if(!Number.isSafeInteger(price)||price<=0||price>1e10||reason.trim().length<10){
   setFailure('أدخل سعراً صحيحاً وسبباً واضحاً من 10 أحرف على الأقل.');return;
  }
  setBusy(true);setFailure('');setSuccess('');
  try{
   const result=await rpc<{changed:boolean}>(kind==='gifts'?'dashboard_update_gift':'dashboard_update_store',{
    p_id:selected,p_price:price,p_enabled:enabled,p_reason:reason.trim()
   });
   await rows.reload();
   setSuccess(result.changed?'حُفظ التعديل في قاعدة البيانات وسُجّل في Audit Log.':'الإعدادات مطابقة للحالة الحالية.');
   setSelected(null);setReason('');
  }catch(e){setFailure(backendMessage(e))}
  finally{setBusy(false);}
 };
 return <section className="space-y-3" dir="rtl">
   <div className="flex justify-between items-center gap-3">
     <h2 className="font-black text-lg">{kind==='gifts'?'إدارة الهدايا الحقيقية':'إدارة منتجات المتجر'}</h2>
     <button onClick={()=>void rows.reload()} aria-label="تحديث الكتالوج" className="rounded-xl p-2 bg-white/10"><RefreshCw size={18}/></button>
   </div>
   <p className="text-xs text-slate-400">الأسعار والتوافر من قاعدة البيانات. لا يحذف هذا القسم أية هدية، أو عنصر مشترى، أو رصيد. التعديل يحتاج صلاحية مؤكدة من الخادم.</p>
   {failure&&<p className="bg-rose-950/50 rounded-xl p-3 text-rose-200 text-xs" role="alert">{failure}</p>}
   {success&&<p className="bg-emerald-950/40 rounded-xl p-3 text-emerald-200 text-xs" role="status">{success}</p>}
   {rows.loading?<InlineLoading>تحميل عناصر الخادم…</InlineLoading>:rows.error?<ErrorState message={rows.error} onRetry={()=>void rows.reload()}/>:rows.data.length===0?<EmptyState title="لا يوجد كتالوج حالياً"/>:
   <div className="space-y-2">
     {rows.data.map(p=><article key={p.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
       <div className="flex items-center gap-3">
        {p.preview_url?<img src={p.preview_url} alt="" className="w-12 h-12 rounded-xl object-cover"/>:<div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl">{p.icon||'🎁'}</div>}
        <div className="flex-1 min-w-0">
         <strong className="truncate block text-sm">{p.name}</strong>
         <p className="text-xs text-slate-400">{kind==='gifts'?p.category_id:p.category} · {money(p.price)} {kind==='store'?(p.currency||'gold'):'Coins'}</p>
         <p className="text-xs" style={{color:p.is_active?'#7dd3a9':'#f9a8a8'}}>{p.is_active?'معروض':'موقوف'}</p>
        </div>
        {(!p.is_reward)&&<button disabled={busy} onClick={()=>selected===p.id?setSelected(null):select(p)} className="rounded-lg bg-cyan-500/15 border border-cyan-400/25 px-3 py-2 text-sm">تعديل</button>}
       </div>
       {selected===p.id&&<div className="border-t border-white/10 mt-3 pt-3 space-y-3">
         <label className="block text-xs">السعر الجديد (Coins أو عملة المنتج)<input type="number" min="1" max="10000000000" step="1" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full bg-[#141829] rounded-xl border border-white/15 p-3 mt-1 text-white"/></label>
         <label className="flex gap-2 items-center text-xs"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/>العنصر فعال ومتاح</label>
         <label className="block text-xs">سبب التعديل (إلزامي)<textarea minLength={10} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} rows={2} className="w-full bg-[#141829] rounded-xl border border-white/15 p-3 mt-1 text-white" placeholder="سبب إداري موثق"/></label>
         <div className="flex gap-2">
          <button disabled={busy} onClick={()=>void save()} className="bg-cyan-600 rounded-xl px-4 py-2 text-sm disabled:opacity-40">{busy?'جارٍ الحفظ…':'حفظ التعديل'}</button>
          <button disabled={busy} onClick={()=>setSelected(null)} className="rounded-xl px-4 py-2 text-sm border border-white/15">إلغاء</button>
         </div>
       </div>}
     </article>)}
   </div>}
 </section>;
}

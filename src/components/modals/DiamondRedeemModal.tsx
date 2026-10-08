import {useDismissableLayer} from '../../hooks/useDismissableLayer';
import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { backendMessage } from '../../services/backend';
import { DiamondQuote, DiamondState, diamondPreview, diamondState, redeemDiamonds } from '../../services/diamonds';

export const DiamondRedeemModal: React.FC<{onClose: () => void; onRedeemed?: () => void}> = ({onClose,onRedeemed}) => {

  const layerRef=useDismissableLayer(true,onClose);
 const {user,refreshWallet} = useApp();
 const [state,setState] = useState<DiamondState|null>(null);
 const [amount,setAmount] = useState('');
 const [quote,setQuote] = useState<DiamondQuote|null>(null);
 const [busy,setBusy] = useState<'load'|'preview'|'redeem'|null>('load');
 const [error,setError] = useState<string|null>(null);
 const [success,setSuccess] = useState(false);
 const retry = useRef<{amount:number;id:string}|null>(null);
 const scope = useRef(0);
 useEffect(() => {
  const version=++scope.current;
  setBusy('load');setState(null);setQuote(null);setAmount('');setError(null);setSuccess(false);retry.current=null;
  diamondState().then(next=>{if(version===scope.current)setState(next);}).catch(e=>{if(version===scope.current)setError(backendMessage(e));}).finally(()=>{if(version===scope.current)setBusy(null);});
  return ()=>{scope.current++;};
 },[user.id]);
 const preview = async () => {
  const n=Number(amount);setError(null);setQuote(null);
  if(!Number.isSafeInteger(n)||n<=0){setError('أدخل كمية ماس صحيحة وموجبة.');return;}
  const version=scope.current;setBusy('preview');
  try {const next=await diamondPreview(n);if(version===scope.current)setQuote(next);}
  catch(e){if(version===scope.current)setError(backendMessage(e));}
  finally{if(version===scope.current)setBusy(null);}
 };
 const confirm = async () => {
  if(!quote||busy)return;
  const version=scope.current;setBusy('redeem');setError(null);
  if(retry.current?.amount!==quote.diamonds_amount)retry.current={amount:quote.diamonds_amount,id:crypto.randomUUID()};
  let committed=false;
  try {
   const result=await redeemDiamonds(quote.diamonds_amount,retry.current.id);committed=true;
   if(version!==scope.current)return;
   setQuote(result);setSuccess(true);
   await refreshWallet();
   const next=await diamondState();
   if(version===scope.current){setState(next);onRedeemed?.();}
  } catch(e){if(version===scope.current)setError(committed?'تم الفك في الخادم، لكن تعذر تحديث الرصيد. أعد فتح المحفظة للتحديث.':backendMessage(e));}
  finally{if(version===scope.current)setBusy(null);}
 };
 return <div ref={layerRef} className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" dir="rtl">
  <section role="dialog" aria-modal="true" aria-labelledby="redeem-heading" className="w-full max-w-sm rounded-3xl bg-[#141629] text-white p-5 space-y-3 max-h-[90vh] overflow-auto">
   <div className="flex justify-between"><h2 id="redeem-heading" className="font-bold">فك الماس إلى Coins 🪙</h2><button disabled={busy!==null} onClick={onClose} aria-label="إغلاق فك الماس">×</button></div>
   <p className="text-sm">الماس القابل للفك: 30% للهدايا المؤهلة، ومكافآت الحظ التجميلية منفصلة عن الماس المالي.</p>
   <p className="text-xs text-slate-300">نستهلك الماس الثابت أولاً ثم ماس الحظ. يُقرب ناتج كل مصدر للأسفل إلى Coins كاملة.</p>
   {state&&<div className="text-sm space-y-1"><p>Fixed Diamonds: {Number(state.fixed_diamonds).toLocaleString()} 💎</p><p>Lucky Diamonds: {Number(state.lucky_diamonds).toLocaleString()} 💎</p><p>ماس قديم غير محدد المصدر: {Number(state.legacy_diamonds).toLocaleString()} 💎 — يحتاج مراجعة ولا يُفك تلقائياً.</p></div>}
   {busy&&<p role="status">{busy==='load'?'جارٍ تحميل مصادر الماس…':busy==='preview'?'جارٍ حساب المعاينة…':'جارٍ تأكيد الفك في الخادم…'}</p>}
   {error&&<p role="alert" className="text-red-300">{error}</p>}
   {success?<p role="status" className="text-emerald-300">تم فك {quote?.diamonds_amount.toLocaleString()} 💎 واستلام {quote?.coins_amount.toLocaleString()} 🪙 بتأكيد الخادم.</p>:<>
    <label className="block text-sm">كمية الماس<input aria-label="كمية الماس" type="number" min="1" step="1" disabled={busy!==null||!state} value={amount} onChange={e=>{setAmount(e.target.value);setQuote(null);}} className="block w-full p-2 rounded-xl bg-black/30 mt-1" /></label>
    <button disabled={busy!==null||!state} onClick={()=>{setAmount(String(Number(state!.fixed_diamonds)+Number(state!.lucky_diamonds)));setQuote(null);}} className="text-cyan-300 text-sm">اختيار كل الماس القابل للفك</button>
    <button disabled={busy!==null||!state} onClick={()=>void preview()} className="w-full bg-cyan-700 rounded-xl p-2">معاينة الفك</button>
    {quote&&<div className="bg-black/20 rounded-xl p-3 space-y-2" data-testid="diamond-quote"><p>سيتم استهلاك: {quote.diamonds_amount.toLocaleString()} 💎</p><p>ثابت: {quote.fixed_diamonds.toLocaleString()} · حظ: {quote.lucky_diamonds.toLocaleString()}</p><p>ستحصل على: {quote.coins_amount.toLocaleString()} Coins 🪙</p><button disabled={busy!==null} onClick={()=>void confirm()} className="w-full bg-emerald-700 rounded-xl p-2">تأكيد فك الماس والتحويل 🪙</button></div>}
   </>}
  </section>
 </div>;
};

import {useDismissableLayer} from '../../hooks/useDismissableLayer';
import React, {useCallback,useState} from 'react';
import {useApp} from '../../context/AppContext';
import {useServerData} from '../../hooks/useServerData';
import {supabase} from '../../services/supabase';
import {rpc,backendMessage} from '../../services/backend';
interface Tier {id:string;label:string;threshold_usd:number;rewards:{name:string;days?:number;type:string}[]}
export const RechargeActivityModal: React.FC<{isOpen:boolean;onClose:()=>void}> = ({isOpen,onClose}) => {
  const layerRef=useDismissableLayer(isOpen,onClose);

  const {user,refreshWallet,reportError,setActiveSubScreen}=useApp();
  const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');
  const load=useCallback(async()=>{
    if(!isOpen) return {tiers:[] as Tier[],claimed:[] as string[],amount:0};
    const now=new Date();const month=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1)).toISOString().slice(0,10);
    const [tiers,claims,requests]=await Promise.all([supabase.from('recharge_reward_tiers').select('*').order('threshold_usd'),supabase.from('recharge_reward_claims').select('tier_id').eq('user_id',user.authId).eq('claim_month',month),supabase.from('recharge_requests').select('price_usd').eq('user_id',user.authId).eq('status','approved').gte('created_at',`${month}T00:00:00Z`)]);
    for(const result of [tiers,claims,requests])if(result.error)throw result.error;
    return {tiers:(tiers.data||[]) as Tier[],claimed:(claims.data||[]).map(c=>String(c.tier_id)),amount:(requests.data||[]).reduce((sum,r)=>sum+Number(r.price_usd),0)};
  },[user.authId,isOpen]);
  const {data,loading,error,reload}=useServerData(load,{tiers:[] as Tier[],claimed:[] as string[],amount:0});
  const claim=async(id:string)=>{if(busy)return;setBusy(true);setNotice('');try{const result=await rpc<{already_claimed:boolean}>('claim_recharge_reward',{p_tier_id:id});if(!result)throw new Error('claim not confirmed');setNotice(result.already_claimed?'تم الاستلام مسبقاً.':'تم اعتماد المكافآت؛ الطلبات الخاصة تحتاج مراجعة الإدارة.');await Promise.all([reload(),refreshWallet()]);}catch(e){reportError(backendMessage(e));}finally{setBusy(false);}};
  if(!isOpen)return null;
  return <div ref={layerRef} className="fixed inset-0 z-50 bg-black/80 p-3 flex items-center justify-center" dir="rtl"><div className="w-full max-w-md max-h-[90dvh] overflow-y-auto bg-[#13091f] text-white rounded-3xl p-5"><button onClick={onClose}>إغلاق</button><h1 className="text-xl my-4">مكافآت الشحن</h1><p>الشحن المعتمد هذا الشهر: ${data.amount.toFixed(2)}</p>{loading&&<p>جارٍ التحميل…</p>}{error&&<button onClick={()=>void reload()}>{error} — إعادة المحاولة</button>}{notice&&<p role="status" className="p-3">{notice}</p>}{data.tiers.map(tier=><section key={tier.id} className="my-4 p-4 bg-white/10 rounded-2xl"><h2>{tier.label}</h2><ul className="my-3 space-y-2">{tier.rewards.map((reward,i)=><li key={i}>{reward.name}{reward.days?` — ${reward.days} يوم`:''}{reward.type==='request'?' — طلب لمراجعة الإدارة':''}</li>)}</ul><button disabled={busy||loading||Boolean(error)||data.claimed.includes(tier.id)||data.amount<Number(tier.threshold_usd)} onClick={()=>void claim(tier.id)} className="bg-amber-600 rounded-xl p-2 disabled:opacity-40">{data.claimed.includes(tier.id)?'تم الاستلام':'استلام المكافآت'}</button></section>)}<button onClick={()=>{onClose();setActiveSubScreen('recharge');}} className="p-3">فتح الشحن</button></div></div>;
};

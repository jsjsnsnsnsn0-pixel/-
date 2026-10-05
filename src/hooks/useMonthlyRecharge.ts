import {useEffect, useState} from 'react';
import {supabase} from '../services/supabase';
// Only approved server-side requests count towards recharge progress.
export function useMonthlyRecharge(authId?: string, enabled=true) {
  const [amount,setAmount]=useState(0);
  useEffect(()=>{
    setAmount(0); if (!authId || !enabled) return;
    let cancelled=false; const now=new Date(); const start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1)).toISOString();
    supabase.from('recharge_requests').select('price_usd').eq('user_id',authId).eq('status','approved').gte('created_at',start).then(({data,error})=>{
      if (!cancelled && !error) setAmount((data || []).reduce((sum,row)=>sum+Number(row.price_usd || 0),0));
    });
    return ()=>{cancelled=true;};
  },[authId,enabled]);
  return amount;
}

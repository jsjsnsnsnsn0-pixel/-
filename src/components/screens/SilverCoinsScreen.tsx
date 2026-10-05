import React, {useCallback,useState} from 'react';
import {useApp} from '../../context/AppContext';
import {useServerData} from '../../hooks/useServerData';
import {supabase} from '../../services/supabase';
import {rpc,backendMessage} from '../../services/backend';
const tasks = [{key:'login',title:'تسجيل الدخول اليومي'}, {key:'follow_two',title:'متابعة حسابين جديدين اليوم'}, {key:'listen_five',title:'البقاء في غرفة خمس دقائق'}, {key:'daily',title:'صندوق الهدايا اليومي'}];
export const SilverCoinsScreen: React.FC = () => {
  const {user,refreshWallet,setActiveSubScreen,reportError} = useApp();
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState('');
  const load = useCallback(async () => {
    const {data,error} = await supabase.from('reward_claims').select('reward_key,gold,silver,claim_day').eq('user_id',user.authId).eq('claim_day',new Date().toISOString().slice(0,10));
    if(error) throw error; return data || [];
  },[user.authId]);
  const {data,loading,error,reload} = useServerData(load,[]);
  const claim = async (key:string) => {
    if(busy) return; setBusy(true);setNotice('');
    try {
      const result = await rpc<{gold:number;silver:number;already_claimed:boolean}>('claim_reward',{p_key:key});
      if(!result) throw new Error('claim not confirmed');
      setNotice(result.already_claimed ? 'تم استلام هذه المكافأة مسبقاً.' : `اعتمد الخادم ${result.gold} ذهب و${result.silver} فضة.`);
      await Promise.all([reload(),refreshWallet()]);
    }catch(e){reportError(backendMessage(e));}finally{setBusy(false);}
  };
  return <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-800 p-4 pb-28"><header className="flex gap-4 mb-6"><button onClick={() => setActiveSubScreen(null)}>الرجوع</button><h1>مركز العملات الفضية والمهام</h1></header><p className="p-4 bg-purple-100 rounded-2xl mb-4">رصيد الفضة: {user.silverCoins || 0}</p><p className="mb-4">يتحقق الخادم من شروط كل مهمة. المكافأة مرة واحدة في اليوم بتوقيت UTC.</p>{notice && <p role="status" className="p-3">{notice}</p>}{loading && <p>جارٍ تحميل المكافآت…</p>}{error && <button onClick={() => void reload()}>{error} — إعادة المحاولة</button>}
    {tasks.map(task => {const claimed=data.find(r => r.reward_key===task.key);return <div key={task.key} className="flex justify-between items-center gap-3 bg-white p-4 rounded-2xl mb-3"><span>{task.title}</span><button disabled={busy || loading || Boolean(error) || Boolean(claimed)} onClick={() => void claim(task.key)} className="p-2 bg-purple-600 text-white rounded-xl disabled:opacity-40">{claimed ? 'تم الاستلام':'استلام'}</button></div>;})}
  </div>;
};

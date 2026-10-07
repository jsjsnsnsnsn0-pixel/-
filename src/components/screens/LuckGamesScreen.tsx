import React, {useCallback, useMemo, useState} from 'react';
import {ChevronRight, Dices, Gift, Hand, RefreshCw, Trophy} from 'lucide-react';
import {supabase} from '../../services/supabase';
import {useApp} from '../../context/AppContext';
import {useServerData} from '../../hooks/useServerData';
import {EmptyState, ErrorState, InlineLoading} from '../common/UIState';

type GameType = 'dice' | 'rps' | 'lucky_bag';
type GameRow = {id:string; game_type:GameType; outcome:string; score:number; details:Record<string,unknown>; created_at:string};

const outcomeText = (row: GameRow) => {
  if (row.game_type === 'dice') return `ظهر الرقم ${String(row.details?.roll ?? row.score)}`;
  if (row.game_type === 'rps') return row.outcome === 'win' ? 'فوز' : row.outcome === 'draw' ? 'تعادل' : 'خسارة';
  return row.outcome === 'legendary' ? 'صندوق أسطوري' : row.outcome === 'rare' ? 'صندوق نادر' : row.outcome === 'common' ? 'صندوق عادي' : 'الصندوق فارغ';
};

export const LuckGamesScreen: React.FC = () => {
  const {setActiveSubScreen, reportError} = useApp();
  const [busy, setBusy] = useState<GameType | null>(null);
  const [last, setLast] = useState<GameRow | null>(null);
  const [rpsChoice, setRpsChoice] = useState<'rock'|'paper'|'scissors'>('rock');
  const load = useCallback(async () => {
    const {data, error} = await supabase.from('game_results').select('id,game_type,outcome,score,details,created_at').order('created_at',{ascending:false}).limit(50);
    if (error) throw error;
    return (data || []) as GameRow[];
  }, []);
  const history = useServerData(load, [] as GameRow[]);

  const play = async (game: GameType) => {
    if (busy) return;
    setBusy(game);
    try {
      const {data, error} = await supabase.rpc('play_fun_game', {p_game_type: game, p_choice: game === 'rps' ? rpsChoice : null});
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as GameRow | null;
      if (row) setLast(row);
      await history.reload();
    } catch (error) {
      console.error(error);
      reportError('تعذر تشغيل اللعبة. حاول مجدداً.');
    } finally { setBusy(null); }
  };

  const totalScore = useMemo(() => (history.data || []).reduce((sum,row) => sum + Number(row.score || 0),0), [history.data]);

  return <div dir="rtl" className="min-h-screen bg-[radial-gradient(circle_at_top,#27104d_0,#100b20_34rem,#090b14_100%)] text-white pb-28">
    <header className="sticky top-0 z-30 px-4 py-3 bg-[#0c0d18]/82 backdrop-blur-xl border-b border-violet-400/15 flex items-center justify-between">
      <div><p className="text-[11px] text-violet-300">ترفيه بدون رهان</p><h1 className="font-black text-lg">ألعاب TotiFun</h1></div>
      <button type="button" onClick={() => setActiveSubScreen('wallet')} className="ui-icon-button bg-white/8 border border-white/10" aria-label="رجوع"><ChevronRight size={22}/></button>
    </header>

    <main className="p-4 space-y-4">
      <section className="rounded-3xl p-5 bg-gradient-to-br from-violet-600/25 to-fuchsia-500/10 border border-violet-300/20 shadow-2xl">
        <div className="flex items-center justify-between gap-3"><div><h2 className="font-black">نقاط المتعة</h2><p className="text-xs text-slate-300 mt-1">لا يتم خصم Coins ولا توجد جوائز مالية.</p></div><div className="text-2xl font-black text-amber-300">{totalScore}</div></div>
      </section>

      {last && <section className="rounded-2xl bg-emerald-500/12 border border-emerald-400/25 p-4"><p className="text-xs text-emerald-300">آخر نتيجة</p><p className="font-black mt-1">{outcomeText(last)}</p><p className="text-xs text-slate-400 mt-1">+{last.score} نقاط متعة</p></section>}

      <section className="grid gap-3">
        <button type="button" disabled={Boolean(busy)} onClick={() => void play('dice')} className="rounded-3xl p-5 bg-gradient-to-l from-blue-700 to-indigo-900 border border-blue-300/20 text-right shadow-xl flex items-center gap-4"><span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center"><Dices size={30}/></span><span className="flex-1"><strong className="block text-base">النرد</strong><small className="text-blue-100/75">ارمِ النرد وسجّل أعلى نتيجة</small></span>{busy==='dice'&&<RefreshCw className="animate-spin"/>}</button>

        <div className="rounded-3xl p-5 bg-gradient-to-l from-rose-700 to-fuchsia-950 border border-rose-300/20 shadow-xl">
          <div className="flex items-center gap-4"><span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center"><Hand size={30}/></span><span><strong className="block text-base">حجر ورق مقص</strong><small className="text-rose-100/75">اختر ثم واجه اختيار السيرفر</small></span></div>
          <div className="grid grid-cols-3 gap-2 mt-4">{([['rock','✊ حجر'],['paper','✋ ورق'],['scissors','✌️ مقص']] as const).map(([id,label])=><button key={id} type="button" onClick={()=>setRpsChoice(id)} className={`rounded-xl py-2 text-xs font-bold border ${rpsChoice===id?'bg-white text-fuchsia-900 border-white':'bg-white/5 text-white border-white/15'}`}>{label}</button>)}</div>
          <button type="button" disabled={Boolean(busy)} onClick={() => void play('rps')} className="w-full mt-3 rounded-xl bg-white text-fuchsia-900 font-black py-2.5">{busy==='rps'?'جارٍ اللعب…':'العب الآن'}</button>
        </div>

        <button type="button" disabled={Boolean(busy)} onClick={() => void play('lucky_bag')} className="rounded-3xl p-5 bg-gradient-to-l from-amber-600 to-orange-950 border border-amber-300/25 text-right shadow-xl flex items-center gap-4"><span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center"><Gift size={30}/></span><span className="flex-1"><strong className="block text-base">صندوق الحظ</strong><small className="text-amber-100/75">نتيجة ترفيهية ونقاط فقط</small></span>{busy==='lucky_bag'&&<RefreshCw className="animate-spin"/>}</button>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Trophy size={18} className="text-amber-300"/><h2 className="font-black">سجل الألعاب</h2></div><button type="button" onClick={()=>void history.reload()} className="text-xs text-violet-300">تحديث</button></div>
        {history.loading && <InlineLoading>جارٍ تحميل السجل…</InlineLoading>}
        {history.error && <ErrorState message={history.error} onRetry={()=>void history.reload()}/>} 
        {!history.loading && !history.error && !(history.data || []).length && <EmptyState title="لا توجد نتائج بعد" description="جرّب أي لعبة وستظهر النتيجة هنا."/>}
        <div className="space-y-2">{(history.data || []).map(row=><div key={row.id} className="rounded-2xl bg-white/6 border border-white/10 p-3 flex items-center justify-between gap-3"><div><p className="font-bold text-sm">{row.game_type==='dice'?'النرد':row.game_type==='rps'?'حجر ورق مقص':'صندوق الحظ'}</p><p className="text-xs text-slate-400 mt-1">{outcomeText(row)}</p><p className="text-[10px] text-slate-500 mt-1">{new Date(row.created_at).toLocaleString('ar-IQ')}</p></div><span className="shrink-0 rounded-full bg-amber-400/12 text-amber-300 px-3 py-1 text-xs font-black">+{row.score}</span></div>)}</div>
      </section>
    </main>
  </div>;
};
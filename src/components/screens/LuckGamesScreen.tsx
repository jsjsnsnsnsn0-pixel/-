import React, {useCallback, useMemo, useState} from 'react';
import {TotiArcade} from './ui/TotiArcade';
import {ChevronRight, Dices, Gift, Hand, RefreshCw, Trophy, Gamepad2, Sparkles, ShieldCheck, History} from 'lucide-react';
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
  const [playError, setPlayError] = useState('');
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
    setPlayError('');
    try {
      const {data, error} = await supabase.rpc('play_fun_game', {p_game_type: game, p_choice: game === 'rps' ? rpsChoice : null});
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as GameRow | null;
      if (row) setLast(row);
      await history.reload();
    } catch (error) {
      console.error(error);
      setPlayError('ما قدرنا نكمل الجولة. جرّب مرة ثانية، وما تم عرض أي نتيجة وهمية.');
      reportError('تعذر تشغيل اللعبة. حاول مجدداً.');
    } finally { setBusy(null); }
  };

  // The server query requests only 50 rows, so this is *not* a lifetime balance.
  const totalScore = useMemo(() => (history.data || []).reduce((sum,row) => sum + Number(row.score || 0),0), [history.data]);
  const resultsCount=(history.data || []).length;

  return <div dir="rtl" className="min-h-screen bg-[radial-gradient(ellipse_at_70%_0%,#2e1459_0%,#151027_40%,#090b14_100%)] text-white pb-28">
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-[#120e23]/85 backdrop-blur-xl">
      <div className="flex items-center gap-3 min-w-0">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-600/20 border border-violet-400/25"><Gamepad2 size={24} className="text-violet-200"/></span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-wide text-violet-300">مساحة الترفيه · TotiChat</p>
          <h1 className="text-[19px] font-black">ألعاب TotiFun</h1>
        </div>
      </div>
      <button type="button" onClick={() => setActiveSubScreen('wallet')} className="ui-icon-button border border-white/15 bg-white/8 text-white hover:bg-white/15" aria-label="الرجوع إلى المحفظة"><ChevronRight size={22}/></button>
    </header>

    <main className="mx-auto w-full max-w-2xl p-4 space-y-5">
      <section className="relative overflow-hidden rounded-[28px] border border-violet-300/25 bg-gradient-to-bl from-[#4f2b91] via-[#27134e] to-[#19142f] shadow-[0_20px_50px_rgba(0,0,0,.25)] px-5 py-6">
        <div className="absolute -left-10 -top-12 size-44 rounded-full bg-fuchsia-400/10 blur-2xl pointer-events-none" aria-hidden="true"/>
        <div className="relative flex items-start justify-between gap-3">
          <div className="max-w-[75%]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-200"><ShieldCheck size={14}/> ألعاب بدون رهان أو خصم كوينز</span>
            <h2 className="mt-3 text-2xl font-black leading-tight">العب، جرّب حظك، واجمع نقاط المتعة</h2>
            <p className="mt-2 text-xs leading-relaxed text-violet-100/75">نتائج ألعاب فعلية محفوظة على حسابك، بدون تحويل النقاط إلى أموال أو ماس.</p>
          </div>
          <div className="grid size-16 shrink-0 place-items-center rounded-3xl border border-amber-200/30 bg-amber-300/10 shadow-inner"><Trophy size={34} className="text-amber-300"/></div>
        </div>
        <div className="relative mt-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <div><p className="text-[11px] text-violet-100/70">نقاط آخر {resultsCount} جولة محفوظة</p><p className="text-2xl font-black text-amber-300 tabular-nums">{totalScore.toLocaleString('ar-IQ')}</p></div>
          <div className="text-left"><p className="text-[11px] text-violet-100/70">النتائج المسجلة</p><strong className="text-xl font-black tabular-nums">{resultsCount}</strong></div>
        </div>
      </section>

      {playError&&<div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-950/50 px-4 py-3 text-sm leading-6 text-rose-100">{playError}</div>}
      {last&&<section role="status" aria-live="polite" className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-400/15"><Sparkles size={22} className="text-emerald-200"/></span>
        <div className="min-w-0 flex-1"><p className="text-[11px] text-emerald-200">نتيجة الجولة الأخيرة</p><p className="font-bold">{outcomeText(last)}</p></div>
        <strong className="whitespace-nowrap text-amber-300">+{last.score} نقطة</strong>
      </section>}

      <section aria-label="الألعاب المتاحة">
        <div className="mb-3 flex items-center justify-between gap-2"><div><h2 className="text-lg font-black">اختار لعبتك</h2><p className="text-[11px] text-slate-400">ثلاث ألعاب مرتبطة بنتائج السيرفر الحقيقية</p></div><span className="rounded-full bg-white/8 px-3 py-1 text-xs text-violet-200">3 ألعاب</span></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" disabled={Boolean(busy)} onClick={() => void play('dice')} aria-label="لعبة النرد: ارمِ النرد" aria-busy={busy==='dice'} className="group relative flex items-center gap-4 rounded-[24px] border border-blue-300/25 bg-gradient-to-l from-[#365dc9] via-[#253b8b] to-[#171d49] p-5 text-right shadow-lg min-h-[118px] active:scale-[.99] disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300">
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/12 shadow-inner"><Dices size={34}/></span>
            <span className="flex-1 min-w-0"><strong className="block text-base font-black">النرد</strong><small className="mt-1 block leading-relaxed text-blue-100/80">ارمِ النرد وشاهد الرقم الذي اختاره السيرفر</small><span className="mt-2 inline-block text-[11px] font-semibold text-white/80">العب الآن ←</span></span>
            {busy==='dice'&&<RefreshCw className="absolute left-4 top-4 animate-spin" size={16}/>}
          </button>

          <button type="button" disabled={Boolean(busy)} onClick={() => void play('lucky_bag')} aria-label="لعبة صندوق الحظ: افتح صندوقاً" aria-busy={busy==='lucky_bag'} className="relative flex items-center gap-4 rounded-[24px] border border-amber-300/25 bg-gradient-to-l from-[#9c5715] via-[#7d3815] to-[#432018] p-5 text-right shadow-lg min-h-[118px] active:scale-[.99] disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300">
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl border border-amber-100/15 bg-amber-200/10"><Gift size={33} className="text-amber-200"/></span>
            <span className="flex-1 min-w-0"><strong className="block text-base font-black">صندوق الحظ</strong><small className="mt-1 block leading-relaxed text-amber-100/80">افتح صندوقاً بنتيجة ترفيهية مسجلة</small><span className="mt-2 inline-block text-[11px] font-semibold text-amber-100">العب الآن ←</span></span>
            {busy==='lucky_bag'&&<RefreshCw className="absolute left-4 top-4 animate-spin" size={16}/>}
          </button>

          <section aria-label="حجر ورق مقص" className="sm:col-span-2 overflow-hidden rounded-[24px] border border-rose-300/25 bg-gradient-to-bl from-[#702d66] via-[#401a54] to-[#261636] p-5 shadow-lg">
            <div className="flex items-center gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10"><Hand size={30} className="text-rose-100"/></span><div><h3 className="text-base font-black">حجر ورق مقص</h3><p className="mt-1 text-xs leading-5 text-rose-100/75">حدد اختيارك، والسيرفر ينطيك نتيجة الجولة</p></div></div>
            <div role="group" aria-label="اختيار حجر ورق مقص" className="mt-4 grid grid-cols-3 gap-2">
              {([['rock','✊','حجر'],['paper','✋','ورق'],['scissors','✌️','مقص']] as const).map(([id,symbol,label])=><button key={id} type="button" aria-pressed={rpsChoice===id} disabled={Boolean(busy)} onClick={()=>setRpsChoice(id)} className={`ui-control rounded-2xl border px-2 py-3 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${rpsChoice===id?'border-white bg-white text-[#471f57] shadow-md':'border-white/20 bg-black/15 text-white hover:bg-white/10'}`}><span aria-hidden="true" className="block text-2xl">{symbol}</span><span className="mt-1 block text-xs font-bold">{label}</span></button>)}
            </div>
            <button type="button" disabled={Boolean(busy)} onClick={() => void play('rps')} aria-busy={busy==='rps'} className="ui-control mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-black text-[#471f57] transition-colors hover:bg-rose-100 active:scale-[.99] disabled:opacity-60">{busy==='rps'?<><RefreshCw size={16} className="animate-spin"/> جارٍ اللعب…</>:'واجه السيرفر الآن'}</button>
          </section>
        </div>
      </section>

      <TotiArcade/>

      <section aria-label="تاريخ الألعاب">
        <div className="mb-3 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><History size={19} className="text-violet-300"/><h2 className="font-black">سجل الألعاب</h2></div><button type="button" disabled={history.loading} onClick={()=>void history.reload()} className="ui-control inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-violet-200 disabled:opacity-50"><RefreshCw size={14} className={history.loading?'animate-spin':''}/> تحديث</button></div>
        {history.loading&&<InlineLoading>جارٍ تحميل النتائج…</InlineLoading>}
        {history.error&&<ErrorState message={history.error} onRetry={()=>void history.reload()}/>}
        {!history.loading&&!history.error&&!(history.data||[]).length&&<EmptyState title="لا توجد جولات بعد" description="العب إحدى الألعاب وستظهر نتائج حسابك هنا."/>}
        {!history.error&&<div className="space-y-2">
          {(history.data||[]).map(row=><div key={row.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-300/10">{row.game_type==='dice'?<Dices size={19} className="text-blue-200"/>:row.game_type==='rps'?<Hand size={19} className="text-rose-200"/>:<Gift size={19} className="text-amber-200"/>}</span>
            <div className="min-w-0 flex-1"><p className="text-sm font-bold">{row.game_type==='dice'?'النرد':row.game_type==='rps'?'حجر ورق مقص':'صندوق الحظ'}</p><p className="mt-0.5 text-xs text-slate-300">{outcomeText(row)}</p><p className="mt-1 text-[11px] text-slate-500">{new Date(row.created_at).toLocaleString('ar-IQ')}</p></div>
            <span className="shrink-0 rounded-xl border border-amber-300/15 bg-amber-300/10 px-3 py-1.5 text-xs font-black text-amber-200">+{Number(row.score)||0}</span>
          </div>)}
        </div>}
      </section>
    </main>
  </div>;
};

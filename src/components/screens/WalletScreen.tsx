import React, {useCallback, useMemo, useState} from 'react';
import {ArrowDownLeft, ArrowUpRight, CheckCircle2, ChevronRight, Clock3, Gamepad2, Gift, Plus, RefreshCw, XCircle} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {supabase} from '../../services/supabase';
import {diamondState} from '../../services/diamonds';
import {useServerData} from '../../hooks/useServerData';
import {DiamondRedeemModal} from '../modals/DiamondRedeemModal';
import {EmptyState, ErrorState, InlineLoading} from '../common/UIState';

type Tab = 'recharge' | 'sent' | 'received' | 'conversion' | 'games' | 'monthly';
type MonthlyHost = {settlement_month:string;diamonds_earned:number;diamonds_manually_redeemed:number;diamonds_auto_converted:number;coins_credited:number;host_target:number;host_salary_iqd:number;payment_status:string};
type MonthlyAgency = {settlement_month:string;agency_id:number;target_diamonds:number;hosts_salary_iqd:number;agent_commission_iqd:number;payment_status:string};
type RechargeRequest = {id:string; amount_iqd:number|null; gold_amount:number; status:string; note:string|null; price_usd:number|null; created_at:string; updated_at:string};
type GameRow = {id:string; game_type:string; outcome:string; score:number; details:Record<string,unknown>; created_at:string};

const rechargeStatus = (value:string) => {
  const normalized = String(value || '').toLowerCase();
  if (['completed','approved','paid'].includes(normalized)) return {label:'مكتمل', cls:'text-emerald-300 bg-emerald-500/10 border-emerald-400/20', icon:<CheckCircle2 size={13}/>};
  if (['rejected','cancelled','failed'].includes(normalized)) return {label:'مرفوض', cls:'text-rose-300 bg-rose-500/10 border-rose-400/20', icon:<XCircle size={13}/>};
  return {label:'قيد الانتظار', cls:'text-amber-300 bg-amber-500/10 border-amber-400/20', icon:<Clock3 size={13}/>};
};

const gameName = (type:string) => type === 'dice' ? 'النرد' : type === 'rps' ? 'حجر ورق مقص' : 'صندوق الحظ';
const gameResult = (row:GameRow) => row.game_type === 'dice' ? `ظهر الرقم ${String(row.details?.roll ?? row.score)}` : row.outcome === 'win' ? 'فوز' : row.outcome === 'draw' ? 'تعادل' : row.outcome === 'loss' ? 'خسارة' : row.outcome === 'legendary' ? 'أسطوري' : row.outcome === 'rare' ? 'نادر' : row.outcome === 'common' ? 'عادي' : 'فارغ';

export const WalletScreen: React.FC = () => {
  const {user, transactions, setActiveSubScreen} = useApp();
  const [tab, setTab] = useState<Tab>('recharge');
  const [redeeming, setRedeeming] = useState(false);
  const breakdown = useServerData(diamondState, null);

  const loadRecharge = useCallback(async () => {
    const {data,error} = await supabase.from('recharge_requests').select('id,amount_iqd,gold_amount,status,note,price_usd,created_at,updated_at').order('created_at',{ascending:false}).limit(100);
    if (error) throw error;
    return (data || []) as RechargeRequest[];
  }, []);
  const recharge = useServerData(loadRecharge, [] as RechargeRequest[]);

  const loadGames = useCallback(async () => {
    const {data,error} = await supabase.from('game_results').select('id,game_type,outcome,score,details,created_at').order('created_at',{ascending:false}).limit(100);
    if (error) throw error;
    return (data || []) as GameRow[];
  }, []);
  const games = useServerData(loadGames, [] as GameRow[]);
  const loadSettlements = useCallback(async () => {
    const [hosts, agencies] = await Promise.all([
      supabase.from('monthly_host_settlements').select('settlement_month,diamonds_earned,diamonds_manually_redeemed,diamonds_auto_converted,coins_credited,host_target,host_salary_iqd,payment_status').order('settlement_month',{ascending:false}).limit(24),
      supabase.from('monthly_agency_settlements').select('settlement_month,agency_id,target_diamonds,hosts_salary_iqd,agent_commission_iqd,payment_status').order('settlement_month',{ascending:false}).limit(24),
    ]);
    if (hosts.error) throw hosts.error;
    if (agencies.error) throw agencies.error;
    return {hosts:(hosts.data||[]) as MonthlyHost[],agencies:(agencies.data||[]) as MonthlyAgency[]};
  },[]);
  const settlements = useServerData(loadSettlements, {hosts:[] as MonthlyHost[],agencies:[] as MonthlyAgency[]});

  const sent = useMemo(() => transactions.filter(t => t.type === 'gift_sent'), [transactions]);
  const received = useMemo(() => transactions.filter(t => ['gift_received','fixed_gift_diamonds_received','lucky_gift_diamonds_received'].includes(t.type)), [transactions]);
  const conversions = useMemo(() => transactions.filter(t => ['fixed_diamonds_redeemed','lucky_diamonds_redeemed','coins_from_diamond_redemption','diamonds_exchange'].includes(t.type)), [transactions]);

  return <div className="min-h-screen bg-[linear-gradient(180deg,#090a12_0,#0e1020_45%,#111525_100%)] text-slate-100 pb-28" dir="rtl">
    <header className="sticky top-0 z-30 bg-[#090a12]/86 backdrop-blur-xl border-b border-white/8 px-4 py-3 flex items-center justify-between gap-3">
      <div><p className="text-[11px] text-violet-300">Wallet & Records</p><h1 className="text-lg font-black">المحفظة والسجل</h1></div>
      <button type="button" onClick={() => setActiveSubScreen(null)} className="ui-icon-button bg-white/5 border border-white/10" aria-label="رجوع"><ChevronRight size={22}/></button>
    </header>

    <main className="p-4 space-y-4">
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl p-4 bg-gradient-to-br from-amber-500/18 to-amber-950/25 border border-amber-400/25 shadow-xl"><p className="text-xs text-amber-300">Coins 🪙</p><strong className="block text-2xl mt-1 font-black font-mono">{user.gold.toLocaleString()}</strong><button type="button" onClick={() => setActiveSubScreen('recharge')} className="mt-3 w-full rounded-xl bg-amber-400 text-amber-950 font-black text-xs py-2 flex items-center justify-center gap-1"><Plus size={14}/>شحن</button></div>
        <div className="rounded-3xl p-4 bg-gradient-to-br from-cyan-500/18 to-blue-950/25 border border-cyan-400/25 shadow-xl"><p className="text-xs text-cyan-300">Diamonds 💎</p><strong className="block text-2xl mt-1 font-black font-mono">{user.diamonds.toLocaleString()}</strong><button type="button" onClick={() => setRedeeming(true)} className="mt-3 w-full rounded-xl bg-cyan-500/15 border border-cyan-400/25 text-cyan-200 font-black text-xs py-2">فك الماس</button></div>
      </section>
      <button type="button" onClick={()=>setActiveSubScreen('inventory')} className="w-full rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-emerald-100 text-xs font-bold flex items-center justify-center gap-2">
        فتح الحقيبة والمخزون — الإطارات والمركبات والهدايا المحفوظة
      </button>

      <section className="rounded-2xl bg-white/5 border border-white/8 p-3 text-xs text-slate-300">
        {breakdown.loading && <InlineLoading>جارٍ تحميل مصادر الماس…</InlineLoading>}
        {breakdown.error && <ErrorState message={breakdown.error} onRetry={()=>void breakdown.reload()}/>} 
        {breakdown.data && <div className="grid grid-cols-3 gap-2 text-center"><div><strong className="text-white block">{Number(breakdown.data.fixed_diamonds).toLocaleString()}</strong><span>Fixed</span></div><div><strong className="text-white block">{Number(breakdown.data.lucky_diamonds).toLocaleString()}</strong><span>Lucky</span></div><div><strong className="text-white block">{Number(breakdown.data.legacy_diamonds).toLocaleString()}</strong><span>Legacy</span></div></div>}
      </section>

      <section>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 rounded-2xl bg-white/5 border border-white/8 p-1">
          {([['recharge','الشحن'],['sent','مرسلة'],['received','مستلمة'],['conversion','التحويل'],['games','الألعاب'],['monthly','التسوية']] as [Tab,string][]).map(([id,label]) => <button key={id} type="button" aria-pressed={tab===id} onClick={()=>setTab(id)} className={`rounded-xl px-1 py-2 text-[11px] font-black ${tab===id?'bg-white text-slate-950 shadow-md':'text-slate-400'}`}>{label}</button>)}
        </div>
      </section>

      {tab === 'recharge' && <section className="space-y-2">
        <div className="flex items-center justify-between"><div><h2 className="font-black">طلبات الشحن</h2><p className="text-[11px] text-slate-500">يشمل الطلبات المعلقة والمقبولة والمرفوضة.</p></div><button type="button" onClick={()=>void recharge.reload()} className="ui-icon-button bg-white/5" aria-label="تحديث"><RefreshCw size={16}/></button></div>
        {recharge.loading && <InlineLoading>جارٍ تحميل طلبات الشحن…</InlineLoading>}
        {recharge.error && <ErrorState message={recharge.error} onRetry={()=>void recharge.reload()}/>} 
        {!recharge.loading && !recharge.error && !(recharge.data||[]).length && <EmptyState title="لا توجد طلبات شحن" description="أي طلب جديد من صفحة الشحن سيظهر هنا فوراً."/>}
        {(recharge.data||[]).map(row => {const status=rechargeStatus(row.status); return <article key={row.id} className="rounded-2xl bg-white/5 border border-white/8 p-3"><div className="flex items-start justify-between gap-3"><div><strong className="text-sm">{Number(row.gold_amount).toLocaleString()} 🪙</strong><p className="text-xs text-slate-400 mt-1">{row.amount_iqd ? `${Number(row.amount_iqd).toLocaleString()} د.ع` : row.price_usd ? `$${Number(row.price_usd).toFixed(2)}` : 'السعر حسب الوكيل'}</p></div><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${status.cls}`}>{status.icon}{status.label}</span></div><div className="mt-2 text-[10px] text-slate-500"><span className="ui-id block">ID: {row.id}</span><span>{new Date(row.created_at).toLocaleString('ar-IQ')}</span>{row.note&&<p className="mt-1 text-slate-400">{row.note}</p>}</div></article>})}
      </section>}

      {tab === 'sent' && <TransactionList rows={sent} empty="ما أرسلت هدايا بعد" icon="sent"/>}
      {tab === 'received' && <TransactionList rows={received} empty="ما استلمت هدايا بعد" icon="received"/>}
      {tab === 'conversion' && <TransactionList rows={conversions} empty="لا توجد عمليات تحويل بعد" icon="mixed"/>}

      {tab === 'monthly' && <section className="space-y-3">
        <header className="flex items-center justify-between gap-2">
          <div><h2 className="font-black">تقارير التسوية الشهرية</h2><p className="text-[11px] text-slate-400">تقارير محفوظة؛ لا يتم تصفير الرواتب أو المستحقات.</p></div>
          <button type="button" onClick={()=>void settlements.reload()} className="ui-icon-button bg-white/5" aria-label="تحديث تقارير التسوية"><RefreshCw size={16}/></button>
        </header>
        {settlements.loading && <InlineLoading>جارٍ تحميل التقارير…</InlineLoading>}
        {settlements.error && <ErrorState message={settlements.error} onRetry={()=>void settlements.reload()}/>}
        {!settlements.loading&&!settlements.error&&!settlements.data.hosts.length&&!settlements.data.agencies.length&&
          <EmptyState title="لا توجد تسوية مغلقة" description="سيظهر هنا التقرير بمجرد إغلاق الشهر واعتماد المستحقات في الخادم."/>}
        {settlements.data.hosts.map(row=><article key={row.settlement_month} className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-xs space-y-2">
          <div className="flex items-center justify-between"><strong className="text-cyan-200">تقرير المضيف · {row.settlement_month}</strong><span className="text-amber-300">{row.payment_status==='paid'?'مدفوع':'مستحق غير مدفوع'}</span></div>
          <div>الماس المكتسب: <strong>{Number(row.diamonds_earned).toLocaleString()}</strong></div>
          <div>الماس المفكوك يدوياً: <strong>{Number(row.diamonds_manually_redeemed).toLocaleString()}</strong></div>
          <div>الماس المحوّل تلقائياً: <strong>{Number(row.diamonds_auto_converted).toLocaleString()}</strong></div>
          <div>Coins المُرحّلة: <strong>{Number(row.coins_credited).toLocaleString()} 🪙</strong></div>
          <div>Target المضيف: <strong>{Number(row.host_target).toLocaleString()} 💎</strong></div>
          <div className="text-emerald-200 font-bold">الراتب المستحق: {Number(row.host_salary_iqd).toLocaleString()} د.ع</div>
        </article>)}
        {settlements.data.agencies.map(row=><article key={row.settlement_month+':'+row.agency_id} className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs space-y-2">
          <div className="flex items-center justify-between"><strong className="text-amber-200">الوكالة #{row.agency_id} · {row.settlement_month}</strong><span>{row.payment_status==='paid'?'مدفوع':'مستحق غير مدفوع'}</span></div>
          <div>Target الوكالة: <strong>{Number(row.target_diamonds).toLocaleString()} 💎</strong></div>
          <div>إجمالي رواتب المضيفين: <strong>{Number(row.hosts_salary_iqd).toLocaleString()} د.ع</strong></div>
          <div className="text-emerald-200 font-bold">عمولة الوكيل: {Number(row.agent_commission_iqd).toLocaleString()} د.ع</div>
        </article>)}
      </section>}

      {tab === 'games' && <section className="space-y-2">
        <div className="rounded-3xl bg-gradient-to-l from-violet-700/25 to-fuchsia-600/10 border border-violet-300/20 p-4 flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-violet-400/15 flex items-center justify-center text-violet-300"><Gamepad2/></div><div className="flex-1"><h2 className="font-black">TotiFun</h2><p className="text-xs text-slate-400">ألعاب ترفيهية بدون خصم Coins.</p></div><button type="button" onClick={()=>setActiveSubScreen('luck_games')} className="rounded-xl bg-white text-violet-950 px-3 py-2 text-xs font-black">العب</button></div>
        {games.loading && <InlineLoading>جارٍ تحميل سجل الألعاب…</InlineLoading>}
        {games.error && <ErrorState message={games.error} onRetry={()=>void games.reload()}/>} 
        {!games.loading && !games.error && !(games.data||[]).length && <EmptyState title="لا توجد نتائج ألعاب" description="العب من TotiFun وستظهر النتائج هنا."/>}
        {(games.data||[]).map(row=><article key={row.id} className="rounded-2xl bg-white/5 border border-white/8 p-3 flex items-center justify-between gap-3"><div><strong className="text-sm">{gameName(row.game_type)}</strong><p className="text-xs text-slate-400 mt-1">{gameResult(row)}</p><p className="text-[10px] text-slate-500 mt-1">{new Date(row.created_at).toLocaleString('ar-IQ')}</p></div><span className="rounded-full bg-amber-400/10 text-amber-300 px-3 py-1 text-xs font-black">+{row.score}</span></article>)}
      </section>}
    </main>
    {redeeming && <DiamondRedeemModal onClose={()=>setRedeeming(false)} onRedeemed={()=>void breakdown.reload()}/>} 
  </div>;
};

const TransactionList: React.FC<{rows:any[]; empty:string; icon:'sent'|'received'|'mixed'}> = ({rows,empty,icon}) => <section className="space-y-2">
  {!rows.length && <EmptyState title={empty}/>} 
  {rows.map(tx => {const direction = icon === 'mixed' ? (Number(tx.amount) < 0 ? 'sent' : 'received') : icon; return <article key={tx.id} className="rounded-2xl bg-white/5 border border-white/8 p-3 flex items-start justify-between gap-3"><div className="flex items-center gap-3 min-w-0"><span className={`w-10 h-10 rounded-xl flex items-center justify-center ${direction==='sent'?'bg-rose-500/12 text-rose-300':'bg-emerald-500/12 text-emerald-300'}`}>{direction==='sent'?<ArrowUpRight size={19}/>:<ArrowDownLeft size={19}/>}</span><div className="min-w-0"><strong className="text-sm block break-words">{tx.title}</strong><p className="text-[10px] text-slate-500 mt-1">{tx.date} · {tx.time}</p><span className="ui-id text-[10px] text-slate-600 block">{tx.id}</span></div></div><div className="text-left shrink-0"><span dir="ltr" className={`font-black text-sm ${tx.amount>0?'text-emerald-300':'text-slate-200'}`}>{tx.amount>0?'+':''}{Number(tx.amount).toLocaleString()} {tx.currency==='gold'?'🪙':tx.currency==='silver'?'🥈':'💎'}</span><span className="block text-[10px] text-slate-500 mt-1"><Gift size={10} className="inline"/> مكتمل</span></div></article>})}
</section>;
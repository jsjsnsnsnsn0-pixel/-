import React,{useCallback,useRef,useState} from 'react';
import {rpc,backendMessage} from '../../services/backend';
import {useServerData} from '../../hooks/useServerData';
import {InlineLoading,EmptyState,ErrorState} from '../common/UIState';
import {RefreshCw} from 'lucide-react';

type Agency={agency_id:number;name:string|null;agency_target:number;gift_count:number;agent_commission:number|null};
type Entry={id:string;public_id:number;display_name:string;month_start:string;status:string;
 diamonds_earned:number;diamonds_manually_redeemed:number;diamonds_remaining:number;
 monthly_gift_count:number;conversion_rate:number;coins_generated:number|null;
 host_salary:number|null;prepared_at:string|null;settled_at:string|null;agencies:Agency[]};
type State={month:string;entries:Entry[];totals:{hosts:number;earned_diamonds:number;unredeemed_diamonds:number;host_salaries:number;generated_coins:number;settled:number;pending:number};total_agent_commissions:number};
const money=(n:number|null|undefined)=>Number(n||0).toLocaleString('ar-IQ');
const lastMonth=()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth()-1,1).toLocaleDateString('sv-SE').slice(0,7)};
export function MonthlySettlementPanel({owner}:{owner:boolean}){
 const [month,setMonth]=useState(lastMonth);
 const [editing,setEditing]=useState<string|null>(null);
 const [hostSalary,setHostSalary]=useState('');
 const [commissions,setCommissions]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const pendingRequests=useRef(new Map<string,string>());
 const load=useCallback(()=>rpc<State>('dashboard_monthly_settlements',{p_month:month+'-01'}),[month]);
 const report=useServerData(load,{month:'',entries:[],totals:{hosts:0,earned_diamonds:0,unredeemed_diamonds:0,host_salaries:0,generated_coins:0,settled:0,pending:0},total_agent_commissions:0});
 const openEdit=(entry:Entry)=>{
   setEditing(entry.id);setHostSalary(entry.host_salary===null?'':String(entry.host_salary));
   setCommissions(Object.fromEntries(entry.agencies.map(x=>[String(x.agency_id),x.agent_commission===null?'':String(x.agent_commission)])));
   setError('');setNotice('');
 };
 const submit=async(entry:Entry)=>{
   if(busy)return;
   const salary=Number(hostSalary);
   const commissionValues=entry.agencies.map(a=>[String(a.agency_id),Number(commissions[String(a.agency_id)])] as const);
   if(hostSalary.trim()===''||!Number.isFinite(salary)||salary<0||salary>1e12||
    commissionValues.some(([id,value])=>commissions[id]?.trim()===''||!Number.isFinite(value)||value<0||value>1e12)){
    setError('أدخل راتب المضيف وجميع عمولات الوكالات بصورة صحيحة.');return;
   }
   setBusy(true);setError('');setNotice('');
   try{
    await rpc('dashboard_monthly_save_compensation',{p_public_id:entry.public_id,p_month_start:month+'-01',
       p_host_salary:salary,p_commissions:Object.fromEntries(commissionValues)});
    setEditing(null);await report.reload();setNotice('تم حفظ المستحقات في قاعدة البيانات.');
   }catch(e){setError(backendMessage(e));}
   finally{setBusy(false);}
 };
 const finalize=async(entry:Entry)=>{
  if(busy||entry.status==='settled')return;
  if(!window.confirm('تأكيد نهائي: سيتم تسجيل التسوية وصرف رصيد Diamonds الشهري وفق قواعد الخادم. هل تحققت من جميع المستحقات والنسخ الاحتياطية؟'))return;
  setBusy(true);setError('');setNotice('');
  const req=pendingRequests.current.get(entry.id)||crypto.randomUUID();
  pendingRequests.current.set(entry.id,req);
  try{
   await rpc('dashboard_monthly_finalize',{p_public_id:entry.public_id,p_month_start:month+'-01',p_request_id:req});
   pendingRequests.current.delete(entry.id);await report.reload();setNotice('أُغلقت تسوية هذا الحساب بنجاح وحُفظت سجلاتها.');
  }catch(e){setError(backendMessage(e));}
  finally{setBusy(false);}
 };
 return <section className="space-y-4" dir="rtl">
   <h2 className="text-lg font-black">التسويات الشهرية الحقيقية</h2>
   <p className="text-xs text-slate-400 leading-5">يعرض هذا القسم التسويات المُحضّرة والمسجلة فعلياً، دون توليد رواتب أو تحويل الماس تلقائياً عند فتح الصفحة. الإقفال متاح للمالك حصراً بعد مراجعة المستحقات، ولا يجوز إقفال الشهر الجاري.</p>
   <div className="flex gap-3 items-end">
     <label className="text-xs flex-1">شهر التسوية
       <input type="month" className="mt-1 w-full bg-[#161a2d] text-white rounded-xl p-3 border border-white/15" max={lastMonth()} value={month} onChange={e=>{setMonth(e.target.value);setEditing(null)}}/>
     </label>
     <button type="button" onClick={()=>void report.reload()} className="rounded-xl bg-white/10 p-3" aria-label="تحديث التسويات"><RefreshCw size={20}/></button>
   </div>
   {error&&<p role="alert" className="rounded-xl bg-rose-950/40 p-3 text-rose-200 text-sm">{error}</p>}
   {notice&&<p role="status" className="rounded-xl bg-emerald-950/40 p-3 text-emerald-200 text-sm">{notice}</p>}
   {report.loading?<InlineLoading>تحميل بيانات التسوية…</InlineLoading>:report.error?<ErrorState message={report.error} onRetry={()=>void report.reload()}/>:<>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
     {([['عدد المضيفين المُحضّرين',report.data.totals.hosts],['الماس المكتسب',report.data.totals.earned_diamonds],
       ['الماس المتبقي للتسوية',report.data.totals.unredeemed_diamonds],['إجمالي رواتب المضيفين',report.data.totals.host_salaries],
       ['إجمالي عمولات الوكلاء',report.data.total_agent_commissions],['Coins المُحوّلة',report.data.totals.generated_coins],
       ['تسويات مكتملة',report.data.totals.settled],['بانتظار التسوية',report.data.totals.pending]] as [string,number][]).map(([label,value])=>
       <div key={label} className="rounded-xl bg-white/5 border border-white/10 p-3"><span className="text-xs text-slate-400 block mb-2">{label}</span><strong>{money(value)}</strong></div>)}
    </div>
    {!report.data.entries.length?<EmptyState title="لا توجد تسويات مُحضّرة لهذا الشهر" description="هذا لا يعني عدم وجود هدايا؛ قد تحتاج سجلات الشهر إلى تحضير من النظام أولاً."/>:
    report.data.entries.map(entry=><article key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
      <div className="flex flex-wrap justify-between gap-2"><div><strong>{entry.display_name}</strong><p className="text-xs text-slate-400">User ID {entry.public_id}</p></div><span className="text-xs bg-black/20 rounded-xl px-3 py-2">{entry.status==='settled'?'مُغلقة':entry.status==='ready'?'جاهزة':'تحتاج مراجعة'}</span></div>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
       <p>الماس المستلم: {money(entry.diamonds_earned)}</p><p>الماس المفكوك يدوياً: {money(entry.diamonds_manually_redeemed)}</p>
       <p>الماس المتبقي: {money(entry.diamonds_remaining)}</p><p>الهدايا: {money(entry.monthly_gift_count)}</p>
       <p>راتب المضيف: {entry.host_salary===null?'غير محدد':money(entry.host_salary)}</p><p>Coins بعد التسوية: {money(entry.coins_generated)}</p>
      </div>
      {entry.agencies.map(a=><p key={a.agency_id} className="bg-black/20 rounded-lg p-2 text-xs text-slate-300">وكالة {a.name||a.agency_id} — الهدف {money(a.agency_target)} ماس — الهدايا {money(a.gift_count)} — عمولة الوكيل {a.agent_commission===null?'غير محددة':money(a.agent_commission)}</p>)}
      {owner&&entry.status!=='settled'&&<div className="space-y-2">
        {editing===entry.id&&<div className="rounded-xl bg-black/25 p-3 space-y-2">
          <label className="text-xs block">راتب المضيف<input type="number" min="0" step="0.01" value={hostSalary} onChange={e=>setHostSalary(e.target.value)} className="bg-[#171b2c] border border-white/20 p-2 rounded-xl text-white w-full mt-1"/></label>
          {entry.agencies.map(a=><label key={a.agency_id} className="text-xs block">عمولة وكالة {a.name||a.agency_id}<input type="number" min="0" step="0.01" className="bg-[#171b2c] border border-white/20 p-2 rounded-xl text-white w-full mt-1" value={commissions[String(a.agency_id)]||''} onChange={e=>setCommissions(v=>({...v,[String(a.agency_id)]:e.target.value}))}/></label>)}
          <button disabled={busy} onClick={()=>void submit(entry)} className="bg-cyan-600 rounded-xl px-4 py-2 text-sm disabled:opacity-40">حفظ الرواتب والعمولات بالخادم</button>
          <button disabled={busy} onClick={()=>setEditing(null)} className="rounded-xl px-4 py-2 text-sm">إلغاء</button>
        </div>}
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} onClick={()=>editing===entry.id?setEditing(null):openEdit(entry)} className="rounded-xl bg-white/10 border border-white/15 px-4 py-2 text-xs">تعديل المستحقات</button>
          {entry.status==='ready'&&<button disabled={busy} onClick={()=>void finalize(entry)} className="rounded-xl bg-rose-700/50 border border-rose-300/20 px-4 py-2 text-xs disabled:opacity-40">اعتماد وإغلاق التسوية نهائياً</button>}
        </div>
      </div>}
     </article>)}
   </>}
 </section>;
}

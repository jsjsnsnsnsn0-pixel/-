import React from 'react';
import {Activity, ChevronLeft, Gauge, RefreshCw, Signal, Wifi, WifiOff} from 'lucide-react';
import {useApp} from '../../context/AppContext';

type ConnectionInfo={effectiveType?:string;downlink?:number;rtt?:number;saveData?:boolean};
type TestResult={online:boolean;latency:number|null;quality:'جيد'|'متوسط'|'ضعيف'|'غير متصل';details:string};

const qualityClass=(quality:TestResult['quality'])=>quality==='جيد'?'text-emerald-300 bg-emerald-500/12 border-emerald-400/20':quality==='متوسط'?'text-amber-300 bg-amber-500/12 border-amber-400/20':'text-rose-300 bg-rose-500/12 border-rose-400/20';

export const InternetCheckScreen:React.FC=()=>{
  const {setActiveSubScreen}=useApp();
  const [testing,setTesting]=React.useState(false);
  const [result,setResult]=React.useState<TestResult>({online:navigator.onLine,latency:null,quality:navigator.onLine?'متوسط':'غير متصل',details:navigator.onLine?'جاهز للفحص':'لا يوجد اتصال بالإنترنت'});
  const connection=(navigator as Navigator&{connection?:ConnectionInfo}).connection;

  const runTest=React.useCallback(async()=>{
    if(testing)return;
    if(!navigator.onLine){setResult({online:false,latency:null,quality:'غير متصل',details:'الجهاز غير متصل بالإنترنت حالياً'});return;}
    setTesting(true);
    const controller=new AbortController();
    const timer=window.setTimeout(()=>controller.abort(),6000);
    const started=performance.now();
    try{
      const response=await fetch(`/?toti-netcheck=${Date.now()}`,{method:'HEAD',cache:'no-store',signal:controller.signal});
      if(!response.ok)throw new Error('network');
      const latency=Math.round(performance.now()-started);
      const quality:TestResult['quality']=latency<=180?'جيد':latency<=450?'متوسط':'ضعيف';
      setResult({online:true,latency,quality,details:quality==='جيد'?'الاتصال مناسب للغرف الصوتية':quality==='متوسط'?'الاتصال يعمل لكن قد يظهر تأخير بسيط':'الاتصال بطيء وقد يؤثر على الصوت'});
    }catch{
      setResult({online:navigator.onLine,latency:null,quality:navigator.onLine?'ضعيف':'غير متصل',details:navigator.onLine?'تعذر إكمال الفحص. الاتصال غير مستقر حالياً.':'لا يوجد اتصال بالإنترنت'});
    }finally{window.clearTimeout(timer);setTesting(false);}
  },[testing]);

  React.useEffect(()=>{
    void runTest();
    const update=()=>{if(!navigator.onLine)setResult({online:false,latency:null,quality:'غير متصل',details:'لا يوجد اتصال بالإنترنت'});else void runTest();};
    window.addEventListener('online',update);window.addEventListener('offline',update);
    return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update);};
  },[]);

  return <div dir="rtl" className="min-h-screen pb-24 text-white bg-[radial-gradient(circle_at_top_left,#143a4d_0,#11152b_34%,#080914_72%)]">
    <header className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-5 border-b border-white/8 bg-[#0b0e1c]/80 backdrop-blur-2xl">
      <div className="flex items-center gap-3">
        <button type="button" aria-label="الرجوع" onClick={()=>setActiveSubScreen('settings')} className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[.07] flex items-center justify-center"><ChevronLeft size={21}/></button>
        <span className="w-11 h-11 rounded-2xl bg-cyan-500/10 text-cyan-300 flex items-center justify-center"><Wifi size={22}/></span>
        <div><h1 className="text-lg font-black">فحص الإنترنت</h1><p className="text-[10px] text-slate-400 mt-0.5">تأكد من جودة الاتصال قبل دخول الغرف الصوتية</p></div>
      </div>
    </header>

    <main className="p-4 space-y-4">
      <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[.065] p-5 text-center shadow-2xl">
        <div className="absolute -top-12 -left-10 w-36 h-36 bg-cyan-400/15 blur-3xl rounded-full"/>
        <div className="relative">
          <div className={`mx-auto w-24 h-24 rounded-full border flex items-center justify-center ${qualityClass(result.quality)}`}>
            {result.online?<Signal size={44}/>:<WifiOff size={44}/>}
          </div>
          <p className="mt-4 text-[11px] text-slate-400">حالة الاتصال الحالية</p>
          <h2 className="mt-1 text-2xl font-black">{result.quality}</h2>
          <p className="mt-2 text-xs leading-6 text-slate-400 max-w-[280px] mx-auto">{result.details}</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-[24px] border border-white/8 bg-white/[.055] p-4">
          <span className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-300 flex items-center justify-center"><Gauge size={19}/></span>
          <p className="text-[10px] text-slate-500 mt-3">زمن الاستجابة</p>
          <p className="text-lg font-black mt-1">{result.latency!==null?`${result.latency} ms`:'—'}</p>
        </div>
        <div className="rounded-[24px] border border-white/8 bg-white/[.055] p-4">
          <span className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-300 flex items-center justify-center"><Activity size={19}/></span>
          <p className="text-[10px] text-slate-500 mt-3">نوع الشبكة</p>
          <p className="text-lg font-black mt-1">{connection?.effectiveType?.toUpperCase()||'متصل'}</p>
        </div>
      </section>

      <section className="rounded-[26px] border border-white/8 bg-white/[.055] p-4 space-y-3">
        <h2 className="text-sm font-black">تفاصيل مبسّطة</h2>
        <div className="flex justify-between gap-3 text-xs py-2 border-b border-white/7"><span className="text-slate-500">الاتصال</span><span className={result.online?'text-emerald-300':'text-rose-300'}>{result.online?'متصل':'غير متصل'}</span></div>
        <div className="flex justify-between gap-3 text-xs py-2 border-b border-white/7"><span className="text-slate-500">التأخير التقديري</span><span>{result.latency!==null?`${result.latency} ms`:'غير متاح'}</span></div>
        {typeof connection?.downlink==='number'&&<div className="flex justify-between gap-3 text-xs py-2 border-b border-white/7"><span className="text-slate-500">سرعة التنزيل التقديرية</span><span>{connection.downlink} Mbps</span></div>}
        {typeof connection?.rtt==='number'&&<div className="flex justify-between gap-3 text-xs py-2"><span className="text-slate-500">RTT من المتصفح</span><span>{connection.rtt} ms</span></div>}
      </section>

      <div className="rounded-[24px] border border-cyan-400/10 bg-cyan-500/[.06] p-4 text-[11px] leading-6 text-slate-300">
        هذا الفحص مبسّط ومخصص لتقدير جودة الاتصال داخل TotiChat. إذا كانت النتيجة ضعيفة، جرّب شبكة Wi‑Fi أقوى أو اقترب من نقطة الاتصال قبل تشغيل المايكروفون.
      </div>

      <button type="button" disabled={testing} onClick={()=>void runTest()} className="w-full min-h-[54px] rounded-2xl bg-cyan-500 text-[#07131a] font-black flex items-center justify-center gap-2 disabled:opacity-60">
        <RefreshCw size={18} className={testing?'animate-spin':''}/>{testing?'جارٍ فحص الاتصال…':'إعادة الفحص'}
      </button>
    </main>
  </div>;
};

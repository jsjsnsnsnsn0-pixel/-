
import React,{useEffect,useMemo,useState} from 'react';
import {AlertTriangle,WifiOff,X,RotateCcw,SignalLow} from 'lucide-react';
export type NetworkState='online'|'slow'|'offline';
type NetworkHints={effectiveType?:string;downlink?:number;addEventListener?:(s:string,h:()=>void)=>void;removeEventListener?:(s:string,h:()=>void)=>void};
function readConnection():NetworkState{
 if(typeof navigator==='undefined')return 'online';
 if(navigator.onLine===false)return 'offline';
 const hint=(navigator as Navigator & {connection?:NetworkHints}).connection;
 if(hint?.effectiveType==='2g'||hint?.effectiveType==='slow-2g')return 'slow';
 return 'online';
}
export function useConnectionPreview(){
 const [actual,setActual]=useState<NetworkState>(readConnection);
 const [simulated,setSimulated]=useState(false);
 const [dismissed,setDismissed]=useState(false);
 useEffect(()=>{
   const update=()=>{setActual(readConnection());setDismissed(false)};
   window.addEventListener('online',update);window.addEventListener('offline',update);
   const hint=(navigator as Navigator & {connection?:NetworkHints}).connection;
   hint?.addEventListener?.('change',update);
   return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update);hint?.removeEventListener?.('change',update)};
 },[]);
 const network:NetworkState=actual==='offline'?'offline':simulated?'slow':actual;
 return {
 network,showNotice:network!=='online'&&!dismissed,
 simulateSlow:()=>{setSimulated(true);setDismissed(false)},
 checkAgain:()=>{setActual(readConnection());setSimulated(false);setDismissed(false)},
 closeNotice:()=>setDismissed(true)
 };
}
export function ConnectionNotice({state,open,onClose,onRetry}:{state:NetworkState;open:boolean;onClose:()=>void;onRetry:()=>void}){
 if(!open||state==='online')return null;
 const offline=state==='offline';
 return <div role="dialog" aria-modal="false" aria-labelledby="ui-connection-title" aria-describedby="ui-connection-description"
 className="fixed z-[950] bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 right-3 max-w-[420px] mx-auto p-4 bg-white/95 backdrop-blur-lg rounded-[24px] border border-amber-200 shadow-[0_10px_55px_rgba(1,35,27,.30)] text-slate-900" dir="rtl">
 <button type="button" aria-label="إغلاق نافذة الاتصال" onClick={onClose} className="absolute left-3 top-3 min-w-11 min-h-11 grid place-items-center text-slate-600"><X size={20}/></button>
 <div className="flex gap-3 items-start pl-9">
 <div className="w-12 h-12 shrink-0 rounded-2xl bg-amber-50 text-amber-700 grid place-items-center">{offline?<WifiOff size={25}/>:<SignalLow size={25}/>}</div>
 <div className="min-w-0"><h2 id="ui-connection-title" className="text-base font-black">{offline?'انقطع اتصال الإنترنت':'اتصال الإنترنت ضعيف'}</h2><p id="ui-connection-description" className="text-xs leading-6 text-slate-600 mt-1">{offline?'أنت حالياً بدون اتصال حسب حالة الجهاز. قد تتوقف تحديثات الغرف والرسائل لحين عودة الاتصال.':'جودة الاتصال منخفضة أو جاري عرض سيناريو الضعف. قد تتأخر الرسائل والصوت وتحديثات الغرفة.'}</p></div>
 </div>
 <p className="mt-3 text-[11px] text-amber-800 bg-amber-50 rounded-lg px-3 py-2">هذه النافذة للمعاينة؛ لا تدّعي فحص سرعة الشبكة بخادم حقيقي.</p>
 <div className="flex gap-2 mt-3"><button type="button" onClick={onRetry} className="min-h-12 flex-1 rounded-xl bg-[#1b7050] text-white text-sm font-bold flex gap-2 items-center justify-center"><RotateCcw size={17}/> فحص الحالة</button><button type="button" onClick={onClose} className="min-h-12 flex-1 rounded-xl bg-slate-100 text-slate-800 text-sm font-bold">حسناً</button></div>
 </div>;
}

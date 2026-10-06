import React,{useState} from 'react';
import {useDismissableLayer} from '../../../hooks/useDismissableLayer';
import {X} from 'lucide-react';
export function SeatLayoutPicker({current,onClose,onSave}:{current:number;onClose:()=>void;onSave:(count:number)=>Promise<boolean>}) {
  const layerRef=useDismissableLayer(true,onClose);const [selected,setSelected]=useState(current);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const counts=[...new Set([current,9,10,12,15,17,20])].sort((a,b)=>a-b);
  return <div ref={layerRef} className="fixed inset-0 z-[130] bg-black/70 flex items-end justify-center" onClick={onClose}><section dir="rtl" role="dialog" aria-modal="true" aria-label="إعدادات الميكروفون" className="ui-sheet w-full max-w-md rounded-t-3xl bg-[#100725] text-white p-5 max-h-[90dvh] flex flex-col" onClick={event=>event.stopPropagation()}>
    <header className="flex justify-between items-center mb-5"><h2 className="font-bold text-lg">إعدادات الميكروفون</h2><button type="button" aria-label="إغلاق إعدادات الميكروفون" className="room-icon" onClick={onClose}><X/></button></header>
    <div className="grid grid-cols-3 gap-3 overflow-y-auto">{counts.map(count=><button type="button" key={count} aria-pressed={count===selected} onClick={()=>setSelected(count)} className={`p-3 rounded-2xl bg-[#241c38] border ${selected===count?'border-cyan-300':'border-transparent'}`}><span className="grid grid-cols-5 gap-1 h-20 content-center">{Array.from({length:count},(_,index)=><span key={index} className="aspect-square rounded-full bg-slate-400"/>)}</span><span className="block text-xs mt-3">{count} ميكروفون</span></button>)}</div>
    <p className="text-xs text-slate-400 my-4">الترتيب من اليمين. المقاعد المشغولة لا تُحذف عند تقليل العدد.</p>{error&&<p role="alert" className="text-sm text-rose-300 mb-3">{error}</p>}
    <button type="button" disabled={busy} className="p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-400 disabled:opacity-40" onClick={async()=>{setBusy(true);try{if(await onSave(selected))onClose();else setError('تعذر تغيير العدد. تأكد أن المقاعد المراد إزالتها فارغة.')}finally{setBusy(false)}}}>{busy?'جارٍ الحفظ…':'تأكيد'}</button>
  </section></div>;
}

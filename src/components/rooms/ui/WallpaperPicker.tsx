import React, {useRef,useState} from 'react';
import {ImagePlus,X,Check} from 'lucide-react';
import {useDismissableLayer} from '../../../hooks/useDismissableLayer';
export const roomWallpapers=[
  '/assets/images/room_cover_majlis_1790226059300.jpg',
  '/assets/images/room_cover_poetry_1790226070047.jpg',
  '/assets/images/room_wallpaper_crown_queen_1790560306491.jpg',
  '/assets/images/couple_room_cover_1790345237940.jpg',
];
export function WallpaperPicker({title,current,onClose,onSave}:{title:string;current:string;onClose:()=>void;onSave:(image:string)=>Promise<boolean>}) {
  const layerRef=useDismissableLayer(true,onClose);
  const [tab,setTab]=useState<'system'|'custom'>('system');const [selected,setSelected]=useState(current);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const fileRef=useRef<HTMLInputElement>(null);
  const pick=(file?:File)=>{if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024){setError('اختر صورة PNG أو JPG أو WEBP لا تتجاوز 5MB.');return;}const reader=new FileReader();reader.onload=()=>{setSelected(String(reader.result));setError('')};reader.onerror=()=>setError('تعذر قراءة الصورة.');reader.readAsDataURL(file)};
  return <div ref={layerRef} className="fixed inset-0 z-[130] flex justify-center bg-black/70"><section dir="rtl" role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md bg-[#0b0822] text-white h-dvh flex flex-col p-5">
    <header className="flex items-center justify-between gap-3 py-3"><h2 className="text-lg font-bold">{title}</h2><button type="button" onClick={onClose} className="room-icon" aria-label="إغلاق الخلفيات"><X/></button></header>
    <div className="flex justify-around py-5">{(['system','custom'] as const).map(value=><button type="button" key={value} aria-pressed={tab===value} onClick={()=>setTab(value)} className={tab===value?'text-cyan-300 border-b-2 border-cyan-300 pb-2':'text-slate-400'}>{value==='system'?'النظام':'مخصص'}</button>)}</div>
    <div className="flex-1 min-h-0 overflow-y-auto">{tab==='system'?<div className="grid grid-cols-2 gap-3">{roomWallpapers.map(image=><button type="button" key={image} onClick={()=>setSelected(image)} aria-label={`اختيار خلفية ${roomWallpapers.indexOf(image)+1}`} aria-pressed={image===selected} className="relative aspect-[2/3] rounded-2xl overflow-hidden"><img src={image} alt="" className="w-full h-full object-cover"/><span className="absolute top-2 right-2 rounded-full border-2 border-white w-6 h-6">{image===selected&&<Check size={20}/>}</span></button>)}</div>:<><input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" ref={fileRef} onChange={event=>pick(event.target.files?.[0])}/><button type="button" aria-label="رفع صورة من الهاتف" onClick={()=>fileRef.current?.click()} className="relative mx-auto w-4/5 aspect-[2/3] rounded-2xl bg-[#211b35] flex justify-center items-center overflow-hidden">{selected?<img src={selected} alt="معاينة الخلفية" className="w-full h-full object-cover"/>:<ImagePlus size={56}/>}</button><p className="text-sm text-slate-400 mt-4 text-center">اختر صورة من الهاتف</p></>}</div>
    {error&&<p role="alert" className="text-sm text-rose-300 my-3">{error}</p>}<button type="button" disabled={busy||!selected} className="rounded-2xl p-4 my-4 bg-gradient-to-r from-purple-500 to-cyan-400 font-bold disabled:opacity-40" onClick={async()=>{setBusy(true);try{if(await onSave(selected))onClose();else setError('تعذر حفظ الخلفية. حاول مجدداً.')}catch{setError('تعذر حفظ الخلفية.')}finally{setBusy(false)}}}>{busy?'جارٍ الحفظ…':'تأكيد'}</button>
  </section></div>;
}

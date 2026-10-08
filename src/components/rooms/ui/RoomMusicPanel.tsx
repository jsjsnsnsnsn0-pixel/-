import React,{useEffect,useRef,useState} from 'react';
import {Music,Play,Pause,Square,Plus,X,Trash2,SkipForward,Volume2} from 'lucide-react';
import {downloadUserMusic,loadUserMusic,musicFileType,removeUserMusic,uploadUserMusic,type SavedMusic} from '../../../services/userMusic';

type Track=SavedMusic & {file?:File};
interface Props{
 open:boolean;onClose:()=>void;canControl:boolean;connected:boolean;userId?:string;
 playingName:string;paused:boolean;volume:number;onVolume:(value:number)=>void;
 onPlay:(file:File)=>Promise<void>|void;onStop:()=>Promise<void>|void;
 onPause:()=>Promise<void>|void;onResume:()=>Promise<void>|void;
}
type Tab='mine'|'add'|'queue'|'now';
export function RoomMusicPanel(p:Props){
 const [tab,setTab]=useState<Tab>('mine');
 const [items,setItems]=useState<Track[]>([]);
 const [previewUrl,setPreviewUrl]=useState('');
 const [selected,setSelected]=useState<Track|null>(null);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const picker=useRef<HTMLInputElement>(null);

 // Fetch from Supabase every time the panel opens. No account's music is
 // exposed to another user and uploads persist across devices and reinstalls.
 useEffect(()=>{
   if(!p.open||!p.userId)return;
   let disposed=false;setLoading(true);setError('');setItems([]);setSelected(null);
   void loadUserMusic(p.userId).then(songs=>{
     if(!disposed)setItems(songs);
   }).catch(e=>{if(!disposed)setError(e instanceof Error?e.message:'تعذر تحميل الأغاني المحفوظة.');})
     .finally(()=>{if(!disposed)setLoading(false);});
   return()=>{disposed=true;};
 },[p.open,p.userId]);

 useEffect(()=>{
   if(!selected){setPreviewUrl('');return;}
   let disposed=false;let url='';
   const ready=async()=>{
     try{
       const file=selected.file||await downloadUserMusic(selected);
       if(disposed)return;
       url=URL.createObjectURL(file);
       setPreviewUrl(url);
     }catch(e){if(!disposed)setError(e instanceof Error?e.message:'تعذر تحميل معاينة الأغنية.');}
   };
   setPreviewUrl('');void ready();
   return()=>{disposed=true;if(url)URL.revokeObjectURL(url);};
 },[selected]);

 const add=async(file:File)=>{
   if(!p.userId){setError('سجّل الدخول حتى تنحفظ الأغاني على حسابك.');return}
   if(busy)return;
   setError('');setBusy(true);
   try{
     musicFileType(file);
     if(!file.size||file.size>15*1024*1024)throw new Error('الحجم الأقصى للأغنية 15MB.');
     const url=URL.createObjectURL(file);
     let duration:number;
     try{
       duration=await new Promise<number>((resolve,reject)=>{
         const audio=new Audio();
         const timer=setTimeout(()=>{audio.removeAttribute('src');reject(new Error('انتهت مهلة قراءة الملف'));},8000);
         audio.onloadedmetadata=()=>{clearTimeout(timer);const value=audio.duration;audio.removeAttribute('src');resolve(value)};
         audio.onerror=()=>{clearTimeout(timer);reject(new Error('تعذر قراءة الصوت'))};
         audio.preload='metadata';audio.src=url;
       });
     }finally{URL.revokeObjectURL(url);}
     if(!Number.isFinite(duration)||duration<=0||duration>3600)throw new Error('مدة الملف يجب أن تكون أقل من ساعة.');
     const saved=await uploadUserMusic(p.userId,file,duration);
     const track={...saved,file};
     setItems(previous=>[track,...previous]);
     setSelected(track);
     setTab('queue');
   }catch(e){setError(e instanceof Error?e.message:'تعذر حفظ الأغنية في حسابك.');}
   finally{setBusy(false);}
 };
 const play=async(track:Track)=>{
   if(!p.canControl||!p.connected||busy)return;
   setBusy(true);setError('');
   try{
     const file=track.file||await downloadUserMusic(track);
     await p.onPlay(file);
     const cached={...track,file};
     setItems(previous=>previous.map(x=>x.id===track.id?cached:x));
     setSelected(cached);setTab('now');
   }catch(e){setError(e instanceof Error?e.message:'تعذر تشغيل الأغنية');}
   finally{setBusy(false);}
 };
 const remove=async(track:Track)=>{
   if(busy)return;
   setBusy(true);setError('');
   try{
     await removeUserMusic(track);
     setItems(previous=>previous.filter(x=>x.id!==track.id));
     if(selected?.id===track.id)setSelected(null);
   }catch(e){setError(e instanceof Error?e.message:'تعذر حذف الأغنية من حسابك.');}
   finally{setBusy(false);}
 };
 const invoke=async(action:()=>Promise<void>|void)=>{
   if(busy||!p.canControl)return;
   setBusy(true);setError('');
   try{await action()}catch(e){setError(e instanceof Error?e.message:'تعذر تعديل التشغيل')}
   finally{setBusy(false)}
 };
 if(!p.open)return null;
 return <div className="fixed inset-0 z-[190] flex items-end justify-center bg-black/65" onClick={p.onClose}>
  <section role="dialog" aria-modal="true" aria-label="موسيقى الغرفة" dir="rtl" className="w-full max-w-md rounded-t-[28px] border-t border-cyan-400/20 bg-[#101426] p-4 text-white max-h-[83vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
   <div className="flex justify-between items-center mb-4"><h2 className="font-black text-lg flex gap-2 items-center"><Music className="text-cyan-300"/> موسيقى الغرفة</h2><button onClick={p.onClose} aria-label="إغلاق الموسيقى" className="p-2"><X/></button></div>
   <div className="grid grid-cols-4 gap-1 text-[11px] mb-4">
    {([['mine','قائمتي'],['add','إضافة موسيقى'],['queue','قائمة التشغيل'],['now','التشغيل الآن']] as [Tab,string][]).map(([id,label])=><button key={id} onClick={()=>setTab(id)} className={'rounded-xl px-1 py-3 '+(tab===id?'bg-cyan-600/35 border border-cyan-300/40':'bg-white/5')}>{label}</button>)}
   </div>
   {error&&<p role="alert" className="rounded-xl bg-rose-950/50 text-rose-200 p-3 text-xs mb-2">{error}</p>}
   <p className="mb-3 text-[11px] text-emerald-200/80">أغانيك محفوظة بشكل خاص بحسابك، وتظهر عند الدخول من أي هاتف. الحد 30 أغنية / 150MB.</p>
   {loading&&<p role="status" className="text-sm text-cyan-200">جار تحميل أغاني حسابك...</p>}
   {tab==='add'&&<div className="space-y-3">
    <p className="text-xs text-slate-400">اختر ملفاً صوتياً من هاتفك. يُحفظ في مكتبتك الخاصة، ولا يسمعه الآخرون إلا عندما تبثّه داخل الغرفة.</p>
    <input type="file" ref={picker} accept=".mp3,.m4a,.mp4,.ogg,.webm,.wav,audio/*" className="hidden" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void add(file)}}/>
    <button disabled={busy||loading||!p.userId} className="w-full rounded-xl bg-cyan-600 py-3 flex items-center justify-center gap-2 font-bold disabled:opacity-50" onClick={()=>picker.current?.click()}><Plus size={18}/> {busy?'جار الحفظ...':'اختيار أغنية وحفظها بحسابي'}</button>
    <p className="text-[11px] text-slate-500">MP3 / M4A / OGG / WebM / WAV — حتى 15MB، وأقل من ساعة لكل ملف.</p>
   </div>}
   {(tab==='mine'||tab==='queue')&&<div className="space-y-2">
    {!loading&&!items.length?<p className="text-sm text-slate-400 text-center py-8">ماكو أغاني محفوظة. أضف أغنية مرة واحدة وتبقى بحسابك.</p>:items.map((track,i)=><div key={track.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
     <div className="min-w-0 flex-1"><strong className="block text-sm truncate">{track.name}</strong><span className="text-xs text-slate-400">{Math.floor(track.duration_seconds/60)}:{String(Math.floor(track.duration_seconds%60)).padStart(2,'0')} · {(track.file_size_bytes/1048576).toFixed(1)} MB</span></div>
     <button type="button" onClick={()=>{setSelected(track);setTab('now')}} aria-label={`معاينة ${track.name}`} className="rounded-lg px-2 py-2 bg-white/10 text-xs text-cyan-100">استماع</button>
     {p.canControl&&<button disabled={busy||!p.connected} onClick={()=>void play(track)} className="rounded-lg p-2 bg-cyan-600/35 disabled:opacity-40" aria-label={`تشغيل ${track.name}`}><Play size={15}/></button>}
     <button disabled={busy} onClick={()=>void remove(track)} aria-label={`حذف ${track.name} من قائمتي`} className="rounded-lg p-2 text-rose-200 disabled:opacity-40"><Trash2 size={15}/></button>
     <span className="text-[10px] text-slate-500">{i+1}</span>
    </div>)}
   </div>}
   {tab==='now'&&<div className="space-y-4">
    <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-600/15 p-5 text-center border border-cyan-500/10"><Music size={44} className="mx-auto text-cyan-300 mb-3"/><strong className="block break-all">{p.playingName||'لا توجد أغنية قيد التشغيل'}</strong><span className="text-xs text-slate-400">{p.playingName?(p.paused?'متوقف مؤقتاً':'يُبث صوتها عبر LiveKit'):'بانتظار الموسيقى'}</span></div>
    {p.canControl&&p.playingName&&<div className="flex items-center justify-center gap-3">
     <button disabled={busy} onClick={()=>void invoke(p.paused?p.onResume:p.onPause)} className="rounded-xl p-3 bg-cyan-600/35">{p.paused?<Play/>:<Pause/>}</button>
     <button disabled={busy} onClick={()=>void invoke(p.onStop)} className="rounded-xl p-3 bg-rose-600/20" aria-label="إيقاف موسيقى الغرفة"><Square/></button>
     {items.length>1&&<button disabled={busy} onClick={()=>{const next=items.find(x=>x.name!==p.playingName);if(next)void play(next)}} className="rounded-xl p-3 bg-white/10" aria-label="الأغنية التالية"><SkipForward/></button>}
    </div>}
    {selected&&previewUrl&&<div><p className="text-xs text-slate-400 mb-1">معاينة الملف عندك فقط</p><audio controls preload="none" src={previewUrl} className="w-full"/></div>}
   </div>}
   <div className="border-t border-white/10 mt-4 pt-4 flex items-center gap-3"><Volume2 size={18} className="text-cyan-300"/><label className="text-xs flex-1" htmlFor="room-music-local-volume">صوت الموسيقى عندك فقط</label><input id="room-music-local-volume" type="range" min="0" max="100" value={Math.round(p.volume*100)} onChange={e=>p.onVolume(Number(e.target.value)/100)} className="w-24"/><span className="text-xs">{Math.round(p.volume*100)}%</span></div>
  </section>
 </div>;
}

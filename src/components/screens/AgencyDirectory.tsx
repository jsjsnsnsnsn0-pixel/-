import React,{useCallback,useEffect,useState} from 'react';
import {useApp} from '../../context/AppContext';
import {useServerData} from '../../hooks/useServerData';
import {rpc} from '../../services/backend';
import {EmptyState,ErrorState,InlineLoading} from '../common/UIState';
interface DirectoryAgency {id:number;name:string;logo_url:string|null;owner_name?:string;members_count?:number;requested:boolean}
export const AgencyDirectory:React.FC=()=>{
 const {user,setActiveSubScreen}=useApp();const [search,setSearch]=useState('');
 const load=useCallback(()=>rpc<DirectoryAgency[]>('agency_directory'),[user.authId]);
 const {data,loading,error,reload}=useServerData(load,[]);
 useEffect(()=>{const sync=()=>{if(document.visibilityState!=='hidden')void reload()};const timer=setInterval(sync,15000);window.addEventListener('focus',sync);return()=>{clearInterval(timer);window.removeEventListener('focus',sync)}},[reload]);
 const agencies=data.filter(a=>a.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())||String(a.id).includes(search.trim()));
 return <section className="space-y-4"><h2 className="text-lg font-bold text-amber-200">اختر وكالة للانضمام كمضيف</h2><p className="text-sm text-slate-400">يمكنك طلب الانضمام؛ العضوية تُعتمد بواسطة مدير الوكالة.</p>
  <input type="search" aria-label="البحث عن وكالة" placeholder="اسم الوكالة أو ID" value={search} onChange={e=>setSearch(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/15 p-3" />
  {loading?<InlineLoading>جارٍ تحميل الوكالات…</InlineLoading>:error?<ErrorState message={error} onRetry={()=>void reload()}/>:agencies.length?agencies.map(a=><button key={a.id} onClick={()=>setActiveSubScreen(`agency:${a.id}`)} className="w-full flex items-center gap-3 text-right p-4 rounded-2xl bg-white/5 border border-amber-300/20">
   {a.logo_url&&<img src={a.logo_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" onError={e=>{e.currentTarget.style.display='none'}}/>}
   <span className="min-w-0 flex-1"><strong className="block break-words">{a.name}</strong><span className="block text-xs text-slate-400 mt-1">ID: {a.id}{a.owner_name&&` · الوكيل: ${a.owner_name}`}</span>{typeof a.members_count==='number'&&<span className="block text-xs text-slate-400 mt-1">الأعضاء: {a.members_count}</span>}{a.requested&&<span className="block text-xs text-amber-200 mt-2">طلب الانضمام قيد المراجعة</span>}</span><span aria-hidden="true" className="text-amber-200">‹</span>
  </button>):<EmptyState title={data.length?'لا توجد نتائج مطابقة.':'لا توجد وكالات متاحة حالياً.'} />}
 </section>;
};

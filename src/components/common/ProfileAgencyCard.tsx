import React,{useCallback,useEffect} from 'react';
import {Building2,ChevronLeft} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {useServerData} from '../../hooks/useServerData';
import {rpc} from '../../services/backend';
import {publicId} from '../../services/roomPublicProfile';
import {ErrorState,InlineLoading} from './UIState';
export interface ProfileAgency {id:string;name:string;logo?:string;role?:string}
export function parseProfileAgency(row:Record<string,unknown>|null):ProfileAgency|null {
 if(row===null)return null;
 if(!row||!publicId(row.id)||typeof row.name!=='string'||!row.name.trim())throw new Error('agency unavailable');
 const roles:Record<string,string>={member:'عضو',host:'مضيف',moderator:'مشرف',manager:'مدير',owner:'مالك'};
 return {id:publicId(row.id),name:row.name,role:typeof row.role==='string'?roles[row.role]:undefined,logo:typeof row.logo_url==='string'&&/^(https:\/\/|\/[^/])/.test(row.logo_url)?row.logo_url:undefined};
}
export const ProfileAgencyCard:React.FC<{targetId:string;mine:boolean}>=({targetId,mine})=>{
 const {setActiveSubScreen}=useApp();
 const load=useCallback(async()=>parseProfileAgency(await rpc<Record<string,unknown>|null>('profile_agency',{p_public_id:Number(targetId)})),[targetId]);
 const {data,loading,error,reload}=useServerData(load,null);
 useEffect(()=>{const sync=()=>{if(document.visibilityState!=='hidden')void reload()};const timer=setInterval(sync,15000);window.addEventListener('focus',sync);document.addEventListener('visibilitychange',sync);return()=>{clearInterval(timer);window.removeEventListener('focus',sync);document.removeEventListener('visibilitychange',sync)}},[reload]);
 return <section aria-label="وكالة المستخدم" className="mt-5 rounded-3xl border border-purple-300/15 bg-purple-300/5 p-4">
 <h2 className="text-xs text-purple-200 mb-3">الوكالة</h2>
 {error?<ErrorState message={error} onRetry={()=>void reload()}/>:loading?<InlineLoading>جارٍ تحديث الوكالة…</InlineLoading>:data?<button type="button" onClick={()=>setActiveSubScreen(`agency:${data.id}`)} className="w-full flex items-center gap-3 text-right min-h-16">
 <span className="w-14 h-14 shrink-0 rounded-2xl bg-white/5 overflow-hidden flex items-center justify-center"><Building2 size={24} className={data.logo?'hidden':'text-purple-200'}/>{data.logo&&<img src={data.logo} alt="" className="w-full h-full object-cover" onError={e=>{e.currentTarget.style.display='none';e.currentTarget.previousElementSibling?.classList.remove('hidden')}}/>}</span>
 <span className="flex-1 min-w-0"><span className="block font-bold break-words">{data.name}</span><span className="block text-xs text-slate-300 mt-1" dir="ltr">ID: {data.id}</span>{data.role&&<span className="inline-block text-xs text-purple-200 bg-purple-400/10 px-2 py-1 rounded-lg mt-2">{data.role}</span>}</span><ChevronLeft size={20} className="shrink-0 text-purple-200"/>
 </button>:mine?<button type="button" onClick={()=>setActiveSubScreen('agency')} className="w-full flex items-center gap-3 text-right min-h-16"><Building2 size={26} className="text-purple-200 shrink-0"/><span className="flex-1"><span className="block text-sm text-slate-300">لست منضماً إلى وكالة</span><span className="block font-bold text-purple-200 mt-1">انضم إلى وكالة</span></span><ChevronLeft size={20}/></button>:<p className="text-sm text-slate-300">غير منضم إلى وكالة</p>}
 </section>;
};

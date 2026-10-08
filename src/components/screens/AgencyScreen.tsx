import {EmptyState,InlineLoading,ErrorState} from '../common/UIState';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useApp} from '../../context/AppContext';
import {usePublicChat} from '../../hooks/usePublicChat';
import {useServerData} from '../../hooks/useServerData';
import {rpc, backendMessage} from '../../services/backend';
import {AgencyRegistrationForm} from './AgencyRegistrationForm';
import {AgencyDirectory} from './AgencyDirectory';
interface Agency {id: number; name: string; owner_id?: string; logo_url?:string}
interface Member {public_id: number; display_name: string}
interface State {agency: Agency | null; available: Agency[]; members: Member[]; applications: Member[]; can_manage?:boolean; can_leave?:boolean; can_request?:boolean;has_pending_request?:boolean}
export const AgencyScreen: React.FC<{agencyId?:string}> = ({agencyId}) => {
  const {user, setActiveSubScreen, reportError} = useApp();
  const {opening, openChat} = usePublicChat();
  const [busy,setBusy] = useState(false);
  const actionBusy=useRef(false);
  const [notice,setNotice] = useState('');
  const [view,setView]=useState<'portal'|'agent'|'host'>('portal');
  const load = useCallback(() => rpc<State>(agencyId?'agency_detail':'agency_state',agencyId?{p_agency_id:Number(agencyId)}:{}), [user.authId,agencyId]);
  const {data,loading,error,reload} = useServerData(load, {agency:null,available:[],members:[],applications:[]});
  useEffect(()=>{const sync=()=>{if(document.visibilityState!=='hidden')void reload()};const t=setInterval(sync,15000);window.addEventListener('focus',sync);document.addEventListener('visibilitychange',sync);return()=>{clearInterval(t);window.removeEventListener('focus',sync);document.removeEventListener('visibilitychange',sync)}},[reload]);
  const act = async (id: number, action: string, target?: number) => {
    if (actionBusy.current) return; actionBusy.current=true;setBusy(true); setNotice('');
    try {await rpc('agency_action', {p_agency_id:id,p_action:action,p_target_public_id:target ?? null}); setNotice(action==='request'?'تم إرسال طلب الانضمام كمضيف وهو قيد المراجعة.':'تم اعتماد العملية من الخادم.'); await reload();}
    catch(e) {reportError(backendMessage(e));} finally {actionBusy.current=false;setBusy(false);}
  };
  const agency = !loading&&!error&&(!agencyId||String(data?.agency?.id)===agencyId)?data?.agency:null;
  const isOwner = agencyId?data?.can_manage===true:agency?.owner_id === user.authId;
  return <div dir="rtl" className="min-h-screen bg-[#0b0c16] text-white p-4 pb-28">
    <header className="flex items-center gap-3 mb-4"><button className="ui-control px-3 rounded-xl bg-white/5" onClick={() => view==='portal'?setActiveSubScreen(null):setView('portal')}>الرجوع</button><h1 className="text-base font-bold">بوابة الوكالات</h1></header>
    {view==='portal'&&!agencyId&&<div className="relative overflow-hidden rounded-3xl mb-5" style={{aspectRatio:'768 / 440'}}>
      <img src="/assets/images/agency_login_portal_1790714750581.jpg" alt="" className="absolute w-full max-w-none" style={{top:'-102.27%'}} />
      <button aria-label="سجل الدخول وكيل" onClick={()=>setView('agent')} className="absolute left-[8%] right-[8%] top-[3%] h-[35%] rounded-full focus-visible:outline-2 focus-visible:outline-amber-200"><span className="sr-only">سجل الدخول وكيل</span></button>
      <button aria-label="سجل الدخول مضيف" onClick={()=>setView('host')} className="absolute left-[8%] right-[8%] top-[45%] h-[35%] rounded-full focus-visible:outline-2 focus-visible:outline-amber-200"><span className="sr-only">سجل الدخول مضيف</span></button>
    </div>}
    {view==='agent'?<AgencyRegistrationForm/>:view==='host'?<AgencyDirectory/>:<>
    {loading && <InlineLoading>جارٍ تحميل الوكالات…</InlineLoading>}{error && <ErrorState message={error} onRetry={()=>void reload()}/>}{notice && <p role="status" className="p-3">{notice}</p>}
    {agency && <section className="p-4 bg-white/10 rounded-2xl mb-4">{agency.logo_url&&<img src={agency.logo_url} alt="" className="w-16 h-16 rounded-2xl object-cover mb-3" onError={e=>{e.currentTarget.style.display='none'}}/>}<h2 className="font-bold text-base break-words">{agency.name}</h2><p className="ui-id text-xs text-slate-400 mt-1">ID: {agency.id}</p><p className="my-3">الأعضاء: {data.members.length}</p>
      {data.members.map(m => <div key={m.public_id} className="flex items-center justify-between gap-3 p-3 border-b border-white/5 min-w-0"><span className="min-w-0 flex-1"><span className="block text-sm truncate">{m.display_name}</span><span className="ui-id text-xs text-slate-400">ID: {m.public_id}</span></span>{isOwner && m.public_id !== Number(user.id) && <button className="ui-control px-3 rounded-xl text-rose-300 bg-rose-500/10" disabled={busy} onClick={() => void act(agency.id,'remove',m.public_id)}>إزالة</button>}</div>)}
      {isOwner && !data.applications.length && <div className="text-slate-400 mt-3"><EmptyState title="لا توجد طلبات انضمام معلقة" /></div>}{isOwner ? data.applications.map(m => <div key={m.public_id} className="flex flex-wrap items-center gap-2 p-3 border-b border-white/5"><span>{m.display_name}</span><button className="ui-control px-3 rounded-xl bg-emerald-700 text-white" disabled={busy} onClick={() => void act(agency.id,'accept',m.public_id)}>قبول</button><button className="ui-control px-3 rounded-xl bg-rose-500/10 text-rose-300" disabled={busy} onClick={() => void act(agency.id,'reject',m.public_id)}>رفض</button></div>) : (!agencyId||data.can_leave)&&<button className="ui-control px-3 rounded-xl bg-rose-500/10 text-rose-300" disabled={busy} onClick={() => void act(agency.id,'leave')}>مغادرة الوكالة</button>}
      {agencyId&&data.can_request&&<button className="ui-control px-3 rounded-xl bg-purple-600" disabled={busy} onClick={()=>void act(agency.id,'request')}>طلب الانضمام كمضيف</button>}
      {agencyId&&data.has_pending_request&&<p role="status" className="mt-3 text-sm text-amber-200">طلب الانضمام كمضيف قيد المراجعة</p>}
    </section>}
    {!loading && !error && !agency && !agencyId && <><p className="mb-4">يمكنك طلب الانضمام؛ العضوية تُعتمد بواسطة مدير الوكالة.</p>{!data?.available.length && <EmptyState title="لا توجد وكالات متاحة حالياً." />}</>}
    </>}
    <button disabled={opening} onClick={() => void openChat()} className="w-full p-4 mt-6 rounded-2xl bg-amber-700">الدعم الرسمي — <span>451305</span></button>
  </div>;
};

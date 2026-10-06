import {EmptyState,InlineLoading,ErrorState} from '../common/UIState';
import React, {useCallback, useState} from 'react';
import {useApp} from '../../context/AppContext';
import {usePublicChat} from '../../hooks/usePublicChat';
import {useServerData} from '../../hooks/useServerData';
import {rpc, backendMessage} from '../../services/backend';
interface Agency {id: number; name: string; owner_id: string}
interface Member {public_id: number; display_name: string}
interface State {agency: Agency | null; available: Agency[]; members: Member[]; applications: Member[]}
export const AgencyScreen: React.FC = () => {
  const {user, setActiveSubScreen, reportError} = useApp();
  const {opening, openChat} = usePublicChat();
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState('');
  const load = useCallback(() => rpc<State>('agency_state'), [user.authId]);
  const {data,loading,error,reload} = useServerData(load, {agency:null,available:[],members:[],applications:[]});
  const act = async (id: number, action: string, target?: number) => {
    if (busy) return; setBusy(true); setNotice('');
    try {await rpc('agency_action', {p_agency_id:id,p_action:action,p_target_public_id:target ?? null}); setNotice('تم اعتماد العملية من الخادم.'); await reload();}
    catch(e) {reportError(backendMessage(e));} finally {setBusy(false);}
  };
  const agency = data?.agency;
  const isOwner = agency?.owner_id === user.authId;
  return <div dir="rtl" className="min-h-screen bg-[#0b0c16] text-white p-4 pb-28">
    <header className="flex items-center gap-3 mb-4"><button className="ui-control px-3 rounded-xl bg-white/5" onClick={() => setActiveSubScreen(null)}>الرجوع</button><h1 className="text-base font-bold">بوابة الوكالات</h1></header>
    <img src="/assets/images/agency_login_portal_1790714750581.jpg" alt="بوابة الوكالة" className="w-full h-52 object-cover rounded-3xl mb-5" />
    {loading && <InlineLoading>جارٍ تحميل الوكالات…</InlineLoading>}{error && <ErrorState message={error} onRetry={()=>void reload()}/>}{notice && <p role="status" className="p-3">{notice}</p>}
    {agency && <section className="p-4 bg-white/10 rounded-2xl mb-4"><h2 className="font-bold text-base break-words">{agency.name}</h2><p className="ui-id text-xs text-slate-400 mt-1">ID: {agency.id}</p><p className="my-3">الأعضاء: {data.members.length}</p>
      {data.members.map(m => <div key={m.public_id} className="flex items-center justify-between gap-3 p-3 border-b border-white/5 min-w-0"><span className="min-w-0 flex-1"><span className="block text-sm truncate">{m.display_name}</span><span className="ui-id text-xs text-slate-400">ID: {m.public_id}</span></span>{isOwner && m.public_id !== Number(user.id) && <button className="ui-control px-3 rounded-xl text-rose-300 bg-rose-500/10" disabled={busy} onClick={() => void act(agency.id,'remove',m.public_id)}>إزالة</button>}</div>)}
      {isOwner && !data.applications.length && <div className="text-slate-400 mt-3"><EmptyState title="لا توجد طلبات انضمام معلقة" /></div>}{isOwner ? data.applications.map(m => <div key={m.public_id} className="flex flex-wrap items-center gap-2 p-3 border-b border-white/5"><span>{m.display_name}</span><button className="ui-control px-3 rounded-xl bg-emerald-700 text-white" disabled={busy} onClick={() => void act(agency.id,'accept',m.public_id)}>قبول</button><button className="ui-control px-3 rounded-xl bg-rose-500/10 text-rose-300" disabled={busy} onClick={() => void act(agency.id,'reject',m.public_id)}>رفض</button></div>) : <button className="ui-control px-3 rounded-xl bg-rose-500/10 text-rose-300" disabled={busy} onClick={() => void act(agency.id,'leave')}>مغادرة الوكالة</button>}
    </section>}
    {!loading && !error && !agency && <><p className="mb-4">يمكنك طلب الانضمام؛ العضوية تُعتمد بواسطة مدير الوكالة.</p>{(data?.available || []).map(a => <div key={a.id} className="flex items-center gap-3 justify-between p-3 bg-white/10 rounded-xl mb-2"><span className="flex-1 min-w-0"><span className="block text-sm truncate">{a.name}</span><span className="ui-id text-xs text-slate-400">ID: {a.id}</span></span><button className="ui-control shrink-0 px-3 rounded-xl bg-purple-600 text-white text-xs" disabled={busy} onClick={() => void act(a.id,'request')}>طلب الانضمام</button></div>)}{!data?.available.length && <EmptyState title="لا توجد وكالات متاحة حالياً." />}</>}
    <button disabled={opening} onClick={() => void openChat()} className="w-full p-4 mt-6 rounded-2xl bg-amber-700">الدعم الرسمي — <span>451305</span></button>
  </div>;
};

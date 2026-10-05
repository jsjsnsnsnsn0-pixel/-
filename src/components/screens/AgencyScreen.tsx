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
  return <div dir="rtl" className="min-h-screen bg-[#030611] text-white p-4 pb-28">
    <header className="flex gap-4 mb-6"><button onClick={() => setActiveSubScreen(null)}>الرجوع</button><h1>بوابة الوكالات</h1></header>
    <img src="/assets/images/agency_login_portal_1790714750581.jpg" alt="بوابة الوكالة" className="w-full h-52 object-cover rounded-3xl mb-5" />
    {loading && <p>جارٍ تحميل الوكالات…</p>}{error && <button onClick={() => void reload()}>{error} — إعادة المحاولة</button>}{notice && <p role="status" className="p-3">{notice}</p>}
    {agency && <section className="p-4 bg-white/10 rounded-2xl mb-4"><h2>{agency.name} — {agency.id}</h2><p className="my-3">الأعضاء: {data.members.length}</p>
      {data.members.map(m => <div key={m.public_id} className="flex justify-between p-2"><span>{m.display_name} — {m.public_id}</span>{isOwner && m.public_id !== Number(user.id) && <button disabled={busy} onClick={() => void act(agency.id,'remove',m.public_id)}>إزالة</button>}</div>)}
      {isOwner ? data.applications.map(m => <div key={m.public_id} className="flex gap-3 p-2"><span>{m.display_name}</span><button disabled={busy} onClick={() => void act(agency.id,'accept',m.public_id)}>قبول</button><button disabled={busy} onClick={() => void act(agency.id,'reject',m.public_id)}>رفض</button></div>) : <button disabled={busy} onClick={() => void act(agency.id,'leave')}>مغادرة الوكالة</button>}
    </section>}
    {!loading && !error && !agency && <><p className="mb-4">يمكنك طلب الانضمام؛ العضوية تُعتمد بواسطة مدير الوكالة.</p>{(data?.available || []).map(a => <div key={a.id} className="flex justify-between p-3 bg-white/10 rounded-xl mb-2"><span>{a.name} — {a.id}</span><button disabled={busy} onClick={() => void act(a.id,'request')}>طلب الانضمام</button></div>)}{!data?.available.length && <p>لا توجد وكالات متاحة حالياً.</p>}</>}
    <button disabled={opening} onClick={() => void openChat()} className="w-full p-4 mt-6 rounded-2xl bg-amber-700">الدعم الرسمي — <span>451305</span></button>
  </div>;
};

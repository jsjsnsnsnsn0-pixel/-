import {InlineLoading,ErrorState,EmptyState} from '../common/UIState';
import React, { useCallback, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useServerData } from '../../hooks/useServerData';
import { rpc, backendMessage } from '../../services/backend';
import { profileToUser } from '../../services/profile';
import { UserAvatar } from '../common/UserAvatar';
const kinds = {friends: 'الأصدقاء', followers: 'المتابعون', following: 'أتابعهم', requests: 'الطلبات', visitors: 'الزوار', blocked: 'المحظورون'};
export const FriendsModal: React.FC<{initialKind?: keyof typeof kinds}> = ({initialKind = 'friends'}) => {
  const {user, setActiveSubScreen, setSelectedChatUser, reportError} = useApp();
  const [kind, setKind] = useState(initialKind);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => rpc<Record<string, unknown>[]>('social_list', {p_kind: kind}), [kind, user.authId]);
  const {data, loading, error, reload} = useServerData(load, []);
  const act = async (id: string, action: string) => {
    if (busy) return; setBusy(true);
    try { await rpc('social_action', {p_public_id: Number(id), p_action: action}); await reload(); }
    catch (e) { reportError(backendMessage(e)); } finally { setBusy(false); }
  };
  return <div className="min-h-screen bg-[#0b0c16] text-slate-100 pb-28 p-4" dir="rtl">
    <header className="flex items-center gap-3 mb-4"><button onClick={() => setActiveSubScreen(null)}>الرجوع</button><h1 className="text-base font-bold">شبكة الأصدقاء والمتابعين</h1></header>
    <div className="grid grid-cols-3 gap-2 text-xs mb-4">{Object.entries(kinds).map(([key,label]) => <button key={key} aria-pressed={kind===key} onClick={() => setKind(key as keyof typeof kinds)} className={`rounded-xl p-3 ${kind === key ? 'bg-purple-600' : 'bg-slate-800'}`}>{label}</button>)}</div>
    {loading && <InlineLoading>جارٍ تحميل العلاقات…</InlineLoading>}{error && <ErrorState message={error} onRetry={()=>void reload()}/>}
    {!loading && !error && !data?.length && <EmptyState title="لا توجد بيانات في هذه القائمة حالياً." />}
    {(data || []).map(row => {const target = profileToUser(row); return <div key={target.id} className="flex items-center gap-3 bg-slate-800 rounded-2xl p-3 mb-2 min-w-0">
      <UserAvatar user={target} size="sm" /><button className="flex-1 min-w-0 text-right" onClick={() => {setSelectedChatUser(target); setActiveSubScreen('user_detail_profile');}}><p className="truncate">{target.name}</p><span className="text-xs">ID: {target.id}</span></button>
      {kind === 'requests' ? <><button disabled={busy} onClick={() => void act(target.id,'accept')}>قبول</button><button disabled={busy} onClick={() => void act(target.id,'reject')}>رفض</button></> : kind === 'blocked' ? <button disabled={busy} onClick={() => void act(target.id,'unblock')}>إلغاء الحظر</button> : <button onClick={() => {setSelectedChatUser(target); setActiveSubScreen('chat_detail');}}>رسالة</button>}
    </div>;})}<button className="p-3 mt-3 bg-purple-600 rounded-xl" onClick={() => setActiveSubScreen('search')}>البحث عن مستخدم</button>
  </div>;
};

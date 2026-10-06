import {LevelBadge} from '../common/LevelBadge';
import {InlineLoading,ErrorState} from '../common/UIState';
import React, {useCallback, useState} from 'react';
import {useApp} from '../../context/AppContext';
import {useServerData} from '../../hooks/useServerData';
import {rpc, backendMessage} from '../../services/backend';
import {profileToUser} from '../../services/profile';
import {UserAvatar} from '../common/UserAvatar';
import {VIPBadge} from '../common/VIPBadge';
import {RoyalAccountId} from '../common/RoyalAccountId';
import {ShimmeringAccountName} from '../common/ShimmeringAccountName';
interface Social extends Record<string, unknown> {is_following: boolean; is_blocked: boolean; friend_status: string}
interface Couple {partner: {public_id: number}; requested_by: string; accepted_at: string | null}
export const UserDetailProfileScreen: React.FC = () => {
  const {user: me, selectedChatUser, setSelectedChatUser, setActiveSubScreen, reportError} = useApp();
  const target = selectedChatUser || me;
  const mine = target.id === me.id;
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState('');
  const load = useCallback(async () => {
    const [social,couples] = await Promise.all([rpc<Social>('social_profile',{p_public_id:Number(target.id),p_visit:!mine}),rpc<{relations:Couple[]}>('couple_state')]);
    return {social,couples};
  }, [target.id,me.authId,mine]);
  const {data,loading,error,reload} = useServerData(load, null);
  const social = data?.social;
  const user = social ? profileToUser(social) : target;
  const relationship = data?.couples?.relations?.find(c => c.partner.public_id === Number(target.id));
  const act = async (action: string, couple = false) => {
    if (busy) return; setBusy(true); setNotice('');
    try {await rpc(couple ? 'couple_action' : 'social_action', {p_public_id:Number(target.id),p_action:action}); setNotice('تم اعتماد العملية.'); await reload();}
    catch(e) {reportError(backendMessage(e));} finally {setBusy(false);}
  };
  return <div dir="rtl" className="min-h-screen bg-[#0b0c16] text-white p-4 pb-28">
    <button onClick={() => setActiveSubScreen(null)} className="ui-control mb-4 px-3 rounded-xl bg-white/5">الرجوع</button>
    <section className="rounded-3xl bg-emerald-950 p-6 text-center"><UserAvatar user={user} size="lg" /><h1 className="text-xl font-bold mt-3 break-words"><ShimmeringAccountName tone="dark" name={user.name} styleKey={user.nameShimmerStyle} /></h1><div className="flex flex-wrap justify-center items-center gap-2 mt-2"><VIPBadge level={user.vipLevel} />{user.hasPublicLevel!==false&&<LevelBadge level={user.level} size="sm" />}{user.countryCode&&<span className="text-xs text-slate-300">{user.countryFlag} {user.countryCode}</span>}{user.gender&&<span className="text-xs text-slate-300">{user.gender==='female'?'أنثى':'ذكر'}</span>}</div><div className="mt-3"><RoyalAccountId id={user.id} vipLevel={user.vipLevel} /></div><p className="whitespace-pre-wrap break-words mt-4">{user.bio}</p></section>
    {loading && <InlineLoading>جارٍ تحميل الملف…</InlineLoading>}{error && <ErrorState message={error} onRetry={()=>void reload()}/>}{notice && <p role="status" className="p-3">{notice}</p>}
    <div className="grid grid-cols-3 text-center gap-2 my-4 rounded-2xl p-4 bg-white/5 text-sm leading-7"><p>{user.friendsCount}<br/>أصدقاء</p><p>{user.followersCount}<br/>متابعون</p><p>{user.followingCount}<br/>أتابعهم</p></div>
    {user.equipment && <section className="p-4 bg-white/10 rounded-2xl my-4"><h2 className="text-sm font-bold">المنتجات المجهزة</h2>{Object.values(user.equipment).map(item => item && <p key={item.id} className="my-2">{item.icon} {item.name}</p>)}</section>}
    {mine ? <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white/5 p-3"><button onClick={() => setActiveSubScreen('edit_profile')}>تعديل الملف</button><button onClick={() => setActiveSubScreen('visitors')}>الزوار</button><button onClick={() => setActiveSubScreen('friends')}>العلاقات</button><button onClick={() => setActiveSubScreen('agency')}>الوكالة</button></div> : <>
      <div className="grid grid-cols-2 gap-3 my-4">
        <button disabled={busy || loading || !social} onClick={() => void act(social?.is_following ? 'unfollow':'follow')} className="p-3 rounded-xl bg-emerald-700">{social?.is_following ? 'إلغاء المتابعة':'متابعة'}</button>
        <button onClick={() => {setSelectedChatUser(user);setActiveSubScreen('chat_detail');}} className="p-3 rounded-xl bg-emerald-700">رسالة</button>
        <button disabled={busy || loading || !social} onClick={() => void act(social?.friend_status === 'accepted' ? 'remove_friend':social?.friend_status === 'sent' ? 'cancel_request':social?.friend_status === 'received' ? 'accept':'request')} className="p-3 rounded-xl bg-slate-700">{social?.friend_status === 'accepted' ? 'إزالة الصديق':social?.friend_status === 'sent' ? 'إلغاء الطلب':social?.friend_status === 'received' ? 'قبول الصداقة':'طلب صداقة'}</button>
        <button disabled={busy || loading || !social} onClick={() => void act(social?.is_blocked ? 'unblock':'block')} className="p-3 rounded-xl bg-slate-700">{social?.is_blocked ? 'إلغاء الحظر':'حظر'}</button>
      </div>
      <section className="p-4 bg-white/10 rounded-2xl"><h2 className="text-sm font-bold">رفيق الروح</h2>{relationship ? <><p className="my-2">{relationship.accepted_at ? 'علاقة معتمدة':relationship.requested_by === me.authId ? 'طلب مرسل':'طلب وارد'}</p>{!relationship.accepted_at && relationship.requested_by !== me.authId && <button disabled={busy} onClick={() => void act('accept',true)} className="p-2">قبول</button>}<button disabled={busy} onClick={() => void act(relationship.accepted_at ? 'end':'reject',true)} className="p-2">{relationship.accepted_at ? 'إنهاء العلاقة':'إلغاء / رفض الطلب'}</button></> : <button disabled={busy || loading || !social} onClick={() => void act('request',true)} className="p-3">طلب ارتباط</button>}</section>
    </>}
  </div>;
};

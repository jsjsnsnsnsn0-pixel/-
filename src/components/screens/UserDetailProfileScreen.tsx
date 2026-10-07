import {ProfileHero} from '../common/ProfileHero';
import {loadRoomPublicProfile,RoomPublicProfile} from '../../services/roomPublicProfile';
import {InlineLoading,ErrorState} from '../common/UIState';
import React, {useCallback, useState} from 'react';
import {useApp} from '../../context/AppContext';
import {useServerData} from '../../hooks/useServerData';
import {rpc, backendMessage} from '../../services/backend';
import {profileToUser} from '../../services/profile';
interface Social extends Record<string, unknown> {is_following: boolean; is_blocked: boolean; friend_status: string}
interface Couple {partner: {public_id: number}; requested_by: string; accepted_at: string | null}
export const UserDetailProfileScreen: React.FC = () => {
  const {user: me, selectedChatUser, setSelectedChatUser, setActiveSubScreen, reportError,rooms,joinRoom} = useApp();
  const target = selectedChatUser || me;
  const mine = target.id === me.id;
  const homeRoom=rooms.find(room=>room.owner.id===target.id);
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState('');
  const load = useCallback(async () => {
    const [social,couples] = await Promise.all([rpc<Social>('social_profile',{p_public_id:Number(target.id),p_visit:!mine}),rpc<{relations:Couple[]}>('couple_state')]);
    const publicProfile=await loadRoomPublicProfile(target.id,me.id).catch(()=>null);
    return {social,couples,publicProfile};
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
  return <div dir="rtl" className="min-h-screen bg-[#00251c] text-white p-4 pb-28">
    <button onClick={() => setActiveSubScreen(null)} className="ui-control mb-4 px-3 rounded-xl bg-white/5">الرجوع</button>
    <ProfileHero user={user} partner={data?.publicProfile?.couple?.partner} onPartner={(partner:RoomPublicProfile)=>{setSelectedChatUser(profileToUser({public_id:Number(partner.id),display_name:partner.name,avatar_url:partner.avatar}));}}/>
    {loading && <InlineLoading>جارٍ تحميل الملف…</InlineLoading>}{error && <ErrorState message={error} onRetry={()=>void reload()}/>}{notice && <p role="status" className="p-3">{notice}</p>}
    <div className="grid grid-cols-4 text-center gap-2 my-4 rounded-2xl p-4 bg-emerald-900/40 border border-emerald-300/20 text-sm leading-7"><p>{user.receivedTotal||'0'}<br/>تلقي</p><p>{user.sentGiftsCount||'0'}<br/>أرسلت</p><p>{user.followersCount}<br/>معجبين</p><p>{user.visitorsCount||0}<br/>زائر</p></div>
    {data?.publicProfile?.relationships?.length ? <section className="my-4 space-y-3"><h2 className="font-bold">العلاقات</h2>{data.publicProfile.relationships.map((relation,index)=>{
      const next=relation.nextLevelExperience;
      const progress=relation.experience!==undefined&&next?Math.min(100,Math.max(0,(relation.experience/next)*100)):null;
      return <div key={relation.relationId||`${relation.typeId||'relation'}:${relation.partner.id}:${index}`} className="p-4 rounded-2xl border border-pink-400/30 bg-pink-950/30">
        <div className="flex justify-between items-center gap-2 mb-3"><span className="font-black text-pink-200">{relation.typeLabel||'CP'}</span><span className="text-xs text-slate-300">{relation.days??0} يوم{relation.level? ` · LV.${relation.level}` : ''}</span></div>
        <div className="flex justify-around items-center gap-4"><img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full border-2 border-pink-300 object-cover"/><span className="text-pink-300 text-center">💗</span><button type="button" aria-label={`زيارة ملف ${relation.partner.name}`} onClick={()=>setSelectedChatUser(profileToUser({public_id:Number(relation.partner.id),display_name:relation.partner.name,avatar_url:relation.partner.avatar}))}><img src={relation.partner.avatar} alt={relation.partner.name} className="w-16 h-16 rounded-full border-2 border-pink-300 object-cover"/></button></div>
        {relation.card?.name&&<p className="text-[11px] text-amber-300 text-center mt-2">البطاقة: {relation.card.name}</p>}
        {relation.experience!==undefined&&<div className="mt-3"><div className="flex justify-between text-[10px] text-slate-300"><span>EXP {relation.experience.toLocaleString('ar-SA')}</span>{next&&<span>التالي {next.toLocaleString('ar-SA')}</span>}</div>{progress!==null&&<div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1"><div className="h-full bg-gradient-to-r from-pink-500 to-amber-400 rounded-full" style={{width:`${progress}%`}}/></div>}</div>}
      </div>;
    })}</section> : data?.publicProfile?.couple&&<section className="p-4 rounded-2xl border border-pink-400/30 bg-pink-950/30 my-4"><h2 className="font-bold mb-4">{data.publicProfile.couple.typeLabel||'CP'}</h2><div className="flex justify-around items-center gap-4"><img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full border-2 border-pink-300 object-cover"/><span className="text-pink-300 text-center">💗<br/>{data.publicProfile.couple.days??0} يوم</span><button type="button" aria-label={`زيارة ملف ${data.publicProfile.couple.partner.name}`} onClick={()=>{const partner=data.publicProfile!.couple!.partner;setSelectedChatUser(profileToUser({public_id:Number(partner.id),display_name:partner.name,avatar_url:partner.avatar}));}}><img src={data.publicProfile.couple.partner.avatar} alt={data.publicProfile.couple.partner.name} className="w-16 h-16 rounded-full border-2 border-pink-300 object-cover"/></button></div></section>}
    {data?.publicProfile?.agency&&<section className="p-4 rounded-2xl bg-emerald-900/40 my-4"><h2 className="font-bold">الوكالة</h2><p className="mt-3 text-emerald-200">{data.publicProfile.agency.name}</p></section>}
    {user.equipment && <section className="p-4 bg-white/10 rounded-2xl my-4"><h2 className="text-sm font-bold">المنتجات المجهزة</h2>{Object.values(user.equipment).map(item => item && <p key={item.id} className="my-2">{item.icon} {item.name}</p>)}</section>}
    {mine ? <section className="my-4 rounded-2xl border border-emerald-300/15 bg-white/5 p-3">
      {data?.publicProfile?.agency ? (
        <button type="button" onClick={() => setActiveSubScreen('agency')} className="w-full flex items-center justify-between gap-3 rounded-2xl bg-emerald-900/40 border border-emerald-300/15 p-4 text-right active:scale-[0.99] transition-transform">
          <span className="text-slate-300 text-xl" aria-hidden="true">‹</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] text-emerald-300 mb-1">الوكالة</span>
            <span className="block font-black text-white truncate">{data.publicProfile.agency.name}</span>
            <span className="block ui-id text-xs text-slate-400 mt-1">ID: {data.publicProfile.agency.id}</span>
          </span>
          <span className="w-11 h-11 shrink-0 rounded-full bg-emerald-500/15 border border-emerald-300/20 flex items-center justify-center text-xl" aria-hidden="true">🏛️</span>
        </button>
      ) : (
        <button type="button" onClick={() => setActiveSubScreen('agency')} className="w-full rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 p-4 text-center font-black text-white shadow-lg active:scale-[0.99] transition-transform">
          <span className="block text-sm">لست منضماً إلى وكالة</span>
          <span className="block text-xs text-emerald-100 mt-1">انضم إلى وكالة</span>
        </button>
      )}
    </section> : <>
      <div className="grid grid-cols-2 gap-3 my-4">
        <button disabled={busy || loading || !social} onClick={() => void act(social?.friend_status === 'accepted' ? 'remove_friend':social?.friend_status === 'sent' ? 'cancel_request':social?.friend_status === 'received' ? 'accept':'request')} className="p-3 rounded-xl bg-slate-700">{social?.friend_status === 'accepted' ? 'إزالة الصديق':social?.friend_status === 'sent' ? 'إلغاء الطلب':social?.friend_status === 'received' ? 'قبول الصداقة':'طلب صداقة'}</button>
        <button disabled={busy || loading || !social} onClick={() => void act(social?.is_blocked ? 'unblock':'block')} className="p-3 rounded-xl bg-slate-700">{social?.is_blocked ? 'إلغاء الحظر':'حظر'}</button>
      </div>
      <footer className="fixed bottom-0 inset-x-0 max-w-md mx-auto bg-[#00251c]/95 backdrop-blur-md border-t border-white/10 p-3 pb-safe z-20 grid grid-cols-3 gap-2">
        <button disabled={busy || loading || !social} onClick={() => void act(social?.is_following ? 'unfollow':'follow')} className="p-3 rounded-xl bg-emerald-700">{social?.is_following ? 'إلغاء المتابعة':'متابعة'}</button>
        <button onClick={() => {setSelectedChatUser(user);setActiveSubScreen('chat_detail');}} className="p-3 rounded-xl bg-emerald-700">رسالة</button>
        <button type="button" disabled={!homeRoom} onClick={()=>{if(homeRoom)void joinRoom(homeRoom)}} className="p-3 rounded-xl bg-emerald-700 disabled:opacity-40">المنزل</button>
      </footer>
      <section className="p-4 bg-white/10 rounded-2xl"><h2 className="text-sm font-bold">رفيق الروح</h2>{relationship ? <><p className="my-2">{relationship.accepted_at ? 'علاقة معتمدة':relationship.requested_by === me.authId ? 'طلب مرسل':'طلب وارد'}</p>{!relationship.accepted_at && relationship.requested_by !== me.authId && <button disabled={busy} onClick={() => void act('accept',true)} className="p-2">قبول</button>}<button disabled={busy} onClick={() => void act(relationship.accepted_at ? 'end':'reject',true)} className="p-2">{relationship.accepted_at ? 'إنهاء العلاقة':'إلغاء / رفض الطلب'}</button></> : <button disabled={busy || loading || !social} onClick={() => void act('request',true)} className="p-3">طلب ارتباط</button>}</section>
    </>}
  </div>;
};

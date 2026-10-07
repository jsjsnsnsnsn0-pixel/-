import {ProfileHero} from '../common/ProfileHero';
import {loadRoomPublicProfile,RoomPublicProfile} from '../../services/roomPublicProfile';
import {InlineLoading,ErrorState} from '../common/UIState';
import React, {useCallback, useEffect, useState} from 'react';
import {useApp} from '../../context/AppContext';
import {useServerData} from '../../hooks/useServerData';
import {rpc, backendMessage} from '../../services/backend';
import {profileToUser} from '../../services/profile';
import {supabase} from '../../services/supabase';
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
  useEffect(()=>{
    if(!mine||!me.authId)return;
    const refresh=()=>{if(document.visibilityState!=='hidden')void reload();};
    window.addEventListener('focus',refresh);
    document.addEventListener('visibilitychange',refresh);
    const membership=supabase.channel(`profile-agency-membership:${me.authId}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'agency_members',filter:`user_id=eq.${me.authId}`},()=>void reload())
      .subscribe();
    return()=>{window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);void supabase.removeChannel(membership);};
  },[mine,me.authId,reload]);
  useEffect(()=>{
    if(!mine||!data?.publicProfile?.agency?.id)return;
    const channel=supabase.channel(`profile-agency:${data.publicProfile.agency.id}`)
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'agencies',filter:`id=eq.${data.publicProfile.agency.id}`},()=>void reload())
      .subscribe();
    return()=>{void supabase.removeChannel(channel);};
  },[mine,data?.publicProfile?.agency?.id,reload]);
  const social = data?.social;
  const user = social ? profileToUser(social) : target;
  const relationship = data?.couples?.relations?.find(c => c.partner.public_id === Number(target.id));
  const act = async (action: string, couple = false) => {
    if (busy) return; setBusy(true); setNotice('');
    try {await rpc(couple ? 'couple_action' : 'social_action', {p_public_id:Number(target.id),p_action:action}); setNotice('تم اعتماد العملية.'); await reload();}
    catch(e) {reportError(backendMessage(e));} finally {setBusy(false);}
  };
  return <div dir="rtl" className="relative min-h-screen bg-[radial-gradient(circle_at_80%_0%,rgba(168,85,247,.20),transparent_28%),radial-gradient(circle_at_12%_12%,rgba(16,185,129,.16),transparent_30%),#090b13] text-white p-4 pb-28 overflow-x-hidden"><div aria-hidden="true" className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-white/[0.035] to-transparent pointer-events-none" />
    <button onClick={() => setActiveSubScreen(null)} className="relative z-10 ui-control mb-4 px-4 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-xl">الرجوع</button>
    <ProfileHero user={user} partner={data?.publicProfile?.couple?.partner} onPartner={(partner:RoomPublicProfile)=>{setSelectedChatUser(profileToUser({public_id:Number(partner.id),display_name:partner.name,avatar_url:partner.avatar}));}}/>
    {loading && <InlineLoading>جارٍ تحميل الملف…</InlineLoading>}{error && <ErrorState message={error} onRetry={()=>void reload()}/>}{notice && <p role="status" className="p-3">{notice}</p>}
    <div className="grid grid-cols-4 text-center gap-2 my-4 rounded-[26px] p-4 bg-white/[0.065] backdrop-blur-xl border border-white/10 text-sm leading-7 shadow-[0_14px_30px_rgba(0,0,0,.18)]"><p>{user.receivedTotal||'0'}<br/>تلقي</p><p>{user.sentGiftsCount||'0'}<br/>أرسلت</p><p>{user.followersCount}<br/>معجبين</p><p>{user.visitorsCount||0}<br/>زائر</p></div>
    {data?.publicProfile?.relationships?.length ? <section className="my-4 space-y-3"><h2 className="font-bold">العلاقات</h2>{data.publicProfile.relationships.map((relation,index)=>{
      const next=relation.nextLevelExperience;
      const progress=relation.experience!==undefined&&next?Math.min(100,Math.max(0,(relation.experience/next)*100)):null;
      return <div key={relation.relationId||`${relation.typeId||'relation'}:${relation.partner.id}:${index}`} className="p-4 rounded-[26px] border border-pink-300/20 bg-gradient-to-br from-pink-500/12 to-violet-500/8 backdrop-blur-xl shadow-[0_14px_30px_rgba(0,0,0,.16)]">
        <div className="flex justify-between items-center gap-2 mb-3"><span className="font-black text-pink-200">{relation.typeLabel||'CP'}</span><span className="text-xs text-slate-300">{relation.days??0} يوم{relation.level? ` · LV.${relation.level}` : ''}</span></div>
        <div className="flex justify-around items-center gap-4"><img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full border-2 border-pink-300 object-cover"/><span className="text-pink-300 text-center">💗</span><button type="button" aria-label={`زيارة ملف ${relation.partner.name}`} onClick={()=>setSelectedChatUser(profileToUser({public_id:Number(relation.partner.id),display_name:relation.partner.name,avatar_url:relation.partner.avatar}))}><img src={relation.partner.avatar} alt={relation.partner.name} className="w-16 h-16 rounded-full border-2 border-pink-300 object-cover"/></button></div>
        {relation.card?.name&&<p className="text-[11px] text-amber-300 text-center mt-2">البطاقة: {relation.card.name}</p>}
        {relation.experience!==undefined&&<div className="mt-3"><div className="flex justify-between text-[10px] text-slate-300"><span>EXP {relation.experience.toLocaleString('ar-SA')}</span>{next&&<span>التالي {next.toLocaleString('ar-SA')}</span>}</div>{progress!==null&&<div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1"><div className="h-full bg-gradient-to-r from-pink-500 to-amber-400 rounded-full" style={{width:`${progress}%`}}/></div>}</div>}
      </div>;
    })}</section> : data?.publicProfile?.couple&&<section className="p-4 rounded-[26px] border border-pink-300/20 bg-gradient-to-br from-pink-500/12 to-violet-500/8 backdrop-blur-xl my-4 shadow-[0_14px_30px_rgba(0,0,0,.16)]"><h2 className="font-bold mb-4">{data.publicProfile.couple.typeLabel||'CP'}</h2><div className="flex justify-around items-center gap-4"><img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full border-2 border-pink-300 object-cover"/><span className="text-pink-300 text-center">💗<br/>{data.publicProfile.couple.days??0} يوم</span><button type="button" aria-label={`زيارة ملف ${data.publicProfile.couple.partner.name}`} onClick={()=>{const partner=data.publicProfile!.couple!.partner;setSelectedChatUser(profileToUser({public_id:Number(partner.id),display_name:partner.name,avatar_url:partner.avatar}));}}><img src={data.publicProfile.couple.partner.avatar} alt={data.publicProfile.couple.partner.name} className="w-16 h-16 rounded-full border-2 border-pink-300 object-cover"/></button></div></section>}
    {!mine&&data?.publicProfile?.agency&&<section className="p-4 rounded-[26px] bg-gradient-to-br from-emerald-500/12 to-cyan-500/7 border border-emerald-300/15 backdrop-blur-xl my-4"><h2 className="font-bold">الوكالة</h2><div className="mt-3 flex items-center gap-3">{data.publicProfile.agency.logoUrl?<img src={data.publicProfile.agency.logoUrl} alt="" loading="lazy" className="w-11 h-11 rounded-full object-cover border border-emerald-300/20"/>:<span className="w-11 h-11 rounded-full bg-emerald-500/15 flex items-center justify-center" aria-hidden="true">🏛️</span>}<span className="min-w-0"><span className="block text-emerald-200 font-bold truncate">{data.publicProfile.agency.name}</span><span className="ui-id block text-xs text-slate-400">ID: {data.publicProfile.agency.id}</span></span></div></section>}
    {user.equipment && <section className="p-4 bg-white/[0.065] border border-white/10 backdrop-blur-xl rounded-[26px] my-4"><h2 className="text-sm font-bold">المنتجات المجهزة</h2>{Object.values(user.equipment).map(item => item && <p key={item.id} className="my-2">{item.icon} {item.name}</p>)}</section>}
    {mine ? <section className="my-4 rounded-[26px] border border-white/10 bg-white/[0.055] backdrop-blur-xl p-3 shadow-[0_14px_30px_rgba(0,0,0,.16)]">
      {data?.publicProfile?.agency ? (
        <button type="button" onClick={() => setActiveSubScreen('agency')} className="w-full flex items-center justify-between gap-3 rounded-[22px] bg-gradient-to-r from-emerald-500/12 to-cyan-500/8 border border-emerald-300/15 p-4 text-right active:scale-[0.99] transition-transform">
          <span className="text-slate-300 text-xl" aria-hidden="true">‹</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] text-emerald-300 mb-1">الوكالة</span>
            <span className="block font-black text-white truncate">{data.publicProfile.agency.name}</span>
            <span className="block ui-id text-xs text-slate-400 mt-1">ID: {data.publicProfile.agency.id}</span>
            <span className="block text-[10px] text-emerald-200/80 mt-1">{data.publicProfile.agency.role==='owner'?'مالك الوكالة':'عضو'}{data.publicProfile.agency.membersCount!==undefined? ` · ${data.publicProfile.agency.membersCount} عضو` : ''}</span>
          </span>
          {data.publicProfile.agency.logoUrl?<img src={data.publicProfile.agency.logoUrl} alt="" loading="lazy" className="w-11 h-11 shrink-0 rounded-full object-cover border border-emerald-300/20"/>:<span className="w-11 h-11 shrink-0 rounded-full bg-emerald-500/15 border border-emerald-300/20 flex items-center justify-center text-xl" aria-hidden="true">🏛️</span>}
        </button>
      ) : (
        <button type="button" aria-label="انضم إلى وكالة" onClick={() => setActiveSubScreen('agency')} className="w-full rounded-[22px] bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 p-4 text-center font-black text-white shadow-xl shadow-fuchsia-950/20 active:scale-[0.99] transition-transform">
          <span className="block text-sm">لست منضماً إلى وكالة</span>
          <span className="block text-xs text-emerald-100 mt-1">انضم إلى وكالة</span>
        </button>
      )}
    </section> : <>
      <div className="grid grid-cols-2 gap-3 my-4">
        <button disabled={busy || loading || !social} onClick={() => void act(social?.friend_status === 'accepted' ? 'remove_friend':social?.friend_status === 'sent' ? 'cancel_request':social?.friend_status === 'received' ? 'accept':'request')} className="p-3 rounded-xl bg-slate-700">{social?.friend_status === 'accepted' ? 'إزالة الصديق':social?.friend_status === 'sent' ? 'إلغاء الطلب':social?.friend_status === 'received' ? 'قبول الصداقة':'طلب صداقة'}</button>
        <button disabled={busy || loading || !social} onClick={() => void act(social?.is_blocked ? 'unblock':'block')} className="p-3 rounded-xl bg-slate-700">{social?.is_blocked ? 'إلغاء الحظر':'حظر'}</button>
      </div>
      <footer className="fixed bottom-3 inset-x-3 max-w-[calc(28rem-1.5rem)] mx-auto bg-[#121625]/88 backdrop-blur-2xl border border-white/10 rounded-[24px] p-2 pb-safe z-20 grid grid-cols-3 gap-2 shadow-[0_14px_36px_rgba(0,0,0,.35)]">
        <button disabled={busy || loading || !social} onClick={() => void act(social?.is_following ? 'unfollow':'follow')} className="p-3 rounded-xl bg-emerald-700">{social?.is_following ? 'إلغاء المتابعة':'متابعة'}</button>
        <button onClick={() => {setSelectedChatUser(user);setActiveSubScreen('chat_detail');}} className="p-3 rounded-xl bg-emerald-700">رسالة</button>
        <button type="button" disabled={!homeRoom} onClick={()=>{if(homeRoom)void joinRoom(homeRoom)}} className="p-3 rounded-xl bg-emerald-700 disabled:opacity-40">المنزل</button>
      </footer>
      <section className="p-4 bg-white/10 rounded-2xl"><h2 className="text-sm font-bold">رفيق الروح</h2>{relationship ? <><p className="my-2">{relationship.accepted_at ? 'علاقة معتمدة':relationship.requested_by === me.authId ? 'طلب مرسل':'طلب وارد'}</p>{!relationship.accepted_at && relationship.requested_by !== me.authId && <button disabled={busy} onClick={() => void act('accept',true)} className="p-2">قبول</button>}<button disabled={busy} onClick={() => void act(relationship.accepted_at ? 'end':'reject',true)} className="p-2">{relationship.accepted_at ? 'إنهاء العلاقة':'إلغاء / رفض الطلب'}</button></> : <button disabled={busy || loading || !social} onClick={() => void act('request',true)} className="p-3">طلب ارتباط</button>}</section>
    </>}
  </div>;
};

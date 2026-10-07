import {ProfileHero} from '../common/ProfileHero';
import {loadRoomPublicProfile,RoomPublicProfile,RoomRelationship} from '../../services/roomPublicProfile';
import {InlineLoading,ErrorState} from '../common/UIState';
import React, {useCallback, useState} from 'react';
import {useApp} from '../../context/AppContext';
import {useServerData} from '../../hooks/useServerData';
import {rpc, backendMessage} from '../../services/backend';
import {profileToUser} from '../../services/profile';
interface Social extends Record<string, unknown> {is_following: boolean; is_blocked: boolean; friend_status: string}
interface Couple {partner: {public_id: number}; requested_by: string; accepted_at: string | null}

const cpProgress=(relation:RoomRelationship)=>{
  if(relation.experience===undefined||!relation.levelThresholds.length)return null;
  const exp=relation.experience;
  const passed=relation.levelThresholds.filter(value=>exp>=value).length;
  const level=passed+1;
  const previous=passed?relation.levelThresholds[passed-1]:0;
  const next=relation.levelThresholds[passed];
  const percent=next===undefined?100:Math.max(0,Math.min(100,((exp-previous)/Math.max(1,next-previous))*100));
  return {level,exp,next,percent};
};

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
  }, [target.id,me.id,mine]);
  const {data,loading,error,reload} = useServerData(load, null);
  const social = data?.social;
  const user = social ? profileToUser(social) : target;
  const relationship = data?.couples?.relations?.find(c => c.partner.public_id === Number(target.id));
  const publicRelationships=data?.publicProfile?.relationships||[];
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

    {publicRelationships.length>0&&<section className="my-4 space-y-3" aria-label="العلاقات">
      <h2 className="font-black text-sm">العلاقات</h2>
      {publicRelationships.map(relation=>{
        const progress=cpProgress(relation);
        const accent=relation.presentation?.accent||'#fb7185';
        return <article key={relation.id} className="rounded-3xl border border-pink-400/25 bg-pink-950/25 p-4" data-testid="profile-cp-relation">
          <div className="flex items-center justify-between gap-3"><div><p className="font-black">{relation.presentation?.icon||'💗'} {relation.typeLabel}</p><p className="ui-id text-[10px] text-slate-400 mt-1 break-all">Relationship ID: {relation.id}</p></div>{relation.isPrimary&&<span className="rounded-full px-2 py-1 text-[10px] bg-pink-400/10 text-pink-200">CP الرئيسي</span>}</div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="min-w-0"><p className="text-xs text-slate-400">الشريك</p><p className="font-bold truncate">{relation.partner.name}</p></div>
            <button type="button" aria-label={`زيارة ملف ${relation.partner.name}`} onClick={()=>setSelectedChatUser(profileToUser({public_id:Number(relation.partner.id),display_name:relation.partner.name,avatar_url:relation.partner.avatar}))}><img src={relation.partner.avatar} alt={relation.partner.name} className="w-14 h-14 rounded-full object-cover border-2 border-pink-300"/></button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-white/5 px-2 py-1">{relation.days??0} يوم</span>{progress&&<><span className="rounded-full bg-white/5 px-2 py-1">CP Lv.{progress.level}</span><span className="rounded-full bg-white/5 px-2 py-1">EXP {progress.exp.toLocaleString()}</span></>}{relation.card&&<span className="rounded-full bg-white/5 px-2 py-1">بطاقة: {relation.card.name}</span>}</div>
          {progress&&progress.next!==undefined&&<div className="mt-3"><div className="h-2 rounded-full bg-black/25 overflow-hidden"><div className="h-full rounded-full" style={{width:`${progress.percent}%`,backgroundColor:accent}}/></div><p className="text-[10px] text-slate-400 mt-1">{progress.exp.toLocaleString()} / {progress.next.toLocaleString()} EXP</p></div>}
        </article>;
      })}
    </section>}

    <section data-testid="profile-agency-card" className="p-4 rounded-2xl bg-emerald-900/40 border border-emerald-300/15 my-4">
      <h2 className="font-bold">الوكالة</h2>
      {data?.publicProfile?.agency ? <><p className="mt-3 text-emerald-200 font-bold">{data.publicProfile.agency.name}</p><p className="ui-id text-xs text-slate-400 mt-1">Agency ID: {data.publicProfile.agency.id}</p>{data.publicProfile.agency.membersCount!==undefined&&<p className="text-xs text-slate-400 mt-1">الأعضاء: {data.publicProfile.agency.membersCount}</p>}{mine&&<button type="button" onClick={()=>setActiveSubScreen('agency')} className="mt-3 rounded-xl bg-emerald-500 text-emerald-950 font-black px-4 py-2">فتح الوكالة</button>}</> : mine ? <><p className="text-slate-300 mt-3">لست منضماً إلى وكالة</p><button type="button" onClick={()=>setActiveSubScreen('agency')} className="mt-3 rounded-xl bg-emerald-500 text-emerald-950 font-black px-4 py-2">انضم إلى وكالة</button></> : <p className="text-slate-400 mt-3">لا توجد وكالة ظاهرة لهذا الحساب.</p>}
    </section>

    {user.equipment && <section className="p-4 bg-white/10 rounded-2xl my-4"><h2 className="text-sm font-bold">المنتجات المجهزة</h2>{Object.values(user.equipment).map(item => item && <p key={item.id} className="my-2">{item.icon} {item.name}</p>)}</section>}
    {mine ? <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/5 p-3"><button onClick={() => setActiveSubScreen('edit_profile')}>تعديل الملف</button><button onClick={() => setActiveSubScreen('visitors')}>الزوار</button><button onClick={() => setActiveSubScreen('friends')}>العلاقات</button></div> : <>
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

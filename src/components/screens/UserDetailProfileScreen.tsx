import {ProfileAgencyCard} from '../common/ProfileAgencyCard';
import {RelationshipCard,RelationshipDetails} from '../common/RelationshipCard';
import {publicProfileCard} from '../../services/roomPublicProfile';
import {ProfileHero} from '../common/ProfileHero';
import {loadRoomPublicProfile,RoomPublicProfile} from '../../services/roomPublicProfile';
import {InlineLoading,ErrorState} from '../common/UIState';
import React, {useCallback, useEffect, useState} from 'react';
import {useApp} from '../../context/AppContext';
import {useServerData} from '../../hooks/useServerData';
import {rpc, backendMessage} from '../../services/backend';
import {profileToUser} from '../../services/profile';
interface Social extends Record<string, unknown> {is_following: boolean; is_blocked: boolean; friend_status: string}
interface Couple {partner: {public_id: number}; requested_by: string; accepted_at: string | null}
export const UserDetailProfileScreen: React.FC = () => {
  const {user: me, selectedChatUser, setSelectedChatUser, setActiveSubScreen, reportError,rooms,joinRoom,activeRoom} = useApp();
  const target = selectedChatUser || me;
  const mine = target.id === me.id;
  const homeRoom=rooms.find(room=>room.owner.id===target.id);
  const [tab,setTab]=useState<'info'|'relations'>('info');
  const [detail,setDetail]=useState<string|null>(null);
  useEffect(()=>{setDetail(null);setTab('info')},[target.id]);
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState('');
  const load = useCallback(async () => {
    const [social,couples] = await Promise.all([rpc<Social>('social_profile',{p_public_id:Number(target.id),p_visit:!mine}),rpc<{relations:Couple[]}>('couple_state')]);
    const publicProfile=await loadRoomPublicProfile(target.id,me.id).catch(()=>null);
    return {social,couples,publicProfile};
  }, [target.id,me.authId,mine]);
  const {data,loading,error,reload} = useServerData(load, null);
  useEffect(()=>{const sync=()=>{if(document.visibilityState!=='hidden')void reload()};const timer=setInterval(sync,15000);window.addEventListener('focus',sync);document.addEventListener('visibilitychange',sync);return()=>{clearInterval(timer);window.removeEventListener('focus',sync);document.removeEventListener('visibilitychange',sync)}},[reload]);
  const publicProfile=!loading&&!error&&data?.publicProfile?.id===target.id?data.publicProfile:null;
  const subject=publicProfile||publicProfileCard({public_id:Number(target.id),display_name:target.name,avatar_url:target.avatar});
  const openPartner=(partner:RoomPublicProfile)=>setSelectedChatUser(profileToUser({public_id:Number(partner.id),display_name:partner.name,avatar_url:partner.avatar}));
  const social = String(data?.social?.public_id)===target.id?data?.social:undefined;
  const user = social ? profileToUser(social) : target;
  const relationship = !loading&&!error?data?.couples?.relations?.find(c => c.partner.public_id === Number(target.id)&&(!c.accepted_at||data?.publicProfile?.couple?.partner.id===me.id)):undefined;
  const act = async (action: string, couple = false) => {
    if (busy) return; setBusy(true); setNotice('');
    try {await rpc(couple ? 'couple_action' : 'social_action', {p_public_id:Number(target.id),p_action:action}); setNotice('تم اعتماد العملية.'); await reload();}
    catch(e) {reportError(backendMessage(e));} finally {setBusy(false);}
  };
  return <div dir="rtl" className="min-h-screen bg-[#100b20] text-white p-4 pb-28">
    <button onClick={() => setActiveSubScreen(null)} className="ui-control mb-4 px-3 rounded-xl bg-white/5">الرجوع</button>
    <ProfileHero user={user} partner={!loading&&!error&&data?.publicProfile?.id===target.id?data.publicProfile.couple?.partner:undefined} onPartner={(partner:RoomPublicProfile)=>{setSelectedChatUser(profileToUser({public_id:Number(partner.id),display_name:partner.name,avatar_url:partner.avatar}));}}/>
    {mine&&<div data-testid="self-profile-actions" className="grid grid-cols-2 gap-3 my-4"><button type="button" onClick={()=>setActiveSubScreen('edit_profile')} className="p-3 rounded-xl bg-purple-700">تعديل الملف الشخصي</button><button type="button" onClick={()=>setActiveSubScreen('settings')} className="p-3 rounded-xl bg-white/10">الإعدادات</button></div>}
    {loading && <InlineLoading>جارٍ تحميل الملف…</InlineLoading>}{error && <ErrorState message={error} onRetry={()=>void reload()}/>}{notice && <p role="status" className="p-3">{notice}</p>}
    <div role="tablist" aria-label="أقسام الملف" className="grid grid-cols-2 gap-2 mt-3 border-b border-white/15 pb-3">{([['info','معلومات المستخدم'],['relations','علاقاتي']] as const).map(([id,label])=><button type="button" role="tab" aria-selected={tab===id} aria-controls={`profile-${id}`} key={id} onClick={()=>setTab(id)} className={`p-3 rounded-xl ${tab===id?'bg-purple-500/20 text-purple-200':'text-slate-300'}`}>{label}</button>)}</div>
    <div role="tabpanel" id={`profile-${tab}`}>
    {tab==='info'?<>
      {publicProfile?.couple&&<><RelationshipCard subject={subject} relation={publicProfile.couple} onPartner={openPartner} onDetails={()=>{setTab('relations');setDetail(publicProfile.couple!.id)}}/></>}
      {social&&<div aria-label="إحصائيات الحساب" className="grid grid-cols-4 text-center gap-2 my-4 rounded-2xl p-3 bg-white/5 border border-white/10 text-sm leading-7"><p>{user.receivedTotal}<br/><span className="text-xs text-slate-300">ذهب مستلم</span></p><p>{user.sentGiftsCount}<br/><span className="text-xs text-slate-300">ذهب مرسل</span></p><p>{user.followersCount}<br/><span className="text-xs text-slate-300">متابعون</span></p><p>{user.visitorsCount}<br/><span className="text-xs text-slate-300">زوار</span></p></div>}
      {social&&user.equipment&&Object.values(user.equipment).some(Boolean)&&<section className="p-4 bg-white/5 rounded-2xl my-4"><h2 className="text-sm font-bold">الشارات والمقتنيات المجهزة</h2><div className="flex gap-2 flex-wrap mt-3">{Object.values(user.equipment).map(item=>item&&<span key={item.id} className="px-3 py-2 rounded-xl bg-white/5 text-sm">{item.icon} {item.name}</span>)}</div></section>}
    </>:<>
      {publicProfile?.relationships?.map(relation=><React.Fragment key={relation.id}><RelationshipCard subject={subject} relation={relation} compact={!relation.primary} onPartner={openPartner} onDetails={()=>setDetail(v=>v===relation.id?null:relation.id)}/>{detail===relation.id&&<RelationshipDetails relation={relation}/>}</React.Fragment>)}
      {!loading&&!error&&!publicProfile?.relationships?.length&&<p className="py-8 text-center text-slate-300 text-sm">لا توجد علاقات نشطة.</p>}
    </>}
    </div>
    <ProfileAgencyCard key={target.id} targetId={target.id} mine={mine}/>
    {!mine && <>
      <div className="grid grid-cols-2 gap-3 my-4">
        <button disabled={busy || loading || !social} onClick={() => void act(social?.friend_status === 'accepted' ? 'remove_friend':social?.friend_status === 'sent' ? 'cancel_request':social?.friend_status === 'received' ? 'accept':'request')} className="p-3 rounded-xl bg-slate-700">{social?.friend_status === 'accepted' ? 'إزالة الصديق':social?.friend_status === 'sent' ? 'إلغاء الطلب':social?.friend_status === 'received' ? 'قبول الصداقة':'طلب صداقة'}</button>
        <button disabled={busy || loading || !social} onClick={() => void act(social?.is_blocked ? 'unblock':'block')} className="p-3 rounded-xl bg-slate-700">{social?.is_blocked ? 'إلغاء الحظر':'حظر'}</button>
      </div>
      <footer className="fixed bottom-0 inset-x-0 max-w-md mx-auto bg-[#100b20]/95 backdrop-blur-md border-t border-white/10 p-3 pb-safe z-20 grid grid-cols-3 gap-2">
        <button disabled={busy || loading || !social} onClick={() => void act(social?.is_following ? 'unfollow':'follow')} className="p-3 rounded-xl bg-purple-700">{social?.is_following ? 'إلغاء المتابعة':'متابعة'}</button>
        <button onClick={() => {setSelectedChatUser(user);setActiveSubScreen('chat_detail');}} className="p-3 rounded-xl bg-purple-700">رسالة</button>
        {activeRoom?.members?.some(member=>member.id===target.id)?<button type="button" onClick={()=>{window.sessionStorage.setItem('totichat.pendingGiftRecipient',target.id);setActiveSubScreen(null)}} className="p-3 rounded-xl bg-purple-700">هدية</button>:<button type="button" disabled={!homeRoom} onClick={()=>{if(homeRoom)void joinRoom(homeRoom)}} className="p-3 rounded-xl bg-purple-700 disabled:opacity-40">المنزل</button>}
      </footer>
      <section className="p-4 bg-white/10 rounded-2xl"><h2 className="text-sm font-bold">رفيق الروح</h2>{relationship ? <><p className="my-2">{relationship.accepted_at ? 'علاقة معتمدة':relationship.requested_by === me.authId ? 'طلب مرسل':'طلب وارد'}</p>{!relationship.accepted_at && relationship.requested_by !== me.authId && <button disabled={busy} onClick={() => void act('accept',true)} className="p-2">قبول</button>}<button disabled={busy} onClick={() => void act(relationship.accepted_at ? 'end':'reject',true)} className="p-2">{relationship.accepted_at ? 'إنهاء العلاقة':'إلغاء / رفض الطلب'}</button></> : <button disabled={busy || loading || !social} onClick={() => void act('request',true)} className="p-3">طلب ارتباط</button>}</section>
    </>}
  </div>;
};

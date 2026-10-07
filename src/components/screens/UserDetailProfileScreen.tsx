import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {ChevronRight,Heart,Share2,X} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {useServerData} from '../../hooks/useServerData';
import {rpc,backendMessage} from '../../services/backend';
import {profileToUser} from '../../services/profile';
import {supabase} from '../../services/supabase';
import {copyText} from '../../utils/clipboard';
import {InlineLoading,ErrorState} from '../common/UIState';
import {RoomPublicProfile,RoomRelationship,loadRoomPublicProfile} from '../../services/roomPublicProfile';
import {
  AgencyCard,
  CpRelationshipSection,
  OtherProfileActions,
  ProfileBio,
  ProfileEquipment,
  ProfileHeroFull,
  ProfileIdentity,
  ProfileStats,
  ProfileTabs,
  SelfProfileActions,
} from '../profile/ProfileFullParts';

interface Social extends Record<string,unknown>{
  is_following:boolean;
  is_blocked:boolean;
  friend_status:string;
}
interface CoupleStateRelation{
  partner:{public_id:number};
  requested_by:string;
  accepted_at:string|null;
}
interface LoadResult{
  social:Social;
  publicProfile:RoomPublicProfile|null;
  couples:{relations:CoupleStateRelation[]};
}

export const UserDetailProfileScreen:React.FC=()=>{
  const {
    user:me,
    selectedChatUser,
    setSelectedChatUser,
    setActiveSubScreen,
    reportError,
    activeRoom,
  }=useApp();
  const target=selectedChatUser||me;
  const mine=target.id===me.id;
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const [tab,setTab]=useState<'about'|'relationships'>('about');
  const [moreOpen,setMoreOpen]=useState(false);
  const [cpDetails,setCpDetails]=useState<RoomRelationship|null>(null);

  const load=useCallback(async():Promise<LoadResult>=>{
    const [social,couples,publicProfile]=await Promise.all([
      rpc<Social>('social_profile',{p_public_id:Number(target.id),p_visit:!mine}),
      rpc<{relations:CoupleStateRelation[]}>('couple_state'),
      loadRoomPublicProfile(target.id,me.id).catch(()=>null),
    ]);
    return {social,couples,publicProfile};
  },[target.id,me.id,mine]);

  const state=useServerData(load,null);

  useEffect(()=>{
    setTab('about');setMoreOpen(false);setCpDetails(null);setNotice('');
  },[target.id]);

  useEffect(()=>{
    if(!mine||!me.authId)return;
    const refresh=()=>{if(document.visibilityState!=='hidden')void state.reload();};
    window.addEventListener('focus',refresh);
    document.addEventListener('visibilitychange',refresh);
    const membership=supabase.channel(`profile-agency-membership:${me.authId}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'agency_members',filter:`user_id=eq.${me.authId}`},()=>void state.reload())
      .subscribe();
    return()=>{window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);void supabase.removeChannel(membership);};
  },[mine,me.authId,state.reload]);

  const social=state.data?.social;
  const user=useMemo(()=>social?profileToUser(social):target,[social,target]);
  const relationships=useMemo(()=>{
    const profile=state.data?.publicProfile;
    if(!profile)return [] as RoomRelationship[];
    return profile.relationships?.length?profile.relationships:(profile.couple?[profile.couple]:[]);
  },[state.data?.publicProfile]);
  const primaryRelationship=relationships.find(item=>item.isPrimary)||relationships.find(item=>item.typeId==='love')||relationships[0];

  const openPartner=(partner:RoomPublicProfile)=>{
    setSelectedChatUser(profileToUser({public_id:Number(partner.id),display_name:partner.name,avatar_url:partner.avatar,level:partner.level,vip_level:partner.vipLevel,country_code:partner.countryCode,gender:partner.gender}));
  };

  const act=async(action:string,couple=false)=>{
    if(busy)return;
    setBusy(true);setNotice('');
    try{
      await rpc(couple?'couple_action':'social_action',{p_public_id:Number(target.id),p_action:action});
      setNotice('تم اعتماد العملية.');
      await state.reload();
    }catch(error){reportError(backendMessage(error));}
    finally{setBusy(false);}
  };

  const copyId=async()=>{
    if(await copyText(user.id))setNotice('تم نسخ معرف الحساب.');
  };

  const shareProfile=async()=>{
    const text=`TotiChat · ${user.name} · ID ${user.id}`;
    try{
      if(navigator.share)await navigator.share({title:'TotiChat',text});
      else if(await copyText(text))setNotice('تم نسخ بيانات الحساب للمشاركة.');
    }catch{/* cancelled share */}
  };

  const giftAvailable=Boolean(activeRoom?.members?.some(member=>member.id===user.id)||activeRoom?.seats.some(seat=>seat.user?.id===user.id));
  const openGift=()=>{
    if(!giftAvailable){reportError('إرسال الهدية لهذا الحساب متاح عندما يكون موجوداً معك داخل الغرفة.');return;}
    setSelectedChatUser(user);
    sessionStorage.setItem('totichat.pendingGiftRecipient',user.id);
    setActiveSubScreen(null);
  };

  const relationshipRequest=state.data?.couples?.relations?.find(item=>item.partner.public_id===Number(target.id));

  return <div dir="rtl" className="min-h-screen bg-[radial-gradient(circle_at_top,#181b37_0,#0c0e1c_34%,#070812_76%)] text-white pb-28">
    <div className="mx-auto max-w-md px-4 pt-4">
      <button type="button" onClick={()=>setActiveSubScreen(null)} aria-label="الرجوع" className="relative z-30 mb-2 w-10 h-10 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl flex items-center justify-center"><ChevronRight size={21}/></button>

      <ProfileHeroFull user={user} partner={primaryRelationship?.partner} onPartner={openPartner} isSelf={mine} onEdit={mine?()=>setActiveSubScreen('edit_profile'):undefined}/>

      <div className="relative z-10 space-y-4 pt-3">
        <ProfileIdentity user={user} onCopy={()=>void copyId()}/>

        {state.loading&&<InlineLoading>جارٍ تحميل الملف…</InlineLoading>}
        {state.error&&<ErrorState message={state.error} onRetry={()=>void state.reload()}/>}
        {notice&&<p role="status" className="rounded-2xl border border-emerald-400/15 bg-emerald-500/10 p-3 text-center text-xs font-black text-emerald-200">{notice}</p>}

        <ProfileBio bio={user.bio}/>

        <ProfileStats
          user={user}
          onFollowers={()=>setActiveSubScreen('friends')}
          onFollowing={()=>setActiveSubScreen('friends')}
          onVisitors={mine?()=>setActiveSubScreen('visitors'):undefined}
        />

        <AgencyCard
          agency={state.data?.publicProfile?.agency}
          onOpen={mine&&state.data?.publicProfile?.agency?()=>setActiveSubScreen('agency'):undefined}
        />

        {mine&&<SelfProfileActions
          onEdit={()=>setActiveSubScreen('edit_profile')}
          onShare={()=>void shareProfile()}
          onInventory={()=>setActiveSubScreen('inventory')}
          onPrivacy={()=>setActiveSubScreen('settings')}
        />}

        <ProfileTabs tab={tab} setTab={setTab}/>

        {tab==='about'&&<div className="space-y-4">
          <ProfileEquipment user={user}/>
          {(user.vipLevel??0)>0&&<section className="rounded-[24px] border border-amber-300/10 bg-gradient-to-br from-amber-400/10 via-fuchsia-400/5 to-transparent p-4"><div className="flex items-center gap-2"><span className="text-lg">👑</span><h2 className="text-sm font-black">امتياز VIP{user.vipLevel}</h2></div><p className="mt-2 text-[11px] leading-6 text-slate-400">يظهر تأثير VIP والـFrame بحسب المستوى الفعلي للحساب.</p></section>}
          {!user.equipment&&!(user.vipLevel??0)&&<div className="rounded-[24px] border border-white/8 bg-white/[.035] p-6 text-center text-xs text-slate-500">لا توجد عناصر عامة إضافية لعرضها حالياً.</div>}
        </div>}

        {tab==='relationships'&&<CpRelationshipSection
          owner={user}
          relationships={relationships}
          onPartner={openPartner}
          onDetails={setCpDetails}
          canCreate={false}
        />}

        {!mine&&<section className="rounded-[24px] border border-white/8 bg-white/[.04] p-3">
          <button type="button" onClick={()=>setMoreOpen(v=>!v)} className="w-full text-right text-xs font-black text-slate-300">إجراءات إضافية</button>
          {moreOpen&&<div className="mt-3 grid grid-cols-2 gap-2">
            <button disabled={busy||!social} onClick={()=>void act(social?.friend_status==='accepted'?'remove_friend':social?.friend_status==='sent'?'cancel_request':social?.friend_status==='received'?'accept':'request')} className="min-h-[46px] rounded-xl bg-white/[.055] text-xs disabled:opacity-50">{social?.friend_status==='accepted'?'إزالة الصديق':social?.friend_status==='sent'?'إلغاء الطلب':social?.friend_status==='received'?'قبول الصداقة':'طلب صداقة'}</button>
            <button disabled={busy||!social} onClick={()=>void act(social?.is_blocked?'unblock':'block')} className="min-h-[46px] rounded-xl bg-rose-500/10 text-rose-200 text-xs disabled:opacity-50">{social?.is_blocked?'إلغاء الحظر':'حظر'}</button>
            <button disabled className="min-h-[46px] rounded-xl bg-white/[.035] text-slate-600 text-xs">إبلاغ</button>
            <button type="button" onClick={()=>void shareProfile()} className="min-h-[46px] rounded-xl bg-white/[.055] text-xs flex items-center justify-center gap-1.5"><Share2 size={14}/>مشاركة</button>
          </div>}
        </section>}

        {!mine&&<section className="rounded-[24px] border border-white/8 bg-white/[.035] p-3 text-xs text-slate-400">
          {relationshipRequest?<div className="flex items-center justify-between gap-2"><span>{relationshipRequest.accepted_at?'علاقة CP معتمدة':relationshipRequest.requested_by===me.authId?'طلب CP مرسل':'طلب CP وارد'}</span><span className="flex gap-2">{!relationshipRequest.accepted_at&&relationshipRequest.requested_by!==me.authId&&<button disabled={busy} onClick={()=>void act('accept',true)} className="text-emerald-300">قبول</button>}<button disabled={busy} onClick={()=>void act(relationshipRequest.accepted_at?'end':'reject',true)} className="text-rose-300">{relationshipRequest.accepted_at?'إنهاء':'رفض'}</button></span></div>:<button disabled={busy||state.loading||!social} onClick={()=>void act('request',true)} className="w-full text-pink-300 font-black">طلب CP</button>}
        </section>}
      </div>
    </div>

    {!mine&&<OtherProfileActions
      following={Boolean(social?.is_following)}
      busy={busy||state.loading||!social}
      onFollow={()=>void act(social?.is_following?'unfollow':'follow')}
      onMessage={()=>{setSelectedChatUser(user);setActiveSubScreen('chat_detail');}}
      onGift={openGift}
      onMore={()=>setMoreOpen(v=>!v)}
      giftEnabled={giftAvailable}
    />}

    {cpDetails&&<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end justify-center" onClick={()=>setCpDetails(null)}>
      <section role="dialog" aria-modal="true" aria-label="تفاصيل CP" onClick={event=>event.stopPropagation()} className="w-full max-w-md rounded-t-[32px] border border-white/10 bg-[#0d0f1d] p-5 pb-safe shadow-2xl">
        <div className="flex items-center justify-between"><button type="button" onClick={()=>setCpDetails(null)} className="w-9 h-9 rounded-full bg-white/[.06] flex items-center justify-center"><X size={18}/></button><h2 className="font-black">تفاصيل CP</h2><Heart size={20} className="text-pink-400 fill-pink-400"/></div>
        <div className="mt-5 flex items-center gap-3"><img src={cpDetails.partner.avatar} alt={cpDetails.partner.name} className="w-16 h-16 rounded-full object-cover border-2 border-pink-300/20"/><div><p className="font-black">{cpDetails.partner.name}</p><p className="ui-id text-[10px] text-slate-500 mt-1">ID {cpDetails.partner.id}</p></div></div>
        <div className="mt-5 grid grid-cols-2 gap-2 text-center">
          {typeof cpDetails.days==='number'&&<div className="rounded-2xl bg-white/[.05] p-3"><span className="block text-lg font-black">{cpDetails.days}</span><span className="text-[10px] text-slate-500">يوم</span></div>}
          {typeof cpDetails.level==='number'&&<div className="rounded-2xl bg-white/[.05] p-3"><span className="block text-lg font-black">LV{cpDetails.level}</span><span className="text-[10px] text-slate-500">مستوى CP</span></div>}
        </div>
        {typeof cpDetails.experience==='number'&&<div className="mt-4 rounded-2xl bg-white/[.045] p-4"><div className="flex justify-between text-[10px] text-slate-400"><span>EXP</span><span dir="ltr">{cpDetails.experience.toLocaleString()}{typeof cpDetails.nextLevelExperience==='number'?` / ${cpDetails.nextLevelExperience.toLocaleString()}`:''}</span></div>{typeof cpDetails.nextLevelExperience==='number'&&<div className="mt-2 h-2 rounded-full bg-white/[.07] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500" style={{width:`${Math.min(100,Math.max(0,cpDetails.experience/cpDetails.nextLevelExperience*100))}%`}}/></div>}</div>}
        <div className="mt-4 rounded-2xl border border-white/8 bg-white/[.035] p-3 text-[11px] leading-6 text-slate-500">الهدايا المشتركة والذكريات والمزايا ستظهر هنا فقط عندما يوفرها Backend الحقيقي.</div>
      </section>
    </div>}
  </div>;
};

import React, {useCallback, useState} from 'react';
import {useApp} from '../../context/AppContext';
import {useServerData} from '../../hooks/useServerData';
import {rpc, backendMessage} from '../../services/backend';
import {profileToUser} from '../../services/profile';
import {UserAvatar} from '../common/UserAvatar';
import {VIPBadge} from '../common/VIPBadge';
import {RoyalAccountId} from '../common/RoyalAccountId';
import {ShimmeringAccountName} from '../common/ShimmeringAccountName';
import {Award, Ban, CarFront, ChevronRight, Crown, Gift, Heart, MessageCircle, Pencil, ShieldCheck, UserPlus} from 'lucide-react';
interface Social extends Record<string, unknown> {is_following: boolean; is_blocked: boolean; friend_status: string}
interface Couple {partner: {public_id: number}; requested_by: string; accepted_at: string | null}
export const UserDetailProfileScreen: React.FC = () => {
  const {user: me, selectedChatUser, setSelectedChatUser, setActiveSubScreen, reportError} = useApp();
  const target = selectedChatUser || me;
  const mine = target.id === me.id;
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState('');
  const [profileTab,setProfileTab] = useState<'details'|'relations'>('details');
  const [cosmeticTab,setCosmeticTab] = useState<'medals'|'cars'|'frames'|'gifts'>('medals');
  const load = useCallback(async () => {
    const [social,couples] = await Promise.all([rpc<Social>('social_profile',{p_public_id:Number(target.id),p_visit:!mine}),rpc<{relations:Couple[]}>('couple_state')]);
    return {social,couples};
  }, [target.id,me.authId,mine]);
  const {data,loading,error,reload} = useServerData(load, null);
  const social = data?.social;
  const user = mine ? me : social ? {...target,...profileToUser(social),agencyId:target.agencyId,agencyName:target.agencyName,agencyOwner:target.agencyOwner,agencyAvatar:target.agencyAvatar,equipment:target.equipment} : target;
  const relationship = data?.couples?.relations?.find(c => c.partner.public_id === Number(target.id));
  const act = async (action: string, couple = false) => {
    if (busy) return; setBusy(true); setNotice('');
    try {await rpc(couple ? 'couple_action' : 'social_action', {p_public_id:Number(target.id),p_action:action}); setNotice('تم اعتماد العملية.'); await reload();}
    catch(e) {reportError(backendMessage(e));} finally {setBusy(false);}
  };

  const equipped = user.equipment || {};
  const cosmetic = cosmeticTab === 'medals' ? equipped.badges :
    cosmeticTab === 'cars' ? equipped.cars :
    cosmeticTab === 'frames' ? equipped.frames : equipped.bubbles;
  const statList = [
    {label:'متابعين',value:user.followersCount||0,route:'friends'},
    {label:'الأصدقاء',value:user.friendsCount||0,route:'friends'},
    {label:'متابعة',value:user.followingCount||0,route:'friends'},
    {label:'زوار',value:user.visitorsCount||0,route:'visitors'},
  ];
  const glass = 'border border-[#dab96f] bg-gradient-to-br from-[#07513d] via-[#032f26] to-[#011c18] shadow-[0_5px_20px_#0008,inset_0_0_18px_#49cc9b20]';
  return (
    <main dir="rtl" className="min-h-screen pb-28 text-[#f5e4be] overflow-x-hidden" style={{background:'radial-gradient(ellipse at 60% 6%, #13604c, #032c22 50%, #001810 92%)'}}>
      <header className="relative h-[350px] sm:h-[420px] isolate">
        <div className="absolute inset-0 overflow-hidden -z-10" aria-hidden="true">
          <img src={user.avatar || '/assets/images/avatar_male_ghutra_1790628422202.jpg'} alt="" className="h-full w-full object-cover scale-110 opacity-65 blur-[1.2px]" />
          <div className="absolute inset-0" style={{background:'linear-gradient(to top,#03251e 2%,#023024aa 51%,#000e0a38 100%)'}} />
        </div>
        <div className="absolute inset-x-4 top-5 flex items-center justify-between">
          <button aria-label="رجوع" onClick={() => setActiveSubScreen(null)} className="w-12 h-12 grid place-items-center rounded-full bg-[#05291e]/90 border border-[#f3ce81] text-[#ffe9ad] shadow-[0_0_15px_#eac46577]">
            <ChevronRight size={27} />
          </button>
          {mine ? <button aria-label="تعديل البروفايل" onClick={() => setActiveSubScreen('edit_profile')} className="w-12 h-12 grid place-items-center rounded-full bg-[#05291e]/90 border border-[#f3ce81] text-[#ffe9ad] shadow-[0_0_15px_#eac46577]"><Pencil size={23}/></button> : <span />}
        </div>
        <div className="absolute top-[90px] left-0 w-[82%] max-w-sm text-center py-2 px-3 rounded-r-full border border-[#ed91ff] bg-gradient-to-r from-[#5c0ebc] via-[#8d39d8] to-[#c34bea] shadow-[0_0_15px_#dd5cff88]">
          <span className="text-[11px] font-bold text-white">✨ هدايا وفعاليات TotiChat · اكتشف المكافآت 🎁</span>
        </div>
        <div className="absolute bottom-0 w-full px-4 pb-2 flex items-end justify-between gap-3">
          <div className="relative shrink-0 w-[108px] h-[108px] sm:w-[142px] sm:h-[142px] p-[3px] rounded-full border-[3px] border-[#f3d17f] bg-[#042d24] shadow-[0_0_0_3px_#157a61,0_0_20px_#e6ba6d]">
            {(user.vipLevel ?? 0) > 0 && <span className="absolute -top-5 -right-1 text-3xl z-10" aria-label="عضو VIP">👑</span>}
            <div className="w-full h-full overflow-hidden rounded-full"><UserAvatar user={user} size="2xl" className="!w-full !h-full" /></div>
          </div>
          <div className="min-w-0 flex-1 pb-1 text-right">
            <div className="flex items-center flex-wrap gap-1.5">
              <h1 className="text-[22px] font-black text-[#ffe9b4] break-words"><ShimmeringAccountName name={user.name} styleKey={user.nameShimmerStyle}/></h1>
              <span className={user.gender === 'female'?'text-pink-300':'text-blue-400'}>{user.gender==='female'?'♀':'♂'}</span>
            </div>
            <div className="flex items-center flex-wrap gap-1.5 text-xs text-[#dce8dd]">
              <span>{user.countryFlag || '🌍'} {user.countryCode || ''}</span><span>│</span>
              <RoyalAccountId id={user.id} vipLevel={user.vipLevel} size="sm"/>
            </div>
            <div className="mt-2 inline-flex flex-wrap gap-2 items-center rounded-full border border-[#ddbb78] bg-[#1d200f]/80 px-2.5 py-1.5">
              {(user.vipLevel ?? 0)>0 && <VIPBadge level={user.vipLevel} size="sm"/>}
              {(user.level ?? 0)>0 && <span className="text-xs font-bold text-[#ffe6a8]">💠 LV{user.level}</span>}
            </div>
          </div>
        </div>
      </header>
      <p className="px-6 py-3 text-center text-sm text-[#e8efe8] break-words whitespace-pre-line">{user.bio || 'لم يضف المستخدم وصفاً بعد'}</p>
      <div className={'relative mx-3 mt-2 mb-3 rounded-[22px] px-2 py-4 '+glass}>
        <span aria-hidden="true" className="absolute -top-4 right-1/2 translate-x-1/2 text-[#f9df9b] text-2xl">◇</span>
        <div className="grid grid-cols-4">
          {statList.map(s=><button key={s.label} onClick={()=> (mine||s.route!=='visitors') && setActiveSubScreen(s.route)} className="flex flex-col text-center border-l border-[#e7c78455] last:border-0 px-0.5">
            <strong className="text-[21px] text-[#ffe6b1] tabular-nums">{s.value}</strong>
            <span className="text-[10px] sm:text-xs text-[#6cf1c6] font-extrabold">{s.label}</span>
          </button>)}
        </div>
      </div>
      {(user.agencyId || user.agencyName) && <button onClick={()=>setActiveSubScreen('agency')} className={'w-[calc(100%-24px)] mx-3 mb-4 rounded-[22px] p-3 text-right flex items-center gap-3 '+glass}>
        {user.agencyAvatar ? <img src={user.agencyAvatar} alt="شعار الوكالة" className="w-[66px] h-[66px] object-cover rounded-xl border border-[#f8d786]"/> : <div className="w-[66px] h-[66px] grid place-items-center rounded-xl bg-[#0a5d43] border border-[#f8d786]"><ShieldCheck size={42} /></div>}
        <div className="flex-1 min-w-0">
          <h2 className="text-base text-[#ffe3a8] font-black truncate">{user.agencyName || 'وكالتي'}</h2>
          {user.agencyOwner && <p className="text-xs text-[#d9e7da]">الوكيل: {user.agencyOwner}</p>}
          {user.agencyId && <p className="text-xs text-[#aed5c5]" dir="ltr">Agency ID: {user.agencyId}</p>}
        </div>
        <ChevronRight size={23} className="text-[#e9c27c]"/>
      </button>}
      <section className="mx-3">
        <div className="grid grid-cols-2 gap-1">
          {([['details','تفاصيل عني'],['relations','علاقاتي']] as const).map(t=><button key={t[0]} onClick={()=>setProfileTab(t[0])} className={'rounded-t-2xl py-3 text-sm font-black border '+(profileTab===t[0]?'border-[#e9c780] bg-[#224733] text-[#ffdf9f]':'border-[#367d68] bg-[#052e25] text-[#91bba9]')}>{t[1]}</button>)}
        </div>
        {profileTab==='details' ? <div className={'min-h-[330px] !rounded-t-none rounded-b-[22px] p-3 '+glass}>
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-[#011b16] border border-[#508f73] p-1">
            {([['medals','ميدالية'],['cars','المركبة'],['frames','غطاء الرأس'],['gifts','هدية']] as const).map(t=><button key={t[0]} onClick={()=>setCosmeticTab(t[0])} className={'rounded-xl px-1 py-2 text-[10px] sm:text-xs font-extrabold '+(cosmeticTab===t[0]?'text-[#ffe4a1] border border-[#e0be7a] bg-[#1c4836]':'text-[#b1cbbf]')}>{t[1]}</button>)}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-2xl min-h-[168px] p-3 border border-[#d6ae63] bg-gradient-to-b from-[#0a533e] to-[#04291e] text-center shadow-[0_0_13px_#c9a55e55]">
              <div className="h-[101px] flex items-center justify-center text-[56px] text-[#ffe6a5] drop-shadow-[0_0_10px_#ebc47788]">
                {cosmetic ? cosmetic.icon : cosmeticTab==='medals' ? <Award size={54}/> : cosmeticTab==='cars' ? <CarFront size={54}/> : cosmeticTab==='frames' ? <Crown size={54}/> : <Gift size={54}/>}
              </div>
              <p className="text-sm text-[#fff0c8] font-bold break-words">{cosmetic ? cosmetic.name : 'لا يوجد عنصر مُجهّز'}</p>
              {cosmetic && <small className="text-emerald-200">مجهّز حالياً</small>}
            </div>
          </div>
        </div> : <div className={'min-h-[220px] !rounded-t-none rounded-b-[22px] p-4 '+glass}>
          <h3 className="flex items-center gap-2 text-[#ffe6b2] font-extrabold"><Heart size={18}/> علاقاتي</h3>
          {relationship ? <div className="my-4 space-y-3 text-sm"><p>{relationship.accepted_at ? 'علاقة CP معتمدة' : relationship.requested_by === me.authId ? 'طلب ارتباط مرسل':'طلب ارتباط وارد'}</p>
            {!mine && !relationship.accepted_at && relationship.requested_by !== me.authId && <button disabled={busy} onClick={()=>void act('accept',true)} className="bg-emerald-700 rounded-xl px-4 py-2">قبول</button>}
            {!mine && <button disabled={busy} onClick={()=>void act(relationship.accepted_at?'end':'reject',true)} className="border border-[#d9b577] rounded-xl px-4 py-2">إنهاء / إلغاء العلاقة</button>}
          </div> : <p className="text-center text-sm text-[#bed7c7] py-7">لا توجد علاقة CP معروضة</p>}
          {!mine && !relationship && <button disabled={busy || loading || !social} onClick={()=>void act('request',true)} className="w-full bg-emerald-700 p-3 rounded-xl">طلب ارتباط</button>}
        </div>}
      </section>
      {!mine && <section className="mx-3 mt-4 grid grid-cols-2 gap-2">
        <button disabled={busy || loading || !social} onClick={()=>void act(social?.is_following?'unfollow':'follow')} className="rounded-xl border border-[#d9b577] p-3 bg-[#0d4434] flex justify-center gap-2 text-sm"><UserPlus size={17}/>{social?.is_following?'إلغاء المتابعة':'متابعة'}</button>
        <button onClick={()=>{setSelectedChatUser(user);setActiveSubScreen('chat_detail')}} className="rounded-xl border border-[#d9b577] p-3 bg-[#0d4434] flex justify-center gap-2 text-sm"><MessageCircle size={17}/>دردشة</button>
        <button disabled={busy || loading || !social} onClick={()=>void act(social?.friend_status==='accepted'?'remove_friend':social?.friend_status==='sent'?'cancel_request':social?.friend_status==='received'?'accept':'request')} className="rounded-xl bg-[#082c25] border border-[#3f886a] p-3 text-xs">{social?.friend_status==='accepted'?'إزالة الصديق':social?.friend_status==='sent'?'إلغاء الطلب':social?.friend_status==='received'?'قبول الصداقة':'طلب صداقة'}</button>
        <button disabled={busy || loading || !social} onClick={()=>void act(social?.is_blocked?'unblock':'block')} className="rounded-xl bg-[#082c25] border border-[#3f886a] p-3 text-xs flex justify-center gap-2"><Ban size={15}/>{social?.is_blocked?'إلغاء الحظر':'حظر'}</button>
      </section>}
      {loading && <p role="status" className="p-4 text-center text-sm">جارٍ تحميل الملف…</p>}
      {error && <button className="m-4 p-3 rounded-xl border border-[#d4a66a]" onClick={()=>void reload()}>{error} — إعادة المحاولة</button>}
      {notice && <p role="status" className="p-3 text-center text-[#80eec0]">{notice}</p>}
    </main>
  );
};

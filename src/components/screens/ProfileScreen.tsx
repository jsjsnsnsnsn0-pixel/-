import React, {useState} from 'react';
import {copyText} from '../../utils/clipboard';
import {setImageFallback} from '../../utils/imageFallback';
import {useTimeouts} from '../../hooks/useTimeouts';
import {useApp} from '../../context/AppContext';
import {WealthBadgeExact, CharmBadgeExact} from '../common/LevelIcons';
import {VIPBadge} from '../common/VIPBadge';
import {
  Award, BadgeCheck, Bookmark, Check, ChevronLeft, Coins, Copy, Crown,
  Edit3, Headphones, Home, Medal, Settings, ShoppingBag, Sparkles, Star,
  UsersRound, Wallet,
} from 'lucide-react';

const goldBorder='border border-[#dcb86c] shadow-[inset_0_0_16px_rgba(62,199,149,.14),0_6px_19px_rgba(0,0,0,.28)]';
const shortcutStyle='min-h-[105px] rounded-2xl border-[1.5px] border-[#d6b25e] bg-gradient-to-b from-[#fff9e7] to-[#f3e3be] shadow-[0_5px_14px_rgba(0,0,0,.33)] flex flex-col items-center justify-center gap-2 text-[#123b30] font-black active:scale-[.98] transition-transform';

export const ProfileScreen:React.FC=()=>{
 const {user,setActiveSubScreen,setSelectedChatUser,joinRoom,rooms,
  hasUnseenVisitors,hasUnseenFollowers,markVisitorsAsSeen,markFollowersAsSeen}=useApp();
 const scheduleTimeout=useTimeouts();
 const [copied,setCopied]=useState(false);
 const detail=()=>{setSelectedChatUser(null);setActiveSubScreen('user_detail_profile')};
 const copyId=async()=>{if(!await copyText(user.id))return;setCopied(true);scheduleTimeout(()=>setCopied(false),2000)};
 const openRoom=()=>{const own=rooms.find(r=>r.owner.id===user.id)||rooms[0];if(own)joinRoom(own)};
 const avatar=user.avatar||'/assets/images/default_arab_user_avatar_1790806239365.jpg';
 const linkedAgency=Boolean(user.agencyId&&user.agencyName);
 const stats=[
  {label:'متابعين',value:user.followersCount||0,click:()=>{markFollowersAsSeen();setActiveSubScreen('friends')},unseen:hasUnseenFollowers},
  {label:'الأصدقاء',value:user.friendsCount||0,click:()=>setActiveSubScreen('friends'),unseen:false},
  {label:'متابعة',value:user.followingCount||0,click:()=>setActiveSubScreen('friends'),unseen:false},
  {label:'زوار',value:user.visitorsCount||0,click:()=>{markVisitorsAsSeen();setActiveSubScreen('visitors')},unseen:hasUnseenVisitors}
 ];
 const shortcuts=[
  {name:'شحن',icon:<Wallet size={35}/>,click:()=>setActiveSubScreen('recharge')},
  {name:'غرفتي',icon:<Home size={35}/>,click:openRoom},
  {name:'المستوى',icon:<Sparkles size={35}/>,click:()=>setActiveSubScreen('level')},
  {name:'المتجر',icon:<ShoppingBag size={35}/>,click:()=>setActiveSubScreen('store')}
 ];
 const items=[
  {name:'الوكالة',icon:<UsersRound size={18}/>,route:'agency'},
  {name:'الشارات',icon:<Medal size={18}/>,route:'badges'},
  {name:'السحر والثروة',icon:<Award size={18}/>,route:'charm_wealth'},
  {name:'اكسب عملات فضية',icon:<Coins size={18}/>,route:'silver_coins'},
  {name:'مركز المساعدة',icon:<Headphones size={18}/>,route:'help_center'},
  {name:'الإعدادات',icon:<Settings size={18}/>,route:'settings'}
 ];
 return <main dir="rtl" className="min-h-screen pb-28 select-none text-[#fff0ca] overflow-x-hidden"
  style={{background:'radial-gradient(ellipse at 88% 1%,#17594d 0%,#04382e 30%,#02241c 69%,#011710 100%)'}}>
  <section className="relative min-h-[255px] px-4 pt-4 pb-7 isolate">
   <div className="absolute inset-0 -z-20"
    style={{backgroundImage:'linear-gradient(90deg,rgba(1,28,22,.44),rgba(4,46,36,.24)),url("'+avatar.replaceAll('"','%22')+'")',backgroundSize:'cover',backgroundPosition:'center 28%'}}/>
   <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#02251d] via-[#02271dbb] to-[#08231c5c]"/>
   <div className="flex justify-between items-center mb-9">
    <span className="font-black tracking-wide text-[#ffdf96] text-xs">♛ TotiChat</span>
    <button type="button" onClick={()=>setActiveSubScreen('edit_profile')} title="تعديل معلومات البروفايل"
      aria-label="تعديل الملف الشخصي" className="w-11 h-11 rounded-full bg-[#083d32e8] border border-[#efcf86] text-[#ffe4a9] shadow-[0_0_10px_#d9a95066] grid place-items-center"><Edit3 size={20}/></button>
   </div>
   <button type="button" onClick={detail} className="flex items-center text-right gap-4 w-full">
    <img src={avatar} alt={user.name} onError={e=>setImageFallback(e,'/assets/images/default_arab_user_avatar_1790806239365.jpg')}
     className="w-[96px] h-[96px] rounded-full object-cover shrink-0 border-[3px] border-[#e8c16f] ring-2 ring-[#245f48] shadow-[0_0_18px_#d7b26b6b]"/>
    <span className="flex-1 min-w-0 flex flex-col gap-2">
     <span className="font-black text-[21px] leading-tight text-[#ffedc5] truncate">{user.name||'مستخدم جديد'}
      <span className={'mr-1 text-base '+(user.gender==='female'?'text-pink-300':'text-sky-300')}>{user.gender==='female'?'♀':'♂'}</span>
     </span>
     <span className="text-[#d7e5d9] text-[11px]">{user.countryFlag||'🌍'} {user.countryCode||''} <span className="opacity-70">│</span> ID: {user.id}</span>
     <span className="flex flex-wrap gap-1.5 items-center">
      {(user.vipLevel??0)>0&&<span className="text-xs bg-[#5d4523] border border-[#c79d59] rounded-md px-2 py-1 text-[#ffe4a4]">👑 VIP {user.vipLevel}</span>}
      <span className="text-[11px] rounded-md bg-[#07573f] text-[#8df4cc] px-2 py-1 border border-[#43856d]">💠 LV {user.level}</span>
     </span>
    </span>
    <ChevronLeft size={18} className="text-[#f4d797] shrink-0"/>
   </button>
   <div className="flex flex-wrap gap-2 mt-3 items-center justify-start">
    {(user.charmLevel??0)>0&&<CharmBadgeExact level={user.charmLevel||1} size="sm" onClick={()=>setActiveSubScreen('charm_level')}/>}
    {(user.wealthLevel??0)>0&&<WealthBadgeExact level={user.wealthLevel||user.level||1} size="sm" onClick={()=>setActiveSubScreen('wealth_level')}/>}
    {(user.vipLevel??0)>0&&<VIPBadge level={user.vipLevel||1} size="sm" onClick={()=>setActiveSubScreen('vip')}/>}
    <button type="button" onClick={()=>void copyId()} className="inline-flex items-center gap-1 rounded-full bg-[#002d25b8] px-2 py-1 text-[10px] text-[#e4d4b6] border border-[#967a49]">
     {copied?<Check size={13}/>:<Copy size={13}/>} {copied?'تم النسخ':'نسخ ID'}
    </button>
   </div>
  </section>
  <section aria-label="إحصائيات الحساب" className={goldBorder+' relative grid grid-cols-4 mx-3 -mt-1 p-3 py-4 rounded-[20px] bg-gradient-to-l from-[#05352c] via-[#08604b] to-[#002f28]'}>
   {stats.map((s,i)=><button type="button" key={s.label} onClick={s.click}
    className={'min-w-0 relative text-center px-1 '+(i<3?'border-l border-[#8ab79561]':'')}>
    <span className="relative inline-block text-[#fff0c9] text-xl font-black tabular-nums">{s.value}{s.unseen&&<span className="absolute -top-0.5 -left-1.5 w-2 h-2 bg-rose-400 rounded-full"/>}</span>
    <span className="block mt-1 text-[10px] text-[#75f0c1] font-extrabold">{s.label}</span>
   </button>)}
  </section>
  {linkedAgency&&<button type="button" onClick={()=>setActiveSubScreen('agency')}
   className={goldBorder+' mx-3 mt-3 flex items-center gap-3 w-[calc(100%-24px)] rounded-2xl px-3 py-3 text-right bg-[#063c2d]'}
   style={{backgroundImage:'linear-gradient(105deg,#013d31e8,#054c3ae2),url("/assets/images/agency_opening_banner_1790725265910.jpg")',backgroundSize:'cover'}}>
    <img src={user.agencyAvatar||'/assets/images/agency_opening_banner_1790725265910.jpg'}
     alt="شعار الوكالة" onError={e=>setImageFallback(e,'/assets/images/agency_opening_banner_1790725265910.jpg')}
     className="w-14 h-14 rounded-xl object-cover border border-[#dfb978] shrink-0"/>
    <span className="flex-1 min-w-0">
     <span className="block text-[10px] text-[#91f0c9]">👥 وكالتي</span>
     <strong className="block truncate text-[#ffe5ac]">{user.agencyName}</strong>
     <span className="block text-[10px] text-[#c7e1d3]">ID: {user.agencyId}</span>
     {user.agencyOwner&&<span className="block text-[10px] text-[#e9d2a5]">الوكيل: {user.agencyOwner}</span>}
    </span><ChevronLeft size={19} className="text-[#f5d58a]"/>
   </button>}
  <button type="button" onClick={()=>setActiveSubScreen('vip')}
   className="relative overflow-hidden flex items-center justify-between w-[calc(100%-24px)] mx-3 mt-3 rounded-2xl px-5 py-3 border border-[#d7b471] bg-gradient-to-l from-[#0d1620] via-[#173c37] to-[#0b1e23] shadow-lg text-[#ffdc92]">
   <span className="font-black text-lg flex gap-2 items-center"><Crown size={23}/> VIP {user.vipLevel&&user.vipLevel>0?user.vipLevel:''}</span>
   <span className="text-xs font-bold flex items-center gap-1">عرض المزايا <ChevronLeft size={15}/></span>
  </button>
  <div className="grid grid-cols-4 gap-2 px-3 mt-3">
   {shortcuts.map(x=><button key={x.name} type="button" onClick={x.click} className={shortcutStyle}>
    <span className="text-[#b58032] drop-shadow-md">{x.icon}</span><span className="text-[11px]">{x.name}</span>
   </button>)}
  </div>
  <nav aria-label="خيارات الحساب" className="mx-3 mt-3 rounded-2xl overflow-hidden border border-[#bca16a] shadow-lg bg-gradient-to-b from-[#063a2e] to-[#022c24]">
   {items.map((x,i)=><button type="button" key={x.route} onClick={()=>setActiveSubScreen(x.route)}
    className={'w-full flex items-center gap-3 px-4 min-h-[55px] text-right text-[#f6e3bb] '+(i<items.length-1?'border-b border-[#c4a06a55]':'')}>
    <span className="w-9 h-9 shrink-0 grid place-items-center rounded-xl bg-gradient-to-br from-[#21664b] to-[#073d32] text-[#ffdc91]">{x.icon}</span>
    <span className="flex-1 text-sm font-extrabold">{x.name}</span>
    {x.route==='silver_coins'&&<span className="text-[10px] bg-[#775323] rounded-full px-2 py-1">جديد</span>}
    <ChevronLeft size={17} className="text-[#e8c885]"/>
   </button>)}
  </nav>
  <p className="text-center text-[10px] mt-5 text-[#7ab9a1] flex items-center gap-2 justify-center"><Star size={13}/><BadgeCheck size={13}/> TotiChat</p>
 </main>;
};

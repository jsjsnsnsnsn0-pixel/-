import React from 'react';
import {
  Award,
  BadgeCheck,
  Copy,
  Crown,
  Gift,
  Heart,
  MessageCircle,
  MoreHorizontal,
  PackageOpen,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import {User} from '../../types';
import {RoomPublicProfile,RoomRelationship} from '../../services/roomPublicProfile';
import {defaultAvatar} from '../../services/profile';
import {setImageFallback} from '../../utils/imageFallback';
import {ShimmeringAccountName} from '../common/ShimmeringAccountName';
import {RoyalAccountId} from '../common/RoyalAccountId';
import {VIPBadge} from '../common/VIPBadge';
import {LevelBadge} from '../common/LevelBadge';
import {RelationshipShowcaseCard} from '../common/RelationshipShowcaseCard';

export const vipAccent=(level:number)=>{
  if(level>=8)return 'from-fuchsia-500/35 via-amber-300/20 to-violet-600/25';
  if(level>=5)return 'from-amber-400/30 via-rose-400/18 to-fuchsia-500/22';
  if(level>=3)return 'from-cyan-400/25 via-indigo-500/20 to-violet-500/20';
  if(level>0)return 'from-emerald-400/22 via-cyan-400/16 to-indigo-500/18';
  return 'from-white/[.08] via-white/[.035] to-transparent';
};

export function ProfileHeroFull({user,partner,onPartner,isSelf,onEdit}:{user:User;partner?:RoomPublicProfile;onPartner?:(profile:RoomPublicProfile)=>void;isSelf:boolean;onEdit?:()=>void}) {
  const activeVip=(user.vipLevel??0)>0;
  const cover=(user as User&{coverImage?:string}).coverImage;
  return <section className="relative -mx-4 -mt-4 overflow-hidden" data-testid="full-profile-hero">
    <div className="relative h-[360px] overflow-hidden bg-[radial-gradient(circle_at_25%_18%,rgba(79,70,229,.45),transparent_34%),radial-gradient(circle_at_78%_24%,rgba(236,72,153,.28),transparent_32%),linear-gradient(180deg,#15152a_0%,#0d1020_58%,#080914_100%)]">
      {cover&&<img src={cover} alt="" onError={e=>setImageFallback(e,defaultAvatar)} className="absolute inset-0 w-full h-full object-cover"/>}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080914] via-[#080914]/38 to-black/15"/>
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#080914] via-[#080914]/80 to-transparent"/>
      {activeVip&&<div className={`absolute inset-x-4 top-10 h-40 rounded-full bg-gradient-to-r ${vipAccent(user.vipLevel)} blur-3xl opacity-90`}/>}
      {isSelf&&onEdit&&<button type="button" onClick={onEdit} className="absolute top-[max(18px,env(safe-area-inset-top))] left-4 z-20 rounded-full border border-white/12 bg-black/25 backdrop-blur-xl px-3 py-2 text-[11px] font-black text-white">تعديل الملف</button>}

      <div className="absolute inset-x-0 bottom-5 z-10 px-5">
        {partner&&<div className="mb-3 flex items-center justify-center" data-testid="cp-quick-preview">
          <div className="relative flex items-center">
            <img src={user.avatar||defaultAvatar} onError={e=>setImageFallback(e,defaultAvatar)} alt={user.name} className="w-[84px] h-[84px] rounded-full border-[3px] border-white/90 object-cover shadow-2xl"/>
            <div className="relative z-20 -mx-3 w-12 h-12 rounded-full border border-pink-300/40 bg-[#181125]/90 backdrop-blur-xl flex items-center justify-center shadow-[0_0_28px_rgba(244,114,182,.28)]"><Heart size={24} className="text-pink-400 fill-pink-400"/></div>
            <button type="button" onClick={()=>onPartner?.(partner)} aria-label={`زيارة ملف ${partner.name}`}><img src={partner.avatar||defaultAvatar} onError={e=>setImageFallback(e,defaultAvatar)} alt={partner.name} className="w-[84px] h-[84px] rounded-full border-[3px] border-white/90 object-cover shadow-2xl"/></button>
          </div>
        </div>}
        {!partner&&<div className="mb-3 flex justify-center"><div className={`relative p-1 rounded-full bg-gradient-to-br ${activeVip?vipAccent(user.vipLevel):'from-white/35 to-white/10'}`}><img src={user.avatar||defaultAvatar} onError={e=>setImageFallback(e,defaultAvatar)} alt={user.name} className="w-[92px] h-[92px] rounded-full object-cover border-2 border-[#0b0d19]"/></div></div>}
      </div>
    </div>
  </section>;
}

export function ProfileIdentity({user,onCopy}:{user:User;onCopy:()=>void}) {
  return <section className="text-center px-1 -mt-1">
    <div className="flex items-center justify-center gap-2 flex-wrap">
      <ShimmeringAccountName tone="dark" name={user.name} vipLevel={user.vipLevel} styleKey={user.nameShimmerStyle} size="xl" showSparkles={(user.vipLevel??0)>0}/>
      {user.gender&&<span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black text-white ${user.gender==='female'?'bg-pink-500':'bg-sky-500'}`}>{user.gender==='female'?'♀':'♂'}</span>}
    </div>
    {user.username&&<p dir="ltr" className="mt-1 text-[11px] text-slate-500">@{user.username}</p>}
    <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
      {user.countryCode&&<span className="text-xs text-slate-300">{user.countryFlag} {user.countryCode}</span>}
      <RoyalAccountId tone="dark" id={user.id} vipLevel={user.vipLevel} size="sm"/>
      <button type="button" onClick={onCopy} aria-label={`نسخ معرف الحساب ${user.id}`} className="w-8 h-8 rounded-xl border border-white/8 bg-white/[.05] flex items-center justify-center text-slate-400"><Copy size={14}/></button>
    </div>
    <div className="mt-3 flex flex-wrap justify-center gap-2">
      {(user.vipLevel??0)>0&&<VIPBadge level={user.vipLevel} size="sm"/>}
      {user.hasPublicLevel!==false&&<LevelBadge level={user.level} size="sm"/>}
      {(user.wealthLevel??0)>0&&<span className="rounded-full border border-amber-300/15 bg-amber-400/10 px-2.5 py-1 text-[10px] font-black text-amber-200">ثروة {user.wealthLevel}</span>}
      {(user.charmLevel??0)>0&&<span className="rounded-full border border-pink-300/15 bg-pink-400/10 px-2.5 py-1 text-[10px] font-black text-pink-200">جاذبية {user.charmLevel}</span>}
      {user.isHost&&<span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-black text-cyan-200"><ShieldCheck size={11} className="inline ml-1"/>Host</span>}
    </div>
  </section>;
}

export function ProfileBio({bio}:{bio?:string}) {
  const [expanded,setExpanded]=React.useState(false);
  if(!bio)return null;
  const long=bio.length>120;
  return <section className="rounded-[24px] border border-white/8 bg-white/[.045] p-4 text-right">
    <p className={`text-sm leading-7 text-slate-300 whitespace-pre-wrap break-words ${!expanded&&long?'line-clamp-3':''}`}>{bio}</p>
    {long&&<button type="button" onClick={()=>setExpanded(v=>!v)} className="mt-2 text-[11px] font-black text-violet-300">{expanded?'عرض أقل':'المزيد'}</button>}
  </section>;
}

export function ProfileStats({user,onFollowers,onFollowing,onVisitors}:{user:User;onFollowers?:()=>void;onFollowing?:()=>void;onVisitors?:()=>void}) {
  const items=[
    {label:'المتابعون',value:user.followersCount,onClick:onFollowers},
    {label:'يتابع',value:user.followingCount,onClick:onFollowing},
    {label:'الزوار',value:user.visitorsCount??0,onClick:onVisitors},
    {label:'استلم',value:user.receivedTotal??'0'},
  ];
  return <section className="grid grid-cols-4 overflow-hidden rounded-[24px] border border-white/8 bg-white/[.055]">
    {items.map((item,index)=><button key={item.label} type="button" disabled={!item.onClick} onClick={item.onClick} className={`min-w-0 px-2 py-4 text-center ${index?'border-r border-white/7':''} disabled:cursor-default`}><span dir="ltr" className="block text-base font-black text-white truncate">{item.value}</span><span className="block mt-1 text-[10px] text-slate-500">{item.label}</span></button>)}
  </section>;
}

export function AgencyCard({agency,onOpen}:{agency?:RoomPublicProfile['agency'];onOpen?:()=>void}) {
  if(!agency)return null;
  return <section>
    <div className="mb-2 flex items-center gap-2"><span className="w-1 h-5 rounded-full bg-cyan-400"/><h2 className="text-sm font-black">الوكالة</h2></div>
    <button type="button" onClick={onOpen} disabled={!onOpen} className="w-full rounded-[24px] border border-white/8 bg-[linear-gradient(135deg,rgba(14,116,144,.14),rgba(124,58,237,.10),rgba(255,255,255,.035))] p-3.5 flex items-center gap-3 text-right disabled:cursor-default">
      {agency.logoUrl?<img src={agency.logoUrl} alt="" className="w-14 h-14 rounded-2xl object-cover border border-white/10"/>:<span className="w-14 h-14 rounded-2xl bg-white/[.06] flex items-center justify-center text-2xl">🏛️</span>}
      <span className="min-w-0 flex-1"><span className="block font-black truncate">{agency.name}</span><span className="ui-id block text-[10px] text-slate-500 mt-1">ID {agency.id}</span>{agency.role&&<span className="block mt-1 text-[10px] text-cyan-300">{agency.role==='owner'?'مالك الوكالة':agency.role}</span>}</span>
      {typeof agency.membersCount==='number'&&<span className="rounded-full bg-black/20 px-2.5 py-1 text-[10px] text-slate-300">{agency.membersCount} عضو</span>}
    </button>
  </section>;
}

export function ProfileEquipment({user}:{user:User}) {
  const items=Object.values(user.equipment||{}).filter(Boolean);
  if(!items.length)return null;
  return <section className="rounded-[24px] border border-white/8 bg-white/[.045] p-4"><div className="flex items-center gap-2 mb-3"><PackageOpen size={17} className="text-violet-300"/><h2 className="text-sm font-black">التجهيزات والشارات</h2></div><div className="grid grid-cols-2 gap-2">{items.map(item=>item&&<div key={item.id} className="rounded-2xl bg-black/15 px-3 py-2.5 flex items-center gap-2"><span className="text-xl">{item.icon}</span><span className="text-xs font-bold truncate">{item.name}</span></div>)}</div></section>;
}

export function ProfileTabs({tab,setTab}:{tab:'about'|'relationships';setTab:(tab:'about'|'relationships')=>void}) {
  return <div className="sticky top-0 z-10 grid grid-cols-2 rounded-2xl border border-white/8 bg-[#0a0c18]/88 backdrop-blur-xl p-1">
    <button type="button" onClick={()=>setTab('about')} className={`relative py-3 text-sm font-black rounded-xl ${tab==='about'?'text-white bg-white/[.07]':'text-slate-500'}`}>تفاصيل عني{tab==='about'&&<span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-violet-400"/>}</button>
    <button type="button" onClick={()=>setTab('relationships')} className={`relative py-3 text-sm font-black rounded-xl ${tab==='relationships'?'text-white bg-white/[.07]':'text-slate-500'}`}>علاقاتي{tab==='relationships'&&<span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-pink-400"/>}</button>
  </div>;
}

export function CpRelationshipSection({owner,relationships,onPartner,onDetails,canCreate}:{owner:User;relationships:RoomRelationship[];onPartner:(profile:RoomPublicProfile)=>void;onDetails?:(relation:RoomRelationship)=>void;canCreate?:boolean}) {
  const primary=relationships.find(r=>r.isPrimary)||relationships.find(r=>r.typeId==='love');
  const secondary=relationships.filter(r=>r!==primary);
  return <div className="space-y-5">
    <section>
      <div className="mb-3 flex items-center gap-2"><span className="w-1 h-5 rounded-full bg-pink-400"/><h2 className="text-sm font-black">CP</h2></div>
      {primary?<button type="button" onClick={()=>onDetails?.(primary)} className="w-full text-right"><RelationshipShowcaseCard owner={{name:owner.name,avatar:owner.avatar,level:owner.level}} relation={primary} onPartner={()=>onPartner(primary.partner)}/></button>:<div className="rounded-[24px] border border-dashed border-white/10 bg-white/[.035] p-6 text-center"><Heart className="mx-auto text-slate-600" size={28}/><p className="mt-3 text-sm font-black">ليس لديك CP حالياً</p><p className="mt-1 text-[11px] leading-5 text-slate-500">عندما تكون هناك علاقة CP فعالة ستظهر بطاقتها هنا.</p>{canCreate&&<button type="button" className="mt-3 rounded-xl bg-pink-500/15 border border-pink-400/20 px-4 py-2 text-xs font-black text-pink-200">إنشاء CP</button>}</div>}
    </section>
    {secondary.length>0&&<section><div className="mb-3 flex items-center gap-2"><span className="w-1 h-5 rounded-full bg-violet-400"/><h2 className="text-sm font-black">علاقاتي</h2></div><div className="grid grid-cols-2 gap-3">{secondary.map((relation,index)=><button key={relation.relationId||`${relation.typeId}:${relation.partner.id}:${index}`} type="button" onClick={()=>onPartner(relation.partner)} className={`relative overflow-hidden rounded-[22px] border border-white/8 p-3 text-center bg-gradient-to-b ${relation.level&&relation.level>=4?'from-fuchsia-500/14 to-white/[.035]':relation.level&&relation.level>=2?'from-violet-500/12 to-white/[.035]':'from-white/[.06] to-white/[.025]'}`}><img src={relation.partner.avatar||defaultAvatar} onError={e=>setImageFallback(e,defaultAvatar)} alt={relation.partner.name} className="mx-auto w-16 h-16 rounded-full object-cover border-2 border-white/20"/><p className="mt-2 text-[11px] text-pink-300 font-black">{relation.typeLabel||'علاقة'}</p><p className="mt-1 text-xs font-black truncate">{relation.partner.name}</p><div className="mt-2 flex justify-center gap-2 text-[9px] text-slate-400">{typeof relation.level==='number'&&<span>LV{relation.level}</span>}{typeof relation.days==='number'&&<span>{relation.days} يوم</span>}</div></button>)}</div></section>}
  </div>;
}

export function OtherProfileActions({following,busy,onFollow,onMessage,onGift,onMore,giftEnabled=true}:{following:boolean;busy:boolean;onFollow:()=>void;onMessage:()=>void;onGift:()=>void;onMore:()=>void;giftEnabled?:boolean}) {
  return <footer className="fixed bottom-0 inset-x-0 z-30 mx-auto max-w-md border-t border-white/8 bg-[#090b16]/92 backdrop-blur-2xl px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
    <button type="button" disabled={busy} onClick={onFollow} className="min-h-[52px] rounded-2xl bg-white/[.065] border border-white/8 text-[11px] font-black flex flex-col items-center justify-center gap-1 disabled:opacity-50">{following?<UserCheck size={18} className="text-emerald-300"/>:<UserPlus size={18} className="text-cyan-300"/>}{following?'تمت المتابعة':'متابعة'}</button>
    <button type="button" onClick={onMessage} className="min-h-[52px] rounded-2xl bg-white/[.065] border border-white/8 text-[11px] font-black flex flex-col items-center justify-center gap-1"><MessageCircle size={18} className="text-cyan-300"/>رسالة</button>
    <button type="button" disabled={!giftEnabled} onClick={onGift} className="min-h-[52px] rounded-2xl bg-gradient-to-b from-fuchsia-500/20 to-violet-500/15 border border-fuchsia-300/15 text-[11px] font-black flex flex-col items-center justify-center gap-1 disabled:opacity-35"><Gift size={18} className="text-pink-300"/>هدية</button>
    <button type="button" onClick={onMore} aria-label="المزيد" className="w-12 min-h-[52px] rounded-2xl bg-white/[.05] border border-white/8 flex items-center justify-center"><MoreHorizontal size={19}/></button>
  </footer>;
}

export function SelfProfileActions({onEdit,onShare,onInventory,onPrivacy}:{onEdit:()=>void;onShare:()=>void;onInventory:()=>void;onPrivacy:()=>void}) {
  return <section className="grid grid-cols-2 gap-2">
    <button type="button" onClick={onEdit} className="min-h-[58px] rounded-2xl bg-violet-500/15 border border-violet-400/15 font-black text-sm">تعديل الملف الشخصي</button>
    <button type="button" onClick={onShare} className="min-h-[58px] rounded-2xl bg-white/[.055] border border-white/8 font-black text-sm">QR / مشاركة الحساب</button>
    <button type="button" onClick={onInventory} className="min-h-[58px] rounded-2xl bg-white/[.055] border border-white/8 font-black text-sm">عرض حقيبتي</button>
    <button type="button" onClick={onPrivacy} className="min-h-[58px] rounded-2xl bg-white/[.055] border border-white/8 font-black text-sm">إعدادات الخصوصية</button>
  </section>;
}

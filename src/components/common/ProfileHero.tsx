import React from 'react';
import {User} from '../../types';
import {UserAvatar} from './UserAvatar';
import {ShimmeringAccountName} from './ShimmeringAccountName';
import {RoyalAccountId} from './RoyalAccountId';
import {VIPBadge} from './VIPBadge';
import {LevelBadge} from './LevelBadge';
import {Heart} from 'lucide-react';
import {RoomPublicProfile} from '../../services/roomPublicProfile';
export function ProfileHero({user,partner,onPartner}:{user:User;partner?:RoomPublicProfile;onPartner:(partner:RoomPublicProfile)=>void}) {
  return <section data-testid="full-profile-hero" data-vip-level={user.vipLevel} className="relative overflow-hidden -mx-4 bg-[#100b20]">
    <div className="relative h-[clamp(200px,34dvh,320px)]"><img src={user.avatar} alt="" className="w-full h-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-[#100b20] via-transparent to-black/10"/>
      <div className="absolute bottom-0 right-5 flex items-center gap-3"><UserAvatar user={user} size="lg"/>{partner&&<><Heart className="text-pink-400 fill-pink-400" size={28}/><button type="button" onClick={()=>onPartner(partner)} aria-label={`زيارة ملف ${partner.name}`}><img src={partner.avatar} alt={partner.name} className="w-20 h-20 rounded-full border-2 border-pink-300 object-cover"/></button></>}</div>
    </div>
    <div className="p-5 text-right"><h1 className="text-xl font-bold break-words"><ShimmeringAccountName tone="dark" name={user.name} styleKey={user.nameShimmerStyle}/></h1>
      <div className="flex flex-wrap items-center gap-2 mt-3"><RoyalAccountId tone="dark" id={user.id} vipLevel={user.vipLevel}/>{user.countryCode&&<span className="text-xs text-slate-300">{user.countryFlag} {user.countryCode}</span>}{user.gender&&<span aria-label={user.gender==='female'?'أنثى':'ذكر'} className="text-purple-300">{user.gender==='female'?'♀':'♂'}</span>}</div>
      <div className="flex gap-2 mt-3"><VIPBadge level={user.vipLevel}/>{user.hasPublicLevel!==false&&<LevelBadge level={user.level} size="sm"/>}</div>
      {user.bio&&<p className="whitespace-pre-wrap break-words mt-4 text-sm text-slate-300">{user.bio}</p>}
    </div>
  </section>;
}

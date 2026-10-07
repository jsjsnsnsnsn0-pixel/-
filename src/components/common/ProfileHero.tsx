import React from 'react';
import {User} from '../../types';
import {ShimmeringAccountName} from './ShimmeringAccountName';
import {RoyalAccountId} from './RoyalAccountId';
import {VIPBadge} from './VIPBadge';
import {LevelBadge} from './LevelBadge';
import {Heart, Sparkles} from 'lucide-react';
import {RoomPublicProfile} from '../../services/roomPublicProfile';
import {defaultAvatar} from '../../services/profile';
import {setImageFallback} from '../../utils/imageFallback';

export function ProfileHero({user,partner,onPartner}:{user:User;partner?:RoomPublicProfile;onPartner:(partner:RoomPublicProfile)=>void}) {
  return <section className="relative overflow-hidden -mx-4 bg-[#00251c]">
    <div className="relative h-[330px] overflow-hidden">
      <img src={user.avatar||defaultAvatar} onError={e=>setImageFallback(e,defaultAvatar)} alt="" className="w-full h-full object-cover scale-[1.02]"/>
      <div className="absolute inset-0 bg-gradient-to-t from-[#00251c] via-[#00251c]/35 to-black/20"/>
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#00251c] to-transparent"/>

      {partner&&<div className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-0 z-10">
        <div className="relative z-10">
          <img src={user.avatar||defaultAvatar} onError={e=>setImageFallback(e,defaultAvatar)} alt={user.name} className="w-[88px] h-[88px] rounded-full border-[3px] border-white object-cover shadow-2xl"/>
        </div>
        <div className="relative z-20 -mx-3 w-12 h-12 rounded-full bg-[#0b2f27]/95 border border-pink-300/50 flex items-center justify-center shadow-xl">
          <Heart size={25} className="text-pink-400 fill-pink-400"/>
        </div>
        <button type="button" onClick={()=>onPartner(partner)} aria-label={`زيارة ملف ${partner.name}`} className="relative z-10">
          <img src={partner.avatar||defaultAvatar} onError={e=>setImageFallback(e,defaultAvatar)} alt={partner.name} className="w-[88px] h-[88px] rounded-full border-[3px] border-white object-cover shadow-2xl"/>
        </button>
        <span className="absolute -bottom-1 rounded-full border border-pink-300/30 bg-black/45 backdrop-blur-md px-3 py-1 text-[10px] font-black text-pink-100">CP</span>
      </div>}

      {!partner&&<div className="absolute bottom-5 right-5 z-10">
        <img src={user.avatar||defaultAvatar} onError={e=>setImageFallback(e,defaultAvatar)} alt={user.name} className="w-[92px] h-[92px] rounded-full border-[3px] border-white object-cover shadow-2xl"/>
      </div>}
    </div>

    <div className="relative -mt-1 px-5 pb-5 pt-3 text-right">
      <div className="flex items-center justify-end gap-2">
        <ShimmeringAccountName tone="dark" name={user.name} vipLevel={user.vipLevel} styleKey={user.nameShimmerStyle} size="xl"/>
        {partner&&<Sparkles size={14} className="text-pink-300"/>}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 mt-2">
        <RoyalAccountId tone="dark" id={user.id} vipLevel={user.vipLevel}/>
        {user.countryCode&&<span className="text-xs text-slate-300">{user.countryFlag} {user.countryCode}</span>}
        {user.gender&&<span aria-label={user.gender==='female'?'أنثى':'ذكر'} className="text-purple-300">{user.gender==='female'?'♀':'♂'}</span>}
      </div>
      <div className="flex justify-end gap-2 mt-3">
        {(user.vipLevel??0)>0&&<VIPBadge level={user.vipLevel}/>}
        {user.hasPublicLevel!==false&&<LevelBadge level={user.level} size="sm"/>}
      </div>
      {user.bio&&<p className="whitespace-pre-wrap break-words mt-4 text-sm leading-6 text-slate-300">{user.bio}</p>}
    </div>
  </section>;
}

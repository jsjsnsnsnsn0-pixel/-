import React from 'react';
import {Heart, Sparkles} from 'lucide-react';
import {RoomRelationship} from '../../services/roomPublicProfile';
import {defaultAvatar} from '../../services/profile';
import {setImageFallback} from '../../utils/imageFallback';

interface PersonView {
  name: string;
  avatar: string;
  level?: number;
}

interface RelationshipShowcaseCardProps {
  owner: PersonView;
  relation: RoomRelationship;
  compact?: boolean;
  onPartner?: () => void;
  className?: string;
}

const safeColor=(value:unknown,fallback:string)=>{
  if(typeof value!=='string')return fallback;
  return /^#[0-9a-f]{6}$/i.test(value)?value:fallback;
};

export const RelationshipShowcaseCard: React.FC<RelationshipShowcaseCardProps> = ({
  owner,
  relation,
  compact=false,
  onPartner,
  className='',
}) => {
  const accent=safeColor(relation.presentation?.accent,'#fb7185');
  const background=safeColor(relation.presentation?.background,'#4a1235');
  const icon=typeof relation.presentation?.icon==='string'&&relation.presentation.icon.trim()
    ? relation.presentation.icon
    : relation.typeId==='love'?'💗':'🤝';
  const experience=relation.experience ?? 0;
  const next=relation.nextLevelExperience;
  const progress=next&&next>0?Math.min(100,Math.max(0,(experience/next)*100)):0;
  const label=relation.typeLabel||'CP';
  const ownerLevel=owner.level;
  const partnerLevel=relation.partner.level;

  if(compact){
    return <div
      data-testid="relationship-showcase-compact"
      className={`relative overflow-hidden rounded-[22px] border px-3 py-3 shadow-[0_10px_30px_rgba(0,0,0,.24)] ${className}`}
      style={{
        borderColor:`${accent}66`,
        background:`linear-gradient(105deg,${background}ee,#1b0b20 48%,${background}ee)`,
      }}
    >
      <div className="absolute inset-x-10 top-0 h-px opacity-80" style={{background:`linear-gradient(90deg,transparent,${accent},transparent)`}}/>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 text-center">
          <img src={owner.avatar||defaultAvatar} alt={owner.name} onError={e=>setImageFallback(e,defaultAvatar)} className="w-14 h-14 rounded-full object-cover border-2 shadow-lg mx-auto" style={{borderColor:accent}}/>
          <p className="mt-1 text-[11px] font-black text-white truncate max-w-24">{owner.name}</p>
          {ownerLevel!==undefined&&<span className="text-[10px] text-amber-200">LV.{ownerLevel}</span>}
        </div>

        <div className="min-w-0 flex-1 text-center">
          <div className="mx-auto w-12 h-12 rounded-full border border-white/10 bg-white/[0.06] flex items-center justify-center text-2xl shadow-inner">{icon}</div>
          <p className="mt-1 text-[11px] font-black" style={{color:accent}}>{label}</p>
          <p className="text-[10px] text-slate-300">{relation.days??0} يوم{relation.level? ` · CP LV.${relation.level}`:''}</p>
          {relation.experience!==undefined&&<div className="mt-1.5">
            <div className="h-1.5 rounded-full overflow-hidden bg-white/10"><div className="h-full rounded-full" style={{width:`${progress}%`,background:`linear-gradient(90deg,${accent},#fbbf24)`}}/></div>
          </div>}
        </div>

        <button type="button" onClick={onPartner} aria-label={onPartner?`زيارة ملف ${relation.partner.name}`:undefined} className="min-w-0 text-center disabled:cursor-default" disabled={!onPartner}>
          <img src={relation.partner.avatar||defaultAvatar} alt={relation.partner.name} onError={e=>setImageFallback(e,defaultAvatar)} className="w-14 h-14 rounded-full object-cover border-2 shadow-lg mx-auto" style={{borderColor:accent}}/>
          <p className="mt-1 text-[11px] font-black text-white truncate max-w-24">{relation.partner.name}</p>
          {partnerLevel!==undefined&&<span className="text-[10px] text-amber-200">LV.{partnerLevel}</span>}
        </button>
      </div>
    </div>;
  }

  return <article
    data-testid="relationship-showcase"
    className={`relative overflow-hidden rounded-[26px] border shadow-[0_14px_38px_rgba(0,0,0,.3)] ${className}`}
    style={{
      borderColor:`${accent}70`,
      background:`radial-gradient(circle at 50% 25%,${accent}2b,transparent 30%),linear-gradient(110deg,${background}f5,#270c24 48%,${background}f5)`,
    }}
  >
    <div className="absolute inset-x-6 top-0 h-px" style={{background:`linear-gradient(90deg,transparent,${accent},#fde68a,${accent},transparent)`}}/>
    <div className="px-4 pt-3 flex items-center justify-between">
      <span className="text-[11px] text-white/55">العلاقة</span>
      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/15 px-3 py-1 text-xs font-black" style={{color:accent}}>
        <Sparkles size={12}/>{label}
      </span>
    </div>

    <div className="relative px-4 pb-4 pt-3">
      <div className="flex items-center justify-between gap-2">
        <div className="w-[31%] min-w-0 text-center">
          <div className="relative mx-auto w-[78px] h-[78px]">
            <div className="absolute inset-0 rounded-full blur-md opacity-40" style={{background:accent}}/>
            <img src={owner.avatar||defaultAvatar} alt={owner.name} onError={e=>setImageFallback(e,defaultAvatar)} className="relative w-full h-full rounded-full object-cover border-[3px] shadow-xl" style={{borderColor:'#fde68a'}}/>
          </div>
          <p className="mt-2 text-sm font-black text-white truncate">{owner.name}</p>
          {ownerLevel!==undefined&&<p className="text-[11px] text-amber-200">LV.{ownerLevel}</p>}
        </div>

        <div className="w-[38%] text-center">
          <div className="relative mx-auto w-[86px] h-[72px] flex items-center justify-center">
            <div className="absolute inset-0 rounded-full blur-2xl opacity-35" style={{background:accent}}/>
            <Heart size={60} className="relative drop-shadow-[0_6px_14px_rgba(0,0,0,.35)]" style={{color:accent,fill:accent}}/>
            <span className="absolute text-lg font-black text-white">{relation.days??0}</span>
          </div>
          <p className="text-[10px] text-white/60 -mt-1">يوم</p>
          <p className="mt-1 text-sm font-black" style={{color:accent}}>{relation.level? `CP LV.${relation.level}`:'CP'}</p>
        </div>

        <button type="button" onClick={onPartner} disabled={!onPartner} aria-label={onPartner?`زيارة ملف ${relation.partner.name}`:undefined} className="w-[31%] min-w-0 text-center disabled:cursor-default">
          <div className="relative mx-auto w-[78px] h-[78px]">
            <div className="absolute inset-0 rounded-full blur-md opacity-40" style={{background:accent}}/>
            <img src={relation.partner.avatar||defaultAvatar} alt={relation.partner.name} onError={e=>setImageFallback(e,defaultAvatar)} className="relative w-full h-full rounded-full object-cover border-[3px] shadow-xl" style={{borderColor:'#f9a8d4'}}/>
          </div>
          <p className="mt-2 text-sm font-black text-white truncate">{relation.partner.name}</p>
          {partnerLevel!==undefined&&<p className="text-[11px] text-amber-200">LV.{partnerLevel}</p>}
        </button>
      </div>

      {relation.experience!==undefined&&<div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/15 px-3 py-2">
        <div className="flex items-center justify-between gap-2 text-[10px]">
          <span className="text-slate-300">EXP {experience.toLocaleString('ar-SA')}</span>
          <span className="font-bold" style={{color:accent}}>{next? `التالي ${next.toLocaleString('ar-SA')}`:'أعلى مستوى متاح'}</span>
        </div>
        <div className="mt-2 h-2 rounded-full overflow-hidden bg-white/10 ring-1 ring-white/5">
          <div className="h-full rounded-full transition-[width] duration-500" style={{width:`${progress}%`,background:`linear-gradient(90deg,${accent},#fbbf24,#fde68a)`}}/>
        </div>
      </div>}

      {relation.card?.name&&<div className="mt-2 text-center text-[10px] text-amber-200/90">بطاقة العلاقة: {relation.card.name}</div>}
    </div>
  </article>;
};

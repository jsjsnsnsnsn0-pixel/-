import {RelationshipCard,RelationshipDetails} from '../common/RelationshipCard';
import {validatedRoomPermissions,RoomUserPermissions} from '../../services/roomUserPermissions';
import {rpc} from '../../services/backend';
import {ProfileAvatarHeader} from '../common/ProfileAvatarHeader';
import {supabase} from '../../services/supabase';
import {profileToUser} from '../../services/profile';
import {useDismissableLayer} from '../../hooks/useDismissableLayer';
import React from 'react';
import {loadRoomPublicProfile, seatPublicProfile, RoomPublicProfile} from '../../services/roomPublicProfile';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import { ShimmeringAccountName } from '../common/ShimmeringAccountName';
import { RoyalAccountId } from '../common/RoyalAccountId';
import {X, Crown} from 'lucide-react';

interface RoomUserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMore?: () => void;
  onMention?: () => void;
  onMessage?: () => void;
  onGift?:()=>void;
  onManage?:()=>void;
  selfMicMuted?:boolean;onToggleSelfMic?:()=>void;onLeaveSelfSeat?:()=>void;
  targetUser?: User | null;
}

export const RoomUserProfileModal: React.FC<RoomUserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenMore,
  onMention,
  onMessage,
  onGift,
  onManage,
  targetUser,selfMicMuted,onToggleSelfMic,onLeaveSelfSeat,
}) => {
  const layerRef=useDismissableLayer(isOpen,onClose);

  const { user: currentUser, activeRoom, refreshRooms,reportError,setSelectedChatUser,setActiveSubScreen } = useApp();
  const [actionBusy,setActionBusy]=React.useState(false);
  const [permissions,setPermissions]=React.useState<RoomUserPermissions|null>(null);
  const [details,setDetails]=React.useState(false);
  const allowed=permissions&&permissions.room_id===activeRoom?.id&&String(permissions.subject_public_id)===targetUser?.id?permissions:null;
  const canManage=Boolean(allowed?.moderation.length);
  React.useEffect(()=>{
    if(!isOpen||!activeRoom||!targetUser){setPermissions(null);return}
    let cancelled=false;
    setPermissions(null);setDetails(false);
    const roomId=activeRoom.id,targetId=targetUser.id;
    const sync=async()=>{try{const value=await rpc('room_user_permissions',{p_room_id:roomId,p_public_id:Number(targetId)});if(!cancelled)setPermissions(validatedRoomPermissions(value,roomId,targetId))}catch{if(!cancelled)setPermissions(null)}};
    void sync();const timer=setInterval(()=>{if(document.visibilityState!=='hidden')void sync()},5000);
    window.addEventListener('focus',sync);
    return()=>{cancelled=true;clearInterval(timer);window.removeEventListener('focus',sync)};
  },[isOpen,activeRoom?.id,activeRoom?.canModerate,targetUser?.id,targetUser?.roomRole,currentUser.id]);
  const follow=async()=>{if(!targetUser||!allowed?.social.follow||actionBusy)return;setActionBusy(true);try{await rpc('social_action',{p_public_id:Number(targetUser.id),p_action:allowed.social.is_following?'unfollow':'follow'});setPermissions(old=>old?{...old,social:{...old.social,is_following:!old.social.is_following}}:null)}catch{reportError('تعذر تحديث المتابعة.')}finally{setActionBusy(false)}};
  const [banMinutes,setBanMinutes]=React.useState('60');
  const moderate=async(action:string)=>{if(!activeRoom||!targetUser||actionBusy||!allowed?.moderation.includes(action))return;setActionBusy(true);try{const {error}=await supabase.rpc('moderate_room_user',{p_room_id:activeRoom.id,p_public_id:Number(targetUser.id),p_action:action,...(action==='ban'?{p_duration_minutes:banMinutes==='forever'?null:Number(banMinutes)}:{})});if(error)throw error;await refreshRooms();if(action==='kick'||action==='ban'){onClose();return}const value=await rpc('room_user_permissions',{p_room_id:activeRoom.id,p_public_id:Number(targetUser.id)});setPermissions(validatedRoomPermissions(value,activeRoom.id,targetUser.id))}catch{reportError('تعذر تنفيذ الإجراء. تحقق من الصلاحية والاتصال.')}finally{setActionBusy(false)}};
  const [loaded, setLoaded] = React.useState<{target: string; viewer: string; profile: RoomPublicProfile} | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);
  React.useEffect(() => {
    let cancelled=false,request=0;
    setLoaded(null);setError(null);
    if(!isOpen||!targetUser){setLoading(false);return}
    if(!/^\d+$/.test(targetUser.id)){setLoading(false);setError('معرف المستخدم غير متاح؛ لا يمكن تحميل التفاصيل.');return}
    const target=targetUser.id,viewer=currentUser.id;
    const reload=async()=>{
      const run=++request;
      try{
        const profile=await loadRoomPublicProfile(target,viewer);
        if(!cancelled&&run===request){setLoaded({target,viewer,profile});setError(null)}
      }catch{
        if(!cancelled&&run===request){setLoaded(old=>old?{...old,profile:{...old.profile,couple:undefined}}:null);setError('تعذر تحميل تفاصيل المستخدم. بيانات المقعد فقط متاحة حالياً.')}
      }finally{if(!cancelled&&run===request)setLoading(false)}
    };
    const sync=()=>{if(document.visibilityState!=='hidden')void reload()};
    setLoading(true);void reload();
    const channel=supabase.channel(`profile-cp:${viewer}:${target}`).on('postgres_changes',{event:'*',schema:'public',table:'couples'},()=>{
      setLoaded(old=>old?{...old,profile:{...old.profile,couple:undefined}}:null);sync();
    }).subscribe();
    const timer=setInterval(sync,15000);
    window.addEventListener('focus',sync);document.addEventListener('visibilitychange',sync);
    return()=>{cancelled=true;clearInterval(timer);window.removeEventListener('focus',sync);document.removeEventListener('visibilitychange',sync);void supabase.removeChannel(channel)};
  },[isOpen,targetUser?.id,targetUser?.authId,currentUser.id,attempt]);

  if (!isOpen) return null;

  // There is no implicit current-user fallback, even on a failed lookup.
  const displayUser = loaded?.target === targetUser?.id && loaded?.viewer === currentUser.id
    ? loaded.profile : targetUser ? seatPublicProfile(targetUser) : null;
  if (!displayUser) return <div ref={layerRef} role="dialog" aria-label="بطاقة مستخدم الغرفة" className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center"><div className="w-full max-w-md ui-sheet rounded-t-3xl bg-[#131118] p-6 text-white text-center"><p>لا يوجد مستخدم محدد لعرضه.</p><button onClick={onClose} className="mt-3">إغلاق</button></div></div>;

  return (
    <div ref={layerRef} role="dialog" aria-modal="true" aria-label="بطاقة مستخدم الغرفة" className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-xs select-none animate-fadeIn">
      {/* Tap backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Bottom Sheet Container */}
      <div className="relative z-10 w-full max-w-md room-profile-sheet ui-sheet rounded-t-3xl pt-1 pb-safe pb-6 px-4 max-h-[90dvh] overflow-y-auto shadow-[0_-12px_40px_rgba(0,0,0,0.35)] border-t border-amber-500/20 text-center animate-slideUp">
        {/* Subtle drag handle / top glow line */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-2" />

        {/* Close Button top-left */}
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق البطاقة"
          className="absolute z-20 top-4 left-4 ui-icon-button rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* ========================================================= */}
        {/* 1. TOP WINGS & AVATAR (الأجنحة الذهبية المرصعة بالياقوت) */}
        {/* ========================================================= */}
        <ProfileAvatarHeader avatar={displayUser.avatar} name={displayUser.name}/>

        {/* ========================================================= */}
        {/* 2. USERNAME & BADGES                                      */}
        {/* ========================================================= */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap mt-0.5 min-w-0 break-words">
          {/* Agency Badge - only if user has agency */}
          {displayUser.agency?.name && (
            <div
              data-testid="profile-agency"
              className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#991b1b] to-[#dc2626] hover:from-[#b91c1c] hover:to-[#ef4444] border border-amber-400/70 flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-transform"
              title={`بيانات الوكالة: ${displayUser.agency?.name}`}
            >
              <span className="text-[10px] font-bold text-amber-200">
                {displayUser.agency?.name}
              </span>
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-[8px] font-black">
                👑
              </div>
            </div>
          )}

          {/* Gender Symbol */}
          {displayUser.gender && <div className={`w-4 h-4 rounded-full ${displayUser.gender === 'female' ? 'bg-[#ec4899]' : 'bg-[#0284c7]'} text-white flex items-center justify-center text-[9px] font-bold shadow-xs`}>
            {displayUser.gender === 'female' ? '♀' : '♂'}
          </div>}

          {/* Username: plain black if no VIP, radiant shimmer if VIP */}
          <ShimmeringAccountName tone="dark"
            name={displayUser.name || 'مستخدم جديد'}
            vipLevel={displayUser.vipLevel}
            size="lg"
            showSparkles={Boolean(displayUser.vipLevel && displayUser.vipLevel > 0)}
          />
        </div>

        {/* ========================================================= */}
        {/* 3. PUBLIC ID & VERIFIED COUNTRY                      */}
        {/* ========================================================= */}
        <div className="flex items-center justify-center gap-2 mt-1 text-xs text-slate-300">
          {/* Country Flag & Code */}
          {displayUser.countryCode && <div data-testid="profile-country" className="flex items-center gap-1 font-bold text-slate-300">
            <span>{displayUser.countryCode}</span>
            <span className="text-sm">{displayUser.countryFlag}</span>
          </div>}

          {displayUser.countryCode && displayUser.id && <span className="text-slate-600">|</span>}

          {/* Royal Account ID component */}
          {displayUser.id && <RoyalAccountId tone="dark"
            id={displayUser.id}
            vipLevel={displayUser.vipLevel}
            size="sm"
          />}

          {/* ID Badge Icon */}
          {displayUser.id && <span className="text-xs">🪪</span>}
        </div>

        {/* ========================================================= */}
        {/* 4. LEVEL BADGES (Charm | Wealth | VIP)                    */}
        {/* ========================================================= */}
        <div className="flex items-center justify-center gap-2 mt-2">
          {displayUser.level !== undefined && <div aria-label={`المستوى ${displayUser.level}`} className="px-2 py-0.5 rounded-full bg-blue-600 border border-blue-300/40 text-[11px] font-bold">LV.{displayUser.level}</div>}
          {/* Pink Charm Level Badge */}
          {displayUser.charmLevel !== undefined && <div aria-label={`مستوى السحر ${displayUser.charmLevel}`} className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#f43f5e] to-[#ec4899] border border-pink-300/40 flex items-center gap-1 shadow-[0_2px_8px_rgba(244,63,94,0.35)]">
            <span className="text-[9px]">💖</span>
            <span className="text-[11px] font-black text-white font-mono">
              {displayUser.charmLevel}
            </span>
          </div>}

          {/* Golden Wealth Level Badge */}
          {displayUser.wealthLevel !== undefined && <div aria-label={`مستوى الثروة ${displayUser.wealthLevel}`} className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#eab308] to-[#ca8a04] border border-yellow-200/50 flex items-center gap-1 shadow-[0_2px_8px_rgba(234,179,8,0.35)]">
            <span className="text-[9px]">🪙</span>
            <span className="text-[11px] font-black text-amber-950 font-mono">
              {displayUser.wealthLevel}
            </span>
          </div>}

          {/* VIP Badge */}
          {displayUser.vipLevel > 0 && <div data-testid="profile-vip" className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#78350f] via-[#b45309] to-[#78350f] border border-amber-400/70 flex items-center gap-1 shadow-[0_2px_8px_rgba(217,119,6,0.4)]">
            <Crown size={11} className="text-amber-300" />
            <span className="text-[11px] font-black text-amber-200 font-mono tracking-wider">
              VIP{displayUser.vipLevel}
            </span>
          </div>}
        </div>

        {displayUser.equipment?.badges&&<div className="mt-3 text-xs text-slate-200"><span className="inline-flex gap-2 px-3 py-2 rounded-xl bg-white/5">{displayUser.equipment.badges.icon} {displayUser.equipment.badges.name}</span></div>}
        {displayUser.couple && <><RelationshipCard compact subject={displayUser} relation={displayUser.couple} onDetails={()=>setDetails(v=>!v)} onPartner={partner=>{setSelectedChatUser(profileToUser({public_id:Number(partner.id),display_name:partner.name,avatar_url:partner.avatar}));onClose();setActiveSubScreen('user_detail_profile')}}/>{details&&<RelationshipDetails relation={displayUser.couple}/>}</>}
        {loading && <p role="status" className="mt-3 text-xs text-slate-300">جارٍ تحميل الملف العام…</p>}
        {error && <div role="alert" className="mt-3 text-xs text-slate-300"><p>{error}</p>{displayUser.id && <button onClick={() => setAttempt(n => n + 1)} className="mt-2 text-emerald-300">إعادة المحاولة</button>}</div>}

        <div className="grid grid-cols-2 gap-3 mt-5 text-white text-sm">
          {onMention&&allowed?.social.mention&&<button type="button" onClick={onMention} className="p-4 rounded-2xl bg-white/5">📣 منشن</button>}
          {onMessage&&allowed?.social.message&&<button type="button" onClick={onMessage} className="p-4 rounded-2xl bg-white/5">رسالة خاصة</button>}
          {onGift&&allowed?.social.gift&&<button type="button" onClick={onGift} className="p-4 rounded-2xl bg-white/5">🎁 إرسال هدية</button>}
          {allowed?.social.follow&&<button type="button" disabled={actionBusy} onClick={()=>void follow()} className="p-4 rounded-2xl bg-white/5">{allowed.social.is_following?'إلغاء المتابعة':'متابعة'}</button>}
        </div>
        {targetUser?.id===currentUser.id&&onToggleSelfMic&&activeRoom?.seats.some(seat=>seat.user?.id===currentUser.id)&&<section aria-label="مايك حسابي" className="grid grid-cols-2 gap-3 mt-3">
         <button type="button" onClick={onToggleSelfMic} className="p-3 rounded-2xl bg-white/5">{selfMicMuted?'فتح المايك':'كتم المايك'}</button>
         {onLeaveSelfSeat&&<button type="button" onClick={onLeaveSelfSeat} className="p-3 rounded-2xl bg-white/5">النزول من المايك</button>}
        </section>}
        {canManage&&<section aria-label="أدوات الإشراف" className="mt-4 border-t border-white/15 pt-3"><h2 className="text-xs text-slate-300 text-right mb-3">أدوات الإشراف</h2><div className="grid grid-cols-2 gap-3 text-sm">
          {allowed!.moderation.filter(a=>a!=='ban').map(action=><button key={action} type="button" disabled={actionBusy} onClick={()=>{if(action!=='kick'||window.confirm('طرد هذا المستخدم من الغرفة؟'))void moderate(action)}} className={`p-3 rounded-2xl bg-white/5 disabled:opacity-40 ${action==='kick'?'text-rose-300':''}`}>{({mute:'كتم الصوت',unmute:'فتح الصوت',down:'إنزال من المايك',raise:'الصعود إلى المايك',kick:'الطرد من الغرفة'} as Record<string,string>)[action]}</button>)}
          {allowed!.moderation.includes('ban')&&<div className="rounded-2xl p-2 bg-white/5"><select aria-label="مدة حظر المستخدم" value={banMinutes} onChange={event=>setBanMinutes(event.target.value)} className="bg-[#211b35] p-2 rounded-xl w-full"><option value="60">ساعة</option><option value="1440">يوم</option><option value="10080">أسبوع</option><option value="forever">دائم</option></select><button type="button" disabled={actionBusy} className="p-2 text-rose-300" onClick={()=>{if(window.confirm('حظر هذا المستخدم من الغرفة؟'))void moderate('ban')}}>حظر المستخدم</button></div>}
        </div></section>}
        {allowed?.manage_moderators&&onManage&&<button type="button" onClick={onManage} className="w-full mt-3 p-3 rounded-2xl bg-white/5 text-sm">إدارة المشرفين</button>}
        {allowed?.self&&activeRoom?.canModerate&&onManage&&<button type="button" onClick={onManage} className="w-full mt-3 p-3 rounded-2xl bg-white/5 text-sm">إدارة الغرفة</button>}
        <div>
        </div>
        {/* ========================================================= */}
        {/* 7. MINT GREEN ACTION BUTTON:  المزيد                      */}
        {/* ========================================================= */}
        <div className="mt-3.5 px-2">
          <button
            type="button"
            disabled={!displayUser.id || loading}
            onClick={() => {
              if (onOpenMore) {
                onOpenMore();
              } else {
                onClose();
              }
            }}
            className="w-full py-3 rounded-full bg-gradient-to-r from-[#2cdb7f] to-[#1ec76f] hover:from-[#25c672] hover:to-[#19b563] active:scale-[0.99] text-white font-black text-base shadow-[0_6px_20px_rgba(44,219,127,0.35)] transition-all cursor-pointer"
          >
            الملف الكامل
          </button>
        </div>
      </div>
    </div>
  );
};

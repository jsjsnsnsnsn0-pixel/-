import {supabase} from '../../services/supabase';
import {profileToUser} from '../../services/profile';
import {useDismissableLayer} from '../../hooks/useDismissableLayer';
import React from 'react';
import {defaultAvatar} from '../../services/profile';
import {loadRoomPublicProfile, seatPublicProfile, RoomPublicProfile} from '../../services/roomPublicProfile';
import {setImageFallback} from '../../utils/imageFallback';
import {rpc} from '../../services/backend';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import { ShimmeringAccountName } from '../common/ShimmeringAccountName';
import { RoyalAccountId } from '../common/RoyalAccountId';
import {X, Crown} from 'lucide-react';
import {RelationshipShowcaseCard} from '../common/RelationshipShowcaseCard';

interface RoomUserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMore?: () => void;
  onMention?: () => void;
  onMessage?: () => void;
  onGift?:()=>void;
  onManage?:()=>void;
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
  targetUser,
}) => {
  const layerRef=useDismissableLayer(isOpen,onClose);

  const { user: currentUser, activeRoom, refreshRooms,reportError,setSelectedChatUser,setActiveSubScreen } = useApp();
  const [actionBusy,setActionBusy]=React.useState(false);
  const targetSeat=activeRoom?.seats.find(seat=>seat.user?.id===targetUser?.id);
  type RoomUserPermissions = {
    social?: {follow?:boolean;message?:boolean;gift?:boolean;mention?:boolean;is_following?:boolean};
    moderation?: string[];
    manage_moderators?: boolean;
    self?: boolean;
  };
  const [permissions,setPermissions]=React.useState<RoomUserPermissions|null>(null);
  const moderation=permissions?.moderation || [];
  const canManage=moderation.length>0;
  const [banMinutes,setBanMinutes]=React.useState('60');
  const moderate=async(action:string)=>{if(!activeRoom||!targetUser||actionBusy||!moderation.includes(action))return;setActionBusy(true);try{const {error}=await supabase.rpc('moderate_room_user',{p_room_id:activeRoom.id,p_public_id:Number(targetUser.id),p_action:action,...(action==='ban'?{p_duration_minutes:banMinutes==='forever'?null:Number(banMinutes)}:{})});if(error)throw error;await refreshRooms();if(action==='kick'||action==='ban')onClose()}catch{reportError('تعذر تنفيذ الإجراء. تحقق من الصلاحية والاتصال.')}finally{setActionBusy(false)}};
  const toggleFollow=async()=>{if(!targetUser||actionBusy||!permissions?.social?.follow)return;setActionBusy(true);try{await rpc('social_action',{p_public_id:Number(targetUser.id),p_action:permissions.social.is_following?'unfollow':'follow'});setPermissions(previous=>previous?{...previous,social:{...previous.social,is_following:!previous.social?.is_following}}:previous);}catch{reportError('تعذر تحديث المتابعة. حاول مجدداً.')}finally{setActionBusy(false)}};
  const [loaded, setLoaded] = React.useState<{target: string; viewer: string; profile: RoomPublicProfile} | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);
  React.useEffect(() => {
    let cancelled = false;
    setLoaded(null); setPermissions(null); setError(null);
    if (!isOpen || !targetUser) {setLoading(false); return;}
    if (!/^\d+$/.test(targetUser.id)) {setLoading(false); setError('معرف المستخدم غير متاح؛ لا يمكن تحميل التفاصيل.'); return;}
    setLoading(true);
    void Promise.allSettled([
      loadRoomPublicProfile(targetUser.id, currentUser.id),
      activeRoom ? rpc<RoomUserPermissions>('room_user_permissions',{p_room_id:activeRoom.id,p_public_id:Number(targetUser.id)}) : Promise.resolve(null),
    ]).then(([profileResult,permissionsResult]) => {
      if (cancelled) return;
      if (profileResult.status==='fulfilled') setLoaded({target: targetUser.id, viewer: currentUser.id, profile:profileResult.value});
      else setError('تعذر تحميل تفاصيل المستخدم. بيانات المقعد فقط متاحة حالياً.');
      if (permissionsResult.status==='fulfilled') setPermissions(permissionsResult.value);
    }).finally(() => {if (!cancelled) setLoading(false);});
    return () => {cancelled = true;};
  }, [isOpen, targetUser?.id, targetUser?.authId, currentUser.id, activeRoom?.id, attempt]);
  if (!isOpen) return null;

  // There is no implicit current-user fallback, even on a failed lookup.
  const displayUser = loaded?.target === targetUser?.id && loaded?.viewer === currentUser.id
    ? loaded.profile : targetUser ? seatPublicProfile(targetUser) : null;
  if (!displayUser) return <div ref={layerRef} role="dialog" aria-label="بطاقة مستخدم الغرفة" className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center"><div className="w-full max-w-md ui-sheet rounded-t-3xl bg-[#131118] p-6 text-white text-center"><p>لا يوجد مستخدم محدد لعرضه.</p><button onClick={onClose} className="mt-3">إغلاق</button></div></div>;

  return (
    <div ref={layerRef} role="dialog" aria-modal="true" aria-label="بطاقة مستخدم الغرفة" className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-[3px] select-none animate-fadeIn">
      {/* Tap backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Bottom Sheet Container */}
      <div className="relative z-10 w-full max-w-md bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,.18),transparent_32%),linear-gradient(180deg,#15082b_0%,#100523_48%,#090416_100%)] ui-sheet rounded-t-[34px] pt-1 pb-safe pb-6 px-4 max-h-[90dvh] overflow-y-auto shadow-[0_-18px_54px_rgba(0,0,0,.78)] border border-white/8 text-center animate-slideUp">
        {/* Subtle drag handle / top glow line */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-2.5" />

        {/* Close Button top-left */}
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق البطاقة"
          className="absolute z-20 top-5 left-5 w-12 h-12 rounded-full bg-white/[0.08] border border-white/8 hover:bg-white/[0.13] flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
        >
          <X size={24} />
        </button>

        {/* ========================================================= */}
        {/* 1. TOP WINGS & AVATAR (الأجنحة الذهبية المرصعة بالياقوت) */}
        {/* ========================================================= */}
        <div className="relative flex justify-center items-center mt-2 mb-3">
          {/* Transparent decorative wings. Avoid raster backgrounds so every account
              keeps a clean avatar without a white rectangular plate. */}
          <div className="relative w-72 h-28 flex items-center justify-center bg-transparent isolate" data-testid="profile-avatar-frame">
            <span aria-hidden="true" className="absolute left-7 top-7 w-24 h-8 rounded-[70%_20%_65%_30%] bg-[linear-gradient(110deg,transparent_4%,rgba(251,191,36,.80)_38%,rgba(244,63,94,.72)_68%,rgba(255,255,255,.12)_100%)] -rotate-[16deg] shadow-[0_0_18px_rgba(245,158,11,.24)] opacity-95" />
            <span aria-hidden="true" className="absolute left-3 top-14 w-24 h-7 rounded-[70%_25%_70%_35%] bg-[linear-gradient(110deg,transparent_5%,rgba(168,85,247,.48)_32%,rgba(251,191,36,.70)_68%,rgba(244,63,94,.55)_100%)] rotate-[8deg] opacity-90" />
            <span aria-hidden="true" className="absolute right-7 top-7 w-24 h-8 rounded-[20%_70%_30%_65%] bg-[linear-gradient(250deg,transparent_4%,rgba(251,191,36,.80)_38%,rgba(244,63,94,.72)_68%,rgba(255,255,255,.12)_100%)] rotate-[16deg] shadow-[0_0_18px_rgba(245,158,11,.24)] opacity-95" />
            <span aria-hidden="true" className="absolute right-3 top-14 w-24 h-7 rounded-[25%_70%_35%_70%] bg-[linear-gradient(250deg,transparent_5%,rgba(168,85,247,.48)_32%,rgba(251,191,36,.70)_68%,rgba(244,63,94,.55)_100%)] -rotate-[8deg] opacity-90" />

            {/* Circular Avatar in the Center */}
            <div className="absolute w-[76px] h-[76px] rounded-full border-[3px] border-amber-200/90 shadow-[0_0_0_4px_rgba(124,58,237,.20),0_0_22px_rgba(251,191,36,.32)] overflow-hidden bg-transparent flex items-center justify-center z-10">
              <img
                src={displayUser.avatar}
                onError={e => {e.currentTarget.alt = 'صورة افتراضية'; setImageFallback(e, defaultAvatar);}}
                alt={displayUser.avatar === defaultAvatar ? 'صورة افتراضية' : displayUser.name}
                className="w-full h-full object-cover object-center bg-transparent"
              />
            </div>
          </div>
        </div>

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

        {displayUser.couple&&<div data-testid="profile-couple" className="mt-3">
          <RelationshipShowcaseCard
            compact
            owner={{name:displayUser.name,avatar:displayUser.avatar,level:displayUser.level}}
            relation={displayUser.couple}
            onPartner={()=>{const partner=displayUser.couple!.partner;setSelectedChatUser(profileToUser({public_id:Number(partner.id),display_name:partner.name,avatar_url:partner.avatar}));onClose();setActiveSubScreen('user_detail_profile');}}
          />
        </div>}
        {loading && <p role="status" className="mt-3 text-xs text-slate-300">جارٍ تحميل الملف العام…</p>}
        {error && <div role="alert" className="mt-3 text-xs text-slate-300"><p>{error}</p>{displayUser.id && <button onClick={() => setAttempt(n => n + 1)} className="mt-2 text-emerald-300">إعادة المحاولة</button>}</div>}

        <div className="grid grid-cols-2 gap-3 mt-5 text-white text-sm">
          {permissions?.social?.follow&&<button type="button" disabled={actionBusy} onClick={()=>void toggleFollow()} className="min-h-24 p-4 rounded-[20px] bg-white/[0.055] border border-white/[0.055] disabled:opacity-40 active:scale-[0.99] transition-transform">{permissions.social.is_following?'إلغاء المتابعة':'متابعة'}</button>}
          {onMention&&permissions?.social?.mention!==false&&<button type="button" onClick={onMention} className="min-h-24 p-4 rounded-[20px] bg-white/[0.055] border border-white/[0.055] active:scale-[0.99] transition-transform">📣 منشن</button>}
          {onMessage&&permissions?.social?.message!==false&&!permissions?.self&&<button type="button" onClick={onMessage} className="min-h-24 p-4 rounded-[20px] bg-white/[0.055] border border-white/[0.055] active:scale-[0.99] transition-transform">رسالة خاصة</button>}
          {onGift&&permissions?.social?.gift!==false&&<button type="button" onClick={onGift} className="min-h-24 p-4 rounded-[20px] bg-white/[0.055] border border-white/[0.055] active:scale-[0.99] transition-transform">🎁 إرسال هدية</button>}
          {canManage&&<>
            {targetSeat&&moderation.includes(targetSeat.isMuted?'unmute':'mute')&&<button type="button" disabled={actionBusy} onClick={()=>void moderate(targetSeat.isMuted?'unmute':'mute')} className="min-h-24 p-4 rounded-[20px] bg-white/[0.055] border border-white/[0.055] disabled:opacity-40 active:scale-[0.99] transition-transform">{targetSeat.isMuted?'فتح الصوت':'كتم الصوت'}</button>}
            {moderation.includes(targetSeat?'down':'raise')&&<button type="button" disabled={actionBusy} onClick={()=>void moderate(targetSeat?'down':'raise')} className="min-h-24 p-4 rounded-[20px] bg-white/[0.055] border border-white/[0.055] disabled:opacity-40 active:scale-[0.99] transition-transform">{targetSeat?'النزول من المايك':'الصعود إلى المايك'}</button>}
            {moderation.includes('kick')&&<button type="button" disabled={actionBusy} onClick={()=>{if(window.confirm('طرد هذا المستخدم من الغرفة؟'))void moderate('kick')}} className="min-h-24 p-4 rounded-[20px] bg-white/[0.055] border border-rose-300/10 text-rose-300 disabled:opacity-40 active:scale-[0.99] transition-transform">الطرد من الغرفة</button>}
            {moderation.includes('ban')&&<div className="rounded-[20px] p-2 bg-white/[0.055] border border-white/[0.055]"><select aria-label="مدة حظر المستخدم" value={banMinutes} onChange={event=>setBanMinutes(event.target.value)} className="bg-[#211b35] p-2 rounded-xl w-full"><option value="60">ساعة</option><option value="1440">يوم</option><option value="10080">أسبوع</option><option value="forever">دائم</option></select><button type="button" disabled={actionBusy} className="p-2 text-rose-300 disabled:opacity-40" onClick={()=>{if(window.confirm('إضافة المستخدم إلى القائمة السوداء؟'))void moderate('ban')}}>حظر المستخدم</button></div>}
          </>}
          {permissions?.manage_moderators&&onManage&&<button type="button" onClick={onManage} className="min-h-24 p-4 rounded-[20px] bg-white/[0.055] border border-white/[0.055] active:scale-[0.99] transition-transform">إدارة المشرفين</button>}

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
            المزيد
          </button>
        </div>
      </div>
    </div>
  );
};

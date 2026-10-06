import {useDismissableLayer} from '../../hooks/useDismissableLayer';
import { catalog, rpc, backendMessage } from '../../services/backend';
import { useServerData } from '../../hooks/useServerData';
import { useTimeouts } from '../../hooks/useTimeouts';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChevronRight,
  Crown,
  Layers,
  Car,
  Volume2,
  X,
  Sparkles,
} from 'lucide-react';
import { VIPBadge } from '../common/VIPBadge';

export interface VIPTierData {
  id: number;
  name: string;
  crest: string;
  badgeImage: string;
  animalName: string;
  price: string;
  priceNumber: number;
  bgGradient: string;
  textColor: string;
  pillActiveClass: string;
  accentColor: string;
  headwearTitle: string;
  entryTitle: string;
  isDarkCard?: boolean;
  hasVehicle?: boolean;
  vehicleImage?: string;
  vehicleName?: string;
  daysRemaining?: number;
}

export const VIP_TIERS_CONFIG: VIPTierData[] = [
  {
    id: 1,
    name: 'VIP 1',
    crest: '/assets/images/vip1_deer_crest_1790429421188.jpg',
    badgeImage: '/assets/images/vip1_badge_exact_1790431462534.jpg',
    animalName: 'الوعل الملكي البرونزي',
    price: '63000/30 يومًا',
    priceNumber: 63000,
    bgGradient: 'from-[#fae8dc] via-[#f7dfd0] to-[#f4d5c3]',
    textColor: 'text-[#92400e]',
    pillActiveClass: 'bg-white text-slate-900 shadow-md ring-2 ring-amber-400/50',
    accentColor: '#d97706',
    headwearTitle: 'غطاء رأس الوعل البرونزي',
    entryTitle: 'تأثير دخول الوعل البرونزي VIP 1',
    hasVehicle: false,
  },
  {
    id: 2,
    name: 'VIP 2',
    crest: '/assets/images/vip2_eagle_crest_1790429432365.jpg',
    badgeImage: '/assets/images/vip2_badge_exact_1790431474894.jpg',
    animalName: 'الصقر البلاتيني الثلجي',
    price: '150000/30 يومًا',
    priceNumber: 150000,
    bgGradient: 'from-[#dbeafe] via-[#bfdbfe] to-[#93c5fd]',
    textColor: 'text-[#1e3a8a]',
    pillActiveClass: 'bg-white text-[#1e3a8a] shadow-md ring-2 ring-sky-400/50',
    accentColor: '#38bdf8',
    headwearTitle: 'غطاء رأس الصقر البلاتيني الثلجي',
    entryTitle: 'تأثير دخول الصقر الجليدي VIP 2',
    hasVehicle: false,
  },
  {
    id: 3,
    name: 'VIP 3',
    crest: '/assets/images/vip3_wolf_crest_1790429444252.jpg',
    badgeImage: '/assets/images/vip3_badge_exact_1790431487197.jpg',
    animalName: 'الذئب الذهبي الملكي',
    price: '490000/30 يومًا',
    priceNumber: 490000,
    bgGradient: 'from-[#fef3c7] via-[#fde68a] to-[#fcd34d]',
    textColor: 'text-[#854d0e]',
    pillActiveClass: 'bg-[#fef08a] text-amber-950 font-bold shadow-md ring-2 ring-amber-400',
    accentColor: '#eab308',
    headwearTitle: 'غطاء رأس الذئب الذهبي الملكي',
    entryTitle: 'تأثير دخول الذئب الإمبراطوري VIP 3',
    hasVehicle: false,
    daysRemaining: 1,
  },
  {
    id: 4,
    name: 'VIP 4',
    crest: '/assets/images/vip4_leopard_crest_1790429455499.jpg',
    badgeImage: '/assets/images/vip4_badge_exact_1790431500433.jpg',
    animalName: 'الفهد الزمردي الأسطوري',
    price: '1960000/30 يومًا',
    priceNumber: 1960000,
    bgGradient: 'from-[#ccfbf1] via-[#99f6e4] to-[#5eead4]',
    textColor: 'text-[#115e59]',
    pillActiveClass: 'bg-[#99f6e4] text-teal-950 font-bold shadow-md ring-2 ring-teal-400',
    accentColor: '#14b8a6',
    headwearTitle: 'غطاء رأس الفهد الزمردي الخارق',
    entryTitle: 'تأثير دخول الفهد الزمردي VIP 4',
    hasVehicle: false,
  },
  {
    id: 5,
    name: 'VIP 5',
    crest: '/assets/images/vip5_bear_crest_1790429475162.jpg',
    badgeImage: '/assets/images/vip5_badge_exact_1790431518416.jpg',
    animalName: 'الدب الأرجواني المتوج',
    price: '3900000/30 يومًا',
    priceNumber: 3900000,
    bgGradient: 'from-[#f3e8ff] via-[#e9d5ff] to-[#d8b4fe]',
    textColor: 'text-[#581c87]',
    pillActiveClass: 'bg-[#e9d5ff] text-purple-950 font-bold shadow-md ring-2 ring-purple-400',
    accentColor: '#a855f7',
    headwearTitle: 'غطاء رأس الدب الأرجواني المتوج',
    entryTitle: 'تأثير دخول الدب الملكي VIP 5',
    hasVehicle: false,
    daysRemaining: 9,
  },
  {
    id: 6,
    name: 'VIP 6',
    crest: '/assets/images/vip6_tiger_crest_1790429485886.jpg',
    badgeImage: '/assets/images/vip6_badge_exact_1790431528932.jpg',
    animalName: 'النمر الأزرق الملكي المجنح',
    price: '5800000/30 يومًا',
    priceNumber: 5800000,
    bgGradient: 'from-[#cffafe] via-[#bae6fd] to-[#7dd3fc]',
    textColor: 'text-[#075985]',
    pillActiveClass: 'bg-[#bae6fd] text-sky-950 font-bold shadow-md ring-2 ring-sky-400',
    accentColor: '#0284c7',
    headwearTitle: 'غطاء رأس النمر الياقوتي الأزرق',
    entryTitle: 'تأثير دخول النمر الأزرق الملكي VIP 6',
    hasVehicle: false,
  },
  {
    id: 7,
    name: 'VIP 7',
    crest: '/assets/images/vip7_phoenix_crest_1790429497956.jpg',
    badgeImage: '/assets/images/vip7_badge_exact_1790431539570.jpg',
    animalName: 'طائر الفينيق الوردي الناري',
    price: '8300000/30 يومًا',
    priceNumber: 8300000,
    bgGradient: 'from-[#ffe4e6] via-[#fecdd3] to-[#fda4af]',
    textColor: 'text-[#9f1239]',
    pillActiveClass: 'bg-[#fecdd3] text-rose-950 font-bold shadow-md ring-2 ring-rose-400',
    accentColor: '#f43f5e',
    headwearTitle: 'غطاء رأس الفينيق الوردي الناري',
    entryTitle: 'تأثير دخول طائر الفينيق اللهبي VIP 7',
    hasVehicle: true,
    vehicleImage: '/assets/images/vip7_phoenix_vehicle_1790429537754.jpg',
    vehicleName: 'طائر الفينيق الناري VIP',
  },
  {
    id: 8,
    name: 'VIP 8',
    crest: '/assets/images/vip8_lion_crest_1790429509482.jpg',
    badgeImage: '/assets/images/vip8_badge_exact_1790431550754.jpg',
    animalName: 'الأسد الإمبراطوري المتوج بالذهب',
    price: '12000000/30 يومًا',
    priceNumber: 12000000,
    bgGradient: 'from-[#1c1917] via-[#09090b] to-[#1c1917]',
    textColor: 'text-[#fef08a]',
    isDarkCard: true,
    pillActiveClass: 'bg-[#fef3c7] text-amber-950 font-black shadow-lg ring-2 ring-amber-400',
    accentColor: '#f59e0b',
    headwearTitle: 'تاج الأسد الملكي بالبرق والذهب',
    entryTitle: 'تأثير دخول الأسد الإمبراطوري VIP 8',
    hasVehicle: true,
    vehicleImage: '/assets/images/vip8_lion_vehicle_1790429549220.jpg',
    vehicleName: 'الأسد المجنح الخارق VIP',
  },
];

interface PreviewModalState {
  title: string;
  description: string;
  type: 'badge' | 'frame' | 'vehicle' | 'entry' | 'mic';
  tier: VIPTierData;
}

export const VIPScreen: React.FC = () => {
  const { user, refreshWallet, reportError, setActiveSubScreen } = useApp();

  // Selected tier (Default to user's active tier or VIP 1)
  const scheduleTimeout = useTimeouts();
  const [selectedTierId, setSelectedTierId] = useState<number>(() => user.vipLevel || 8);
  const [previewModal, setPreviewModal] = useState<PreviewModalState | null>(null);
  const previewRef=useDismissableLayer(Boolean(previewModal),()=>setPreviewModal(null));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Preload all assets in background on mount for instantaneous rendering
  useEffect(() => {
    VIP_TIERS_CONFIG.forEach((t) => {
      const img1 = new Image();
      img1.src = t.crest;
      if (t.vehicleImage) {
        const img2 = new Image();
        img2.src = t.vehicleImage;
      }
    });
  }, []);

  // Instant memoized tier lookup
  const currentTier = useMemo(
    () => VIP_TIERS_CONFIG.find((t) => t.id === selectedTierId) || VIP_TIERS_CONFIG[7],
    [selectedTierId]
  );

  const isUserActiveLevel = user.vipLevel === currentTier.id;
  const isRenewable = Boolean(user.vipExpiresAt) && isUserActiveLevel;
  const daysRemaining = user.vipExpiresAt ? Math.max(0, Math.ceil((new Date(user.vipExpiresAt).getTime() - Date.now()) / 86400000)) : null;
  const load = useCallback(catalog, []);
  const {data: products, loading, error, reload} = useServerData(load, []);
  const product = products.find(item => item.category === 'vip' && item.vip_level === currentTier.id);
  const [busy, setBusy] = useState(false);
  const requests = useRef(new Map<string, string>());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    scheduleTimeout(() => setToastMessage(null), 3000);
  };

  const handleAction = async () => {
    if (!product || busy) return;
    setBusy(true);
    try {
      const request = requests.current.get(product.id) || crypto.randomUUID();
      requests.current.set(product.id, request);
      const result = await rpc<{id: string}>('purchase_store_item', {p_item_id: product.id, p_request_id: request});
      if (!result?.id) throw new Error('purchase not confirmed');
      requests.current.delete(product.id);
      showToast('تم اعتماد اشتراك VIP من الخادم.');
      await refreshWallet();
    } catch (e) { reportError(backendMessage(e)); }
    finally { setBusy(false); }
  };

  // Quick helper to open modal locked to this tier
  const openPrivilege = (
    type: 'badge' | 'frame' | 'vehicle' | 'entry' | 'mic',
    title: string,
    description: string
  ) => {
    setPreviewModal({
      type,
      title,
      description,
      tier: currentTier, // Locked to current tier snapshot
    });
  };

  // Horizontal list of tiers in standard Arabic RTL order (VIP 8 -> VIP 1)
  const tierTabs = useMemo(() => [8, 7, 6, 5, 4, 3, 2, 1], []);

  return (
    <div className="min-h-screen bg-[#07080f] text-slate-100 pb-28 select-none font-sans relative overflow-x-hidden">
      {error && <button onClick={() => void reload()} className="p-3">{error} — إعادة المحاولة</button>}
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 inset-x-4 z-50 flex items-center justify-center pointer-events-none">
          <div className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs shadow-xl border border-amber-300 flex items-center gap-2">
            <Sparkles size={14} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 1. TOP HEADER */}
      <header className="px-4 py-3.5 flex items-center justify-between z-20">
        <button
          onClick={() => setActiveSubScreen(null)}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 cursor-pointer active:scale-95 transition-transform"
          title="رجوع"
        >
          <ChevronRight size={22} className="stroke-[2.5]" />
        </button>

        <h1 className="text-base font-bold text-slate-100 tracking-wider">
          VIP
        </h1>

        <div className="w-8" />
      </header>

      {/* 2. HORIZONTAL VIP SELECTOR PILLS: VIP8 -> VIP1 */}
      <div className="px-3 pt-1 pb-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max justify-end">
          {tierTabs.map((tId) => {
            const tierData = VIP_TIERS_CONFIG.find((t) => t.id === tId)!;
            const isSelected = tierData.id === selectedTierId;
            return (
              <button
                key={tierData.id}
                onClick={() => setSelectedTierId(tierData.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                  isSelected
                    ? `${tierData.pillActiveClass} scale-105`
                    : 'bg-white/10 hover:bg-white/15 text-slate-300 active:scale-95'
                }`}
              >
                {tierData.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN SIGNATURE VIP BANNER CARD */}
      <div className="px-4 pt-1">
        <div
          key={currentTier.id}
          className={`relative w-full rounded-[26px] p-5 shadow-2xl overflow-hidden transition-all duration-200 ${
            currentTier.isDarkCard
              ? 'bg-gradient-to-b from-[#18181b] via-[#09090b] to-[#18181b] border-2 border-amber-400/90 shadow-[0_12px_36px_rgba(245,158,11,0.2)]'
              : `bg-gradient-to-r ${currentTier.bgGradient} border border-white/60 shadow-[0_10px_30px_rgba(0,0,0,0.3)]`
          }`}
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 75px 100%, 0 calc(100% - 50px))',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent_60%)] pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            {/* Left side: Animal Emblem Badge with rounded clipping */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 relative shrink-0 rounded-full overflow-hidden shadow-lg border-2 border-white/30 bg-black/10">
              <img
                src={currentTier.crest}
                alt={currentTier.name}
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover transform -scale-x-100"
              />
            </div>

            {/* Right side: VIP Name & Status */}
            <div className="text-right flex flex-col items-end">
              <h2
                className={`text-2xl sm:text-3xl font-black italic tracking-wide ${
                  currentTier.isDarkCard
                    ? 'text-amber-300 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]'
                    : currentTier.textColor
                }`}
              >
                {currentTier.name}
              </h2>

              <span
                className={`text-xs mt-1 font-bold ${
                  currentTier.isDarkCard
                    ? 'text-slate-400'
                    : isUserActiveLevel
                    ? 'text-emerald-800'
                    : 'text-slate-600'
                }`}
              >
                {isUserActiveLevel
                  ? daysRemaining
                    ? `المتبقي ${daysRemaining} يوم`
                    : 'نشط حالياً'
                  : 'مقفل'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SECTION HEADER: ─── امتيازات VIP ─── */}
      <div className="px-6 my-5 flex items-center justify-center gap-3">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        <span className="text-xs font-bold text-amber-200 tracking-wider">
          امتيازات VIP
        </span>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      </div>

      {/* 5. PRIVILEGES LIST (Specific to each tier) */}
      <div className="px-4 space-y-3">
        {/* PRIVILEGE 1: شارة VIP */}
        <div
          onClick={() =>
            openPrivilege(
              'badge',
              `شارة ${currentTier.name}`,
              `شارة حصرية مخصصة لأعضاء ${currentTier.name} تظهر بجانب اسمك أينما ذهبت داخل الغرف والملف الشخصي.`
            )
          }
          className="w-full p-4 rounded-2xl bg-[#14151f] hover:bg-[#1a1c2b] border border-white/5 flex items-center justify-between cursor-pointer transition-colors active:scale-[0.99]"
        >
          {/* Left Preview: The tier's exact badge */}
          <div className="flex items-center">
            <VIPBadge level={currentTier.id} size="md" />
          </div>

          {/* Right Info */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm font-bold text-slate-100">شارة VIP</span>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shadow-xs"
                style={{ backgroundColor: `${currentTier.accentColor}25`, color: currentTier.accentColor }}
              >
                <Crown size={12} />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              شارة حصرية للأعضاء فقط
            </p>
          </div>
        </div>

        {/* PRIVILEGE 2: أغطية الرأس */}
        <div
          onClick={() =>
            openPrivilege(
              'frame',
              currentTier.headwearTitle,
              `إطار رأس وأغطية خاصة بـ ${currentTier.name} تمنح صورتك الشخصية توهجاً ملكياً مستمراً.`
            )
          }
          className="w-full p-4 rounded-2xl bg-[#14151f] hover:bg-[#1a1c2b] border border-white/5 flex items-center justify-between cursor-pointer transition-colors active:scale-[0.99]"
        >
          {/* Left Preview: Avatar frame decorated with this tier's accent */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div
              className="w-10 h-10 rounded-full border-2 overflow-hidden shadow-md flex items-center justify-center ring-2 ring-white/10"
              style={{ borderColor: currentTier.accentColor }}
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className="absolute -bottom-1 px-1.5 py-0.2 rounded-full text-[8px] font-black text-black shadow-xs"
              style={{ backgroundColor: currentTier.accentColor }}
            >
              {currentTier.name.replace(' ', '')}
            </span>
          </div>

          {/* Right Info */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm font-bold text-slate-100">أغطية الرأس</span>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shadow-xs"
                style={{ backgroundColor: `${currentTier.accentColor}25`, color: currentTier.accentColor }}
              >
                <Crown size={12} />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              أغطية الرأس الحصرية VIP
            </p>
          </div>
        </div>

        {/* PRIVILEGE 3: سيارة VIP (Exclusively for VIP 7 & 8) */}
        {currentTier.hasVehicle && (
          <div
            onClick={() =>
              openPrivilege(
                'vehicle',
                currentTier.vehicleName || 'مركبة VIP الحصرية',
                `مركبة فارهة حصرية تظهر مع مؤثرات دخول أسطورية في غرف المحادثة خاصة بـ ${currentTier.name}.`
              )
            }
            className="w-full p-4 rounded-2xl bg-[#14151f] hover:bg-[#1a1c2b] border border-white/5 flex items-center justify-between cursor-pointer transition-colors active:scale-[0.99]"
          >
            {/* Left Preview: Vehicle image */}
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-400/40 shadow-sm shrink-0 bg-black/40">
              <img
                src={currentTier.vehicleImage}
                alt={currentTier.vehicleName}
                loading="eager"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right Info */}
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-bold text-rose-400">سيارة VIP</span>
                <Car size={16} className="text-rose-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                سيارة VIP حصرية
              </p>
            </div>
          </div>
        )}

        {/* PRIVILEGE 4: تأثير الدخول */}
        <div
          onClick={() =>
            openPrivilege(
              'entry',
              currentTier.entryTitle,
              `شريط دخول ملكي فاخر يعلن حضورك الفخم فور انضمامك لأي غرفة بالنمط الخاص بـ ${currentTier.name}.`
            )
          }
          className="w-full p-4 rounded-2xl bg-[#14151f] hover:bg-[#1a1c2b] border border-white/5 flex items-center justify-between cursor-pointer transition-colors active:scale-[0.99]"
        >
          {/* Left Preview: Tier-specific banner strips */}
          <div className="w-16 space-y-1">
            <div
              className="h-2 rounded-full opacity-90 shadow-xs"
              style={{ backgroundColor: currentTier.accentColor }}
            />
            <div
              className="h-2 rounded-full opacity-60 w-3/4 mr-auto"
              style={{ backgroundColor: currentTier.accentColor }}
            />
          </div>

          {/* Right Info */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm font-bold text-slate-100">تأثير الدخول</span>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shadow-xs"
                style={{ backgroundColor: `${currentTier.accentColor}25`, color: currentTier.accentColor }}
              >
                <Layers size={12} />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              تأثير الدخول الحصري VIP
            </p>
          </div>
        </div>

        {/* PRIVILEGE 5: موجة صوت الميكروفون */}
        <div
          onClick={() =>
            openPrivilege(
              'mic',
              `موجة صوت الميكروفون ${currentTier.name}`,
              `حلقات وأمواج صوتية حصرية تشع حول مقعدك على المايك بنمط ${currentTier.name} تعكس رتبتك الملكية.`
            )
          }
          className="w-full p-4 rounded-2xl bg-[#14151f] hover:bg-[#1a1c2b] border border-white/5 flex items-center justify-between cursor-pointer transition-colors active:scale-[0.99]"
        >
          {/* Left Preview: User's Account Picture with pulsing rings in this tier's color */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-35"
              style={{ backgroundColor: currentTier.accentColor }}
            />
            <div
              className="w-9 h-9 rounded-full border-2 flex items-center justify-center overflow-hidden z-10 shadow-md ring-2 ring-white/10 bg-slate-900"
              style={{ borderColor: currentTier.accentColor }}
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Green glowing mic indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border border-slate-900 flex items-center justify-center text-[7px] text-white z-20 shadow-xs">
              🎙️
            </span>
          </div>

          {/* Right Info */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm font-bold text-slate-100">
                موجة صوت الميكروفون
              </span>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shadow-xs"
                style={{ backgroundColor: `${currentTier.accentColor}25`, color: currentTier.accentColor }}
              >
                <Volume2 size={12} />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              نمط موجة صوت الميكروفون الخاص بكبار الشخصيات
            </p>
          </div>
        </div>
      </div>

      {/* 6. BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 inset-x-0 pb-safe bg-[#0a0b14]/95 backdrop-blur-md border-t border-white/10 px-5 py-3.5 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          {/* Action Button: شراء or تجديد */}
          <button
            disabled={busy || loading || !product || (user.vipLevel > currentTier.id)}
            onClick={() => void handleAction()}
            className="flex-1 py-3 px-6 rounded-full bg-gradient-to-r from-[#ffe59e] via-[#ffd25d] to-[#d49924] hover:brightness-105 active:scale-95 text-slate-950 font-black text-sm shadow-[0_4px_18px_rgba(234,179,8,0.35)] cursor-pointer transition-all border border-amber-200"
          >
            {isRenewable ? 'تجديد' : 'شراء'}
          </button>

          {/* Price & Gold Coin indicator */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-white tracking-tight" dir="ltr">
              {product ? `${product.price.toLocaleString('ar-SA')} / ${product.duration_days ?? 'دائم'} يوم` : 'غير متاح حالياً'}
            </span>
            <div className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-[10px] shadow-xs">
              🟡
            </div>
          </div>
        </div>
      </div>

      {/* 7. PREVIEW MODAL POPUP (Locked to the clicked tier) */}
      {previewModal && (
        <div ref={previewRef} role="dialog" aria-modal="true" aria-label="معاينة VIP" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-[#141523] border border-amber-500/40 p-5 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <button
                onClick={() => setPreviewModal(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer active:scale-90"
              >
                <X size={16} />
              </button>
              <h3 className="text-sm font-bold text-amber-300">
                {previewModal.title}
              </h3>
            </div>

            <div className="py-6 flex flex-col items-center justify-center text-center">
              {/* Badge Preview */}
              {previewModal.type === 'badge' && (
                <div className="py-4 flex flex-col items-center justify-center gap-3">
                  <div className="scale-125">
                    <VIPBadge level={previewModal.tier.id} size="lg" />
                  </div>
                </div>
              )}

              {/* Headwear Preview */}
              {previewModal.type === 'frame' && (
                <div
                  className="w-24 h-24 rounded-full border-4 overflow-hidden p-1 shadow-2xl relative"
                  style={{ borderColor: previewModal.tier.accentColor }}
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                  <span
                    className="absolute bottom-0 inset-x-2 py-0.5 rounded-full text-[9px] font-black text-black text-center shadow-md"
                    style={{ backgroundColor: previewModal.tier.accentColor }}
                  >
                    {previewModal.tier.name}
                  </span>
                </div>
              )}

              {/* Vehicle Preview */}
              {previewModal.type === 'vehicle' && previewModal.tier.vehicleImage && (
                <div className="w-44 h-32 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-2xl bg-black">
                  <img
                    src={previewModal.tier.vehicleImage}
                    alt={previewModal.tier.vehicleName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Entry Preview */}
              {previewModal.type === 'entry' && (
                <div className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-amber-400/60 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">
                      دخل {previewModal.tier.name} {user.name} إلى الروم 👑
                    </span>
                    <VIPBadge level={previewModal.tier.id} size="sm" />
                  </div>
                </div>
              )}

              {/* Mic Wave Preview with User Avatar */}
              {previewModal.type === 'mic' && (
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-35"
                    style={{ backgroundColor: previewModal.tier.accentColor }}
                  />
                  <div
                    className="w-14 h-14 rounded-full border-2 flex items-center justify-center overflow-hidden z-10 shadow-lg"
                    style={{ borderColor: previewModal.tier.accentColor }}
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white z-20 shadow-md">
                    🎙️
                  </span>
                </div>
              )}

              <p className="text-xs text-slate-300 mt-4 leading-relaxed px-2">
                {previewModal.description}
              </p>
            </div>

            <button
              onClick={() => setPreviewModal(null)}
              className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer transition-colors active:scale-95"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

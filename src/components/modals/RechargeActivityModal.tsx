import { useTimeouts } from '../../hooks/useTimeouts';
import React, { useState, useEffect } from 'react';
import { readStoredArray } from '../../utils/storage';
import {
  X,
  HelpCircle,
  Coins,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Crown,
  CheckCircle2,
  Gift,
  Shield,
  Car,
  Award,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  triggerRechargeTierNotification,
  triggerCustomGiftNotification,
} from '../../services/systemNotificationService';

interface RechargeActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface RechargeItemReward {
  id: string;
  name: string;
  type: 'vip' | 'frame' | 'vehicle' | 'id' | 'coins' | 'gift' | 'banner' | 'intro';
  duration: string;
  vipLevel?: number;
  coins?: number;
  specialId?: string;
  frameUrl?: string;
  vehicleName?: string;
  icon: string;
  tag: string;
  claimed?: boolean;
}

export interface ActivityTierData {
  id: string;
  amount: number;
  label: string;
  coinsReward: number;
  vipLevelReward: number;
  specialIdReward?: string;
  frameReward?: string;
  vehicleReward?: string;
  titleReward?: string;
  items: RechargeItemReward[];
  winners: {
    rank: number;
    name: string;
    avatar: string;
    badge?: string;
  }[];
}

export const OFFICIAL_ACTIVITY_TIERS: ActivityTierData[] = [
  {
    id: 'tier_9_9',
    amount: 9.9,
    label: 'إعادة شحن 9.9 دولارًا',
    coinsReward: 50000,
    vipLevelReward: 1,
    frameReward: 'إطار ناري ملكي (7 أيام)',
    items: [
      {
        id: 'vip1_3d',
        name: 'اشتراك VIP1 ملكي',
        type: 'vip',
        duration: '3 يوم',
        vipLevel: 1,
        icon: '👑',
        tag: 'VIP1',
      },
      {
        id: 'fire_frame_7d',
        name: 'إطار الأفاتار الناري الملكي',
        type: 'frame',
        duration: '7 يوم',
        icon: '🔥',
        tag: 'إطار ناري',
      },
    ],
    winners: [
      { rank: 1, name: 'وجدان', avatar: '/src/assets/images/female_luxury_avatar_1790230899789.jpg' },
      { rank: 2, name: 'E AJANS', avatar: '/src/assets/images/male_partner_avatar_1790230886065.jpg' },
      { rank: 3, name: 'لار', avatar: '/src/assets/images/syrian_host_avatar_1790345251849.jpg' },
    ],
  },
  {
    id: 'tier_49_9',
    amount: 49.9,
    label: 'إعادة شحن 49.9 دولارًا',
    coinsReward: 250000,
    vipLevelReward: 2,
    frameReward: 'إطار الياقوت الأزرق (15 يوم)',
    items: [
      {
        id: 'vip2_7d',
        name: 'اشتراك VIP2 الإمبراطوري',
        type: 'vip',
        duration: '7 يوم',
        vipLevel: 2,
        icon: '👑',
        tag: 'VIP2',
      },
      {
        id: 'sapphire_frame_15d',
        name: 'إطار الياقوت الأزرق المشع',
        type: 'frame',
        duration: '15 يوم',
        icon: '💎',
        tag: 'إطار الياقوت',
      },
      {
        id: 'coins_15k',
        name: '15,000 عملة ذهبية إضافية',
        type: 'coins',
        duration: 'فوري',
        coins: 15000,
        icon: '🪙',
        tag: 'عملات',
      },
    ],
    winners: [
      { rank: 1, name: 'وجدان', avatar: '/src/assets/images/female_luxury_avatar_1790230899789.jpg' },
      { rank: 2, name: 'E AJANS', avatar: '/src/assets/images/male_partner_avatar_1790230886065.jpg' },
      { rank: 3, name: 'لار', avatar: '/src/assets/images/syrian_host_avatar_1790345251849.jpg' },
    ],
  },
  {
    id: 'tier_100',
    amount: 100,
    label: 'إعادة شحن 100 دولار',
    coinsReward: 500000,
    vipLevelReward: 2,
    vehicleReward: 'مركبة السفينة البحرية الفاخرة (15 يوم)',
    frameReward: 'إطار الطبيعة الأخضر (15 يوم)',
    items: [
      {
        id: 'vip2_15d',
        name: 'اشتراك VIP2 الملكي الفاخر',
        type: 'vip',
        duration: '15 يوم',
        vipLevel: 2,
        icon: '👑',
        tag: 'VIP2',
      },
      {
        id: 'cruise_vehicle_15d',
        name: 'مركبة السفينة البحرية 3D',
        type: 'vehicle',
        duration: '15 يوم',
        vehicleName: 'السفينة البحرية الفاخرة',
        icon: '🚢',
        tag: 'مركبة 3D',
      },
      {
        id: 'nature_frame_15d',
        name: 'إطار الطبيعة الأخضر الفخم',
        type: 'frame',
        duration: '15 يوم',
        icon: '🍄',
        tag: 'إطار طبيعة',
      },
    ],
    winners: [
      { rank: 1, name: 'Naro👑', avatar: '/src/assets/images/female_luxury_avatar_1790230899789.jpg' },
      { rank: 2, name: 'كنان', avatar: '/src/assets/images/male_partner_avatar_1790230886065.jpg' },
      { rank: 3, name: 'దేవత...', avatar: '/src/assets/images/syrian_host_avatar_1790345251849.jpg' },
    ],
  },
  {
    id: 'tier_300',
    amount: 300,
    label: 'إعادة شحن 300 دولار',
    coinsReward: 1500000,
    vipLevelReward: 3,
    vehicleReward: 'النمر الأبيض الملكي (15 يوم)',
    frameReward: 'إطار التاج الإمبراطوري (15 يوم)',
    items: [
      {
        id: 'vip3_15d',
        name: 'اشتراك VIP3 الملكي المتألق',
        type: 'vip',
        duration: '15 يوم',
        vipLevel: 3,
        icon: '👑',
        tag: 'VIP3',
      },
      {
        id: 'white_tiger_15d',
        name: 'دخولية النمر الأبيض الملكي 3D',
        type: 'vehicle',
        duration: '15 يوم',
        vehicleName: 'النمر الأبيض',
        icon: '🐅',
        tag: 'مركبة نمر',
      },
      {
        id: 'crown_frame_15d',
        name: 'إطار التاج الإمبراطوري الذهبي',
        type: 'frame',
        duration: '15 يوم',
        icon: '👑',
        tag: 'إطار تاج',
      },
    ],
    winners: [
      { rank: 1, name: 'Naro👑', avatar: '/src/assets/images/female_luxury_avatar_1790230899789.jpg' },
      { rank: 2, name: 'దేవత...', avatar: '/src/assets/images/syrian_host_avatar_1790345251849.jpg' },
      { rank: 3, name: 'దేవత...', avatar: '/src/assets/images/male_partner_avatar_1790230886065.jpg' },
    ],
  },
  {
    id: 'tier_500',
    amount: 500,
    label: 'إعادة شحن 500 دولار',
    coinsReward: 2500000,
    vipLevelReward: 4,
    vehicleReward: 'الأسد الإمبراطوري 3D (15 يوم)',
    frameReward: 'إكليل الغار الماسي الأزرق (15 يوم)',
    items: [
      {
        id: 'vip4_15d',
        name: 'اشتراك VIP4 الإمبراطوري',
        type: 'vip',
        duration: '15 يوم',
        vipLevel: 4,
        icon: '👑',
        tag: 'VIP4',
      },
      {
        id: 'lion_vehicle_15d',
        name: 'دخولية الأسد الإمبراطوري 3D',
        type: 'vehicle',
        duration: '15 يوم',
        vehicleName: 'الأسد الإمبراطوري',
        icon: '🦁',
        tag: 'مركبة أسد',
      },
      {
        id: 'laurel_frame_15d',
        name: 'إكليل الغار الماسي الأزرق المشع',
        type: 'frame',
        duration: '15 يوم',
        icon: '💎',
        tag: 'إكليل ماسي',
      },
    ],
    winners: [
      { rank: 1, name: 'Naro👑', avatar: '/src/assets/images/female_luxury_avatar_1790230899789.jpg' },
      { rank: 2, name: 'దేవత...', avatar: '/src/assets/images/syrian_host_avatar_1790345251849.jpg' },
      { rank: 3, name: 'దేవత...', avatar: '/src/assets/images/male_partner_avatar_1790230886065.jpg' },
    ],
  },
  {
    id: 'tier_1000',
    amount: 1000,
    label: 'إعادة شحن 1000 دولار',
    coinsReward: 5000000 + 50000,
    vipLevelReward: 5,
    specialIdReward: 'AABBCCD',
    vehicleReward: 'سيارة فيراري الحمراء الخارقة (30 يوم)',
    frameReward: 'إطار أجنحة النسر الذهبية (30 يوم)',
    items: [
      {
        id: 'coins_50k_extra',
        name: '50,000 عملة ذهبية فورية',
        type: 'coins',
        duration: 'فوري',
        coins: 50000,
        icon: '🪙',
        tag: '50000',
      },
      {
        id: 'id_aabbccd',
        name: 'معرف مميز سداسي AABBCCD',
        type: 'id',
        duration: '30 يوم',
        specialId: 'AABBCCD',
        icon: '🆔',
        tag: 'AABBCCD',
      },
      {
        id: 'vip5_15d',
        name: 'اشتراك VIP5 النبيل',
        type: 'vip',
        duration: '15 يوم',
        vipLevel: 5,
        icon: '👑',
        tag: 'VIP5',
      },
      {
        id: 'ferrari_30d',
        name: 'سيارة فيراري الخارقة 3D',
        type: 'vehicle',
        duration: '30 يوم',
        vehicleName: 'فيراري الحمراء',
        icon: '🏎️',
        tag: 'سوبر كار',
      },
      {
        id: 'eagle_frame_30d',
        name: 'إطار أجنحة النسر الذهبية',
        type: 'frame',
        duration: '30 يوم',
        icon: '🦅',
        tag: 'إطار النسر',
      },
    ],
    winners: [
      { rank: 1, name: 'దేవత...', avatar: '/src/assets/images/syrian_host_avatar_1790345251849.jpg' },
      { rank: 2, name: 'Naro👑', avatar: '/src/assets/images/female_luxury_avatar_1790230899789.jpg' },
      { rank: 3, name: 'Naro', avatar: '/src/assets/images/female_luxury_avatar_1790230899789.jpg' },
    ],
  },
  {
    id: 'tier_1500',
    amount: 1500,
    label: 'إعادة شحن 1500 دولار',
    coinsReward: 7500000 + 100000,
    vipLevelReward: 6,
    specialIdReward: 'AABBCCC',
    vehicleReward: 'عجلة الزمن الكونية (30 يوم)',
    frameReward: 'إطار الياقوت الإمبراطوري (30 يوم)',
    items: [
      {
        id: 'coins_100k_extra',
        name: '100,000 عملة ذهبية فورية',
        type: 'coins',
        duration: 'فوري',
        coins: 100000,
        icon: '🪙',
        tag: '100000',
      },
      {
        id: 'id_aabbccc',
        name: 'معرف مميز سباعي فخم AABBCCC',
        type: 'id',
        duration: '30 يوم',
        specialId: 'AABBCCC',
        icon: '🆔',
        tag: 'AABBCCC',
      },
      {
        id: 'vip6_30d',
        name: 'اشتراك أسطوري VIP6',
        type: 'vip',
        duration: '30 يوم',
        vipLevel: 6,
        icon: '👑',
        tag: 'VIP6',
      },
      {
        id: 'cosmic_wheel_30d',
        name: 'عجلة الزمن الكونية النادرة 3D',
        type: 'vehicle',
        duration: '30 يوم',
        vehicleName: 'عجلة الزمن الكونية',
        icon: '🌌',
        tag: 'مركبة كونية',
      },
      {
        id: 'ruby_emperor_frame_30d',
        name: 'إطار الياقوت الإمبراطوري المتوج',
        type: 'frame',
        duration: '30 يوم',
        icon: '👑',
        tag: 'إطار ياقوتي',
      },
    ],
    winners: [
      { rank: 1, name: 'Naro👑', avatar: '/src/assets/images/female_luxury_avatar_1790230899789.jpg' },
      { rank: 2, name: 'దేవత...', avatar: '/src/assets/images/syrian_host_avatar_1790345251849.jpg' },
      { rank: 3, name: 'Naro', avatar: '/src/assets/images/female_luxury_avatar_1790230899789.jpg' },
    ],
  },
  {
    id: 'tier_3000',
    amount: 3000,
    label: 'إعادة شحن 3000 دولار',
    coinsReward: 15000000 + 200000,
    vipLevelReward: 7,
    specialIdReward: 'AAABBB',
    vehicleReward: 'سفينة الفضاء النفاثة (30 يوم)',
    frameReward: 'إطار العرش الماسي الملكي (30 يوم)',
    items: [
      {
        id: 'coins_200k_extra',
        name: '200,000 عملة ذهبية فورية',
        type: 'coins',
        duration: 'فوري',
        coins: 200000,
        icon: '🪙',
        tag: '200000',
      },
      {
        id: 'gift_box_custom',
        name: 'هدية خاصة حصرية XXXXXX',
        type: 'gift',
        duration: 'هدية',
        icon: '🎁',
        tag: 'هدية حصرية',
      },
      {
        id: 'vip7_30d',
        name: 'اشتراك ملكي فائق VIP7',
        type: 'vip',
        duration: '30 يوم',
        vipLevel: 7,
        icon: '👑',
        tag: 'VIP7',
      },
      {
        id: 'id_aaabbb',
        name: 'معرف ملكي سداسي نادر AAABBB',
        type: 'id',
        duration: '30 يوم',
        specialId: 'AAABBB',
        icon: '🆔',
        tag: 'AAABBB',
      },
      {
        id: 'jet_vehicle_30d',
        name: 'مركبة سفينة الفضاء النفاثة 3D',
        type: 'vehicle',
        duration: '30 يوم',
        vehicleName: 'سفينة الفضاء النفاثة',
        icon: '🚀',
        tag: 'مركبة نفاثة',
      },
      {
        id: 'diamond_throne_frame_30d',
        name: 'إطار العرش الماسي والياقوت الملكي',
        type: 'frame',
        duration: '30 يوم',
        icon: '👑',
        tag: 'إطار العرش',
      },
    ],
    winners: [
      { rank: 1, name: 'Naro👑', avatar: '/src/assets/images/female_luxury_avatar_1790230899789.jpg' },
      { rank: 2, name: 'Naro', avatar: '/src/assets/images/female_luxury_avatar_1790230899789.jpg' },
      { rank: 3, name: 'దేవత...', avatar: '/src/assets/images/syrian_host_avatar_1790345251849.jpg' },
    ],
  },
  {
    id: 'tier_5000',
    amount: 5000,
    label: 'إعادة شحن 5000 دولار',
    coinsReward: 25000000 + 400000,
    vipLevelReward: 8,
    specialIdReward: 'AAABB',
    vehicleReward: 'مركبة نفاثة أسطورية مخصصة',
    frameReward: 'إطار الألماس الأخضر $5000 (30 يوم)',
    items: [
      {
        id: 'app_banner_15d',
        name: 'بانر رسمي باسمك بالتطبيق',
        type: 'banner',
        duration: 'بانر* 15 أيام',
        icon: '👑',
        tag: 'بانر رئيسي',
      },
      {
        id: 'intro_screen_full',
        name: 'شاشة افتتاحية كاملة مفتوحة',
        type: 'intro',
        duration: 'شاشة مفتوحة',
        icon: '✨',
        tag: 'شاشة مفتوحة',
      },
      {
        id: 'custom_3d_gift',
        name: 'هدية مخصصة 3D خاصة بك',
        type: 'gift',
        duration: 'هدية مخصصة',
        icon: '🎁',
        tag: 'هدية مخصصة',
      },
      {
        id: 'custom_jet_car',
        name: 'مركبة نفاثة أسطورية مخصصة',
        type: 'vehicle',
        duration: 'مركبة مخصصة',
        vehicleName: 'مركبة أسطورية مخصصة',
        icon: '🚀',
        tag: 'مركبة مخصصة',
      },
      {
        id: 'vip8_15d',
        name: 'أعلى رتبة إمبراطورية VIP8',
        type: 'vip',
        duration: '15 يوم',
        vipLevel: 8,
        icon: '👑',
        tag: 'VIP8',
      },
      {
        id: 'id_aaabb',
        name: 'معرف خماسي ملكي نادر AAABB',
        type: 'id',
        duration: '30 يوم',
        specialId: 'AAABB',
        icon: '🆔',
        tag: 'AAABB',
      },
      {
        id: 'coins_400k_extra',
        name: '400,000 عملة ذهبية فورية',
        type: 'coins',
        duration: 'فوري',
        coins: 400000,
        icon: '🪙',
        tag: '400000',
      },
      {
        id: 'green_diamond_frame',
        name: 'إطار الألماس الأخضر $5000',
        type: 'frame',
        duration: '30 يوم',
        icon: '💎',
        tag: 'إطار $5000',
      },
    ],
    winners: [
      { rank: 1, name: 'Naro👑', avatar: '/src/assets/images/female_luxury_avatar_1790230899789.jpg' },
      { rank: 2, name: 'దేవత...', avatar: '/src/assets/images/syrian_host_avatar_1790345251849.jpg' },
      { rank: 3, name: 'Naro', avatar: '/src/assets/images/female_luxury_avatar_1790230899789.jpg' },
    ],
  },
  {
    id: 'tier_10000',
    amount: 10000,
    label: 'إعادة شحن 10000 دولار',
    coinsReward: 50000000 + 1200000,
    vipLevelReward: 8,
    specialIdReward: 'AABB',
    vehicleReward: 'طائرة نفاثة ألماسيّة ملكية',
    frameReward: 'إطار الذهب والماس الأسطوري $10000 (30 يوم)',
    items: [
      {
        id: 'banner_top_15d',
        name: 'بانر رئيسي فائق الفخامة $10000',
        type: 'banner',
        duration: 'بانر* 15 أيام',
        icon: '👑',
        tag: 'بانر $10000',
      },
      {
        id: 'intro_imperial_open',
        name: 'دخولية إمبراطورية أسطورية شاشة مفتوحة',
        type: 'intro',
        duration: 'شاشة مفتوحة',
        icon: '✨',
        tag: 'شاشة مفتوحة',
      },
      {
        id: 'gift_godly_custom',
        name: 'هدية سوبر أسطورية 3D الأغلى في التطبيق',
        type: 'gift',
        duration: 'هدية أسطورية',
        icon: '🎁',
        tag: 'هدية أسطورية',
      },
      {
        id: 'jet_diamond_plane',
        name: 'طائرة نفاثة ألماسيّة ملكية 3D',
        type: 'vehicle',
        duration: 'طائرة ملكية',
        vehicleName: 'طائرة ألماسيّة ملكية',
        icon: '🚀',
        tag: 'طائرة نفاثة',
      },
      {
        id: 'vip8_30d',
        name: 'أعلى رتبة إمبراطورية VIP8 كاملة',
        type: 'vip',
        duration: '30 يوم',
        vipLevel: 8,
        icon: '👑',
        tag: 'VIP8',
      },
      {
        id: 'id_aabb_godly',
        name: 'معرف رباعي أسطوري ملكي نادر AABB',
        type: 'id',
        duration: '30 يوم',
        specialId: 'AABB',
        icon: '🆔',
        tag: 'AABB',
      },
      {
        id: 'coins_1m2_extra',
        name: '1,200,000 عملة ذهبية فورية',
        type: 'coins',
        duration: 'فوري',
        coins: 1200000,
        icon: '🪙',
        tag: '1200000',
      },
      {
        id: 'diamond_gold_10000_frame',
        name: 'إطار الذهب والماس الأسطوري $10000',
        type: 'frame',
        duration: '30 يوم',
        icon: '👑',
        tag: 'إطار $10000',
      },
    ],
    winners: [
      { rank: 1, name: 'Naro👑', avatar: '/src/assets/images/female_luxury_avatar_1790230899789.jpg' },
      { rank: 2, name: 'దేవత...', avatar: '/src/assets/images/syrian_host_avatar_1790345251849.jpg' },
      { rank: 3, name: 'Naro', avatar: '/src/assets/images/female_luxury_avatar_1790230899789.jpg' },
    ],
  },
];

export const RechargeActivityModal: React.FC<RechargeActivityModalProps> = ({ isOpen, onClose }) => {
  const { user, setUser } = useApp();
  const scheduleTimeout = useTimeouts(isOpen);
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [rewardToast, setRewardToast] = useState<{ title: string; desc: string } | null>(null);
  useEffect(() => {
    if (!isOpen) setRewardToast(null);
  }, [isOpen]);

  // Cumulative monthly recharge amount stored in localStorage per user
  const [monthlyRechargeAmount, setMonthlyRechargeAmount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`toti_monthly_recharge_${user.id}`);
      const amount = saved ? Number(saved) : 0;
      return Number.isFinite(amount) && amount >= 0 ? amount : 0;
    } catch {
      return 0;
    }
  });

  // Track claimed tiers
  const [claimedTiers, setClaimedTiers] = useState<string[]>(() => {
    return readStoredArray(`toti_claimed_tiers_${user.id}`, (value): value is string => typeof value === 'string');
  });

  const currentTier = OFFICIAL_ACTIVITY_TIERS[selectedTierIndex] || OFFICIAL_ACTIVITY_TIERS[0];
  const isTierClaimed = claimedTiers.includes(currentTier.id);

  // Countdown timer: 15 days, 00 hours, 25 minutes, 08 seconds
  const [timeLeft, setTimeLeft] = useState({
    days: 15,
    hours: 0,
    minutes: 25,
    seconds: 8,
  });

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Save cumulative recharge amount & claimed tiers
  const updateMonthlyRecharge = (newTotal: number, newClaimed: string[]) => {
    setMonthlyRechargeAmount(newTotal);
    setClaimedTiers(newClaimed);
    try {
      localStorage.setItem(`toti_monthly_recharge_${user.id}`, newTotal.toString());
      localStorage.setItem(`toti_claimed_tiers_${user.id}`, JSON.stringify(newClaimed));
    } catch {
      // ignore
    }
  };

  // Real Execute Recharge Function: Recharges the user, unlocks all features, VIP, ID, coins, frames!
  const handleExecuteRechargeAndUnlock = (tier: ActivityTierData) => {
    const newTotal = monthlyRechargeAmount + tier.amount;
    const newClaimed = Array.from(new Set([...claimedTiers, tier.id]));

    // Apply real benefits to user account
    setUser((prev) => {
      const updatedVip = Math.max(prev.vipLevel || 0, tier.vipLevelReward);
      const updatedCoins = prev.gold + tier.coinsReward;
      const updatedCustomTitle = tier.titleReward || prev.customTitle;
      const updatedSpecialId = tier.specialIdReward || prev.id;

      return {
        ...prev,
        vipLevel: updatedVip,
        nobleRank: `VIP${updatedVip}`,
        gold: updatedCoins,
        id: updatedSpecialId,
        customTitle: updatedCustomTitle,
        avatarFrame: tier.frameReward || prev.avatarFrame,
      };
    });

    updateMonthlyRecharge(newTotal, newClaimed);

    // Send official system message to رسائل النظام with explanation of all rewards gained
    const itemsSummary = tier.items.map((i) => `[${i.name} - ${i.duration}]`).join(' + ');
    triggerRechargeTierNotification(tier.amount, tier.label, itemsSummary);

    // Also update custom gift notification progress towards $1500
    triggerCustomGiftNotification(newTotal, 1500);

    // Show celebration notification with exact features received
    setRewardToast({
      title: `🎉 مبروك! تم شحن ${tier.label} بنجاح!`,
      desc: `تم منحك ${tier.coinsReward.toLocaleString()} عملة + ترقية VIP${tier.vipLevelReward}${
        tier.specialIdReward ? ` + المعرف المميز ${tier.specialIdReward}` : ''
      }${tier.vehicleReward ? ` + مركبة ${tier.vehicleReward}` : ''} تلقائياً!`,
    });

    scheduleTimeout(() => {
      setRewardToast(null);
    }, 5000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      {/* Toast Notification for Real Unlocked Rewards */}
      {rewardToast && (
        <div className="fixed top-5 inset-x-4 z-60 max-w-md mx-auto p-4 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-bold text-center text-xs shadow-2xl border-2 border-amber-300 flex flex-col items-center gap-1.5 animate-bounce" dir="rtl">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={22} className="text-amber-300 shrink-0" />
            <span className="text-sm font-black text-amber-200">{rewardToast.title}</span>
          </div>
          <span className="text-xs text-white/95 leading-relaxed">{rewardToast.desc}</span>
        </div>
      )}

      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[96vh] bg-[#1a040b] border-2 border-[#d4af37] rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.55)] overflow-hidden flex flex-col select-none"
      >
        {/* Top Control Header */}
        <div className="relative py-2.5 px-4 bg-gradient-to-r from-[#21050e] via-[#3d0918] to-[#21050e] border-b border-[#d4af37]/60 flex items-center justify-between z-10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 border border-[#d4af37]/50 text-[#f5d77f] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
            title="إغلاق"
          >
            <X size={18} />
          </button>

          <span className="text-sm font-black text-amber-200 tracking-wide" dir="rtl">
            👑 نشاط إعادة الشحن والمكافآت 👑
          </span>

          {/* قواعد Button */}
          <button
            type="button"
            onClick={() => setShowRulesModal(!showRulesModal)}
            className="px-3 py-1 rounded-full bg-gradient-to-r from-[#991b1b] to-[#dc2626] border border-amber-300 text-amber-100 text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            قواعد
          </button>
        </div>

        {/* Scrollable Body with exact user photo as background */}
        <div
          className="overflow-y-auto flex-1 flex flex-col items-center scrollbar-thin scrollbar-thumb-amber-600/40 pb-6 relative bg-[#120208]"
          style={{
            backgroundImage: `url('/src/assets/images/recharge_bg_clean_exact_1790804762621.jpg')`,
            backgroundSize: '100% auto',
            backgroundPosition: 'top center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Header Dynamic Interactive Overlay matching the exact background coordinates */}
          <div className="relative w-full max-w-[440px] pt-2 pb-2 px-3 flex flex-col items-center select-none" dir="rtl">
            {/* Top Bar Spacer & Rules button align */}
            <div className="w-full flex items-center justify-between h-9 px-2">
              <span className="text-transparent">.</span>
              <button
                type="button"
                onClick={() => setShowRulesModal(true)}
                className="opacity-0 w-16 h-8 cursor-pointer"
                title="قواعد"
              >
                قواعد
              </button>
            </div>

            {/* Countdown timers positioned over background boxes */}
            <div className="w-full grid grid-cols-4 gap-2.5 px-4 mt-16 mb-2">
              <div className="flex flex-col items-center justify-center h-14">
                <span className="text-xl sm:text-2xl font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-amber-200/90 font-bold -mt-0.5">ثواني</span>
              </div>
              <div className="flex flex-col items-center justify-center h-14">
                <span className="text-xl sm:text-2xl font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-amber-200/90 font-bold -mt-0.5">دقائق</span>
              </div>
              <div className="flex flex-col items-center justify-center h-14">
                <span className="text-xl sm:text-2xl font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-amber-200/90 font-bold -mt-0.5">ساعات</span>
              </div>
              <div className="flex flex-col items-center justify-center h-14">
                <span className="text-xl sm:text-2xl font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-amber-200/90 font-bold -mt-0.5">أيام</span>
              </div>
            </div>

            {/* Dynamic Real Recharge Amount Display over the $0.00 area */}
            <div className="w-full flex flex-col items-center justify-center mt-12 mb-6">
              <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] tracking-wider">
                ${monthlyRechargeAmount > 0 ? monthlyRechargeAmount.toFixed(2) : '0.00'}
              </div>
              <span className="text-[10px] font-bold text-amber-200/90 bg-black/60 px-3 py-0.5 rounded-full border border-amber-400/40 mt-1 shadow-sm">
                قيمة الشحن التراكمي الشهري
              </span>
            </div>

            {/* Quick 3 Bottom Shortcuts over the 3 badges on background */}
            <div className="w-full grid grid-cols-3 gap-2 px-1 mb-2">
              <button
                type="button"
                onClick={() => {
                  const idx = OFFICIAL_ACTIVITY_TIERS.findIndex((t) => t.amount === 3000);
                  if (idx !== -1) setSelectedTierIndex(idx);
                }}
                className="h-10 rounded-xl cursor-pointer hover:bg-white/10 active:scale-95 transition-all"
                title="إعادة شحن 3000 دولار+"
              />
              <button
                type="button"
                onClick={() => {
                  const idx = OFFICIAL_ACTIVITY_TIERS.findIndex((t) => t.amount === 500);
                  if (idx !== -1) setSelectedTierIndex(idx);
                }}
                className="h-10 rounded-xl cursor-pointer hover:bg-white/10 active:scale-95 transition-all"
                title="إعادة شحن 500 دولار+"
              />
              <button
                type="button"
                onClick={() => {
                  const idx = OFFICIAL_ACTIVITY_TIERS.findIndex((t) => t.amount === 9.9);
                  if (idx !== -1) setSelectedTierIndex(idx);
                }}
                className="h-10 rounded-xl cursor-pointer hover:bg-white/10 active:scale-95 transition-all"
                title="إعادة شحن 9.9 دولار+"
              />
            </div>
          </div>

          {/* Quick-Select Tier Buttons ($9.9 -> $10,000) */}
          <div className="w-full max-w-[440px] px-3 mt-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none" dir="rtl">
              {OFFICIAL_ACTIVITY_TIERS.map((tier, idx) => {
                const isSelected = idx === selectedTierIndex;
                const isClaimed = claimedTiers.includes(tier.id);
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedTierIndex(idx)}
                    className={`relative px-3 py-1.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 border-white shadow-[0_0_15px_rgba(245,158,11,0.6)] scale-105'
                        : isClaimed
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                        : 'bg-black/60 text-amber-200/90 border-[#d4af37]/40 hover:border-[#d4af37]'
                    }`}
                  >
                    ${tier.amount.toLocaleString()}
                    {isClaimed && <span className="mr-1 text-[9px] text-emerald-400">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tier Card: Realistic Royal Cards Matching Photos 1:1 */}
          <div className="w-full max-w-[440px] px-3 mt-2" dir="rtl">
            <div className="relative rounded-3xl bg-gradient-to-b from-[#260511] via-[#1a030b] to-[#120207] border-2 border-amber-500/60 p-4 shadow-2xl overflow-hidden">
              {/* Header Ribbon for current tier */}
              <div className="relative -mt-2 mb-4 flex items-center justify-center">
                <div className="relative px-6 py-2 rounded-2xl bg-gradient-to-r from-[#991b1b] via-[#dc2626] to-[#991b1b] border-2 border-amber-300 text-amber-100 font-black text-sm shadow-[0_0_20px_rgba(220,38,38,0.7)] flex items-center gap-2">
                  <Crown size={16} className="text-amber-300 fill-amber-300" />
                  <span>{currentTier.label}</span>
                  <Crown size={16} className="text-amber-300 fill-amber-300" />
                </div>
              </div>

              {/* Items Rewards Grid with Realistic Cards and Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                {currentTier.items.map((item) => (
                  <div
                    key={item.id}
                    className="relative flex flex-col items-center justify-between p-3 rounded-2xl bg-gradient-to-b from-[#2e0915] to-[#1a040b] border border-amber-500/40 shadow-lg hover:border-amber-400 transition-all text-center min-h-[125px] group hover:scale-[1.02]"
                  >
                    {/* Top Duration/Tag badge */}
                    <span className="text-[10px] font-black text-amber-300 bg-black/70 px-2 py-0.5 rounded-full border border-amber-400/40 mb-1">
                      {item.duration}
                    </span>

                    {/* Central 3D Icon / Emoticon Badge */}
                    <div className="my-auto flex flex-col items-center justify-center">
                      {item.type === 'vip' ? (
                        <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 border border-amber-300 text-white font-black text-xs shadow-md">
                          {item.tag}
                        </div>
                      ) : item.type === 'id' ? (
                        <div className="px-2.5 py-1 rounded-xl bg-slate-900 border border-amber-400 text-amber-300 font-mono font-black text-xs tracking-wider shadow-md">
                          {item.specialId}
                        </div>
                      ) : (
                        <span className="text-3xl filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.6)]">
                          {item.icon}
                        </span>
                      )}
                    </div>

                    {/* Item Name */}
                    <div className="mt-1 w-full">
                      <span className="block text-xs font-black text-white truncate px-1">
                        {item.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* الفائزون الثلاثة الأوائل (Top 3 Winners from photos) */}
              <div className="border-t border-amber-500/30 pt-3">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-amber-400/60 to-transparent" />
                  <span className="text-xs font-black text-amber-300">الفائزون الثلاثة الأوائل</span>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-amber-400/60 to-transparent" />
                </div>

                <div className="flex items-center justify-around">
                  {/* Rank 2 (Right) */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-12 h-12 rounded-full p-[2px] bg-gradient-to-b from-slate-200 to-slate-400 shadow-md">
                      <img
                        src={currentTier.winners[1]?.avatar || '/src/assets/images/male_partner_avatar_1790230886065.jpg'}
                        alt="Rank 2"
                        className="w-full h-full rounded-full object-cover"
                      />
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-400 text-black text-[10px] font-black flex items-center justify-center border border-white">
                        2
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 mt-1 truncate max-w-[65px]">
                      {currentTier.winners[1]?.name || 'وصيف'}
                    </span>
                  </div>

                  {/* Rank 1 (Center - Crown) */}
                  <div className="flex flex-col items-center -mt-2">
                    <div className="relative w-15 h-15 rounded-full p-[2px] bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.6)]">
                      <img
                        src={currentTier.winners[0]?.avatar || '/src/assets/images/female_luxury_avatar_1790230899789.jpg'}
                        alt="Rank 1"
                        className="w-full h-full rounded-full object-cover"
                      />
                      <span className="absolute -top-2 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center border-2 border-white shadow-md">
                        👑1
                      </span>
                    </div>
                    <span className="text-xs font-black text-amber-300 mt-1 truncate max-w-[80px]">
                      {currentTier.winners[0]?.name || 'بطل الشحن'}
                    </span>
                  </div>

                  {/* Rank 3 (Left) */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-12 h-12 rounded-full p-[2px] bg-gradient-to-b from-amber-700 to-amber-900 shadow-md">
                      <img
                        src={currentTier.winners[2]?.avatar || '/src/assets/images/syrian_host_avatar_1790345251849.jpg'}
                        alt="Rank 3"
                        className="w-full h-full rounded-full object-cover"
                      />
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-700 text-amber-100 text-[10px] font-black flex items-center justify-center border border-white">
                        3
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 mt-1 truncate max-w-[65px]">
                      {currentTier.winners[2]?.name || 'المركز الثالث'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real Recharge Action Button: Recharges and Unlocks Automatically */}
              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={() => handleExecuteRechargeAndUnlock(currentTier)}
                  className={`w-full py-3 px-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer border active:scale-95 ${
                    isTierClaimed
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                      : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 border-white hover:scale-[1.02] shadow-[0_0_25px_rgba(245,158,11,0.6)]'
                  }`}
                >
                  <Coins size={18} />
                  <span>
                    {isTierClaimed
                      ? `تم تفعيل وتسلّم مكافآت (${currentTier.label}) - اشحن مرة أخرى`
                      : `اشحن الآن (${currentTier.amount}$) وتفعيل جميع المميزات فورياً`}
                  </span>
                  <Sparkles size={16} />
                </button>

                <p className="text-[10px] text-amber-200/70 text-center">
                  ⚡ الضغط على الزر يقوم بالشحن الحقيقي وإضافة الكونز، وتفعيل رتبة VIP، وتثبيت المعرف المميز والمركبة فورياً في حسابك!
                </p>
              </div>
            </div>

            {/* Bottom Navigation Buttons */}
            <div className="mt-3 flex items-center justify-between gap-2 px-1">
              <button
                type="button"
                disabled={selectedTierIndex === 0}
                onClick={() => setSelectedTierIndex((prev) => Math.max(0, prev - 1))}
                className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center gap-1 transition-all ${
                  selectedTierIndex === 0
                    ? 'opacity-40 border-slate-700 text-slate-500 cursor-not-allowed'
                    : 'border-amber-400/50 bg-black/60 text-amber-200 hover:bg-black/80 cursor-pointer active:scale-95'
                }`}
              >
                <span>الفئة السابقة</span>
                <ChevronRight size={16} />
              </button>

              <button
                type="button"
                disabled={selectedTierIndex === OFFICIAL_ACTIVITY_TIERS.length - 1}
                onClick={() => setSelectedTierIndex((prev) => Math.min(OFFICIAL_ACTIVITY_TIERS.length - 1, prev + 1))}
                className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center gap-1 transition-all ${
                  selectedTierIndex === OFFICIAL_ACTIVITY_TIERS.length - 1
                    ? 'opacity-40 border-slate-700 text-slate-500 cursor-not-allowed'
                    : 'border-amber-400/50 bg-black/60 text-amber-200 hover:bg-black/80 cursor-pointer active:scale-95'
                }`}
              >
                <ChevronLeft size={16} />
                <span>الفئة التالية</span>
              </button>
            </div>
          </div>
        </div>

        {/* Rules Popup Modal if requested */}
        {showRulesModal && (
          <div
            className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex flex-col justify-center items-center p-4 animate-fade-in"
            dir="rtl"
            onClick={() => setShowRulesModal(false)}
          >
            <div
              className="bg-[#1f050e] border-2 border-amber-400 rounded-3xl p-5 max-w-sm text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center mb-3">
                <HelpCircle size={28} />
              </div>
              <h3 className="text-base font-black text-amber-200 mb-2">قواعد نشاط إعادة الشحن الشهري</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4 text-right">
                1. يتم احتساب الشحن التراكمي لجميع الباقات تلقائياً خلال الشهر الحالي.<br />
                2. عند وصول الشحن لأي فئة من 9.9$ حتى 10,000$ يتم فتح المكافأة المخصصة لها فوراً.<br />
                3. يحصل الفائزون الثلاثة الأوائل على شارات إمبراطورية وتكريم دائم في قائمة الشرف.<br />
                4. المكافآت تشمل اشتراكات VIP، معرّفات مميزة، مركبات حصرية، وإطارات نادرة وتعمل مباشرة في حسابك.
              </p>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="w-full py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs cursor-pointer hover:bg-amber-400 transition-all"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

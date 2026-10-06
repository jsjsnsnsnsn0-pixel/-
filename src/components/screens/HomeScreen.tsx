import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ChevronDown, Crown, Radio, Search, Sparkles, Users} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {useRealtimeRankings} from '../../context/RealtimeRankingsContext';
import {supabase} from '../../services/supabase';
import {RoomCard} from '../rooms/RoomCard';
import {EmptyState, ErrorState, InlineLoading} from '../common/UIState';
import {SpecialIdModal} from '../modals/SpecialIdModal';
import {AgencyOpeningModal} from '../modals/AgencyOpeningModal';
import {SoulmatesWeeklyModal} from '../modals/SoulmatesWeeklyModal';
import {CustomGiftModal} from '../modals/CustomGiftModal';
import {RechargeActivityModal} from '../modals/RechargeActivityModal';

type TopTab = 'party' | 'royal' | 'discover';
type Filter = 'trending' | 'iraq' | 'saudi';

export const HomeScreen: React.FC = () => {
  const {user, rooms, joinRoom, setActiveSubScreen, setActiveTab} = useApp();
  const {wealthRankings, charmRankings, roomRankings} = useRealtimeRankings();
  const [activeTopTab, setActiveTopTab] = useState<TopTab>('party');
  const [selectedFilter, setSelectedFilter] = useState<Filter>('trending');
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [followedOwnerIds, setFollowedOwnerIds] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);
  const [showSpecialIdModal, setShowSpecialIdModal] = useState(false);
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [showSoulmatesModal, setShowSoulmatesModal] = useState(false);
  const [showCustomGiftModal, setShowCustomGiftModal] = useState(false);
  const [showRechargeActivityModal, setShowRechargeActivityModal] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  const banners = useMemo(() => [
    {id: 'distinguished_id', title: 'المعرف المميز', subtitle: 'خلِّ حسابك يبرز بهوية مميزة', image: '/assets/images/toti_distinguished_id_1790717836703.jpg', action: () => setShowSpecialIdModal(true)},
    {id: 'soulmates', title: 'رفقاء الروح', subtitle: 'فعالية أسبوعية للمجتمع', image: '/assets/images/soulmates_exact_banner_1790725479589.jpg', action: () => setShowSoulmatesModal(true)},
    {id: 'agency_opening', title: 'افتتاح الوكالات', subtitle: 'كل تفاصيل نظام الوكالات', image: '/assets/images/agency_opening_banner_1790725265910.jpg', action: () => setShowAgencyModal(true)},
    {id: 'recharge_activity', title: 'نشاط إعادة الشحن', subtitle: 'شاهد فئات النشاط الحالية', image: '/assets/images/recharge_activity_banner_1790725680784.jpg', action: () => setShowRechargeActivityModal(true)},
    {id: 'custom_gift', title: 'هدية مخصصة', subtitle: 'فعاليات وهدايا خاصة', image: '/assets/images/custom_gift_banner_1790726268730.jpg', action: () => setShowCustomGiftModal(true)},
    {id: 'global_star', title: 'النجم العالمي', subtitle: 'الثروة والجاذبية الحقيقية', image: '/assets/images/global_star_banner_1790726285845.jpg', action: () => setActiveSubScreen('charm_wealth')},
  ], [setActiveSubScreen]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActiveBannerIndex(prev => (prev + 1) % banners.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  const loadFollowedRooms = async () => {
    if (!user.authId) { setFollowedOwnerIds(new Set()); return; }
    setFollowLoading(true); setFollowError(null);
    const {data, error} = await supabase.from('user_follows').select('followed_id').eq('follower_id', user.authId);
    if (error) {
      setFollowError('تعذر تحميل الغرف التي تتابع أصحابها.');
      setFollowedOwnerIds(new Set());
    } else {
      setFollowedOwnerIds(new Set((data || []).map(row => String(row.followed_id))));
    }
    setFollowLoading(false);
  };

  useEffect(() => { if (activeTopTab === 'royal') void loadFollowedRooms(); }, [activeTopTab, user.authId]);

  const filteredRooms = useMemo(() => {
    const source = activeTopTab === 'royal' ? rooms.filter(room => room.ownerAuthId && followedOwnerIds.has(room.ownerAuthId)) : rooms;
    if (selectedFilter === 'iraq') return source.filter(room => room.owner.countryCode === 'IQ' || room.owner.countryFlag === '🇮🇶');
    if (selectedFilter === 'saudi') return source.filter(room => room.owner.countryCode === 'SA' || room.owner.countryFlag === '🇸🇦');
    return [...source].sort((a, b) => b.usersCount - a.usersCount);
  }, [activeTopTab, followedOwnerIds, rooms, selectedFilter]);

  const activeBanner = banners[activeBannerIndex];
  const onTouchStart = (event: React.TouchEvent) => { touchStartXRef.current = event.touches[0]?.clientX ?? null; };
  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = (event.changedTouches[0]?.clientX ?? 0) - touchStartXRef.current;
    if (Math.abs(diff) > 40) setActiveBannerIndex(prev => diff > 0 ? (prev === 0 ? banners.length - 1 : prev - 1) : (prev + 1) % banners.length);
    touchStartXRef.current = null;
  };

  const topWealth = wealthRankings?.[0];
  const topCharm = charmRankings?.[0];
  const topRoom = roomRankings?.[0];

  return (
    <div className="min-h-screen pb-28 bg-[linear-gradient(180deg,#0a6f50_0,#13956d_175px,#e9f8f1_500px,#f8fbfa_100%)] text-slate-900" dir="rtl">
      <header className="sticky top-0 z-40 px-4 pt-3 pb-3 bg-emerald-900/72 border-b border-white/10 shadow-lg shadow-emerald-950/10">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-emerald-100/75">TotiChat</p>
            <h1 className="text-xl font-black text-white truncate">اكتشف غرفتك اليوم</h1>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setActiveSubScreen('search')} className="ui-icon-button bg-white/12 text-white border border-white/15" aria-label="بحث"><Search size={20}/></button>
            <button type="button" onClick={() => setActiveTab('create')} className="ui-icon-button bg-amber-400 text-emerald-950 shadow-lg shadow-amber-950/20" aria-label="إنشاء غرفة">＋</button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-black/16 p-1 border border-white/10">
          {([
            ['party','حفلة'], ['royal','ملكي'], ['discover','اكتشف'],
          ] as [TopTab,string][]).map(([id,label]) => (
            <button key={id} type="button" onClick={() => setActiveTopTab(id)} aria-pressed={activeTopTab === id}
              className={`rounded-xl px-3 py-2 text-sm font-black ${activeTopTab === id ? 'bg-white text-emerald-900 shadow-md' : 'text-emerald-50'}`}>
              {label}
            </button>
          ))}
        </div>
      </header>

      {activeTopTab === 'discover' ? (
        <main className="px-4 pt-4 space-y-3">
          <div className="rounded-3xl bg-slate-950 text-white p-5 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-300"><Sparkles size={18}/><span className="font-black">فعاليات TotiChat</span></div>
            <p className="text-xs text-slate-400 mt-1">كل الإعلانات والأنشطة في مكان واحد.</p>
          </div>
          {banners.map(banner => (
            <button key={banner.id} type="button" onClick={banner.action} className="w-full text-right rounded-3xl overflow-hidden bg-slate-950 border border-white/10 shadow-xl">
              <div className="relative aspect-[2.45/1]">
                <img src={banner.image} alt="" className="absolute inset-0 w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-l from-black/78 via-black/25 to-transparent"/>
                <div className="absolute inset-y-0 right-0 w-2/3 p-4 flex flex-col justify-center text-white">
                  <strong className="text-base">{banner.title}</strong><span className="text-xs text-white/75 mt-1">{banner.subtitle}</span>
                </div>
              </div>
            </button>
          ))}
        </main>
      ) : (
        <main className="pb-8">
          {activeTopTab === 'party' && (
            <section className="px-4 pt-4">
              <button type="button" onClick={activeBanner.action} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
                className="relative w-full aspect-[2.15/1] rounded-3xl overflow-hidden bg-slate-900 shadow-2xl border border-white/20 text-right">
                <img src={activeBanner.image} alt="" className="absolute inset-0 w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"/>
                <div className="absolute inset-x-0 bottom-0 p-4 text-white"><p className="text-lg font-black">{activeBanner.title}</p><p className="text-xs text-white/75">{activeBanner.subtitle}</p></div>
                <div className="absolute top-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] text-white">{activeBannerIndex + 1}/{banners.length}</div>
              </button>
            </section>
          )}

          {activeTopTab === 'royal' && (
            <section className="px-4 pt-4">
              <div className="rounded-3xl bg-gradient-to-br from-[#17111f] via-[#271331] to-[#111827] p-5 text-white shadow-2xl border border-amber-400/20">
                <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-amber-400/15 text-amber-300 flex items-center justify-center"><Crown size={24}/></div><div><h2 className="font-black">غرف الأشخاص الذين تتابعهم</h2><p className="text-xs text-slate-400 mt-1">هذه القائمة تأتي من متابعات حسابك الحقيقية.</p></div></div>
              </div>
              {followLoading && <InlineLoading>جارٍ تحميل الغرف المتابَعة…</InlineLoading>}
              {followError && <div className="mt-3"><ErrorState message={followError} onRetry={() => void loadFollowedRooms()}/></div>}
            </section>
          )}

          <section className="px-4 pt-4">
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setActiveSubScreen('wealth_ranking')} className="rounded-2xl p-3 bg-gradient-to-br from-rose-950 to-rose-800 text-white border border-rose-400/20 text-right shadow-lg"><span className="text-[11px] text-rose-200">الثروة</span><strong className="block text-sm truncate mt-1">{topWealth?.name || 'لا بيانات'}</strong><span className="text-[10px] text-rose-200/70">{topWealth?.score?.toLocaleString() || 0}</span></button>
              <button type="button" onClick={() => setActiveSubScreen('charm_ranking')} className="rounded-2xl p-3 bg-gradient-to-br from-blue-950 to-blue-700 text-white border border-blue-400/20 text-right shadow-lg"><span className="text-[11px] text-blue-200">الجاذبية</span><strong className="block text-sm truncate mt-1">{topCharm?.name || 'لا بيانات'}</strong><span className="text-[10px] text-blue-200/70">{topCharm?.score?.toLocaleString() || 0}</span></button>
              <button type="button" onClick={() => setActiveSubScreen('room_rankings')} className="rounded-2xl p-3 bg-gradient-to-br from-emerald-950 to-emerald-700 text-white border border-emerald-400/20 text-right shadow-lg"><span className="text-[11px] text-emerald-200">الغرف</span><strong className="block text-sm truncate mt-1">{topRoom?.roomName || 'لا بيانات'}</strong><span className="text-[10px] text-emerald-200/70">{topRoom?.supportScore?.toLocaleString() || 0}</span></button>
            </div>
          </section>

          <section className="px-4 pt-4">
            <div className="flex items-center justify-between gap-2">
              <div><h2 className="font-black text-base">{activeTopTab === 'royal' ? 'ملكي' : 'غرف نشطة'}</h2><p className="text-[11px] text-slate-500">{filteredRooms.length} غرفة متاحة الآن</p></div>
              <div className="relative flex items-center gap-1 rounded-full bg-white p-1 shadow-md border border-slate-200">
                <button type="button" onClick={() => setSelectedFilter('trending')} className={`px-3 rounded-full text-xs font-bold ${selectedFilter === 'trending' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>شائع</button>
                <button type="button" onClick={() => setSelectedFilter('iraq')} className={`px-3 rounded-full text-xs font-bold ${selectedFilter === 'iraq' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>🇮🇶</button>
                <button type="button" onClick={() => setShowCountryMenu(v => !v)} className="w-9 h-9 rounded-full text-slate-600" aria-label="المزيد من الدول"><ChevronDown size={15}/></button>
                {showCountryMenu && <div className="absolute top-12 left-0 z-30 rounded-2xl bg-white p-2 shadow-xl border border-slate-200 min-w-36"><button type="button" onClick={() => {setSelectedFilter('saudi');setShowCountryMenu(false);}} className="w-full text-right px-3 rounded-xl text-xs">🇸🇦 السعودية</button><button type="button" onClick={() => {setSelectedFilter('trending');setShowCountryMenu(false);}} className="w-full text-right px-3 rounded-xl text-xs">🔥 كل الغرف</button></div>}
              </div>
            </div>

            {!followLoading && filteredRooms.length > 0 && <div className="grid grid-cols-2 gap-3 mt-3">{filteredRooms.map(room => <RoomCard key={room.id} room={room} onJoin={joinRoom}/>)}</div>}
            {!followLoading && !followError && filteredRooms.length === 0 && <div className="mt-4"><EmptyState title={activeTopTab === 'royal' ? 'لا توجد غرف متابَعة نشطة' : 'لا توجد غرف نشطة'} description={activeTopTab === 'royal' ? 'تابع مستخدمين من ملفاتهم الشخصية، وستظهر غرفهم هنا تلقائياً عندما تكون نشطة.' : 'أنشئ غرفة جديدة أو جرّب الفلاتر الأخرى.'}/></div>}
          </section>

          <section className="px-4 pt-4">
            <button type="button" onClick={() => setActiveTab('rooms')} className="w-full rounded-2xl bg-slate-950 text-white py-3.5 px-4 font-black flex items-center justify-center gap-2 shadow-xl"><Radio size={18}/><span>عرض كل الغرف</span><Users size={16} className="text-emerald-300"/></button>
          </section>
        </main>
      )}

      <SpecialIdModal isOpen={showSpecialIdModal} onClose={() => setShowSpecialIdModal(false)}/>
      <AgencyOpeningModal isOpen={showAgencyModal} onClose={() => setShowAgencyModal(false)}/>
      <SoulmatesWeeklyModal isOpen={showSoulmatesModal} onClose={() => setShowSoulmatesModal(false)}/>
      <CustomGiftModal isOpen={showCustomGiftModal} onClose={() => setShowCustomGiftModal(false)}/>
      <RechargeActivityModal isOpen={showRechargeActivityModal} onClose={() => setShowRechargeActivityModal(false)}/>
    </div>
  );
};
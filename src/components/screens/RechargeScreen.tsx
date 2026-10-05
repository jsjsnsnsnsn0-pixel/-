import { DiamondRedeemModal } from '../modals/DiamondRedeemModal';
import { usePublicChat } from '../../hooks/usePublicChat';
import { useTimeouts } from '../../hooks/useTimeouts';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../services/supabase';
import {
  ChevronRight,
  CheckCircle2,
  X,
} from 'lucide-react';

export const RechargeScreen: React.FC = () => {
  const { user, setActiveSubScreen } = useApp();

  const { opening, openChat } = usePublicChat();
  const scheduleTimeout = useTimeouts();

  // Active tab: 'coins' (عملات معدنية) | 'diamonds' (أرباح الهدايا)
  const [activeTab, setActiveTab] = useState<'coins' | 'diamonds'>('coins');

  // Selected coin package (defaults to 1 -> 4900 @ 0.99 $)
  const [selectedPkgId, setSelectedPkgId] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Conversion Modal State
  const [showConvertModal, setShowConvertModal] = useState<boolean>(false);
  const [showOrderCheckModal, setShowOrderCheckModal] = useState<boolean>(false);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [rechargeError, setRechargeError] = useState<string | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [agentInfo, setAgentInfo] = useState<any>(null);

  // Exact 6 packages from the user's screenshots with bright realistic 3D assets on white background:
  const [coinPackages, setCoinPackages] = useState<any[]>([]);
  const packageImages = [
    '/assets/images/coin_stack_4900_white_1790370914704.jpg',
    '/assets/images/coin_stack_24500_white_1790370928783.jpg',
    '/assets/images/coin_stack_49000_white_1790370942810.jpg',
    '/assets/images/coin_stack_122500_white_1790370953557.jpg',
    '/assets/images/coin_stack_245000_white_1790370964601.jpg',
    '/assets/images/coin_stack_490000_white_1790370977790.jpg',
  ];
  React.useEffect(() => {
    let cancelled = false;

    const loadPackages = async () => {
      setPackagesLoading(true);
      setRechargeError(null);

      const { data, error } = await supabase
        .from('recharge_packages')
        .select('id, price_usd, gold_amount')
        .eq('is_active', true)
        .order('price_usd', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('recharge_packages error:', error);
        setRechargeError('تعذر تحميل باقات الشحن حالياً.');
        setCoinPackages([]);
      } else {
        const mapped = (data || []).map((pkg: any, index: number) => ({
          id: pkg.id,
          coins: Number(pkg.gold_amount),
          price: Number(pkg.price_usd).toFixed(2) + " $",
          image: packageImages[index] || packageImages[packageImages.length - 1],
        }));

        setCoinPackages(mapped);
        setSelectedPkgId(mapped[0]?.id ?? '');
      }

      setPackagesLoading(false);
    };

    void loadPackages().catch(() => {
      if (!cancelled) { setRechargeError('تعذر تحميل باقات الشحن حالياً.'); setCoinPackages([]); setPackagesLoading(false); }
    });

    return () => {
      cancelled = true;
    };
  }, []);



  // Preload heavy images once on mount to eliminate any loading delays
  React.useEffect(() => {
    const imagesToPreload = [
      '/assets/images/gold_balance_banner_1790372661010.jpg',
      '/assets/images/diamond_banner_template_1790373461489.jpg',
      '/assets/images/coin_stack_4900_white_1790370914704.jpg',
      '/assets/images/coin_stack_24500_white_1790370928783.jpg',
      '/assets/images/coin_stack_49000_white_1790370942810.jpg',
      '/assets/images/coin_stack_122500_white_1790370953557.jpg',
      '/assets/images/coin_stack_245000_white_1790370964601.jpg',
      '/assets/images/coin_stack_490000_white_1790370977790.jpg',
    ];
    imagesToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Handle buying coins
  const handleConfirmRecharge = async () => {
    if (rechargeLoading || !selectedPkgId) return;
    setRechargeLoading(true); setRechargeError(null);
    try {
      const {data, error} = await supabase.rpc('create_recharge_request', {p_package_id: selectedPkgId});
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;
      if (!result) throw new Error('missing agent');
      setAgentInfo(result); setShowAgentModal(true);
      setSuccessToast('تم إنشاء طلب الشحن. يرجى الدفع للوكيل الرسمي.');
      scheduleTimeout(() => setSuccessToast(null), 3500);
    } catch (e) {
      console.error('Recharge request failed', e);
      const message = e && typeof e === 'object' && 'message' in e ? String(e.message) : '';
      setRechargeError(message.includes('no official recharge agent') ? 'لا يوجد وكيل شحن رسمي لبلدك حالياً.' : 'تعذر إنشاء طلب الشحن. تحقق من بلد الحساب وحاول مجدداً.');
    } finally { setRechargeLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 pb-20 select-none relative font-sans">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed top-6 inset-x-4 z-50 max-w-sm mx-auto p-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-center text-xs shadow-2xl flex items-center justify-center gap-2 animate-bounce">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. TOP HEADER (Exact Screenshot: 📄 Left, شحن العملات, > Right) */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-30 bg-white px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b border-slate-100 shadow-2xs">
        {/* Left Side: Notes / Transaction Record Icon */}
        <button
          type="button"
          onClick={() => setActiveSubScreen('wallet')}
          className="w-8 h-8 flex items-center justify-center text-slate-800 hover:opacity-80 active:scale-95 transition-transform cursor-pointer"
          title="سجل العمليات"
        >
          <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] fill-none stroke-slate-800 stroke-[2]">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="16" y2="17" />
          </svg>
        </button>

        {/* Center: Title "شحن العملات" */}
        <h1 className="text-[17px] font-bold text-slate-900 tracking-tight">
          شحن العملات
        </h1>

        {/* Right Side: Back Arrow > */}
        <button
          type="button"
          onClick={() => setActiveSubScreen(null)}
          className="w-8 h-8 flex items-center justify-center text-slate-900 hover:opacity-80 active:scale-95 transition-transform cursor-pointer"
          title="رجوع"
        >
          <ChevronRight size={24} className="stroke-[2.4]" />
        </button>
      </header>

      <p className="text-center text-xs text-slate-600 mt-3">الشحن للـCoins 🪙 فقط — عملة الشحن والإنفاق. Diamonds 💎 أرباح الهدايا.</p>
      {/* ============================================================== */}
      {/* 2. CAPSULE SWITCHER: [ أرباح الهدايا  |  عملات معدنية ]               */}
      {/* ============================================================== */}
      <div className="flex justify-center mt-3.5 px-4">
        <div className="bg-[#eef1f4] p-1 rounded-full flex items-center w-[240px] shadow-2xs">
          {/* أرباح الهدايا (Diamonds Tab - Left) */}
          <button
            type="button"
            onClick={() => setActiveTab('diamonds')}
            className={`flex-1 py-1.5 rounded-full text-[13px] font-bold transition-all cursor-pointer text-center ${
              activeTab === 'diamonds'
                ? 'bg-[#1ed760] text-white shadow-xs'
                : 'text-[#8e9aaf] hover:text-slate-600'
            }`}
          >
            أرباح الهدايا
          </button>

          {/* عملات معدنية (Coins Tab - Right) */}
          <button
            type="button"
            onClick={() => setActiveTab('coins')}
            className={`flex-1 py-1.5 rounded-full text-[13px] font-bold transition-all cursor-pointer text-center ${
              activeTab === 'coins'
                ? 'bg-[#1ed760] text-white shadow-xs'
                : 'text-[#8e9aaf] hover:text-slate-600'
            }`}
          >
            عملات معدنية
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: COINS (عملات معدنية) - Fast Persistent Rendering        */}
      {/* ============================================================== */}
      <div className={`px-4 mt-3.5 space-y-4 ${activeTab === 'coins' ? 'block' : 'hidden'}`}>
        {/* Exact Luxury Golden Balance Card - Active & Instantaneous */}
        <div
          onClick={() => setActiveSubScreen('wallet')}
          className="relative w-full rounded-[20px] overflow-hidden shadow-[0_8px_28px_rgba(234,179,8,0.22)] border-[2.5px] border-[#ecc45c] bg-gradient-to-r from-[#241708] via-[#35230e] to-[#1c1106] transition-all hover:shadow-[0_10px_32px_rgba(234,179,8,0.35)] active:scale-[0.99] cursor-pointer group"
          title="انقر لعرض سجل العمليات والمحفظة"
        >
          {/* Active Interactive Tag */}
          <div className="absolute top-2.5 left-2.5 z-20 px-2.5 py-0.5 rounded-full bg-black/60 border border-amber-400/60 text-[10px] text-amber-200 font-bold flex items-center gap-1 backdrop-blur-xs shadow-xs group-hover:bg-amber-500 group-hover:text-black transition-colors">
            <span>سجل العمليات</span>
            <span className="text-[10px]">📜</span>
          </div>

          {/* Base Panoramic Luxury Banner Template */}
          <div className="relative w-full aspect-[3.15/1] overflow-hidden">
            <img
              src="/assets/images/gold_balance_banner_1790372661010.jpg"
              alt="رصيد العملات الحالي"
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover object-center select-none"
              draggable={false}
            />

            {/* Exact Centered Typography & Balance Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none px-14 sm:px-20 z-10">
              {/* Golden Glowing Title: رصيد العملات الحالي */}
              <h3 className="text-[13px] sm:text-[15px] font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd35b] to-[#b37c15] drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                رصيد العملات الحالي
              </h3>

              {/* Crisp Glowing Pure White Numbers */}
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <span className="text-[20px] sm:text-[27px] font-black text-white font-mono tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] filter contrast-125">
                  {(user.gold ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

          {/* Section Title: كمية الشحن */}
          <div className="text-right pt-0.5">
            <h2 className="text-[15px] font-bold text-slate-800">
              كمية الشحن
            </h2>
          </div>

          {packagesLoading && <p role="status" className="text-center text-sm text-slate-500">جارٍ تحميل باقات الشحن…</p>}
          {!packagesLoading && !rechargeError && coinPackages.length === 0 && <p className="text-center text-sm text-slate-500">لا توجد باقات شحن متاحة حالياً.</p>}
          {/* Grid of 6 Packages (3 Columns x 2 Rows) */}
          <div className="grid grid-cols-3 gap-2.5">
            {coinPackages.map((pkg) => {
              const isSelected = selectedPkgId === pkg.id;
              // Package 1 (4900) has solid golden-yellow price strip with white text
              const isGoldenStrip = pkg.id === 1 || isSelected;

              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPkgId(pkg.id)}
                  className={`relative rounded-[16px] overflow-hidden border transition-all cursor-pointer flex flex-col justify-between shadow-2xs ${
                    pkg.id === 1
                      ? 'border-amber-300 bg-[#fefaf0]'
                      : isSelected
                      ? 'border-amber-400 bg-white shadow-md'
                      : 'border-slate-100/80 bg-white hover:border-slate-200'
                  }`}
                >
                  {/* Top: 3D Gold Coin Stack Asset on Pure Clean Surface */}
                  <div className="p-2.5 flex flex-col items-center justify-center min-h-[76px]">
                    <div className="w-14 h-12 flex items-center justify-center overflow-hidden">
                      <img
                        src={pkg.image}
                        alt={`coins ${pkg.coins}`}
                        className="w-full h-full object-contain filter drop-shadow-xs mix-blend-multiply"
                      />
                    </div>
                    <span className="font-extrabold text-[15px] text-slate-900 font-mono mt-0.5">
                      {pkg.coins}
                    </span>
                  </div>

                  {/* Bottom: Price Strip */}
                  <div
                    className={`w-full py-1.5 text-center font-bold text-xs tracking-tight ${
                      isGoldenStrip
                        ? 'bg-[#ffb300] text-white'
                        : 'bg-[#fffbeb] text-amber-950'
                    }`}
                  >
                    {pkg.price}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Green CTA Button: تأكيد الشحن */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleConfirmRecharge}
              disabled={rechargeLoading || packagesLoading || !selectedPkgId}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#2cdb7f] to-[#1ec76f] hover:from-[#25c672] hover:to-[#19b563] active:scale-[0.99] text-white font-bold text-[16px] shadow-[0_6px_18px_rgba(44,219,127,0.35)] transition-all cursor-pointer"
            >
              تأكيد الشحن
            </button>
          </div>
{rechargeError && (
  <div role="alert" className="mt-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-center">
    <p className="text-sm font-bold text-red-600">
      {rechargeError}
    </p>
  </div>
)}
          {/* Bottom Cyan Note */}
          <div className="text-center pt-2 pb-4">
            <p className="text-[12px] text-[#0284c7] font-semibold leading-relaxed">
              إذا لم يتم شحن العملات خلال 3 دقائق
            </p>
            <button
              type="button"
              onClick={() => setShowOrderCheckModal(true)}
              className="text-[12px] text-[#0284c7] font-bold underline cursor-pointer hover:text-sky-700"
            >
              يرجى النقر هنا للتحقق من الطلب
            </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 2: DIAMONDS (أرباح الهدايا) - Fast Persistent Rendering            */}
      {/* ============================================================== */}
      <div className={`px-4 mt-3.5 space-y-4 ${activeTab === 'diamonds' ? 'block' : 'hidden'}`}>
        {/* Panoramic Luxury Royal Blue & Gold Diamond Card - Active & Instant */}
        <div
          onClick={() => setShowConvertModal(true)}
          className="relative w-full rounded-[20px] overflow-hidden shadow-[0_8px_28px_rgba(0,140,255,0.25)] border-[2.5px] border-[#ecc45c] bg-gradient-to-r from-[#031d52] via-[#073087] to-[#02143d] transition-all hover:shadow-[0_10px_32px_rgba(0,140,255,0.38)] active:scale-[0.99] cursor-pointer group"
          title="انقر لفك وتحويل الماس إلى كونز مباشرة"
        >
          {/* Active Shortcut Tag */}
          <div className="absolute top-2.5 left-2.5 z-20 px-2.5 py-0.5 rounded-full bg-black/60 border border-cyan-400/60 text-[10px] text-cyan-200 font-bold flex items-center gap-1 backdrop-blur-xs shadow-xs group-hover:bg-cyan-500 group-hover:text-black transition-colors">
            <span>انقر للتحويل</span>
            <span className="text-[10px]">💎</span>
          </div>

          {/* Base Panoramic Luxury Diamond Banner Template */}
          <div className="relative w-full aspect-[3.15/1] overflow-hidden">
            <img
              src="/assets/images/diamond_banner_template_1790373461489.jpg"
              alt="أرباح الهدايا"
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover object-center select-none"
              draggable={false}
            />

            {/* Exact Centered Typography & Diamonds Balance Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none px-14 sm:px-20 z-10">
              {/* Glowing Title: أرباح الهدايا */}
              <h3 className="text-[14px] sm:text-[16px] font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] via-[#e0f2fe] to-[#7dd3fc] drop-shadow-[0_2px_6px_rgba(0,30,90,0.95)]">
                أرباح الهدايا
              </h3>

              {/* Crisp Glowing Pure White Numbers & Diamond Icon */}
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <span className="text-[20px] sm:text-[27px] font-black text-white font-mono tracking-tight drop-shadow-[0_2px_10px_rgba(0,20,70,0.95)] filter contrast-125">
                  {user.diamonds > 0 ? user.diamonds.toLocaleString() : '0.0'}
                </span>
                <span className="text-base sm:text-lg filter drop-shadow-[0_0_8px_rgba(56,189,248,0.9)] animate-pulse">
                  💎
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Subtitle: Diamonds 💎 أرباح استلام الهدايا فقط */}
        <div className="text-center pt-2">
          <p className="text-[13px] text-[#8e9aaf] font-semibold">
            Diamonds 💎 أرباح استلام الهدايا فقط
          </p>
        </div>

        {/* Sky-Blue CTA Button: تحويل */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowConvertModal(true)}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#29b6f6] via-[#0288d1] to-[#0277bd] hover:from-[#039be5] hover:to-[#01579b] active:scale-[0.99] text-white font-bold text-[16px] shadow-[0_6px_20px_rgba(41,182,246,0.35)] transition-all cursor-pointer"
          >
            تحويل
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. SOURCE-AWARE DIAMOND REDEMPTION*/}
      {/* ============================================================== */}
      {showConvertModal && <DiamondRedeemModal onClose={() => setShowConvertModal(false)} />}
{showAgentModal && agentInfo && (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
    <div className="w-full max-w-sm bg-white rounded-3xl p-5 text-right" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">وكيل الشحن الرسمي</h3>

        <button onClick={() => setShowAgentModal(false)}>
          <X size={20} />
        </button>
      </div>

      <p className="text-sm text-slate-500 mb-2">
        {agentInfo.country_name}
      </p>

      <div className="bg-emerald-50 rounded-2xl p-3 mb-3">
        <p className="text-sm">الكونز</p>
        <p className="font-bold text-blue-700">
          {Number(agentInfo.gold_amount).toLocaleString()}
        </p>

        <p className="text-sm mt-1">
          السعر: {Number(agentInfo.price_usd).toFixed(2)} $
        </p>
      </div>

      <div className="bg-slate-50 rounded-2xl p-3 mb-3">
        <p className="text-sm text-slate-500">الوكيل</p>

        <p className="font-bold">
          {agentInfo.agent_display_name || 'الوكيل الرسمي'}
        </p>

        {agentInfo.agent_phone && (
          <p dir="ltr" className="text-sm mt-1">
            {agentInfo.agent_phone}
          </p>
        )}
      </div>

      {agentInfo.payment_methods && (
        <div className="bg-blue-50 rounded-2xl p-3 mb-3">
          <p className="text-sm text-slate-500">طرق الدفع</p>

          <p className="text-sm mt-1">
            {Array.isArray(agentInfo.payment_methods)
              ? agentInfo.payment_methods.join(' • ')
              : JSON.stringify(agentInfo.payment_methods)}
          </p>
        </div>
      )}

      {agentInfo.contact_info?.channel === 'in_app' && agentInfo.contact_info?.public_id && (
        <button type="button" disabled={opening} onClick={() => void openChat(agentInfo.contact_info.public_id)}
          className="w-full py-3 mb-3 rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-50">
          {opening ? 'جارٍ فتح المحادثة…' : 'تواصل مع وكيل الشحن داخل التطبيق'}
        </button>
      )}

      <p className="text-xs text-slate-500 leading-6 mb-4">
        الدفع يتم خارج التطبيق للوكيل الرسمي. بعد تأكيد الدفع تتم إضافة الكونز إلى محفظتك.
      </p>

      <button
        onClick={() => setShowAgentModal(false)}
        className="w-full py-3 rounded-full bg-slate-800 text-white font-bold"
      >
        تم
      </button>
    </div>
  </div>
)}
      {/* ============================================================== */}
      {/* 4. ORDER CHECK MODAL                                           */}
      {/* ============================================================== */}
      {showOrderCheckModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setShowOrderCheckModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X size={18} />
              </button>
              <h3 className="text-base font-bold text-slate-800">التحقق من حالة الشحن</h3>
            </div>

            <div className="my-4 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl">
                ✓
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                طلب الشحن يبقى قيد الانتظار إلى أن يتم الدفع للوكيل الرسمي وتأكيد العملية. بعد التأكيد تتم إضافة الكونز إلى محفظتك.
              </p>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 font-mono" dir="ltr">

              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowOrderCheckModal(false)}
              className="w-full py-2.5 rounded-full bg-slate-800 text-white font-bold text-xs cursor-pointer"
            >
              حسناً
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

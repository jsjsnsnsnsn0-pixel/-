import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { FillInfoScreen } from './FillInfoScreen';
import {
  ChevronRight,
  Smartphone,
  Headphones,
  FileText,
  ShieldCheck,
  X,
  Check,
  PhoneCall,
  MessageCircle,
  UserCheck,
  UserPlus,
  AlertCircle,
} from 'lucide-react';

interface GoogleAccountProfile {
  name: string;
  email: string;
  picture: string;
}

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, loginWithPhone, user } = useApp();

  // Screen mode: 'options' or 'fill_info'
  const [screenMode, setScreenMode] = useState<'options' | 'fill_info'>('options');

  // Modals state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showGoogleAccountsSheet, setShowGoogleAccountsSheet] = useState(true);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [showMaxAccountsNotice, setShowMaxAccountsNotice] = useState(false);

  // Phone modal states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState('+964');

  // Track created accounts count (max 5)
  const getCreatedAccountsCount = (): number => {
    try {
      const saved = localStorage.getItem('toti_created_accounts_count');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  };

  const incrementCreatedAccountsCount = (): boolean => {
    try {
      const current = getCreatedAccountsCount();
      if (current >= 5) {
        return false;
      }
      localStorage.setItem('toti_created_accounts_count', (current + 1).toString());
      return true;
    } catch {
      return true;
    }
  };

  // Detect and prompt official Google Accounts if client is loaded
  const handleGoogleClick = () => {
    const count = getCreatedAccountsCount();
    if (count >= 5) {
      setShowMaxAccountsNotice(true);
      return;
    }

    // Check if Google GIS is available in window
    const gWindow = window as any;
    if (gWindow.google && gWindow.google.accounts && gWindow.google.accounts.id) {
      try {
        gWindow.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setShowGoogleAccountsSheet(true);
          }
        });
        setShowGoogleAccountsSheet(true);
        return;
      } catch {
        setShowGoogleAccountsSheet(true);
        return;
      }
    }
    // Show Google Accounts picker sheet
    setShowGoogleAccountsSheet(true);
  };

  const handleSelectGoogleAccount = (acc: GoogleAccountProfile) => {
    const accountKey = acc.email ? acc.email.toLowerCase().trim() : '';
    const isExistingAccount = Boolean(
      accountKey && localStorage.getItem(`toti_account_${accountKey}`)
    );

    // If it's a new account, check the 5 account quota
    if (!isExistingAccount) {
      const count = getCreatedAccountsCount();
      if (count >= 5) {
        setShowGoogleAccountsSheet(false);
        setShowMaxAccountsNotice(true);
        return;
      }
      incrementCreatedAccountsCount();
    }

    setShowGoogleAccountsSheet(false);
    loginWithGoogle({
      name: acc.name,
      email: acc.email,
      picture: acc.picture,
    });
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) return;
    const accountKey = customGoogleEmail.toLowerCase().trim();
    const isExistingAccount = Boolean(
      accountKey && localStorage.getItem(`toti_account_${accountKey}`)
    );

    if (!isExistingAccount) {
      const count = getCreatedAccountsCount();
      if (count >= 5) {
        setShowGoogleAccountsSheet(false);
        setShowMaxAccountsNotice(true);
        return;
      }
      incrementCreatedAccountsCount();
    }

    const displayName = customGoogleName.trim() || customGoogleEmail.split('@')[0];
    setShowGoogleAccountsSheet(false);
    loginWithGoogle({
      name: displayName,
      email: customGoogleEmail.trim(),
      picture: '/src/assets/images/avatar_male_ghutra_1790628422202.jpg',
    });
  };

  // Country options
  const countries = [
    { code: '+964', name: 'العراق', flag: '🇮🇶' },
    { code: '+966', name: 'السعودية', flag: '🇸🇦' },
    { code: '+963', name: 'سوريا', flag: '🇸🇾' },
    { code: '+971', name: 'الإمارات', flag: '🇦🇪' },
    { code: '+965', name: 'الكويت', flag: '🇰🇼' },
    { code: '+20', name: 'مصر', flag: '🇪🇬' },
    { code: '+962', name: 'الأردن', flag: '🇯🇴' },
  ];

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      if (phoneNumber.length >= 7) {
        setOtpSent(true);
      }
    } else {
      setShowPhoneModal(false);
      setScreenMode('fill_info');
    }
  };

  // If new registration info screen is active
  if (screenMode === 'fill_info') {
    return <FillInfoScreen onBack={() => setScreenMode('options')} />;
  }

  return (
    <div className="relative min-h-screen w-full max-w-md mx-auto overflow-hidden bg-black text-white select-none flex flex-col justify-between font-sans">
      {/* 1. CLEAN TEMPLATE BACKGROUND (Crowned Royal Falcon, Halo, Soundwaves & 3D Toti Chat logo) */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/toti_clean_bg_1790424891818.jpg"
          alt="Toti Chat Background Template"
          className="w-full h-full object-cover"
        />
        {/* Subtle lighting overlay for seamless integration */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* 2. TOP UNTOUCHED AREA: Preserves the entire crowned falcon, rings, and brand title */}
      <div className="relative z-10 w-full flex-1 min-h-[46vh] pointer-events-none" />

      {/* 3. INTERACTIVE LOGIN CONTROLS (Pixel-crafted to match the reference design) */}
      <div className="relative z-10 w-full px-6 pb-7 pt-1 space-y-3.5">
        {/* BUTTON 1: GOOGLE SIGN-IN (Glossy White Pill with 3D Bevel) */}
        <button
          onClick={handleGoogleClick}
          type="button"
          className="w-full h-[54px] rounded-full bg-gradient-to-b from-white via-[#f8fafc] to-[#e2e8f0] text-slate-900 shadow-[0_6px_22px_rgba(255,255,255,0.28),inset_0_2px_2px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(0,0,0,0.12)] flex items-center justify-between px-6 cursor-pointer active:scale-[0.98] transition-all border border-white hover:brightness-105"
        >
          {/* Left: Google Multi-color "G" Logo */}
          <div className="w-7 h-7 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-6 h-6">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>

          {/* Center-Right: Arabic Title */}
          <span className="font-black text-[16px] text-[#0f172a] tracking-tight">
            سجل الدخول عبر جوجل
          </span>

          {/* Far Right: Black Chevron */}
          <ChevronRight size={20} className="text-black stroke-[3]" />
        </button>

        {/* BUTTON 2: PHONE SIGN-IN (Radiant Warm Gold Pill with 3D Bevel) */}
        <button
          onClick={() => setShowPhoneModal(true)}
          type="button"
          className="w-full h-[54px] rounded-full bg-gradient-to-r from-[#d97706] via-[#fbbf24] to-[#f59e0b] text-slate-950 shadow-[0_6px_25px_rgba(245,158,11,0.55),inset_0_2px_3px_rgba(255,255,255,0.7),inset_0_-2px_4px_rgba(180,83,9,0.5)] flex items-center justify-between px-6 cursor-pointer active:scale-[0.98] transition-all border-2 border-amber-300 hover:brightness-105"
        >
          {/* Left: Smartphone Icon */}
          <div className="w-7 h-7 flex items-center justify-center shrink-0">
            <Smartphone size={24} className="text-slate-950 stroke-[2.5]" />
          </div>

          {/* Center-Right: Arabic Title */}
          <span className="font-black text-[16px] text-slate-950 tracking-tight">
            سجل الدخول عبر الهاتف
          </span>

          {/* Far Right: Black Chevron */}
          <ChevronRight size={20} className="text-slate-950 stroke-[3]" />
        </button>

        {/* HORIZONTAL DIVIDER & USAGE POLICY */}
        <div className="pt-1">
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-amber-500/40 to-transparent mb-2.5" />

          {/* سياسة الاستخدام Link */}
          <button
            onClick={() => setShowTermsModal(true)}
            type="button"
            className="w-full flex items-center justify-center gap-2 text-slate-300 hover:text-amber-300 transition-colors py-1 cursor-pointer"
          >
            <ChevronRight size={14} className="text-amber-400 stroke-[2.5]" />
            <span className="text-[13px] font-bold tracking-wide">
              سياسة الاستخدام
            </span>
            <div className="relative">
              <FileText size={16} className="text-amber-300" />
              <ShieldCheck
                size={10}
                className="absolute -bottom-1 -left-1 text-emerald-400 bg-black rounded-full"
              />
            </div>
          </button>
        </div>

        {/* CUSTOMER SUPPORT CARD (Rounded Dark Glass Container with Gold Accents) */}
        <div
          onClick={() => setShowSupportModal(true)}
          className="w-full py-3.5 px-5 rounded-2xl bg-[#14121a]/90 border border-amber-500/35 flex items-center justify-between cursor-pointer hover:border-amber-400/60 active:scale-[0.99] transition-all shadow-xl backdrop-blur-md mt-1"
        >
          {/* Left: Golden Headset Icon */}
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Headphones size={22} className="text-amber-400 stroke-[2.2]" />
          </div>

          {/* Middle: 2 Lines of Arabic Description */}
          <div className="text-right flex-1 px-3">
            <p className="text-[12px] font-medium text-slate-300 leading-snug">
              اذا واجهة مشكله في تسجيل الدخول
            </p>
            <p className="text-[12px] font-bold text-amber-300 leading-snug mt-0.5">
              يمكنك التواصل معنا
            </p>
          </div>

          {/* Far Right: Golden Chevron */}
          <ChevronRight size={18} className="text-amber-400 stroke-[2.5]" />
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: PHONE LOGIN (Interactive OTP Flow)                     */}
      {/* ============================================================== */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-amber-500/40 p-5 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                onClick={() => {
                  setShowPhoneModal(false);
                  setOtpSent(false);
                }}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">تسجيل الدخول عبر رقم الهاتف</span>
                <span className="text-lg">📱</span>
              </div>
            </div>

            <form onSubmit={handlePhoneSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رقم الهاتف:
                </label>
                <div className="flex items-center gap-2" dir="ltr">
                  <select
                    value={selectedCountryCode}
                    onChange={(e) => setSelectedCountryCode(e.target.value)}
                    className="h-11 px-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-amber-300 focus:outline-hidden focus:border-amber-400"
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="771 331 2563"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="flex-1 h-11 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              {otpSent && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-emerald-400 mb-1.5">
                    رمز التحقق (SMS OTP):
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="أدخل الرمز المكون من 4 أو 6 أرقام"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-800 border border-emerald-500/50 text-center font-mono text-base tracking-widest text-white focus:outline-hidden focus:border-emerald-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    تم إرسال رمز التحقق التجريبي إلى رقمك بنجاح.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer mt-2"
              >
                {!otpSent ? 'إرسال رمز التحقق' : 'تأكيد ودخول الحساب'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: USAGE POLICY / TERMS MODAL                             */}
      {/* ============================================================== */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-amber-500/40 p-5 shadow-2xl text-right max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">سياسة الاستخدام والخصوصية</span>
                <span className="text-lg">📜</span>
              </div>
            </div>

            <div className="overflow-y-auto text-xs text-slate-300 space-y-3 pt-3 leading-relaxed">
              <p className="font-bold text-amber-300">
                أهلاً بك في منصة وتطبيق توتي شات (Toti Chat)
              </p>
              <p>
                1. احترام المستخدمين: يلتزم جميع الأعضاء بالاحترام المتبادل داخل الرومات الصوتية والدردشات الخاصة.
              </p>
              <p>
                2. أمان الحساب: معلومات حسابك ومحفظتك وأرصدتك مشفرة ومحمية بأعلى معايير الأمان الملكي.
              </p>
              <p>
                3. شحن الكونزات والألماس: تتم عمليات الشحن بصورة آمنة ومباشرة مع ضمان وصول الرصيد فوراً للحساب.
              </p>
              <p>
                4. سياسة المجتمع: يمنع استخدام أي ألفاظ أو سلوكيات تضر بالبيئة الترفيهية الراقية للتطبيق.
              </p>
            </div>

            <button
              onClick={() => setShowTermsModal(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shrink-0 cursor-pointer"
            >
              موافق وفهمت الشروط
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: CUSTOMER SUPPORT & CONTACT MODAL                      */}
      {/* ============================================================== */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-amber-500/40 p-5 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                onClick={() => setShowSupportModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-300">خدمة العملاء والدعم الفني</span>
                <Headphones size={18} className="text-amber-400" />
              </div>
            </div>

            <div className="my-4 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center mx-auto mb-2 text-amber-400">
                <Headphones size={28} />
              </div>
              <h3 className="text-sm font-bold text-white">السيد حـمـدان</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                المسؤول الرسمي لخدمة العملاء وحل مشاكل تسجيل الدخول
              </p>
            </div>

            <div className="space-y-2.5">
              <a
                href="tel:+9647726450081"
                className="w-full py-3 px-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 flex items-center justify-between text-emerald-300 text-xs font-bold transition-colors"
              >
                <span className="font-mono text-sm" dir="ltr">+964 772 645 0081</span>
                <div className="flex items-center gap-2">
                  <span>الاتصال المباشر</span>
                  <PhoneCall size={16} />
                </div>
              </a>

              <a
                href="https://wa.me/9647726450081"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-green-950/60 border border-green-500/40 hover:bg-green-900/60 flex items-center justify-between text-green-300 text-xs font-bold transition-colors"
              >
                <span className="font-mono text-xs" dir="ltr">+964 772 645 0081</span>
                <div className="flex items-center gap-2">
                  <span>محادثة واتساب</span>
                  <MessageCircle size={16} />
                </div>
              </a>
            </div>

            <p className="text-[11px] text-slate-500 text-center mt-4">
              نعمل على مدار 24 ساعة لخدمتكم وضمان تجربة سلسة في توتي شات.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: GOOGLE ACCOUNTS PICKER - EXACT ANDROID GMS DESIGN      */}
      {/* ============================================================== */}
      {showGoogleAccountsSheet && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200"
          dir="rtl"
          onClick={() => setShowGoogleAccountsSheet(false)}
        >
          {/* Exact Android GMS Google Account Picker Box from screenshot */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[370px] bg-[#323232] text-white rounded-[26px] shadow-2xl overflow-hidden font-sans border border-white/5 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] relative"
          >
            {/* Close button on top-right */}
            <button
              type="button"
              onClick={() => setShowGoogleAccountsSheet(false)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              title="إغلاق"
            >
              <X size={18} />
            </button>

            {/* Top Logo & App Header */}
            <div className="pt-6 pb-5 px-6 text-center flex flex-col items-center">
              {/* App Icon: Golden lion & crowned falcon logo on dark background with Toti Chat - توتي شات */}
              <div className="w-[62px] h-[62px] rounded-2xl overflow-hidden shadow-xl mb-3.5 bg-black border border-amber-500/30 flex items-center justify-center p-0.5">
                <img
                  src="/src/assets/images/imperial_lion_crest_1790230829162.jpg"
                  alt="Toti Chat App Logo"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>

              {/* Title: اختيار حساب */}
              <h2 className="text-[22px] font-normal text-white tracking-normal mb-1.5">
                اختيار حساب
              </h2>

              {/* Subtitle: لمتابعة استخدام توتي شات */}
              <p className="text-[15px] text-[#e0e0e0] font-normal">
                لمتابعة استخدام توتي شات
              </p>
            </div>

            {/* Scrollable Accounts List with thin subtle dividers */}
            <div className="flex-1 overflow-y-auto px-5 divide-y divide-white/[0.08]">
              {/* Account 1: Mx Iraq */}
              <div
                onClick={() =>
                  handleSelectGoogleAccount({
                    name: 'Mx Iraq',
                    email: 'mxiraq02@gmail.com',
                    picture: '/src/assets/images/syrian_host_avatar_1790345251849.jpg',
                  })
                }
                className="py-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <div className="text-right">
                  <span className="text-[15px] font-normal text-white block leading-tight">
                    Mx Iraq
                  </span>
                  <span className="text-[13px] text-[#9e9e9e] dir-ltr text-right block mt-0.5">
                    mxiraq02@gmail.com
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#757575] text-white flex items-center justify-center font-normal text-[15px] shrink-0">
                  Mx
                </div>
              </div>

              {/* Account 2: Jvnn Nv */}
              <div
                onClick={() =>
                  handleSelectGoogleAccount({
                    name: 'Jvnn Nv',
                    email: 'jnv712472@gmail.com',
                    picture: '/src/assets/images/mr_balmain_avatar_1790227488334.jpg',
                  })
                }
                className="py-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <div className="text-right">
                  <span className="text-[15px] font-normal text-white block leading-tight">
                    Jvnn Nv
                  </span>
                  <span className="text-[13px] text-[#9e9e9e] dir-ltr text-right block mt-0.5">
                    jnv712472@gmail.com
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#f4511e] text-white flex items-center justify-center font-normal text-[17px] shrink-0">
                  J
                </div>
              </div>

              {/* Account 3: Mr. Balmain */}
              <div
                onClick={() =>
                  handleSelectGoogleAccount({
                    name: 'Mr. Balmain',
                    email: 'mrbalmain11@gmail.com',
                    picture: '/src/assets/images/mr_balmain_avatar_1790227488334.jpg',
                  })
                }
                className="py-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <div className="text-right">
                  <span className="text-[15px] font-normal text-white block leading-tight">
                    Mr. Balmain
                  </span>
                  <span className="text-[13px] text-[#9e9e9e] dir-ltr text-right block mt-0.5">
                    mrbalmain11@gmail.com
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#e64a19] text-white flex items-center justify-center font-normal text-[17px] shrink-0">
                  M
                </div>
              </div>

              {/* Account 4: الشاعر حسن الزيادي */}
              <div
                onClick={() =>
                  handleSelectGoogleAccount({
                    name: 'الشاعر حسن الزيادي',
                    email: 'xznnnr@gmail.com',
                    picture: '/src/assets/images/syrian_host_avatar_1790345251849.jpg',
                  })
                }
                className="py-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <div className="text-right">
                  <span className="text-[15px] font-normal text-white block leading-tight">
                    الشاعر حسن الزيادي
                  </span>
                  <span className="text-[13px] text-[#9e9e9e] dir-ltr text-right block mt-0.5">
                    xznnnr@gmail.com
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 shrink-0">
                  <img
                    src="/src/assets/images/syrian_host_avatar_1790345251849.jpg"
                    alt="الشاعر حسن الزيادي"
                    className="w-full h-full object-cover filter grayscale contrast-125"
                  />
                </div>
              </div>

              {/* Account 5: Hdh H */}
              <div
                onClick={() =>
                  handleSelectGoogleAccount({
                    name: 'Hdh H',
                    email: 'h20373364@gmail.com',
                    picture: '/src/assets/images/imperial_lion_crest_1790230829162.jpg',
                  })
                }
                className="py-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <div className="text-right">
                  <span className="text-[15px] font-normal text-white block leading-tight">
                    Hdh H
                  </span>
                  <span className="text-[13px] text-[#9e9e9e] dir-ltr text-right block mt-0.5">
                    h20373364@gmail.com
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#8e24aa] text-white flex items-center justify-center font-normal text-[17px] shrink-0">
                  H
                </div>
              </div>

              {/* Account 6: Muhammad Al-Sini */}
              <div
                onClick={() =>
                  handleSelectGoogleAccount({
                    name: 'Muhammad Al-Sini',
                    email: 'dufgf9870@gmail.com',
                    picture: '/src/assets/images/official_mascot_1790421946401.jpg',
                  })
                }
                className="py-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <div className="text-right">
                  <span className="text-[15px] font-normal text-white block leading-tight">
                    Muhammad Al-Sini
                  </span>
                  <span className="text-[13px] text-[#9e9e9e] dir-ltr text-right block mt-0.5">
                    dufgf9870@gmail.com
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white shrink-0 p-0.5 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white text-xs">
                    👤
                  </div>
                </div>
              </div>

              {/* Account 7: محمد علي علي (jsjsnsnsnsn0@gmail.com) */}
              <div
                onClick={() =>
                  handleSelectGoogleAccount({
                    name: 'محمد علي علي',
                    email: 'jsjsnsnsnsn0@gmail.com',
                    picture: '/src/assets/images/avatar_male_ghutra_1790628422202.jpg',
                  })
                }
                className="py-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <div className="text-right">
                  <span className="text-[15px] font-normal text-white block leading-tight">
                    محمد علي علي
                  </span>
                  <span className="text-[13px] text-[#9e9e9e] dir-ltr text-right block mt-0.5">
                    jsjsnsnsnsn0@gmail.com
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#e64a19] text-white flex items-center justify-center font-normal text-[17px] shrink-0">
                  م
                </div>
              </div>

              {/* Account 8: Hdj Hh */}
              <div
                onClick={() =>
                  handleSelectGoogleAccount({
                    name: 'Hdj Hh',
                    email: 'hdjhh812@gmail.com',
                    picture: '/src/assets/images/avatar_male_ghutra_1790628422202.jpg',
                  })
                }
                className="py-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <div className="text-right">
                  <span className="text-[15px] font-normal text-white block leading-tight">
                    Hdj Hh
                  </span>
                  <span className="text-[13px] text-[#9e9e9e] dir-ltr text-right block mt-0.5">
                    hdjhh812@gmail.com
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#e64a19] text-white flex items-center justify-center font-normal text-[17px] shrink-0">
                  H
                </div>
              </div>

              {/* Account 9: محمد علي */}
              <div
                onClick={() =>
                  handleSelectGoogleAccount({
                    name: 'محمد علي',
                    email: 'bhsvjv9@gmail.com',
                    picture: '/src/assets/images/avatar_male_ghutra_1790628422202.jpg',
                  })
                }
                className="py-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <div className="text-right">
                  <span className="text-[15px] font-normal text-white block leading-tight">
                    محمد علي
                  </span>
                  <span className="text-[13px] text-[#9e9e9e] dir-ltr text-right block mt-0.5">
                    bhsvjv9@gmail.com
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#0288d1] text-white flex items-center justify-center font-normal text-[17px] shrink-0">
                  م
                </div>
              </div>

              {/* Row 10: إضافة حساب آخر (Add Account Row) */}
              <div
                onClick={() => setShowCustomGoogleInput(true)}
                className="py-4 flex items-center justify-between cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <span className="text-[15px] font-normal text-white">
                  إضافة حساب آخر
                </span>
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <UserPlus size={22} className="text-[#e0e0e0]" />
                </div>
              </div>
            </div>

            {/* Custom Google account input sub-dialog */}
            {showCustomGoogleInput && (
              <form
                onSubmit={handleCustomGoogleSubmit}
                className="p-4 bg-[#262626] border-t border-white/10 space-y-2.5 animate-in fade-in"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    إضافة حساب Google
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCustomGoogleInput(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    إلغاء
                  </button>
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#1c1c1c] border border-white/15 text-sm text-white focus:outline-hidden focus:border-amber-400 dir-ltr text-left"
                />
                <input
                  type="text"
                  placeholder="الاسم (اختياري)"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#1c1c1c] border border-white/15 text-sm text-white focus:outline-hidden focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  تسجيل الدخول
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: MAX 5 ACCOUNTS NOTICE (تنبيه الحد الأقصى 5 حسابات)     */}
      {/* ============================================================== */}
      {showMaxAccountsNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[#1e1e24] border border-amber-500/40 p-6 shadow-2xl text-center font-sans animate-in zoom-in-95 duration-200">
            {/* Warning Icon with Golden Glow */}
            <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <AlertCircle size={36} className="stroke-[2.2]" />
            </div>

            {/* Notice Title */}
            <h3 className="text-lg font-black text-white mb-2">
              تنبيه تسجيل الحسابات
            </h3>

            {/* Exact Warning Message requested by user */}
            <p className="text-sm font-bold text-amber-300 leading-relaxed bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 mb-5">
              ملاحظة: لا يمكنك إنشاء غير 5 حسابات فقط على هذا الجهاز.
            </p>

            <p className="text-xs text-slate-400 mb-5 leading-normal">
              لقد وصلت إلى الحد الأقصى المسموح به لإنشاء الحسابات الجديدة عبر هذا الجهاز للحفاظ على أمان المنصة.
            </p>

            {/* Confirm button */}
            <button
              type="button"
              onClick={() => setShowMaxAccountsNotice(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronRight, Headphones, Crown, X, Lock, Check } from 'lucide-react';

export const AgencyScreen: React.FC = () => {
  const { setActiveSubScreen, setSelectedChatUser } = useApp();
  const [modalType, setModalType] = useState<'agent' | 'host' | 'support' | null>(null);
  const [agentId, setAgentId] = useState('');
  const [password, setPassword] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentId.trim()) return;
    setLoginSuccess(true);
    setTimeout(() => {
      setLoginSuccess(false);
      setModalType(null);
    }, 1200);
  };

  const handleContactOfficialSupport = () => {
    // Open chat or redirect to official customer service ID 1000
    setSelectedChatUser({
      id: '1000',
      name: 'خدمة العملاء الرسمية 👑',
      avatar: '/src/assets/images/imperial_lion_crest_1790230829162.jpg',
      username: 'support_1000',
      level: 100,
      wealthLevel: 100,
      charmLevel: 100,
      vipLevel: 10,
      gold: 999999,
      diamonds: 999999,
      silverCoins: 999999,
      friendsCount: 9999,
      followersCount: 9999,
      followingCount: 1,
      visitorsCount: 99999,
      sentGiftsCount: '999K',
      receivedTotal: '999K',
      receivedGiftsCount: 9999,
      isHost: false,
      isOnline: true,
    });
    setActiveSubScreen('chat_detail');
  };

  return (
    <div
      className="relative min-h-screen w-full max-w-md mx-auto bg-[#030611] text-white select-none overflow-hidden font-sans flex flex-col justify-between"
      dir="rtl"
    >
      {/* Background Graphic: Majestic Lion & Falcon Artwork with glowing crowns */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/src/assets/images/agency_login_portal_1790714750581.jpg"
          alt="بوابة الوكالة الملكية"
          className="w-full h-full object-cover object-top filter brightness-[1.02]"
        />
        {/* Soft gradient overlay to enhance interactable buttons area */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-[#030611]/90" />
      </div>

      {/* Top Floating Header with Back Button */}
      <header className="relative z-30 p-4 flex items-center justify-between">
        <button
          onClick={() => setActiveSubScreen(null)}
          className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-amber-500/30 flex items-center justify-center text-amber-200 hover:text-white hover:bg-black/70 active:scale-95 transition-all shadow-lg cursor-pointer"
          aria-label="الرجوع"
        >
          <ChevronRight size={24} className="stroke-[2.5]" />
        </button>

        <div className="px-3.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-amber-500/20 text-xs font-bold text-amber-300">
          بوابة الوكالات
        </div>

        <div className="w-10" />
      </header>

      {/* Spacer to push interactive buttons into lower area matching visual composition */}
      <div className="flex-1" />

      {/* Bottom Interactive Area */}
      <div className="relative z-20 px-6 pb-10 space-y-4">
        {/* ============================================================== */}
        {/* 1. BUTTON: سجل الدخول وكيل (Agent Login Button)                */}
        {/* ============================================================== */}
        <button
          onClick={() => {
            setModalType('agent');
            setLoginSuccess(false);
          }}
          type="button"
          className="group relative w-full h-[64px] rounded-full p-[2px] bg-gradient-to-r from-[#d4af37] via-[#fff4b8] to-[#aa7c11] shadow-[0_8px_30px_rgba(212,175,55,0.45)] hover:shadow-[0_8px_35px_rgba(255,215,0,0.7)] active:scale-[0.98] transition-all cursor-pointer overflow-hidden"
        >
          {/* Inner Glossy Glass Body */}
          <div className="w-full h-full rounded-full bg-gradient-to-b from-[#1c1810] via-[#0d0c0a] to-[#1a150c] flex items-center justify-between px-6 border border-amber-500/30">
            {/* Left Crown Icon */}
            <div className="flex items-center gap-2">
              <span className="text-2xl filter drop-shadow-[0_2px_8px_rgba(251,191,36,0.8)]">
                👑
              </span>
              <div className="h-6 w-[1px] bg-amber-500/30 mr-1" />
            </div>

            {/* Arabic Label: سجل الدخول وكيل */}
            <span className="text-[19px] font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#fbbf24] to-[#f59e0b] tracking-wide filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              سجل الدخول وكيل
            </span>

            {/* Right Chevron */}
            <span className="text-2xl font-black text-amber-300 group-hover:-translate-x-1 transition-transform">
              &lt;
            </span>
          </div>

          {/* Shimmer light bar across button */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform pointer-events-none" />
        </button>

        {/* ============================================================== */}
        {/* 2. BUTTON: سجل الدخول مضيف (Host Login Button)                 */}
        {/* ============================================================== */}
        <button
          onClick={() => {
            setModalType('host');
            setLoginSuccess(false);
          }}
          type="button"
          className="group relative w-full h-[64px] rounded-full p-[2px] bg-gradient-to-r from-[#d4af37] via-[#fff4b8] to-[#aa7c11] shadow-[0_8px_30px_rgba(212,175,55,0.45)] hover:shadow-[0_8px_35px_rgba(255,215,0,0.7)] active:scale-[0.98] transition-all cursor-pointer overflow-hidden"
        >
          {/* Inner Glossy Glass Body */}
          <div className="w-full h-full rounded-full bg-gradient-to-b from-[#1c1810] via-[#0d0c0a] to-[#1a150c] flex items-center justify-between px-6 border border-amber-500/30">
            {/* Left Crown Icon */}
            <div className="flex items-center gap-2">
              <span className="text-2xl filter drop-shadow-[0_2px_8px_rgba(251,191,36,0.8)]">
                👑
              </span>
              <div className="h-6 w-[1px] bg-amber-500/30 mr-1" />
            </div>

            {/* Arabic Label: سجل الدخول مضيف */}
            <span className="text-[19px] font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#fbbf24] to-[#f59e0b] tracking-wide filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              سجل الدخول مضيف
            </span>

            {/* Right Chevron */}
            <span className="text-2xl font-black text-amber-300 group-hover:-translate-x-1 transition-transform">
              &lt;
            </span>
          </div>

          {/* Shimmer light bar across button */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform pointer-events-none" />
        </button>

        {/* ============================================================== */}
        {/* 3. DIVIDER & SUPPORT CONTACT (اذا واجهة مشكله يمكنك التواصل...) */}
        {/* ============================================================== */}
        <div className="pt-2 text-center space-y-3">
          {/* Elegant Royal Crown Divider */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-[1px] flex-1 bg-gradient-to-l from-amber-500/60 to-transparent" />
            <div className="w-5 h-5 flex items-center justify-center text-amber-300 text-xs">
              👑
            </div>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-amber-500/60 to-transparent" />
          </div>

          {/* Support Heading */}
          <div className="space-y-1">
            <p className="text-[15px] font-bold text-amber-100">
              اذا واجهة مشكله
            </p>
            <p className="text-[13px] font-medium text-amber-200/80">
              يمكنك التواصل معنا عبر المعرف الرسمي
            </p>
          </div>

          {/* Official Support ID Badge: 1000 + Headset */}
          <div className="flex flex-col items-center justify-center gap-1.5 pt-1">
            <button
              onClick={handleContactOfficialSupport}
              type="button"
              className="inline-flex items-center gap-3 px-7 py-2 rounded-full border border-amber-400/80 bg-black/60 hover:bg-black/90 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.35)] active:scale-95 transition-all cursor-pointer group"
            >
              {/* Headset Icon inside golden circle */}
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 p-[1.5px] flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-amber-400">
                  <Headphones size={15} />
                </div>
              </div>

              {/* ID: 1000 */}
              <span className="text-2xl font-black font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#ffeaa7] via-[#fdcb6e] to-[#fab1a0]">
                1000
              </span>
            </button>

            <span className="text-[11px] font-bold text-amber-300/80 tracking-wide">
              خدمة العملاء
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* LOGIN MODAL (وكيل / مضيف)                                       */}
      {/* ============================================================== */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#11131f] border border-amber-500/40 p-6 shadow-2xl text-right font-sans animate-in zoom-in-95 duration-200 relative">
            {/* Close button */}
            <button
              onClick={() => setModalType(null)}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg">
                👑
              </div>
              <h3 className="text-lg font-black text-amber-200">
                {modalType === 'agent' ? 'تسجيل دخول وكيل معتمد' : 'تسجيل دخول مضيف وكالة'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                أدخل معرف الوكالة وكلمة المرور الخاصة بك للمتابعة
              </p>
            </div>

            {/* Form */}
            {loginSuccess ? (
              <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-center space-y-2 animate-in fade-in">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto">
                  <Check size={20} className="stroke-[3]" />
                </div>
                <p className="text-xs font-bold text-emerald-300">
                  تم تسجيل الدخول بنجاح! جاري تحويلك...
                </p>
              </div>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {modalType === 'agent' ? 'معرف الوكيل (Agency ID):' : 'معرف المضيف (Host ID):'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 1000 أو 1331"
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 font-mono text-left dir-ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    كلمة المرور:
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 px-3.5 pr-10 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 font-mono text-left dir-ltr"
                    />
                    <Lock size={16} className="absolute right-3.5 top-3 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-lg active:scale-95 transition-all cursor-pointer mt-2"
                >
                  دخول لوحة التحكم
                </button>
              </form>
            )}

            {/* Official Support Link inside Modal */}
            <div className="mt-4 pt-3 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={() => {
                  setModalType(null);
                  handleContactOfficialSupport();
                }}
                className="text-[11px] text-amber-300/80 hover:text-amber-200 underline cursor-pointer"
              >
                نسيت كلمة المرور؟ تواصل مع خدمة العملاء (1000)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

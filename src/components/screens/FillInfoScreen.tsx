import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getNextSequentialId } from '../../utils/accountIds';
import { ChevronLeft, Check } from 'lucide-react';

interface FillInfoScreenProps {
  onComplete?: () => void;
  onBack?: () => void;
}

const defaultAvatars = {
  male: '/src/assets/images/avatar_male_ghutra_1790628422202.jpg',
  female: '/src/assets/images/avatar_female_ghutra_1790628438051.jpg',
};

const countries = [
  { name: 'العراق', code: 'IQ', flag: '🇮🇶' },
  { name: 'المملكة العربية السعودية', code: 'SA', flag: '🇸🇦' },
  { name: 'سوريا', code: 'SY', flag: '🇸🇾' },
  { name: 'الإمارات العربية المتحدة', code: 'AE', flag: '🇦🇪' },
  { name: 'الكويت', code: 'KW', flag: '🇰🇼' },
  { name: 'قطر', code: 'QA', flag: '🇶🇦' },
  { name: 'البحرين', code: 'BH', flag: '🇧🇭' },
  { name: 'سلطنة عمان', code: 'OM', flag: '🇴🇲' },
  { name: 'الأردن', code: 'JO', flag: '🇯🇴' },
  { name: 'مصر', code: 'EG', flag: '🇪🇬' },
  { name: 'اليمن', code: 'YE', flag: '🇾🇪' },
  { name: 'لبنان', code: 'LB', flag: '🇱🇧' },
];

export const FillInfoScreen: React.FC<FillInfoScreenProps> = ({ onComplete, onBack }) => {
  const { user, setUser, setIsAuthenticated, setActiveTab, setActiveSubScreen } = useApp();

  // State matching screenshot fields
  const [selectedGender, setSelectedGender] = useState<'female' | 'male'>('male');
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('2000-01-01');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);

  // Modal / selector pickers
  const [showNameModal, setShowNameModal] = useState(false);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [tempName, setTempName] = useState('');

  // Handle completing registration with the sequential ID
  const handleComplete = () => {
    try {
      const savedCount = localStorage.getItem('toti_created_accounts_count');
      const count = savedCount ? parseInt(savedCount, 10) : 0;
      localStorage.setItem('toti_created_accounts_count', (count + 1).toString());
    } catch {
      // ignore
    }

    const finalName = name.trim() || (selectedGender === 'male' ? 'مستخدم جديد' : 'مستخدمة جديدة');
    const assignedAvatar = defaultAvatars[selectedGender];

    // Atomically get and increment the sequential ID
    const newSequentialId = getNextSequentialId();

    setUser((prev) => ({
      ...prev,
      id: newSequentialId,
      username: `user_${newSequentialId}`,
      name: finalName,
      gender: selectedGender,
      avatar: assignedAvatar,
      birthday: birthday,
      country: selectedCountry.name,
      countryCode: selectedCountry.code,
      countryFlag: selectedCountry.flag,
      // Fresh new user levels & starting gifts
      level: 1,
      wealthLevel: 1,
      charmLevel: 1,
      vipLevel: 0,
      gold: 5000,
      diamonds: 1000,
      silverCoins: 10000,
      bio: 'مرحباً بي في توتي شات 🌹',
      friendsCount: 0,
      followersCount: 0,
      followingCount: 0,
      visitorsCount: 1,
      sentGiftsCount: '0',
      receivedTotal: '0',
      receivedGiftsCount: 0,
      isHost: false,
      agencyName: undefined,
      agencyOwner: undefined,
      agencyId: undefined,
      agencyMembersCount: undefined,
      agencyAvatar: undefined,
      coupleName: undefined,
      coupleAvatar: undefined,
      customTitle: undefined,
      nameShimmerStyle: undefined,
      nobleRank: undefined,
      rankingTitle: undefined,
    }));

    setIsAuthenticated(true);
    setActiveTab('home');
    setActiveSubScreen(null);

    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div
      className="relative min-h-screen w-full max-w-md mx-auto bg-[#fafafa] text-[#1c1c1e] select-none flex flex-col justify-between font-sans overflow-x-hidden"
      dir="rtl"
    >
      {/* ============================================================== */}
      {/* 1. TOP HEADER: "ملء المعلومات" + Back Chevron                     */}
      {/* ============================================================== */}
      <header className="px-5 pt-8 pb-3 flex items-center justify-between">
        {/* Right Exit / Back chevron (as seen on screenshot right side in RTL) */}
        <button
          type="button"
          onClick={() => {
            if (onBack) onBack();
            else setActiveSubScreen(null);
          }}
          className="w-10 h-10 flex items-center justify-center text-slate-900 active:scale-90 transition-transform cursor-pointer"
          title="رجوع"
        >
          <ChevronLeft size={28} className="stroke-[2.6] rotate-180" />
        </button>

        {/* Center Title */}
        <h1 className="text-[19px] font-bold text-slate-900 tracking-tight">
          ملء المعلومات
        </h1>

        {/* Placeholder spacer for center symmetry */}
        <div className="w-10" />
      </header>

      {/* ============================================================== */}
      {/* 2. GENDER SELECTION AVATARS (Female | Male)                    */}
      {/* ============================================================== */}
      <div className="px-6 pt-2 flex items-center justify-center gap-10">
        {/* Female Avatar Option */}
        <div
          onClick={() => setSelectedGender('female')}
          className="flex flex-col items-center cursor-pointer group active:scale-95 transition-transform"
        >
          <div
            className={`relative w-28 h-28 rounded-full p-1 transition-all duration-300 ${
              selectedGender === 'female'
                ? 'ring-4 ring-[#4ade80] shadow-[0_4px_20px_rgba(74,222,128,0.35)] scale-105'
                : 'opacity-70 hover:opacity-100 ring-2 ring-transparent'
            }`}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-amber-100 shadow-inner">
              <img
                src={defaultAvatars.female}
                alt="Female"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Checkmark bubble if selected */}
            {selectedGender === 'female' && (
              <div className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-[#34d399] border-2 border-white text-white flex items-center justify-center shadow-md animate-scaleIn">
                <Check size={16} className="stroke-[3]" />
              </div>
            )}
          </div>
          <span
            className={`mt-2.5 text-[15px] font-bold tracking-wide transition-colors ${
              selectedGender === 'female' ? 'text-slate-900 font-black' : 'text-slate-400'
            }`}
          >
            Female
          </span>
        </div>

        {/* Male Avatar Option */}
        <div
          onClick={() => setSelectedGender('male')}
          className="flex flex-col items-center cursor-pointer group active:scale-95 transition-transform"
        >
          <div
            className={`relative w-28 h-28 rounded-full p-1 transition-all duration-300 ${
              selectedGender === 'male'
                ? 'ring-4 ring-[#4ade80] shadow-[0_4px_20px_rgba(74,222,128,0.35)] scale-105'
                : 'opacity-70 hover:opacity-100 ring-2 ring-transparent'
            }`}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-amber-100 shadow-inner">
              <img
                src={defaultAvatars.male}
                alt="Male"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Checkmark bubble if selected */}
            {selectedGender === 'male' && (
              <div className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-[#34d399] border-2 border-white text-white flex items-center justify-center shadow-md animate-scaleIn">
                <Check size={16} className="stroke-[3]" />
              </div>
            )}
          </div>
          <span
            className={`mt-2.5 text-[15px] font-bold tracking-wide transition-colors ${
              selectedGender === 'male' ? 'text-slate-900 font-black' : 'text-slate-400'
            }`}
          >
            Male
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. INPUT FIELDS (Rounded Pill Cards with Chevron)             */}
      {/* ============================================================== */}
      <div className="px-6 mt-5 space-y-4 flex-1">
        {/* FIELD 1: الاسم (Name) */}
        <div
          onClick={() => {
            setTempName(name);
            setShowNameModal(true);
          }}
          className="w-full h-15 px-6 rounded-full bg-[#f4f5f7] border border-slate-200/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-between cursor-pointer active:bg-slate-200/80 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ChevronLeft size={20} className="text-slate-400 stroke-[2]" />
            {name && (
              <span className="text-sm font-bold text-slate-800">
                {name}
              </span>
            )}
          </div>
          <span className="text-[17px] font-bold text-slate-600">
            الاسم
          </span>
        </div>

        {/* FIELD 2: تاريخ الميلاد (Birthday) */}
        <div
          onClick={() => setShowBirthdayModal(true)}
          className="w-full h-15 px-6 rounded-full bg-[#f4f5f7] border border-slate-200/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-between cursor-pointer active:bg-slate-200/80 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ChevronLeft size={20} className="text-slate-400 stroke-[2]" />
            {birthday && (
              <span className="text-sm font-bold font-mono text-slate-800" dir="ltr">
                {birthday}
              </span>
            )}
          </div>
          <span className="text-[17px] font-bold text-slate-600">
            تاريخ الميلاد
          </span>
        </div>

        {/* FIELD 3: البلد (Country) */}
        <div
          onClick={() => setShowCountryModal(true)}
          className="w-full h-15 px-6 rounded-full bg-[#f4f5f7] border border-slate-200/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-between cursor-pointer active:bg-slate-200/80 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ChevronLeft size={20} className="text-slate-400 stroke-[2]" />
            {selectedCountry && (
              <div className="flex items-center gap-1.5">
                <span className="text-base">{selectedCountry.flag}</span>
                <span className="text-sm font-bold text-slate-800">
                  {selectedCountry.name}
                </span>
              </div>
            )}
          </div>
          <span className="text-[17px] font-bold text-slate-600">
            البلد
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. BOTTOM ACTION BUTTON: "إتمام" (Mint Green Gradient Pill)     */}
      {/* ============================================================== */}
      <div className="px-8 pb-10 pt-4">
        <button
          type="button"
          onClick={handleComplete}
          className="w-full h-14 rounded-full bg-gradient-to-r from-[#98f2d5] via-[#a7f3d0] to-[#bbf7d0] hover:from-[#86efac] hover:to-[#6ee7b7] text-[#064e3b] font-black text-[18px] tracking-wide shadow-[0_6px_20px_rgba(110,231,183,0.5)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center border border-emerald-200"
        >
          إتمام
        </button>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: ENTER NAME                                            */}
      {/* ============================================================== */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl animate-scaleIn text-right">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              أدخل اسم الحساب
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              يمكنك كتابة اسمك أو لقبك الملكي في التطبيق
            </p>
            <input
              type="text"
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="مثال: أمير الشرق، ملكة الطرب..."
              className="w-full h-12 px-4 rounded-2xl bg-slate-100 border border-slate-300 text-slate-900 text-sm font-bold focus:outline-emerald-500 text-right mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setName(tempName);
                  setShowNameModal(false);
                }}
                className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md cursor-pointer"
              >
                تأكيد
              </button>
              <button
                type="button"
                onClick={() => setShowNameModal(false)}
                className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: BIRTHDAY PICKER                                       */}
      {/* ============================================================== */}
      {showBirthdayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl animate-scaleIn text-right">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              تحديد تاريخ الميلاد
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              اختر تاريخ ميلادك لحساب الأبراج والهدايا السنوية
            </p>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl bg-slate-100 border border-slate-300 text-slate-900 text-sm font-bold focus:outline-emerald-500 text-center mb-4 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setShowBirthdayModal(false)}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md cursor-pointer"
            >
              تم
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: COUNTRY PICKER                                        */}
      {/* ============================================================== */}
      {showCountryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-5 shadow-2xl max-h-[75vh] flex flex-col animate-slideUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                اختر بلدك
              </h3>
              <button
                type="button"
                onClick={() => setShowCountryModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                إغلاق
              </button>
            </div>
            <div className="overflow-y-auto divide-y divide-slate-100 py-2 flex-1">
              {countries.map((c) => (
                <div
                  key={c.code}
                  onClick={() => {
                    setSelectedCountry(c);
                    setShowCountryModal(false);
                  }}
                  className={`flex items-center justify-between py-3.5 px-3 rounded-2xl cursor-pointer transition-colors ${
                    selectedCountry.code === c.code
                      ? 'bg-emerald-50 text-emerald-950 font-bold'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.flag}</span>
                    <span className="text-sm font-medium">{c.name}</span>
                  </div>
                  {selectedCountry.code === c.code && (
                    <Check size={18} className="text-emerald-600 stroke-[3]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

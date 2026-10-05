import React, { useState, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { setImageFallback } from '../../utils/imageFallback';
import { useApp } from '../../context/AppContext';
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  Check,
  Calendar,
  Globe,
  Settings,
  X,
  Upload,
  Sparkles,
} from 'lucide-react';
import {
  ShimmeringAccountName,
  SHIMMER_THEMES,
  ShimmerStyleKey,
} from '../common/ShimmeringAccountName';

export const EditProfileModal: React.FC = () => {
  const { user, setUser, updateProfile, reportError, setActiveSubScreen } = useApp();

  // Field states
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [birthday, setBirthday] = useState(user.birthday || '');
  const [region, setRegion] = useState(user.region || 'الشرق الأوسط');
  const [country, setCountry] = useState(user.country || 'مصر');
  const [countryCode, setCountryCode] = useState(user.countryCode || 'EG');
  const [countryFlag, setCountryFlag] = useState(user.countryFlag || '🇪🇬');
  const [avatar, setAvatar] = useState(user.avatar);

  // Sub-dialogs
  const [editingField, setEditingField] = useState<
    'none' | 'name' | 'name_shimmer' | 'bio' | 'birthday' | 'country' | 'region' | 'avatar_picker'
  >('none');
  const [tempText, setTempText] = useState('');

  // Hidden native file input for gallery upload
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Handle local image file picker from gallery
  const [uploading, setUploading] = useState(false);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user.authId || uploading) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      reportError('اختر صورة JPEG أو PNG أو WebP لا يتجاوز حجمها 5 ميغابايت.'); return;
    }
    setUploading(true);
    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
    const path = `${user.authId}/${crypto.randomUUID()}.${extension}`;
    try {
      const {error} = await supabase.storage.from('avatars').upload(path, file, {contentType: file.type, upsert: false});
      if (error) throw error;
      const {data} = supabase.storage.from('avatars').getPublicUrl(path);
      if (await updateProfile({avatar: data.publicUrl})) { setAvatar(data.publicUrl); setEditingField('none'); }
      else await supabase.storage.from('avatars').remove([path]);
    } catch { reportError('تعذر رفع الصورة. حاول مجدداً.'); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const triggerGalleryPicker = () => {
    fileInputRef.current?.click();
  };

  // Preset avatars for convenience
  const avatarPresets = [
    '/assets/images/mr_balmain_avatar_1790227488334.jpg',
    '/assets/images/avatar_prince_arab_1790226081300.jpg',
    '/assets/images/avatar_layla_arab_1790226090704.jpg',
    '/assets/images/avatar_male_ghutra_1790628422202.jpg',
    '/assets/images/avatar_female_ghutra_1790628438051.jpg',
  ];

  const countriesList = [
    { name: 'مصر', code: 'EG', flag: '🇪🇬' },
    { name: 'السعودية', code: 'SA', flag: '🇸🇦' },
    { name: 'الإمارات', code: 'AE', flag: '🇦🇪' },
    { name: 'العراق', code: 'IQ', flag: '🇮🇶' },
    { name: 'الكويت', code: 'KW', flag: '🇰🇼' },
    { name: 'المغرب', code: 'MA', flag: '🇲🇦' },
    { name: 'الجزائر', code: 'DZ', flag: '🇩🇿' },
    { name: 'الأردن', code: 'JO', flag: '🇯🇴' },
  ];

  const handleSaveName = () => {
    if (tempText.trim()) {
      setName(tempText.trim());
      setUser((prev) => ({ ...prev, name: tempText.trim() }));
    }
    setEditingField('none');
  };

  const handleSaveBio = () => {
    setBio(tempText.trim());
    setUser((prev) => ({ ...prev, bio: tempText.trim() }));
    setEditingField('none');
  };

  const handleSaveBirthday = (val: string) => {
    setBirthday(val);
    setUser((prev) => ({ ...prev, birthday: val }));
    setEditingField('none');
  };

  const handleSelectCountry = (c: { name: string; code: string; flag: string }) => {
    setCountry(c.name);
    setCountryCode(c.code);
    setCountryFlag(c.flag);
    setUser((prev) => ({
      ...prev,
      country: c.name,
      countryCode: c.code,
      countryFlag: c.flag,
    }));
    setEditingField('none');
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 pb-20 select-none">
      {/* Hidden file input for native device photo gallery */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Header exactly matching screenshot: chevron on the right, title in center */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-3.5 flex items-center justify-between">
        <div className="w-8" />
        <h1 className="text-base font-black text-slate-900">تعديل الملف الشخصي</h1>
        <button
          onClick={() => setActiveSubScreen(null)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 cursor-pointer"
          title="رجوع"
        >
          <ChevronRight size={26} className="stroke-[2.5]" />
        </button>
      </header>


      {/* List items matching the exact order and look in the screenshot */}
      <div className="divide-y divide-slate-100 px-4">
        {/* Row 1: إطار (Avatar and Frame) */}
        <div
          onClick={() => setEditingField('avatar_picker')}
          className="py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ChevronLeft size={18} className="text-slate-300 stroke-[2.2]" />
            <div className="relative group">
              <div className="w-13 h-13 rounded-full overflow-hidden border border-slate-200 shadow-xs">
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-black/25 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                <Camera size={16} />
              </div>
            </div>
          </div>
          <span className="text-sm font-bold text-slate-900">إطار</span>
        </div>

        {/* Row 2: اسم الكنية (Nickname / Name) */}
        <div
          onClick={() => {
            setTempText(name);
            setEditingField('name');
          }}
          className="py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ChevronLeft size={18} className="text-slate-300 stroke-[2.2]" />
            <span className="text-sm font-semibold text-slate-400 font-sans">{name}</span>
          </div>
          <span className="text-sm font-bold text-slate-900">اسم الكنية</span>
        </div>

        {/* Row 2.5: لمعان وألوان اسم الحساب (ذهبي، أحمر، أسود، فضي، مستمر) */}
        <div
          onClick={() => setEditingField('name_shimmer')}
          className="py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ChevronLeft size={18} className="text-slate-300 stroke-[2.2]" />
            <div className="flex items-center gap-1.5">
              <ShimmeringAccountName name={name} size="sm" showSparkles={true} />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            <span className="text-sm font-bold text-slate-900">ألوان ولمعان الاسم</span>
          </div>
        </div>

        {/* Row 3: سيرة ذاتية (Bio) */}
        <div
          onClick={() => {
            setTempText(bio);
            setEditingField('bio');
          }}
          className="py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-2 max-w-[200px] overflow-hidden">
            <ChevronLeft size={18} className="text-slate-300 stroke-[2.2] shrink-0" />
            <span className="text-sm font-normal text-slate-400 truncate">
              {bio || ''}
            </span>
          </div>
          <span className="text-sm font-bold text-slate-900">سيرة ذاتية</span>
        </div>

        {/* Row 4: عيد ميلاد (Birthday) */}
        <div
          onClick={() => setEditingField('birthday')}
          className="py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ChevronLeft size={18} className="text-slate-300 stroke-[2.2]" />
            <span className="text-sm font-normal text-slate-400">
              {birthday || ''}
            </span>
          </div>
          <span className="text-sm font-bold text-slate-900">عيد ميلاد</span>
        </div>

        {/* Row 5: منطقة (Region) */}
        <div
          onClick={() => setEditingField('region')}
          className="py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-normal text-slate-400">{region}</span>
          </div>
          <span className="text-sm font-bold text-slate-900">منطقة</span>
        </div>

        {/* Row 6: دولة (Country with Flag & Code) */}
        <div
          onClick={() => setEditingField('country')}
          className="py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ChevronLeft size={18} className="text-slate-300 stroke-[2.2]" />
            <span className="text-sm font-bold text-slate-500 font-mono">{countryCode}</span>
            <span className="text-base">{countryFlag}</span>
          </div>
          <span className="text-sm font-bold text-slate-900">دولة</span>
        </div>

        {/* Row 7: اعدادات (Settings) */}
        <div
          onClick={() => setActiveSubScreen('settings')}
          className="py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
        >
          <ChevronLeft size={18} className="text-slate-300 stroke-[2.2]" />
          <span className="text-sm font-bold text-slate-900">اعدادات</span>
        </div>
      </div>

      {/* --- Dialog 1: Change Avatar / Photo Gallery --- */}
      {editingField === 'avatar_picker' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-5 space-y-4 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                onClick={() => setEditingField('none')}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
              <h3 className="text-base font-black text-slate-900">تغيير الصورة الشخصية</h3>
              <div className="w-8" />
            </div>

            {/* Direct Phone Gallery Button */}
            <button
              onClick={triggerGalleryPicker}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <Upload size={18} />
              <span>اختيار صورة من معرض الهاتف 🖼️</span>
            </button>

            {/* Avatar presets selection */}
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-2 text-right">
                أو اختر من النماذج الرمزية:
              </span>
              <div className="grid grid-cols-5 gap-2">
                {avatarPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setAvatar(preset);
                      setUser((prev) => ({ ...prev, avatar: preset }));
                      setEditingField('none');
                    }}
                    className={`aspect-square rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                      avatar === preset
                        ? 'border-cyan-500 scale-105 shadow-md'
                        : 'border-slate-200 hover:opacity-80'
                    }`}
                  >
                    <img src={preset} alt={`preset-${idx}`} onError={(e) => setImageFallback(e, '/assets/images/default_arab_user_avatar_1790806239365.jpg')} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Dialog 2: Edit Name Modal --- */}
      {editingField === 'name' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 text-right">تعديل اسم الكنية</h3>
            <input
              type="text"
              value={tempText}
              onChange={(e) => setTempText(e.target.value)}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-cyan-500 text-right"
              placeholder="اكتب اسم الكنية الجديد..."
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingField('none')}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveName}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 cursor-pointer shadow-xs"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Dialog 3: Edit Bio Modal --- */}
      {editingField === 'bio' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 text-right">تعديل السيرة الذاتية</h3>
            <textarea
              rows={3}
              value={tempText}
              onChange={(e) => setTempText(e.target.value)}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-cyan-500 text-right resize-none"
              placeholder="اكتب نبذة شخصية قصيرة..."
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingField('none')}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveBio}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 cursor-pointer shadow-xs"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Dialog 4: Edit Birthday Modal --- */}
      {editingField === 'birthday' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 text-right">
            <h3 className="text-base font-black text-slate-900">تحديد تاريخ الميلاد</h3>
            <input
              type="date"
              defaultValue={birthday || '1998-05-15'}
              onChange={(e) => handleSaveBirthday(e.target.value)}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-cyan-500 cursor-pointer"
            />
            <button
              onClick={() => setEditingField('none')}
              className="w-full py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 cursor-pointer"
            >
              تم
            </button>
          </div>
        </div>
      )}

      {/* --- Dialog 5: Select Country Modal --- */}
      {editingField === 'country' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-3">
            <h3 className="text-base font-black text-slate-900 text-right mb-2">اختر الدولة</h3>
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {countriesList.map((c) => (
                <div
                  key={c.code}
                  onClick={() => handleSelectCountry(c)}
                  className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-xl"
                >
                  <span className="text-xs font-bold text-slate-400 font-mono">{c.code}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{c.name}</span>
                    <span className="text-lg">{c.flag}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setEditingField('none')}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer mt-2"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* --- Dialog 6: Account Name Color & Continuous Shine Selector --- */}
      {editingField === 'name_shimmer' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-gradient-to-b from-[#18202f] to-[#0b0f17] text-white rounded-3xl p-5 border border-amber-500/30 shadow-2xl relative max-h-[85vh] overflow-y-auto no-scrollbar"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Sparkles size={18} className="text-white drop-shadow" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">تخصيص لمعان اسم الحساب</h3>
                  <p className="text-[11px] text-amber-300/80">
                    ذهبي • أحمر • أسود • فضي • ألوان تلمع باستمرار
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingField('none')}
                className="w-8 h-8 rounded-full bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Live Name Preview Showcase */}
            <div className="my-4 p-4 rounded-2xl bg-[#090d15] border border-amber-500/20 text-center relative overflow-hidden">
              <div className="text-[11px] text-slate-400 mb-1">معاينة مباشرة لاسمك:</div>
              <div className="py-2">
                <ShimmeringAccountName
                  name={name}
                  size="xl"
                  showSparkles={true}
                  showPaletteButton={false}
                />
              </div>
            </div>

            {/* List of Themes */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-300 px-1">اختر اللون واللمعان المفضل:</div>
              {SHIMMER_THEMES.map((theme) => {
                const currentStyle = user.nameShimmerStyle || 'quad_luxury';
                const isSelected = theme.id === currentStyle;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setUser((prev) => ({
                        ...prev,
                        nameShimmerStyle: theme.id,
                      }));
                      setEditingField('none');
                    }}
                    className={`w-full p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-right border ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500/20 via-rose-500/15 to-transparent border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                        : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${theme.previewGradient} flex items-center justify-center shadow-md shrink-0 border border-white/20`}
                      >
                        <Sparkles size={16} className="text-white drop-shadow" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black ${theme.className}`}>{name}</span>
                          {isSelected && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                              مفعّل
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{theme.subtitle}</div>
                      </div>
                    </div>

                    <div className="shrink-0 mr-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                          isSelected
                            ? 'bg-amber-400 border-amber-300 text-slate-950'
                            : 'border-slate-700 bg-slate-800 text-transparent'
                        }`}
                      >
                        <Check size={14} className="stroke-[3]" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setEditingField('none')}
              className="w-full mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold cursor-pointer transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

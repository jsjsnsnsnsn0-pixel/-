import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Radio, Lock, Globe, Sparkles, CheckCircle2 } from 'lucide-react';

export const CreateRoomScreen: React.FC = () => {
  const { createNewRoom, setActiveTab } = useApp();

  const [title, setTitle] = useState('مجلس النخبة والسمرات 🎙️');
  const [description, setDescription] = useState('حياكم الله جميعاً.. مساحة للحوار الراقي والموسيقى');
  const [category, setCategory] = useState<'طرب وموسيقى' | 'سوالف وألعاب' | 'مسابقات وفعاليات' | 'شعر وأدب' | 'عامة'>('طرب وموسيقى');
  const [seatsCount, setSeatsCount] = useState<number>(8);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [allowInvites, setAllowInvites] = useState<boolean>(true);
  const [isProtected, setIsProtected] = useState<boolean>(false);
  const [selectedCover, setSelectedCover] = useState<string>('/src/assets/images/room_cover_majlis_1790226059300.jpg');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'طرب وموسيقى',
    'سوالف وألعاب',
    'مسابقات وفعاليات',
    'شعر وأدب',
    'عامة',
  ];

  const presetCovers = [
    { id: '1', url: '/src/assets/images/room_cover_majlis_1790226059300.jpg', title: 'مجلس عربي' },
    { id: '2', url: '/src/assets/images/room_cover_poetry_1790226070047.jpg', title: 'طرب وعود' },
    { id: '3', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80', title: 'حفل وألعاب' },
    { id: '4', url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80', title: 'أدب وشعر' },
  ];

  const seatOptions = [4, 6, 8, 10, 12];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      createNewRoom({
        title,
        description,
        category,
        seatsCount,
        isPrivate,
        coverImage: selectedCover,
      });
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-24 select-none">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 pt-3 pb-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200/70 flex items-center justify-center">
            <Radio size={18} className="stroke-[2.5]" />
          </div>
          <h1 className="text-base font-black text-slate-900">إنشاء غرفة صوتية جديدة</h1>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
        >
          إلغاء
        </button>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-md mx-auto">
        {/* Cover Preview & Selector */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            اختر غلاف الغرفة:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {presetCovers.map((cover) => {
              const isSelected = selectedCover === cover.url;
              return (
                <div
                  key={cover.id}
                  onClick={() => setSelectedCover(cover.url)}
                  className={`relative h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                    isSelected
                      ? 'border-cyan-600 ring-2 ring-cyan-500/30 scale-102'
                      : 'border-slate-200 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img
                    src={cover.url}
                    alt={cover.title}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-cyan-900/40 flex items-center justify-center text-white">
                      <CheckCircle2 size={20} className="stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Room Name & Description */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              اسم الغرفة <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              dir="rtl"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مجلس طرب نجد الأصيل..."
              required
              className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              وصف الغرفة أو الترحيب بالضيوف
            </label>
            <textarea
              dir="rtl"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب نبذة مختصرة عن موضوع الغرفة..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none resize-none transition-colors"
            />
          </div>
        </div>

        {/* Category Picker */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            تصنيف الغرفة
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategory(cat as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  category === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Microphone Seats Count */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            عدد مقاعد المايك الصوتي
          </label>
          <div className="grid grid-cols-5 gap-2">
            {seatOptions.map((num) => (
              <button
                type="button"
                key={num}
                onClick={() => setSeatsCount(num)}
                className={`py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                  seatsCount === num
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {num} مقاعد
              </button>
            ))}
          </div>
        </div>

        {/* Privacy & Permissions Switches */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 space-y-3 shadow-xs">
          {/* Privacy Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPrivate ? <Lock size={16} className="text-amber-500" /> : <Globe size={16} className="text-cyan-600" />}
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {isPrivate ? 'غرفة خاصة (بالدعوة فقط)' : 'غرفة عامة (متاحة للجميع)'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {isPrivate ? 'يدخل المدعوون فقط' : 'تظهر في قائمة الغرف المستكشفة'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                isPrivate ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-xs ${
                  isPrivate ? 'left-1' : 'right-1'
                }`}
              />
            </button>
          </div>

          <div className="border-t border-slate-100" />

          {/* Allow Invites Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">السماح بالدعوات</span>
              <span className="text-[10px] text-slate-400">يمكن للحاضرين دعوة أصدقائهم</span>
            </div>
            <button
              type="button"
              onClick={() => setAllowInvites(!allowInvites)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                allowInvites ? 'bg-cyan-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-xs ${
                  allowInvites ? 'left-1' : 'right-1'
                }`}
              />
            </button>
          </div>

          <div className="border-t border-slate-100" />

          {/* Room Protection Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">حماية الغرفة</span>
              <span className="text-[10px] text-slate-400">تفعيل الفلترة التلقائية للتعليقات</span>
            </div>
            <button
              type="button"
              onClick={() => setIsProtected(!isProtected)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                isProtected ? 'bg-cyan-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-xs ${
                  isProtected ? 'left-1' : 'right-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white font-black text-sm shadow-md shadow-cyan-600/30 hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={18} />
            <span>{isSubmitting ? 'جارٍ الإطلاق...' : 'إنشاء الغرفة والدخول الآن'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

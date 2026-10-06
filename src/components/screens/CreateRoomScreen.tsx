import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ImagePlus, Radio, Sparkles } from 'lucide-react';

export const CreateRoomScreen: React.FC = () => {
  const { createNewRoom, setActiveTab } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('أهلاً وسهلاً.');
  const [selectedCover, setSelectedCover] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setLocalError('اختر ملف صورة صالحاً.'); return; }
    if (file.size > 5 * 1024 * 1024) { setLocalError('حجم الصورة يجب ألا يتجاوز 5 ميغابايت.'); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') { setSelectedCover(reader.result); setLocalError(null); } };
    reader.onerror = () => setLocalError('تعذر قراءة الصورة. حاول اختيار صورة أخرى.');
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = title.trim();
    if (!name) { setLocalError('اسم الغرفة مطلوب.'); return; }
    if (isSubmitting) return;
    setIsSubmitting(true); setLocalError(null);
    try {
      const room = await createNewRoom({ title: name, description: welcomeMessage.trim(), coverImage: selectedCover || undefined, seatsCount: 10, category: 'عامة', isPrivate: false });
      if (!room) setLocalError('تعذر إنشاء الغرفة. تحقق من الاتصال وحاول مجدداً.');
    } finally { setIsSubmitting(false); }
  };

  const canCreate = Boolean(title.trim()) && !isSubmitting;

  return <div className="min-h-screen bg-[#0b0822] text-white pb-24" dir="rtl">
    <header className="sticky top-0 z-30 bg-[#0b0822]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2"><Radio size={20} className="text-cyan-600"/><h1 className="text-lg font-black">أنشئ غرفة</h1></div>
      <button type="button" onClick={() => setActiveTab('home')} className="text-sm font-bold text-slate-400">إلغاء</button>
    </header>
    <form onSubmit={handleSubmit} className="p-5 max-w-md mx-auto space-y-5">
      <section className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-sm">
        <label className="block text-sm font-black mb-3">صورة الغرفة</label>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
        <button type="button" onClick={() => fileRef.current?.click()} className="mx-auto w-32 h-32 rounded-3xl overflow-hidden border-2 border-dashed border-purple-400/40 bg-[#211b35] flex items-center justify-center">
          {selectedCover ? <img src={selectedCover} alt="معاينة صورة الغرفة" className="w-full h-full object-cover"/> : <span className="flex flex-col items-center gap-2 text-purple-300"><ImagePlus size={34}/><span className="text-xs font-bold">اختيار صورة</span></span>}
        </button>
        <p className="mt-3 text-center text-[11px] text-slate-400">اختر صورة من معرض الهاتف — الحد الأقصى 5MB</p>
      </section>
      <section className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-sm space-y-4">
        <div><label htmlFor="room-name" className="block text-sm font-black mb-2">اسم الغرفة <span className="text-rose-500">*</span></label><input id="room-name" required aria-describedby="room-name-count" value={title} onChange={e => setTitle(e.target.value)} maxLength={60} placeholder="اكتب اسم الغرفة" className="w-full rounded-2xl border border-white/10 bg-[#211b35] px-4 py-3 outline-none focus:border-cyan-500" /><div id="room-name-count" className="mt-1 text-left text-xs text-slate-400">{title.length}/60</div></div>
        <div><label htmlFor="welcome-message" className="block text-sm font-black mb-2">رسالة الترحيب</label><textarea id="welcome-message" value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} maxLength={300} rows={4} placeholder="مثال: أهلاً وسهلاً بكم ❤️" className="w-full rounded-2xl border border-white/10 bg-[#211b35] px-4 py-3 outline-none focus:border-cyan-500 resize-none" /><div className="mt-1 text-left text-[10px] text-slate-400">{welcomeMessage.length}/300</div></div>
      </section>
      <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-xs text-slate-300">سيتم إنشاء الغرفة بـ <strong>10 مقاعد صوتية</strong>، ويمكن للمالك إدارة الغرفة بعد إنشائها.</div>
      {localError && <div role="alert" className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{localError}</div>}
      <button type="submit" aria-busy={isSubmitting} disabled={!canCreate} className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-400 text-white font-black flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg">{isSubmitting?<span className="ui-spinner" aria-hidden="true"/>:<Sparkles size={19}/>}<span>{isSubmitting ? 'جارٍ إنشاء الغرفة...' : 'إنشاء غرفة'}</span></button>
    </form>
  </div>;
};

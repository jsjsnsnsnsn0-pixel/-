import React from 'react';
import {useApp} from '../../context/AppContext';
import {ChevronRight, LogOut, User, Headphones} from 'lucide-react';
export const SettingsScreen: React.FC = () => {
  const {setActiveSubScreen,logout,isSpeakerOn,toggleSpeaker,noiseSuppression,toggleNoiseSuppression}=useApp();
  return <div dir="rtl" className="min-h-screen bg-[#0b0c16] text-white pb-20">
    <header className="flex items-center gap-3 p-4 border-b border-white/10"><button onClick={()=>setActiveSubScreen(null)} aria-label="الرجوع"><ChevronRight/></button><h1 className="font-bold">الإعدادات</h1></header>
    <div className="p-4 space-y-4">
      <button onClick={()=>setActiveSubScreen('edit_profile')} className="w-full p-4 rounded-2xl bg-white/5 flex gap-3"><User size={20}/>معلومات الحساب الشخصي</button>
      <section className="rounded-2xl bg-white/5 p-4 space-y-5"><h2 className="font-bold text-sm text-amber-300">إعدادات الصوت</h2>
        <label className="flex justify-between items-center gap-3 text-sm"><span>تشغيل صوت الغرفة</span><input type="checkbox" checked={isSpeakerOn} onChange={toggleSpeaker} className="w-5 h-5 accent-emerald-500"/></label>
        <label className="flex justify-between items-center gap-3 text-sm"><span>تقليل ضوضاء المايكروفون</span><input type="checkbox" checked={noiseSuppression} onChange={toggleNoiseSuppression} className="w-5 h-5 accent-emerald-500"/></label>
      </section>
      <section className="rounded-2xl bg-white/5 p-4 text-sm"><h2 className="font-bold mb-2">اللغة</h2><p>العربية</p></section>
      <button onClick={()=>setActiveSubScreen('help_center')} className="w-full p-4 rounded-2xl bg-white/5 flex gap-3"><Headphones size={20}/>مركز المساعدة</button>
      <p className="text-xs text-slate-400">خيارات أمان تسجيل الدخول تُدار من حساب Google أو مزود تسجيل الدخول.</p>
      <button onClick={logout} className="w-full p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex justify-center gap-2"><LogOut size={18}/>تسجيل الخروج</button>
    </div>
  </div>;
};

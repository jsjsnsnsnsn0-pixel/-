import React from 'react';
import {
  ChevronLeft,
  Headphones,
  Languages,
  LogOut,
  PencilLine,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Volume2,
  Wifi,
} from 'lucide-react';
import {useApp} from '../../context/AppContext';

const SettingRow=({icon,title,description,onClick,accent='text-violet-300'}:{
  icon:React.ReactNode;title:string;description?:string;onClick?:()=>void;accent?:string;
})=><button type="button" onClick={onClick} className="w-full min-h-[72px] flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[.055] px-4 py-3 text-right shadow-[inset_0_1px_0_rgba(255,255,255,.05)] active:scale-[.985] transition-transform">
  <span className={`w-11 h-11 shrink-0 rounded-2xl bg-white/[.07] flex items-center justify-center ${accent}`}>{icon}</span>
  <span className="min-w-0 flex-1"><span className="block font-black text-[14px] text-white">{title}</span>{description&&<span className="block mt-1 text-[11px] leading-5 text-slate-400">{description}</span>}</span>
  <ChevronLeft size={18} className="text-slate-500 shrink-0"/>
</button>;

const AudioToggle=({title,description,checked,onChange}:{title:string;description:string;checked:boolean;onChange:()=>void})=><label className="flex items-center gap-3 py-3 cursor-pointer">
  <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-white">{title}</span><span className="block mt-1 text-[11px] text-slate-400">{description}</span></span>
  <input className="sr-only peer" type="checkbox" checked={checked} onChange={onChange}/>
  <span aria-hidden="true" className="relative w-12 h-7 rounded-full bg-slate-700 peer-checked:bg-emerald-500 transition-colors shadow-inner after:content-[''] after:absolute after:top-1 after:right-1 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:-translate-x-5"/>
</label>;

export const SettingsScreen: React.FC = () => {
  const {user,setActiveSubScreen,logout,isSpeakerOn,toggleSpeaker,noiseSuppression,toggleNoiseSuppression}=useApp();

  return <div dir="rtl" className="min-h-screen pb-28 text-white bg-[radial-gradient(circle_at_top_right,#29305f_0,#111326_34%,#080914_72%)]">
    <header className="relative overflow-hidden px-5 pt-[max(22px,env(safe-area-inset-top))] pb-7 border-b border-white/8">
      <div className="absolute -top-14 -left-16 w-44 h-44 rounded-full bg-violet-500/20 blur-3xl"/>
      <div className="absolute -top-10 right-12 w-36 h-36 rounded-full bg-cyan-400/10 blur-3xl"/>
      <div className="relative flex items-center gap-3">
        <button type="button" onClick={()=>setActiveSubScreen(null)} aria-label="الرجوع" className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[.07] flex items-center justify-center"><ChevronLeft size={21}/></button>
        <div className="flex-1"><p className="text-[11px] font-bold text-emerald-300">TotiChat</p><h1 className="text-2xl font-black tracking-tight">الإعدادات</h1><p className="text-[11px] text-slate-400 mt-1">تحكم بحسابك، الصوت، الاتصال وتجربة التطبيق</p></div>
      </div>
      <div className="relative mt-5 rounded-[26px] border border-white/10 bg-white/[.07] backdrop-blur-xl p-3.5 flex items-center gap-3 shadow-2xl">
        <img src={user.avatar} alt="" className="w-14 h-14 rounded-2xl object-cover border border-white/15"/>
        <div className="min-w-0 flex-1"><p className="font-black truncate">{user.name}</p><p className="text-[11px] text-slate-400 mt-1 ui-id">ID {user.id}</p></div>
        <button type="button" onClick={()=>setActiveSubScreen('edit_profile')} className="h-10 px-3 rounded-xl bg-white/10 text-xs font-bold flex items-center gap-1.5"><PencilLine size={15}/>تعديل</button>
      </div>
    </header>

    <main className="px-4 py-5 space-y-6">
      <section>
        <div className="px-1 mb-2.5"><h2 className="text-xs font-black text-slate-300">الحساب والأمان</h2></div>
        <div className="space-y-2">
          <SettingRow icon={<UserRound size={21}/>} title="المعلومات الشخصية" description="تفاصيل الحساب، البريد، كلمة المرور وطرق تسجيل الدخول" onClick={()=>setActiveSubScreen('account_security')} accent="text-violet-300"/>
          <SettingRow icon={<ShieldCheck size={21}/>} title="الأمان وتسجيل الدخول" description="الجلسات، ربط الهاتف وحماية الحساب" onClick={()=>setActiveSubScreen('account_security')} accent="text-emerald-300"/>
        </div>
      </section>

      <section className="rounded-[26px] border border-white/8 bg-white/[.055] px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
        <div className="flex items-center gap-2 pt-3 pb-1"><span className="w-9 h-9 rounded-xl bg-fuchsia-500/10 text-fuchsia-300 flex items-center justify-center"><Volume2 size={18}/></span><div><h2 className="text-sm font-black">الصوت داخل الغرف</h2><p className="text-[10px] text-slate-500">إعدادات سريعة للصوت والمايكروفون</p></div></div>
        <AudioToggle title="تشغيل صوت الغرفة" description="سماع صوت الغرفة الحالية" checked={isSpeakerOn} onChange={toggleSpeaker}/>
        <div className="h-px bg-white/7"/>
        <AudioToggle title="تقليل ضوضاء المايكروفون" description="تقليل الضوضاء المحيطة أثناء التحدث" checked={noiseSuppression} onChange={toggleNoiseSuppression}/>
      </section>

      <section>
        <div className="px-1 mb-2.5"><h2 className="text-xs font-black text-slate-300">التطبيق والاتصال</h2></div>
        <div className="space-y-2">
          <SettingRow icon={<Wifi size={21}/>} title="فحص الإنترنت" description="افحص حالة الاتصال وجودته قبل دخول الغرف الصوتية" onClick={()=>setActiveSubScreen('internet_check')} accent="text-cyan-300"/>
          <SettingRow icon={<Languages size={21}/>} title="اللغة" description="العربية" onClick={()=>{}} accent="text-amber-300"/>
          <SettingRow icon={<SlidersHorizontal size={21}/>} title="تفضيلات التطبيق" description="إعدادات العرض وتجربة الاستخدام" onClick={()=>{}} accent="text-sky-300"/>
        </div>
      </section>

      <section>
        <div className="px-1 mb-2.5"><h2 className="text-xs font-black text-slate-300">المساعدة</h2></div>
        <SettingRow icon={<Headphones size={21}/>} title="مركز المساعدة والدعم" description="الأسئلة الشائعة والمساعدة في الحساب والدخول" onClick={()=>setActiveSubScreen('help_center')} accent="text-emerald-300"/>
      </section>

      <button type="button" onClick={logout} className="w-full min-h-[56px] rounded-2xl border border-rose-400/20 bg-rose-500/10 text-rose-200 font-black flex items-center justify-center gap-2 active:scale-[.985] transition-transform"><LogOut size={19}/>تسجيل الخروج</button>
      <p className="text-center text-[10px] text-slate-600">TotiChat · إعدادات الحساب والتجربة</p>
    </main>
  </div>;
};

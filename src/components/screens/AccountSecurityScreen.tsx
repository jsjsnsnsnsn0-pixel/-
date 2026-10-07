import React from 'react';
import {
  BadgeCheck,
  ChevronLeft,
  Chrome,
  CircleUserRound,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {supabase} from '../../services/supabase';
import {useServerData} from '../../hooks/useServerData';
import {InlineLoading,ErrorState} from '../common/UIState';

const maskPhone=(value?:string|null)=>value?value.replace(/.(?=.{4})/g,'•'):'غير مربوط';
const maskEmail=(value?:string|null)=>{
  if(!value)return 'غير مربوط';
  const [local,domain]=value.split('@');if(!domain)return value;
  return `${local.slice(0,2)}${'•'.repeat(Math.max(2,Math.min(8,local.length-2)))}@${domain}`;
};
const providerLabel=(provider?:string|null)=>provider==='google'?'Google':provider==='phone'?'رقم الهاتف':provider==='email'?'البريد الإلكتروني':provider==='apple'?'Apple':provider||'غير محدد';

const DetailRow=({label,value,badge}:{label:string;value:React.ReactNode;badge?:string})=><div className="flex items-start justify-between gap-4 py-3 border-b border-white/7 last:border-0">
  <span className="text-[11px] text-slate-500 shrink-0">{label}</span>
  <span className="text-xs font-bold text-slate-200 text-left break-all">{value}{badge&&<span className="mr-2 rounded-full bg-emerald-500/12 text-emerald-300 px-2 py-1 text-[9px]">{badge}</span>}</span>
</div>;

export const AccountSecurityScreen:React.FC=()=>{
  const {user,setActiveSubScreen,reportError}=useApp();
  const [phone,setPhone]=React.useState('');
  const [otp,setOtp]=React.useState('');
  const [otpSent,setOtpSent]=React.useState(false);
  const [newPassword,setNewPassword]=React.useState('');
  const [confirmPassword,setConfirmPassword]=React.useState('');
  const [passwordOpen,setPasswordOpen]=React.useState(false);
  const [busy,setBusy]=React.useState(false);
  const [notice,setNotice]=React.useState('');

  const load=React.useCallback(async()=>{
    const {data,error}=await supabase.auth.getUser();if(error)throw error;
    const auth=data.user;
    const providers=[...new Set((auth.identities||[]).map(identity=>identity.provider).filter(Boolean))];
    const primary=String(auth.app_metadata?.provider||providers[0]||'');
    return {
      email:auth.email||null,
      emailVerified:Boolean(auth.email_confirmed_at),
      phone:auth.phone||null,
      phoneVerified:Boolean(auth.phone_confirmed_at),
      createdAt:auth.created_at,
      providers,
      primary,
      lastSignInAt:auth.last_sign_in_at||null,
    };
  },[]);
  const state=useServerData(load,null);

  const requestPhoneOtp=async()=>{
    const value=phone.trim();
    if(!/^\+[1-9]\d{7,14}$/.test(value)){reportError('أدخل رقم الهاتف مع رمز الدولة، مثال +964...');return;}
    setBusy(true);setNotice('');
    try{
      const {error}=await supabase.auth.updateUser({phone:value});if(error)throw error;
      setOtpSent(true);setNotice('تم إرسال رمز التحقق إلى الرقم الجديد.');
    }catch(error){reportError(error&&typeof error==='object'&&'message'in error?String(error.message):'تعذر إرسال رمز التحقق.');}
    finally{setBusy(false);}
  };
  const verifyPhone=async()=>{
    if(!/^\d{4,8}$/.test(otp.trim())){reportError('أدخل رمز التحقق الصحيح.');return;}
    setBusy(true);setNotice('');
    try{
      const {error}=await supabase.auth.verifyOtp({phone:phone.trim(),token:otp.trim(),type:'phone_change'});if(error)throw error;
      setOtp('');setPhone('');setOtpSent(false);setNotice('تم تحديث ربط رقم الهاتف.');await state.reload();
    }catch(error){reportError(error&&typeof error==='object'&&'message'in error?String(error.message):'تعذر تأكيد الرقم.');}
    finally{setBusy(false);}
  };
  const signOutOthers=async()=>{
    if(busy)return;
    setBusy(true);setNotice('');
    try{const {error}=await supabase.auth.signOut({scope:'others'});if(error)throw error;setNotice('تم إنهاء الجلسات الأخرى بنجاح.');}
    catch(error){reportError(error&&typeof error==='object'&&'message'in error?String(error.message):'تعذر إنهاء الجلسات الأخرى.');}
    finally{setBusy(false);}
  };
  const sendPasswordReset=async()=>{
    if(!state.data?.email){reportError('لا يوجد بريد إلكتروني مرتبط بالحساب.');return;}
    setBusy(true);setNotice('');
    try{
      const {error}=await supabase.auth.resetPasswordForEmail(state.data.email,{redirectTo:window.location.origin});if(error)throw error;
      setNotice('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
    }catch(error){reportError(error&&typeof error==='object'&&'message'in error?String(error.message):'تعذر إرسال رابط إعادة التعيين.');}
    finally{setBusy(false);}
  };
  const changePassword=async()=>{
    if(newPassword.length<8){reportError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.');return;}
    if(newPassword!==confirmPassword){reportError('تأكيد كلمة المرور غير مطابق.');return;}
    setBusy(true);setNotice('');
    try{
      const {error}=await supabase.auth.updateUser({password:newPassword});if(error)throw error;
      setNewPassword('');setConfirmPassword('');setPasswordOpen(false);setNotice('تم تغيير كلمة المرور بنجاح.');
    }catch(error){reportError(error&&typeof error==='object'&&'message'in error?String(error.message):'تعذر تغيير كلمة المرور.');}
    finally{setBusy(false);}
  };

  return <div dir="rtl" className="min-h-screen pb-24 text-white bg-[radial-gradient(circle_at_top_right,#2d315f_0,#121426_36%,#080914_72%)]">
    <header className="sticky top-0 z-20 px-4 pt-[max(14px,env(safe-area-inset-top))] pb-4 border-b border-white/8 bg-[#0c0e1c]/88 backdrop-blur-2xl">
      <div className="flex items-center gap-3">
        <button type="button" aria-label="الرجوع" onClick={()=>setActiveSubScreen('settings')} className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[.07] flex items-center justify-center"><ChevronLeft size={21}/></button>
        <span className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-300 flex items-center justify-center"><ShieldCheck size={22}/></span>
        <div><h1 className="text-lg font-black">المعلومات الشخصية</h1><p className="text-[10px] text-slate-400 mt-0.5">الحساب، الربط، كلمة المرور وطرق تسجيل الدخول</p></div>
      </div>
    </header>

    {state.loading&&<InlineLoading>جارٍ تحميل معلومات الحساب…</InlineLoading>}
    {state.error&&<div className="p-4"><ErrorState message={state.error} onRetry={()=>void state.reload()}/></div>}
    {state.data&&<main className="p-4 space-y-4">
      {notice&&<div role="status" className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-200 p-3 text-xs font-bold">{notice}</div>}

      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[.065] p-4 shadow-2xl">
        <div className="absolute -left-10 -top-10 w-28 h-28 rounded-full bg-violet-500/20 blur-3xl"/>
        <div className="relative flex items-center gap-3">
          <img src={user.avatar} alt="" className="w-16 h-16 rounded-[22px] object-cover border border-white/15 shadow-lg"/>
          <div className="min-w-0 flex-1"><p className="font-black text-base truncate">{user.name}</p><p className="text-[11px] text-slate-400 mt-1">@{user.username||'user'}</p><p className="text-[10px] text-emerald-300 mt-1">الحساب نشط</p></div>
          <CircleUserRound className="text-violet-300" size={24}/>
        </div>
        <div className="mt-4 rounded-2xl bg-black/10 px-3">
          <DetailRow label="رقم الحساب" value={<span className="ui-id">{user.id}</span>}/>
          <DetailRow label="تاريخ الإنشاء" value={new Date(state.data.createdAt).toLocaleDateString('ar-SA')}/>
          <DetailRow label="نوع الحساب" value={user.vipLevel>0?`VIP ${user.vipLevel}`:'حساب عادي'}/>
          {state.data.lastSignInAt&&<DetailRow label="آخر تسجيل دخول" value={new Date(state.data.lastSignInAt).toLocaleString('ar-SA')}/>}
        </div>
      </section>

      <section className="rounded-[26px] border border-white/8 bg-white/[.055] p-4">
        <div className="flex items-center gap-2 mb-3"><Mail size={18} className="text-sky-300"/><div><h2 className="font-black text-sm">البريد الإلكتروني والربط</h2><p className="text-[10px] text-slate-500">المعلومات المرتبطة بتسجيل الدخول</p></div></div>
        <div className="rounded-2xl bg-black/10 px-3">
          <DetailRow label="البريد المرتبط" value={maskEmail(state.data.email)}/>
          <DetailRow label="حالة البريد" value={state.data.emailVerified?'موثّق':'غير موثّق'} badge={state.data.emailVerified?'موثّق':undefined}/>
          <DetailRow label="مزوّد الدخول" value={providerLabel(state.data.primary)}/>
        </div>
      </section>

      <section className="rounded-[26px] border border-white/8 bg-white/[.055] p-4">
        <div className="flex items-center gap-2 mb-3"><LockKeyhole size={18} className="text-amber-300"/><div><h2 className="font-black text-sm">كلمة المرور والأمان</h2><p className="text-[10px] text-slate-500">لا يتم عرض كلمة المرور الحالية أبداً</p></div></div>
        <div className="rounded-2xl bg-black/10 px-3">
          <DetailRow label="كلمة المرور" value="••••••••"/>
          <DetailRow label="حالة الأمان" value={state.data.emailVerified?'جيدة':'تحتاج مراجعة'}/>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button type="button" disabled={busy||!state.data.email} onClick={()=>void sendPasswordReset()} className="min-h-[46px] rounded-xl bg-white/[.07] border border-white/8 text-xs font-bold disabled:opacity-40">إعادة تعيين</button>
          <button type="button" disabled={busy} onClick={()=>setPasswordOpen(value=>!value)} className="min-h-[46px] rounded-xl bg-violet-500/15 border border-violet-400/20 text-violet-200 text-xs font-black">تغيير كلمة المرور</button>
        </div>
        {passwordOpen&&<div className="mt-3 space-y-2">
          <input type="password" value={newPassword} onChange={event=>setNewPassword(event.target.value)} placeholder="كلمة المرور الجديدة" autoComplete="new-password" className="w-full rounded-xl border border-white/10 bg-black/15 px-3 py-3 text-sm outline-none focus:border-violet-400"/>
          <input type="password" value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)} placeholder="تأكيد كلمة المرور" autoComplete="new-password" className="w-full rounded-xl border border-white/10 bg-black/15 px-3 py-3 text-sm outline-none focus:border-violet-400"/>
          <button type="button" disabled={busy} onClick={()=>void changePassword()} className="w-full min-h-[46px] rounded-xl bg-violet-500 text-white text-sm font-black disabled:opacity-50">{busy?'جارٍ الحفظ…':'حفظ كلمة المرور الجديدة'}</button>
        </div>}
      </section>

      <section className="rounded-[26px] border border-white/8 bg-white/[.055] p-4">
        <div className="flex items-center gap-2 mb-3"><KeyRound size={18} className="text-emerald-300"/><div><h2 className="font-black text-sm">طرق تسجيل الدخول</h2><p className="text-[10px] text-slate-500">الطريقة الحالية والخيارات الأخرى</p></div></div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-2xl bg-black/10 p-3"><Chrome size={19} className="text-sky-300"/><span className="flex-1"><span className="block text-xs font-bold">Google</span><span className="text-[10px] text-slate-500">{state.data.providers.includes('google')?'مستخدم حالياً':'غير مستخدم'}</span></span>{state.data.providers.includes('google')&&<BadgeCheck size={18} className="text-emerald-300"/>}</div>
          <div className="flex items-center gap-3 rounded-2xl bg-black/10 p-3"><Mail size={19} className="text-violet-300"/><span className="flex-1"><span className="block text-xs font-bold">البريد الإلكتروني</span><span className="text-[10px] text-slate-500">{state.data.providers.includes('email')?'مستخدم حالياً':'متاح عند تفعيله'}</span></span>{state.data.providers.includes('email')&&<BadgeCheck size={18} className="text-emerald-300"/>}</div>
          <div className="flex items-center gap-3 rounded-2xl bg-black/10 p-3"><Smartphone size={19} className="text-emerald-300"/><span className="flex-1"><span className="block text-xs font-bold">رقم الهاتف</span><span className="text-[10px] text-slate-500">{state.data.phone?'مرتبط بالحساب':'غير مستخدم حالياً'}</span></span>{state.data.phone&&<BadgeCheck size={18} className="text-emerald-300"/>}</div>
          <div className="flex items-center gap-3 rounded-2xl bg-black/10 p-3 opacity-65"><span className="w-5 text-center font-black">A</span><span className="flex-1"><span className="block text-xs font-bold">Apple</span><span className="text-[10px] text-slate-500">غير مستخدم حالياً</span></span><span className="text-[9px] text-slate-500">مستقبلاً</span></div>
        </div>
      </section>

      <section className="rounded-[26px] border border-white/8 bg-white/[.055] p-4 space-y-3">
        <div className="flex items-center gap-2"><Smartphone size={18} className="text-cyan-300"/><div><h2 className="font-black text-sm">رقم الهاتف</h2><p className="text-[10px] text-slate-500">الرقم الحالي: <span dir="ltr">{maskPhone(state.data.phone)}</span></p></div></div>
        <input dir="ltr" value={phone} onChange={event=>setPhone(event.target.value)} placeholder="+964..." disabled={busy||otpSent} className="w-full rounded-xl border border-white/10 bg-black/15 px-3 py-3 text-sm outline-none focus:border-cyan-400"/>
        {!otpSent?<button type="button" disabled={busy} onClick={()=>void requestPhoneOtp()} className="w-full min-h-[46px] rounded-xl bg-cyan-500/15 border border-cyan-400/20 text-cyan-200 text-sm font-black disabled:opacity-50">{busy?'جارٍ الإرسال…':'إرسال رمز التحقق'}</button>:<>
          <input dir="ltr" inputMode="numeric" value={otp} onChange={event=>setOtp(event.target.value.replace(/\D/g,'').slice(0,8))} placeholder="رمز التحقق" className="w-full rounded-xl border border-white/10 bg-black/15 px-3 py-3 text-center tracking-[.35em] outline-none focus:border-cyan-400"/>
          <div className="grid grid-cols-2 gap-2"><button type="button" disabled={busy} onClick={()=>void verifyPhone()} className="rounded-xl bg-cyan-500 text-slate-950 py-3 text-sm font-black disabled:opacity-50">{busy?'جارٍ التأكيد…':'تأكيد الرقم'}</button><button type="button" disabled={busy} onClick={()=>{setOtpSent(false);setOtp('');}} className="rounded-xl bg-white/[.07] py-3 text-sm">تغيير الرقم</button></div>
        </>}
      </section>

      <section className="rounded-[26px] border border-white/8 bg-white/[.055] p-4">
        <h2 className="font-black text-sm mb-2">الجلسات والأجهزة</h2>
        <p className="text-[11px] text-slate-500 mb-3">إذا لاحظت دخولاً غير معروف، يمكنك إنهاء جميع الجلسات الأخرى مع إبقاء هذا الجهاز.</p>
        <button type="button" disabled={busy} onClick={()=>void signOutOthers()} className="w-full min-h-[48px] rounded-xl bg-rose-500/10 border border-rose-400/20 text-rose-200 text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"><LogOut size={16}/>تسجيل خروج الأجهزة الأخرى</button>
      </section>

      <button type="button" onClick={()=>void state.reload()} className="w-full min-h-[48px] rounded-xl bg-white/[.055] border border-white/8 text-xs font-bold flex items-center justify-center gap-2"><RefreshCw size={15}/>تحديث معلومات الحساب</button>
    </main>}
  </div>;
};

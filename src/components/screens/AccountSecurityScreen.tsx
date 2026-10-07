import React from 'react';
import {ChevronRight, ShieldCheck, Smartphone, Mail, KeyRound, RefreshCw, LogOut} from 'lucide-react';
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

export const AccountSecurityScreen:React.FC=()=>{
  const {user,setActiveSubScreen,reportError}=useApp();
  const [phone,setPhone]=React.useState('');
  const [otp,setOtp]=React.useState('');
  const [otpSent,setOtpSent]=React.useState(false);
  const [busy,setBusy]=React.useState(false);
  const [notice,setNotice]=React.useState('');

  const load=React.useCallback(async()=>{
    const {data,error}=await supabase.auth.getUser();if(error)throw error;
    const auth=data.user;
    const providers=[...new Set((auth.identities||[]).map(identity=>identity.provider).filter(Boolean))];
    return {email:auth.email||null,phone:auth.phone||null,createdAt:auth.created_at,providers,lastSignInAt:auth.last_sign_in_at||null};
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

  return <div dir="rtl" className="min-h-screen bg-[#f5f6f7] text-slate-800 pb-24">
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 p-4 flex items-center gap-3">
      <button type="button" aria-label="الرجوع" onClick={()=>setActiveSubScreen('settings')} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"><ChevronRight/></button>
      <ShieldCheck className="text-emerald-600"/><div><h1 className="font-black">الحساب والأمان</h1><p className="text-[10px] text-slate-500">الربط الفعلي لحسابك وليس الملف العام</p></div>
    </header>
    {state.loading&&<InlineLoading>جارٍ تحميل معلومات الحساب…</InlineLoading>}
    {state.error&&<div className="p-4"><ErrorState message={state.error} onRetry={()=>void state.reload()}/></div>}
    {state.data&&<main className="p-4 space-y-4">
      {notice&&<div role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 text-xs font-bold">{notice}</div>}
      <section className="rounded-2xl bg-white border border-slate-100 shadow-xs p-4 space-y-3">
        <h2 className="font-black text-sm flex items-center gap-2"><KeyRound size={17}/>معلومات الحساب</h2>
        <div className="flex justify-between text-xs"><span className="text-slate-500">User ID</span><span className="ui-id font-bold">{user.id}</span></div>
        <div className="flex justify-between gap-3 text-xs"><span className="text-slate-500">تاريخ الإنشاء</span><span>{new Date(state.data.createdAt).toLocaleDateString('ar-SA')}</span></div>
        {state.data.lastSignInAt&&<div className="flex justify-between gap-3 text-xs"><span className="text-slate-500">آخر تسجيل دخول</span><span>{new Date(state.data.lastSignInAt).toLocaleString('ar-SA')}</span></div>}
      </section>

      <section className="rounded-2xl bg-white border border-slate-100 shadow-xs p-4 space-y-4">
        <h2 className="font-black text-sm">طرق الربط</h2>
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><Mail size={18} className="text-blue-500"/><span className="flex-1 min-w-0"><span className="block text-xs font-bold">البريد / Google</span><span className="block text-[11px] text-slate-500 truncate">{maskEmail(state.data.email)}</span></span><span className="text-[10px] rounded-full bg-emerald-100 text-emerald-700 px-2 py-1">{state.data.providers.includes('google')?'Google مرتبط':state.data.email?'مرتبط':'غير مربوط'}</span></div>
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><Smartphone size={18} className="text-emerald-500"/><span className="flex-1"><span className="block text-xs font-bold">رقم الهاتف</span><span className="block text-[11px] text-slate-500" dir="ltr">{maskPhone(state.data.phone)}</span></span><span className="text-[10px] rounded-full bg-slate-200 text-slate-600 px-2 py-1">{state.data.phone?'مرتبط':'اختياري'}</span></div>
      </section>

      <section className="rounded-2xl bg-white border border-slate-100 shadow-xs p-4 space-y-3">
        <h2 className="font-black text-sm">إضافة أو تغيير رقم الهاتف</h2>
        <p className="text-[11px] text-slate-500">التغيير لا يتم إلا بعد رمز تحقق يصل إلى الرقم الجديد.</p>
        <input dir="ltr" value={phone} onChange={event=>setPhone(event.target.value)} placeholder="+964..." disabled={busy||otpSent} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-emerald-400"/>
        {!otpSent?<button type="button" disabled={busy} onClick={()=>void requestPhoneOtp()} className="w-full rounded-xl bg-emerald-600 text-white py-3 text-sm font-black disabled:opacity-50">{busy?'جارٍ الإرسال…':'إرسال رمز التحقق'}</button>:<>
          <input dir="ltr" inputMode="numeric" value={otp} onChange={event=>setOtp(event.target.value.replace(/\D/g,'').slice(0,8))} placeholder="رمز التحقق" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center tracking-[.35em] outline-none focus:border-emerald-400"/>
          <div className="grid grid-cols-2 gap-2"><button type="button" disabled={busy} onClick={()=>void verifyPhone()} className="rounded-xl bg-emerald-600 text-white py-3 text-sm font-black disabled:opacity-50">{busy?'جارٍ التأكيد…':'تأكيد الرقم'}</button><button type="button" disabled={busy} onClick={()=>{setOtpSent(false);setOtp('');}} className="rounded-xl bg-slate-100 py-3 text-sm">تغيير الرقم</button></div>
        </>}
      </section>

      <section className="rounded-2xl bg-white border border-slate-100 shadow-xs p-4">
        <h2 className="font-black text-sm mb-2">الجلسات</h2>
        <p className="text-[11px] text-slate-500 mb-3">إذا شككت بدخول غير معروف، أنهِ جميع الجلسات الأخرى مع إبقاء هذا الجهاز.</p>
        <button type="button" disabled={busy} onClick={()=>void signOutOthers()} className="w-full rounded-xl bg-rose-50 border border-rose-200 text-rose-700 py-3 text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"><LogOut size={16}/>تسجيل خروج الأجهزة الأخرى</button>
      </section>
      <button type="button" onClick={()=>void state.reload()} className="w-full rounded-xl bg-white border border-slate-200 py-3 text-xs font-bold flex items-center justify-center gap-2"><RefreshCw size={15}/>تحديث معلومات الحساب</button>
    </main>}
  </div>;
};

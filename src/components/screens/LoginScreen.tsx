import {useDismissableLayer} from '../../hooks/useDismissableLayer';
import React, {useState} from 'react';
import {useApp} from '../../context/AppContext';
import {X, Smartphone, ChevronRight, ShieldCheck} from 'lucide-react';

const countries = [{code:'+964',name:'العراق'}, {code:'+966',name:'السعودية'}, {code:'+963',name:'سوريا'}, {code:'+971',name:'الإمارات'}, {code:'+965',name:'الكويت'}, {code:'+20',name:'مصر'}, {code:'+962',name:'الأردن'}];

export const LoginScreen: React.FC = () => {
  const {loginWithGoogle, loginWithPhone} = useApp();
  const [phoneOpen,setPhoneOpen]=useState(false);
  const [termsOpen,setTermsOpen]=useState(false);
  const [country,setCountry]=useState('+964');
  const [phone,setPhone]=useState('');
  const [sentPhone,setSentPhone]=useState('');
  const [otp,setOtp]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const phoneRef=useDismissableLayer(phoneOpen,()=>setPhoneOpen(false));
  const termsRef=useDismissableLayer(termsOpen,()=>setTermsOpen(false));

  const google = async () => {
    if (busy) return;
    setBusy(true); setError(null);
    try { await loginWithGoogle(); }
    catch { setError('تعذر تسجيل الدخول عبر Google. تحقق من الاتصال وحاول مجدداً.'); }
    finally { setBusy(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(null);
    try {
      if (!sentPhone) {
        const raw = phone.trim();
        const digits = raw.replace(/\D/g,'');
        if (!digits) throw new Error('أدخل رقم الهاتف.');
        const number = raw.startsWith('+') ? `+${digits}` : `${country}${digits.replace(/^0+/, '')}`;
        if (!/^\+[1-9]\d{7,14}$/.test(number)) throw new Error('رقم الهاتف غير صحيح. تحقق من رمز الدولة والرقم.');
        await loginWithPhone(number);
        setSentPhone(number);
      } else {
        const cleanOtp = otp.replace(/\D/g,'');
        if (!/^\d{6}$/.test(cleanOtp)) throw new Error('أدخل رمز التحقق المكون من ستة أرقام.');
        await loginWithPhone(sentPhone, cleanOtp);
        setPhoneOpen(false);
      }
    } catch(e) {
      setError(e instanceof Error ? e.message : 'تعذر تسجيل الدخول. حاول مجدداً.');
    } finally { setBusy(false); }
  };

  const closePhone = () => {
    if (busy) return;
    setPhoneOpen(false); setSentPhone(''); setOtp(''); setError(null);
  };

  return <div dir="rtl" className="relative min-h-[100dvh] max-w-md mx-auto overflow-hidden bg-black text-white flex flex-col justify-end">
    <img src="/assets/images/toti_clean_bg_1790424891818.jpg" alt="Toti Chat Background Template" className="absolute inset-0 w-full h-full object-cover"/>
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/5"/>
    {error && <p role="alert" aria-live="assertive" className="fixed top-4 inset-x-4 z-[100] max-w-md mx-auto bg-rose-950/95 border border-rose-400 rounded-xl p-3 text-center text-sm shadow-xl">{error}</p>}
    <main className="relative z-10 p-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] space-y-4 pt-[50dvh]">
      <button type="button" disabled={busy} onClick={google} className="w-full min-h-14 bg-white text-slate-900 rounded-full font-bold flex justify-between items-center px-6 disabled:opacity-50 active:scale-[.99] transition"><ChevronRight size={20}/><span>{busy ? 'يرجى الانتظار…' : 'سجل الدخول عبر Google'}</span><span className="text-blue-600 text-xl font-black" aria-hidden="true">G</span></button>
      <button type="button" disabled={busy} onClick={()=>{setPhoneOpen(true);setSentPhone('');setOtp('');setError(null);}} className="w-full min-h-14 bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-950 rounded-full font-bold flex justify-between items-center px-6 disabled:opacity-50 active:scale-[.99] transition"><ChevronRight size={20}/><span>سجل الدخول عبر الهاتف</span><Smartphone size={22}/></button>
      <button type="button" onClick={()=>setTermsOpen(true)} className="w-full min-h-11 flex items-center justify-center gap-2 text-sm text-slate-200"><ShieldCheck size={18}/>سياسة الاستخدام والخصوصية</button>
      <p className="p-4 rounded-2xl bg-black/70 border border-amber-500/40 text-sm text-center">للتواصل مع الدعم، سجّل الدخول ثم افتح الرسائل الرسمية داخل التطبيق.</p>
    </main>

    {phoneOpen && <div ref={phoneRef} className="fixed inset-0 z-50 p-4 bg-black/85 flex items-center justify-center"><section role="dialog" aria-modal="true" aria-labelledby="phone-title" className="w-full max-w-sm bg-slate-900 rounded-3xl p-5 border border-amber-500/40 shadow-2xl">
      <div className="flex items-center justify-between"><h2 id="phone-title" className="font-bold">تسجيل الدخول عبر رقم الهاتف</h2><button type="button" disabled={busy} aria-label="إغلاق" onClick={closePhone} className="p-2"><X size={20}/></button></div>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label htmlFor="login-phone" className="block text-sm">رقم الهاتف</label>
        <div dir="ltr" className="flex gap-2"><select aria-label="رمز الدولة" value={country} disabled={Boolean(sentPhone)||busy} onChange={e=>setCountry(e.target.value)} className="bg-slate-800 p-2 rounded-xl w-28 text-xs">{countries.map(c=><option key={c.code} value={c.code}>{c.name} {c.code}</option>)}</select><input id="login-phone" aria-label="رقم الهاتف" type="tel" placeholder="771 331 2563" required autoComplete="tel-national" value={phone} disabled={Boolean(sentPhone)||busy} onChange={e=>setPhone(e.target.value)} className="min-w-0 flex-1 bg-slate-800 rounded-xl p-3 text-sm disabled:opacity-60"/></div>
        {sentPhone && <><p className="text-xs text-emerald-300">تم إرسال رمز التحقق إلى {sentPhone}</p><input aria-label="رمز التحقق" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required maxLength={6} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="أدخل الرمز المكون من 6 أرقام" className="w-full bg-slate-800 rounded-xl p-3 text-center tracking-[.35em]"/><button disabled={busy} type="button" onClick={()=>{setSentPhone('');setOtp('');setError(null);}} className="text-xs text-slate-300 underline">تغيير رقم الهاتف</button></>}
        <button type="submit" disabled={busy} className="w-full min-h-12 bg-amber-400 text-slate-950 font-bold rounded-xl p-3 disabled:opacity-50">{busy ? 'جارٍ التحقق…' : sentPhone ? 'تأكيد ودخول الحساب' : 'إرسال رمز التحقق'}</button>
      </form>
    </section></div>}

    {termsOpen && <div ref={termsRef} className="fixed inset-0 z-50 p-4 bg-black/85 flex items-center justify-center"><section role="dialog" aria-modal="true" aria-labelledby="terms-title" className="w-full max-w-sm bg-slate-900 rounded-3xl p-5 space-y-4 shadow-2xl"><h2 id="terms-title" className="font-bold text-amber-300">سياسة الاستخدام والخصوصية</h2><p className="text-sm leading-7">احترم المستخدمين ولا تشارك رمز الدخول أو بيانات حسابك. عمليات الشحن تعتمد بعد تأكيد الدفع من الوكيل الرسمي، وتُحفظ الأرصدة والحركات في حسابك. استخدم التطبيق بصورة قانونية ومسؤولة.</p><button type="button" onClick={()=>setTermsOpen(false)} className="w-full min-h-11 bg-amber-400 text-black font-bold rounded-xl p-2">إغلاق</button></section></div>}
  </div>;
};

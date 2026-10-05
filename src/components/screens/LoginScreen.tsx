import React, {useState} from 'react';
import {useApp} from '../../context/AppContext';
import {X, Smartphone, Headphones, ChevronRight, ShieldCheck} from 'lucide-react';

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
  const google = async () => {
    if (busy) return; setBusy(true); setError(null);
    try {await loginWithGoogle();}
    catch {setError('تعذر تسجيل الدخول عبر Google. حاول مجدداً.');}
    finally {setBusy(false);}
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (busy) return; setBusy(true); setError(null);
    try {
      if (!sentPhone) {
        const digits=phone.replace(/\D/g,'');
        const number=phone.trim().startsWith('+') ? '+'+digits : country+digits.replace(/^0+/, '');
        await loginWithPhone(number); setSentPhone(number);
      } else {
        if (!/^\d{6}$/.test(otp)) throw new Error('أدخل رمز التحقق المكون من ستة أرقام.');
        await loginWithPhone(sentPhone,otp); setPhoneOpen(false);
      }
    } catch(e) {setError(e instanceof Error ? e.message : 'تعذر تسجيل الدخول. حاول مجدداً.');}
    finally {setBusy(false);}
  };
  return <div dir="rtl" className="relative min-h-screen max-w-md mx-auto bg-black text-white flex flex-col justify-end">
    <img src="/assets/images/toti_clean_bg_1790424891818.jpg" alt="Toti Chat Background Template" className="absolute inset-0 w-full h-full object-cover"/>
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent"/>
    {error && <p role="alert" className="fixed top-4 inset-x-4 z-[100] max-w-md mx-auto bg-rose-950 border border-rose-400 rounded-xl p-3 text-center">{error}</p>}
    <div className="relative p-6 pb-10 space-y-4 pt-[55vh]">
      <button disabled={busy} onClick={google} className="w-full h-14 bg-white text-slate-900 rounded-full font-bold flex justify-between items-center px-6 disabled:opacity-50"><ChevronRight size={20}/><span>سجل الدخول عبر جوجل</span><span className="text-blue-600 text-xl font-black" aria-hidden="true">G</span></button>
      <button disabled={busy} onClick={()=>{setPhoneOpen(true);setSentPhone('');setOtp('');setError(null);}} className="w-full h-14 bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-950 rounded-full font-bold flex justify-between items-center px-6 disabled:opacity-50"><ChevronRight size={20}/><span>سجل الدخول عبر الهاتف</span><Smartphone size={22}/></button>
      <button onClick={()=>setTermsOpen(true)} className="w-full flex items-center justify-center gap-2 text-sm text-slate-300"><ShieldCheck size={18}/>سياسة الاستخدام</button>
      <p className="p-4 rounded-2xl bg-black/70 border border-amber-500/40 text-sm">للتواصل مع الدعم داخل التطبيق، سجّل الدخول وافتح الرسائل الرسمية.</p>
    </div>
    {phoneOpen && <div className="fixed inset-0 z-50 p-4 bg-black/85 flex items-center justify-center"><section role="dialog" aria-modal="true" aria-labelledby="phone-title" className="w-full max-w-sm bg-slate-900 rounded-3xl p-5 border border-amber-500/40">
      <div className="flex items-center justify-between"><h2 id="phone-title" className="font-bold text-sm">تسجيل الدخول عبر رقم الهاتف</h2><button disabled={busy} aria-label="إغلاق" onClick={()=>setPhoneOpen(false)}><X size={20}/></button></div>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block text-sm">رقم الهاتف</label>
        <div dir="ltr" className="flex gap-2"><select aria-label="رمز الدولة" value={country} disabled={Boolean(sentPhone)||busy} onChange={e=>setCountry(e.target.value)} className="bg-slate-800 p-2 rounded-xl w-24 text-xs">{countries.map(c=><option key={c.code} value={c.code}>{c.name} {c.code}</option>)}</select><input aria-label="رقم الهاتف" type="tel" placeholder="771 331 2563" required autoComplete="tel-national" value={phone} disabled={Boolean(sentPhone)||busy} onChange={e=>setPhone(e.target.value)} className="min-w-0 flex-1 bg-slate-800 rounded-xl p-3 text-sm"/></div>
        {sentPhone && <><p className="text-xs text-emerald-300">تم إرسال رمز التحقق إلى رقمك.</p><input aria-label="رمز التحقق" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required maxLength={6} value={otp} onChange={e=>setOtp(e.target.value)} placeholder="أدخل الرمز المكون من 6 أرقام" className="w-full bg-slate-800 rounded-xl p-3 text-center"/><button type="button" onClick={()=>{setSentPhone('');setOtp('');}} className="text-xs text-slate-300">تغيير رقم الهاتف</button></>}
        <button type="submit" disabled={busy} className="w-full bg-amber-400 text-slate-950 font-bold rounded-xl p-3 disabled:opacity-50">{busy ? 'جارٍ التحقق…' : sentPhone ? 'تأكيد ودخول الحساب' : 'إرسال رمز التحقق'}</button>
      </form>
    </section></div>}
    {termsOpen && <div className="fixed inset-0 z-50 p-4 bg-black/85 flex items-center justify-center"><section role="dialog" aria-modal="true" aria-label="سياسة الاستخدام" className="max-w-sm bg-slate-900 rounded-3xl p-5 space-y-4"><h2 className="font-bold text-amber-300">سياسة الاستخدام</h2><p className="text-sm">احترم المستخدمين ولا تشارك رمز الدخول. عمليات الشحن تُعتمد بعد تأكيد الدفع من الوكيل الرسمي، والأرصدة محفوظة في حسابك. بعض مزايا الاشتراكات والمكافآت لم تُفعّل بعد.</p><button onClick={()=>setTermsOpen(false)} className="w-full bg-amber-400 text-black rounded-xl p-2">إغلاق</button></section></div>}
  </div>;
};

import {EmptyState,InlineLoading,ErrorState} from '../common/UIState';
import React, {useCallback, useState} from 'react';
import {useApp} from '../../context/AppContext';
import {usePublicChat} from '../../hooks/usePublicChat';
import {useServerData} from '../../hooks/useServerData';
import {rpc, backendMessage} from '../../services/backend';
import {supabase} from '../../services/supabase';

interface Agency {id: number; name: string; owner_id: string}
interface Member {public_id: number; display_name: string}
interface State {agency: Agency | null; available: Agency[]; members: Member[]; applications: Member[]}
interface RegistrationState {
  application: null | {id:string;status:'pending'|'approved'|'rejected';agency_name:string;submitted_at:string};
  can_apply: boolean;
}
type RegistrationFiles = {logo:File|null;identity:File|null;portrait:File|null};

const fileExtension = (file:File) => file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';

export const AgencyScreen: React.FC = () => {
  const {user, setActiveSubScreen, reportError} = useApp();
  const {opening, openChat} = usePublicChat();
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState('');
  const [showRegistration,setShowRegistration] = useState(false);
  const [agencyName,setAgencyName] = useState('');
  const [agentNumber,setAgentNumber] = useState('');
  const [fullName,setFullName] = useState('');
  const [countryCode,setCountryCode] = useState((user.countryCode || '').toUpperCase());
  const [files,setFiles] = useState<RegistrationFiles>({logo:null,identity:null,portrait:null});

  const load = useCallback(() => rpc<State>('agency_state'), [user.authId]);
  const registrationLoad = useCallback(() => rpc<RegistrationState>('agency_registration_state'), [user.authId]);
  const {data,loading,error,reload} = useServerData(load, {agency:null,available:[],members:[],applications:[]});
  const registration = useServerData(registrationLoad, {application:null,can_apply:false});

  const act = async (id: number, action: string, target?: number) => {
    if (busy) return; setBusy(true); setNotice('');
    try {await rpc('agency_action', {p_agency_id:id,p_action:action,p_target_public_id:target ?? null}); setNotice('تم اعتماد العملية من الخادم.'); await reload();}
    catch(e) {reportError(backendMessage(e));} finally {setBusy(false);}
  };

  const setRegistrationFile = (kind:keyof RegistrationFiles, file:File|null) => {
    if (file && (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size < 1 || file.size > 5*1024*1024)) {
      reportError('اختر صورة JPG أو PNG أو WebP بحجم لا يتجاوز 5MB.');
      return;
    }
    setFiles(previous=>({...previous,[kind]:file}));
  };

  const submitRegistration = async (event:React.FormEvent) => {
    event.preventDefault();
    if (busy || !registration.data?.can_apply) return;
    const name=agencyName.trim(), agent=agentNumber.trim(), person=fullName.trim(), country=countryCode.trim().toUpperCase();
    if (name.length<3 || name.length>80) {reportError('اسم الوكالة يجب أن يكون بين 3 و80 حرفاً.');return;}
    if (!/^[A-Z]{2}$/.test(country)) {reportError('اختر رمز دولة صحيحاً من حرفين.');return;}
    if (!agent || agent.length>40) {reportError('أدخل رقم الوكيل بشكل صحيح.');return;}
    if (person.length<5 || person.length>150 || person.split(/\s+/).filter(Boolean).length<3) {reportError('أدخل الاسم الثلاثي الكامل.');return;}
    if (!files.logo || !files.identity || !files.portrait) {reportError('ارفع شعار الوكالة وصورة الهوية والصورة الشخصية.');return;}
    if (!user.authId) {reportError('يرجى تسجيل الدخول مجدداً.');return;}

    setBusy(true);setNotice('');
    const requestId=crypto.randomUUID();
    try {
      const paths:Record<keyof RegistrationFiles,string>={logo:'',identity:'',portrait:''};
      for (const kind of ['logo','identity','portrait'] as const) {
        const file=files[kind]!;
        const path=`${user.authId}/${requestId}/${kind}-${crypto.randomUUID()}.${fileExtension(file)}`;
        const {error:uploadError}=await supabase.storage.from('agency-review').upload(path,file,{contentType:file.type,upsert:false});
        if(uploadError)throw uploadError;
        paths[kind]=path;
      }
      await rpc('submit_agency_registration',{
        p_request_id:requestId,
        p_agency_name:name,
        p_country_code:country,
        p_agent_number:agent,
        p_full_name:person,
        p_logo_path:paths.logo,
        p_identity_path:paths.identity,
        p_portrait_path:paths.portrait,
      });
      setNotice('تم إرسال طلب فتح الوكالة للمراجعة.');
      setShowRegistration(false);
      setFiles({logo:null,identity:null,portrait:null});
      await registration.reload();
    } catch(e) {
      reportError(backendMessage(e));
    } finally {setBusy(false);}
  };

  const agency = data?.agency;
  const isOwner = agency?.owner_id === user.authId;
  const application=registration.data?.application;

  return <div dir="rtl" className="min-h-screen bg-[#0b0c16] text-white p-4 pb-28">
    <header className="flex items-center gap-3 mb-4"><button className="ui-control px-3 rounded-xl bg-white/5" onClick={() => setActiveSubScreen(null)}>الرجوع</button><h1 className="text-base font-bold">بوابة الوكالات</h1></header>
    <img src="/assets/images/agency_login_portal_1790714750581.jpg" alt="بوابة الوكالة" className="w-full h-52 object-cover rounded-3xl mb-5" />
    {loading && <InlineLoading>جارٍ تحميل الوكالات…</InlineLoading>}{error && <ErrorState message={error} onRetry={()=>void reload()}/>} {notice && <p role="status" className="p-3 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mb-3">{notice}</p>}

    {agency && <section className="p-4 bg-white/10 rounded-2xl mb-4"><h2 className="font-bold text-base break-words">{agency.name}</h2><p className="ui-id text-xs text-slate-400 mt-1">ID: {agency.id}</p><p className="my-3">الأعضاء: {data.members.length}</p>
      {data.members.map(m => <div key={m.public_id} className="flex items-center justify-between gap-3 p-3 border-b border-white/5 min-w-0"><span className="min-w-0 flex-1"><span className="block text-sm truncate">{m.display_name}</span><span className="ui-id text-xs text-slate-400">ID: {m.public_id}</span></span>{isOwner && m.public_id !== Number(user.id) && <button className="ui-control px-3 rounded-xl text-rose-300 bg-rose-500/10" disabled={busy} onClick={() => void act(agency.id,'remove',m.public_id)}>إزالة</button>}</div>)}
      {isOwner && !data.applications.length && <div className="text-slate-400 mt-3"><EmptyState title="لا توجد طلبات انضمام معلقة" /></div>}{isOwner ? data.applications.map(m => <div key={m.public_id} className="flex flex-wrap items-center gap-2 p-3 border-b border-white/5"><span>{m.display_name}</span><button className="ui-control px-3 rounded-xl bg-emerald-700 text-white" disabled={busy} onClick={() => void act(agency.id,'accept',m.public_id)}>قبول</button><button className="ui-control px-3 rounded-xl bg-rose-500/10 text-rose-300" disabled={busy} onClick={() => void act(agency.id,'reject',m.public_id)}>رفض</button></div>) : <button className="ui-control px-3 rounded-xl bg-rose-500/10 text-rose-300" disabled={busy} onClick={() => void act(agency.id,'leave')}>مغادرة الوكالة</button>}
    </section>}

    {!loading && !error && !agency && <>
      <p className="mb-4">يمكنك طلب الانضمام إلى وكالة موجودة، أو تقديم طلب فتح وكالة جديدة للمراجعة.</p>
      {(data?.available || []).map(a => <div key={a.id} className="flex items-center gap-3 justify-between p-3 bg-white/10 rounded-xl mb-2"><span className="flex-1 min-w-0"><span className="block text-sm truncate">{a.name}</span><span className="ui-id text-xs text-slate-400">ID: {a.id}</span></span><button className="ui-control shrink-0 px-3 rounded-xl bg-purple-600 text-white text-xs" disabled={busy} onClick={() => void act(a.id,'request')}>طلب الانضمام</button></div>)}
      {!data?.available.length && <EmptyState title="لا توجد وكالات متاحة حالياً." />}

      <section className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4">
        <h2 className="font-bold text-amber-300">فتح وكالة جديدة</h2>
        {registration.loading && <InlineLoading>جارٍ التحقق من حالة الطلب…</InlineLoading>}
        {registration.error && <ErrorState message={registration.error} onRetry={()=>void registration.reload()}/>}
        {application && <div className="mt-3 rounded-xl bg-white/5 p-3"><p className="text-sm font-bold">{application.agency_name}</p><p className="text-xs text-slate-400 mt-1">حالة الطلب: {application.status==='pending'?'قيد المراجعة':application.status==='approved'?'تمت الموافقة':'مرفوض'}</p></div>}
        {!registration.loading && registration.data?.can_apply && !showRegistration && <button type="button" onClick={()=>setShowRegistration(true)} className="w-full mt-3 rounded-xl bg-amber-500 text-slate-950 font-black py-3">تقديم طلب فتح وكالة</button>}
        {showRegistration && registration.data?.can_apply && <form onSubmit={submitRegistration} className="mt-4 space-y-3">
          <label className="block text-xs text-slate-300">اسم الوكالة<input value={agencyName} onChange={e=>setAgencyName(e.target.value)} maxLength={80} className="mt-1 w-full rounded-xl bg-black/25 border border-white/10 p-3 text-white" required /></label>
          <label className="block text-xs text-slate-300">الاسم الثلاثي الكامل<input value={fullName} onChange={e=>setFullName(e.target.value)} maxLength={150} className="mt-1 w-full rounded-xl bg-black/25 border border-white/10 p-3 text-white" required /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-slate-300">رقم الوكيل<input value={agentNumber} onChange={e=>setAgentNumber(e.target.value)} maxLength={40} className="mt-1 w-full rounded-xl bg-black/25 border border-white/10 p-3 text-white" required /></label>
            <label className="block text-xs text-slate-300">رمز الدولة<input value={countryCode} onChange={e=>setCountryCode(e.target.value.toUpperCase().slice(0,2))} maxLength={2} className="mt-1 w-full rounded-xl bg-black/25 border border-white/10 p-3 text-white uppercase" required /></label>
          </div>
          <label className="block text-xs text-slate-300">شعار الوكالة<input aria-label="شعار الوكالة" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setRegistrationFile('logo',e.target.files?.[0]||null)} className="mt-1 block w-full text-xs" required /></label>
          <label className="block text-xs text-slate-300">صورة الهوية<input aria-label="صورة الهوية" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setRegistrationFile('identity',e.target.files?.[0]||null)} className="mt-1 block w-full text-xs" required /></label>
          <label className="block text-xs text-slate-300">صورة شخصية<input aria-label="صورة شخصية للوكالة" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setRegistrationFile('portrait',e.target.files?.[0]||null)} className="mt-1 block w-full text-xs" required /></label>
          <p className="text-[11px] text-slate-400">المستندات خاصة بالمراجعة ولا تظهر في الملف العام للوكالة.</p>
          <div className="grid grid-cols-2 gap-2"><button type="submit" disabled={busy} className="rounded-xl bg-emerald-600 py-3 font-bold disabled:opacity-50">{busy?'جارٍ الإرسال…':'إرسال الطلب'}</button><button type="button" disabled={busy} onClick={()=>setShowRegistration(false)} className="rounded-xl bg-white/10 py-3">إلغاء</button></div>
        </form>}
      </section>
    </>}

    <button disabled={opening} onClick={() => void openChat()} className="w-full p-4 mt-6 rounded-2xl bg-amber-700">الدعم الرسمي — <span>451305</span></button>
  </div>;
};

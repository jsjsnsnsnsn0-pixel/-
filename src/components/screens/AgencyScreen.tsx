import {EmptyState,InlineLoading,ErrorState} from '../common/UIState';
import React, {useCallback, useState} from 'react';
import {useApp} from '../../context/AppContext';
import {usePublicChat} from '../../hooks/usePublicChat';
import {useServerData} from '../../hooks/useServerData';
import {rpc, backendMessage} from '../../services/backend';
import {supabase} from '../../services/supabase';

interface Agency {id: number; name: string; owner_id: string}
interface DirectoryAgency {id:number;name:string;logo_url?:string|null;owner_name?:string|null;members_count?:number;requested?:boolean}
interface AgencyDetailState {agency:{id:number;name:string;logo_url?:string|null};is_member:boolean;can_manage:boolean;can_leave:boolean;has_pending_request?:boolean;can_request:boolean;members:Member[];applications:Member[]}
interface Member {public_id: number; display_name: string}
interface State {agency: Agency | null; available: Agency[]; members: Member[]; applications: Member[]}
interface RegistrationState {
  application: null | {id:string;status:'pending'|'approved'|'rejected'|'changes_requested';agency_name:string;submitted_at:string};
  can_apply: boolean;
}
type RegistrationFiles = {logo:File|null;identity:File|null;portrait:File|null};

const fileExtension = (file:File) => file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';

const LocalImagePreview: React.FC<{file:File|null;alt:string}> = ({file,alt}) => {
  const [url,setUrl]=React.useState('');
  React.useEffect(()=>{if(!file){setUrl('');return;}const next=URL.createObjectURL(file);setUrl(next);return()=>URL.revokeObjectURL(next);},[file]);
  return file&&url ? <img src={url} alt={alt} className="mt-2 h-24 w-full rounded-xl object-cover border border-white/10" /> : null;
};

type PortalMode = 'home' | 'agent' | 'host';

export const AgencyScreen: React.FC = () => {
  const {user, setActiveSubScreen, reportError} = useApp();
  const {opening, openChat} = usePublicChat();
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState('');
  const [showRegistration,setShowRegistration] = useState(false);
  const [portalMode,setPortalMode] = useState<PortalMode>('home');
  const [agencyName,setAgencyName] = useState('');
  const [agentNumber,setAgentNumber] = useState('');
  const [fullName,setFullName] = useState('');
  const [countryCode,setCountryCode] = useState((user.countryCode || '').toUpperCase());
  const [agencySearch,setAgencySearch] = useState('');
  const [selectedAgencyId,setSelectedAgencyId] = useState<number|null>(null);
  const [files,setFiles] = useState<RegistrationFiles>({logo:null,identity:null,portrait:null});

  const load = useCallback(() => rpc<State>('agency_state'), [user.authId]);
  const registrationLoad = useCallback(() => rpc<RegistrationState>('agency_registration_state'), [user.authId]);
  const directoryLoad = useCallback(() => rpc<DirectoryAgency[]>('agency_directory'), [user.authId]);
  const detailLoad = useCallback(() => selectedAgencyId ? rpc<AgencyDetailState>('agency_detail',{p_agency_id:selectedAgencyId}) : Promise.resolve(null), [selectedAgencyId,user.authId]);
  const {data,loading,error,reload} = useServerData(load, {agency:null,available:[],members:[],applications:[]});
  const registration = useServerData(registrationLoad, {application:null,can_apply:false});
  const directory = useServerData(directoryLoad, []);
  const detail = useServerData(detailLoad, null);

  const act = async (id: number, action: string, target?: number) => {
    if (busy) return; setBusy(true); setNotice('');
    try {
      await rpc('agency_action', {p_agency_id:id,p_action:action,p_target_public_id:target ?? null});
      setNotice(action==='request'?'تم إرسال طلب الانضمام كمضيف وهو قيد المراجعة.':'تم اعتماد العملية من الخادم.');
      await Promise.all([reload(),directory.reload(),detail.reload()]);
    }
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
  const normalizedAgencySearch=agencySearch.trim().toLowerCase();
  const visibleAgencies=(directory.data||[]).filter(item=>!normalizedAgencySearch||item.name.toLowerCase().includes(normalizedAgencySearch)||String(item.id).includes(normalizedAgencySearch));

  return <div dir="rtl" className="min-h-screen bg-[#0b0c16] text-white p-4 pb-28">
    <header className="flex items-center gap-3 mb-4"><button className="ui-control px-3 rounded-xl bg-white/5" onClick={() => {if(!agency&&portalMode!=='home'){setPortalMode('home');setShowRegistration(false);}else setActiveSubScreen(null);}}>الرجوع</button><h1 className="text-base font-bold">بوابة الوكالات</h1></header>
    <img src="/assets/images/agency_login_portal_1790714750581.jpg" alt="بوابة الوكالة" className="w-full h-52 object-cover rounded-3xl mb-5" />
    {loading && <InlineLoading>جارٍ تحميل الوكالات…</InlineLoading>}{error && <ErrorState message={error} onRetry={()=>void reload()}/>} {notice && <p role="status" className="p-3 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mb-3">{notice}</p>}

    {agency && <section className="p-4 bg-white/10 rounded-2xl mb-4"><h2 className="font-bold text-base break-words">{agency.name}</h2><p className="ui-id text-xs text-slate-400 mt-1">ID: {agency.id}</p><p className="my-3">الأعضاء: {data.members.length}</p>
      {data.members.map(m => <div key={m.public_id} className="flex items-center justify-between gap-3 p-3 border-b border-white/5 min-w-0"><span className="min-w-0 flex-1"><span className="block text-sm truncate">{m.display_name}</span><span className="ui-id text-xs text-slate-400">ID: {m.public_id}</span></span>{isOwner && m.public_id !== Number(user.id) && <button className="ui-control px-3 rounded-xl text-rose-300 bg-rose-500/10" disabled={busy} onClick={() => void act(agency.id,'remove',m.public_id)}>إزالة</button>}</div>)}
      {isOwner && !data.applications.length && <div className="text-slate-400 mt-3"><EmptyState title="لا توجد طلبات انضمام معلقة" /></div>}{isOwner ? data.applications.map(m => <div key={m.public_id} className="flex flex-wrap items-center gap-2 p-3 border-b border-white/5"><span>{m.display_name}</span><button className="ui-control px-3 rounded-xl bg-emerald-700 text-white" disabled={busy} onClick={() => void act(agency.id,'accept',m.public_id)}>قبول</button><button className="ui-control px-3 rounded-xl bg-rose-500/10 text-rose-300" disabled={busy} onClick={() => void act(agency.id,'reject',m.public_id)}>رفض</button></div>) : <button className="ui-control px-3 rounded-xl bg-rose-500/10 text-rose-300" disabled={busy} onClick={() => void act(agency.id,'leave')}>مغادرة الوكالة</button>}
    </section>}

    {!loading && !error && !agency && <>
      {portalMode === 'home' && <section className="space-y-3">
        <p className="text-sm text-slate-300 mb-2">اختر طريقة الدخول إلى نظام الوكالات.</p>
        <button type="button" onClick={()=>{setPortalMode('agent');setShowRegistration(true);}} className="w-full rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-600/20 to-yellow-500/10 p-5 text-right active:scale-[0.99] transition-transform">
          <span className="block text-lg font-black text-amber-300">سجل الدخول كوكيل</span>
          <span className="block text-xs text-slate-300 mt-1">تقديم طلب فتح وكالة جديدة وإرساله للمراجعة.</span>
        </button>
        <button type="button" onClick={()=>setPortalMode('host')} className="w-full rounded-2xl border border-purple-400/25 bg-gradient-to-r from-purple-700/20 to-fuchsia-600/10 p-5 text-right active:scale-[0.99] transition-transform">
          <span className="block text-lg font-black text-purple-200">سجل الدخول كمضيف</span>
          <span className="block text-xs text-slate-300 mt-1">استعرض جميع الوكالات المتاحة وقدم طلب انضمام.</span>
        </button>
      </section>}

      {portalMode === 'host' && <section>
        {selectedAgencyId && detail.data ? <div className="space-y-3">
          <button type="button" onClick={()=>setSelectedAgencyId(null)} className="text-xs text-purple-200 rounded-xl bg-white/5 px-3 py-2">الرجوع إلى قائمة الوكالات</button>
          <div className="rounded-2xl border border-purple-400/20 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              {detail.data.agency.logo_url?<img src={detail.data.agency.logo_url} alt="" loading="lazy" className="w-16 h-16 rounded-2xl object-cover border border-white/10"/>:<span className="w-16 h-16 rounded-2xl bg-purple-500/15 flex items-center justify-center text-3xl" aria-hidden="true">🏛️</span>}
              <span className="min-w-0 flex-1"><span className="block text-lg font-black truncate">{detail.data.agency.name}</span><span className="ui-id text-xs text-slate-400">ID: {detail.data.agency.id}</span><span className="block text-[11px] text-slate-400 mt-1">{detail.data.members.length} عضو</span></span>
            </div>
            <div className="mt-4 flex -space-x-2 space-x-reverse overflow-hidden" aria-label="أعضاء الوكالة">
              {detail.data.members.slice(0,6).map(member=><span key={member.public_id} title={member.display_name} className="w-9 h-9 rounded-full bg-purple-700 border-2 border-[#171325] flex items-center justify-center text-[10px] font-black">{member.display_name?.slice(0,1)||'U'}</span>)}
            </div>
            <button type="button" disabled={busy||detail.data.is_member||detail.data.has_pending_request||!detail.data.can_request} onClick={()=>void act(detail.data!.agency.id,'request')} className="mt-4 w-full rounded-xl bg-purple-600 py-3 font-black text-sm disabled:opacity-50">
              {detail.data.is_member?'أنت عضو في هذه الوكالة':detail.data.has_pending_request?'طلبك قيد المراجعة':detail.data.can_request?'طلب الانضمام كمضيف':'لا يمكن تقديم طلب حالياً'}
            </button>
          </div>
        </div> : <>
          <div className="flex items-center justify-between mb-3"><h2 className="font-bold">الوكالات المتاحة</h2><span className="text-xs text-slate-400">{directory.data?.length || 0} وكالة</span></div>
          <label className="block mb-3"><span className="sr-only">بحث الوكالات</span><input value={agencySearch} onChange={event=>setAgencySearch(event.target.value)} placeholder="ابحث باسم الوكالة أو ID" className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-400/50" /></label>
          {directory.loading&&<InlineLoading>جارٍ تحميل قائمة الوكالات…</InlineLoading>}
          {directory.error&&<ErrorState message={directory.error} onRetry={()=>void directory.reload()}/>}
          {!directory.loading&&!directory.error&&visibleAgencies.map(a => <button type="button" key={a.id} onClick={()=>setSelectedAgencyId(a.id)} className="w-full flex items-center gap-3 p-3 bg-white/10 rounded-xl mb-2 text-right active:scale-[0.99] transition-transform">
            {a.logo_url?<img src={a.logo_url} alt="" loading="lazy" className="w-11 h-11 rounded-xl object-cover shrink-0"/>:<span className="w-11 h-11 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0" aria-hidden="true">🏛️</span>}
            <span className="flex-1 min-w-0"><span className="block text-sm font-bold truncate">{a.name}</span><span className="ui-id text-xs text-slate-400">ID: {a.id}</span>{a.owner_name&&<span className="block text-[10px] text-slate-400 truncate">الوكيل: {a.owner_name}</span>}{typeof a.members_count==='number'&&<span className="block text-[10px] text-slate-500">{a.members_count} عضو</span>}</span>
            <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${a.requested?'bg-amber-500/15 text-amber-200':'bg-purple-500/20 text-purple-200'}`}>{a.requested?'قيد المراجعة':'عرض'}</span>
          </button>)}
          {!directory.loading&&!directory.error&&!visibleAgencies.length&&<EmptyState title={normalizedAgencySearch?"لا توجد وكالة مطابقة للبحث.":"لا توجد وكالات متاحة حالياً."} />}
        </>}
        {selectedAgencyId&&detail.loading&&<InlineLoading>جارٍ تحميل تفاصيل الوكالة…</InlineLoading>}
        {selectedAgencyId&&detail.error&&<ErrorState message={detail.error} onRetry={()=>void detail.reload()}/>}
      </section>}

      {portalMode === 'agent' && <section className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4">
        <h2 className="font-bold text-amber-300">طلب تسجيل وكيل وفتح وكالة</h2>
        {registration.loading && <InlineLoading>جارٍ التحقق من حالة الطلب…</InlineLoading>}
        {registration.error && <ErrorState message={registration.error} onRetry={()=>void registration.reload()}/>}
        {application && <div className="mt-3 rounded-xl bg-white/5 p-3"><p className="text-sm font-bold">{application.agency_name}</p><p className="text-xs text-slate-400 mt-1">حالة الطلب: {application.status==='pending'?'قيد المراجعة':application.status==='approved'?'تمت الموافقة':'مرفوض'}</p></div>}
        {!registration.loading && registration.data?.can_apply && !showRegistration && <button type="button" onClick={()=>setShowRegistration(true)} className="w-full mt-3 rounded-xl bg-amber-500 text-slate-950 font-black py-3">فتح الاستمارة</button>}
        {showRegistration && registration.data?.can_apply && <form onSubmit={submitRegistration} className="mt-4 space-y-3">
          <label className="block text-xs text-slate-300">اسم الوكالة<input value={agencyName} onChange={e=>setAgencyName(e.target.value)} maxLength={80} className="mt-1 w-full rounded-xl bg-black/25 border border-white/10 p-3 text-white" required /></label>
          <label className="block text-xs text-slate-300">ID الوكيل<input value={user.id} readOnly className="mt-1 w-full rounded-xl bg-black/25 border border-white/10 p-3 text-slate-300 ui-id" /></label>
          <label className="block text-xs text-slate-300">الاسم الثلاثي الكامل<input value={fullName} onChange={e=>setFullName(e.target.value)} maxLength={150} className="mt-1 w-full rounded-xl bg-black/25 border border-white/10 p-3 text-white" required /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-slate-300">رقم الوكيل<input value={agentNumber} onChange={e=>setAgentNumber(e.target.value)} maxLength={40} className="mt-1 w-full rounded-xl bg-black/25 border border-white/10 p-3 text-white" required /></label>
            <label className="block text-xs text-slate-300">البلد / رمز الدولة<input value={countryCode} onChange={e=>setCountryCode(e.target.value.toUpperCase().slice(0,2))} maxLength={2} className="mt-1 w-full rounded-xl bg-black/25 border border-white/10 p-3 text-white uppercase" required /></label>
          </div>
          <label className="block text-xs text-slate-300">صورة / شعار الوكالة<input aria-label="شعار الوكالة" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setRegistrationFile('logo',e.target.files?.[0]||null)} className="mt-1 block w-full text-xs" required /><LocalImagePreview file={files.logo} alt="معاينة شعار الوكالة" /></label>
          <label className="block text-xs text-slate-300">صورة البطاقة الشخصية<input aria-label="صورة الهوية" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setRegistrationFile('identity',e.target.files?.[0]||null)} className="mt-1 block w-full text-xs" required /><LocalImagePreview file={files.identity} alt="معاينة البطاقة الشخصية" /></label>
          <label className="block text-xs text-slate-300">صورة شخصية حقيقية<input aria-label="صورة شخصية للوكالة" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setRegistrationFile('portrait',e.target.files?.[0]||null)} className="mt-1 block w-full text-xs" required /><LocalImagePreview file={files.portrait} alt="معاينة الصورة الشخصية" /></label>
          <p className="text-[11px] text-slate-400">المستندات مخصصة للمراجعة الإدارية ولا تظهر في الملف العام أو الغرف.</p>
          <div className="grid grid-cols-2 gap-2"><button type="submit" disabled={busy} className="rounded-xl bg-emerald-600 py-3 font-bold disabled:opacity-50">{busy?'جارٍ الإرسال…':'إرسال الطلب'}</button><button type="button" disabled={busy} onClick={()=>setShowRegistration(false)} className="rounded-xl bg-white/10 py-3">إلغاء</button></div>
        </form>}
      </section>}
    </>}

    <button disabled={opening} onClick={() => void openChat()} className="w-full p-4 mt-6 rounded-2xl bg-amber-700">الدعم الرسمي — <span>451305</span></button>
  </div>;
};

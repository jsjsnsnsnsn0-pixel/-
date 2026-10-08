import React,{useCallback,useEffect,useRef,useState} from 'react';
import {useApp} from '../../context/AppContext';
import {useServerData} from '../../hooks/useServerData';
import {backendMessage,rpc} from '../../services/backend';
import {agencyCountries,agencyDocumentPath,documentKinds,submitAgencyRegistration,uploadAgencyDocument,validateAgencyFields,validateAgencyImage,type AgencyApplicationInput,type DocumentKind,type RegistrationState} from '../../services/agencyRegistration';
import {ErrorState,InlineLoading} from '../common/UIState';

const labels:Record<DocumentKind,string>={logo:'صورة أو شعار الوكالة',identity:'صورة البطاقة الشخصية',portrait:'صورة شخصية حقيقية'};
const statuses={pending:'قيد المراجعة',approved:'تمت الموافقة',rejected:'مرفوض'};
export const AgencyRegistrationForm:React.FC=()=>{
 const {user}=useApp();
 const load=useCallback(()=>rpc<RegistrationState>('agency_registration_state'),[user.authId]);
 const {data,loading,error,reload}=useServerData(load,{application:null,can_apply:false});
 const [input,setInput]=useState<AgencyApplicationInput>({agencyName:'',country:'',agentNumber:'',fullName:''});
 const [images,setImages]=useState<Partial<Record<DocumentKind,{file:File;url:string;path:string}>>>({});
 const imagesRef=useRef(images);imagesRef.current=images;
 const requestId=useRef(crypto.randomUUID()),uploaded=useRef<Partial<Record<DocumentKind,string>>>({});
 const submitting=useRef(false),snapshot=useRef<AgencyApplicationInput|null>(null);
 const [busy,setBusy]=useState(false),[locked,setLocked]=useState(false),[notice,setNotice]=useState(''),[sent,setSent]=useState(false);
 useEffect(()=>()=>{Object.values(imagesRef.current).forEach(image=>image&&URL.revokeObjectURL(image.url))},[]);
 useEffect(()=>{const sync=()=>{if(document.visibilityState!=='hidden')void reload()};window.addEventListener('focus',sync);const timer=setInterval(sync,15000);return()=>{window.removeEventListener('focus',sync);clearInterval(timer)}},[reload]);
 const choose=(kind:DocumentKind,file?:File)=>{
  if(!file||busy||locked)return;const invalid=validateAgencyImage(file);if(invalid){setNotice(invalid);return}
  const previous=images[kind];if(previous)URL.revokeObjectURL(previous.url);
  uploaded.current[kind]=undefined;
  setImages(old=>({...old,[kind]:{file,url:URL.createObjectURL(file),path:agencyDocumentPath(user.authId!,requestId.current,kind,file)}}));setNotice('');
 };
 const submit=async(e:React.FormEvent)=>{
  e.preventDefault();if(submitting.current||loading||error||!data.can_apply||!user.authId)return;
  const invalid=validateAgencyFields(input);if(invalid){setNotice(invalid);return}
  if(documentKinds.some(kind=>!images[kind])){setNotice('أرفق شعار الوكالة والهوية والصورة الشخصية.');return}
  submitting.current=true;setBusy(true);setNotice('');
  try{
   for(const kind of documentKinds){const image=images[kind]!;if(!uploaded.current[kind])uploaded.current[kind]=await uploadAgencyDocument(user.authId,requestId.current,kind,image.file,image.path)}
   // Freeze a sent payload while its outcome is uncertain. Retrying uses the
   // same ID and data; the server returns the existing receipt exactly once.
   snapshot.current??={...input};setLocked(true);
   await submitAgencyRegistration(requestId.current,snapshot.current,uploaded.current as Record<DocumentKind,string>);
   setSent(true);setNotice('تم إرسال طلب تسجيل الوكالة وهو قيد المراجعة.');void reload();
  }catch(err){setNotice(backendMessage(err));void reload()}
  finally{submitting.current=false;setBusy(false)}
 };
 if(loading&&!sent&&!data.can_apply&&!data.application)return <InlineLoading>جارٍ تحميل حالة الطلب…</InlineLoading>;
 if(error&&!sent)return <ErrorState message={error} onRetry={()=>void reload()}/>;
 if(sent||data.application?.status==='pending')return <section className="rounded-2xl border border-amber-300/25 bg-white/5 p-5" role="status"><h2 className="text-amber-200 font-bold mb-2">طلب تسجيل الوكالة قيد المراجعة</h2><p>تم إرسال طلب تسجيل الوكالة وهو قيد المراجعة.</p><p className="text-sm text-slate-400 mt-3">لا تمنحك الاستمارة عضوية أو صلاحيات وكالة قبل الموافقة.</p></section>;
 if(!data.can_apply)return <p className="rounded-2xl bg-white/5 p-4">لديك عضوية وكالة بالفعل. يمكنك فتح وكالتك من البروفايل.</p>;
 const field=(key:keyof AgencyApplicationInput,label:string,maxLength:number)=> <label className="block space-y-2"><span>{label} *</span><input required value={input[key]} maxLength={maxLength} disabled={busy||locked} onChange={e=>setInput(old=>({...old,[key]:e.target.value}))} className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white disabled:opacity-60" /></label>;
 return <form onSubmit={e=>void submit(e)} className="space-y-5">
  <h2 className="font-bold text-lg text-amber-200">طلب تسجيل وكيل / وكالة</h2>
  {data.application&&<p className="text-sm text-slate-300">حالة الطلب السابق: {statuses[data.application.status]}</p>}
  <p className="text-sm text-slate-400">الحقول المعلّمة بـ * مطلوبة. الصور بصيغة JPG أو PNG أو WebP، حتى 5 MB لكل صورة.</p>
  <label className="block rounded-2xl border border-amber-300/20 bg-white/5 p-4 space-y-3"><span>{labels.logo} *</span>{images.logo&&<img src={images.logo.url} alt="معاينة شعار الوكالة" className="w-24 h-24 object-cover rounded-xl" />}<input aria-label={labels.logo} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy||locked} onChange={e=>choose('logo',e.target.files?.[0])} className="block w-full text-sm" /></label>
  {field('agencyName','اسم الوكالة',80)}
  <label className="block space-y-2"><span>ID الوكيل</span><input readOnly value={user.id} className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-slate-400" /><span className="block text-xs text-slate-400">الطلب مرتبط بحسابك الحالي تلقائياً.</span></label>
  <label className="block space-y-2"><span>البلد *</span><select required disabled={busy||locked} value={input.country} onChange={e=>setInput(old=>({...old,country:e.target.value}))} className="w-full rounded-xl border border-white/15 bg-[#151321] p-3"><option value="">اختر البلد</option>{agencyCountries.map(c=><option key={c.code} value={c.code}>{c.name}</option>)}</select></label>
  {field('agentNumber','رقم الوكيل',40)}{field('fullName','اسم الوكيل الثلاثي',150)}
  <p className="text-sm text-amber-200/80">الهوية والصورة الشخصية مخصصتان للمراجعة الإدارية فقط، ولا تظهران في البروفايل أو الغرفة أو صفحة الوكالة.</p>
  {(['identity','portrait'] as DocumentKind[]).map(kind=><label key={kind} className="block rounded-2xl border border-white/15 bg-white/5 p-4 space-y-3"><span>{labels[kind]} *</span>{images[kind]&&<img src={images[kind]!.url} alt={`معاينة ${labels[kind]}`} className="max-h-40 max-w-full object-contain rounded-xl" />}<input aria-label={labels[kind]} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy||locked} onChange={e=>choose(kind,e.target.files?.[0])} className="block w-full text-sm" /></label>)}
  {notice&&<p role="alert" className="rounded-xl bg-amber-500/10 p-3 text-sm">{notice}</p>}
  <button disabled={busy} className="w-full rounded-2xl bg-gradient-to-l from-amber-300 to-amber-600 p-4 font-bold text-[#151321] disabled:opacity-50">{busy?'جارٍ إرسال الطلب…':locked?'إعادة محاولة إرسال الطلب':'إرسال الطلب'}</button>
 </form>;
};

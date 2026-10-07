import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {supabase} from '../../services/supabase';
import {ArrowRight,RefreshCw,ShieldCheck,Users,Coins,Building2,ClipboardList,Settings2,KeyRound} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {rpc,backendMessage} from '../../services/backend';
import {useServerData} from '../../hooks/useServerData';
import {EmptyState,ErrorState,InlineLoading} from '../common/UIState';

type Session={allowed:boolean;owner?:boolean;role?:string;permissions?:string[]};
type Summary={users:number;active_users:number;active_rooms:number;gifts_today:number;coins_in_circulation:number;agencies:number;hosts:number;pending_agency_registrations:number};
type UserRow={id:string;public_id:number;username:string;display_name:string;avatar_url:string|null;gold:number;diamonds:number;level:number;vip_level:number;country_code:string;dashboard_role:string|null;email:string|null;created_at:string;last_seen_at:string|null};
type RoleState={roles:{id:string;label:string;built_in:boolean;permissions:string[]}[];permissions:string[]};
type AgencyApplication={id:string;applicant_public_id:number;agency_name:string;country_code:string;agent_number:string;full_name:string;status:string;submitted_at:string;review_note:string|null;logo_path:string;identity_path:string;portrait_path:string};
type LedgerEntry={id:string;created_at:string;operator_name:string;public_id:number;target_public_id:number;delta:number;previous_balance:number;new_balance:number;reason:string};
type AuditEntry={id:string;operator_name:string;action:string;created_at:string;metadata:Record<string,unknown>};

const sections=[
 {id:'overview',name:'الرئيسية',perm:'dashboard.view',Icon:ClipboardList},
 {id:'users',name:'المستخدمون',perm:'users.view',Icon:Users},
 {id:'wallet',name:'إدارة العملات',perm:'wallet.history',Icon:Coins},
 {id:'roles',name:'الرتب والصلاحيات',perm:'roles.view',Icon:KeyRound},
 {id:'agencies',name:'طلبات الوكالات',perm:'agencies.view',Icon:Building2},
 {id:'audit',name:'سجل الإدارة',perm:'audit.view',Icon:ShieldCheck},
 {id:'settings',name:'إعدادات Beta',perm:'system.settings',Icon:Settings2},
] as const;
type SectionId=(typeof sections)[number]['id'];
const cls='w-full rounded-xl border border-white/15 bg-[#1b1d30] text-white px-3 py-2 outline-none focus:border-cyan-400';
const date=(x:string)=>new Date(x).toLocaleString('ar-IQ');
const num=(x:number)=>Number(x||0).toLocaleString('ar-IQ');

export const DashboardScreen:React.FC=()=>{
 const {user,logout,refreshProfile}=useApp();
 const loadSession=useCallback(()=>rpc<Session>('dashboard_session'),[user.authId]);
 const session=useServerData(loadSession,{allowed:false,permissions:[]} as Session);
 useEffect(()=>{
   if(!user.authId||!session.data.allowed)return;
   const channel=supabase.channel('dashboard-permissions:'+user.authId)
    .on('postgres_changes',{event:'*',schema:'public',table:'dashboard_user_roles',filter:`user_id=eq.${user.authId}`},()=>void session.reload())
    .on('postgres_changes',{event:'*',schema:'public',table:'dashboard_role_permissions'},()=>void session.reload())
    .subscribe();
   const timer=setInterval(()=>void session.reload(),20000);
   return()=>{clearInterval(timer);void supabase.removeChannel(channel);};
 },[user.authId,session.data.allowed,session.reload]);
 const permissions=session.data.permissions||[];
 const can=(name:string)=>permissions.includes(name);
 const [section,setSection]=useState<SectionId>('overview');
 const [notice,setNotice]=useState('');
 const [failure,setFailure]=useState('');
 const [updating,setUpdating]=useState(false);
 const [search,setSearch]=useState('');
 const [query,setQuery]=useState('');
 const [userId,setUserId]=useState('');
 const [delta,setDelta]=useState('');
 const [reason,setReason]=useState('');
 const requestId=useRef<string|null>(null);
 const [selectedRole,setSelectedRole]=useState('support');
 const [roleLabel,setRoleLabel]=useState('Support');
 const [rolePermissions,setRolePermissions]=useState<string[]>([]);
 const [assignUserId,setAssignUserId]=useState('');
 const [assignRole,setAssignRole]=useState('support');
 const allowed=sections.filter(s=>can(s.perm)||session.data.owner||(s.id==='wallet'&&(can('wallet.credit')||can('wallet.debit')||can('wallet.view'))));
 const active=allowed.some(s=>s.id===section)?section:(allowed[0]?.id||'overview');
 const dashboardEnabled=session.data.allowed;
 const overview=useServerData(useCallback(
   ()=>dashboardEnabled&&active==='overview'?rpc<Summary>('dashboard_overview'):Promise.resolve({} as Summary),
   [dashboardEnabled,active]),{} as Summary);
 const users=useServerData(useCallback(
   ()=>dashboardEnabled&&active==='users'?rpc<UserRow[]>('dashboard_users',{p_search:query,p_limit:50}):Promise.resolve([]),
   [dashboardEnabled,active,query]),[] as UserRow[]);
 const roles=useServerData(useCallback(
   ()=>dashboardEnabled&&active==='roles'?rpc<RoleState>('dashboard_roles_state'):Promise.resolve({roles:[],permissions:[]}),
   [dashboardEnabled,active]),{roles:[],permissions:[]} as RoleState);
 const agencies=useServerData(useCallback(
   ()=>dashboardEnabled&&active==='agencies'?rpc<AgencyApplication[]>('dashboard_agency_registrations'):Promise.resolve([]),
   [dashboardEnabled,active]),[] as AgencyApplication[]);
 const history=useServerData(useCallback(
   ()=>dashboardEnabled&&active==='wallet'?rpc<LedgerEntry[]>('dashboard_wallet_history'):Promise.resolve([]),
   [dashboardEnabled,active]),[] as LedgerEntry[]);
 const audit=useServerData(useCallback(
   ()=>dashboardEnabled&&active==='audit'?rpc<AuditEntry[]>('dashboard_audit_history'):Promise.resolve([]),
   [dashboardEnabled,active]),[] as AuditEntry[]);
 const flags=useServerData(useCallback(
   ()=>dashboardEnabled&&active==='settings'?rpc<Record<string,boolean>>('beta_flags_state'):Promise.resolve({}),
   [dashboardEnabled,active]),{} as Record<string,boolean>);
 const selection=useMemo(()=>roles.data.roles.find(r=>r.id===selectedRole),[selectedRole,roles.data.roles]);
 useEffect(()=>{if(selection){setRoleLabel(selection.label);setRolePermissions(selection.permissions)}},[selection]);
 const execute=async(fn:()=>Promise<unknown>,onDone?:()=>Promise<unknown>)=>{
   if(updating)return;
   setUpdating(true);setNotice('');setFailure('');
   try{await fn();if(onDone)await onDone();setNotice('تم حفظ العملية وتأكيدها من الخادم.')}
   catch(e){setFailure(backendMessage(e));}
   finally{setUpdating(false);}
 };
 const adjustWallet=async(event:React.FormEvent)=>{
   event.preventDefault();
   const publicId=Number(userId),amount=Number(delta);
   if(!Number.isSafeInteger(publicId)||publicId<=0||!Number.isSafeInteger(amount)||amount===0||Math.abs(amount)>1e9){setFailure('تحقق من رقم المستخدم وقيمة العملية.');return;}
   if(reason.trim().length<10){setFailure('سبب العملية يجب أن لا يقل عن 10 حروف.');return;}
   const id=requestId.current||crypto.randomUUID();requestId.current=id;
   await execute(async()=>{
     await rpc('dashboard_wallet_adjust',{p_public_id:publicId,p_delta:amount,p_reason:reason.trim(),p_request_id:id});
     requestId.current=null;setDelta('');setReason('');
   },async()=>{await Promise.all([history.reload(),refreshProfile()]);});
 };
 if(session.loading)return <div className="min-h-screen bg-[#0b0d19] p-8 text-white" dir="rtl"><InlineLoading>جاري التحقق من صلاحية لوحة التحكم…</InlineLoading></div>;
 if(session.error)return <div className="min-h-screen bg-[#0b0d19] p-8 text-white" dir="rtl"><ErrorState message={session.error} onRetry={()=>void session.reload()}/></div>;
 if(!dashboardEnabled)return <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0b0d19] text-white text-center gap-4" dir="rtl">
   <ShieldCheck size={45} className="text-amber-300"/><h1 className="text-xl font-bold">الدخول محمي</h1>
   <p className="text-sm text-slate-400">هذا الحساب لا يملك صلاحية فتح Dashboard. الرابط وحده لا يمنح أي صلاحية.</p>
   <button type="button" className="rounded-xl bg-cyan-600 px-6 py-3" onClick={()=>{window.location.href='/'}}>العودة إلى التطبيق</button>
 </div>;
 return <div className="min-h-screen bg-[#090c18] text-white" dir="rtl" data-testid="secure-admin-dashboard">
  <header className="sticky top-0 z-40 border-b border-white/10 bg-[#121629]/95 backdrop-blur p-3 md:px-8 flex flex-wrap items-center justify-between gap-2">
   <div className="flex items-center gap-3"><ShieldCheck className="text-cyan-300"/><div><h1 className="font-black">لوحة تحكم TotiChat</h1><p className="text-xs text-slate-400">الحساب: {user.name} · الرتبة: {session.data.role}</p></div></div>
   <div className="flex items-center gap-2">
    <button className="rounded-xl border border-white/15 px-3 py-2 text-sm" onClick={()=>{void session.reload();}}>تحديث الصلاحيات</button>
    <button className="rounded-xl border border-white/15 px-3 py-2 text-sm" onClick={()=>{window.location.href='/'}}><ArrowRight className="inline" size={16}/> التطبيق</button>
    <button className="rounded-xl border border-rose-400/25 px-3 py-2 text-sm text-rose-200" onClick={()=>void logout()}>خروج</button>
   </div>
  </header>
  <div className="mx-auto max-w-6xl p-3 md:p-6">
   <nav aria-label="أقسام الإدارة" className="flex gap-2 overflow-x-auto pb-3">
    {allowed.map(s=><button key={s.id} type="button" onClick={()=>{setSection(s.id);setNotice('');setFailure('');}} className={'shrink-0 px-3 py-2 rounded-xl text-sm border flex items-center gap-2 '+(active===s.id?'border-cyan-400/60 bg-cyan-400/20 text-cyan-100':'border-white/10 bg-white/5 text-slate-300')}><s.Icon size={16}/>{s.name}</button>)}
   </nav>
   {failure&&<div role="alert" className="my-3 border border-rose-400/30 rounded-xl bg-rose-950/50 p-3 text-rose-200">{failure}</div>}
   {notice&&<div role="status" className="my-3 rounded-xl bg-emerald-950/50 border border-emerald-400/20 p-3 text-emerald-100">{notice}</div>}
   {active==='overview'&&<section>
    <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-lg">نظرة عامة مباشرة</h2><button aria-label="تحديث الإحصائيات" onClick={()=>void overview.reload()}><RefreshCw size={18}/></button></div>
    {overview.loading?<InlineLoading>تحميل بيانات الخادم…</InlineLoading>:overview.error?<ErrorState message={overview.error} onRetry={()=>void overview.reload()}/>:<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
     {([['المستخدمون',overview.data.users],['النشطون',overview.data.active_users],['الغرف المفتوحة',overview.data.active_rooms],
       ['هدايا اليوم',overview.data.gifts_today],['Coins المتداولة',overview.data.coins_in_circulation],
       ['الوكالات',overview.data.agencies],['الأعضاء المضيفون',overview.data.hosts],
       ['طلبات الوكالة الجديدة',overview.data.pending_agency_registrations]] as [string,number][]).map(([label,value])=><article key={label} className="rounded-2xl bg-white/5 border border-white/10 p-4"><p className="text-slate-400 text-xs mb-3">{label}</p><strong className="text-xl text-cyan-200">{num(value)}</strong></article>)}
    </div>}
   </section>}
   {active==='users'&&<section className="space-y-3">
    <h2 className="text-lg font-black">بحث الحسابات الحقيقية</h2>
    <form onSubmit={event=>{event.preventDefault();setQuery(search)}} className="flex gap-2">
     <input aria-label="بحث المستخدم" className={cls} value={search} onChange={event=>setSearch(event.target.value)} placeholder="ID أو الاسم أو البريد"/>
     <button type="submit" className="rounded-xl bg-cyan-600 px-5">بحث</button>
    </form>
    {users.loading?<InlineLoading>جاري البحث…</InlineLoading>:users.error?<ErrorState message={users.error} onRetry={()=>void users.reload()}/>:!users.data.length?<EmptyState title="لا توجد حسابات مطابقة"/>:users.data.map(p=><article key={p.id} className="border border-white/10 bg-white/5 rounded-2xl p-3 flex items-center gap-3">
      {p.avatar_url?<img src={p.avatar_url} className="w-12 h-12 rounded-full object-cover" alt=""/>:<div className="w-12 h-12 rounded-full bg-white/10"/>}
      <div className="flex-1 min-w-0"><strong className="block truncate">{p.display_name}</strong><p className="text-xs text-slate-400">ID {p.public_id} · @{p.username} · VIP{p.vip_level} · LV{p.level}</p><p className="text-xs text-amber-200">🪙 {num(p.gold)} | 💎 {num(p.diamonds)}</p>{p.email&&<p className="text-xs text-slate-500 truncate">{p.email}</p>}</div>
      {(can('wallet.credit')||can('wallet.debit'))&&<button className="bg-cyan-600/30 border border-cyan-400/20 rounded-xl px-3 py-2 text-sm" onClick={()=>{setUserId(String(p.public_id));setSection('wallet')}}>المحفظة</button>}
     </article>)}
   </section>}
   {active==='wallet'&&<section className="space-y-4">
    <h2 className="text-lg font-black">إدارة Coins — عمليات موثّقة</h2>
    {(can('wallet.credit')||can('wallet.debit'))&&<form onSubmit={event=>void adjustWallet(event)} className="p-4 rounded-2xl border border-white/10 bg-white/5 grid gap-3 md:grid-cols-2">
     <label className="text-xs">User ID<input className={cls+' mt-2'} inputMode="numeric" value={userId} onChange={event=>{setUserId(event.target.value);requestId.current=null}} placeholder="رقم ID الحقيقي" required/></label>
     <label className="text-xs">التعديل — موجب للإضافة، سالب للخصم<input className={cls+' mt-2'} type="number" value={delta} onChange={event=>{setDelta(event.target.value);requestId.current=null}} min={can('wallet.debit')?-1000000000:1} max={can('wallet.credit')?1000000000:-1} required/></label>
     <label className="text-xs md:col-span-2">السبب — إلزامي<input className={cls+' mt-2'} value={reason} onChange={event=>{setReason(event.target.value);requestId.current=null}} minLength={10} maxLength={500} placeholder="سبب واضح لكل حركة في الخزينة" required/></label>
     <button disabled={updating||!delta||(Number(delta)>0&&!can('wallet.credit'))||(Number(delta)<0&&!can('wallet.debit'))} type="submit" className="md:col-span-2 bg-cyan-600 rounded-xl px-4 py-3 font-bold disabled:opacity-40">{updating?'جارٍ تأكيد المعاملة…':'تأكيد العملية المالية'}</button>
     <p className="md:col-span-2 text-xs text-slate-400">يراجع Backend الرصيد والصلاحية ويحفظ التعديل والسبب والرصيدين السابق والجديد في معاملة واحدة.</p>
    </form>}
    {can('wallet.history')&&<><h3 className="font-bold">السجل المالي الإداري</h3>
    {history.loading?<InlineLoading>تحميل المعاملات…</InlineLoading>:history.error?<ErrorState message={history.error} onRetry={()=>void history.reload()}/>:!history.data.length?<EmptyState title="لا توجد معاملات إدارية بعد"/>:history.data.map(tx=><article key={tx.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
     <strong className={tx.delta>0?'text-emerald-300':'text-rose-300'}>{tx.delta>0?'+':''}{num(tx.delta)} Coins</strong> إلى ID {tx.target_public_id}
     <p className="text-xs text-slate-300">قبل: {num(tx.previous_balance)} · بعد: {num(tx.new_balance)}</p><p className="text-xs text-slate-400">المسؤول: {tx.operator_name} | {date(tx.created_at)}</p><p className="text-xs mt-1">{tx.reason}</p>
    </article>)}</>}
   </section>}
   {active==='roles'&&<section className="space-y-4">
    <h2 className="text-lg font-black">الرتب والصلاحيات الديناميكية</h2>
    {roles.loading?<InlineLoading>تحميل الرتب…</InlineLoading>:roles.error?<ErrorState message={roles.error} onRetry={()=>void roles.reload()}/>:<div className="grid md:grid-cols-[220px_1fr] gap-4">
      <div className="space-y-2">{roles.data.roles.map(r=><button key={r.id} className={'w-full rounded-xl p-3 text-right border '+(selectedRole===r.id?'border-cyan-400 bg-cyan-500/15':'border-white/10 bg-white/5')} onClick={()=>setSelectedRole(r.id)}>{r.label} <span className="text-xs text-slate-400 block">{r.id}</span></button>)}</div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
       <label className="block text-xs">معرّف الرتبة<input className={cls+' mt-1'} value={selectedRole} onChange={event=>setSelectedRole(event.target.value)} disabled={!session.data.owner}/></label>
       <label className="block text-xs">اسم الرتبة<input className={cls+' mt-1'} value={roleLabel} onChange={event=>setRoleLabel(event.target.value)} disabled={!session.data.owner}/></label>
       <div className="grid sm:grid-cols-2 gap-2 max-h-[45vh] overflow-y-auto">
        {roles.data.permissions.map(p=><label key={p} className="flex items-center gap-2 text-xs bg-black/20 rounded-lg p-2"><input type="checkbox" checked={session.data.owner&&selectedRole==='owner'?true:rolePermissions.includes(p)} disabled={!session.data.owner||selectedRole==='owner'||selectedRole==='user'} onChange={e=>setRolePermissions(v=>e.target.checked?[...v,p]:v.filter(x=>x!==p))}/>{p}</label>)}
       </div>
       {session.data.owner&&<button type="button" disabled={updating||selectedRole==='owner'||selectedRole==='user'} className="rounded-xl bg-cyan-600 px-5 py-3 disabled:opacity-40" onClick={()=>void execute(()=>rpc('dashboard_save_role',{p_role:selectedRole,p_label:roleLabel,p_permissions:rolePermissions}),()=>roles.reload())}>حفظ الرتبة والصلاحيات</button>}
       {session.data.owner&&<form onSubmit={event=>{event.preventDefault();void execute(()=>rpc('dashboard_assign_role',{p_public_id:Number(assignUserId),p_role:assignRole}))}} className="space-y-2 border-t border-white/10 pt-3"><h3>تعيين رتبة لحساب</h3>
        <input className={cls} aria-label="ID المراد تعيينه" value={assignUserId} onChange={e=>setAssignUserId(e.target.value)} placeholder="User ID" required inputMode="numeric"/>
        <select className={cls} aria-label="الرتبة المختارة" value={assignRole} onChange={e=>setAssignRole(e.target.value)}>{roles.data.roles.filter(r=>r.id!=='owner').map(r=><option key={r.id} value={r.id}>{r.label}</option>)}</select>
        <button disabled={updating||!Number.isSafeInteger(Number(assignUserId))||Number(assignUserId)<=0} className="bg-cyan-600 rounded-xl p-3 w-full disabled:opacity-40">تعيين الرتبة بالخادم</button>
       </form>}
      </div>
    </div>}
   </section>}
   {active==='agencies'&&<section className="space-y-3">
    <h2 className="font-black text-lg">مراجعة طلبات الوكالات</h2>
    <p className="text-xs text-slate-400">مستندات الهوية خاصة ولا تظهر كرابط عام. المراجعة والتفعيل تتطلب صلاحية Backend مستقلة.</p>
    {agencies.loading?<InlineLoading>تحميل الطلبات…</InlineLoading>:agencies.error?<ErrorState message={agencies.error} onRetry={()=>void agencies.reload()}/>:agencies.data.length===0?<EmptyState title="لا توجد طلبات وكالة"/>:agencies.data.map(a=><article key={a.id} className="border border-white/10 bg-white/5 rounded-xl p-4">
      <strong>{a.agency_name}</strong><p className="text-xs text-slate-300">الطلب: {a.applicant_public_id} · {a.full_name}</p>
      <p className="text-xs text-slate-400">الدولة: {a.country_code} · رقم الوكيل: {a.agent_number}</p>
      <p className="text-xs">الحالة: {a.status} · {date(a.submitted_at)}</p>
     </article>)}
   </section>}
   {active==='audit'&&<section className="space-y-3"><h2 className="font-black text-lg">سجل الإجراءات الإدارية</h2>
    {audit.loading?<InlineLoading>تحميل السجل…</InlineLoading>:audit.error?<ErrorState message={audit.error} onRetry={()=>void audit.reload()}/>:audit.data.length===0?<EmptyState title="السجل فارغ"/>:audit.data.map(a=><article key={a.id} className="border border-white/10 rounded-xl bg-white/5 p-3 text-sm"><strong>{a.action}</strong><p>{a.operator_name} · {date(a.created_at)}</p><pre className="text-xs text-slate-400 mt-2 whitespace-pre-wrap break-all">{JSON.stringify(a.metadata)}</pre></article>)}
   </section>}
   {active==='settings'&&<section className="space-y-3">
    <h2 className="font-black text-lg">Feature Flags للنسخة التجريبية</h2>
    {flags.loading?<InlineLoading>تحميل إعدادات الميزات…</InlineLoading>:flags.error?<ErrorState message={flags.error} onRetry={()=>void flags.reload()}/>:Object.entries(flags.data).map(([name,enabled])=><div key={name} className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-xl"><span className="text-sm">{name}</span><button disabled={!session.data.owner||updating} onClick={()=>void execute(()=>rpc('dashboard_set_beta_flag',{p_id:name,p_enabled:!enabled}),()=>flags.reload())} className={'rounded-xl px-4 py-2 text-sm disabled:opacity-40 '+(enabled?'bg-emerald-600':'bg-white/10')}>{enabled?'مفعّل':'متوقف'}</button></div>)}
   </section>}
  </div>
 </div>;
};

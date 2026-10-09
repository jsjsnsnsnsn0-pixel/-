import React, {useCallback, useMemo, useState} from 'react';
import {useApp} from '../../context/AppContext';
import {usePublicChat} from '../../hooks/usePublicChat';
import {useServerData} from '../../hooks/useServerData';
import {rpc, backendMessage} from '../../services/backend';
import {BadgeCheck, Check, ChevronRight, Crown, Headphones, Search, ShieldCheck, UsersRound, X} from 'lucide-react';

interface Agency {id:number; name:string; owner_id:string}
interface Member {public_id:number; display_name:string}
interface State {agency:Agency|null; available:Agency[]; members:Member[]; applications:Member[]}
type View='browse'|'mine'|'opening'|'join';

const panel='rounded-[19px] border-[1.5px] border-[#c5a071] bg-gradient-to-br from-[#2b2143] via-[#17142f] to-[#110f26] shadow-[inset_0_0_17px_rgba(138,99,182,.17),0_5px_18px_rgba(0,0,0,.35)]';
const tile='rounded-xl border border-[#795f94] bg-[#241c39] text-[#ffebcc]';
const goldButton='rounded-xl px-3 py-2.5 border border-[#ffe5a4] bg-gradient-to-br from-[#ffe9b0] to-[#e7b15e] text-[#33213b] text-xs font-black active:scale-[.98] transition-transform disabled:opacity-50';
const outlineButton='rounded-xl px-3 py-2.5 border border-[#d3b379] text-[#ffe6b4] text-xs font-bold bg-[#201832] disabled:opacity-50';

export const AgencyScreen:React.FC=()=>{
 const {user,setActiveSubScreen,reportError}=useApp();
 const {opening,openChat}=usePublicChat();
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const [view,setView]=useState<View>('browse');
 const [search,setSearch]=useState('');
 const load=useCallback(()=>rpc<State>('agency_state'),[user.authId]);
 const {data,loading,error,reload}=useServerData(load,{agency:null,available:[],members:[],applications:[]});
 const act=async(id:number,action:string,target?:number)=>{
  if(busy)return;
  if((action==='leave'||action==='remove')&&!window.confirm(action==='leave'?'هل تريد مغادرة الوكالة؟':'هل تريد إزالة هذا العضو من الوكالة؟'))return;
  setBusy(true);setNotice('');
  try{
   await rpc('agency_action',{p_agency_id:id,p_action:action,p_target_public_id:target??null});
   setNotice('تم اعتماد العملية من الخادم.');
   await reload();
  }catch(e){reportError(backendMessage(e))}
  finally{setBusy(false)}
 };
 const available=useMemo(()=>data.available.filter(a=>a.name.includes(search.trim())||String(a.id).includes(search.trim())),[data.available,search]);
 const agency=data.agency;
 const isOwner=Boolean(agency&&agency.owner_id===user.authId);
 const menu:{id:View;label:string}[]=[
  {id:'browse',label:'الوكالات'},{id:'mine',label:'وكالتي'},
  {id:'opening',label:'طلب فتح وكالة'},{id:'join',label:'طلب انضمام'}
 ];
 const agencies= <div className={panel+' p-3 mb-4'}>
  <h2 className="flex items-center gap-2 text-[15px] font-black mb-3 text-[#ffe5a4]"><span className="w-6 h-6 rounded-full bg-[#e6b663] text-[#311b36] grid place-items-center">1</span> تصفح الوكالات</h2>
  <label htmlFor="agency-search" className="sr-only">البحث عن وكالة أو رقم وكالة</label>
  <div className="relative mb-3">
   <Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#e9ceaa]"/>
   <input id="agency-search" type="search" dir="rtl" value={search} onChange={e=>setSearch(e.target.value)}
    placeholder="ابحث عن وكالة أو ID" className="w-full bg-[#18132c] border border-[#766496] rounded-xl text-sm px-10 py-3 text-white placeholder:text-[#b8a8cc] outline-none focus:border-[#f2ca80]"/>
  </div>
  {!loading&&available.map(item=><div key={item.id} className={tile+' flex items-center gap-3 p-3 mb-2'}>
   <img alt="رمز الوكالات" src="/assets/images/agency_opening_banner_1790725265910.jpg"
    className="w-12 h-12 object-cover rounded-xl border border-[#eac781] shrink-0"/>
   <div className="min-w-0 flex-1"><strong className="text-sm text-[#ffe7ae] block truncate">{item.name}</strong><span className="text-[11px] text-[#cfbdd9]">Agency ID: {item.id}</span></div>
   <button disabled={busy||Boolean(agency)} onClick={()=>void act(item.id,'request')} className={goldButton}>{agency?'لديك وكالة':'انضمام'}</button>
  </div>)}
  {!loading&&!error&&available.length===0&&<p className="p-4 text-center text-[#cbbee0] text-sm">لا توجد وكالات مطابقة حالياً.</p>}
 </div>;
 const mine=<div className={panel+' p-3 mb-4'}>
  <h2 className="text-[#ffe3a1] text-lg font-black mb-3 flex items-center gap-2"><Crown size={20}/> وكالتي</h2>
  {agency ? <>
   <div className={tile+' flex items-center gap-3 p-3 mb-4'}>
    <img alt="رمز الوكالة" src="/assets/images/agency_opening_banner_1790725265910.jpg" className="w-16 h-16 object-cover rounded-xl border border-[#edcb89]"/>
    <div className="min-w-0"><strong className="text-[#ffe3a4] font-black block truncate">{agency.name}</strong><small className="text-[#c7b9d8]">ID: {agency.id}</small><small className="block text-[#99e7ce]">{isOwner?'👑 وكيل الوكالة':'عضو في الوكالة'}</small></div>
   </div>
   <div className="grid grid-cols-2 gap-2 mb-3">
    <div className={tile+' p-3 text-xs'}><UsersRound size={17} className="inline"/> الأعضاء <b className="block text-lg text-[#ffe5af]">{data.members.length}</b></div>
    <div className={tile+' p-3 text-xs'}><ShieldCheck size={17} className="inline"/> طلبات الانضمام <b className="block text-lg text-[#ffe5af]">{isOwner?data.applications.length:'—'}</b></div>
   </div>
   {data.members.length>0&&<section className="mb-3"><h3 className="font-extrabold text-sm mb-2 text-[#ffe6b7]">الأعضاء</h3>
    {data.members.map(member=><div key={member.public_id} className={tile+' px-3 py-2 mb-1 flex gap-2 items-center'}>
     <div className="min-w-0 flex-1 text-xs truncate">{member.display_name} · {member.public_id}</div>
     {isOwner&&member.public_id!==Number(user.id)&&<button className={outlineButton} disabled={busy} onClick={()=>void act(agency.id,'remove',member.public_id)}>إزالة</button>}
    </div>)}
   </section>}
   {isOwner&&<section className="mb-3"><h3 className="font-extrabold text-sm mb-2 text-[#ffe6b7]">طلبات الانضمام</h3>
    {data.applications.length===0?<p className="text-xs text-[#c4b6d1]">لا توجد طلبات معلّقة.</p>:data.applications.map(member=><div key={member.public_id} className={tile+' px-3 py-2 mb-2 flex gap-2 items-center'}>
     <span className="text-xs flex-1 min-w-0 truncate">{member.display_name}</span>
     <button className={goldButton} disabled={busy} onClick={()=>void act(agency.id,'accept',member.public_id)}><Check size={14} className="inline"/> قبول</button>
     <button className={outlineButton} disabled={busy} onClick={()=>void act(agency.id,'reject',member.public_id)}><X size={14} className="inline"/> رفض</button>
    </div>)}
   </section>}
   {!isOwner&&<button disabled={busy} onClick={()=>void act(agency.id,'leave')} className={outlineButton+' w-full'}>مغادرة الوكالة</button>}
  </>:<div className="text-sm text-[#e7d6dd] text-center p-4"><UsersRound size={32} className="mx-auto mb-2 text-[#e9c47d]"/><p>ما عندك عضوية وكالة حالياً.</p>
   <button onClick={()=>setView('join')} className={goldButton+' mt-3'}>تصفح وكالات للانضمام</button></div>}
 </div>;
 const openingForm=<div className={panel+' p-3 mb-4'}>
  <h2 className="text-lg font-black text-[#ffdfa5] mb-3 flex items-center gap-2"><Crown size={20}/> طلب فتح وكالة جديدة</h2>
  <img src="/assets/images/agency_opening_rules_exact_1790729202852.jpg" alt="شروط فتح الوكالة" className="w-full rounded-xl border border-[#d7b777] mb-3"/>
  <div className="grid gap-2 text-[#ecdfec] text-xs leading-6">
   <p className={tile+' p-3'}>تقديم طلب فتح وكالة يحتاج موافقة فريق الإدارة. نظام إرسال نموذج الوكالة الإلكتروني بعده غير مربوط بخادم التطبيق.</p>
   <p className={tile+' p-3'}><BadgeCheck size={15} className="inline text-[#fbd487]"/> تواصل مع الدعم الرسمي حتى يراجع شروط فتح الوكالة ويستلم طلبك.</p>
  </div>
  <button type="button" disabled={opening} onClick={()=>void openChat()} className={goldButton+' w-full mt-3 py-4 flex justify-center gap-2 items-center'}><Headphones size={18}/> {opening?'جارٍ فتح الدعم…':'تواصل مع الدعم لتقديم طلب فتح وكالة'}</button>
 </div>;
 const join=<div className={panel+' p-3 mb-4'}>
  <h2 className="text-lg font-black text-[#ffdfa5] mb-3 flex items-center gap-2"><UsersRound size={20}/> طلب انضمام إلى وكالة</h2>
  <p className="text-xs text-[#dbcbe2] mb-3">اختر وكالة من القائمة، ثم اضغط «انضمام». يرسل الطلب الحقيقي إلى الخادم، ويحتاج موافقة الوكيل.</p>
  {agency ? <p className={tile+' p-3 text-xs'}>أنت مسجل حالياً في وكالة. يمكنك عرض عضويتك من تبويب «وكالتي».</p>:agencies}
 </div>;
 return <main dir="rtl" className="min-h-screen pb-28 px-3 text-[#fce5bd] overflow-x-hidden"
  style={{background:'radial-gradient(ellipse at 50% 0%,#292156,#11132e 52%,#0a0b1c 100%)'}}>
  <header className="relative text-center pt-6 pb-4 min-h-[104px]">
   <button type="button" onClick={()=>setActiveSubScreen(null)} aria-label="رجوع"
    className="absolute right-0 top-5 w-10 h-10 border border-[#ad8bc1] bg-[#1a122d] rounded-full grid place-items-center text-[#f9dba4]"><ChevronRight size={24}/></button>
   <h1 className="font-black text-[23px] text-[#ffe3a8] drop-shadow-[0_0_10px_#d7a458]">♛ بوابة الوكالات</h1>
   <p className="mt-1 text-[11px] text-[#dacfe4]">الوكالات · المضيفون · طلبات الانضمام والإدارة</p>
  </header>
  <nav aria-label="صفحات الوكالة" className="grid grid-cols-4 gap-1 mb-3">
   {menu.map(tab=><button key={tab.id} type="button" onClick={()=>setView(tab.id)}
    aria-current={view===tab.id?'page':undefined}
    className={'min-w-0 min-h-[53px] p-1 text-[10px] sm:text-xs font-black rounded-xl border leading-4 '+(view===tab.id?'bg-gradient-to-tr from-[#e4ad54] via-[#ffdfa0] to-[#fff0bd] border-[#ffe7ad] text-[#392037] shadow-[0_0_13px_#ecc17580]':'bg-gradient-to-br from-[#2c2442] to-[#171128] text-[#e8d5e4] border-[#8067a1]')}>
    {tab.label}
   </button>)}
  </nav>
  <div className="relative overflow-hidden rounded-[20px] border-2 border-[#d8b36c] shadow-[0_5px_20px_#09071d] mb-3 h-[165px]">
   <img src="/assets/images/agency_login_portal_1790714750581.jpg" alt="بوابة نظام وكالات TotiChat" className="w-full h-full object-cover"/>
   <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0e0929] to-transparent pt-10 p-3">
    <h2 className="font-black text-[#ffe2a4]">نظام وكالات TotiChat</h2>
    <p className="text-[10px] text-[#f6e2e8]">إدارة الوكلاء والمضيفين بطلبات فعلية</p>
   </div>
  </div>
  {loading&&<div className={tile+' p-3 mb-3 text-xs'} role="status">جارٍ تحميل بيانات الوكالة…</div>}
  {error&&<div className={tile+' p-3 mb-3 text-xs'} role="alert"><p>{error}</p><button className={outlineButton+' mt-2'} onClick={()=>void reload()}>إعادة المحاولة</button></div>}
  {notice&&<div role="status" className={tile+' p-3 mb-3 text-xs text-[#83eed2]'}>{notice}</div>}
  {view==='browse'&&agencies}
  {view==='mine'&&mine}
  {view==='opening'&&openingForm}
  {view==='join'&&join}
  <section className={panel+' p-3'}>
   <h2 className="font-black text-[#ffe0a1] text-sm mb-2">الدعم الرسمي</h2>
   <button onClick={()=>void openChat()} disabled={opening} className={outlineButton+' w-full flex justify-center gap-2 items-center'}>
    <Headphones size={16}/> {opening?'جارٍ فتح المحادثة…':<><span>الدعم الرسمي · ID</span> <span>451305</span></>}
   </button>
   <small className="block text-center mt-2 text-[#bbaed1]">لا تُعرض أرصدة أو مستحقات تجريبية بدل بيانات الحساب الفعلية.</small>
  </section>
 </main>;
};

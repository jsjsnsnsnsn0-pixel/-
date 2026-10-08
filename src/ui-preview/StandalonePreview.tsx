import React,{lazy,Suspense,useEffect,useState} from 'react';
import {Wifi,Headphones,LogOut,RotateCcw} from 'lucide-react';
import {ConnectionNotice,useConnectionPreview} from './ConnectionNotice';
import {AppProvider,useApp,previewRooms} from '../context/AppContext';
import {RealtimeRankingsProvider} from '../context/RealtimeRankingsProvider';
import {RoomAudioProvider} from '../context/RoomAudioContext';
import {BottomNavigation} from '../components/common/BottomNavigation';
const Community=lazy(()=>import('./CommunityPreview').then(x=>({default:x.CommunityPreview})));
const Scope=lazy(()=>import('./ScopePreview').then(x=>({default:x.ScopePreview})));
const AuthPreview=lazy(()=>import('./AuthPreview').then(x=>({default:x.AuthPreview})));
const AuditLab=lazy(()=>import('./AuditLab').then(x=>({default:x.AuditLab})));
const Home=lazy(()=>import('../components/screens/HomeScreen').then(x=>({default:x.HomeScreen})));
const Rooms=lazy(()=>import('../components/screens/RoomsListScreen').then(x=>({default:x.RoomsListScreen})));
const Room=lazy(()=>import('../components/screens/VoiceRoomScreen').then(x=>({default:x.VoiceRoomScreen})));
const Profile=lazy(()=>import('../components/screens/ProfileScreen').then(x=>({default:x.ProfileScreen})));
const Messages=lazy(()=>import('../components/screens/MessagesScreen').then(x=>({default:x.MessagesScreen})));
const Store=lazy(()=>import('../components/screens/StoreScreen').then(x=>({default:x.StoreScreen})));
const Wallet=lazy(()=>import('../components/screens/WalletScreen').then(x=>({default:x.WalletScreen})));
const Vip=lazy(()=>import('../components/screens/VIPScreen').then(x=>({default:x.VIPScreen})));
const Create=lazy(()=>import('../components/screens/CreateRoomScreen').then(x=>({default:x.CreateRoomScreen})));
const Gifts=lazy(()=>import('../components/rooms/GiftStoreModal').then(x=>({default:x.GiftStoreModal})));
const GiftBox=lazy(()=>import('../components/screens/GiftBoxScreen').then(x=>({default:x.GiftBoxScreen})));
const Recharge=lazy(()=>import('../components/screens/RechargeScreen').then(x=>({default:x.RechargeScreen})));
const Agency=lazy(()=>import('../components/screens/AgencyScreen').then(x=>({default:x.AgencyScreen})));
const Badges=lazy(()=>import('../components/screens/BadgesScreen').then(x=>({default:x.BadgesScreen})));
const catalogue=[
 ['uiux_audit','مختبر مراجعة UI/UX'],
 ['auth_demo','تجربة الدخول · تصميم'],
 ['scope_v2','سجل المتطلبات والأزرار'],
 ['community','المجتمع'],
 ['home','الرئيسية'],['rooms','الغرف'],['voice','غرفة صوتية'],['gifts','صندوق الهدايا'],['profile','الملف الشخصي'],
 ['messages','الرسائل'],['store','المتجر'],['wallet','المحفظة'],['vip','VIP'],['create','إنشاء غرفة'],['agency','الوكالات'],['badges','الشارات'],['gift_box','حقيبتي'],['recharge','الشحن']
] as const;
function ReviewPage(){
 const {activeTab,activeSubScreen,activeRoom,setActiveTab,setActiveSubScreen,joinRoom,leaveRoom,error,dismissError}=useApp();
 const [width,setWidth]=useState(390);
 const [sizesOpen,setSizesOpen]=useState(false);
 const {network,showNotice,simulateSlow,checkAgain,closeNotice}=useConnectionPreview();
 const select=(v:string)=>{
   if(v==='voice'||v==='gifts'){void joinRoom(previewRooms[0]);if(v==='gifts')setTimeout(()=>setActiveSubScreen('gift_box'),0);return;}
   if(activeRoom) void leaveRoom();
   if(['home','rooms','profile','messages','create'].includes(v))setActiveTab(v as any);
   else setActiveSubScreen(v);
 };
 const visibleRoom=Boolean(activeRoom && (!activeSubScreen || activeSubScreen==='gift_box'));
 const active=visibleRoom?(activeSubScreen==='gift_box'?'gifts':'voice'):(activeSubScreen||activeTab);
 const render=activeSubScreen==='scope_v2'?<Scope onNavigate={select}/> :activeSubScreen==='community'?<Community/> :activeSubScreen==='uiux_audit'?<AuditLab onNavigate={select}/> :activeSubScreen==='auth_demo'?<AuthPreview onComplete={()=>select('home')}/> :visibleRoom?<><Room/>{activeSubScreen==='gift_box'&&<Gifts isOpen room={activeRoom} onClose={()=>setActiveSubScreen(null)} onRechargeClick={()=>{void leaveRoom();setActiveSubScreen('recharge');}}/>}</>
 :activeSubScreen==='home'?<Home/>
 :activeSubScreen==='store'?<Store/>
 :activeSubScreen==='wallet'?<Wallet/>
 :activeSubScreen==='vip'?<Vip/>
 :activeSubScreen==='gift_box'?<GiftBox/>
 :activeSubScreen==='agency'?<Agency/>
 :activeSubScreen==='badges'?<Badges/>
 :activeSubScreen==='recharge'?<Recharge/>
 :activeTab==='rooms'?<Rooms/>
 :activeTab==='profile'?<Profile/>
 :activeTab==='messages'?<Messages/>
 :activeTab==='create'?<Create/>
 :<Home/>;
 return <div dir="rtl" className="min-h-screen bg-slate-100">
 <div className="fixed z-[999] inset-x-0 top-0 max-w-md mx-auto bg-[#102e2c] border-b border-emerald-400/30 text-white p-2 shadow-lg flex gap-2 items-center">
 <span className="text-[10px] px-2 py-1 rounded-full bg-amber-300 text-slate-900 font-black whitespace-nowrap">UI فقط</span>
 <label htmlFor="preview-screen" className="sr-only">اختيار شاشة المعاينة</label>
 <select id="preview-screen" aria-label="اختر شاشة المعاينة" value={catalogue.some(x=>x[0]===active)?active:'home'} onChange={e=>select(e.target.value)}
 className="flex-1 min-w-0 text-sm bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 outline-none text-white">
 {catalogue.map(([key,title])=><option key={key} value={key} className="text-slate-900">{title}</option>)}
 </select>
 <button type="button" onClick={simulateSlow} aria-label="معاينة نافذة ضعف اتصال الإنترنت" title="تجربة الاتصال الضعيف" className="min-h-9 min-w-9 flex items-center justify-center rounded-lg border border-white/30"><Wifi size={18}/></button>
 <button type="button" onClick={()=>setSizesOpen(v=>!v)} className="min-h-9 text-xs px-2 rounded-lg border border-white/30" aria-label="عرض خيارات عرض الشاشة">{width}dp</button>
 </div>
 {sizesOpen&&<div className="fixed top-12 inset-x-2 max-w-md mx-auto z-[999] rounded-xl bg-white shadow-xl flex items-center justify-around p-2" role="group" aria-label="مقاسات الهاتف">{[320,360,390,430].map(w=><button type="button" aria-pressed={w===width} onClick={()=>{setWidth(w);setSizesOpen(false)}} key={w} className={"min-h-12 min-w-12 rounded-xl font-semibold text-xs "+(w===width?"bg-[#1b7050] text-white":"bg-slate-100 text-slate-800")}>{w}</button>)}</div>}
 <div className="pt-[48px] ui-page mx-auto min-h-screen shadow-xl bg-white relative" style={{width:"100%",maxWidth:width}}>
 <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-slate-600">تحميل الواجهة…</div>}>{render}</Suspense>
 {(!visibleRoom)&&(['home','rooms','profile','messages'].includes(activeTab)||activeSubScreen==='community'||activeSubScreen==='home')&&
 (!activeSubScreen||activeSubScreen==='community'||activeSubScreen==='home')&&<BottomNavigation/>}
 {activeRoom&&!visibleRoom&&<div className="fixed bottom-[96px] left-3 right-3 max-w-md mx-auto z-[50] flex items-center gap-2 rounded-2xl border border-emerald-200/20 bg-[#0e302a]/95 text-white px-3 py-2 shadow-lg" role="region" aria-label="غرفة مصغرة - معاينة فقط">
 <button type="button" onClick={()=>setActiveSubScreen(null)} aria-label="العودة إلى الغرفة الصوتية" className="min-w-0 flex-1 flex items-center gap-3 text-right min-h-12">
 <img alt="" src={activeRoom.coverImage} className="w-11 h-11 shrink-0 rounded-xl object-cover"/>
 <span className="min-w-0 flex-1"><strong className="block text-xs truncate">{activeRoom.title}</strong><small className="text-[10px] text-emerald-200">تصغير واجهة · لا يوجد بث صوتي فعلي</small></span>
 <Headphones size={17}/></button>
 <button type="button" aria-label="مغادرة الغرفة المصغرة" title="مغادرة الغرفة" onClick={()=>void leaveRoom()} className="min-h-11 min-w-11 grid place-items-center rounded-full bg-rose-500/20 border border-rose-400/40"><LogOut size={18}/></button>
 </div>}
 </div>
 <ConnectionNotice state={network} open={showNotice} onClose={closeNotice} onRetry={checkAgain}/>
 {error&&<div role="alert" className="fixed z-[1000] top-14 inset-x-3 max-w-md mx-auto rounded-2xl bg-rose-900 p-3 text-white text-xs flex gap-3"><span className="flex-1">{error}</span><button onClick={dismissError}>✕</button></div>}
 </div>;
}
export default function StandalonePreview(){
 return <AppProvider><RealtimeRankingsProvider><RoomAudioProvider><ReviewPage/></RoomAudioProvider></RealtimeRankingsProvider></AppProvider>;
}

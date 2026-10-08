import React,{lazy,Suspense} from 'react';
import {AppProvider,useApp,previewRooms} from '../context/AppContext';
import {RealtimeRankingsProvider} from '../context/RealtimeRankingsProvider';
import {RoomAudioProvider} from '../context/RoomAudioContext';
import {BottomNavigation} from '../components/common/BottomNavigation';
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
 ['home','الرئيسية'],['rooms','الغرف'],['voice','غرفة صوتية'],['gifts','صندوق الهدايا'],['profile','الملف الشخصي'],
 ['messages','الرسائل'],['store','المتجر'],['wallet','المحفظة'],['vip','VIP'],['create','إنشاء غرفة'],['agency','الوكالات'],['badges','الشارات'],['gift_box','حقيبتي'],['recharge','الشحن']
] as const;
function ReviewPage(){
 const {activeTab,activeSubScreen,activeRoom,setActiveTab,setActiveSubScreen,joinRoom,leaveRoom,error,dismissError}=useApp();
 const select=(v:string)=>{
   if(v==='voice'||v==='gifts'){void joinRoom(previewRooms[0]);if(v==='gifts')setTimeout(()=>setActiveSubScreen('gift_box'),0);return;}
   void leaveRoom();
   if(['home','rooms','profile','messages','create'].includes(v))setActiveTab(v as any);
   else setActiveSubScreen(v);
 };
 const active=activeRoom?(activeSubScreen==='gift_box'?'gifts':'voice'):(activeSubScreen||activeTab);
 const render=activeRoom?<><Room/>{activeSubScreen==='gift_box'&&<Gifts isOpen room={activeRoom} onClose={()=>setActiveSubScreen(null)} onRechargeClick={()=>{void leaveRoom();setActiveSubScreen('recharge');}}/>}</>
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
 <span className="text-[10px] opacity-80 whitespace-nowrap">TotiChat</span>
 </div>
 <div className="pt-[48px] ui-page max-w-md mx-auto min-h-screen shadow-xl bg-white relative">
 <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-slate-600">تحميل الواجهة…</div>}>{render}</Suspense>
 {!activeRoom&&!activeSubScreen&&<BottomNavigation/>}
 </div>
 {error&&<div role="alert" className="fixed z-[1000] top-14 inset-x-3 max-w-md mx-auto rounded-2xl bg-rose-900 p-3 text-white text-xs flex gap-3"><span className="flex-1">{error}</span><button onClick={dismissError}>✕</button></div>}
 </div>;
}
export default function StandalonePreview(){
 return <AppProvider><RealtimeRankingsProvider><RoomAudioProvider><ReviewPage/></RoomAudioProvider></RealtimeRankingsProvider></AppProvider>;
}

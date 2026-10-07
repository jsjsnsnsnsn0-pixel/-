import {ConnectionBanner} from './components/common/ConnectionBanner';
import {NativeBackNavigation} from './components/common/NativeBackNavigation';
import React, {lazy, Suspense} from 'react';
import { RoomAudioProvider } from './context/RoomAudioContext';
import { isSupabaseConfigured } from './services/supabase';
import { AppProvider, useApp } from './context/AppContext';
import { BottomNavigation } from './components/common/BottomNavigation';
const HomeScreen = lazy(() => import('./components/screens/HomeScreen').then(m => ({default: m.HomeScreen})));
const RoomsListScreen = lazy(() => import('./components/screens/RoomsListScreen').then(m => ({default: m.RoomsListScreen})));
const CreateRoomScreen = lazy(() => import('./components/screens/CreateRoomScreen').then(m => ({default: m.CreateRoomScreen})));
const MessagesScreen = lazy(() => import('./components/screens/MessagesScreen').then(m => ({default: m.MessagesScreen})));
const ChatDetailScreen = lazy(() => import('./components/screens/ChatDetailScreen').then(m => ({default: m.ChatDetailScreen})));
const ProfileScreen = lazy(() => import('./components/screens/ProfileScreen').then(m => ({default: m.ProfileScreen})));
const VoiceRoomScreen = lazy(() => import('./components/screens/VoiceRoomScreen').then(m => ({default: m.VoiceRoomScreen})));
const LevelScreen = lazy(() => import('./components/screens/LevelScreen').then(m => ({default: m.LevelScreen})));
const VIPScreen = lazy(() => import('./components/screens/VIPScreen').then(m => ({default: m.VIPScreen})));
const WalletScreen = lazy(() => import('./components/screens/WalletScreen').then(m => ({default: m.WalletScreen})));
const RechargeScreen = lazy(() => import('./components/screens/RechargeScreen').then(m => ({default: m.RechargeScreen})));
const LuckGamesScreen = lazy(() => import('./components/screens/LuckGamesScreen').then(m => ({default: m.LuckGamesScreen})));
const SettingsScreen = lazy(() => import('./components/screens/SettingsScreen').then(m => ({default: m.SettingsScreen})));
const SearchModal = lazy(() => import('./components/screens/SearchModal').then(m => ({default: m.SearchModal})));
const FriendsModal = lazy(() => import('./components/screens/FriendsModal').then(m => ({default: m.FriendsModal})));
const StoreScreen = lazy(() => import('./components/screens/StoreScreen').then(m => ({default: m.StoreScreen})));
const AgencyScreen = lazy(() => import('./components/screens/AgencyScreen').then(m => ({default: m.AgencyScreen})));
const BadgesScreen = lazy(() => import('./components/screens/BadgesScreen').then(m => ({default: m.BadgesScreen})));
const CharmWealthScreen = lazy(() => import('./components/screens/CharmWealthScreen').then(m => ({default: m.CharmWealthScreen})));
const SilverCoinsScreen = lazy(() => import('./components/screens/SilverCoinsScreen').then(m => ({default: m.SilverCoinsScreen})));
const HelpCenterScreen = lazy(() => import('./components/screens/HelpCenterScreen').then(m => ({default: m.HelpCenterScreen})));
const EditProfileModal = lazy(() => import('./components/screens/EditProfileModal').then(m => ({default: m.EditProfileModal})));
const UserDetailProfileScreen = lazy(() => import('./components/screens/UserDetailProfileScreen').then(m => ({default: m.UserDetailProfileScreen})));
const LoginScreen = lazy(() => import('./components/screens/LoginScreen').then(m => ({default: m.LoginScreen})));
const FillInfoScreen = lazy(() => import('./components/screens/FillInfoScreen').then(m => ({default: m.FillInfoScreen})));
import { RealtimeRankingsProvider } from './context/RealtimeRankingsProvider';
import { ErrorBoundary } from './components/common/ErrorBoundary';
const RoomRankingsScreen = lazy(() => import('./components/screens/RoomRankingsScreen').then(m => ({default: m.RoomRankingsScreen})));
const CharmRankingScreen = lazy(() => import('./components/screens/CharmRankingScreen').then(m => ({default: m.CharmRankingScreen})));
const WealthRankingScreen = lazy(() => import('./components/screens/WealthRankingScreen').then(m => ({default: m.WealthRankingScreen})));

const subScreens = ['home','rooms','profile','level','vip','wallet','recharge','luck_games','settings','search','friends','visitors','chat_detail','store','agency','badges','charm_wealth','wealth_level','charm_level','silver_coins','help_center','edit_profile','user_detail_profile','room_rankings','charm_ranking','wealth_ranking','fill_info','login','messages','create'];

const MinimizedRoomBar: React.FC = () => {
  const {activeRoom, activeSubScreen, setActiveSubScreen} = useApp();
  if (!activeRoom || !activeSubScreen) return null;
  return <button type="button" dir="rtl" onClick={() => setActiveSubScreen(null)} aria-label={`العودة إلى غرفة ${activeRoom.title}`} className="fixed bottom-24 left-3 z-[40] w-52 max-w-[65vw] rounded-2xl bg-[#17192a]/95 text-white shadow-2xl border border-white/10 p-2 flex items-center gap-2 text-right">
    <img src={activeRoom.coverImage} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
    <span className="min-w-0 flex-1"><span className="block text-xs text-emerald-300">أنت داخل الغرفة الآن</span><span className="block font-bold truncate">{activeRoom.title}</span></span>
    <span className="text-xs bg-emerald-500/20 text-emerald-200 rounded-full px-3 py-1.5">عودة</span>
  </button>;
};

const MainLayout: React.FC = () => {
  const {activeRoom, activeTab, activeSubScreen, isAuthenticated, authLoading, needsProfile, error, refreshProfile, logout, setActiveSubScreen} = useApp();
  if (authLoading) return <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-white" dir="rtl"><p role="status">جارٍ تحميل حسابك…</p>{error && <><p role="alert">{error}</p><button onClick={() => void refreshProfile().catch(() => {})}>إعادة المحاولة</button><button onClick={logout}>تسجيل الخروج</button></>}</div>;
  if (isAuthenticated && needsProfile) return <FillInfoScreen />;
  if (!isAuthenticated) return <LoginScreen />;
  if (activeRoom && !activeSubScreen) return <div className="ui-page max-w-md mx-auto min-h-screen bg-[#080914] relative shadow-2xl"><VoiceRoomScreen /></div>;

  if (activeSubScreen) {
    if (!subScreens.includes(activeSubScreen)) return <div className="ui-page max-w-md mx-auto min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col items-center justify-center p-6 text-center" dir="rtl"><p className="font-bold mb-4">{activeSubScreen === 'visitors' ? 'لا توجد بيانات زوار متاحة حالياً' : 'هذه الصفحة غير متاحة حالياً'}</p><button type="button" onClick={() => setActiveSubScreen(null)} className="px-6 py-2 rounded-full bg-emerald-600 text-white font-bold cursor-pointer">الرجوع</button></div>;
    const isLightScreen = ['store','agency','badges','silver_coins','help_center','edit_profile','recharge'].includes(activeSubScreen);
    return <div className={`ui-page max-w-md mx-auto min-h-screen relative shadow-2xl ${isLightScreen ? 'bg-[#f8fafc]' : 'bg-[#0b0c16]'}`}>
      {activeSubScreen === 'home' && <><HomeScreen /><BottomNavigation /></>}{activeSubScreen === 'rooms' && <><RoomsListScreen /><BottomNavigation /></>}{activeSubScreen === 'profile' && <><ProfileScreen /><BottomNavigation /></>}{activeSubScreen === 'level' && <LevelScreen />}{activeSubScreen === 'vip' && <VIPScreen />}{activeSubScreen === 'wallet' && <WalletScreen />}{activeSubScreen === 'recharge' && <RechargeScreen />}{activeSubScreen === 'luck_games' && <LuckGamesScreen />}{activeSubScreen === 'settings' && <SettingsScreen />}{activeSubScreen === 'search' && <SearchModal />}{activeSubScreen === 'friends' && <FriendsModal />}{activeSubScreen === 'visitors' && <FriendsModal initialKind="visitors" />}{activeSubScreen === 'chat_detail' && <ChatDetailScreen />}{activeSubScreen === 'messages' && <MessagesScreen />}{activeSubScreen === 'store' && <StoreScreen />}{activeSubScreen === 'agency' && <AgencyScreen />}{activeSubScreen === 'badges' && <BadgesScreen />}{activeSubScreen === 'charm_wealth' && <CharmWealthScreen initialTab="wealth" />}{activeSubScreen === 'wealth_level' && <CharmWealthScreen initialTab="wealth" />}{activeSubScreen === 'charm_level' && <CharmWealthScreen initialTab="charm" />}{activeSubScreen === 'silver_coins' && <SilverCoinsScreen />}{activeSubScreen === 'help_center' && <HelpCenterScreen />}{activeSubScreen === 'edit_profile' && <EditProfileModal />}{activeSubScreen === 'user_detail_profile' && <UserDetailProfileScreen />}{activeSubScreen === 'room_rankings' && <RoomRankingsScreen />}{activeSubScreen === 'charm_ranking' && <CharmRankingScreen />}{activeSubScreen === 'wealth_ranking' && <WealthRankingScreen />}{activeSubScreen === 'fill_info' && <FillInfoScreen />}{activeSubScreen === 'login' && <LoginScreen />}{activeSubScreen === 'create' && <CreateRoomScreen />}
      <MinimizedRoomBar />
    </div>;
  }

  return <div className="ui-page max-w-md mx-auto min-h-screen bg-[#f8fafc] text-slate-800 relative shadow-2xl overflow-x-hidden">{activeTab === 'home' && <HomeScreen />}{activeTab === 'rooms' && <RoomsListScreen />}{activeTab === 'create' && <CreateRoomScreen />}{activeTab === 'messages' && <MessagesScreen />}{activeTab === 'profile' && <ProfileScreen />}<BottomNavigation /><MinimizedRoomBar /></div>;
};

const OperationError: React.FC = () => { const {error, dismissError} = useApp(); return error ? <div role="alert" dir="rtl" className="fixed top-3 inset-x-3 z-[200] max-w-md mx-auto bg-rose-950 text-white border border-rose-400 rounded-xl p-4 shadow-lg flex gap-3 items-center"><span className="flex-1">{error}</span><button aria-label="إغلاق" onClick={dismissError}>✕</button></div> : null; };

export default function App() {
  if (!isSupabaseConfigured) return <div dir="rtl" className="min-h-screen flex items-center justify-center text-white p-6"><p>إعداد الاتصال غير مكتمل. أضف رابط Supabase والمفتاح العام وفق ملف .env.example ثم أعد بناء التطبيق.</p></div>;
  return <ErrorBoundary><AppProvider><RealtimeRankingsProvider><RoomAudioProvider><NativeBackNavigation /><Suspense fallback={<div className="fixed top-0 inset-x-0 h-1 bg-emerald-500/60 animate-pulse" role="status" aria-label="تحميل الصفحة" />}><MainLayout /></Suspense><OperationError /><ConnectionBanner/></RoomAudioProvider></RealtimeRankingsProvider></AppProvider></ErrorBoundary>;
}

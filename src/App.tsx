import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { BottomNavigation } from './components/common/BottomNavigation';
import { HomeScreen } from './components/screens/HomeScreen';
import { RoomsListScreen } from './components/screens/RoomsListScreen';
import { CreateRoomScreen } from './components/screens/CreateRoomScreen';
import { MessagesScreen } from './components/screens/MessagesScreen';
import { ChatDetailScreen } from './components/screens/ChatDetailScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { VoiceRoomScreen } from './components/screens/VoiceRoomScreen';
import { LevelScreen } from './components/screens/LevelScreen';
import { VIPScreen } from './components/screens/VIPScreen';
import { WalletScreen } from './components/screens/WalletScreen';
import { RechargeScreen } from './components/screens/RechargeScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { SearchModal } from './components/screens/SearchModal';
import { FriendsModal } from './components/screens/FriendsModal';
import { StoreScreen } from './components/screens/StoreScreen';
import { AgencyScreen } from './components/screens/AgencyScreen';
import { BadgesScreen } from './components/screens/BadgesScreen';
import { CharmWealthScreen } from './components/screens/CharmWealthScreen';
import { SilverCoinsScreen } from './components/screens/SilverCoinsScreen';
import { HelpCenterScreen } from './components/screens/HelpCenterScreen';
import { EditProfileModal } from './components/screens/EditProfileModal';
import { UserDetailProfileScreen } from './components/screens/UserDetailProfileScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { FillInfoScreen } from './components/screens/FillInfoScreen';
import { RealtimeRankingsProvider } from './context/RealtimeRankingsProvider';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { RoomRankingsScreen } from './components/screens/RoomRankingsScreen';
import { CharmRankingScreen } from './components/screens/CharmRankingScreen';
import { WealthRankingScreen } from './components/screens/WealthRankingScreen';

const subScreens = [
  'level', 'vip', 'wallet', 'recharge', 'settings', 'search', 'friends',
  'chat_detail', 'store', 'agency', 'badges', 'charm_wealth', 'wealth_level',
  'charm_level', 'silver_coins', 'help_center', 'edit_profile',
  'user_detail_profile', 'room_rankings', 'charm_ranking', 'wealth_ranking',
  'fill_info', 'login', 'messages',
];

const MainLayout: React.FC = () => {
  const { activeRoom, activeTab, activeSubScreen, isAuthenticated, setActiveSubScreen } = useApp();

  // 0. If user is logged out, render the exact Login Screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // 1. If currently in full live Voice Room
  if (activeRoom && !activeSubScreen) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-[#080914] relative shadow-2xl">
        <VoiceRoomScreen />
      </div>
    );
  }

  // 2. If viewing a sub-screen modal
  if (activeSubScreen) {
    if (!subScreens.includes(activeSubScreen)) {
      return (
        <div className="max-w-md mx-auto min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
          <p className="font-bold mb-4">
            {activeSubScreen === 'visitors' ? 'لا توجد بيانات زوار متاحة حالياً' : 'هذه الصفحة غير متاحة حالياً'}
          </p>
          <button type="button" onClick={() => setActiveSubScreen(null)} className="px-6 py-2 rounded-full bg-emerald-600 text-white font-bold cursor-pointer">
            الرجوع
          </button>
        </div>
      );
    }
    const isLightScreen = [
      'store',
      'agency',
      'badges',
      'silver_coins',
      'help_center',
      'edit_profile',
      'recharge',
    ].includes(activeSubScreen);

    return (
      <div
        className={`max-w-md mx-auto min-h-screen relative shadow-2xl ${
          isLightScreen ? 'bg-[#f8fafc]' : 'bg-[#0b0c16]'
        }`}
      >
        {activeSubScreen === 'level' && <LevelScreen />}
        {activeSubScreen === 'vip' && <VIPScreen />}
        {activeSubScreen === 'wallet' && <WalletScreen />}
        {activeSubScreen === 'recharge' && <RechargeScreen />}
        {activeSubScreen === 'settings' && <SettingsScreen />}
        {activeSubScreen === 'search' && <SearchModal />}
        {activeSubScreen === 'friends' && <FriendsModal />}
        {activeSubScreen === 'chat_detail' && <ChatDetailScreen />}
        {activeSubScreen === 'messages' && <MessagesScreen />}
        {activeSubScreen === 'store' && <StoreScreen />}
        {activeSubScreen === 'agency' && <AgencyScreen />}
        {activeSubScreen === 'badges' && <BadgesScreen />}
        {activeSubScreen === 'charm_wealth' && <CharmWealthScreen initialTab="wealth" />}
        {activeSubScreen === 'wealth_level' && <CharmWealthScreen initialTab="wealth" />}
        {activeSubScreen === 'charm_level' && <CharmWealthScreen initialTab="charm" />}
        {activeSubScreen === 'silver_coins' && <SilverCoinsScreen />}
        {activeSubScreen === 'help_center' && <HelpCenterScreen />}
        {activeSubScreen === 'edit_profile' && <EditProfileModal />}
        {activeSubScreen === 'user_detail_profile' && <UserDetailProfileScreen />}
        {activeSubScreen === 'room_rankings' && <RoomRankingsScreen />}
        {activeSubScreen === 'charm_ranking' && <CharmRankingScreen />}
        {activeSubScreen === 'wealth_ranking' && <WealthRankingScreen />}
        {activeSubScreen === 'fill_info' && <FillInfoScreen />}
        {activeSubScreen === 'login' && <LoginScreen />}
      </div>
    );
  }

  // 3. Main 5 Bottom-Navigation Tabs
  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#f8fafc] text-slate-800 relative shadow-2xl overflow-x-hidden">
      {activeTab === 'home' && <HomeScreen />}
      {activeTab === 'rooms' && <RoomsListScreen />}
      {activeTab === 'create' && <CreateRoomScreen />}
      {activeTab === 'messages' && <MessagesScreen />}
      {activeTab === 'profile' && <ProfileScreen />}

      <BottomNavigation />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <RealtimeRankingsProvider>
          <MainLayout />
        </RealtimeRankingsProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

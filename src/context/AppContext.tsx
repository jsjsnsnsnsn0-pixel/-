import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Room, Gift, Transaction, Conversation, NotificationItemData, ActiveGiftAnimation } from '../types';
import { currentUser as initialUser, sampleRooms, sampleTransactions, sampleConversations, sampleNotifications } from '../data/mockData';
import { getNextSequentialId } from '../utils/accountIds';

interface AppContextType {
  user: User;
  rooms: Room[];
  activeRoom: Room | null;
  activeTab: 'home' | 'rooms' | 'create' | 'messages' | 'profile';
  activeSubScreen: string | null;
  selectedChatUser: User | null;
  activeGiftOverlay: ActiveGiftAnimation | null;
  transactions: Transaction[];
  conversations: Conversation[];
  notifications: NotificationItemData[];
  isMyMicMuted: boolean;
  isHandRaised: boolean;
  isSpeakerOn: boolean;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  unreadSystemMessagesCount: number;
  hasUnseenVisitors: boolean;
  hasUnseenFollowers: boolean;
  markSystemMessagesAsRead: () => void;
  markVisitorsAsSeen: () => void;
  markFollowersAsSeen: () => void;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  setActiveTab: (tab: 'home' | 'rooms' | 'create' | 'messages' | 'profile') => void;
  setActiveSubScreen: (screen: string | null) => void;
  setSelectedChatUser: (user: User | null) => void;
  joinRoom: (room: Room) => void;
  leaveRoom: () => void;
  toggleMyMic: () => void;
  toggleRaiseHand: () => void;
  toggleSpeaker: () => void;
  takeSeat: (seatIndex: number) => void;
  leaveSeat: (seatIndex: number) => void;
  sendGiftInRoom: (gift: Gift, recipient: User, seatIndex?: number) => boolean;
  rechargeGold: (amount: number, transactionTitle?: string) => void;
  createNewRoom: (newRoom: Partial<Room>) => Room;
  lockSeat: (seatIndex: number) => void;
  unlockSeat: (seatIndex: number) => void;
  muteSeatUser: (seatIndex: number) => void;
  kickSeatUser: (seatIndex: number) => void;
  sendMessageToConversation: (conversationId: string, content: string, type?: 'text' | 'voice' | 'gift') => void;
  markNotificationAsRead: (id: string) => void;
  isAuthenticated: boolean;
  loginWithGoogle: (googleProfile?: { name?: string; email?: string; picture?: string }) => void;
  loginWithPhone: (phone?: string, otp?: string) => void;
  logout: () => void;
  setIsAuthenticated: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Clean real initial user starting from zero coins, zero level, zero wealth/charm, and default image
  const [user, setUser] = useState<User>(() => {
    try {
      // 1. Check if there is an active account identifier saved
      const activeAccountKey = localStorage.getItem('toti_active_account_key');
      if (activeAccountKey) {
        const savedAccount = localStorage.getItem(`toti_account_${activeAccountKey}`);
        if (savedAccount) {
          const parsed = JSON.parse(savedAccount);
          if (parsed && parsed.id) {
            // Update account to requested ID 30301 with wealth 45 and charm 30
            const updatedId = '30301';

            return {
              ...initialUser,
              ...parsed,
              id: updatedId,
              wealthLevel: Math.max(parsed.wealthLevel || 0, 45),
              charmLevel: Math.max(parsed.charmLevel || 0, 30),
              level: Math.max(parsed.level || 0, 45),
            };
          }
        }
      }

      // 2. Check general app_user_profile fallback
      const saved = localStorage.getItem('app_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          const updatedId = '30301';

          return {
            ...initialUser,
            ...parsed,
            id: updatedId,
            wealthLevel: Math.max(parsed.wealthLevel || 0, 45),
            charmLevel: Math.max(parsed.charmLevel || 0, 30),
            level: Math.max(parsed.level || 0, 45),
          };
        }
      }
    } catch {
      // fallback
    }
    return initialUser;
  });

  // Save profile changes immediately to both general profile and specific account store
  useEffect(() => {
    try {
      localStorage.setItem('app_user_profile', JSON.stringify(user));

      // Also persist to account-specific key (e.g. by email or user ID)
      const activeAccountKey = localStorage.getItem('toti_active_account_key') || user.id;
      if (activeAccountKey) {
        localStorage.setItem(`toti_account_${activeAccountKey}`, JSON.stringify(user));
      }
    } catch {
      // ignore storage quota error
    }
  }, [user]);
  const [rooms, setRooms] = useState<Room[]>(sampleRooms);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [activeTab, setActiveTabState] = useState<'home' | 'rooms' | 'create' | 'messages' | 'profile'>('home');
  const [activeSubScreen, setActiveSubScreen] = useState<string | null>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [activeGiftOverlay, setActiveGiftOverlay] = useState<ActiveGiftAnimation | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions);
  const [conversations, setConversations] = useState<Conversation[]>(sampleConversations);
  const [notifications, setNotifications] = useState<NotificationItemData[]>(sampleNotifications);
  const [isMyMicMuted, setIsMyMicMuted] = useState<boolean>(false);
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);

  // Authentication State: checked from localStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const auth = localStorage.getItem('app_is_authenticated');
      if (auth !== null) {
        return auth === 'true';
      }
    } catch {
      // fallback
    }
    return false; // Show LoginScreen so user can sign in with their desired Google account
  });

  const logout = () => {
    setIsAuthenticated(false);
    setActiveRoom(null);
    setActiveSubScreen(null);
    try {
      localStorage.setItem('app_is_authenticated', 'false');
    } catch {
      // ignore
    }
  };

  const loginWithGoogle = (googleProfile?: { name?: string; email?: string; picture?: string }) => {
    const accountKey = googleProfile?.email ? googleProfile.email.toLowerCase().trim() : 'guest_google';
    localStorage.setItem('toti_active_account_key', accountKey);

    // 1. Check if this Google account was already registered and has saved data & progression
    let existingProfile: User | null = null;
    try {
      const saved = localStorage.getItem(`toti_account_${accountKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          existingProfile = parsed;
        }
      }
    } catch {
      // ignore
    }

    if (existingProfile) {
      // Restore existing account
      setUser({
        ...initialUser,
        ...existingProfile,
      });
    } else {
      // First time this Google account signs in: create clean real user profile
      const assignedPresetId = '30301';

      const newProfile: User = {
        ...initialUser,
        id: assignedPresetId,
        username: googleProfile?.email ? googleProfile.email.split('@')[0] : `user_${assignedPresetId}`,
        name: googleProfile?.name || 'مستخدم جديد',
        // Use user's real picture if available from Google, otherwise the uploaded default avatar
        avatar: googleProfile?.picture || '/src/assets/images/default_arab_user_avatar_1790806239365.jpg',
        bio: 'أهلاً بك في حسابي في توتي شات 🌹',
        level: 45,
        wealthLevel: 45,
        charmLevel: 30,
        vipLevel: 0,
        gold: 0,
        diamonds: 0,
        silverCoins: 0,
        friendsCount: 0,
        followersCount: 0,
        followingCount: 0,
        visitorsCount: 0,
        sentGiftsCount: '0',
        receivedTotal: '0',
        receivedGiftsCount: 0,
        isHost: false,
      };

      setUser(newProfile);
      try {
        localStorage.setItem(`toti_account_${accountKey}`, JSON.stringify(newProfile));
      } catch {
        // ignore
      }
    }

    setIsAuthenticated(true);
    setActiveTabState('home');
    setActiveSubScreen(null);

    try {
      localStorage.setItem('app_is_authenticated', 'true');
    } catch {
      // ignore
    }
  };

  const loginWithPhone = (_phone?: string, _otp?: string) => {
    const assignedPresetId = getNextSequentialId();
    setUser((prev) => ({
      ...prev,
      id: assignedPresetId,
      username: `user_${assignedPresetId}`,
      name: 'مستخدم جديد',
      avatar: '/src/assets/images/default_arab_user_avatar_1790806239365.jpg',
      level: 1,
      wealthLevel: 1,
      charmLevel: 1,
      vipLevel: 0,
      gold: 0,
      diamonds: 0,
      silverCoins: 0,
      friendsCount: 0,
      followersCount: 0,
      followingCount: 0,
      visitorsCount: 0,
      sentGiftsCount: '0',
      receivedTotal: '0',
      receivedGiftsCount: 0,
      isHost: false,
      agencyName: undefined,
      agencyOwner: undefined,
      agencyId: undefined,
      agencyMembersCount: undefined,
      agencyAvatar: undefined,
      coupleName: undefined,
      coupleAvatar: undefined,
      customTitle: undefined,
      nameShimmerStyle: undefined,
      nobleRank: undefined,
      rankingTitle: undefined,
    }));

    setIsAuthenticated(true);
    setActiveTabState('home');
    setActiveSubScreen(null);

    try {
      localStorage.setItem('app_is_authenticated', 'true');
    } catch {
      // ignore
    }
  };

  const setActiveTab = (tab: 'home' | 'rooms' | 'create' | 'messages' | 'profile') => {
    setActiveTabState(tab);
    setActiveSubScreen(null);
  };

  const joinRoom = (room: Room) => {
    // If user is owner, they might be in seat 0
    setActiveRoom(room);
  };

  const leaveRoom = () => {
    setActiveRoom(null);
    setIsHandRaised(false);
  };

  const toggleMyMic = () => {
    setIsMyMicMuted((prev) => !prev);
    if (activeRoom) {
      setRooms((prevRooms) =>
        prevRooms.map((r) => {
          if (r.id === activeRoom.id) {
            const updatedSeats = r.seats.map((seat) => {
              if (seat.user?.id === user.id) {
                return { ...seat, isMuted: !seat.isMuted };
              }
              return seat;
            });
            return { ...r, seats: updatedSeats };
          }
          return r;
        })
      );
      setActiveRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          seats: prev.seats.map((seat) =>
            seat.user?.id === user.id ? { ...seat, isMuted: !seat.isMuted } : seat
          ),
        };
      });
    }
  };

  const toggleRaiseHand = () => {
    setIsHandRaised((prev) => !prev);
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn((prev) => !prev);
  };

  const takeSeat = (seatIndex: number) => {
    if (!activeRoom) return;
    const seat = activeRoom.seats[seatIndex];
    if (seat && !seat.isLocked && !seat.user) {
      const updatedSeats = activeRoom.seats.map((s, idx) => {
        if (idx === seatIndex) {
          return { ...s, user: user, isMuted: isMyMicMuted, isSpeaking: false };
        }
        // Remove user from any other seat if they already had one
        if (s.user?.id === user.id) {
          return { ...s, user: undefined, isSpeaking: false };
        }
        return s;
      });

      const updatedRoom = { ...activeRoom, seats: updatedSeats };
      setActiveRoom(updatedRoom);
      setRooms((prev) => prev.map((r) => (r.id === activeRoom.id ? updatedRoom : r)));
    }
  };

  const leaveSeat = (seatIndex: number) => {
    if (!activeRoom) return;
    const updatedSeats = activeRoom.seats.map((s, idx) => {
      if (idx === seatIndex && s.user?.id === user.id) {
        return { ...s, user: undefined, isSpeaking: false };
      }
      return s;
    });
    const updatedRoom = { ...activeRoom, seats: updatedSeats };
    setActiveRoom(updatedRoom);
    setRooms((prev) => prev.map((r) => (r.id === activeRoom.id ? updatedRoom : r)));
  };

  const sendGiftInRoom = (gift: Gift, recipient: User, seatIndex?: number): boolean => {
    if (user.gold < gift.price) {
      return false;
    }

    // Deduct gold from sender, increase wealth points & sent gifts
    setUser((prev) => {
      const prevSpent = parseInt(prev.sentGiftsCount || '0', 10) || 0;
      const newSpent = prevSpent + gift.price;
      // Realistic level progression: every 1,000 gold spent = +1 wealth level
      const calculatedWealth = Math.max(1, Math.min(150, Math.floor(newSpent / 1000) + 1));
      const calculatedLevel = Math.max(1, Math.min(150, Math.floor(newSpent / 1000) + 1));

      return {
        ...prev,
        gold: Math.max(0, prev.gold - gift.price),
        wealthLevel: calculatedWealth,
        level: calculatedLevel,
        sentGiftsCount: newSpent.toLocaleString(),
      };
    });

    // If recipient is in the active room seats, update their charm level and received gifts
    if (activeRoom) {
      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          if (room.id !== activeRoom.id) return room;
          const updatedSeats = room.seats.map((seat) => {
            if (seat.user && seat.user.id === recipient.id) {
              const currentGifts = seat.user.receivedGiftsCount || 0;
              const currentReceivedVal = parseInt(seat.user.receivedTotal || '0', 10) || 0;
              const newReceivedVal = currentReceivedVal + gift.price;
              const calculatedCharm = Math.max(1, Math.min(150, Math.floor(newReceivedVal / 1000) + 1));

              return {
                ...seat,
                user: {
                  ...seat.user,
                  receivedGiftsCount: currentGifts + 1,
                  receivedTotal: newReceivedVal.toLocaleString(),
                  charmLevel: calculatedCharm,
                },
              };
            }
            return seat;
          });
          return { ...room, seats: updatedSeats };
        })
      );
    }

    // Add transaction
    const newTx: Transaction = {
      id: `TX-${Date.now().toString().slice(-4)}`,
      type: 'gift_sent',
      title: `إرسال هدية: ${gift.name} إلى ${recipient.name}`,
      amount: -gift.price,
      currency: 'gold',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      status: 'completed',
      iconType: 'gift',
    };
    setTransactions((prev) => [newTx, ...prev]);

    // Trigger overlay animation
    setActiveGiftOverlay({
      id: `${Date.now()}`,
      gift,
      sender: user,
      recipient,
      targetSeatIndex: seatIndex,
    });

    // Auto dismiss overlay after 3.8s
    setTimeout(() => {
      setActiveGiftOverlay(null);
    }, 3800);

    // Record support into rankings system
    try {
      window.dispatchEvent(
        new CustomEvent('toti_gift_support_sent', {
          detail: {
            sender: user,
            recipient,
            room: activeRoom,
            amount: gift.price,
          },
        })
      );
    } catch {
      // ignore
    }

    return true;
  };

  const rechargeGold = (amount: number, transactionTitle?: string) => {
    setUser((prev) => ({
      ...prev,
      gold: prev.gold + amount,
    }));

    const newTx: Transaction = {
      id: `TX-${Date.now().toString().slice(-4)}`,
      type: 'recharge',
      title: transactionTitle || `شحن رصيد ذهب (+${amount.toLocaleString('ar-SA')})`,
      amount: amount,
      currency: 'gold',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      status: 'completed',
      iconType: 'plus',
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const createNewRoom = (newRoomData: Partial<Room>): Room => {
    const seatsCount = newRoomData.seatsCount || 8;
    const initialSeats = Array.from({ length: seatsCount }).map((_, idx) => ({
      seatIndex: idx,
      isLocked: false,
      isMuted: false,
      isSpeaking: idx === 0,
      user: idx === 0 ? user : undefined,
    }));

    const createdRoom: Room = {
      id: `${Math.floor(1000 + Math.random() * 9000)}`,
      title: newRoomData.title || 'مجلس الأصدقاء 🎙️',
      description: newRoomData.description || 'أهلاً بكم في غرفتنا الصوتية',
      coverImage: newRoomData.coverImage || '/src/assets/images/room_cover_majlis_1790226059300.jpg',
      category: (newRoomData.category as any) || 'سوالف وألعاب',
      owner: user,
      usersCount: 1,
      seatsCount,
      isVIP: newRoomData.isVIP ?? true,
      isPrivate: newRoomData.isPrivate ?? false,
      status: 'live',
      tags: newRoomData.tags || ['جديد', 'دردشة'],
      seats: initialSeats,
    };

    setRooms((prev) => [createdRoom, ...prev]);
    setActiveRoom(createdRoom);
    return createdRoom;
  };

  const lockSeat = (seatIndex: number) => {
    if (!activeRoom) return;
    const updatedSeats = activeRoom.seats.map((s, idx) =>
      idx === seatIndex ? { ...s, isLocked: !s.isLocked, user: s.isLocked ? s.user : undefined } : s
    );
    const updated = { ...activeRoom, seats: updatedSeats };
    setActiveRoom(updated);
    setRooms((prev) => prev.map((r) => (r.id === activeRoom.id ? updated : r)));
  };

  const unlockSeat = (seatIndex: number) => {
    if (!activeRoom) return;
    const updatedSeats = activeRoom.seats.map((s, idx) =>
      idx === seatIndex ? { ...s, isLocked: false } : s
    );
    const updated = { ...activeRoom, seats: updatedSeats };
    setActiveRoom(updated);
    setRooms((prev) => prev.map((r) => (r.id === activeRoom.id ? updated : r)));
  };

  const muteSeatUser = (seatIndex: number) => {
    if (!activeRoom) return;
    const updatedSeats = activeRoom.seats.map((s, idx) =>
      idx === seatIndex ? { ...s, isMuted: !s.isMuted } : s
    );
    const updated = { ...activeRoom, seats: updatedSeats };
    setActiveRoom(updated);
    setRooms((prev) => prev.map((r) => (r.id === activeRoom.id ? updated : r)));
  };

  const kickSeatUser = (seatIndex: number) => {
    if (!activeRoom) return;
    const updatedSeats = activeRoom.seats.map((s, idx) =>
      idx === seatIndex ? { ...s, user: undefined, isSpeaking: false } : s
    );
    const updated = { ...activeRoom, seats: updatedSeats };
    setActiveRoom(updated);
    setRooms((prev) => prev.map((r) => (r.id === activeRoom.id ? updated : r)));
  };

  const sendMessageToConversation = (conversationId: string, content: string, type: 'text' | 'voice' | 'gift' = 'text') => {
    const newMsg = {
      id: `m-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      content,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      type,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            lastMessage: type === 'voice' ? '🎙️ رسالة صوتية' : content,
            timestamp: 'الآن',
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );
  };

  const [unreadSystemMessagesCount, setUnreadSystemMessagesCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('toti_unread_system_count');
      return saved !== null ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  // Track profile visitor / follower badges (disappear after user views them)
  const [hasUnseenVisitors, setHasUnseenVisitors] = useState<boolean>(() => {
    try {
      return localStorage.getItem('toti_seen_visitors') !== 'true';
    } catch {
      return true;
    }
  });

  const [hasUnseenFollowers, setHasUnseenFollowers] = useState<boolean>(() => {
    try {
      return localStorage.getItem('toti_seen_followers') !== 'true';
    } catch {
      return true;
    }
  });

  const markSystemMessagesAsRead = () => {
    setUnreadSystemMessagesCount(0);
    try {
      localStorage.setItem('toti_unread_system_count', '0');
    } catch {
      // ignore
    }
  };

  const markVisitorsAsSeen = () => {
    setHasUnseenVisitors(false);
    try {
      localStorage.setItem('toti_seen_visitors', 'true');
    } catch {
      // ignore
    }
  };

  const markFollowersAsSeen = () => {
    setHasUnseenFollowers(false);
    try {
      localStorage.setItem('toti_seen_followers', 'true');
    } catch {
      // ignore
    }
  };

  // Listen for new system messages to increment unread counter
  useEffect(() => {
    const handleNewSysMsg = () => {
      setUnreadSystemMessagesCount((prev) => {
        const next = prev + 1;
        try {
          localStorage.setItem('toti_unread_system_count', next.toString());
        } catch {
          // ignore
        }
        return next;
      });
    };
    window.addEventListener('toti_system_message_received', handleNewSysMsg);
    return () => {
      window.removeEventListener('toti_system_message_received', handleNewSysMsg);
    };
  }, []);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const unreadMessagesCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppContext.Provider
      value={{
        user,
        rooms,
        activeRoom,
        activeTab,
        activeSubScreen,
        selectedChatUser,
        activeGiftOverlay,
        transactions,
        conversations,
        notifications,
        isMyMicMuted,
        isHandRaised,
        isSpeakerOn,
        unreadMessagesCount,
        unreadNotificationsCount,
        unreadSystemMessagesCount,
        hasUnseenVisitors,
        hasUnseenFollowers,
        markSystemMessagesAsRead,
        markVisitorsAsSeen,
        markFollowersAsSeen,
        setUser,
        setActiveTab,
        setActiveSubScreen,
        setSelectedChatUser,
        joinRoom,
        leaveRoom,
        toggleMyMic,
        toggleRaiseHand,
        toggleSpeaker,
        takeSeat,
        leaveSeat,
        sendGiftInRoom,
        rechargeGold,
        createNewRoom,
        lockSeat,
        unlockSeat,
        muteSeatUser,
        kickSeatUser,
        sendMessageToConversation,
        markNotificationAsRead,
        isAuthenticated,
        loginWithGoogle,
        loginWithPhone,
        logout,
        setIsAuthenticated,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

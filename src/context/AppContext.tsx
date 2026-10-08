import {sampleGifts} from '../data/mockData';
import { walletTitles } from '../services/diamonds';
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback, startTransition } from 'react';
import { User, Room, Gift, Transaction, Conversation, NotificationItemData, ActiveGiftAnimation } from '../types';
import { signInWithGoogle, listenForNativeAuth } from '../services/nativeAuth';
import { supabase } from '../services/supabase';
import { emptyUser, profileToUser, editableProfile, roomMemberToUser } from '../services/profile';

interface AppContextType {
  user: User; rooms: Room[]; ownedClosedRooms: Room[]; activeRoom: Room | null;
  activeTab: 'home' | 'rooms' | 'create' | 'messages' | 'profile';
  activeSubScreen: string | null; selectedChatUser: User | null;
  activeGiftOverlay: ActiveGiftAnimation | null; transactions: Transaction[];
  conversations: Conversation[]; notifications: NotificationItemData[];
  isMyMicMuted: boolean; isHandRaised: boolean; isSpeakerOn: boolean; noiseSuppression: boolean; toggleNoiseSuppression: () => void;
  unreadMessagesCount: number; unreadNotificationsCount: number; unreadSystemMessagesCount: number;
  hasUnseenVisitors: boolean; hasUnseenFollowers: boolean;
  markSystemMessagesAsRead: () => void; markVisitorsAsSeen: () => void; markFollowersAsSeen: () => void;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  setActiveTab: (tab: AppContextType['activeTab']) => void;
  setActiveSubScreen: (screen: string | null) => void; setSelectedChatUser: (user: User | null) => void;
  reopenRoom: (room: Room) => Promise<boolean>;
  joinRoom: (room: Room) => Promise<void>; leaveRoom: () => Promise<void>;
  toggleMyMic: () => Promise<void>; toggleRaiseHand: () => Promise<void>; toggleSpeaker: () => void;
  takeSeat: (seat: number) => Promise<void>; leaveSeat: (seat: number) => Promise<void>;
  sendGiftInRoom: (gift: Gift, recipient: User, seat?: number, requestId?: string, useInventory?: boolean, quantity?: number) => Promise<boolean>;
  sendSavedGiftInRoom: (gift: Gift, recipient: User, seat?: number, requestId?: string) => Promise<boolean>;
  rechargeGold: (amount: number, title?: string) => void;
  createNewRoom: (room: Partial<Room>) => Promise<Room | null>;
  lockSeat: (seat: number) => Promise<boolean>; unlockSeat: (seat: number) => Promise<boolean>;
  muteSeatUser: (seat: number) => Promise<boolean>; kickSeatUser: (seat: number) => Promise<boolean>;
  sendMessageToConversation: (id: string, content: string, type?: 'text' | 'voice' | 'gift') => Promise<boolean>;
  markNotificationAsRead: (id: string) => void;
  isAuthenticated: boolean; authLoading: boolean; needsProfile: boolean;
  error: string | null; dismissError: () => void; reportError: (message: string) => void;
  loginWithGoogle: (profile?: {name?: string; email?: string; picture?: string}) => Promise<void>;
  loginWithPhone: (phone?: string, otp?: string) => Promise<void>;
  logout: () => Promise<void>; refreshRooms: () => Promise<Room[]>; refreshProfile: () => Promise<void>; refreshWallet: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  markConversationAsRead: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUserState] = useState<User>(emptyUser);
  const userRef = useRef(user); userRef.current = user;
  const [authId, setAuthId] = useState<string | null>(null);
  const authRef = useRef(authId); authRef.current = authId;
  const [authLoading, setAuthLoading] = useState(true);
  const [profileReady, setProfileReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [ownedClosedRooms,setOwnedClosedRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const activeRef = useRef(activeRoom); activeRef.current = activeRoom;
  const [activeTab, setActiveTabState] = useState<AppContextType['activeTab']>('home');
  const [activeSubScreen, setActiveSubScreenState] = useState<string | null>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [activeGiftOverlay, setActiveGiftOverlay] = useState<ActiveGiftAnimation | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<NotificationItemData[]>([]);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  useEffect(() => {
    if (!authId) return;
    try {
      const prefs = JSON.parse(localStorage.getItem(`toti_audio_preferences_${authId}`) || '{}');
      setIsSpeakerOn(prefs.speaker !== false); setNoiseSuppression(prefs.noise !== false);
    } catch {setIsSpeakerOn(true); setNoiseSuppression(true);}
  }, [authId]);
  const saveAudioPreference = (speaker: boolean, noise: boolean) => {
    if (!authRef.current) return;
    try {localStorage.setItem(`toti_audio_preferences_${authRef.current}`, JSON.stringify({speaker, noise}));} catch {}
  };
  const [hasUnseenVisitors, setHasUnseenVisitors] = useState(false);
  const [hasUnseenFollowers, setHasUnseenFollowers] = useState(false);
  const [unreadSystemMessagesCount, setUnreadSystemMessagesCount] = useState(0);
  const profileQueue = useRef(Promise.resolve());
  const overlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fail = useCallback((e: unknown) => {
    console.error('TotiChat operation failed:', e);
    const raw = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
    const messages: Record<string, string> = {
      'insufficient diamonds': 'رصيد الألماس غير كافٍ.',
      'insufficient gold': 'رصيد الذهب غير كافٍ.',
      'seat is occupied': 'المقعد محجوز، اختر مقعداً آخر.',
      'private room requires an invitation': 'تحتاج دعوة لدخول هذه الغرفة.',
      'VIP membership required': 'هذه الغرفة تتطلب عضوية VIP.',
      'no official recharge agent is configured for this country': 'لا يوجد وكيل شحن رسمي لبلدك حالياً.',
      'account already owns a room':'حسابك يملك غرفة بالفعل. افتحها من قسم ملكي.',
      'authentication required': 'يرجى تسجيل الدخول مجدداً.',
    };
    if(typeof navigator!=='undefined'&&navigator.onLine===false){setError('خطأ اتصال بالإنترنت. تحقق من الشبكة وحاول مجدداً.');return;}
    if(/Failed to fetch|NetworkError|fetch failed/i.test(raw)){setError('تعذر الاتصال بالخدمة. تحقق من الاتصال وحاول مجدداً.');return;}
    setError(messages[raw] || 'تعذر إتمام العملية. تحقق من الاتصال وحاول مجدداً.');
  }, []);

  useEffect(() => {
    let disposed = false; let stop = () => {};
    void listenForNativeAuth(() => setError('تعذر إتمام تسجيل الدخول. حاول مجدداً.')).then(cleanup => {
      if (disposed) cleanup(); else stop = cleanup;
    }).catch(fail);
    return () => {disposed = true; stop();};
  }, [fail]);

  const refreshProfile = useCallback(async () => {
    const id = authRef.current;
    if (!id) return;
    const {data, error} = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw error;
    if (id !== authRef.current) return;
    const social = await supabase.rpc('social_profile', {p_public_id: Number(data.public_id), p_visit: false});
    if (social.error) throw social.error;
    if (id !== authRef.current) return;
    const next = profileToUser({...data, ...(social.data || {})});
    userRef.current = next;
    setUserState(next); setProfileReady(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    let authEventReceived = false;
    const acceptSession = (id: string | null) => {
      if (!mounted) return;
      if (id !== authRef.current) {
        authRef.current = id; setAuthId(id); setProfileReady(false);
        userRef.current = emptyUser; setUserState(emptyUser);
        setRooms([]); setOwnedClosedRooms([]); setConversations([]); setTransactions([]); setNotifications([]);
        setSelectedChatUser(null); setActiveRoom(null); setActiveSubScreenState(null);
        setActiveGiftOverlay(null); setActiveTabState('home'); setError(null);
      }
      setAuthLoading(false);
    };
    const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
      // Keep this callback synchronous; queries run in the effect below.
      authEventReceived = true;
      acceptSession(session?.user.id || null);
    });
    supabase.auth.getSession().then(({data, error}) => {
      if (error) { if (mounted) { fail(error); setAuthLoading(false); } }
      else if (!authEventReceived) acceptSession(data.session?.user.id || null);
    }).catch(e => { if (mounted) { fail(e); setAuthLoading(false); } });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [fail]);

  const refreshRooms = useCallback(async (): Promise<Room[]> => {
    const id = authRef.current;
    if (!id) return [];
    const [rs, ms, ls, links] = await Promise.all([
      supabase.from('rooms').select('*').or(`is_active.eq.true,owner_id.eq.${id}`).order('created_at', {ascending: false}),
      supabase.from('room_members').select('*'), supabase.from('room_seat_locks').select('*'),
      supabase.from('user_room_links').select('*').eq('user_id',id),
    ]);
    for (const result of [rs, ms, ls, links]) if (result.error) throw result.error;
    if (id !== authRef.current) return [];
    const mapped: Room[] = (rs.data || []).map(row => {
      const members = (ms.data || []).filter(m => m.room_id === row.id);
      const memberUser = (m: Record<string, unknown>): User => m.user_id === id ? userRef.current : roomMemberToUser(m);
      const owner = row.owner_id === id ? userRef.current : profileToUser({
        id: row.owner_id, public_id: row.owner_public_id, display_name: row.owner_display_name,
        avatar_url: row.owner_avatar_url,
      });
      return {
        id: row.id, owner, ownerAuthId: row.owner_id, title: row.name,
        isActive: row.is_active, welcomeMessage: row.welcome_message ?? row.description ?? '',
        chatEnabled: row.chat_enabled ?? true, giftEffectsEnabled: row.gift_effects_enabled ?? true,
        vehicleEffectsEnabled: row.vehicle_effects_enabled ?? true, entranceEffectsEnabled: row.entrance_effects_enabled ?? true,
        isFollowed:(links.data||[]).some(link=>link.room_id===row.id&&link.followed),
        lastVisitedAt:(links.data||[]).find(link=>link.room_id===row.id)?.last_visited_at||undefined,
        internalBackground:row.internal_background_url||'/assets/images/room_screen_bg_1790556227206.jpg',
        description: row.welcome_message ?? row.description ?? '', coverImage: row.external_image_url || row.image_url || '/assets/images/room_cover_majlis_1790226059300.jpg',
        category: row.category, seatsCount: row.max_seats, isPrivate: row.is_private,
        isVIP: row.is_vip, status: row.is_active ? 'live' : 'ended', tags: row.tags || [], usersCount: members.length,
        canModerate: row.owner_id === id || members.some(m => m.user_id === id && m.role === 'moderator'),
        members: members.map(m=>({...memberUser(m),roomRole:m.role})),
        seats: Array.from({length: row.max_seats}, (_, index) => {
          const member = members.find(m => m.seat_number === index + 1);
          return {seatIndex: index, isLocked: (ls.data || []).some(l => l.room_id === row.id && l.seat_number === index + 1),
            isMuted: member?.is_muted ?? true, isSpeaking: false, user: member ? {...memberUser(member),roomRole:member.role} : undefined};
        }),
      };
    });
    const liveRooms = mapped.filter(room => room.isActive);
    setOwnedClosedRooms(mapped.filter(room => !room.isActive && room.ownerAuthId === id));
    setRooms(liveRooms);
    setActiveRoom(prev => prev ? liveRooms.find(r => r.id === prev.id && r.members?.some(m => m.authId === id)) || null : null);
    return liveRooms;
  }, []);

  const refreshMessages = useCallback(async () => {
    const id = authRef.current;
    if (!id) return;
    const {data, error} = await supabase.from('direct_messages').select('*')
      .or(`sender_id.eq.${id},recipient_id.eq.${id}`).order('created_at', {ascending: false}).limit(1000);
    if (error) throw error;
    if (id !== authRef.current) return;
    const grouped = new Map<string, Conversation>();
    const latest = new Map<string, number>();
    for (const row of [...(data || [])].reverse()) {
      const mine = row.sender_id === id;
      const publicId = String(mine ? row.recipient_public_id : row.sender_public_id);
      latest.set(publicId, new Date(row.created_at).getTime());
      let c = grouped.get(publicId);
      if (!c) {
        c = {id: publicId, user: profileToUser({id: mine ? row.recipient_id : row.sender_id,
          public_id: publicId, display_name: mine ? row.recipient_display_name : row.sender_display_name,
          avatar_url: mine ? row.recipient_avatar_url : row.sender_avatar_url}),
          lastMessage: '', timestamp: '', unreadCount: 0, messages: []};
        grouped.set(publicId, c);
      }
      const timestamp = new Date(row.created_at).toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'});
      c.messages.push({id: row.id, senderId: String(row.sender_public_id), senderName: row.sender_display_name || '',
        senderAvatar: row.sender_avatar_url || '', content: row.content || row.media_url || '',
        type: row.message_type, timestamp, isMe: mine});
      c.lastMessage = row.content || 'رسالة صوتية'; c.timestamp = timestamp;
      if (!mine && !row.read_at) c.unreadCount++;
    }
    setConversations([...grouped.values()].sort((a,b) => (latest.get(b.id) || 0) - (latest.get(a.id) || 0)));
  }, []);

  const refreshTransactions = useCallback(async () => {
    const id = authRef.current;
    if (!id) return;
    const {data, error} = await supabase.from('wallet_transactions').select('*').eq('user_id', id)
      .order('created_at', {ascending: false}).limit(100);
    if (error) throw error;
    if (id !== authRef.current) return;
    setTransactions((data || []).flatMap(row => (['gold', 'diamonds', 'silver'] as const).flatMap(currency => {
      const amount = Number(row[currency === 'diamonds' ? 'diamond_delta' : `${currency}_delta`] || 0);
      if (!amount) return [];
      return [{id: `${row.id}:${currency}`, type: row.transaction_type === 'diamond_conversion' ? 'diamonds_exchange' : row.transaction_type,
        title: walletTitles[row.transaction_type] || 'حركة المحفظة', amount, currency,
        date: new Date(row.created_at).toLocaleDateString('ar-SA'),
        time: new Date(row.created_at).toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'}),
        status: 'completed' as const, iconType: row.transaction_type === 'recharge' ? 'plus' : 'gift'}];
    })));

  }, []);

  const refreshNotifications = useCallback(async () => {
    const id = authRef.current; if (!id) return;
    const {data, error} = await supabase.from('user_notifications').select('*').eq('user_id', id)
      .order('created_at', {ascending: false}).limit(100);
    if (error) throw error;
    if (id !== authRef.current) return;
    setNotifications((data || []).map(row => ({id: row.id, type: row.type, title: row.title,
      description: row.description || '', roomId: row.room_id, isRead: Boolean(row.read_at),
      timestamp: new Date(row.created_at).toLocaleString('ar-SA')})));
    setUnreadSystemMessagesCount((data || []).filter(row => !row.read_at).length);
    setHasUnseenFollowers((data || []).some(row => row.type === 'follower' && !row.read_at));
  }, []);
  const refreshWallet = async () => { await Promise.all([refreshProfile(), refreshTransactions(), refreshNotifications()]); };
  const markNotificationAsRead = async (id: string) => {
    try {
      const {error} = await supabase.from('user_notifications').update({read_at: new Date().toISOString()})
        .eq('id', id).eq('user_id', authRef.current);
      if (error) throw error;
      await refreshNotifications();
    } catch (e) { fail(e); }
  };
  const markSystemMessagesAsRead = async () => {
    try {
      const {error} = await supabase.from('user_notifications').update({read_at: new Date().toISOString()})
        .eq('user_id', authRef.current).is('read_at', null);
      if (error) throw error;
      await refreshNotifications();
    } catch (e) { fail(e); }
  };

  useEffect(() => {
    if (!authId) return;
    let disposed = false;
    const heartbeat = async () => {
      const roomId = activeRef.current?.id;
      try {
        // Refresh membership before presence pruning so an active room is retained.
        if (roomId) { const {error} = await supabase.rpc('room_heartbeat', {p_room_id: roomId}); if (error) throw error; }
        const {error} = await supabase.rpc('touch_presence'); if (error) throw error;
      } catch (e) { if (!disposed) fail(e); }
    };
    void heartbeat();
    const timer = setInterval(() => { void heartbeat(); }, 45000);
    return () => { disposed = true; clearInterval(timer); };
  }, [authId, activeRoom?.id, fail]);

  useEffect(() => {
    if (!authId) return;
    let disposed = false;
    let pending = false;
    const sync = async () => {
      if (disposed || pending) return;
      pending = true;
      try { await refreshProfile(); await Promise.all([refreshRooms(), refreshMessages(), refreshTransactions(), refreshNotifications()]); }
      catch (e) { if (!disposed) fail(e); }
      finally { pending = false; }
    };
    void sync();
    const channel = supabase.channel(`app:${authId}`);
    for (const table of ['profiles', 'rooms', 'room_members', 'room_seat_locks', 'direct_messages', 'wallet_transactions', 'user_notifications','user_room_links']) {
      channel.on('postgres_changes', {event: '*', schema: 'public', table}, () => { void sync(); });
    }
    channel.subscribe();
    // Also recover missed events after reconnects, including membership deletions.
    const timer = setInterval(() => { void sync(); }, 15000);
    const onFocus = () => { void sync(); };
    window.addEventListener('focus', onFocus);window.addEventListener('online',onFocus);
    return () => { disposed = true; clearInterval(timer); window.removeEventListener('focus', onFocus);window.removeEventListener('online',onFocus); void supabase.removeChannel(channel); };
  }, [authId, refreshProfile, refreshRooms, refreshMessages, refreshTransactions, refreshNotifications, fail]);

  useEffect(()=>{
    const roomId=activeRoom?.id;if(!roomId)return;let disposed=false;
    const channel=supabase.channel(`gifts:${roomId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'room_gift_feed',filter:`room_id=eq.${roomId}`},event=>{
      const row=event.new;if(!disposed)window.dispatchEvent(new window.CustomEvent('toti:gift-confirmed',{detail:{roomId}}));if(disposed||String(row.sender_public_id)===userRef.current.id)return;
      const sender=profileToUser({public_id:row.sender_public_id,display_name:row.sender_name,avatar_url:row.sender_avatar});
      const recipient=profileToUser({public_id:row.recipient_public_id,display_name:row.recipient_name,avatar_url:row.recipient_avatar});
      const quantity=Math.max(1,Number(row.quantity)||1);
      const gift:Gift={...(sampleGifts.find(item=>item.id===row.gift_id)||{id:row.gift_id,category:'all' as const,icon:'🎁',animationType:'sparkle' as const}),name:row.gift_name,price:Number(row.amount)};
      if(overlayTimer.current)clearTimeout(overlayTimer.current);setActiveGiftOverlay({id:row.id,gift,sender,recipient,quantity});overlayTimer.current=setTimeout(()=>setActiveGiftOverlay(null),3800);
    }).subscribe();return()=>{disposed=true;void supabase.removeChannel(channel);if(overlayTimer.current)clearTimeout(overlayTimer.current);setActiveGiftOverlay(null)};
  },[activeRoom?.id]);

  useEffect(() => () => { if (overlayTimer.current) clearTimeout(overlayTimer.current); }, []);

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    const id = authRef.current;
    if (!id) { fail(new Error('authentication required')); return false; }
    const candidate = {...userRef.current, ...updates};
    try {
      const {data, error} = await supabase.from('profiles').update(editableProfile(candidate)).eq('id', id).select('*').single();
      if (error) throw error;
      if (id === authRef.current) { const next = profileToUser(data); userRef.current = next; setUserState(next); }
      return true;
    } catch (e) { fail(e); return false; }
  };
  const setUser: AppContextType['setUser'] = (action) => {
    // Legacy editors may request wallet changes. Only the editable fields reach the database.
    const account = authRef.current;
    profileQueue.current = profileQueue.current.then(async () => {
      if (!account || account !== authRef.current) return;
      const prev = userRef.current;
      const candidate = typeof action === 'function' ? action(prev) : action;
      if (candidate.gold !== prev.gold || candidate.diamonds !== prev.diamonds || candidate.vipLevel !== prev.vipLevel || candidate.id !== prev.id || candidate.silverCoins !== prev.silverCoins) {
        setError('هذه العملية تحتاج اعتماداً من الخادم ولا يمكن تنفيذها محلياً.'); return;
      }
      await updateProfile(candidate);
    }).catch(fail);
  };

  const setActiveSubScreen = (screen: string | null) => startTransition(() => {
    if (screen === 'customer_support') screen = 'help_center';
    if (screen === 'home' || screen === 'create' || screen === 'messages') {
      setActiveTabState(screen);
      if (activeRef.current) setActiveSubScreenState(screen);
      else { setActiveTabState(screen); setActiveSubScreenState(null); }
    }
    else setActiveSubScreenState(screen);
  });
  const setActiveTab = (tab: AppContextType['activeTab']) => startTransition(() => { setActiveTabState(tab); setActiveSubScreenState(activeRef.current ? tab : null); });
  const runRoomRpc = async (name: string, extra: Record<string, unknown> = {}) => {
    const room = activeRef.current; if (!room) return false;
    try {
      const {error} = await supabase.rpc(name, {p_room_id: room.id, ...extra});
      if (error) throw error;
      await refreshRooms(); return true;
    } catch (e) { fail(e); return false; }
  };
  const reopenRoom = async (room: Room): Promise<boolean> => {
    const account = authRef.current;
    if (!account || room.ownerAuthId !== account || room.isActive !== false) return false;
    try {
      const {error} = await supabase.rpc('reopen_room', {p_room_id: room.id});
      if (error) throw error;
      if (account !== authRef.current) return false;
      try { await refreshRooms(); }
      catch { setError('تم فتح الغرفة، لكن تعذر تحديث القائمة. حدّث الصفحة للتحقق.'); return false; }
      return true;
    } catch (error) { fail(error); return false; }
  };
  const joinRoom = async (room: Room) => {
    if(activeRef.current?.id===room.id){setActiveSubScreenState(null);return;}
    if (room.isActive === false) { setError('أعد فتح الغرفة قبل الدخول إليها.'); return; }
    try {
      const {error} = await supabase.rpc('join_room', {p_room_id: room.id}); if (error) throw error;
      const next = await refreshRooms();
      setActiveRoom(next.find(r => r.id === room.id) || null); setActiveSubScreenState(null); setIsHandRaised(false);
    } catch (e) { fail(e); }
  };
  const leaveRoom = async () => {
    const room = activeRef.current; if (!room) return;
    try {
      const {error} = await supabase.rpc('leave_room', {p_room_id: room.id}); if (error) throw error;
      setActiveRoom(null); setActiveSubScreenState(null); setIsHandRaised(false); await refreshRooms();
    } catch (e) { fail(e); }
  };
  const createNewRoom = async (input: Partial<Room>): Promise<Room | null> => {
    try {
      const {data, error} = await supabase.rpc('create_room', {p_name: input.title?.trim(),
        p_description: input.description, p_image_url: input.coverImage, p_max_seats: input.seatsCount || 10,
        p_category: input.category || 'عامة', p_is_private: Boolean(input.isPrivate),
        p_is_vip: Boolean(input.isVIP), p_tags: input.tags || []});
      if (error) throw error;
      const next = await refreshRooms(); const room = next.find(r => r.id === data) || null;
      setActiveRoom(room); setActiveSubScreenState(null); return room;
    } catch (e) { fail(e); return null; }
  };

  const mySeat = activeRoom?.seats.find(s => s.user?.authId === authId);
  const [pendingMute,setPendingMute]=useState<string|null>(null);
  const micRequest=useRef(false);
  const isMyMicMuted = Boolean(activeRoom&&pendingMute===activeRoom.id)||(mySeat?.isMuted ?? true);
  const takeSeat = async (index: number) => { await runRoomRpc('set_my_room_seat', {p_seat_number: index + 1}); };
  const leaveSeat = async (_index: number) => { await runRoomRpc('set_my_room_seat', {p_seat_number: null}); };
  const toggleMyMic = async () => {
    const room=activeRef.current;const account=authRef.current;
    if(!room||!account||micRequest.current)return;
    const seat=room.seats.find(item=>item.user?.authId===account);if(!seat)return;
    const next=!seat.isMuted;micRequest.current=true;
    // Local capture stops immediately on mute. Unmute waits for server acceptance.
    if(next)setPendingMute(room.id);
    try {
      const {error}=await supabase.rpc('set_my_room_muted',{p_room_id:room.id,p_muted:next});
      if(error)throw error;
      if(activeRef.current?.id!==room.id||authRef.current!==account)return;
      setActiveRoom(current=>current?.id===room.id?{...current,seats:current.seats.map(item=>item.user?.authId===account?{...item,isMuted:next}:item)}:current);
      void refreshRooms().catch(fail);
    } catch(error){fail(error)}
    finally{setPendingMute(null);micRequest.current=false;}
  };
  const [isHandRaised, setIsHandRaised] = useState(false);
  const toggleRaiseHand = async () => {
    const next = !isHandRaised;
    const room = activeRef.current; if (!room) return;
    try {
      const {error} = await supabase.from('room_members').update({is_hand_raised: next}).eq('room_id', room.id).eq('user_id', authRef.current);
      if (error) throw error; setIsHandRaised(next);
    } catch (e) { fail(e); }
  };
  const lockSeat = (index: number) => runRoomRpc('set_room_seat_locked', {p_seat_number: index + 1, p_locked: !activeRef.current?.seats[index]?.isLocked});
  const unlockSeat = (index: number) => runRoomRpc('set_room_seat_locked', {p_seat_number: index + 1, p_locked: false});
  const muteSeatUser = (index: number) => runRoomRpc('moderate_room_seat', {p_seat_number: index + 1, p_action: activeRef.current?.seats[index]?.isMuted ? 'unmute' : 'mute'});
  const kickSeatUser = (index: number) => runRoomRpc('moderate_room_seat', {p_seat_number: index + 1, p_action: 'remove'});

  const sendGiftInRoom = async (gift: Gift, recipient: User, seat?: number, requestId?: string, useInventory=false, quantity=1): Promise<boolean> => {
    const room = activeRef.current; if (!room) return false;
    if (![1,7,17,77,777].includes(quantity)) { setError('كمية الهدية غير صالحة.'); return false; }
    try {
      const {error} = await supabase.rpc(useInventory?'send_inventory_room_gift':'send_room_gift_batch', {p_room_id: room.id, p_recipient_public_id:Number(recipient.id),...(!useInventory?{p_quantity:quantity}:{}), p_gift_id: gift.id, p_request_id: requestId || crypto.randomUUID()});
      if (error) throw error;
      window.dispatchEvent(new window.CustomEvent('toti:gift-confirmed',{detail:{roomId:room.id}}));
      if (overlayTimer.current) clearTimeout(overlayTimer.current);
      setActiveGiftOverlay({id: crypto.randomUUID(), gift:{...gift,price:gift.price*quantity}, sender: userRef.current, recipient, targetSeatIndex: seat, quantity});
      overlayTimer.current = setTimeout(() => setActiveGiftOverlay(null), 3800);
      // A confirmed send remains successful even if a follow-up read fails.
      // Playback begins on server confirmation without waiting for room refresh.
      const reads = await Promise.allSettled([refreshProfile(), refreshTransactions()]);
      for (const read of reads) if (read.status === 'rejected') fail(read.reason);
      return true;
    } catch (e) { fail(e); return false; }
  };
  const sendSavedGiftInRoom = async (gift: Gift, recipient: User, seat?: number, requestId?: string): Promise<boolean> => {
    const room = activeRef.current; if (!room) return false;
    try {
      const {error} = await supabase.rpc('send_inventory_room_gift', {
        p_room_id: room.id,
        p_recipient_public_id: Number(recipient.id),
        p_gift_id: gift.id,
        p_request_id: requestId || crypto.randomUUID()
      });
      if (error) throw error;
      window.dispatchEvent(new window.CustomEvent('toti:gift-confirmed',{detail:{roomId:room.id}}));
      if (overlayTimer.current) clearTimeout(overlayTimer.current);
      setActiveGiftOverlay({id: crypto.randomUUID(), gift, sender: userRef.current, recipient, targetSeatIndex: seat, quantity: 1});
      overlayTimer.current = setTimeout(() => setActiveGiftOverlay(null), 3800);
      // Saved gifts use the same lightweight wallet refresh; room state arrives from the gift feed.
      void Promise.all([refreshProfile(), refreshTransactions()]).catch(fail);
      return true;
    } catch (e) { fail(e); return false; }
  };

  const sendMessageToConversation = async (recipient: string, content: string, type: 'text' | 'voice' | 'gift' = 'text') => {
    if (!/^\d+$/.test(recipient) || type !== 'text' || !content.trim() || content.trim().length > 1000) {
      setError('اختر حساباً فعلياً وأرسل رسالة نصية لا تتجاوز 1000 حرف.'); return false;
    }
    try {
      const {error} = await supabase.from('direct_messages').insert({recipient_public_id: Number(recipient), content: content.trim(), message_type: 'text'});
      if (error) throw error; await refreshMessages(); return true;
    } catch (e) { fail(e); return false; }
  };
  const markConversationAsRead = async (recipient: string) => {
    if (!/^\d+$/.test(recipient) || !authRef.current) return;
    try {
      const {error} = await supabase.from('direct_messages').update({read_at: new Date().toISOString()})
        .eq('recipient_id', authRef.current).eq('sender_public_id', Number(recipient)).is('read_at', null);
      if (error) throw error; await refreshMessages();
    } catch (e) { fail(e); }
  };
  const loginWithGoogle = async () => { await signInWithGoogle(); };

  const loginWithPhone = async (phone?: string, otp?: string) => {
    if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error('أدخل رقم هاتف صحيحاً مع رمز الدولة.');
    const result = otp ? await supabase.auth.verifyOtp({phone, token: otp, type: 'sms'}) : await supabase.auth.signInWithOtp({phone});
    if (result.error) throw result.error;
  };
  const logout = async () => {
    try {
      if (activeRef.current) { const {error} = await supabase.rpc('leave_room', {p_room_id: activeRef.current.id}); if (error) throw error; }
      const {error} = await supabase.auth.signOut(); if (error) throw error;
      setActiveRoom(null); setActiveSubScreenState(null);
    } catch (e) { fail(e); }
  };

  return <AppContext.Provider value={{
    user, rooms, ownedClosedRooms, activeRoom, activeTab, activeSubScreen, selectedChatUser, activeGiftOverlay,
    transactions, conversations, notifications, isMyMicMuted, isHandRaised, isSpeakerOn, noiseSuppression,
    toggleNoiseSuppression: () => {setNoiseSuppression(!noiseSuppression); saveAudioPreference(isSpeakerOn, !noiseSuppression);},
    unreadMessagesCount: conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    unreadNotificationsCount: notifications.filter(n => !n.isRead).length, unreadSystemMessagesCount,
    hasUnseenVisitors, hasUnseenFollowers,
    markSystemMessagesAsRead: () => { void markSystemMessagesAsRead(); },
    markVisitorsAsSeen: () => setHasUnseenVisitors(false), markFollowersAsSeen: () => setHasUnseenFollowers(false),
    setUser, setActiveTab, setActiveSubScreen, setSelectedChatUser, joinRoom, leaveRoom, reopenRoom,
    toggleMyMic, toggleRaiseHand, toggleSpeaker: () => {setIsSpeakerOn(!isSpeakerOn); saveAudioPreference(!isSpeakerOn, noiseSuppression);}, takeSeat, leaveSeat,
    sendGiftInRoom, sendSavedGiftInRoom, rechargeGold: () => setActiveSubScreenState('recharge'), createNewRoom,
    lockSeat, unlockSeat, muteSeatUser, kickSeatUser, sendMessageToConversation,
    markNotificationAsRead: id => { void markNotificationAsRead(id); },
    isAuthenticated: Boolean(authId), authLoading: authLoading || Boolean(authId && !profileReady),
    needsProfile: profileReady && !user.countryCode, error, dismissError: () => setError(null), reportError: setError,
    loginWithGoogle, loginWithPhone, logout, refreshRooms, refreshProfile, refreshWallet, updateProfile, markConversationAsRead,
  }}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

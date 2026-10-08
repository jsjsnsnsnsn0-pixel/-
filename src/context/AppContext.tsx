import React,{createContext,useContext,useState,type ReactNode} from 'react';
import type {User,Room,Gift,Conversation,Transaction,NotificationItemData,ActiveGiftAnimation} from '../types';
import {currentUser,sampleUsers,sampleRooms,sampleGifts,sampleConversations,sampleNotifications,sampleTransactions} from '../data/mockData';
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


const demoUser:User={...currentUser,authId:'preview-user',name:'توتي شات - معاينة',username:'totichat_preview',gold:250000,diamonds:50000,vipLevel:5,followersCount:240,followingCount:33,friendsCount:120,isOnline:true};
const roomImages=['/assets/images/room_cover_majlis_1790226059300.jpg','/assets/images/room_cover_poetry_1790226070047.jpg','/assets/images/couple_room_cover_1790345237940.jpg','/assets/images/room_ibn_syria_cover_1790345507318.jpg'];
const labels=['سهرة الأصدقاء 🎙️','ديوان الشعر العراقي','ملتقى المحبة 💗','أصوات الخليج 👑'];
export const previewRooms:Room[]=[
 ...sampleRooms.map((r):Room=>({...r,owner:{...sampleUsers[3],authId:'preview-owner'},seats:Array.from({length:8},(_,i)=>({seatIndex:i,isLocked:i===7,isMuted:i===1,isSpeaking:i===0,user:i===0?sampleUsers[3]:i===1?sampleUsers[1]:i===2?sampleUsers[2]:undefined})),usersCount:36})),
 ...labels.map((name,i):Room=>({
 id:String(2000+i),title:name,description:'غرفة صوتية تجريبية لمراجعة ترتيب المقاعد والمظهر والتفاعل',
 coverImage:roomImages[i],category:'عامة',owner:sampleUsers[(i+1)%sampleUsers.length],
 usersCount:18+i*27,seatsCount:8,isVIP:i===3,isPrivate:false,status:'live',
 tags:['TotiChat','UI Preview'],countryFlag:i%2?'🇸🇦':'🇮🇶',
 seats:Array.from({length:8},(_,n)=>({seatIndex:n,isLocked:n===7,isMuted:n===2,isSpeaking:n===0,user:n<3?sampleUsers[(i+n+1)%sampleUsers.length]:undefined}))
 }))
];
const AppContext=createContext<AppContextType|null>(null);
export const AppProvider:React.FC<{children:ReactNode}>=({children})=>{
 const [user,setUser]=useState<User>(demoUser);
 const [rooms,setRooms]=useState<Room[]>(previewRooms);
 const [activeRoom,setActiveRoom]=useState<Room|null>(null);
 const [activeTab,setActiveTabState]=useState<AppContextType['activeTab']>('home');
 const [activeSubScreen,setActiveSubScreenState]=useState<string|null>(null);
 const [selectedChatUser,setSelectedChatUser]=useState<User|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [isMyMicMuted,setIsMyMicMuted]=useState(true);
 const [isHandRaised,setIsHandRaised]=useState(false);
 const [isSpeakerOn,setIsSpeakerOn]=useState(true);
 const [noiseSuppression,setNoiseSuppression]=useState(true);
 const [activeGiftOverlay,setActiveGiftOverlay]=useState<ActiveGiftAnimation|null>(null);
 const [transactions,setTransactions]=useState<Transaction[]>(sampleTransactions);
 const [conversations,setConversations]=useState<Conversation[]>(sampleConversations);
 const [notifications,setNotifications]=useState<NotificationItemData[]>(sampleNotifications);
 const setActiveTab=(tab:AppContextType['activeTab'])=>{setActiveTabState(tab);setActiveSubScreenState(null);};
 const setActiveSubScreen=(screen:string|null)=>setActiveSubScreenState(screen);
 const joinRoom=async(room:Room)=>{
    if(activeRoom && activeRoom.id!==room.id && !window.confirm('لديك غرفة مفتوحة في المعاينة. هل تريد الانتقال إلى غرفة أخرى وإغلاق السابقة؟'))return;
    setActiveRoom(room);setActiveSubScreenState(null);
  };
 const leaveRoom=async()=>{setActiveRoom(null);setActiveSubScreenState(null);};
 const updateSeat=(index:number,changes:any)=>setActiveRoom(r=>r?({...r,seats:r.seats.map(s=>s.seatIndex===index?{...s,...changes}:s)}):r);
 const takeSeat=async(index:number)=>{updateSeat(index,{user,isMuted:true,isSpeaking:false});};
 const leaveSeat=async(index:number)=>{updateSeat(index,{user:undefined,isMuted:false,isSpeaking:false});};
 const sendGiftInRoom=async(gift:Gift,recipient:User)=>{setActiveGiftOverlay({id:'visual-'+Date.now(),gift,sender:user,recipient});setTimeout(()=>setActiveGiftOverlay(null),1100);return true;};
 const createNewRoom=async(partial:Partial<Room>)=>{const r={...previewRooms[0],...partial,id:'preview-room-'+Date.now(),owner:user} as Room;setRooms(prev=>[r,...prev]);setActiveRoom(r);setActiveSubScreenState(null);return r;};
 const context={
 user,setUser,rooms,ownedClosedRooms:[],activeRoom,activeTab,activeSubScreen,selectedChatUser,activeGiftOverlay,transactions,conversations,notifications,
 isMyMicMuted,isHandRaised,isSpeakerOn,noiseSuppression,toggleNoiseSuppression:()=>setNoiseSuppression(v=>!v),
 unreadMessagesCount:2,unreadNotificationsCount:1,unreadSystemMessagesCount:0,hasUnseenVisitors:false,hasUnseenFollowers:false,
 markSystemMessagesAsRead:()=>{},markVisitorsAsSeen:()=>{},markFollowersAsSeen:()=>{},
 setActiveTab,setActiveSubScreen,setSelectedChatUser,reopenRoom:async(room:Room)=>{await joinRoom(room);return true;},joinRoom,leaveRoom,
 toggleMyMic:async()=>setIsMyMicMuted(v=>!v),toggleRaiseHand:async()=>setIsHandRaised(v=>!v),toggleSpeaker:()=>setIsSpeakerOn(v=>!v),
 takeSeat,leaveSeat,sendGiftInRoom,sendSavedGiftInRoom:sendGiftInRoom,
 rechargeGold:(amount:number)=>setUser(u=>({...u,gold:u.gold+amount})),createNewRoom,
 lockSeat:async(index:number)=>{updateSeat(index,{isLocked:true});return true;},
 unlockSeat:async(index:number)=>{updateSeat(index,{isLocked:false});return true;},
 muteSeatUser:async(index:number)=>{updateSeat(index,{isMuted:true});return true;},
 kickSeatUser:async(index:number)=>{updateSeat(index,{user:undefined});return true;},
 sendMessageToConversation:async()=>true,
 markNotificationAsRead:()=>{},isAuthenticated:true,authLoading:false,needsProfile:false,
 error,dismissError:()=>setError(null),reportError:(message:string)=>setError(message),
 loginWithGoogle:async()=>{},loginWithPhone:async()=>{},logout:async()=>{},
 refreshRooms:async()=>rooms,refreshProfile:async()=>{},refreshWallet:async()=>{},updateProfile:async(updates:Partial<User>)=>{setUser(u=>({...u,...updates}));return true;},
 markConversationAsRead:async()=>{},
 } as unknown as AppContextType;
 return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
};
export function useApp():AppContextType{const ctx=useContext(AppContext);if(!ctx)throw new Error('UI Preview: missing AppProvider');return ctx;}

export interface User {
  authId?: string;
  id: string;
  username: string;
  name: string;
  avatar: string;
  level: number;
  vipLevel: number;
  gender?: 'male' | 'female';
  bio?: string;
  birthday?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  countryFlag?: string;
  avatarFrame?: string;
  isOnline: boolean;
  gold: number;
  diamonds: number;
  silverCoins?: number;
  friendsCount: number;
  followersCount: number;
  followingCount: number;
  visitorsCount?: number;
  charmLevel?: number;
  wealthLevel?: number;
  receivedGiftsCount: number;
  sentGiftsCount?: string;
  receivedTotal?: string;
  isHost?: boolean;
  agencyName?: string;
  agencyOwner?: string;
  agencyId?: string;
  agencyMembersCount?: number;
  agencyAvatar?: string;
  coupleAvatar?: string;
  coupleName?: string;
  customTitle?: string;
  nobleRank?: string;
  rankingTitle?: string;
  nameShimmerStyle?: 'quad_luxury' | 'gold_shine' | 'ruby_red' | 'obsidian_black' | 'silver_platinum' | 'rainbow_sparkle';
}

export interface MicrophoneSeatState {
  seatIndex: number;
  isLocked: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  user?: User;
}

export interface Room {
  ownerAuthId?: string;
  canModerate?: boolean;
  members?: User[];
  id: string;
  title: string;
  description: string;
  coverImage: string;
  category: 'طرب وموسيقى' | 'سوالف وألعاب' | 'مسابقات وفعاليات' | 'شعر وأدب' | 'عامة';
  owner: User;
  usersCount: number;
  seatsCount: number;
  isVIP: boolean;
  isPrivate: boolean;
  status: 'active' | 'live' | 'ended';
  seats: MicrophoneSeatState[];
  tags: string[];
  badgeRank?: number;
  countryFlag?: string;
  agencyName?: string;
  isDragonEmperorTheme?: boolean;
  activeListenersAvatars?: string[];
}

export interface Gift {
  id: string;
  name: string;
  category: 'all' | 'roses' | 'hearts' | 'crowns' | 'cars' | 'animals' | 'games' | 'special';
  price: number;
  icon: string;
  animationType: 'pulse' | 'rocket' | 'lion' | 'car' | 'crown' | 'sparkle';
  badge?: string;
}

export interface Transaction {
  id: string;
  type: 'recharge' | 'gift_sent' | 'gift_received' | 'vip_upgrade' | 'diamonds_exchange';
  title: string;
  amount: number;
  currency: 'gold' | 'diamonds';
  date: string;
  time: string;
  status: 'completed' | 'pending' | 'failed';
  iconType: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isMe: boolean;
  type: 'text' | 'gift' | 'voice' | 'system';
  giftName?: string;
  voiceDuration?: string;
}

export interface Conversation {
  id: string;
  user: User;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: Message[];
}

export interface NotificationItemData {
  id: string;
  type: 'gift' | 'follower' | 'friend_request' | 'room_invite' | 'system';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  avatar?: string;
  actionText?: string;
  roomId?: string;
}

export interface ActiveGiftAnimation {
  id: string;
  gift: Gift;
  sender: User;
  recipient: User;
  targetSeatIndex?: number;
}

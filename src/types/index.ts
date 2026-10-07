export interface User {
  authId?: string;
  id: string;
  username: string;
  name: string;
  avatar: string;
  level: number;
  hasPublicLevel?: boolean;
  vipLevel: number;
  vipExpiresAt?: string | null;
  gender?: 'male' | 'female';
  bio?: string;
  birthday?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  countryFlag?: string;
  avatarFrame?: string;
  equipment?: Partial<Record<'frames' | 'cars' | 'bubbles' | 'badges', {id: string; name: string; icon: string}>>;
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
  roomRole?: 'owner'|'moderator'|'member';
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
  isActive?: boolean;
  welcomeMessage?: string;
  chatEnabled?: boolean;
  giftEffectsEnabled?: boolean;
  vehicleEffectsEnabled?: boolean;
  entranceEffectsEnabled?: boolean;
  ownerAuthId?: string;
  canModerate?: boolean;
  members?: User[];
  id: string;
  title: string;
  description: string;
  coverImage: string;
  internalBackground?: string;
  isFollowed?: boolean;
  lastVisitedAt?: string;
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
  diamondSourceType?: 'FIXED_GIFT' | 'LUCKY_GIFT';
  categoryId?: string;
  description?: string;
  previewUrl?: string | null;
  relationshipTypeId?: string | null;
  rarity?: string | null;
  badge?: string;
}

export interface Transaction {
  id: string;
  type: 'recharge' | 'gift_sent' | 'gift_received' | 'vip_upgrade' | 'diamonds_exchange' | 'fixed_gift_diamonds_received' | 'lucky_gift_diamonds_received' | 'fixed_diamonds_redeemed' | 'lucky_diamonds_redeemed' | 'coins_from_diamond_redemption';
  title: string;
  amount: number;
  currency: 'gold' | 'diamonds' | 'silver';
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
  quantity?: number;
  targetSeatIndex?: number;
}

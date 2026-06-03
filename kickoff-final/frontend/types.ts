
export enum UserRole {
  PLAYER = 'لاعب',
  OWNER  = 'مالك ملعب',
  ADMIN  = 'مسؤول',
}

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  playerId?: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  age?: number;
}

export interface Field {
  id: string;
  name: string;
  location: string;
  pricePerHour: number;
  rating: number;
  type: '5v5' | '6v6' | '7v7';
  turfType: 'عشب صناعي' | 'عشب طبيعي' | 'هجين';
  images: string[];
  amenities: string[];
  description: string;
  ownerId?: string; // Link to the user who created it
}

export interface Booking {
  id: string;
  fieldId: string;
  fieldName: string;
  date: string;
  timeSlot: string;
  status: 'مؤكد' | 'قيد الانتظار' | 'ملغي' | 'منتهي';
  paymentMethod?: 'visa' | 'cash';
  price: number;
  userId?: string;
  createdAt?: string;
}

export interface League {
  id: string;
  name: string;
  sport: string;
  type: 'دوري' | 'كاس' | 'دوري وكاس';
  status: 'قادمة' | 'جارية' | 'منتهية';
  teamsCount: number;
  maxTeams: number;
  cupRounds?: 8 | 16;
  startDate: string;
  prizePool: string;
  registeredTeams: string[];
  matchesGenerated: boolean;
}

export interface Team {
  id: string;
  name: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  logo: string;
  players?: string[];
  isUserTeam?: boolean;
  userId?: string;
  description?: string;
  rules?: string;
  viceCaptain?: string;
}

export interface JoinRequest {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  requestedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface Match {
  id: string;
  leagueId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  status: 'مجدولة' | 'مباشر' | 'انتهت';
  round?: string; // 'group' | 'r16' | 'qf' | 'sf' | 'final'
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'booking' | 'system' | 'league';
  userId?: string; // To target specific users
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface TeamChatMessage {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: string;
}

export interface FriendlyChallenge {
  id: string;
  fromTeamId: string;
  fromTeamName: string;
  fromTeamLogo: string;
  toTeamId: string;
  toTeamName: string;
  toTeamLogo: string;
  proposedDate: string;
  proposedTime: string;
  proposedFieldId?: string;
  proposedFieldName?: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
}

export interface ChallengeChat {
  id: string;
  challengeId: string;
  teamId: string;
  teamName: string;
  senderName: string;
  text: string;
  timestamp: string;
}

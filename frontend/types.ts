
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
  whatsapp?: string;
  role: UserRole;
  avatar: string;
}

export interface Field {
  id: string;
  name: string;
  slug?: string;
  city?: string;
  region?: string;
  location: string;
  address?: string;
  pricePerHour: number;
  rating: number;
  reviewsCount?: number;
  type: '4v4' | '5v5' | '6v6' | '7v7';
  turfType: 'عشب صناعي' | 'عشب طبيعي' | 'هجين';
  surfaceType?: 'Artificial Grass' | 'Natural Grass' | 'Hybrid';
  images: string[];
  amenities: string[];
  description: string;
  featured?: boolean;
  phone?: string;
  whatsapp?: string;
  coordinates?: { lat: number; lng: number };
  availableHours?: { start: string; end: string };
  mapUrl?: string;
  ownerId?: string;
}

export interface Booking {
  id: string;
  fieldId: string;
  fieldName: string;
  date: string;
  timeSlot: string;
  status: 'مؤكد' | 'قيد الانتظار' | 'ملغي';
  price: number;
  userId?: string;
  userName?: string;
  userEmail?: string;
  createdAt?: string;
  paymentMethod?: 'كاش' | 'فيزا' | 'غير محدد';
}

export interface RegisteredTeamDetail {
  id: string;
  name: string;
  logo: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
}

export interface League {
  id: string;
  name: string;
  sport: string;
  status: 'التسجيل متاح' | 'جارية' | 'مكتملة';
  teamsCount: number;
  maxTeams: number;
  startDate: string;
  endDate?: string;
  prizePool: string;
  createdBy?: string;
  registeredTeams: string[];
  registeredTeamsDetail?: RegisteredTeamDetail[];
  matchesGenerated: boolean;
  format?: string;
  fieldType?: string;
  regDeadline?: string;
  entryFee?: string;
  prize1?: string;
  prize2?: string;
  prize3?: string;
  prizeDesc?: string;
  preferredDays?: string[];
  preferredTime?: string;
  notes?: string;
  organizerName?: string;
  organizerPhone?: string;
  organizerEmail?: string;
}

export interface MemberDetail {
  id: string;
  name: string;
  avatar: string;
}

export interface JoinRequest {
  userId: string;
  name: string;
  avatar: string;
  requestedAt: string;
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
  createdBy?: string;
  city?: string;
  formation?: string;
  primaryColor?: string;
  description?: string;
  fieldType?: string;
  captain?: string;
  ageGroup?: string;
  members?: string[];
  membersCount?: number;
  membersDetail?: MemberDetail[];
  joinRequests?: JoinRequest[];
  myRequestPending?: boolean;
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
  round?: string;
}

export interface TeamStanding {
  id: string;
  name: string;
  logo: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
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

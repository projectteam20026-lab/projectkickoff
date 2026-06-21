/**
 * KickOff Jordan — Axios API Service
 * All HTTP calls to the Express backend go through this file.
 */

import axios from 'axios';
import { Booking, Field, League, Team, Notification, Match, User } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://projectkickoff.onrender.com/api';

// ─── Axios instance ────────────────────────────────────────────────────────

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ──────────────────────────────────────────────────────────────────

export async function loginAPI(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    return { success: true, user: normalizeUser(data.user), token: data.token };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export async function registerAPI(userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
  try {
    const { data } = await api.post('/auth/register', userData);
    return { success: true, user: normalizeUser(data.user), token: data.token };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export async function getMeAPI(): Promise<User | null> {
  try {
    const { data } = await api.get('/auth/me');
    return normalizeUser(data.user);
  } catch {
    return null;
  }
}

export async function updateMeAPI(updates: Partial<User>): Promise<User | null> {
  try {
    const { data } = await api.put('/auth/me', updates);
    return normalizeUser(data.user);
  } catch {
    return null;
  }
}

/** نسخة تُرجع الخطأ بدل null */
export async function updateMeResultAPI(
  updates: Partial<User>
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const { data } = await api.put('/auth/me', updates);
    return { success: true, user: normalizeUser(data.user) };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || 'حدث خطأ غير متوقع' };
  }
}

/** جلب كل المباريات بدون تصفية */
export async function getAllMatchesAPI(): Promise<Match[]> {
  try {
    const { data } = await api.get('/matches');
    return (data.data || []).map(normalizeMatch);
  } catch {
    return [];
  }
}

// ─── Fields ───────────────────────────────────────────────────────────────

export async function getFieldByIdAPI(id: string): Promise<Field | null> {
  try {
    const { data } = await api.get(`/fields/${id}`);
    return normalizeField(data.data);
  } catch {
    return null;
  }
}

export async function getFieldsAPI(params?: Record<string, string>): Promise<Field[]> {
  try {
    const { data } = await api.get('/fields', { params });
    return (data.data || []).map(normalizeField);
  } catch {
    return [];
  }
}

export async function getFieldsByCityAPI(city: string, params?: Record<string, string>): Promise<Field[]> {
  try {
    const { data } = await api.get(`/fields/city/${encodeURIComponent(city)}`, { params });
    return (data.data || []).map(normalizeField);
  } catch {
    return [];
  }
}

export async function saveFieldAPI(field: Partial<Field>): Promise<Field | null> {
  try {
    const isUpdate = field.id && String(field.id).length === 24;
    const { data } = isUpdate
      ? await api.put(`/fields/${field.id}`, field)
      : await api.post('/fields', field);
    return normalizeField(data.data);
  } catch {
    return null;
  }
}

export async function deleteFieldAPI(id: string): Promise<boolean> {
  try {
    await api.delete(`/fields/${id}`);
    return true;
  } catch {
    return false;
  }
}

// ─── Bookings ─────────────────────────────────────────────────────────────

export async function getBookingsAPI(): Promise<Booking[]> {
  try {
    const { data } = await api.get('/bookings');
    return data.data.map(normalizeBooking);
  } catch {
    return [];
  }
}

export async function createBookingAPI(booking: {
  fieldId: string;
  date: string;
  timeSlot: string;
  paymentMethod?: string;
  paymentStatus?: string;
}): Promise<{ success: boolean; data?: Booking; error?: string }> {
  try {
    const { data } = await api.post('/bookings', booking);
    return { success: true, data: normalizeBooking(data.data) };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export async function cancelBookingAPI(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await api.put(`/bookings/${id}/cancel`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export async function confirmBookingAPI(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await api.put(`/bookings/${id}`, { status: 'مؤكد' });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export async function getMyFieldsAPI(): Promise<Field[]> {
  try {
    const res = await api.get('/fields/mine');
    return (res.data.data || []).map(normalizeField) as Field[];
  } catch {
    return [];
  }
}

export async function createPaymentIntentAPI(bookingId: string, amount: number): Promise<{ clientSecret: string }> {
  const res = await api.post('/payments/create-intent', { bookingId, amount });
  return res.data;
}

export async function confirmPaymentAPI(bookingId: string, paymentIntentId: string): Promise<{ success: boolean }> {
  const res = await api.post('/payments/confirm', { bookingId, paymentIntentId });
  return res.data;
}

export async function confirmBookingOwnerAPI(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await api.put(`/bookings/${id}/confirm`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export async function rejectBookingOwnerAPI(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await api.put(`/bookings/${id}/reject`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export interface OwnerStats {
  totalFields: number;
  totalBookings: number;
  todayBookings: number;
  monthlyRevenue: number;
  avgRating: number;
  totalReviews: number;
}

export async function getOwnerStatsAPI(): Promise<OwnerStats | null> {
  try {
    const { data } = await api.get('/owner/stats');
    return data.data;
  } catch {
    return null;
  }
}

export interface OwnerRevenuePeriod { revenue: number; count: number }
export interface OwnerRevenue {
  daily: OwnerRevenuePeriod;
  weekly: OwnerRevenuePeriod;
  monthly: OwnerRevenuePeriod;
  total: OwnerRevenuePeriod;
  recentBookings: { date: string; revenue: number; fieldName: string }[];
}

export async function getOwnerRevenueAPI(): Promise<OwnerRevenue | null> {
  try {
    const { data } = await api.get('/owner/revenue');
    return data.data;
  } catch {
    return null;
  }
}

export interface OwnerReview {
  id: string;
  fieldId: string;
  fieldName: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export async function getOwnerReviewsAPI(): Promise<{ data: OwnerReview[]; avgRating: number }> {
  try {
    const { data } = await api.get('/owner/reviews');
    return { data: data.data, avgRating: data.avgRating };
  } catch {
    return { data: [], avgRating: 0 };
  }
}

export async function getAvailableSlotsAPI(
  fieldId: string,
  date: string
): Promise<{ available: string[]; booked: string[] }> {
  try {
    const { data } = await api.get('/bookings/slots', { params: { fieldId, date } });
    return data.data;
  } catch {
    return { available: [], booked: [] };
  }
}

// ─── Teams ────────────────────────────────────────────────────────────────

export async function getTeamsAPI(all = false): Promise<Team[]> {
  try {
    const { data } = await api.get('/teams', { params: all ? { all: 'true' } : {} });
    return data.data.map(normalizeTeam);
  } catch {
    return [];
  }
}

export async function getMyTeamsAPI(): Promise<Team[]> {
  try {
    const { data } = await api.get('/teams/mine');
    return data.data.map(normalizeTeam);
  } catch {
    return [];
  }
}

export async function getTeamDetailAPI(id: string): Promise<Team | null> {
  try {
    const { data } = await api.get(`/teams/${id}`);
    const t = data.data;
    return {
      ...normalizeTeam(t),
      membersDetail: (t.membersDetail || []).map((m: any) => ({
        id:     String(m.id || m.userId || ''),
        name:   m.name   || '',
        avatar: m.avatar || '',
      })),
      joinRequests: (t.joinRequests || []).map((r: any) => ({
        userId:      r.userId      || '',
        name:        r.name        || '',
        avatar:      r.avatar      || '',
        requestedAt: r.requestedAt || '',
      })),
      myRequestPending: t.myRequestPending || false,
    };
  } catch {
    return null;
  }
}

export async function acceptMemberAPI(teamId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await api.post(`/teams/${teamId}/requests/${userId}/accept`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export async function rejectMemberAPI(teamId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await api.post(`/teams/${teamId}/requests/${userId}/reject`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export async function saveTeamAPI(
  team: Partial<Team>
): Promise<{ success: boolean; team?: Team; error?: string }> {
  try {
    const isUpdate = team.id && String(team.id).length === 24;
    const { data } = isUpdate
      ? await api.put(`/teams/${team.id}`, team)
      : await api.post('/teams', team);
    return { success: true, team: normalizeTeam(data.team) };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export async function deleteTeamAPI(id: string): Promise<boolean> {
  try {
    await api.delete(`/teams/${id}`);
    return true;
  } catch {
    return false;
  }
}

// ─── Tournaments ──────────────────────────────────────────────────────────

export async function getTournamentsAPI(): Promise<League[]> {
  try {
    const { data } = await api.get('/tournaments');
    return data.data.map(normalizeTournament);
  } catch {
    return [];
  }
}

export async function getMyTournamentsAPI(): Promise<League[]> {
  try {
    const { data } = await api.get('/tournaments/mine');
    return data.data.map(normalizeTournament);
  } catch {
    return [];
  }
}

export async function deleteTournamentAPI(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await api.delete(`/tournaments/${id}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export async function joinTeamAPI(teamId: string): Promise<{ success: boolean; team?: Team; error?: string }> {
  try {
    const { data } = await api.post(`/teams/${teamId}/join`);
    return { success: true, team: normalizeTeam(data.team) };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export async function leaveTeamAPI(teamId: string): Promise<{ success: boolean; team?: Team; error?: string }> {
  try {
    const { data } = await api.post(`/teams/${teamId}/leave`);
    return { success: true, team: normalizeTeam(data.team) };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export interface TeamMessage {
  _id: string;
  teamId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export async function getTeamMessagesAPI(teamId: string): Promise<TeamMessage[]> {
  try {
    const { data } = await api.get(`/teams/${teamId}/messages`);
    return data.data || [];
  } catch { return []; }
}

export async function sendTeamMessageAPI(teamId: string, text: string): Promise<{ success: boolean; error?: string }> {
  try {
    await api.post(`/teams/${teamId}/messages`, { text });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export async function generateKnockoutMatchesAPI(tournamentId: string): Promise<{ success: boolean; count?: number; message?: string; error?: string }> {
  try {
    const { data } = await api.post(`/tournaments/${tournamentId}/generate-knockout`);
    return { success: true, count: data.count, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export async function advanceKnockoutRoundAPI(tournamentId: string): Promise<{ success: boolean; finished?: boolean; round?: string; message?: string; error?: string }> {
  try {
    const { data } = await api.post(`/tournaments/${tournamentId}/advance-round`);
    return { success: true, finished: data.finished, round: data.round, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export async function getTournamentStandingsAPI(tournamentId: string): Promise<any[]> {
  try {
    const { data } = await api.get(`/tournaments/${tournamentId}/standings`);
    return data.data || [];
  } catch { return []; }
}

export async function saveTournamentAPI(tournament: Partial<League>): Promise<League | null> {
  try {
    const isUpdate = tournament.id && String(tournament.id).length === 24;
    const { data } = isUpdate
      ? await api.put(`/tournaments/${tournament.id}`, tournament)
      : await api.post('/tournaments', tournament);
    return normalizeTournament(data.data);
  } catch {
    return null;
  }
}

export async function registerTeamForTournamentAPI(
  tournamentId: string,
  teamId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await api.post(`/tournaments/${tournamentId}/register`, { teamId });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

// ─── Tournament Registrations ─────────────────────────────────────────────

export interface RegistrationRequest {
  _id: string;
  teamName: string;
  captainName: string;
  phone: string;
  email: string;
  playerCount: number;
  note: string;
  teamId?: string | null;
  appliedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export async function applyToTournamentAPI(
  tournamentId: string,
  data: { teamName: string; captainName?: string; phone?: string; email?: string; playerCount?: number; note?: string; teamId?: string }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await api.post(`/tournaments/${tournamentId}/apply`, data);
    return { success: true, message: res.data.message };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export async function getRegistrationsAPI(tournamentId: string): Promise<RegistrationRequest[]> {
  try {
    const { data } = await api.get(`/tournaments/${tournamentId}/registrations`);
    return data.data || [];
  } catch {
    return [];
  }
}

export async function approveRegistrationAPI(
  tournamentId: string,
  regId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await api.post(`/tournaments/${tournamentId}/registrations/${regId}/approve`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export async function rejectRegistrationAPI(
  tournamentId: string,
  regId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await api.post(`/tournaments/${tournamentId}/registrations/${regId}/reject`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

// ─── Matches ──────────────────────────────────────────────────────────────

export async function getMatchesAPI(leagueId: string): Promise<Match[]> {
  try {
    const { data } = await api.get('/matches', { params: { leagueId } });
    return data.data.map(normalizeMatch);
  } catch {
    return [];
  }
}

export async function updateMatchResultAPI(
  matchId: string,
  homeScore: number,
  awayScore: number
): Promise<boolean> {
  try {
    await api.put(`/matches/${matchId}/result`, { homeScore, awayScore, status: 'انتهت' });
    return true;
  } catch {
    return false;
  }
}

// ─── Notifications ────────────────────────────────────────────────────────

export async function getNotificationsAPI(): Promise<Notification[]> {
  try {
    const { data } = await api.get('/notifications');
    return data.data.map(normalizeNotification);
  } catch {
    return [];
  }
}

export async function markNotificationsReadAPI(): Promise<Notification[]> {
  try {
    const { data } = await api.put('/notifications/read-all');
    return data.data.map(normalizeNotification);
  } catch {
    return [];
  }
}

// ─── Normalizers ─────────────────────────────────────────────────────────

function normalizeUser(u: any): User {
  return {
    id: u.id || u._id,
    name: u.name,
    firstName: u.firstName || '',
    lastName: u.lastName || '',
    username: u.username || '',
    playerId: u.playerId || '',
    email: u.email,
    phone: u.phone || '',
    role: u.role,
    avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=10b981&color=fff`,
  };
}

function normalizeField(f: any): Field {
  return {
    id:             f.id || f._id,
    name:           f.name,
    slug:           f.slug,
    city:           f.city,
    region:         f.region,
    location:       f.location,
    address:        f.address,
    pricePerHour:   f.pricePerHour,
    rating:         f.rating || 0,
    reviewsCount:   f.reviewsCount,
    type:           f.type,
    turfType:       f.turfType,
    surfaceType:    f.surfaceType,
    images:         f.images || [],
    amenities:      f.amenities || [],
    description:    f.description || '',
    featured:       f.featured,
    phone:          f.phone,
    whatsapp:       f.whatsapp,
    coordinates:    f.coordinates,
    availableHours: f.availableHours,
    mapUrl:         f.mapUrl,
    ownerId:        f.ownerId,
  };
}

function normalizeBooking(b: any): Booking {
  return {
    id:            b.id        || b._id,
    fieldId:       b.fieldId?._id || b.fieldId,
    fieldName:     b.fieldName,
    date:          b.date,
    timeSlot:      b.timeSlot,
    status:        b.status,
    price:         b.price,
    userId:        b.userId?._id  || b.userId,
    userName:      b.userName     || b.userId?.name  || '',
    userEmail:     b.userEmail    || b.userId?.email || '',
    createdAt:     b.createdAt,
    paymentMethod:          b.paymentMethod || 'كاش',
    paymentStatus:          b.paymentStatus  || 'unpaid',
    stripePaymentIntentId:  b.stripePaymentIntentId || null,
  };
}

function normalizeTeam(t: any): Team {
  return {
    id:           String(t.id || t._id || ''),
    name:         t.name,
    wins:         t.wins   || 0,
    losses:       t.losses || 0,
    draws:        t.draws  || 0,
    points:       t.points || 0,
    logo:         t.logo   || '⚽',
    players:      t.players || [],
    createdBy:    String(t.createdBy || ''),
    city:         t.city         || '',
    formation:    t.formation    || '4-3-3',
    primaryColor: t.primaryColor || '#10b981',
    description:  t.description  || '',
    fieldType:    t.fieldType    || '7v7',
    captain:      t.captain      || '',
    ageGroup:     t.ageGroup     || 'بالغون (23+)',
    members:      (t.members || []).map(String),
    membersCount: t.membersCount ?? (t.members?.length || 0),
  };
}

function normalizeTournament(t: any): League {
  const teams = t.registeredTeams || [];
  const detail = teams
    .filter((r: any) => typeof r === 'object' && r !== null && (r._id || r.id))
    .map((r: any) => ({
      id:     String(r._id || r.id || ''),
      name:   r.name   || '',
      logo:   r.logo   || '⚽',
      wins:   r.wins   || 0,
      losses: r.losses || 0,
      draws:  r.draws  || 0,
      points: r.points || 0,
    }));
  return {
    id:            t.id || t._id,
    name:          t.name,
    sport:         t.sport,
    status:        t.status,
    teamsCount:    t.teamsCount ?? teams.length,
    maxTeams:      t.maxTeams || 8,
    startDate:     t.startDate,
    endDate:       t.endDate       || '',
    prizePool:     t.prizePool     || '0 JD',
    createdBy:     t.createdBy     ? String(t.createdBy) : '',
    registeredTeams: teams.map((r: any) => typeof r === 'string' ? r : String(r._id || r.id || '')),
    registeredTeamsDetail: detail,
    matchesGenerated: t.matchesGenerated || false,
    format:        t.format        || 'league',
    fieldType:     t.fieldType     || '7v7',
    regDeadline:   t.regDeadline   || '',
    entryFee:      t.entryFee      || '0',
    prize1:        t.prize1        || '',
    prize2:        t.prize2        || '',
    prize3:        t.prize3        || '',
    prizeDesc:     t.prizeDesc     || '',
    preferredDays: t.preferredDays || [],
    preferredTime: t.preferredTime || '',
    notes:         t.notes         || '',
    organizerName:  t.organizerName  || '',
    organizerPhone: t.organizerPhone || '',
    organizerEmail: t.organizerEmail || '',
  };
}

export async function getTournamentByIdAPI(id: string): Promise<League | null> {
  try {
    const { data } = await api.get(`/tournaments/${id}`);
    return normalizeTournament(data.data);
  } catch {
    return null;
  }
}

function normalizeMatch(m: any): Match {
  return {
    id:         m.id || m._id,
    leagueId:   m.leagueId?._id || m.leagueId,
    homeTeam:   m.homeTeam,
    awayTeam:   m.awayTeam,
    homeTeamId: m.homeTeamId?._id || m.homeTeamId,
    awayTeamId: m.awayTeamId?._id || m.awayTeamId,
    homeScore:  m.homeScore,
    awayScore:  m.awayScore,
    date:       m.date,
    status:     m.status,
    round:      m.round || '',
  };
}

function normalizeNotification(n: any): Notification {
  return {
    id: n.id || n._id,
    title: n.title,
    message: n.message,
    date: n.date,
    read: n.read,
    type: n.type,
    userId: n.userId?._id || n.userId,
  };
}

// ─── Forgot / Reset Password ──────────────────────────────────────────────

export async function forgotPasswordAPI(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data } = await api.post('/auth/forgot-password', { email });
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export async function resetPasswordAPI(token: string, password: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data } = await api.post(`/auth/reset-password/${token}`, { password });
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

// ─── Admin API ────────────────────────────────────────────────────────────

export async function adminGetStats() {
  try { const { data } = await api.get('/admin/stats'); return data.data; }
  catch { return null; }
}

export async function adminGetUsers() {
  try { const { data } = await api.get('/admin/users'); return data.data; }
  catch { return []; }
}

export async function adminDeleteUser(id: string) {
  try { await api.delete(`/admin/users/${id}`); return true; }
  catch { return false; }
}

export async function adminUpdateUserRole(id: string, role: string) {
  try { const { data } = await api.put(`/admin/users/${id}/role`, { role }); return data.data; }
  catch { return null; }
}

export async function adminGetBookings() {
  try { const { data } = await api.get('/admin/bookings'); return data.data; }
  catch { return []; }
}

export async function adminUpdateBooking(id: string, status: string) {
  try { const { data } = await api.put(`/admin/bookings/${id}`, { status }); return data.data; }
  catch { return null; }
}

export async function adminDeleteBooking(id: string) {
  try { await api.delete(`/admin/bookings/${id}`); return true; }
  catch { return false; }
}

export async function adminGetFields() {
  try { const { data } = await api.get('/admin/fields'); return data.data; }
  catch { return []; }
}

export async function adminCreateField(field: any) {
  try { const { data } = await api.post('/admin/fields', field); return data.data; }
  catch (err: any) { throw new Error(err.response?.data?.error || err.message); }
}

export async function adminUpdateField(id: string, field: any) {
  try { const { data } = await api.put(`/admin/fields/${id}`, field); return data.data; }
  catch (err: any) { throw new Error(err.response?.data?.error || err.message); }
}

export async function adminDeleteField(id: string) {
  try { await api.delete(`/admin/fields/${id}`); return true; }
  catch { return false; }
}

export async function adminGetTeams() {
  try { const { data } = await api.get('/admin/teams'); return data.data; }
  catch { return []; }
}

export async function adminDeleteTeam(id: string) {
  try { await api.delete(`/admin/teams/${id}`); return true; }
  catch { return false; }
}

export async function adminGetTournaments() {
  try { const { data } = await api.get('/admin/tournaments'); return data.data; }
  catch { return []; }
}

export async function adminCreateTournament(t: any) {
  try { const { data } = await api.post('/admin/tournaments', t); return data.data; }
  catch (err: any) { throw new Error(err.response?.data?.error || err.message); }
}

export async function adminUpdateTournament(id: string, t: any) {
  try { const { data } = await api.put(`/admin/tournaments/${id}`, t); return data.data; }
  catch (err: any) { throw new Error(err.response?.data?.error || err.message); }
}

export async function adminDeleteTournament(id: string) {
  try { await api.delete(`/admin/tournaments/${id}`); return true; }
  catch { return false; }
}

export default api;

// ─── Reviews ──────────────────────────────────────────────────────────────

export interface ReviewData {
  id: string;
  fieldId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export async function getReviewsAPI(fieldId: string): Promise<ReviewData[]> {
  try {
    const { data } = await api.get('/reviews', { params: { fieldId } });
    return data.data;
  } catch {
    return [];
  }
}

export async function createReviewAPI(fieldId: string, rating: number, comment: string): Promise<{ success: boolean; data?: ReviewData; error?: string }> {
  try {
    const { data } = await api.post('/reviews', { fieldId, rating, comment });
    return { success: true, data: data.data };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

export async function deleteReviewAPI(id: string): Promise<boolean> {
  try {
    await api.delete(`/reviews/${id}`);
    return true;
  } catch {
    return false;
  }
}

export async function getMyReviewAPI(fieldId: string): Promise<ReviewData | null> {
  try {
    const { data } = await api.get('/reviews/my', { params: { fieldId } });
    return data.data;
  } catch {
    return null;
  }
}

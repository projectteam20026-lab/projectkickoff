/**
 * KickOff Jordan — BackendService
 * Delegates all API calls to api.ts (Axios-based).
 */

import { Booking, Field, League, Team, Notification, Match, User } from '../types';
import {
  loginAPI,
  registerAPI,
  getMeAPI,
  updateMeAPI,
  updateMeResultAPI,
  getAllMatchesAPI,
  getFieldsAPI,
  getFieldsByCityAPI,
  getMyFieldsAPI,
  saveFieldAPI,
  deleteFieldAPI,
  getBookingsAPI,
  createBookingAPI,
  cancelBookingAPI,
  confirmBookingAPI,
  confirmBookingOwnerAPI,
  rejectBookingOwnerAPI,
  getTeamsAPI,
  getMyTeamsAPI,
  saveTeamAPI,
  deleteTeamAPI,
  joinTeamAPI,
  leaveTeamAPI,
  getTeamDetailAPI,
  getTeamMessagesAPI,
  sendTeamMessageAPI,
  acceptMemberAPI,
  rejectMemberAPI,
  TeamMessage,
  getTournamentsAPI,
  getMyTournamentsAPI,
  saveTournamentAPI,
  deleteTournamentAPI,
  generateKnockoutMatchesAPI,
  advanceKnockoutRoundAPI,
  getTournamentStandingsAPI,
  getMatchesAPI,
  updateMatchResultAPI,
  getNotificationsAPI,
  markNotificationsReadAPI,
  getOwnerStatsAPI,
  getOwnerRevenueAPI,
  getOwnerReviewsAPI,
  type OwnerStats,
  type OwnerRevenue,
  type OwnerReview,
} from './api';

class BackendService {

  // ── Auth ────────────────────────────────────────────────────────────────

  async authenticate(
    email: string,
    password?: string
  ): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    const result = await loginAPI(email, password ?? '');
    if (result.success && result.token) {
      localStorage.setItem('auth_token', result.token);
    }
    return result;
  }

  async register(userData: {
    name: string;
    email: string;
    password?: string;
    role?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  }): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    const result = await registerAPI({
      name: userData.name,
      email: userData.email,
      password: userData.password ?? '',
      role: userData.role,
      phone: userData.phone,
      firstName: userData.firstName,
      lastName: userData.lastName,
      username: userData.username,
    });
    if (result.success && result.token) {
      localStorage.setItem('auth_token', result.token);
    }
    return result;
  }

  async getMe(): Promise<User | null> {
    return getMeAPI();
  }

  async updateMe(updates: Partial<User>): Promise<User | null> {
    return updateMeAPI(updates);
  }

  async updateMeResult(
    updates: Partial<User>
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    return updateMeResultAPI(updates);
  }

  // ── Fields ──────────────────────────────────────────────────────────────

  async getFields(params?: Record<string, string>): Promise<Field[]> {
    return getFieldsAPI(params);
  }

  async getFieldsByCity(city: string, params?: Record<string, string>): Promise<Field[]> {
    return getFieldsByCityAPI(city, params);
  }

  async saveField(field: Field): Promise<Field> {
    const result = await saveFieldAPI(field);
    return result ?? field;
  }

  async deleteField(id: string): Promise<boolean> {
    return deleteFieldAPI(id);
  }

  // ── Bookings ─────────────────────────────────────────────────────────────

  async getBookings(): Promise<Booking[]> {
    return getBookingsAPI();
  }

  async createBooking(
    booking: Partial<Booking>
  ): Promise<{ success: boolean; data?: Booking; error?: string }> {
    if (!booking.fieldId || !booking.date || !booking.timeSlot) {
      return { success: false, error: 'بيانات الحجز ناقصة' };
    }
    return createBookingAPI({
      fieldId: String(booking.fieldId),
      date: booking.date,
      timeSlot: booking.timeSlot,
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
    });
  }

  async cancelBooking(id: string): Promise<{ success: boolean; data?: Booking[] }> {
    const result = await cancelBookingAPI(id);
    if (result.success) {
      const updated = await getBookingsAPI();
      return { success: true, data: updated };
    }
    return { success: false };
  }

  async confirmBooking(id: string): Promise<{ success: boolean; error?: string }> {
    return confirmBookingAPI(id);
  }

  // ── Teams ────────────────────────────────────────────────────────────────

  async getMyFields(): Promise<Field[]>     { return getMyFieldsAPI(); }
  async getMyTeams(): Promise<Team[]>      { return getMyTeamsAPI(); }
  async getAllTeams(): Promise<Team[]>      { return getTeamsAPI(true); }

  async saveTeam(team: Team): Promise<{ success: boolean; team: Team }> {
    const result = await saveTeamAPI(team);
    if (result.success && result.team) return { success: true, team: result.team };
    return { success: false, team };
  }

  async deleteTeam(teamId: string): Promise<boolean> {
    return deleteTeamAPI(teamId);
  }

  async joinTeam(teamId: string): Promise<{ success: boolean; team?: Team; error?: string }> {
    return joinTeamAPI(teamId);
  }

  async leaveTeam(teamId: string): Promise<{ success: boolean; team?: Team; error?: string }> {
    return leaveTeamAPI(teamId);
  }

  async getTeamDetail(teamId: string): Promise<Team | null> {
    return getTeamDetailAPI(teamId);
  }

  async getTeamMessages(teamId: string): Promise<TeamMessage[]> {
    return getTeamMessagesAPI(teamId);
  }

  async sendTeamMessage(teamId: string, text: string): Promise<{ success: boolean; error?: string }> {
    return sendTeamMessageAPI(teamId, text);
  }

  async acceptMember(teamId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    return acceptMemberAPI(teamId, userId);
  }

  async rejectMember(teamId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    return rejectMemberAPI(teamId, userId);
  }

  async confirmBookingOwner(id: string): Promise<{ success: boolean; error?: string }> {
    return confirmBookingOwnerAPI(id);
  }

  async rejectBookingOwner(id: string): Promise<{ success: boolean; error?: string }> {
    return rejectBookingOwnerAPI(id);
  }

  async getOwnerStats(): Promise<OwnerStats | null> {
    return getOwnerStatsAPI();
  }

  async getOwnerRevenue(): Promise<OwnerRevenue | null> {
    return getOwnerRevenueAPI();
  }

  async getOwnerReviews(): Promise<{ data: OwnerReview[]; avgRating: number }> {
    return getOwnerReviewsAPI();
  }

  // ── Tournaments ──────────────────────────────────────────────────────────

  async getLeagues(): Promise<League[]> {
    return getTournamentsAPI();
  }

  async getMyTournaments(): Promise<League[]> {
    return getMyTournamentsAPI();
  }

  async saveLeague(league: League): Promise<League> {
    const result = await saveTournamentAPI(league);
    return result ?? league;
  }

  async deleteTournament(id: string): Promise<{ success: boolean; error?: string }> {
    return deleteTournamentAPI(id);
  }

  async generateKnockoutMatches(id: string): Promise<{ success: boolean; count?: number; message?: string; error?: string }> {
    return generateKnockoutMatchesAPI(id);
  }

  async advanceKnockoutRound(id: string): Promise<{ success: boolean; finished?: boolean; round?: string; message?: string; error?: string }> {
    return advanceKnockoutRoundAPI(id);
  }

  async getTournamentStandings(id: string): Promise<any[]> {
    return getTournamentStandingsAPI(id);
  }

  async getMatches(leagueId: string): Promise<Match[]> {
    return getMatchesAPI(leagueId);
  }

  async getAllMatches(): Promise<Match[]> {
    return getAllMatchesAPI();
  }

  async updateMatchResult(
    matchId: string,
    homeScore: number,
    awayScore: number
  ): Promise<boolean> {
    return updateMatchResultAPI(matchId, homeScore, awayScore);
  }

  // ── Notifications ────────────────────────────────────────────────────────

  async getNotifications(): Promise<Notification[]> {
    return getNotificationsAPI();
  }

  async createNotification(_note: Notification): Promise<void> {
    // Created server-side automatically
  }

  async markNotificationsRead(): Promise<Notification[]> {
    return markNotificationsReadAPI();
  }
}

export const backend = new BackendService();

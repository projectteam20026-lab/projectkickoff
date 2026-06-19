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
  saveFieldAPI,
  deleteFieldAPI,
  getBookingsAPI,
  createBookingAPI,
  cancelBookingAPI,
  confirmBookingAPI,
  getTeamsAPI,
  getMyTeamsAPI,
  saveTeamAPI,
  deleteTeamAPI,
  joinTeamAPI,
  leaveTeamAPI,
  getTournamentsAPI,
  getMyTournamentsAPI,
  saveTournamentAPI,
  deleteTournamentAPI,
  getMatchesAPI,
  updateMatchResultAPI,
  getNotificationsAPI,
  markNotificationsReadAPI,
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
    firstName?: string;
    lastName?: string;
    username?: string;
  }): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    const result = await registerAPI({
      name: userData.name,
      email: userData.email,
      password: userData.password ?? '',
      role: userData.role,
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

  async deleteField(id: string): Promise<void> {
    await deleteFieldAPI(id);
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

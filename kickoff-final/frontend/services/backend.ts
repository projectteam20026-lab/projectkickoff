/**
 * KickOff Jordan — BackendService
 * Delegates all API calls to api.ts (Axios-based).
 */

import { Booking, Field, League, Team, Notification, Match, User, TeamChatMessage, FriendlyChallenge, ChallengeChat, JoinRequest } from '../types';
import {
  loginAPI,
  registerAPI,
  getMeAPI,
  updateMeAPI,
  updateMeResultAPI,
  getAllMatchesAPI,
  getFieldsAPI,
  getFieldAPI,
  saveFieldAPI,
  deleteFieldAPI,
  getBookingsAPI,
  createBookingAPI,
  cancelBookingAPI,
  confirmBookingAPI,
  getTeamsAPI,
  saveTeamAPI,
  getTeamChatAPI,
  sendTeamChatAPI,
  requestJoinTeamAPI,
  getTournamentsAPI,
  getTournamentAPI,
  saveTournamentAPI,
  getMatchesAPI,
  registerTeamForTournamentAPI,
  updateMatchResultAPI,
  getNotificationsAPI,
  markNotificationsReadAPI,
  getTeamChallengesAPI,
  sendChallengeAPI,
  respondChallengeAPI,
  getChallengeChatAPI,
  sendChallengeChatAPI,
  getJoinRequestsAPI,
  respondJoinRequestAPI,
  kickMemberAPI,
  setViceCaptainAPI,
  leaveTeamAPI,
  deleteTeamAPI,
  getTeamHistoryAPI,
  TeamHistory,
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

  async getFields(): Promise<Field[]> {
    return getFieldsAPI();
  }

  async getField(id: string): Promise<Field | null> {
    return getFieldAPI(id);
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

  async getUserTeams(userId: string): Promise<Team[]> {
    return getTeamsAPI(userId === 'all');
  }

  async saveTeam(team: Team): Promise<{ success: boolean; team: Team }> {
    const result = await saveTeamAPI(team);
    if (result.success && result.team) return { success: true, team: result.team };
    return { success: false, team };
  }

  async getTeamChat(teamId: string): Promise<TeamChatMessage[]> {
    return getTeamChatAPI(teamId);
  }

  async sendTeamChat(teamId: string, text: string): Promise<TeamChatMessage | null> {
    return sendTeamChatAPI(teamId, text);
  }

  async requestJoinTeam(teamId: string): Promise<{ success: boolean; error?: string }> {
    return requestJoinTeamAPI(teamId);
  }

  async getTeamChallenges(teamId: string): Promise<{ incoming: FriendlyChallenge[]; sent: FriendlyChallenge[] }> {
    return getTeamChallengesAPI(teamId);
  }

  async sendChallenge(toTeamId: string, payload: {
    fromTeamId: string;
    proposedDate: string;
    proposedTime: string;
    proposedFieldId?: string;
    proposedFieldName?: string;
    message: string;
  }): Promise<{ success: boolean; data?: FriendlyChallenge; error?: string }> {
    return sendChallengeAPI(toTeamId, payload);
  }

  async respondChallenge(challengeId: string, status: 'accepted' | 'rejected'): Promise<{ success: boolean; error?: string }> {
    return respondChallengeAPI(challengeId, status);
  }

  async getChallengeChat(challengeId: string): Promise<ChallengeChat[]> {
    return getChallengeChatAPI(challengeId);
  }

  async sendChallengeChat(challengeId: string, text: string): Promise<{ success: boolean; data?: ChallengeChat; error?: string }> {
    return sendChallengeChatAPI(challengeId, text);
  }

  // ── Team Management ──────────────────────────────────────────────────────────

  async getJoinRequests(teamId: string): Promise<JoinRequest[]> {
    return getJoinRequestsAPI(teamId);
  }

  async respondJoinRequest(requestId: string, status: 'accepted' | 'rejected'): Promise<{ success: boolean; error?: string }> {
    return respondJoinRequestAPI(requestId, status);
  }

  async kickMember(teamId: string, playerName: string): Promise<{ success: boolean; error?: string }> {
    return kickMemberAPI(teamId, playerName);
  }

  async setViceCaptain(teamId: string, playerName: string, role: 'vice-captain' | 'player'): Promise<{ success: boolean; error?: string }> {
    return setViceCaptainAPI(teamId, playerName, role);
  }

  async leaveTeam(teamId: string, playerName: string): Promise<{ success: boolean; error?: string }> {
    return leaveTeamAPI(teamId, playerName);
  }

  async deleteTeam(teamId: string): Promise<{ success: boolean; error?: string }> {
    return deleteTeamAPI(teamId);
  }

  async getTeamHistory(teamId: string): Promise<TeamHistory> {
    return getTeamHistoryAPI(teamId);
  }

  // ── Tournaments ──────────────────────────────────────────────────────────

  async getLeagues(): Promise<League[]> {
    return getTournamentsAPI();
  }

  async getTournament(id: string): Promise<League | null> {
    return getTournamentAPI(id);
  }

  async saveLeague(league: League): Promise<League> {
    const result = await saveTournamentAPI(league);
    return result ?? league;
  }

  async registerForTournament(
    tournamentId: string,
    teamId: string
  ): Promise<{ success: boolean; error?: string }> {
    return registerTeamForTournamentAPI(tournamentId, teamId);
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

const express = require('express');
const router = express.Router();
const {
  getTournaments, getTournament, createTournament, updateTournament,
  deleteTournament, getMyTournaments, registerTeam, generateMatches, getStandings,
  generateKnockoutMatches, advanceKnockoutRound,
  applyTournament, getRegistrations, approveRegistration, rejectRegistration,
  createPublicTournament, getTournamentByToken, approveByToken, rejectByToken, updateStatusByToken,
} = require('../controllers/tournamentController');
const { protect } = require('../middleware/auth');

// ── Public (no-auth) tournament management routes — must be before /:id ──────
router.post('/public',                                        createPublicTournament);
router.get('/manage/:token',                                  getTournamentByToken);
router.post('/manage/:token/registrations/:regId/approve',    approveByToken);
router.post('/manage/:token/registrations/:regId/reject',     rejectByToken);
router.patch('/manage/:token/status',                         updateStatusByToken);

router.get('/mine', protect, getMyTournaments);  // must be before /:id
router.get('/', getTournaments);
router.get('/:id', getTournament);
router.get('/:id/standings', getStandings);
router.post('/', protect, createTournament);
router.put('/:id', protect, updateTournament);
router.delete('/:id', protect, deleteTournament);
router.post('/:id/register', protect, registerTeam);
router.post('/:id/generate-matches',   protect, generateMatches);
router.post('/:id/generate-knockout',  protect, generateKnockoutMatches);
router.post('/:id/advance-round',      protect, advanceKnockoutRound);

// Registration requests
router.post('/:id/apply',                               applyTournament);
router.get('/:id/registrations',        protect,        getRegistrations);
router.post('/:id/registrations/:regId/approve', protect, approveRegistration);
router.post('/:id/registrations/:regId/reject',  protect, rejectRegistration);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getTournaments, getTournament, createTournament, updateTournament,
  deleteTournament, getMyTournaments, registerTeam, generateMatches, getStandings,
  generateKnockoutMatches, advanceKnockoutRound,
} = require('../controllers/tournamentController');
const { protect } = require('../middleware/auth');

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

module.exports = router;

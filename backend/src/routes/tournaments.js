const express = require('express');
const router = express.Router();
const {
  getTournaments, getTournament, createTournament, updateTournament,
  registerTeam, generateMatches, getStandings,
} = require('../controllers/tournamentController');
const { protect } = require('../middleware/auth');

router.get('/', getTournaments);
router.get('/:id', getTournament);
router.get('/:id/standings', getStandings);
router.post('/', protect, createTournament);
router.put('/:id', protect, updateTournament);
router.post('/:id/register', protect, registerTeam);
router.post('/:id/generate-matches', protect, generateMatches);

module.exports = router;

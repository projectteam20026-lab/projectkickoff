const express = require('express');
const router  = express.Router();
const { getTeams, getMyTeams, getTeam, createTeam, updateTeam, deleteTeam } = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

router.get('/mine', protect, getMyTeams);   // must be before /:id
router.get('/',     protect, getTeams);
router.get('/:id',  protect, getTeam);
router.post('/',    protect, createTeam);
router.put('/:id',  protect, updateTeam);
router.delete('/:id', protect, deleteTeam);

module.exports = router;

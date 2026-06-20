const express    = require('express');
const router     = express.Router();
const { getTeams, getMyTeams, getTeam, createTeam, updateTeam, deleteTeam, joinTeam, leaveTeam } = require('../controllers/teamController');
const { getMessages, sendMessage } = require('../controllers/messageController');
const { protect }  = require('../middleware/auth');

router.get('/mine',               protect, getMyTeams);
router.get('/',                   protect, getTeams);
router.get('/:id',                protect, getTeam);
router.post('/',                  protect, createTeam);
router.put('/:id',                protect, updateTeam);
router.delete('/:id',             protect, deleteTeam);
router.post('/:id/join',          protect, joinTeam);
router.post('/:id/leave',         protect, leaveTeam);
router.get('/:id/messages',       protect, getMessages);
router.post('/:id/messages',      protect, sendMessage);

module.exports = router;

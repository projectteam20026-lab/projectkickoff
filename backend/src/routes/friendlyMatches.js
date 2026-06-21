const express = require('express');
const router  = express.Router();
const {
  sendChallenge,
  getMyMatches,
  acceptChallenge,
  rejectChallenge,
  cancelChallenge,
} = require('../controllers/friendlyMatchController');
const { protect } = require('../middleware/auth');

router.post('/',             protect, sendChallenge);
router.get('/',              protect, getMyMatches);
router.post('/:id/accept',   protect, acceptChallenge);
router.post('/:id/reject',   protect, rejectChallenge);
router.post('/:id/cancel',   protect, cancelChallenge);

module.exports = router;

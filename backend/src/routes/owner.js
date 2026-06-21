'use strict';

const express = require('express');
const router  = express.Router();
const {
  getOwnerStats,
  getOwnerRevenue,
  getOwnerReviews,
  getOwnerTournamentRequests,
  approveOwnerTournamentRequest,
  rejectOwnerTournamentRequest,
} = require('../controllers/ownerController');
const { protect } = require('../middleware/auth');

router.get('/stats',   protect, getOwnerStats);
router.get('/revenue', protect, getOwnerRevenue);
router.get('/reviews', protect, getOwnerReviews);

router.get('/tournament-requests',              protect, getOwnerTournamentRequests);
router.patch('/tournament-requests/:id/approve', protect, approveOwnerTournamentRequest);
router.patch('/tournament-requests/:id/reject',  protect, rejectOwnerTournamentRequest);

module.exports = router;

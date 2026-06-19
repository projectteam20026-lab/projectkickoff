'use strict';

const express = require('express');
const router  = express.Router();
const { getOwnerStats, getOwnerRevenue, getOwnerReviews } = require('../controllers/ownerController');
const { protect } = require('../middleware/auth');

router.get('/stats',   protect, getOwnerStats);
router.get('/revenue', protect, getOwnerRevenue);
router.get('/reviews', protect, getOwnerReviews);

module.exports = router;

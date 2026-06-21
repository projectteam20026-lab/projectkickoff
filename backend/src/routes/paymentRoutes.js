'use strict';

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { createIntent, confirmPayment } = require('../controllers/paymentController');

router.post('/create-intent', protect, createIntent);
router.post('/confirm',       protect, confirmPayment);

module.exports = router;

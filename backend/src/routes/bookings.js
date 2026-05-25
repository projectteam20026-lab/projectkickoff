const express = require('express');
const router = express.Router();
const { getBookings, createBooking, cancelBooking, getAvailableSlots } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.get('/slots', getAvailableSlots);          // Public: check slots
router.get('/', protect, getBookings);
router.post('/', protect, createBooking);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;

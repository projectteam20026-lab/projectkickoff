const express = require('express');
const router = express.Router();
const { getBookings, createBooking, cancelBooking, confirmBooking, rejectBooking, getAvailableSlots } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.get('/slots',         getAvailableSlots);
router.get('/',              protect, getBookings);
router.post('/',             protect, createBooking);
router.put('/:id/confirm',   protect, confirmBooking);
router.put('/:id/reject',    protect, rejectBooking);
router.put('/:id/cancel',    protect, cancelBooking);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getNotifications, createNotification, markAllRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.post('/', protect, createNotification);
router.put('/read-all', protect, markAllRead);

module.exports = router;

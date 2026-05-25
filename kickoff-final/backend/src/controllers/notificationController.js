const Notification = require('../models/Notification');

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [{ userId: req.user._id }, { userId: null }],
    }).sort('-createdAt').limit(50);

    res.json({ success: true, data: notifications.map(toFrontend) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create notification (admin/system)
// @route   POST /api/notifications
// @access  Private
exports.createNotification = async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;
    const note = await Notification.create({
      userId: userId || null,
      title,
      message,
      type: type || 'system',
      date: new Date().toLocaleDateString('ar-JO'),
    });
    res.status(201).json({ success: true, data: toFrontend(note) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { $or: [{ userId: req.user._id }, { userId: null }] },
      { read: true }
    );

    const notifications = await Notification.find({
      $or: [{ userId: req.user._id }, { userId: null }],
    }).sort('-createdAt').limit(50);

    res.json({ success: true, data: notifications.map(toFrontend) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

function toFrontend(n) {
  return {
    id: n._id,
    title: n.title,
    message: n.message,
    date: n.date,
    read: n.read,
    type: n.type,
    userId: n.userId,
  };
}

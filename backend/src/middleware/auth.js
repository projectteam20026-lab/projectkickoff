const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, error: 'غير مصرح لك بالوصول' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ success: false, error: 'المستخدم غير موجود' });
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'رمز غير صالح أو منتهي الصلاحية' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ success: false, error: 'ليس لديك صلاحية لهذا الإجراء' });
  next();
};

// Shortcut: admin only
const adminOnly = [protect, authorize('مسؤول')];

module.exports = { protect, authorize, adminOnly };

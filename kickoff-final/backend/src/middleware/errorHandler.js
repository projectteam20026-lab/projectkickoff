const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = 'المورد غير موجود';
    return res.status(404).json({ success: false, error: error.message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = field === 'email' ? 'البريد الإلكتروني مستخدم بالفعل' : 'قيمة مكررة';
    return res.status(400).json({ success: false, error: error.message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map((e) => e.message).join(', ');
    return res.status(400).json({ success: false, error: error.message });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    error: error.message || 'خطأ في الخادم',
  });
};

module.exports = errorHandler;

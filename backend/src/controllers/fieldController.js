const Field = require('../models/Field');

// @desc    Get all fields
// @route   GET /api/fields
// @access  Public
exports.getFields = async (req, res) => {
  try {
    const fields = await Field.find({ isActive: true }).populate('ownerId', 'name email');
    const mapped = fields.map(toFrontend);
    res.json({ success: true, data: mapped });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get single field
// @route   GET /api/fields/:id
// @access  Public
exports.getField = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id).populate('ownerId', 'name email');
    if (!field) return res.status(404).json({ success: false, error: 'الملعب غير موجود' });
    res.json({ success: true, data: toFrontend(field) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create field
// @route   POST /api/fields
// @access  Private (owner/admin)
exports.createField = async (req, res) => {
  try {
    const { name, location, pricePerHour, type, turfType, images, amenities, description } = req.body;
    const field = await Field.create({
      name, location, pricePerHour, type,
      turfType: turfType || 'عشب صناعي',
      images: images || [],
      amenities: amenities || [],
      description: description || '',
      ownerId: req.user._id,
    });
    res.status(201).json({ success: true, data: toFrontend(field) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update field
// @route   PUT /api/fields/:id
// @access  Private (owner of field / admin)
exports.updateField = async (req, res) => {
  try {
    let field = await Field.findById(req.params.id);
    if (!field) return res.status(404).json({ success: false, error: 'الملعب غير موجود' });

    // Only owner or admin can update
    if (field.ownerId && field.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'مسؤول') {
      return res.status(403).json({ success: false, error: 'غير مصرح لك بتعديل هذا الملعب' });
    }

    field = await Field.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: toFrontend(field) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete field
// @route   DELETE /api/fields/:id
// @access  Private (owner/admin)
exports.deleteField = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);
    if (!field) return res.status(404).json({ success: false, error: 'الملعب غير موجود' });

    if (field.ownerId && field.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'مسؤول') {
      return res.status(403).json({ success: false, error: 'غير مصرح لك بحذف هذا الملعب' });
    }

    // Soft delete
    await Field.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'تم حذف الملعب' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Map Mongoose doc → frontend shape
function toFrontend(f) {
  return {
    id: f._id,
    name: f.name,
    location: f.location,
    pricePerHour: f.pricePerHour,
    rating: f.rating,
    type: f.type,
    turfType: f.turfType,
    images: f.images,
    amenities: f.amenities,
    description: f.description,
    ownerId: f.ownerId,
  };
}

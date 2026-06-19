'use strict';

const Field = require('../models/Field');

// @desc    Get all fields (with pagination, search, filters)
// @route   GET /api/fields
// @access  Public
exports.getFields = async (req, res) => {
  try {
    const {
      page      = 1,
      limit     = 100,
      search,
      city,
      type,
      fieldType,
      minPrice,
      maxPrice,
      rating,
      featured,
      amenities,  // comma-separated English values e.g. "Parking,WiFi"
      sort      = '-createdAt',
    } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }
    if (city)              query.city         = { $regex: city, $options: 'i' };
    if (type || fieldType) query.type         = type || fieldType;
    if (featured !== undefined) query.featured = featured === 'true';
    if (minPrice || maxPrice) {
      query.pricePerHour = {};
      if (minPrice) query.pricePerHour.$gte = Number(minPrice);
      if (maxPrice) query.pricePerHour.$lte = Number(maxPrice);
    }
    if (rating)    query.rating    = { $gte: Number(rating) };
    if (amenities) query.amenities = { $all: amenities.split(',').map(a => a.trim()).filter(Boolean) };

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip     = (pageNum - 1) * limitNum;

    const [fields, total] = await Promise.all([
      Field.find(query).sort(sort).skip(skip).limit(limitNum).populate('ownerId', 'name email'),
      Field.countDocuments(query),
    ]);

    res.json({
      success: true,
      data:  fields.map(toFrontend),
      total,
      page:  pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get featured fields
// @route   GET /api/fields/featured
// @access  Public
exports.getFeaturedFields = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const fields = await Field.find({ isActive: true, featured: true })
      .sort('-rating')
      .limit(Math.min(20, parseInt(limit, 10)));
    res.json({ success: true, data: fields.map(toFrontend) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get fields by city
// @route   GET /api/fields/city/:city
// @access  Public
exports.getFieldsByCity = async (req, res) => {
  try {
    const { limit = 12, sort = '-rating' } = req.query;
    const fields = await Field.find({
      isActive: true,
      city: { $regex: req.params.city, $options: 'i' },
    })
      .sort(sort)
      .limit(Math.min(50, parseInt(limit, 10)));
    res.json({ success: true, data: fields.map(toFrontend) });
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
    if (!field || !field.isActive) return res.status(404).json({ success: false, error: 'الملعب غير موجود' });
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
    const {
      name, location, city, region, address,
      pricePerHour, type, turfType, surfaceType,
      images, amenities, description,
      phone, whatsapp, coordinates, availableHours,
    } = req.body;

    const field = await Field.create({
      name, location,
      city:       city       || '',
      region:     region     || '',
      address:    address    || location,
      pricePerHour, type,
      turfType:     turfType     || 'عشب صناعي',
      surfaceType:  surfaceType  || 'Artificial Grass',
      images:       images       || [],
      amenities:    amenities    || [],
      description:  description  || '',
      phone, whatsapp, coordinates, availableHours,
      ownerId: req.user._id,
    });
    res.status(201).json({ success: true, data: toFrontend(field) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update field
// @route   PUT /api/fields/:id
// @access  Private (owner / admin)
exports.updateField = async (req, res) => {
  try {
    let field = await Field.findById(req.params.id);
    if (!field) return res.status(404).json({ success: false, error: 'الملعب غير موجود' });

    if (field.ownerId && field.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'مسؤول') {
      return res.status(403).json({ success: false, error: 'غير مصرح لك بتعديل هذا الملعب' });
    }

    field = await Field.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: toFrontend(field) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get owner's own fields
// @route   GET /api/fields/mine
// @access  Private
exports.getMyFields = async (req, res) => {
  try {
    const fields = await Field.find({ ownerId: req.user._id, isActive: true }).sort('-createdAt');
    res.json({ success: true, data: fields.map(toFrontend) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete field (soft)
// @route   DELETE /api/fields/:id
// @access  Private (owner / admin)
exports.deleteField = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);
    if (!field) return res.status(404).json({ success: false, error: 'الملعب غير موجود' });

    if (field.ownerId && field.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'مسؤول') {
      return res.status(403).json({ success: false, error: 'غير مصرح لك بحذف هذا الملعب' });
    }

    await Field.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'تم حذف الملعب' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

function toFrontend(f) {
  return {
    id:             f._id,
    name:           f.name,
    slug:           f.slug,
    city:           f.city,
    region:         f.region,
    location:       f.location,
    address:        f.address,
    pricePerHour:   f.pricePerHour,
    rating:         f.rating,
    reviewsCount:   f.reviewsCount,
    type:           f.type,
    turfType:       f.turfType,
    surfaceType:    f.surfaceType,
    images:         f.images,
    amenities:      f.amenities,
    description:    f.description,
    featured:       f.featured,
    phone:          f.phone,
    whatsapp:       f.whatsapp,
    coordinates:    f.coordinates,
    availableHours: f.availableHours,
    ownerId:        f.ownerId,
  };
}

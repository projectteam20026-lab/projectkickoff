'use strict';

const Field = require('../models/Field');

// ── Football field image pool ──────────────────────────────────────────────────
// Every URL here is a real outdoor football/soccer pitch photo.
const PITCH_IMGS = [
  // Pexels — filename confirms content
  'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/47730/the-ball-stadion-football-stadium-47730.jpeg?auto=compress&cs=tinysrgb&w=800',
  // Unsplash — confirmed outdoor football pitches
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1487466365202-1afdb86c764e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?auto=format&fit=crop&w=800&q=80',
];

// Deterministic pick based on field name so every field always gets the same image
function pitchImg(name) {
  let h = 0;
  const s = (name || '').toString();
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return PITCH_IMGS[h % PITCH_IMGS.length];
}

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
    const fields = await Field.find({ isActive: true, ownerId: req.user._id }).sort('-createdAt');
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
  // Always provide real football pitch images.
  // Detect old/generic/broken seed images and replace them deterministically.
  // Owner-uploaded images (custom URLs not from our pool) are kept as-is.
  const dbImgs = f.images || [];
  const OLD_POOL = [
    'photo-1529900748604-07564a03e7a6', // old generic Unsplash used for ALL fields
    'pexels-photo-16826134', 'pexels-photo-12486370', 'pexels-photo-15153169',
    'pexels-photo-16114080', 'pexels-photo-17203165', 'pexels-photo-21561836',
  ];
  const isGeneric = dbImgs.length === 0 ||
    dbImgs.every(url => OLD_POOL.some(id => url.includes(id)));
  const images = isGeneric
    ? [pitchImg(f.name), pitchImg((f.name || '') + '_2')]
    : dbImgs;

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
    images,
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

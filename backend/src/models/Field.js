const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Field name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
    },
    pricePerHour: {
      type: Number,
      required: [true, 'Price per hour is required'],
      min: [0, 'Price must be positive'],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    type: {
      type: String,
      enum: ['5v5', '6v6', '7v7'],
      required: [true, 'Field type is required'],
    },
    turfType: {
      type: String,
      enum: ['عشب صناعي', 'عشب طبيعي', 'هجين'],
      default: 'عشب صناعي',
    },
    images: {
      type: [String],
      default: ['https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=2070&auto=format&fit=crop'],
    },
    amenities: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: '',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Field', fieldSchema);

const mongoose = require('mongoose');

/**
 * Equipment Schema — represents a piece of farm machinery listed for rent.
 * Uses a GeoJSON Point with a 2dsphere index for geospatial search.
 */
const equipmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Equipment title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Tractor', 'Drone', 'Harvester', 'Chainsaw', 'Irrigator', 'Sprayer', 'Other'],
    },
    dailyRate: {
      type: Number,
      required: [true, 'Daily rental rate is required'],
      min: [0, 'Daily rate cannot be negative'],
    },
    images: {
      type: [String], // Array of image URLs
      default: [],
    },
    // GeoJSON Point: IMPORTANT — MongoDB stores as [longitude, latitude]
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        index: '2dsphere', // Enable geospatial indexing
      },
      address: {
        type: String,
        default: '',
      },
      city: {
        type: String,
        default: '',
      },
      state: {
        type: String,
        default: '',
      },
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    specifications: {
      // Flexible key-value pairs for equipment specs
      type: Map,
      of: String,
      default: {},
    },
    maximumRentalDays: {
      type: Number,
      default: 7,
      min: 1,
    },
    depositAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Geospatial Index — required for $near and $geoWithin queries ──────────────
equipmentSchema.index({ location: '2dsphere' });

// ─── Text Search Index ─────────────────────────────────────────────────────────
equipmentSchema.index({ title: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Equipment', equipmentSchema);

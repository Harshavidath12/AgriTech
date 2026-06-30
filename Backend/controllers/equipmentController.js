const Equipment = require('../models/Equipment');
const Booking = require('../models/Booking');

/**
 * Helper to geocode an address string using Nominatim (OpenStreetMap)
 */
const geocodeAddress = async (locationStr) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationStr)}&format=json&limit=1`, {
      headers: { 'User-Agent': 'AgriTechApp/1.0' }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  return null;
};

/**
 * @desc    Search equipment by geolocation (lat, lng, radius in km)
 * @route   GET /api/equipment/search
 * @access  Public
 * @query   lat, lng, radius (km), category, page, limit
 *
 * Uses MongoDB $near operator with a 2dsphere index.
 * IMPORTANT: MongoDB coordinates are [longitude, latitude] — reversed from common usage.
 */
const searchEquipment = async (req, res, next) => {
  try {
    const {
      lat,
      lng,
      radius = 50,      // Default 50 km radius
      category,
      minRate,
      maxRate,
      page = 1,
      limit = 12,
    } = req.query;

    // Build base filter
    const filter = { isAvailable: true };

    // ─── Geospatial filter ────────────────────────────────────────────────────
    if (lat && lng) {
      const radiusInMeters = parseFloat(radius) * 1000; // Convert km → meters
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)], // [lng, lat]
          },
          $maxDistance: radiusInMeters,
        },
      };
    }

    // ─── Category filter ──────────────────────────────────────────────────────
    if (category && category !== 'All') {
      filter.category = category;
    }

    // ─── Price range filter ───────────────────────────────────────────────────
    if (minRate || maxRate) {
      filter.dailyRate = {};
      if (minRate) filter.dailyRate.$gte = parseFloat(minRate);
      if (maxRate) filter.dailyRate.$lte = parseFloat(maxRate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Equipment.countDocuments(filter);

    const equipment = await Equipment.find(filter)
      .populate('ownerId', 'name email phone profileImage location')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      count: equipment.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all equipment (no geo filter) — for general browse
 * @route   GET /api/equipment
 * @access  Public
 */
const getAllEquipment = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const filter = { isAvailable: true };
    if (category && category !== 'All') filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Equipment.countDocuments(filter);
    const equipment = await Equipment.find(filter)
      .populate('ownerId', 'name email phone profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      count: equipment.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single equipment by ID
 * @route   GET /api/equipment/:id
 * @access  Public
 */
const getEquipmentById = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('ownerId', 'name email phone profileImage location bio');

    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    // Fetch upcoming booked date ranges for this equipment (for calendar blocking)
    const bookedDates = await Booking.find({
      equipmentId: req.params.id,
      status: { $in: ['Pending', 'Confirmed'] },
      endDate: { $gte: new Date() },
    }).select('startDate endDate status');

    res.status(200).json({
      success: true,
      data: equipment,
      bookedDates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new equipment listing (Lenders only)
 * @route   POST /api/equipment
 * @access  Private (Lender)
 */
const createEquipment = async (req, res, next) => {
  try {
    const {
      title, description, category, dailyRate,
      images, location, specifications,
      maximumRentalDays, depositAmount,
    } = req.body;

    // Automatic Geocoding if coordinates are default [0,0]
    if (location && location.coordinates && location.coordinates[0] === 0 && location.coordinates[1] === 0) {
      const addressString = location.city || location.address; // Fallback to address if no city
      const coords = await geocodeAddress(addressString);
      if (coords) {
        location.coordinates = coords;
      }
    }

    const equipment = await Equipment.create({
      title,
      description,
      category,
      dailyRate,
      images: images || [],
      location,
      ownerId: req.user._id, // Set from authenticated user
      specifications,
      maximumRentalDays,
      depositAmount,
    });

    res.status(201).json({
      success: true,
      message: 'Equipment listed successfully',
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update equipment listing (owner only)
 * @route   PUT /api/equipment/:id
 * @access  Private (Lender — owner)
 */
const updateEquipment = async (req, res, next) => {
  try {
    let equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    // Only the owner can update their listing
    if (equipment.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this listing',
      });
    }

    // Automatic Geocoding if coordinates are default [0,0]
    if (req.body.location && req.body.location.coordinates && req.body.location.coordinates[0] === 0 && req.body.location.coordinates[1] === 0) {
      const loc = req.body.location;
      const addressString = loc.city || loc.address;
      const coords = await geocodeAddress(addressString);
      if (coords) {
        req.body.location.coordinates = coords;
      }
    }

    equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Equipment updated successfully',
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete equipment listing (owner only)
 * @route   DELETE /api/equipment/:id
 * @access  Private (Lender — owner)
 */
const deleteEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    if (equipment.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this listing',
      });
    }

    // Check for active bookings before deletion
    const activeBookings = await Booking.findOne({
      equipmentId: req.params.id,
      status: { $in: ['Pending', 'Confirmed'] },
    });

    if (activeBookings) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete equipment with active bookings. Cancel them first.',
      });
    }

    await equipment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Equipment listing deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all equipment owned by the logged-in Lender
 * @route   GET /api/equipment/my-listings
 * @access  Private (Lender)
 */
const getMyListings = async (req, res, next) => {
  try {
    const equipment = await Equipment.find({ ownerId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: equipment.length,
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchEquipment,
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getMyListings,
};

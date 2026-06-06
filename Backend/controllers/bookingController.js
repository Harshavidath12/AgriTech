const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');

/**
 * @desc    Create a new booking with strict conflict checking
 * @route   POST /api/bookings
 * @access  Private (Renter)
 *
 * Conflict-checking algorithm:
 * Two date ranges [A_start, A_end] and [B_start, B_end] overlap if:
 *   A_start <= B_end AND A_end >= B_start
 * This handles all overlap cases: partial overlap, containment, and exact match.
 */
const createBooking = async (req, res, next) => {
  try {
    const { equipmentId, startDate, endDate, notes } = req.body;

    if (!equipmentId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Equipment ID, start date, and end date are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ─── Validate dates ───────────────────────────────────────────────────────
    if (start < today) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past',
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
    }

    // ─── Fetch equipment ──────────────────────────────────────────────────────
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    if (!equipment.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'This equipment is currently unavailable for booking',
      });
    }

    // ─── Prevent self-booking ─────────────────────────────────────────────────
    if (equipment.ownerId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book your own equipment',
      });
    }

    // ─── STRICT CONFLICT CHECK ────────────────────────────────────────────────
    // Check if any existing booking for this equipment overlaps the requested dates.
    // A conflict exists if: existingStart <= requestedEnd AND existingEnd >= requestedStart
    const conflictingBooking = await Booking.findOne({
      equipmentId,
      status: { $in: ['Pending', 'Confirmed'] }, // Only check active bookings
      $or: [
        {
          // Existing booking starts before or on the requested end date
          // AND ends on or after the requested start date
          startDate: { $lte: end },
          endDate: { $gte: start },
        },
      ],
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message: 'This equipment is already booked during the selected dates',
        conflict: {
          startDate: conflictingBooking.startDate,
          endDate: conflictingBooking.endDate,
          status: conflictingBooking.status,
        },
      });
    }

    // ─── Calculate total cost ──────────────────────────────────────────────────
    const msPerDay = 1000 * 60 * 60 * 24;
    const durationDays = Math.ceil((end - start) / msPerDay);

    if (durationDays < equipment.minimumRentalDays) {
      return res.status(400).json({
        success: false,
        message: `Minimum rental period is ${equipment.minimumRentalDays} day(s)`,
      });
    }

    const totalCost = durationDays * equipment.dailyRate;

    // ─── Create booking ───────────────────────────────────────────────────────
    const booking = await Booking.create({
      equipmentId,
      renterId: req.user._id,
      lenderId: equipment.ownerId,
      startDate: start,
      endDate: end,
      totalCost,
      dailyRateAtBooking: equipment.dailyRate,
      status: 'Pending',
      notes: notes || '',
    });

    // Populate for response
    await booking.populate([
      { path: 'equipmentId', select: 'title category images location dailyRate' },
      { path: 'renterId', select: 'name email phone' },
      { path: 'lenderId', select: 'name email phone' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get bookings for the logged-in user (renter sees their bookings, lender sees bookings on their equipment)
 * @route   GET /api/bookings/my-bookings
 * @access  Private
 */
const getMyBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let filter;
    if (req.user.role === 'Renter') {
      filter = { renterId: req.user._id };
    } else {
      filter = { lenderId: req.user._id };
    }

    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Booking.countDocuments(filter);

    const bookings = await Booking.find(filter)
      .populate('equipmentId', 'title category images dailyRate location')
      .populate('renterId', 'name email phone profileImage')
      .populate('lenderId', 'name email phone profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('equipmentId', 'title category images dailyRate location ownerId')
      .populate('renterId', 'name email phone profileImage')
      .populate('lenderId', 'name email phone profileImage');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only the renter or lender involved can view this booking
    const isRenter = booking.renterId._id.toString() === req.user._id.toString();
    const isLender = booking.lenderId._id.toString() === req.user._id.toString();

    if (!isRenter && !isLender) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking',
      });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update booking status (Lender confirms/completes, either party can cancel)
 * @route   PATCH /api/bookings/:id/status
 * @access  Private
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, cancellationReason } = req.body;
    const validStatuses = ['Confirmed', 'Completed', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isRenter = booking.renterId.toString() === req.user._id.toString();
    const isLender = booking.lenderId.toString() === req.user._id.toString();

    // ─── Permission rules ─────────────────────────────────────────────────────
    if (status === 'Confirmed' || status === 'Completed') {
      if (!isLender) {
        return res.status(403).json({
          success: false,
          message: 'Only the lender can confirm or complete bookings',
        });
      }
    }

    if (status === 'Cancelled') {
      if (!isRenter && !isLender) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this booking',
        });
      }
    }

    booking.status = status;
    if (status === 'Cancelled') {
      booking.cancelledAt = new Date();
      booking.cancelledBy = req.user._id;
      booking.cancellationReason = cancellationReason || '';
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking status updated to '${status}'`,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, getMyBookings, getBookingById, updateBookingStatus };

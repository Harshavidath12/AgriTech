const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  approveBooking,
  payBooking,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All booking routes require authentication

// POST /api/bookings — Create a new booking (Renters only, with conflict check)
router.post('/', protect, authorize('Renter'), createBooking);

// GET /api/bookings/my-bookings — Get bookings for current user (role-aware)
router.get('/my-bookings', protect, getMyBookings);

// GET /api/bookings/:id — Get single booking details
router.get('/:id', protect, getBookingById);

// PATCH /api/bookings/:id/status — Update booking status (confirm/complete/cancel)
router.patch('/:id/status', protect, updateBookingStatus);

// PATCH /api/bookings/:id/approve — Approve booking (Lender only)
router.patch('/:id/approve', protect, approveBooking);

// POST /api/bookings/:id/pay — Pay for booking (Renter only)
router.post('/:id/pay', protect, payBooking);

module.exports = router;

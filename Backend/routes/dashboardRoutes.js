const express = require('express');
const router = express.Router();
const {
  getLenderDashboard,
  getRenterDashboard,
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

// GET /api/dashboard/lender — Lender portfolio + earnings analytics
router.get('/lender', protect, authorize('Lender'), getLenderDashboard);

// GET /api/dashboard/renter — Renter bookings + spending stats
router.get('/renter', protect, authorize('Renter'), getRenterDashboard);

module.exports = router;

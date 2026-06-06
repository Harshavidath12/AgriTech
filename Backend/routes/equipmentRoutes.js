const express = require('express');
const router = express.Router();
const {
  searchEquipment,
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getMyListings,
} = require('../controllers/equipmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ─── Public Routes ─────────────────────────────────────────────────────────────

// GET /api/equipment/search?lat=&lng=&radius=&category= — Geospatial search
router.get('/search', searchEquipment);

// GET /api/equipment — Browse all available equipment
router.get('/', getAllEquipment);

// GET /api/equipment/:id — Get single equipment detail + booked dates
router.get('/:id', getEquipmentById);

// ─── Protected Routes (Lender only) ───────────────────────────────────────────

// GET /api/equipment/my-listings — Get logged-in lender's listings
router.get('/my-listings', protect, authorize('Lender'), getMyListings);

// POST /api/equipment — Create new equipment listing
router.post('/', protect, authorize('Lender'), createEquipment);

// PUT /api/equipment/:id — Update equipment listing
router.put('/:id', protect, authorize('Lender'), updateEquipment);

// DELETE /api/equipment/:id — Delete equipment listing
router.delete('/:id', protect, authorize('Lender'), deleteEquipment);

module.exports = router;

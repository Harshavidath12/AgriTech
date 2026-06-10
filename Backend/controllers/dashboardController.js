const Equipment = require('../models/Equipment');
const Booking = require('../models/Booking');

/**
 * @desc    Get Lender dashboard data — portfolio, earnings, booking analytics
 * @route   GET /api/dashboard/lender
 * @access  Private (Lender)
 */
const getLenderDashboard = async (req, res, next) => {
  try {
    const lenderId = req.user._id;

    // ─── Equipment portfolio ───────────────────────────────────────────────────
    const equipment = await Equipment.find({ ownerId: lenderId }).lean();
    const totalListings = equipment.length;
    const activeListings = equipment.filter((e) => e.isAvailable).length;

    // ─── All bookings on lender's equipment ───────────────────────────────────
    const bookings = await Booking.find({ lenderId })
      .populate('equipmentId', 'title category dailyRate depositAmount')
      .populate('renterId', 'name email profileImage')
      .sort({ createdAt: -1 })
      .lean();

    // ─── Earnings analytics ───────────────────────────────────────────────────
    const completedBookings = bookings.filter((b) => b.status === 'Completed');
    const confirmedBookings = bookings.filter((b) => b.status === 'Confirmed');
    
    // Total Deposits Earned (from Confirmed and Completed)
    const totalEarnings = [...confirmedBookings, ...completedBookings].reduce(
      (sum, b) => sum + (b.equipmentId?.depositAmount || 0), 0
    );
    
    // Pending Income (Remaining balance to be paid for Confirmed bookings)
    const pendingEarnings = confirmedBookings.reduce(
      (sum, b) => sum + (b.totalCost - (b.equipmentId?.depositAmount || 0)), 0
    );

    // Monthly earnings for the past 6 months
    const monthlyEarnings = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthTotal = [...completedBookings, ...confirmedBookings]
        .filter((b) => new Date(b.endDate) >= monthStart && new Date(b.endDate) <= monthEnd)
        .reduce((sum, b) => sum + b.totalCost, 0);

      return { month, earnings: monthTotal };
    }).reverse();

    // ─── Booking status breakdown ─────────────────────────────────────────────
    const statusBreakdown = {
      Pending: bookings.filter((b) => b.status === 'Pending').length,
      Confirmed: bookings.filter((b) => b.status === 'Confirmed').length,
      Completed: bookings.filter((b) => b.status === 'Completed').length,
      Cancelled: bookings.filter((b) => b.status === 'Cancelled').length,
    };

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalListings,
          activeListings,
          totalEarnings,
          pendingEarnings,
          totalBookings: bookings.length,
          completedBookings: completedBookings.length,
        },
        monthlyEarnings,
        statusBreakdown,
        recentBookings: bookings.slice(0, 10),
        equipment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Renter dashboard data — booking history, upcoming rentals, invoices
 * @route   GET /api/dashboard/renter
 * @access  Private (Renter)
 */
const getRenterDashboard = async (req, res, next) => {
  try {
    const renterId = req.user._id;

    const bookings = await Booking.find({ renterId })
      .populate('equipmentId', 'title category images dailyRate location depositAmount')
      .populate('lenderId', 'name email phone profileImage')
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();
    const upcoming = bookings.filter((b) => b.status === 'Pending');
    const active = bookings.filter((b) => b.status === 'Approved');
    const past = bookings.filter((b) => 
      ['Confirmed', 'Completed', 'Cancelled', 'Declined'].includes(b.status)
    );

    const totalSpent = bookings
      .filter((b) => ['Confirmed', 'Completed'].includes(b.status))
      .reduce((sum, b) => sum + (b.equipmentId?.depositAmount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalBookings: bookings.length,
          upcomingBookings: upcoming.length,
          activeBookings: active.length,
          totalSpent,
        },
        upcoming,
        active,
        past,
        allBookings: bookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getLenderDashboard, getRenterDashboard };

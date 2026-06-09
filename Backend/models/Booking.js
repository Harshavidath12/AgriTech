const mongoose = require('mongoose');

/**
 * Booking Schema — represents a rental reservation.
 * The conflict-checking logic lives in the bookingController before save.
 *
 * Status flow: Pending → Confirmed → Completed
 *                       ↘ Cancelled
 */
const bookingSchema = new mongoose.Schema(
  {
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: [true, 'Equipment ID is required'],
    },
    renterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Renter ID is required'],
    },
    lenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Lender ID is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    totalCost: {
      type: Number,
      required: [true, 'Total cost is required'],
      min: 0,
    },
    dailyRateAtBooking: {
      type: Number, // Snapshot of the rate at time of booking
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    // Cancellation info
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// ─── Index for efficient conflict-checking queries ─────────────────────────────
bookingSchema.index({ equipmentId: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ renterId: 1, status: 1 });
bookingSchema.index({ lenderId: 1, status: 1 });

// ─── Virtual: Rental duration in days ─────────────────────────────────────────
bookingSchema.virtual('durationDays').get(function () {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((this.endDate - this.startDate) / msPerDay) + 1;
});

// ─── Validate endDate > startDate before save ──────────────────────────────────
bookingSchema.pre('validate', function () {
  if (this.endDate <= this.startDate) {
    this.invalidate('endDate', 'End date must be after start date');
  }
});

module.exports = mongoose.model('Booking', bookingSchema);

import { format } from 'date-fns';
import { Calendar, MapPin, Clock, ChevronRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * BookingCard — displays a single booking with status badge and actions.
 *
 * @param {Object} booking - Full booking object (populated)
 * @param {Function} onStatusChange - Callback to update booking status
 * @param {'renter'|'lender'} viewAs - Perspective for action buttons
 */
const BookingCard = ({ booking, onStatusChange, viewAs = 'renter' }) => {
  const navigate = useNavigate();
  const { _id, equipmentId, renterId, lenderId, startDate, endDate, totalCost, status, dailyRateAtBooking, createdAt } = booking;

  const durationDays = Math.ceil(
    (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
  );

  const statusClass = {
    Pending: 'badge-pending',
    Confirmed: 'badge-confirmed',
    Completed: 'badge-completed',
    Cancelled: 'badge-cancelled',
  }[status] || 'badge-pending';

  return (
    <div className="glass-card p-5">
      <div className="flex flex-col sm:flex-row gap-4">

        {/* Equipment Image */}
        <div className="flex-shrink-0">
          {equipmentId?.images?.[0] ? (
            <img src={equipmentId.images[0]} alt={equipmentId.title}
              className="w-20 h-20 rounded-xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-dark-700 flex items-center justify-center text-3xl">🚜</div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className="font-display font-semibold text-white text-base leading-tight cursor-pointer hover:text-primary-400 transition-colors"
              onClick={() => navigate(`/equipment/${equipmentId?._id}`)}
            >
              {equipmentId?.title || 'Equipment'}
            </h3>
            <span className={statusClass}>{status}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-gray-400 mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary-500" />
              {format(new Date(startDate), 'MMM d')} → {format(new Date(endDate), 'MMM d, yyyy')}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary-500" />
              {durationDays} day{durationDays !== 1 ? 's' : ''} × ₹{dailyRateAtBooking?.toLocaleString()}/day
            </div>
            {equipmentId?.location?.address && (
              <div className="flex items-center gap-1.5 sm:col-span-2">
                <MapPin className="w-3.5 h-3.5 text-primary-500" />
                {equipmentId.location.address}
              </div>
            )}
            {viewAs === 'lender' && renterId?.name && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-earth-400" />
                Renter: {renterId.name}
              </div>
            )}
            {viewAs === 'renter' && lenderId?.name && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-earth-400" />
                Lender: {lenderId.name}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs">Total Cost</p>
              <p className="text-primary-400 font-display font-bold text-lg">
                ₹{totalCost?.toLocaleString()}
              </p>
            </div>

            {/* Lender action buttons */}
            {viewAs === 'lender' && (
              <div className="flex gap-2">
                {status === 'Pending' && (
                  <>
                    <button
                      onClick={() => onStatusChange?.(_id, 'Confirmed')}
                      className="btn-primary !py-1.5 !px-3 !text-xs"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => onStatusChange?.(_id, 'Cancelled')}
                      className="!py-1.5 !px-3 !text-xs rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-xs font-semibold"
                    >
                      Decline
                    </button>
                  </>
                )}
                {status === 'Confirmed' && (
                  <button
                    onClick={() => onStatusChange?.(_id, 'Completed')}
                    className="btn-earth !py-1.5 !px-3 !text-xs"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            )}

            {/* Renter cancel button */}
            {viewAs === 'renter' && ['Pending', 'Confirmed'].includes(status) && (
              <button
                onClick={() => onStatusChange?.(_id, 'Cancelled')}
                className="!py-1.5 !px-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-xs font-semibold"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;

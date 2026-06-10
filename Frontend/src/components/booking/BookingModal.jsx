import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { X, Calendar, Calculator, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { format, differenceInCalendarDays, addDays } from 'date-fns';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import LoadingSpinner from '../LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * BookingModal — full booking pipeline:
 *  1. Shows equipment summary
 *  2. Date range picker with blocked dates highlighted
 *  3. Real-time cost calculation
 *  4. Submit → POST /api/bookings with conflict handling
 *
 * @param {Object} equipment - Equipment to book
 * @param {Array} bookedDates - Array of {startDate, endDate} for blocked dates
 * @param {Function} onClose - Close modal callback
 * @param {Function} onSuccess - Success callback
 */
const BookingModal = ({ equipment, bookedDates = [], onClose, onSuccess }) => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, isLender, user } = useAuth();
  const navigate = useNavigate();

  // Build list of excluded date ranges for DatePicker
  const excludedDateRanges = bookedDates.map((b) => ({
    start: new Date(b.startDate),
    end: new Date(b.endDate),
  }));

  // Calculate rental cost
  const durationDays = startDate && endDate
    ? differenceInCalendarDays(endDate, startDate) + 1
    : 0;
  const totalCost = durationDays * (equipment?.dailyRate || 0);
  const exceedsMaximum = durationDays > (equipment?.maximumRentalDays || 7);

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  const handleBook = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book equipment');
      navigate('/login');
      return;
    }

    if (isLender) {
      toast.error('Lenders cannot book equipment');
      return;
    }

    if (equipment?.ownerId?._id === user?._id) {
      toast.error('You cannot book your own equipment');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Please select a date range');
      return;
    }

    if (exceedsMaximum) {
      toast.error(`Maximum rental is ${equipment.maximumRentalDays} day(s)`);
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/bookings', {
        equipmentId: equipment._id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        notes,
      });

      toast.success('🎉 Booking request submitted!');
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed';
      const conflict = err.response?.data?.conflict;

      if (conflict) {
        toast.error(`Conflict: already booked ${format(new Date(conflict.startDate), 'MMM d')}–${format(new Date(conflict.endDate), 'MMM d')}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!equipment) return null;

  const { title, category, dailyRate, images, location, ownerId, maximumRentalDays, depositAmount } = equipment;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-2xl glass-card border border-white/10 animate-slide-up max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-lg">Book Equipment</h2>
              <p className="text-gray-100 text-sm">Select your rental dates</p>
            </div>
          </div>
          <button id="close-booking-modal" onClick={onClose}
            className="w-8 h-8 rounded-full bg-dark-700 hover:bg-dark-600 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-100" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Equipment Summary */}
          <div className="flex gap-4 p-4 rounded-xl bg-dark-700/50 border border-white/5">
            {images?.[0] ? (
              <img src={images[0]} alt={title}
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-dark-600 flex items-center justify-center flex-shrink-0 text-3xl">
                🚜
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-white text-base leading-tight mb-1 truncate">{title}</p>
              <p className="text-primary-400 text-sm font-medium">{category}</p>
              {location?.address && (
                <div className="flex items-center gap-1 text-gray-100 text-xs mt-1">
                  <MapPin className="w-3 h-3" />{location.address}
                </div>
              )}
              {ownerId?.name && (
                <p className="text-gray-100 text-xs mt-1">by {ownerId.name}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-primary-400 font-display font-bold text-xl">
                Rs. {dailyRate?.toLocaleString()}
              </p>
              <p className="text-gray-100 text-xs">per day</p>
              {depositAmount > 0 && (
                <p className="text-yellow-800 font-medium text-xs mt-1">
                  + Rs. {depositAmount?.toLocaleString()} deposit
                </p>
              )}
            </div>
          </div>

          {/* Maximum rental notice */}
          {maximumRentalDays > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-800 font-medium text-sm">
              <Clock className="w-4 h-4 flex-shrink-0" />
              Maximum rental: {maximumRentalDays} days
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="form-label mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Select Rental Period
            </label>
            <div className="flex justify-center">
              <DatePicker
                selected={startDate}
                onChange={handleDateChange}
                startDate={startDate}
                endDate={endDate}
                selectsRange
                inline
                minDate={addDays(new Date(), 1)}
                excludeDateIntervals={excludedDateRanges}
                monthsShown={2}
                calendarClassName="!font-sans"
              />
            </div>
            {bookedDates.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 text-gray-100 text-xs">
                <span className="w-3 h-3 rounded-sm bg-gray-600 inline-block" />
                Grayed dates are already booked
              </div>
            )}
          </div>

          {/* Cost Summary */}
          {startDate && endDate && (
            <div className="p-4 rounded-xl bg-primary-900/20 border border-primary-500/20 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-[#800000]" />
                <p className="text-[#800000] font-semibold text-sm">Cost Summary</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-100">
                  <span>{format(startDate, 'MMM d')} → {format(endDate, 'MMM d, yyyy')}</span>
                  <span>{durationDays} day{durationDays !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between text-gray-100">
                  <span>Rate × Days</span>
                  <span>Rs. {dailyRate?.toLocaleString()} × {durationDays}</span>
                </div>
                {depositAmount > 0 && (
                  <div className="flex justify-between text-yellow-800 font-medium text-xs">
                    <span>Deposit</span>
                    <span>Rs. {depositAmount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-100 text-base pt-2 border-t border-gray-300">
                  <span>Total Cost</span>
                  <span className="text-[#800000]">Rs. {totalCost?.toLocaleString()}</span>
                </div>
              </div>
              {exceedsMaximum && (
                <div className="flex items-center gap-1.5 mt-3 text-red-700 font-medium text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  Cannot rent for more than {maximumRentalDays} days
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="form-label">Additional Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input resize-none"
              rows={2}
              placeholder="Delivery requirements, special instructions..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              id="confirm-booking-btn"
              onClick={handleBook}
              disabled={loading || !startDate || !endDate || exceedsMaximum}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : <Calendar className="w-4 h-4" />}
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;

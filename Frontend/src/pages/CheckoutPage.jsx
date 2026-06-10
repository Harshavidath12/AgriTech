import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { CreditCard, Calendar, ShieldCheck, ChevronRight, Package, Lock } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const CheckoutPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Mock form state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handleNameChange = (e) => {
    setCardName(e.target.value.replace(/[^A-Za-z\s]/g, ''));
  };

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    val = val.replace(/(.{4})/g, '$1-').trim();
    if (val.endsWith('-')) val = val.slice(0, -1);
    setCardNumber(val.slice(0, 19));
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) {
      let month = parseInt(val.slice(0, 2), 10);
      if (month < 1) month = '01';
      else if (month > 12) month = '12';
      else month = val.slice(0, 2);
      val = `${month}/${val.slice(2, 4)}`;
    }
    setExpiry(val.slice(0, 5));
  };

  const handleCvcChange = (e) => {
    setCvc(e.target.value.replace(/\D/g, '').slice(0, 3));
  };

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data } = await axiosInstance.get(`/bookings/${bookingId}`);
        setBooking(data.data);
      } catch (err) {
        toast.error('Failed to load booking details');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId, navigate]);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!cardName || !cardNumber || !expiry || !cvc) {
      toast.error('Please fill in all card details');
      return;
    }

    setProcessing(true);
    try {
      // Hit the new secure payment endpoint
      await axiosInstance.post(`/bookings/${bookingId}/pay`);
      toast.success('Payment successful! Booking confirmed.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!booking) return null;

  const { equipmentId, startDate, endDate, totalCost } = booking;
  const depositAmount = equipmentId?.depositAmount || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Secure Checkout</h1>
        <p className="text-gray-400 flex items-center justify-center gap-1.5">
          <Lock className="w-4 h-4 text-green-500" /> Complete your deposit payment to confirm the booking
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Payment Form */}
        <div className="md:col-span-3">
          <div className="glass-card p-6">
            <h2 className="text-xl font-display font-bold text-white mb-5 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-400" /> Payment Details
            </h2>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Name on Card</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={handleNameChange}
                  className="form-input"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  className="form-input font-mono"
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={handleExpiryChange}
                    className="form-input font-mono"
                    placeholder="MM/YY"
                    maxLength={5}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">CVC</label>
                  <input
                    type="password"
                    value={cvc}
                    onChange={handleCvcChange}
                    className="form-input font-mono"
                    placeholder="123"
                    maxLength={3}
                    minLength={3}
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 mt-6">
                <button
                  type="submit"
                  disabled={processing}
                  className="btn-primary w-full !py-3.5 flex items-center justify-center gap-2 text-lg"
                >
                  {processing ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      Pay Rs. {depositAmount.toLocaleString()} <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-green-500" /> Payments are secure and encrypted
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div className="md:col-span-2 space-y-4">
          <div className="glass-card p-6">
            <h2 className="text-lg font-display font-bold text-white mb-4">Order Summary</h2>

            <div className="flex items-start gap-3 pb-4 border-b border-white/5 mb-4">
              {equipmentId?.images?.[0] ? (
                <img src={equipmentId.images[0]} alt={equipmentId.title} className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-dark-700 flex items-center justify-center text-2xl">🚜</div>
              )}
              <div>
                <p className="font-medium text-white line-clamp-2">{equipmentId?.title}</p>
                <p className="text-xs text-primary-400 mt-1">{equipmentId?.category}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-400">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Dates</span>
                <span className="text-white text-right">
                  {format(new Date(startDate), 'MMM d, yyyy')} <br />
                  to {format(new Date(endDate), 'MMM d, yyyy')}
                </span>
              </div>

              <div className="flex justify-between text-gray-400 pt-2 border-t border-white/5">
                <span>Total Rental Cost</span>
                <span className="text-white">Rs. {totalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Security Deposit</span>
                <span className="text-white">Rs. {depositAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-lg text-white font-bold">Total Due Today</p>
                  <p className="text-xs text-gray-400">Deposit only</p>
                </div>
                <p className="text-2xl font-display font-bold text-primary-400">
                  Rs. {depositAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-dark-700/50 border border-white/5 text-sm text-gray-400 leading-relaxed">
            <strong className="text-white">Note:</strong> You are only paying the security deposit today to confirm this booking. The total rental cost of Rs. {totalCost.toLocaleString()} will be settled directly with the lender.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

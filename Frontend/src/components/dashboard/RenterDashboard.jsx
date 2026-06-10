import { useState, useEffect, useCallback } from 'react';
import { Package, CreditCard, Clock, CheckCircle, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import LoadingSpinner from '../LoadingSpinner';
import BookingCard from '../booking/BookingCard';

const StatCard = ({ icon: Icon, label, value, sub, color = 'primary' }) => (
  <div className="glass-card p-5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-gray-400 text-sm font-medium">{label}</p>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center
        ${color === 'primary' ? 'bg-primary-500/15 text-primary-400' :
          color === 'earth' ? 'bg-earth-500/15 text-earth-400' :
          color === 'blue' ? 'bg-blue-500/15 text-blue-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className="text-2xl font-display font-bold text-white">{value}</p>
    {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
  </div>
);

/**
 * RenterDashboard — booking browser, upcoming rentals, and spending overview.
 */
const RenterDashboard = () => {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const navigate = useNavigate();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/dashboard/renter');
      setDashData(data.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleStatusChange = async (bookingId, status) => {
    try {
      await axiosInstance.patch(`/bookings/${bookingId}/status`, { status });
      toast.success(status === 'Cancelled' ? 'Booking cancelled' : `Status updated to ${status}`);
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  );

  const { stats, upcoming, active, past, allBookings } = dashData || {};

  const tabData = {
    upcoming: upcoming || [],
    active: active || [],
    completed: past || [],
    all: allBookings || [],
  };

  const currentList = tabData[activeTab] || [];

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-3xl">Renter Dashboard</h1>
          <p className="section-subtitle">Track your equipment rentals and spending</p>
        </div>
        <button
          id="browse-marketplace-btn"
          onClick={() => navigate('/marketplace')}
          className="btn-primary flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" /> Browse Marketplace
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Bookings" value={stats?.totalBookings || 0} color="primary" />
        <StatCard icon={Clock} label="Upcoming" value={stats?.upcomingBookings || 0} sub="pending requests" color="blue" />
        <StatCard icon={CheckCircle} label="Active Now" value={stats?.activeBookings || 0} sub="in progress" color="earth" />
        <StatCard icon={CreditCard} label="Total Spent" value={`Rs. ${(stats?.totalSpent || 0).toLocaleString()}`} sub="on completed rentals" color="yellow" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-dark-800 border border-white/5 w-fit flex-wrap">
        {[
          { key: 'upcoming', label: `Upcoming (${upcoming?.length || 0})` },
          { key: 'active', label: `Active (${active?.length || 0})` },
          { key: 'completed', label: 'Completed' },
          { key: 'all', label: 'All Bookings' },
        ].map(({ key, label }) => (
          <button key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === key
                ? 'bg-primary-600 text-white shadow-glow-green'
                : 'text-gray-400 hover:text-gray-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Booking List */}
      <div className="space-y-3">
        {!currentList.length ? (
          <div className="glass-card p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">
              {activeTab === 'upcoming' ? 'No upcoming bookings' :
               activeTab === 'active' ? 'No active rentals' :
               activeTab === 'completed' ? 'No completed bookings' : 'No bookings yet'}
            </p>
            <p className="text-gray-600 text-sm mt-1 mb-4">
              Browse the marketplace to find and book equipment
            </p>
            <button onClick={() => navigate('/marketplace')} className="btn-primary">
              Explore Marketplace
            </button>
          </div>
        ) : (
          currentList.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              viewAs="renter"
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default RenterDashboard;

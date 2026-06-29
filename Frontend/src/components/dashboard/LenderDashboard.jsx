import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, Package, DollarSign, CheckCircle,
  Plus, Edit3, Trash2, AlertCircle, RefreshCw
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import LoadingSpinner from '../LoadingSpinner';
import BookingCard from '../booking/BookingCard';
import EquipmentForm from '../equipment/EquipmentForm';

const COLORS = ['#f59e0b', '#22c55e', '#3b82f6', '#ef4444'];

const StatCard = ({ icon: Icon, label, value, sub, color = 'primary' }) => (
  <div className="glass-card p-5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-gray-400 text-sm font-medium">{label}</p>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center
        ${color === 'primary' ? 'bg-primary-500/15 text-primary-400' :
          color === 'earth' ? 'bg-earth-500/15 text-earth-400' :
            color === 'blue' ? 'bg-blue-500/15 text-blue-400' :
              'bg-purple-500/15 text-purple-400'}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className="text-2xl font-display font-bold text-white">{value}</p>
    {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
  </div>
);

/**
 * LenderDashboard — portfolio management + earnings analytics for Lenders.
 */
const LenderDashboard = () => {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/dashboard/lender');
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
      toast.success(`Booking ${status.toLowerCase()}`);
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteEquipment = async (id) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await axiosInstance.delete(`/equipment/${id}`);
      toast.success('Listing removed');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  );

  const { stats, monthlyEarnings, statusBreakdown, recentBookings, equipment } = dashData || {};
  const pieData = Object.entries(statusBreakdown || {}).map(([name, value]) => ({ name, value }));
  const BACKEND_URL = 'https://agritech-backend-vl9t.onrender.com';

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-3xl">Lender Dashboard</h1>
          <p className="section-subtitle">Manage your equipment portfolio and track earnings</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchDashboard} className="btn-secondary !py-2.5 !px-3">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button id="add-equipment-btn" onClick={() => { setEditingEquipment(null); setShowForm(true); }}
            className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Equipment
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="glass-card p-6 border border-primary-500/20 animate-slide-up">
          <h3 className="font-display font-bold text-white text-lg mb-6">
            {editingEquipment ? 'Edit Listing' : 'New Equipment Listing'}
          </h3>
          <EquipmentForm
            existing={editingEquipment}
            onSuccess={() => { setShowForm(false); setEditingEquipment(null); fetchDashboard(); }}
            onCancel={() => { setShowForm(false); setEditingEquipment(null); }}
          />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Listings" value={stats?.totalListings || 0} color="primary" />
        <StatCard icon={DollarSign} label="Total Deposits Earned" value={`Rs. ${(stats?.totalEarnings || 0).toLocaleString()}`} color="earth" />
        <StatCard icon={CheckCircle} label="Completed" value={stats?.completedBookings || 0} sub="bookings" color="blue" />
        <StatCard icon={TrendingUp} label="Pending Income" value={`Rs. ${(stats?.pendingEarnings || 0).toLocaleString()}`} color="purple" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-dark-800 border border-white/5 w-fit">
        {['overview', 'bookings'].map((tab) => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab
                ? 'bg-primary-600 text-white shadow-glow-green'
                : 'text-gray-400 hover:text-gray-200'
              }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-1 gap-6">
          {/* Monthly Earnings Chart */}
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-white mb-5">Monthly Earnings</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyEarnings} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickFormatter={(v) => `Rs. ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip
                  contentStyle={{ background: '#1a2820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f3f4f6' }}
                  formatter={(v) => [`Rs. ${v.toLocaleString()}`, 'Earnings']}
                />
                <Bar dataKey="earnings" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>


        </div>
      )}

      {/* Equipment Portfolio (Always visible on Overview) */}
      {activeTab === 'overview' && (
        <div className="mt-8 space-y-3">
          <h3 className="font-display font-semibold text-white mb-4">Your Equipment Portfolio</h3>
          {!equipment?.length ? (
            <div className="glass-card p-12 text-center">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No listings yet</p>
              <p className="text-gray-600 text-sm mt-1 mb-4">Add your first equipment to start earning</p>
              <button onClick={() => { setEditingEquipment(null); setShowForm(true); }}
                className="btn-primary">Add Equipment</button>
            </div>
          ) : (
            equipment.map((item) => (
              <div key={item._id} className="glass-card p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-dark-700 flex-shrink-0 overflow-hidden">
                  {item.images?.[0]
                    ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">🚜</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-white truncate">{item.title}</p>
                  <p className="text-gray-400 text-sm">{item.category} · Rs. {item.dailyRate?.toLocaleString()}/day</p>
                  <span className={item.isAvailable ? 'badge-confirmed' : 'badge-cancelled'}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => { setEditingEquipment(item); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="btn-secondary !py-2 !px-3">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteEquipment(item._id)}
                    className="!py-2 !px-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}



      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-3">
          {!recentBookings?.length ? (
            <div className="glass-card p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No bookings yet</p>
            </div>
          ) : (
            recentBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                viewAs="lender"
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LenderDashboard;

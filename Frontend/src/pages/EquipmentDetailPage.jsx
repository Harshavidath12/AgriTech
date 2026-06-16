import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Calendar, Tag, DollarSign, User, Phone, Mail,
  Clock, ArrowLeft, CheckCircle, Star, Shield
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import BookingModal from '../components/booking/BookingModal';
import { useAuth } from '../context/AuthContext';

const CATEGORY_ICONS = {
  Tractor: '🚜', Drone: '🛸', Harvester: '🌾',
  Chainsaw: '🪚', Irrigator: '💧', Sprayer: '🌿', Other: '⚙️',
};

const EquipmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLender } = useAuth();
  const [equipment, setEquipment] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const { data } = await axiosInstance.get(`/equipment/${id}`);
        setEquipment(data.data);
        setBookedDates(data.bookedDates || []);
      } catch (err) {
        toast.error('Equipment not found');
        navigate('/marketplace');
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, [id, navigate]);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="xl" />
    </div>
  );

  if (!equipment) return null;

  const {
    title, description, category, dailyRate, images, location,
    ownerId, isAvailable, specifications, maximumRentalDays, depositAmount, createdAt
  } = equipment;

  const categoryIcon = CATEGORY_ICONS[category] || '⚙️';
  const BACKEND_URL = 'https://agritech-backend-vl9t.onrender.com';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">

      {/* Back button */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Marketplace
      </button>

      <div className="grid lg:grid-cols-2 gap-8">

        <div className="space-y-6">
          {/* ─── Image Gallery ────────────────────────────────────────────── */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-dark-700">
              {images?.length > 0 ? (
                <img src={`${BACKEND_URL}/${images[activeImage]}`} alt={title}
                  className="w-full h-full object-cover transition-all duration-300" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <span className="text-8xl mb-4">{categoryIcon}</span>
                  <p className="text-gray-500 text-sm">No images available</p>
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all
                      ${activeImage === i ? 'border-primary-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <img src={`${BACKEND_URL}/${img}`} alt={`${title} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ─── Description ─────────────────────────────────────────── */}
          <div className="glass-card p-6">
            <h2 className="font-display font-bold text-white text-lg mb-4">Description</h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{description}</p>
          </div>
        </div>

        {/* ─── Details Panel ────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Title & Category */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{categoryIcon}</span>
              <span className="category-chip active">{category}</span>
              <span className={`ml-auto ${isAvailable ? 'badge-confirmed' : 'badge-cancelled'}`}>
                {isAvailable ? '● Available' : '● Unavailable'}
              </span>
            </div>
            <h1 className="text-3xl font-display font-bold text-white leading-tight">{title}</h1>
          </div>

          {/* Pricing */}
          <div className="glass-card p-5">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-gray-400 text-sm">Daily Rental Rate</p>
                <p className="text-4xl font-display font-bold text-primary-400">
                  Rs. {dailyRate?.toLocaleString()}
                  <span className="text-gray-400 text-lg font-normal">/day</span>
                </p>
              </div>
              {depositAmount > 0 && (
                <div className="text-right">
                  <p className="text-gray-400 text-xs">Security deposit</p>
                  <p className="text-yellow-800 font-semibold">Rs. {depositAmount?.toLocaleString()}</p>
                </div>
              )}
            </div>
            {maximumRentalDays > 0 && (
              <div className="flex items-center gap-1.5 text-gray-400">
                <Clock className="w-4 h-4" />
                Maximum rental: {maximumRentalDays} day{maximumRentalDays !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Book Button */}
          {isAvailable && !isLender && (
            <button
              id="detail-book-btn"
              onClick={() => {
                if (!isAuthenticated) {
                  toast.error('Please sign in to book equipment');
                  navigate('/login');
                  return;
                }
                setShowBookingModal(true);
              }}
              className="btn-primary w-full !py-4 text-lg flex items-center justify-center gap-2 animate-pulse-green"
            >
              <Calendar className="w-5 h-5" /> Book This Equipment
            </button>
          )}

          {isLender && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
              <Shield className="w-4 h-4 flex-shrink-0" />
              Lender accounts cannot book equipment
            </div>
          )}

          {/* Location */}
          {location?.address && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-dark-700/50 border border-white/5">
              <MapPin className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Location</p>
                <p className="text-white font-medium">{location.address}</p>
                {location.city && <p className="text-gray-400 text-sm">{location.city}, {location.state}</p>}
                {location.coordinates && (
                  <p className="text-gray-600 text-xs mt-1">
                    {location.coordinates[1].toFixed(4)}°N, {location.coordinates[0].toFixed(4)}°E
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Owner Info */}
          {ownerId && (
            <div className="glass-card p-4">
              <p className="text-gray-400 text-xs mb-3 uppercase tracking-wide font-medium">Listed by</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-700 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{ownerId.name?.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <p className="font-display font-semibold text-white">{ownerId.name}</p>
                  {ownerId.bio && <p className="text-gray-400 text-sm line-clamp-2">{ownerId.bio}</p>}
                </div>
              </div>
              {isAuthenticated && (
                <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2">
                  {ownerId.email && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Mail className="w-3.5 h-3.5 text-primary-400" /> {ownerId.email}
                    </div>
                  )}
                  {ownerId.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Phone className="w-3.5 h-3.5 text-primary-400" /> {ownerId.phone}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Specifications */}
          {specifications && specifications.size > 0 && (
            <div className="glass-card p-6">
              <h2 className="font-display font-bold text-white text-lg mb-4">Specifications</h2>
              <div className="space-y-2">
                {Array.from(specifications.entries()).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-gray-400 text-sm capitalize">{key}</span>
                    <span className="text-white text-sm font-medium">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          equipment={equipment}
          bookedDates={bookedDates}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            navigate('/dashboard');
          }}
        />
      )}
    </div>
  );
};

export default EquipmentDetailPage;

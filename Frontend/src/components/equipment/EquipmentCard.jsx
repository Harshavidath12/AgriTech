import { MapPin, Star, Clock, ChevronRight, Tractor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Category icon mapping
 */
const CATEGORY_ICONS = {
  Tractor: '🚜',
  Drone: '🛸',
  Harvester: '🌾',
  Planter: '🌱',
  Irrigator: '💧',
  Sprayer: '🌿',
  Other: '⚙️',
};

/**
 * EquipmentCard — displays a single equipment listing in the marketplace grid.
 * Glassmorphism design with hover animations.
 *
 * @param {Object} equipment - Equipment data object from API
 * @param {Function} onBook - Callback to open booking modal
 */
const EquipmentCard = ({ equipment, onBook }) => {
  const navigate = useNavigate();
  const { isLender } = useAuth();

  const {
    _id,
    title,
    category,
    dailyRate,
    images,
    location,
    ownerId,
    isAvailable,
    maximumRentalDays,
  } = equipment;

  const categoryIcon = CATEGORY_ICONS[category] || '⚙️';
  const BACKEND_URL = 'https://agritech-backend-vl9t.onrender.com';
  const imageUrl = images?.[0] || null;

  return (
    <div className="glass-card overflow-hidden flex flex-col group cursor-pointer"
      onClick={() => navigate(`/equipment/${_id}`)}>

      {/* Image */}
      <div className="relative h-48 bg-dark-700 overflow-hidden">
        {imageUrl ? (
          <img
            src={`${BACKEND_URL}/${imageUrl}`}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-dark-700 to-dark-600">
            <span className="text-6xl mb-2">{categoryIcon}</span>
            <span className="text-gray-500 text-xs">No image available</span>
          </div>
        )}

        {/* Availability badge */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm
          ${isAvailable
            ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
          {isAvailable ? '● Available' : '● Booked'}
        </div>

        {/* Category pill */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full
                        bg-dark-900/70 backdrop-blur-sm border border-white/10">
          <span className="text-sm">{categoryIcon}</span>
          <span className="text-xs text-gray-300 font-medium">{category}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-white text-base leading-tight mb-1 line-clamp-2 group-hover:text-primary-400 transition-colors">
          {title}
        </h3>

        {/* Location */}
        {location?.address && (
          <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{location.address}</span>
          </div>
        )}

        {/* Owner */}
        {ownerId?.name && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-5 h-5 rounded-full bg-primary-700 flex items-center justify-center">
              <span className="text-xs text-white font-bold">{ownerId.name.charAt(0)}</span>
            </div>
            <span className="text-xs text-gray-400">{ownerId.name}</span>
          </div>
        )}

        {/* Max rental */}
        {maximumRentalDays > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-gray-500 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>Max. {maximumRentalDays} days</span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <div>
            <p className="text-gray-500 text-xs">Daily rate</p>
            <p className="text-primary-400 font-display font-bold text-lg">
              Rs. {dailyRate?.toLocaleString()}
              <span className="text-gray-500 text-xs font-normal">/day</span>
            </p>
          </div>

          {!isLender && (
            <button
              id={`book-btn-${_id}`}
              onClick={(e) => {
                e.stopPropagation();
                if (onBook && isAvailable) onBook(equipment);
              }}
              disabled={!isAvailable}
              className="btn-primary !py-2 !px-4 !text-sm flex items-center gap-1"
            >
              Book
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EquipmentCard;

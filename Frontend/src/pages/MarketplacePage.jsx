import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Filter, SlidersHorizontal, Map, Grid3X3, X } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import EquipmentCard from '../components/equipment/EquipmentCard';
import EquipmentMap from '../components/equipment/EquipmentMap';
import BookingModal from '../components/booking/BookingModal';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = ['All', 'Tractor', 'Drone', 'Harvester', 'Chainsaw', 'Irrigator', 'Sprayer', 'Other'];
const RADIUS_OPTIONS = [10, 25, 50, 100, 200];

const MarketplacePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [viewMode, setViewMode] = useState(
    // Default to list view if Maps API key isn't configured yet
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY &&
     import.meta.env.VITE_GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE')
      ? 'split' : 'list'
  );
  const [showFilters, setShowFilters] = useState(false);

  // ─── Search State ─────────────────────────────────────────────────────────
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [searchCity, setSearchCity] = useState('');
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [mapCenter, setMapCenter] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (category !== 'All') params.category = category;
      if (minRate) params.minRate = minRate;
      if (maxRate) params.maxRate = maxRate;

      let url = '/equipment';

      if (searchCity) {
        params.city = searchCity;
      }

      const { data } = await axiosInstance.get(url, { params });
      setEquipment(data.data);
      setPagination({ total: data.total, pages: data.pages, page: data.page });
    } catch (err) {
      toast.error('Failed to fetch equipment');
    } finally {
      setLoading(false);
    }
  }, [category, searchCity, minRate, maxRate, page]);

  useEffect(() => { fetchEquipment(); }, [fetchEquipment]);



  const handleBookClick = async (item) => {
    setSelectedEquipment(item);
    // Fetch booked dates for this equipment
    try {
      const { data } = await axiosInstance.get(`/equipment/${item._id}`);
      setBookedDates(data.bookedDates || []);
    } catch {
      setBookedDates([]);
    }
    setShowBookingModal(true);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">

      {/* ─── Search Bar ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-dark-900/90 backdrop-blur-xl border-b border-white/5 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-3">

            {/* City search */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="search-city"
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (setPage(1), fetchEquipment())}
                  className="form-input pl-9 !py-2 text-sm"
                  placeholder="Enter city or location..."
                />
              </div>
            </div>

            {/* Search Button */}
            <button
              id="search-submit-btn"
              onClick={() => { setPage(1); fetchEquipment(); }}
              className="btn-primary !py-2 !px-5 flex items-center gap-2 text-sm"
            >
              <Search className="w-4 h-4" /> Search
            </button>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary !py-2 !px-3 ${showFilters ? 'border-primary-500/50' : ''}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* View Mode */}
            <div className="flex gap-1 p-1 rounded-xl bg-dark-800 border border-white/5">
              {[
                { mode: 'list', icon: Grid3X3 },
                { mode: 'split', icon: Filter },
                { mode: 'map', icon: Map },
              ].map(({ mode, icon: Icon }) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === mode ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Filter drawer */}
          {showFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-3 pt-3 border-t border-white/5 animate-fade-in">
              {/* Category chips */}
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setCategory(cat); setPage(1); }}
                    className={`category-chip ${category === cat ? 'active' : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {/* Price range */}
              <div className="flex items-center gap-2 text-sm">
                <input type="number" value={minRate} onChange={(e) => setMinRate(e.target.value)}
                  className="form-input !py-1.5 !w-24 text-sm" placeholder="Min Rs." />
                <span className="text-gray-500">–</span>
                <input type="number" value={maxRate} onChange={(e) => setMaxRate(e.target.value)}
                  className="form-input !py-1.5 !w-24 text-sm" placeholder="Max Rs." />
              </div>
              <button onClick={() => { setCategory('All'); setMinRate(''); setMaxRate(''); setSearchCity(''); setMapCenter(null); setPage(1); }}
                className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                <X className="w-3 h-3" /> Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Results Count ────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 py-2 bg-dark-900/50">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-400 text-sm">
            {loading ? 'Searching...' : `${pagination.total || equipment.length} equipment found`}
            {category !== 'All' && <span className="ml-2 text-primary-400">· {category}</span>}
            {searchCity && <span className="ml-2 text-earth-400">· In {searchCity}</span>}
          </p>
        </div>
      </div>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden max-w-7xl mx-auto w-full px-4 pb-4">

        {/* SPLIT VIEW */}
        {viewMode === 'split' && (
          <div className="h-full flex gap-4 pt-4">
            {/* Equipment Grid */}
            <div className="w-[45%] overflow-y-auto pr-2">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <LoadingSpinner size="lg" />
                </div>
              ) : equipment.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="font-medium text-gray-400">No equipment found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or search location</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {equipment.map((item) => (
                    <EquipmentCard key={item._id} equipment={item} onBook={handleBookClick} />
                  ))}
                </div>
              )}
            </div>

            {/* Map */}
            <div className="flex-1 rounded-2xl overflow-hidden">
              <EquipmentMap
                equipment={equipment}
                center={mapCenter}
                radius={50}
                onMarkerClick={handleBookClick}
              />
            </div>
          </div>
        )}

        {/* LIST ONLY VIEW */}
        {viewMode === 'list' && (
          <div className="h-full overflow-y-auto pt-4">
            {loading ? (
              <div className="flex items-center justify-center h-40"><LoadingSpinner size="lg" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {equipment.map((item) => (
                  <EquipmentCard key={item._id} equipment={item} onBook={handleBookClick} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* MAP ONLY VIEW */}
        {viewMode === 'map' && (
          <div className="h-full pt-4">
            <EquipmentMap
              equipment={equipment}
              center={mapCenter}
              radius={50}
              onMarkerClick={handleBookClick}
            />
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedEquipment && (
        <BookingModal
          equipment={selectedEquipment}
          bookedDates={bookedDates}
          onClose={() => { setShowBookingModal(false); setSelectedEquipment(null); }}
          onSuccess={() => fetchEquipment()}
        />
      )}
    </div>
  );
};

export default MarketplacePage;

import { useEffect, useCallback, useState } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  Circle,
} from '@react-google-maps/api';
import { MapPin, AlertCircle, Key } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

// Detect if API key is missing or still the placeholder
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const HAS_VALID_KEY =
  MAPS_API_KEY.length > 10 &&
  MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

/**
 * NoKeyFallback — shown when Google Maps API key is not configured.
 * Displays equipment as a styled pin list instead.
 */
const NoKeyFallback = ({ equipment, onMarkerClick }) => (
  <div className="w-full h-full flex flex-col bg-dark-800 rounded-2xl border border-white/10 overflow-hidden">
    {/* Header */}
    <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 bg-dark-700/50">
      <div className="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center flex-shrink-0">
        <Key className="w-4 h-4 text-yellow-400" />
      </div>
      <div>
        <p className="text-white font-semibold text-sm">Map View Unavailable</p>
        <p className="text-gray-500 text-xs">Add your Google Maps API key to <code className="text-yellow-400">Frontend/.env</code></p>
      </div>
    </div>

    {/* Equipment pin list */}
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {equipment.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-600">
          <MapPin className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">No equipment to display</p>
        </div>
      ) : (
        equipment.map((item) => {
          const [lng, lat] = item.location?.coordinates || [0, 0];
          return (
            <button
              key={item._id}
              onClick={() => onMarkerClick?.(item)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-dark-700/60 hover:bg-dark-600/60
                         border border-white/5 hover:border-primary-500/30 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-primary-600/20 border border-primary-500/30
                              flex items-center justify-center flex-shrink-0 text-lg">
                {item.category === 'Drone' ? '🛸' :
                 item.category === 'Harvester' ? '🌾' :
                 item.category === 'Planter' ? '🌱' :
                 item.category === 'Irrigator' ? '💧' :
                 item.category === 'Sprayer' ? '🌿' : '🚜'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate group-hover:text-primary-400 transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{item.location?.address || `${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E`}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-primary-400 font-bold text-sm">₹{item.dailyRate?.toLocaleString()}</p>
                <p className="text-gray-600 text-xs">/day</p>
              </div>
            </button>
          );
        })
      )}
    </div>

    {/* Footer instruction */}
    <div className="px-5 py-3 border-t border-white/5 bg-dark-700/30">
      <p className="text-gray-600 text-xs text-center">
        Set <code className="text-yellow-400">VITE_GOOGLE_MAPS_API_KEY</code> in <code className="text-yellow-400">Frontend/.env</code> to enable the interactive map
      </p>
    </div>
  </div>
);

const MAP_LIBRARIES = ['places'];

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1a2820' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0f0d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2d4535' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#243628' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1f18' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1a2820' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a2820' }] },
];

/**
 * EquipmentMap — Google Maps component displaying equipment as pins.
 * Shows a radius circle around the search center point.
 *
 * @param {Array} equipment - Array of equipment objects with location.coordinates
 * @param {Object} center - { lat, lng } — search center
 * @param {number} radius - Search radius in km
 * @param {Function} onMarkerClick - Callback when marker clicked (opens BookingModal)
 */
const EquipmentMap = ({ equipment = [], center, radius = 50, onMarkerClick }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [map, setMap] = useState(null);
  const { isLender } = useAuth();

  // Skip loading Maps SDK entirely if no valid API key — avoids the Google error iframe
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: HAS_VALID_KEY ? MAPS_API_KEY : '',
    libraries: MAP_LIBRARIES,
  });

  const mapCenter = center || { lat: 20.5937, lng: 78.9629 }; // Default: India center

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  // Fit map bounds to all markers when equipment changes
  useEffect(() => {
    if (!map || !equipment.length || !window.google) return;
    const bounds = new window.google.maps.LatLngBounds();
    equipment.forEach((item) => {
      const [lng, lat] = item.location.coordinates;
      bounds.extend({ lat, lng });
    });
    if (center) bounds.extend(center);
    map.fitBounds(bounds, 60);
  }, [map, equipment, center]);

  // No valid API key — show equipment list fallback (no broken Google iframe)
  if (!HAS_VALID_KEY) {
    return <NoKeyFallback equipment={equipment} onMarkerClick={onMarkerClick} />;
  }

  if (loadError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-dark-800 rounded-2xl border border-white/5">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-gray-400 text-sm">Failed to load Google Maps</p>
        <p className="text-gray-600 text-xs mt-1">Check your API key in Frontend/.env</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-dark-800 rounded-2xl border border-white/5">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getCategoryEmoji = (category) => {
    switch (category) {
      case 'Drone': return '🛸';
      case 'Harvester': return '🌾';
      case 'Planter': return '🌱';
      case 'Irrigator': return '💧';
      case 'Sprayer': return '🌿';
      default: return '🚜';
    }
  };

  return (
    <GoogleMap
      mapContainerClassName="w-full h-full rounded-2xl"
      center={mapCenter}
      zoom={center ? 9 : 5}
      onLoad={onLoad}
      options={{
        styles: MAP_STYLES,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        backgroundColor: '#1a2820',
      }}
    >
      {/* Radius circle around search center */}
      {center && radius && (
        <Circle
          center={center}
          radius={radius * 1000} // Convert km to meters
          options={{
            strokeColor: '#22c55e',
            strokeOpacity: 0.5,
            strokeWeight: 2,
            fillColor: '#22c55e',
            fillOpacity: 0.05,
          }}
        />
      )}

      {/* Equipment markers */}
      {equipment.map((item) => {
        const [lng, lat] = item.location.coordinates;
        return (
          <Marker
            key={item._id}
            position={{ lat, lng }}
            title={item.title}
            onClick={() => setSelectedItem(item)}
            icon={{
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
                  <ellipse cx="18" cy="42" rx="8" ry="3" fill="rgba(0,0,0,0.3)"/>
                  <path d="M18 0C9.164 0 2 7.164 2 16c0 12 16 28 16 28S34 28 34 16C34 7.164 26.836 0 18 0z"
                        fill="#16a34a" stroke="#22c55e" stroke-width="2"/>
                  <text x="18" y="21" text-anchor="middle" font-size="14" fill="white">${getCategoryEmoji(item.category)}</text>
                </svg>
              `)}`,
              scaledSize: new window.google.maps.Size(36, 44),
              anchor: new window.google.maps.Point(18, 44),
            }}
          />
        );
      })}

      {/* Info Window on marker click */}
      {selectedItem && (
        <InfoWindow
          position={{
            lat: selectedItem.location.coordinates[1],
            lng: selectedItem.location.coordinates[0],
          }}
          onCloseClick={() => setSelectedItem(null)}
        >
          <div className="p-1 min-w-[180px]">
            <p className="font-semibold text-gray-900 text-sm mb-1">{selectedItem.title}</p>
            <p className="text-gray-600 text-xs mb-2">{selectedItem.category}</p>
            <p className="text-green-700 font-bold text-sm mb-3">
              ₹{selectedItem.dailyRate?.toLocaleString()}/day
            </p>
            {!isLender && (
              <button
                onClick={() => {
                  setSelectedItem(null);
                  onMarkerClick?.(selectedItem);
                }}
                className="w-full bg-green-600 hover:bg-green-500 text-white text-xs font-semibold
                           py-1.5 px-3 rounded-lg transition-colors"
              >
                Book Now
              </button>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default EquipmentMap;

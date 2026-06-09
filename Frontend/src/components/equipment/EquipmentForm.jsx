import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance';
import LoadingSpinner from '../LoadingSpinner';
import { MapPin, DollarSign, Tag, FileText, Plus, X } from 'lucide-react';

const CATEGORIES = ['Tractor', 'Drone', 'Harvester', 'Planter', 'Irrigator', 'Sprayer', 'Other'];

/**
 * EquipmentForm — create or edit an equipment listing (Lender only).
 *
 * @param {Object} existing - Optional existing equipment data for edit mode
 * @param {Function} onSuccess - Callback after successful submission
 * @param {Function} onCancel - Callback to close form
 */
const EquipmentForm = ({ existing, onSuccess, onCancel }) => {
  const isEditMode = !!existing;
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState(existing?.images || []);
  const [imageInput, setImageInput] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: existing?.title || '',
      description: existing?.description || '',
      category: existing?.category || 'Tractor',
      dailyRate: existing?.dailyRate || '',
      maximumRentalDays: existing?.maximumRentalDays || 7,
      depositAmount: existing?.depositAmount || 0,
      address: existing?.location?.address || '',
      city: existing?.location?.city || '',
      state: existing?.location?.state || '',
      lat: existing?.location?.coordinates?.[1] || '',
      lng: existing?.location?.coordinates?.[0] || '',
    },
  });

  const addImageUrl = () => {
    if (imageInput.trim()) {
      setImageUrls([...imageUrls, imageInput.trim()]);
      setImageInput('');
    }
  };

  const removeImage = (index) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        title: data.title,
        description: data.description,
        category: data.category,
        dailyRate: parseFloat(data.dailyRate),
        maximumRentalDays: parseInt(data.maximumRentalDays),
        depositAmount: parseFloat(data.depositAmount) || 0,
        images: imageUrls,
        location: {
          type: 'Point',
          coordinates: [parseFloat(data.lng), parseFloat(data.lat)], // [lng, lat]
          address: data.address,
          city: data.city,
          state: data.state,
        },
      };

      if (isEditMode) {
        await axiosInstance.put(`/equipment/${existing._id}`, payload);
        toast.success('Equipment listing updated successfully!');
      } else {
        await axiosInstance.post('/equipment', payload);
        toast.success('Equipment listed successfully!');
      }

      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Title & Category row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Equipment Title *</label>
          <input
            {...register('title', { required: 'Title is required' })}
            className="form-input"
            placeholder="e.g. John Deere 5075E Tractor"
          />
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="form-label">Category *</label>
          <select {...register('category', { required: true })} className="form-input">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="form-label">Description *</label>
        <textarea
          {...register('description', { required: 'Description is required' })}
          className="form-input resize-none"
          rows={4}
          placeholder="Describe the equipment, condition, features, and any operational notes..."
        />
        {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="form-label">Daily Rate (₹) *</label>
          <input
            type="number"
            {...register('dailyRate', { required: 'Daily rate is required', min: { value: 1, message: 'Rate must be > 0' } })}
            className="form-input"
            placeholder="2500"
          />
          {errors.dailyRate && <p className="text-red-400 text-xs mt-1">{errors.dailyRate.message}</p>}
        </div>
        <div>
          <label className="form-label">Max. Rental Days</label>
          <input type="number" {...register('maximumRentalDays')} className="form-input" min="1" />
        </div>
        <div>
          <label className="form-label">Deposit Amount (₹)</label>
          <input type="number" {...register('depositAmount')} className="form-input" placeholder="0" />
        </div>
      </div>

      {/* Location */}
      <div>
        <p className="form-label mb-3 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> Location
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <input {...register('address')} className="form-input" placeholder="Street address" />
          </div>
          <input {...register('city')} className="form-input" placeholder="City" />
          <input {...register('state')} className="form-input" placeholder="State" />
          <div>
            <input
              type="number"
              step="any"
              {...register('lat', { required: 'Latitude is required' })}
              className="form-input"
              placeholder="Latitude (e.g. 13.0827)"
            />
            {errors.lat && <p className="text-red-400 text-xs mt-1">{errors.lat.message}</p>}
          </div>
          <div>
            <input
              type="number"
              step="any"
              {...register('lng', { required: 'Longitude is required' })}
              className="form-input"
              placeholder="Longitude (e.g. 80.2707)"
            />
            {errors.lng && <p className="text-red-400 text-xs mt-1">{errors.lng.message}</p>}
          </div>
        </div>
      </div>

      {/* Images */}
      <div>
        <label className="form-label">Equipment Images (URLs)</label>
        <div className="flex gap-2 mb-3">
          <input
            value={imageInput}
            onChange={(e) => setImageInput(e.target.value)}
            className="form-input flex-1"
            placeholder="https://example.com/equipment.jpg"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
          />
          <button type="button" onClick={addImageUrl} className="btn-secondary !py-2.5 !px-4">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {imageUrls.map((url, i) => (
              <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-dark-700 border border-white/10 text-xs text-gray-300 max-w-xs">
                <span className="truncate max-w-[180px]">{url}</span>
                <button type="button" onClick={() => removeImage(i)} className="text-red-400 hover:text-red-300 flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2 border-t border-white/5">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <LoadingSpinner size="sm" /> : null}
          {isEditMode ? 'Update Listing' : 'List Equipment'}
        </button>
      </div>
    </form>
  );
};

export default EquipmentForm;

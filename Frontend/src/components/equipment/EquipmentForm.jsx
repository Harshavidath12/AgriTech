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
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const BACKEND_URL = 'https://agritech-backend-vl9t.onrender.com';

  const {
    register,
    handleSubmit,
    setValue,
    reset,
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

    },
  });

  // Re-populate form when `existing` prop changes (e.g. switching between items in edit mode)
  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title || '',
        description: existing.description || '',
        category: existing.category || 'Tractor',
        dailyRate: existing.dailyRate || '',
        maximumRentalDays: existing.maximumRentalDays || 7,
        depositAmount: existing.depositAmount || 0,
        address: existing.location?.address || '',
        city: existing.location?.city || '',
        state: existing.location?.state || '',
      });
      setImageUrls(existing.images || []);
      setSelectedFiles([]);
      setPreviewUrls([]);
    } else {
      reset({
        title: '',
        description: '',
        category: 'Tractor',
        dailyRate: '',
        maximumRentalDays: 7,
        depositAmount: 0,
        address: '',
        city: '',
        state: '',
      });
      setImageUrls([]);
      setSelectedFiles([]);
      setPreviewUrls([]);
    }
  }, [existing, reset]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    // Save the actual file object for the final form submission upload
    setSelectedFiles((prev) => [...prev, ...files]);

    // Create a temporary, secure browser URL strictly for the UI preview element
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
    
    e.target.value = ''; // Reset input
  };

  const removeExistingImage = (index) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const removePreviewImage = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      let newlyUploadedUrls = [];

      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append('images', file));
        
        const { data: uploadData } = await axiosInstance.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        newlyUploadedUrls = uploadData.urls;
      }

      const finalImages = [...imageUrls, ...newlyUploadedUrls];

      const payload = {
        title: data.title,
        description: data.description,
        category: data.category,
        dailyRate: parseFloat(data.dailyRate),
        maximumRentalDays: parseInt(data.maximumRentalDays),
        depositAmount: parseFloat(data.depositAmount) || 0,
        images: finalImages,
        location: {
          type: 'Point',
          coordinates: [0, 0], // [lng, lat] defaulted to 0 since location search is city-based
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

        </div>
      </div>

      {/* Images */}
      <div>
        <label className="form-label">Equipment Images</label>
        <div className="flex gap-2 mb-3">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
            className="form-input flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700"
          />
        </div>
        
        {(imageUrls.length > 0 || previewUrls.length > 0) && (
          <div className="flex flex-wrap gap-3">
            {imageUrls.map((url, i) => (
              <div key={`existing-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 group">
                <img src={`${BACKEND_URL}/${url}`} alt={`Existing ${i}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {previewUrls.map((url, i) => (
              <div key={`preview-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-primary-500/50 group">
                <img src={url} alt={`Upload preview ${i}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removePreviewImage(i)} className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-4 h-4" />
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

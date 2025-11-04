import { useEffect, useState, useRef } from 'react';
import Select from 'react-select';

import { fetchCategories, updateProducerProfile } from '@/lib/api/producers';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { toast } from 'react-toastify';
import { FaTimes, FaEdit, FaMapMarkerAlt, FaBuilding, FaUser, FaEnvelope, FaPhone, FaLock, FaLeaf, FaWarehouse, FaCheck } from 'react-icons/fa';
import Image from 'next/image';

export default function UpdateProfileModal({ initialData, token, onClose, onProfileUpdated }) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    businessName: '',
    phoneNumber: '',
    description: '',
    businessLogo: '',
    categories: [],
    // Business address fields
    businessAddressLine1: '',
    businessAddressLine2: '',
    businessCity: '',
    businessState: '',
    businessPostalCode: '',
    businessCountry: 'India',
    businessSameAsPermanent: false,
    latitude: null,
    longitude: null,
  });
  const [loading, setLoading] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [activeSection, setActiveSection] = useState('basic'); // 'basic', 'address', 'categories'
  const [showPwdModal, setShowPwdModal] = useState(false);
  const fileInputRef = useRef(null);
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setCapturingLocation(true);
    const startTime = Date.now();
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setForm((prev) => ({ ...prev, latitude: lat, longitude: lon }));
        setLocationCaptured(true);
        setCapturingLocation(false);
        toast.success("Farm location captured successfully!");
      },
      (error) => {
        const elapsed = Date.now() - startTime;
        setCapturingLocation(false);
        
        // Ignore very quick errors (< 500ms) as they're likely permission prompt artifacts
        if (elapsed < 500) {
          console.log("Ignoring quick error, likely permission prompt");
          return;
        }
        
        // Only show error for actual failures
        if (error.code === 1) { // PERMISSION_DENIED
          toast.error("Location access denied. Please enable location permissions in your browser.");
        } else if (error.code === 2) { // POSITION_UNAVAILABLE
          toast.error("Unable to determine your location. Please try again.");
        } else if (error.code === 3) { // TIMEOUT
          toast.error("Location request timed out. Please try again.");
        }
        console.error("Geolocation error:", error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (!initialData) return;
    setForm({
      email: initialData.email || '',
      password: '',
      businessName: initialData.businessName || '',
      phoneNumber: initialData.phoneNumber || '',
      description: initialData.description || '',
      businessLogo: initialData.businessLogo || '',
      categories: initialData?.Categories ? initialData.Categories.map((c) => c.id) : [],
      businessAddressLine1: initialData.businessAddressLine1 || '',
      businessAddressLine2: initialData.businessAddressLine2 || '',
      businessCity: initialData.businessCity || '',
      businessState: initialData.businessState || '',
      businessPostalCode: initialData.businessPostalCode || '',
      businessCountry: initialData.businessCountry || 'India',
      businessSameAsPermanent: !!initialData.businessSameAsPermanent,
      latitude: initialData.latitude || null,
      longitude: initialData.longitude || null,
    });
    if (initialData.latitude && initialData.longitude) {
      setLocationCaptured(true);
    }
  }, [initialData]);

  useEffect(() => {
    fetchCategories().then(setAvailableCategories);
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const updatedData = await updateProducerProfile(form);

      let hasChanged = false;

      if (
        updatedData.businessName &&
        updatedData.businessName !== localStorage.getItem("businessName")
      ) {
        localStorage.setItem("businessName", updatedData.businessName);
        hasChanged = true;
      }
      if (
        updatedData.businessLogo &&
        updatedData.businessLogo !== localStorage.getItem("businessLogo")
      ) {
        localStorage.setItem("businessLogo", updatedData.businessLogo);
        hasChanged = true;
      }

      if (hasChanged) {
        window.dispatchEvent(new Event("localStorageUpdate"));
      }

      toast.success("Profile updated successfully");
      onProfileUpdated(updatedData);
      onClose();
    } catch (err) {
      toast.error(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      border: '1px solid #d1d5db',
      borderRadius: '10px',
      padding: '2px 6px',
      boxShadow: 'none',
      fontSize: '14px',
      minHeight: '42px',
      '&:hover': {
        borderColor: '#10b981'
      },
      '&:focus-within': {
        borderColor: '#10b981',
        boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.1)'
      }
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#d1fae5',
      borderRadius: '6px',
      fontSize: '13px',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#065f46',
      fontWeight: '500',
      fontSize: '13px',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#065f46',
      '&:hover': {
        backgroundColor: '#a7f3d0',
        color: '#064e3b'
      }
    }),
    menu: (base) => ({
      ...base,
      fontSize: '14px',
      maxHeight: '200px', // Reduced height for dropdown
      overflow: 'hidden',
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: '110px', // Reduced height for the list
      overflowY: 'auto',
      padding: '4px',
      '&::-webkit-scrollbar': {
        width: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f5f9',
        borderRadius: '3px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#cbd5e1',
        borderRadius: '3px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: '#94a3b8',
      }
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '13px',
      padding: '8px 12px',
      backgroundColor: state.isSelected ? '#10b981' : state.isFocused ? '#d1fae5' : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      '&:active': {
        backgroundColor: state.isSelected ? '#10b981' : '#a7f3d0'
      }
    })
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl shadow-2xl relative flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <FaUser className="text-white text-sm" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Update Business Profile</h2>
                <p className="text-green-100 text-xs">Keep your farm business information up to date</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <FaTimes size={16} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-white">
          <div className="flex overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveSection('basic')}
              className={`flex items-center gap-1 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                activeSection === 'basic'
                  ? 'border-green-600 text-green-700 bg-green-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaUser className="text-xs" />
              Basic Info
            </button>
            <button
              onClick={() => setActiveSection('address')}
              className={`flex items-center gap-1 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                activeSection === 'address'
                  ? 'border-green-600 text-green-700 bg-green-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaMapMarkerAlt className="text-xs" />
              Address
            </button>
            <button
              onClick={() => setActiveSection('categories')}
              className={`flex items-center gap-1 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                activeSection === 'categories'
                  ? 'border-green-600 text-green-700 bg-green-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaLeaf className="text-xs" />
              Categories
            </button>
          </div>
        </div>

        {/* Content Area with Hidden Scrollbar */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
          {/* Basic Information Section */}
          {activeSection === 'basic' && (
            <div className="space-y-4">
              {/* Logo Upload */}
              <div className="flex flex-col items-center text-center mb-4">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-20 h-20 rounded-xl border-2 border-green-100 shadow-md overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50">
                    <Image
                      src={
                        form.businessLogo instanceof File
                          ? URL.createObjectURL(form.businessLogo)
                          : form.businessLogo || "/placeholder.png"
                      }
                      alt="Business Logo"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <FaEdit className="text-white text-sm" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-green-600 text-white p-1 rounded-full shadow">
                    <FaEdit className="text-xs" />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setForm((prev) => ({ ...prev, businessLogo: file }));
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">Click to upload business logo</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <FaBuilding className="text-green-600 text-xs" />
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    placeholder="Enter your farm/business name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <FaPhone className="text-green-600 text-xs" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    placeholder="Your contact number"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <FaEnvelope className="text-green-600 text-xs" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
                  />
                </div>

                {/* Change Password CTA */}
                <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center">
                      <FaLock className="text-xs" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-emerald-900">Change Password</div>
                      <div className="text-xs text-emerald-800">Update your security credentials</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPwdModal(true)}
                    className="px-3 py-1.5 text-xs rounded-lg text-white font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Business Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Tell customers about your farm, products, and farming practices..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all resize-none text-gray-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Address Section */}
          {activeSection === 'address' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-2">
                  <FaMapMarkerAlt className="text-blue-600 text-sm mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Business Address</h4>
                    <p className="text-xs text-blue-700">This address will be shown to customers for delivery and pickup</p>
                  </div>
                  <button
                    type="button"
                    onClick={captureLocation}
                    disabled={capturingLocation || locationCaptured}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold transition-all whitespace-nowrap ${
                      locationCaptured
                        ? 'bg-green-100 text-green-700 border border-green-300 cursor-not-allowed'
                        : capturingLocation
                        ? 'bg-blue-500 text-white cursor-wait'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-90`}
                  >
                    {capturingLocation ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Capturing...
                      </>
                    ) : locationCaptured ? (
                      <>
                        <FaCheck className="w-3 h-3" />
                        Captured
                      </>
                    ) : (
                      <>
                        <FaMapMarkerAlt className="w-3 h-3" />
                        Capture Location
                      </>
                    )}
                  </button>
                </div>
              </div>
              {locationCaptured && form.latitude && form.longitude && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-xs text-green-800 flex items-center justify-between">
                  <span>
                    <strong>Farm Location:</strong> {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setForm(prev => ({ ...prev, latitude: null, longitude: null }));
                      setLocationCaptured(false);
                      toast.info("Location cleared. You can capture a new location now.");
                    }}
                    className="ml-2 p-1 hover:bg-green-200 rounded-full transition-colors"
                    title="Clear location"
                  >
                    <FaTimes className="text-green-700 text-xs" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address Line 1 *</label>
                  <input
                    value={form.businessAddressLine1}
                    onChange={(e) => setForm({ ...form, businessAddressLine1: e.target.value })}
                    placeholder="Street address, farm name, or location"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
                  <input
                    value={form.businessAddressLine2}
                    onChange={(e) => setForm({ ...form, businessAddressLine2: e.target.value })}
                    placeholder="Landmark, building, or additional details"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                    <input
                      value={form.businessCity}
                      onChange={(e) => setForm({ ...form, businessCity: e.target.value })}
                      placeholder="City or town"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State *</label>
                    <input
                      value={form.businessState}
                      onChange={(e) => setForm({ ...form, businessState: e.target.value })}
                      placeholder="State"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Postal Code *</label>
                    <input
                      value={form.businessPostalCode}
                      onChange={(e) => setForm({ ...form, businessPostalCode: e.target.value })}
                      placeholder="PIN code"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Country *</label>
                    <input
                      value={form.businessCountry}
                      onChange={(e) => setForm({ ...form, businessCountry: e.target.value })}
                      placeholder="Country"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border text-xs">
                  <input
                    type="checkbox"
                    id="sameAddress"
                    checked={form.businessSameAsPermanent}
                    onChange={(e) => setForm({ ...form, businessSameAsPermanent: e.target.checked })}
                    className="w-3 h-3 text-green-600 rounded focus:ring-green-500"
                  />
                  <label htmlFor="sameAddress" className="text-gray-700">
                    Use permanent address as business address
                  </label>
                </div>

                {/* Permanent Address Display */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                  <h4 className="text-xs font-medium text-green-800 mb-1 flex items-center gap-1">
                    <FaUser className="text-green-600 text-xs" />
                    Your Permanent Address
                  </h4>
                  <div className="text-xs text-gray-700 bg-white p-2 rounded border">
                    {[initialData.addressLine1, initialData.addressLine2, initialData.city, initialData.state, initialData.postalCode, initialData.country].filter(Boolean).join(', ') || 'No permanent address set'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Categories Section */}
          {activeSection === 'categories' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-2">
                  <FaLeaf className="text-green-600 text-sm mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-green-800 mb-1">Business Categories</h4>
                    <p className="text-xs text-green-700">Select categories that describe your farm products</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Select Categories</label>
                <Select
                  isMulti
                  options={availableCategories.map((cat) => ({ value: cat.id, label: cat.name }))}
                  value={availableCategories.filter((cat) => form.categories.includes(cat.id)).map((cat) => ({ value: cat.id, label: cat.name }))}
                  onChange={(selected) => {
                    const selectedIds = selected.map((s) => s.value);
                    setForm({ ...form, categories: selectedIds });
                  }}
                  placeholder="Search and select categories..."
                  styles={customSelectStyles}
                  className="text-sm"
                  classNamePrefix="react-select"
                />
                <p className="text-xs text-gray-500 mt-2">Choose relevant categories for your farm business</p>
              </div>

              {/* Selected Categories Preview */}
              {form.categories.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <h4 className="text-xs font-medium text-blue-800 mb-2">Selected Categories</h4>
                  <div className="flex flex-wrap gap-1">
                    {availableCategories
                      .filter(cat => form.categories.includes(cat.id))
                      .map(cat => (
                        <span key={cat.id} className="px-2 py-1 bg-white border border-blue-200 rounded text-xs font-medium text-blue-700 shadow-sm">
                          {cat.name}
                        </span>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4 rounded-b-xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-xs text-gray-500">
              Step {activeSection === 'basic' ? '1' : activeSection === 'address' ? '2' : '3'} of 3
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              {activeSection !== 'categories' ? (
                <button
                  onClick={() => setActiveSection(activeSection === 'basic' ? 'address' : 'categories')}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-md font-medium transition-all flex items-center justify-center gap-1"
                >
                  Continue
                  <span>→</span>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`flex-1 sm:flex-none px-4 py-2 text-sm rounded-lg text-white font-medium transition-all flex items-center justify-center gap-1 ${
                    loading
                      ? 'bg-green-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-md'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaUser className="text-xs" />
                      Update Profile
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPwdModal && (
       <ChangePasswordModal mode="producer" onClose={() => setShowPwdModal(false)} />
      )}
 
       {/* Custom CSS for hidden scrollbar */}
       <style jsx>{`
         .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Custom scrollbar for the select dropdown */
        .react-select__menu-list {
          max-height: 180px !important;
          overflow-y: auto !important;
        }
        
        .react-select__menu-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .react-select__menu-list::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        
        .react-select__menu-list::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        .react-select__menu-list::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
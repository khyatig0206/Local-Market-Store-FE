"use client";
import React, { useEffect, useState } from "react";
import { FaMapMarkerAlt, FaTimes, FaEdit, FaPlus, FaCheck, FaMapPin, FaUser, FaPhone, FaHome } from "react-icons/fa";
import { toast } from "react-toastify";
import { useTranslations } from 'next-intl';

const AddressModal = ({
  isOpen,
  onClose,
  onSave,
  addressData,
  isEditing,
  isLoading,
  addressesCount
}) => {
  const t = useTranslations();
  const [formData, setFormData] = useState({
    label: "",
    customLabel: "",
    contactName: "",
    contactPhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    isDefault: false,
    latitude: null,
    longitude: null,
  });
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState(false);

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
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));
        setLocationCaptured(true);
        setCapturingLocation(false);
        toast.success("Location captured successfully!");
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
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  };

  // Initialize form when modal opens or addressData changes
  useEffect(() => {
    if (isOpen) {
      if (isEditing && addressData) {
        const isCustomLabel = addressData.label && !['Home', 'Office'].includes(addressData.label);
        setFormData({
          label: isCustomLabel ? 'Other' : (addressData.label || ""),
          customLabel: isCustomLabel ? addressData.label : "",
          contactName: addressData.contactName || "",
          contactPhone: addressData.contactPhone || "",
          addressLine1: addressData.addressLine1 || "",
          addressLine2: addressData.addressLine2 || "",
          city: addressData.city || "",
          state: addressData.state || "",
          postalCode: addressData.postalCode || "",
          country: addressData.country || "India",
          isDefault: !!addressData.isDefault,
          latitude: addressData.latitude || null,
          longitude: addressData.longitude || null,
        });
        setLocationCaptured(!!(addressData.latitude && addressData.longitude));
      } else {
        setFormData({
          label: "",
          customLabel: "",
          contactName: "",
          contactPhone: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          postalCode: "",
          country: "India",
          isDefault: addressesCount === 0, // Auto-set as default if no addresses
          latitude: null,
          longitude: null,
        });
        setLocationCaptured(false);
      }
    }
  }, [isOpen, isEditing, addressData, addressesCount]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.latitude || !formData.longitude) {
      toast.error("Please capture your location before saving the address");
      return;
    }

    const dataToSave = {
      ...formData,
      label: formData.label === 'Other' ? formData.customLabel : formData.label
    };
    onSave(dataToSave);
  };

  const resetLocation = () => {
    setFormData(prev => ({ ...prev, latitude: null, longitude: null }));
    setLocationCaptured(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              {isEditing ? <FaEdit className="text-white" /> : <FaPlus className="text-white" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {isEditing ? t('account.addressModal.titleEdit') : t('account.addressModal.titleAdd')}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditing ? t('account.addressModal.subtitleEdit') : t('account.addressModal.subtitleAdd')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FaTimes className="text-gray-500 text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            {/* Auto Capture Location */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 text-sm mb-1 flex items-center gap-2">
                    <FaMapMarkerAlt className="w-4 h-4" />
                    Auto-detect Location *
                  </h4>
                  <p className="text-xs text-blue-700">Capture your current location for accurate delivery (Required)</p>
                </div>
                <div className="flex items-center gap-2">
                  {locationCaptured && (
                    <button
                      type="button"
                      onClick={resetLocation}
                      className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                      title="Reset location"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={captureLocation}
                    disabled={capturingLocation || locationCaptured}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
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
                        <FaCheck className="w-4 h-4" />
                        Captured
                      </>
                    ) : (
                      <>
                        <FaMapMarkerAlt className="w-4 h-4" />
                        Capture Now
                      </>
                    )}
                  </button>
                </div>
              </div>
              {locationCaptured && formData.latitude && formData.longitude && (
                <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                  <strong>Location:</strong> {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('account.addressModal.label')} *
                </label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  value={formData.label}
                  onChange={(e) => setFormData(f => ({ ...f, label: e.target.value, customLabel: e.target.value === 'Other' ? f.customLabel : '' }))}
                  required
                >
                  <option value="">{t('account.addressModal.labelCustom')}</option>
                  <option value="Home">{t('account.addressModal.labelHome')}</option>
                  <option value="Office">Office</option>
                  <option value="Other">{t('account.addressModal.labelOther')}</option>
                </select>
              </div>
              {formData.label === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Label *
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    value={formData.customLabel}
                    onChange={(e) => setFormData(f => ({ ...f, customLabel: e.target.value }))}
                    placeholder="Enter custom label"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('account.addressModal.contactName')} *
                </label>
                <input
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  value={formData.contactName}
                  onChange={(e) => setFormData(f => ({ ...f, contactName: e.target.value }))}
                  placeholder={t('account.addressModal.fullNamePlaceholder')}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('account.addressModal.contactPhone')} *
              </label>
              <input
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                value={formData.contactPhone}
                onChange={(e) => setFormData(f => ({ ...f, contactPhone: e.target.value }))}
                placeholder={t('account.addressModal.phonePlaceholder')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('account.addressModal.addressLine1')} *
              </label>
              <input
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                value={formData.addressLine1}
                onChange={(e) => setFormData(f => ({ ...f, addressLine1: e.target.value }))}
                placeholder={t('account.addressModal.addressLine1Placeholder')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('account.addressModal.addressLine2')}
              </label>
              <input
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                value={formData.addressLine2}
                onChange={(e) => setFormData(f => ({ ...f, addressLine2: e.target.value }))}
                placeholder={t('account.addressModal.addressLine2Placeholder')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('account.addressModal.city')} *
                </label>
                <input
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  value={formData.city}
                  onChange={(e) => setFormData(f => ({ ...f, city: e.target.value }))}
                  placeholder={t('account.addressModal.city')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('account.addressModal.state')} *
                </label>
                <input
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  value={formData.state}
                  onChange={(e) => setFormData(f => ({ ...f, state: e.target.value }))}
                  placeholder={t('account.addressModal.state')}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('account.addressModal.postalCode')} *
                </label>
                <input
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  value={formData.postalCode}
                  onChange={(e) => setFormData(f => ({ ...f, postalCode: e.target.value }))}
                  placeholder={t('account.addressModal.postalCodePlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('account.addressModal.country')} *
                </label>
                <input
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  value={formData.country}
                  onChange={(e) => setFormData(f => ({ ...f, country: e.target.value }))}
                  required
                />
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className="rounded text-green-600 focus:ring-green-500 w-4 h-4"
                checked={formData.isDefault}
                onChange={(e) => setFormData(f => ({ ...f, isDefault: e.target.checked }))}
              />
              {t('account.addressModal.setDefault')}
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              {t('account.addressModal.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isEditing ? t('account.addressModal.updating') : t('account.addressModal.adding')}
                </>
              ) : (
                <>
                  <FaCheck />
                  {isEditing ? t('account.addressModal.update') : t('account.addressModal.add')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressModal;
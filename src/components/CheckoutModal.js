"use client";
import React, { useEffect, useState } from "react";
import { FaShoppingBag, FaTimes, FaMapMarkerAlt, FaBookmark, FaUser, FaPhone, FaHome, FaMapPin, FaCreditCard, FaCheck, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { listAddresses, createAddress, updateAddress } from "@/lib/api/addresses";
import { useTranslations } from 'next-intl';
import { toast } from "react-toastify";
import AddressModal from "./AddressModal";

export default function CheckoutModal({
  open,
  onClose,
  title = "Checkout",
  itemsPreview = [], // [{ title, quantity, price }]
  total = 0,
  onConfirm, // async (payload) => {}
}) {
  const t = useTranslations();
  const [paymentMethod, setPaymentMethod] = useState("COD");
  // Address state - now using addresses from API
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addrSaving, setAddrSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const list = await listAddresses();
        setAddresses(Array.isArray(list) ? list : []);
        const def = (list || []).find(a => a.isDefault) || ((Array.isArray(list) && list.length > 0) ? list[0] : null);
        if (def) {
          setSelectedAddressId(String(def.id));
        }
      } catch {}
    })();
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!selectedAddressId) {
      // Parent should toast on validation failure
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm?.({
        addressId: selectedAddressId,
        paymentMethod,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const startAddAddress = () => {
    setEditingAddress(null);
    setShowAddressModal(true);
  };

  const startEditAddress = (address) => {
    setEditingAddress(address);
    setShowAddressModal(true);
  };

  const closeAddressModal = () => {
    setShowAddressModal(false);
    setEditingAddress(null);
  };

  const handleSaveAddress = async (addressData) => {
    setAddrSaving(true);
    try {
      const saved = editingAddress
        ? await updateAddress(editingAddress.id, addressData)
        : await createAddress(addressData);

      // Refresh addresses
      const list = await listAddresses();
      setAddresses(Array.isArray(list) ? list : []);

      // Auto-select if it's the first address or if it was set as default
      if (addressData.isDefault || addresses.length === 0) {
        setSelectedAddressId(String(saved.id));
      }

      closeAddressModal();
    } catch (err) {
      throw err; // Let the modal handle the error
    } finally {
      setAddrSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col text-gray-800">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-green-700 to-emerald-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <FaShoppingBag className="text-white text-lg" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <p className="text-green-100 text-sm mt-1">Complete your order details</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors">
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-900 text-lg">Order Summary</h4>
                <p className="text-sm text-gray-700">{itemsPreview.length} item(s)</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-700">₹{Number(total || 0).toFixed(2)}</div>
                <div className="text-xs text-gray-600">Total Amount</div>
              </div>
            </div>
            <div className="space-y-2 mt-3">
              {itemsPreview.slice(0,3).map((it, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm text-gray-800">
                  <div className="w-8 h-8 bg-white rounded border flex items-center justify-center">
                    <span className="text-xs font-medium">{it.quantity}</span>
                  </div>
                  <span className="flex-1 truncate">{it.title}</span>
                  <span className="text-green-700 font-medium">₹{Number(it.quantity * it.price).toFixed(2)}</span>
                </div>
              ))}
              {itemsPreview.length > 3 && (
                <div className="text-center text-xs text-gray-600 pt-2">
                  +{itemsPreview.length - 3} more items
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-green-600 text-lg" />
              <h4 className="font-semibold text-gray-900 text-lg">Shipping Address</h4>
            </div>

            {/* Address Book Header with Add Button */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-lg">
                {t('account.addressBook')} ({addresses.length})
              </h3>
              <button
                onClick={startAddAddress}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md text-sm"
              >
                <FaPlus className="text-sm" />
                Add New
              </button>
            </div>

            {/* Saved Addresses List */}
           <div className="space-y-4 max-h-96 overflow-y-auto">
  {Array.isArray(addresses) && addresses.length > 0 ? addresses.map((a) => (
    <div 
      key={a.id} 
      className={`border-2 rounded-xl p-4 hover:shadow-md transition-all duration-200 bg-white cursor-pointer ${
        selectedAddressId === String(a.id) 
          ? 'border-green-500 bg-green-50 shadow-sm' 
          : 'border-gray-200 hover:border-green-300'
      }`}
      onClick={() => setSelectedAddressId(String(a.id))}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {a.label === "Home" ? (
              <FaHome className={`flex-shrink-0 ${
                selectedAddressId === String(a.id) ? 'text-green-600' : 'text-green-500'
              }`} />
            ) : a.label === "Office" ? (
              <FaBookmark className={`flex-shrink-0 ${
                selectedAddressId === String(a.id) ? 'text-blue-600' : 'text-blue-500'
              }`} />
            ) : (
              <FaMapMarkerAlt className={`flex-shrink-0 ${
                selectedAddressId === String(a.id) ? 'text-gray-600' : 'text-gray-500'
              }`} />
            )}
            <span className={`font-semibold truncate ${
              selectedAddressId === String(a.id) ? 'text-green-800' : 'text-gray-900'
            }`}>
              {a.label || "Saved Address"}
            </span>
            {a.isDefault && (
              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full flex-shrink-0">
                <FaCheck className="text-xs"/> {t('account.default')}
              </span>
            )}
            <div className="relative flex items-center ml-2">
              <input
                type="radio"
                name="selectedAddress"
                checked={selectedAddressId === String(a.id)}
                onChange={() => setSelectedAddressId(String(a.id))}
                className="sr-only" // Hide the default radio, we'll style the container instead
              />
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedAddressId === String(a.id) 
                  ? 'border-green-500 bg-green-500' 
                  : 'border-gray-400'
              }`}>
                {selectedAddressId === String(a.id) && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
            </div>
          </div>
          <div className={`text-sm mb-1 ${
            selectedAddressId === String(a.id) ? 'text-green-700' : 'text-gray-700'
          }`}>
            <strong className="break-words">{a.contactName}</strong> • {a.contactPhone}
          </div>
          <div className={`text-sm leading-relaxed break-words ${
            selectedAddressId === String(a.id) ? 'text-green-600' : 'text-gray-600'
          }`}>
            {a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ""}, {a.city}, {a.state} {a.postalCode}, {a.country}
          </div>
        </div>
        <div 
          className="flex items-center gap-1 flex-shrink-0"
          onClick={(e) => e.stopPropagation()} // Prevent address selection when clicking edit
        >
          <button
            className={`p-2 rounded-lg border transition-colors ${
              selectedAddressId === String(a.id)
                ? 'border-green-300 text-green-700 hover:bg-green-100'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => startEditAddress(a)}
            title="Edit address"
          >
            <FaEdit className="text-sm"/>
          </button>
        </div>
      </div>
    </div>
  )) : (
    <div className="text-center py-8 text-gray-500">
      <FaMapMarkerAlt className="text-4xl text-gray-300 mx-auto mb-3" />
      <p className="text-lg font-medium">{t('account.noSavedAddresses')}</p>
      <p className="text-sm text-gray-400 mt-1">{t('account.addYourFirstAddress')}</p>
      <button
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
        onClick={startAddAddress}
      >
        <FaPlus />
        Add Your First Address
      </button>
    </div>
  )}
</div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FaCreditCard className="text-green-600 text-lg" />
              <h4 className="font-semibold text-gray-900 text-lg">Payment Method</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                paymentMethod === 'COD' 
                  ? 'border-green-500 bg-green-50 shadow-sm' 
                  : 'border-gray-200 hover:border-green-300'
              }`}>
                <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="hidden" />
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'COD' ? 'border-green-500 bg-green-500' : 'border-gray-400'
                  }`}>
                    {paymentMethod === 'COD' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Cash on Delivery</div>
                    <div className="text-xs text-gray-700 mt-1">Pay when delivered</div>
                  </div>
                </div>
              </label>
              
              <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                paymentMethod === 'PREPAID' 
                  ? 'border-green-500 bg-green-50 shadow-sm' 
                  : 'border-gray-200 hover:border-green-300'
              }`}>
                <input type="radio" name="payment" value="PREPAID" checked={paymentMethod === 'PREPAID'} onChange={() => setPaymentMethod('PREPAID')} className="hidden" />
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'PREPAID' ? 'border-green-500 bg-green-500' : 'border-gray-400'
                  }`}>
                    {paymentMethod === 'PREPAID' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Prepaid (Online)</div>
                    <div className="text-xs text-gray-700 mt-1">Pay online now</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 p-6">
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-900 rounded-xl hover:bg-gray-50 font-medium transition-colors">
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={submitting || !selectedAddressId} className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              <FaShoppingBag />
              {submitting ? 'Placing...' : `Place Order - ₹${Number(total||0).toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
      <AddressModal
        isOpen={showAddressModal}
        onClose={closeAddressModal}
        onSave={handleSaveAddress}
        addressData={editingAddress}
        isEditing={!!editingAddress}
        isLoading={addrSaving}
        addressesCount={addresses.length}
      />
    </div>
    
  );

}
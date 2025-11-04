"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from 'next-intl';
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FaUser, FaSave, FaPlus, FaTrash, FaEdit, FaCheck, FaKey, FaMapMarkerAlt, FaSignOutAlt, FaShoppingBag, FaShieldAlt, FaHome, FaBuilding, FaTimes, FaShoppingCart, FaComments } from "react-icons/fa";
import { listAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from "@/lib/api/addresses";
import { getCurrentUser, updateUser } from "@/lib/api/users";
import Link from "next/link";
import ChangePasswordModal from '@/components/ChangePasswordModal';
import AddressModal from "@/components/AddressModal";
// Delete Confirmation Dialog Component
const DeleteConfirmationDialog = ({ isOpen, onClose, onConfirm, addressLabel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <FaTrash className="text-red-600 text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Delete Address</h3>
            <p className="text-sm text-gray-600">This action cannot be undone</p>
          </div>
        </div>
        
        <p className="text-gray-700 mb-6">
          Are you sure you want to delete the address "{addressLabel}"?
        </p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
          >
            Delete Address
          </button>
        </div>
      </div>
    </div>
  );
};


export default function AccountPage() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [addrSaving, setAddrSaving] = useState(false);

  // Modal states
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Profile
  const [profile, setProfile] = useState({ username: "", email: "" });
  const [initialProfile, setInitialProfile] = useState({ username: "", email: "" });

  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deletingAddress, setDeletingAddress] = useState(null);

  // Open modals
  const startAddAddress = () => {
    setEditingAddress(null);
    setShowAddressModal(true);
  };

  const startEditAddress = (address) => {
    setEditingAddress(address);
    setShowAddressModal(true);
  };

  const openDeleteDialog = (address) => {
    setDeletingAddress(address);
    setShowDeleteDialog(true);
  };

  // Close modals
  const closeAddressModal = () => {
    setShowAddressModal(false);
    setEditingAddress(null);
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeletingAddress(null);
  };

  useEffect(() => {
    async function boot() {
      try {
        setLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;
        if (!token) { router.replace("/signin"); return; }

        const [me, list] = await Promise.all([
          getCurrentUser().catch(() => null),
          listAddresses().catch(() => []),
        ]);
        if (me) {
          const p = { username: me.username || "", email: me.email || "" };
          setProfile(p);
          setInitialProfile(p);
        }
        setAddresses(Array.isArray(list) ? list : []);
      } catch (e) {
        if (e?.status === 401 || e?.code === "UNAUTHORIZED") {
          router.replace("/signin");
          return;
        }
      } finally {
        setLoading(false);
      }
    }
    boot();
  }, [router]);

  const hasProfileChanges = useMemo(() => {
    return profile.username !== initialProfile.username;
  }, [profile, initialProfile]);

  async function handleSaveProfile() {
    try {
      setProfileSaving(true);
      const res = await updateUser({
        username: profile.username,
      });
      toast.success("Profile updated successfully");
      setInitialProfile(prev => ({ ...prev, username: profile.username }));
    } catch (e) {
      if (e?.status === 401 || e?.code === "UNAUTHORIZED") { router.replace("/signin"); return; }
      toast.error(e?.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSaveAddress(formData) {
    const required = ["contactName", "contactPhone", "addressLine1", "city", "state", "postalCode", "country"];
    for (const k of required) {
      if (!String(formData[k] || "").trim()) {
        toast.error("Please complete all required address fields");
        return;
      }
    }
    try {
      setAddrSaving(true);
      if (editingAddress) {
        await updateAddress(editingAddress.id, formData);
        toast.success("Address updated successfully");
      } else {
        await createAddress(formData);
        toast.success("Address added successfully");
      }
      const list = await listAddresses();
      setAddresses(Array.isArray(list) ? list : []);
      closeAddressModal();
    } catch (e) {
      if (e?.status === 401 || e?.code === "UNAUTHORIZED") { router.replace("/signin"); return; }
      toast.error(e?.message || "Failed to save address");
    } finally {
      setAddrSaving(false);
    }
  }

  async function handleDeleteAddress() {
    if (!deletingAddress) return;
    
    try {
      await deleteAddress(deletingAddress.id);
      toast.success("Address deleted successfully");
      setAddresses(addrs => addrs.filter(a => a.id !== deletingAddress.id));
      closeDeleteDialog();
    } catch (e) {
      if (e?.status === 401 || e?.code === "UNAUTHORIZED") { router.replace("/signin"); return; }
      toast.error(e?.message || "Failed to delete address");
    }
  }

  async function handleSetDefault(id) {
    try {
      await setDefaultAddress(id);
      toast.success("Default address set successfully");
      const list = await listAddresses();
      setAddresses(Array.isArray(list) ? list : []);
    } catch (e) {
      if (e?.status === 401 || e?.code === "UNAUTHORIZED") { router.replace("/signin"); return; }
      toast.error(e?.message || "Failed to set default address");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-100 py-6 px-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="leaves" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M20,40 C30,20 50,20 60,40 C50,60 30,60 20,40 Z" fill="currentColor" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#leaves)" className="text-green-600"/>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Updated Compact Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaUser className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-green-800">{t('account.title')}</h1>
              <p className="text-green-600 text-sm md:text-base">{t('account.manageProfile')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/cart"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-green-200 text-green-700 hover:bg-green-50 transition-all shadow-sm hover:shadow-md"
            >
              <FaShoppingCart className="text-green-600" />
              <span className="hidden sm:inline font-medium">{t('account.cart')}</span>
            </Link>
            
            <Link 
              href="/orders"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-green-200 text-green-700 hover:bg-green-50 transition-all shadow-sm hover:shadow-md"
            >
              <FaShoppingBag className="text-green-600" />
              <span className="hidden sm:inline font-medium">{t('account.orders')}</span>
            </Link>
            
            <button
              onClick={() => {
                try {
                  localStorage.removeItem('userToken');
                  localStorage.setItem('cartCount', '0');
                  window.dispatchEvent(new Event('cartCountUpdate'));
                } catch {}
                router.replace('/signin');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all shadow-sm hover:shadow-md"
            >
              <FaSignOutAlt />
              <span className="hidden sm:inline font-medium">{t('account.logout')}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-green-400 h-12 w-12"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-green-400 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-green-400 rounded"></div>
                  <div className="h-4 bg-green-400 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Quick Links */}
            <div className="space-y-6">
              {/* Quick Links Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaUser className="text-green-600" />
                  {t('account.quickLinks')}
                </h3>
                <div className="space-y-3">
                  <Link 
                    href="/cart" 
                    className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors group"
                  >
                    <FaShoppingCart className="text-green-600 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">{t('account.cart')}</span>
                  </Link>
                  
                  <Link 
                    href="/orders" 
                    className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors group"
                  >
                    <FaShoppingBag className="text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">{t('account.orders')}</span>
                  </Link>
                  
                  <Link 
                    href="/disputes" 
                    className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 transition-colors group"
                  >
                    <FaComments className="text-purple-600 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">{t('account.disputesSupport')}</span>
                  </Link>
                  
                  <Link 
                    href="/help" 
                    className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 transition-colors group"
                  >
                    <FaShieldAlt className="text-orange-600 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">{t('account.helpCenter')}</span>
                  </Link>
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white">
                <div className="text-center">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <FaUser className="text-base" />
                  </div>
                  <h3 className="font-bold text-base mb-1">{t('account.accountStatus')}</h3>
                  <div className="bg-white/20 rounded-full px-2 py-0.5 text-xs font-medium">
                    {t('account.verifiedUser')}
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: Profile */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <FaUser className="text-white text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{t('account.profileInformation')}</h2>
                    <p className="text-gray-600 text-sm">{t('account.updatePersonalDetails')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('account.fullName')}</label>
                    <input
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white text-gray-500"
                      type="text"
                      value={profile.username}
                      onChange={(e)=> setProfile(p=> ({...p, username: e.target.value}))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('account.emailAddress')}</label>
                    <input
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                      type="email"
                      value={profile.email}
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('account.emailLocked')}</p>
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                  <button
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                      hasProfileChanges 
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    onClick={handleSaveProfile}
                    disabled={!hasProfileChanges || profileSaving}
                  >
                    {profileSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave />
                        {t('account.saveChanges')}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Change Password CTA - Updated Version */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center justify-center">
                      <FaKey className="text-sm" />
                    </div>
                    <div>
                      <div className="font-semibold text-green-900">{t('account.accountSecurity')}</div>
                      <div className="text-xs text-green-700">{t('account.updateSecurity')}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPwdModal(true)}
                    className="px-4 py-2 text-sm rounded-lg text-white font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all"
                  >
                    {t('account.changePassword')}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Address Book */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                      <FaMapMarkerAlt className="text-white text-xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{t('account.addressBook')}</h2>
                      <p className="text-gray-600 text-sm">{t('account.manageAddresses')}</p>
                    </div>
                  </div>
                  <button 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                    onClick={startAddAddress}
                  >
                    <FaPlus/>
                    {t('account.newAddress')}
                  </button>
                </div>

                {/* Saved Addresses List */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <h3 className="font-semibold text-gray-800 text-lg">{t('account.addressBook')} ({addresses.length})</h3>
                  
                  {Array.isArray(addresses) && addresses.length > 0 ? addresses.map((a)=> (
                    <div key={a.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {a.label === "Home" ? (
                              <FaHome className="text-green-600 flex-shrink-0" />
                            ) : a.label === "Work" ? (
                              <FaBuilding className="text-blue-600 flex-shrink-0" />
                            ) : (
                              <FaMapMarkerAlt className="text-gray-600 flex-shrink-0" />
                            )}
                            <span className="font-semibold text-gray-900 truncate">{a.label || "Saved Address"}</span>
                            {a.isDefault && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full flex-shrink-0">
                              <FaCheck className="text-xs"/> {t('account.default')}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-700 mb-1">
                            <strong className="break-words">{a.contactName}</strong> • {a.contactPhone}
                          </div>
                          <div className="text-sm text-gray-600 leading-relaxed break-words">
                            {a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ""}, {a.city}, {a.state} {a.postalCode}, {a.country}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!a.isDefault && (
                            <button 
                              className="p-2 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 transition-colors"
                              onClick={()=>handleSetDefault(a.id)}
                              title="Set as default"
                            >
                              <FaCheck className="text-sm" />
                            </button>
                          )}
                          <button 
                            className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={()=> startEditAddress(a)}
                            title="Edit address"
                          >
                            <FaEdit className="text-sm"/>
                          </button>
                          <button 
                            className="p-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                            onClick={()=> openDeleteDialog(a)}
                            title="Delete address"
                          >
                            <FaTrash className="text-sm"/>
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
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPwdModal && (
          <ChangePasswordModal onClose={() => setShowPwdModal(false)} />
        )}

        {/* Address Modal */}
        <AddressModal
          isOpen={showAddressModal}
          onClose={closeAddressModal}
          onSave={handleSaveAddress}
          addressData={editingAddress}
          isEditing={!!editingAddress}
          isLoading={addrSaving}
          addressesCount={addresses.length}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={closeDeleteDialog}
          onConfirm={handleDeleteAddress}
          addressLabel={deletingAddress?.label || "this address"}
        />
      </div>
    </div>
  );
}
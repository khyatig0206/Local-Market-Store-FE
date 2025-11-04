"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchCategories, signUpProducer, signInProducer } from "@/lib/api/producers";
import Select from "react-select";
import { toast } from "react-toastify";
import Link from "next/link";
import { FaEdit, FaPlus, FaMapMarkerAlt, FaIdCard, FaCheck, FaTimes, FaUser, FaEnvelope, FaLock, FaPhone, FaStore, FaLeaf, FaHome } from "react-icons/fa";
import { GiFarmer } from "react-icons/gi";
import Image from 'next/image';
import { useTranslations } from "next-intl";

export default function SignUp() {
  const t = useTranslations();
  const [availableCategories, setAvailableCategories] = useState([]);
  const fileInputRef = useRef(null);
  const aadhaarInputRef = useRef(null);
  const idInputRef = useRef(null);
  const addrProofInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    businessName: "",
    phoneNumber: "",
    description: "",
    businessLogo: "",
    categories: [],
    aadharImages: [],
    businessAddressLine1: "",
    businessAddressLine2: "",
    businessCity: "",
    businessState: "",
    businessPostalCode: "",
    businessCountry: "India",
    businessSameAsPermanent: false,
    idDocuments: [],
    addressProofs: [],
    latitude: null,
    longitude: null,
  });
  const [aadhaarFiles, setAadhaarFiles] = useState([]);
  const [idFiles, setIdFiles] = useState([]);
  const [addressFiles, setAddressFiles] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [localeUI, setLocaleUI] = useState('en');
  const [permanentAddress, setPermanentAddress] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });
  const [permanentReady, setPermanentReady] = useState(false);
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

  const parseAadhaarAndStorePermanent = async (fileOrNull = null, fillBusinessIfChecked = false) => {
    const file = fileOrNull || aadhaarFiles[0];
    if (!file) {
      toast.warn(t('producerAuth.signup.toasts.uploadAadhaarFirst'));
      return false;
    }
    setParsing(true);
    try {
      const { parseAadhaarAddress } = await import('@/lib/api/producers');
      const result = await parseAadhaarAddress(file);

      if (!result || !result.address || !result.address.city) {
        return false;
      }

      const addr = result.address;
      const perm = {
        addressLine1: addr.addressLine1 || "",
        addressLine2: addr.addressLine2 || "",
        city: addr.city || "",
        state: addr.state || "",
        postalCode: addr.postalCode || "",
        country: addr.country || "India",
      };

      setPermanentAddress(perm);
      setPermanentReady(true);

      if (fillBusinessIfChecked) {
        setForm(prev => ({
          ...prev,
          businessAddressLine1: perm.addressLine1 || prev.businessAddressLine1,
          businessAddressLine2: perm.addressLine2 || prev.businessAddressLine2,
          businessCity: perm.city || prev.businessCity,
          businessState: perm.state || prev.businessState,
          businessPostalCode: perm.postalCode || prev.businessPostalCode,
          businessCountry: perm.country || prev.businessCountry || "India",
        }));
      }
      return true;
    } catch (e) {
      toast.error(e.message || t('producerAuth.signup.toasts.parseAadhaarFailed'));
      return false;
    } finally {
      setParsing(false);
    }
  };

  const router = useRouter();

  useEffect(() => {
    fetchCategories().then(setAvailableCategories).catch(console.error);
    try { setLocaleUI(localStorage.getItem('locale') || 'en'); } catch {}
  }, []);

  const validateForm = () => {
    if (!form.email.trim() || !form.password.trim() || !form.businessName.trim() || !form.phoneNumber.trim() || !form.description.trim()) {
      toast.error(t('producerAuth.signup.toasts.allFieldsRequired'));
      return false;
    }
    if (form.categories.length === 0) {
      toast.error(t('producerAuth.signup.toasts.selectCategory'));
      return false;
    }
    if (!form.businessSameAsPermanent) {
      if (!form.businessAddressLine1 || !form.businessCity || !form.businessState || !form.businessPostalCode) {
        toast.error(t('producerAuth.signup.toasts.fillBusinessAddressOrSame'));
        return false;
      }
    }
    if (idFiles.length === 0 || addressFiles.length === 0) {
      toast.error(t('producerAuth.signup.toasts.uploadBothKyc'));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        ...form,
        idDocuments: idFiles,
        addressProofs: addressFiles,
      };
      const result = await signUpProducer(payload);
      try {
        const login = await signInProducer({ email: form.email, password: form.password });
        localStorage.setItem("token", login.token);
        localStorage.setItem("businessName", login.producer.businessName || "");
        localStorage.setItem("businessLogo", login.producer.businessLogo || "");
        localStorage.setItem("kycStatus", login.producer.kycStatus || "pending");
        try {
          window.dispatchEvent(new Event('authUpdate'));
          window.dispatchEvent(new Event('localStorageUpdate'));
          window.dispatchEvent(new Event('kycStatusUpdate'));
        } catch {}
        toast.success(t('producerAuth.signup.toasts.signupCompleteLoggedIn'));
        const dest = (login.producer.kycStatus === "approved") ? "/producer" : "/producer/waiting";
        router.replace(dest);
      } catch (e) {
        toast.success(t('producerAuth.signup.toasts.signupSuccessPleaseLogin'));
        setTimeout(() => router.push("/producer/signin"), 800);
      }
    } catch (error) {
      toast.error(error.message || t('producerAuth.signup.toasts.signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleAadhaarFileSelect = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 4);
    setAadhaarFiles(files);
    setForm(prev => ({ ...prev, aadharImages: files }));
    
    if (files.length > 0) {
      let parsed = false;
      for (const file of files) {
        const ok = await parseAadhaarAndStorePermanent(file);
        if (ok) {
          parsed = true;
          break;
        }
      }
      if (!parsed) {
        toast.error(t('producerAuth.signup.toasts.invalidAadhaar'));
        setAadhaarFiles([]);
        setForm(prev => ({ ...prev, aadharImages: [] }));
        if (aadhaarInputRef.current) {
          aadhaarInputRef.current.value = "";
        }
      }
    }
  };

  return (
    <div className="p-2 md:p-6 lg:p-8 flex items-center justify-center">
      {/* Back to Home Button */}
      <Link 
        href="/"
        className="fixed top-4 sm:top-6 left-4 sm:left-6 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm hover:bg-green-50 text-green-700 font-semibold px-3 sm:px-4 py-2 rounded-lg border-2 border-green-600 shadow-lg transition-all hover:scale-105 text-sm"
      >
        <FaHome className="w-4 h-4" />
        <span className="hidden sm:inline">Home</span>
      </Link>

      {/* Language selector */}
      <div className="fixed top-4 sm:top-6 right-4 sm:right-6 z-50">
        <select
          aria-label="Language"
          className="border border-green-600 text-green-700 rounded-lg px-3 py-2 text-sm bg-white/90 backdrop-blur-sm shadow-lg font-medium"
          value={localeUI}
          onChange={(e) => {
            const l = e.target.value;
            setLocaleUI(l);
            try { document.cookie = `locale=${l}; path=/; max-age=31536000`; } catch {}
            try { localStorage.setItem('locale', l); } catch {}
            window.location.reload();
          }}
        >
          <option value="en">EN</option>
          <option value="hi">हिं</option>
          <option value="or">ଓଡ଼ିଆ</option>
        </select>
      </div>

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="text-center lg:text-left space-y-6">
          <div className="flex items-center justify-center lg:justify-start gap-4">
           <div className="bg-green-600 p-3 sm:p-4 rounded-2xl shadow-xl hidden sm:block">
          <GiFarmer className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-900">
                {t('producerAuth.signup.headerTitle')}
              </h1>
              <p className="text-green-700 text-base sm:text-lg mt-2 font-medium ">
                {t('producerAuth.signup.headerSubtitle')}
              </p>
            </div>
          </div>

          <div className="space-y-4 hidden sm:block">
            <div className="flex items-center gap-3 text-green-800">
              <div className="bg-green-100 p-2 rounded-lg">
                <FaLeaf className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <span className="font-semibold text-sm sm:text-base">Connect with Local Markets</span>
            </div>
            <div className="flex items-center gap-3 text-green-800">
              <div className="bg-green-100 p-2 rounded-lg">
                <FaStore className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <span className="font-semibold text-sm sm:text-base">Grow Your Business</span>
            </div>
            <div className="flex items-center gap-3 text-green-800">
              <div className="bg-green-100 p-2 rounded-lg">
                <FaUser className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <span className="font-semibold text-sm sm:text-base">Secure & Verified Platform</span>
            </div>
          </div>

          <div className="bg-green-50 rounded-2xl p-4 sm:p-6 border border-green-200 hidden sm:block">
            <p className="text-green-800 text-sm leading-relaxed">
              Join thousands of farmers and producers who are growing their business with our platform. 
              Get access to local markets, fair pricing, and a supportive community.
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-green-100 p-4 sm:p-6">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-green-900">Create Your Account</h2>
            <p className="text-green-600 text-sm sm:text-base mt-1 sm:mt-2">Start your journey as a verified producer</p>
          </div>

          <div className="space-y-4 sm:space-y-6 max-h-[60vh] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2">
            {/* Logo Upload */}
            <div className="flex justify-center">
              <div className="relative group">
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl border-2 sm:border-3 border-green-200 bg-green-50 overflow-hidden shadow-lg cursor-pointer transition-all duration-300 group-hover:border-green-400"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  aria-label="Select logo"
                  tabIndex={0}
                >
                  <Image
                    src={
                      form.businessLogo instanceof File
                        ? URL.createObjectURL(form.businessLogo)
                        : "/placeholder.png"
                    }
                    alt="Farm Logo"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-green-600 text-white p-1.5 sm:p-2 rounded-full shadow-lg hover:bg-green-700 transition-all duration-300 group-hover:scale-110"
                  aria-label="Edit logo"
                >
                  <FaEdit className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setForm((prev) => ({ ...prev, businessLogo: file }));
                  }}
                />
              </div>
            </div>

            {/* Basic Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-semibold text-green-800 flex items-center gap-2">
                  <FaUser className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  {t('producerAuth.signup.labels.marketplaceName')}
                </label>
                <input
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  placeholder="Enter your business name"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-green-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400 font-medium text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-semibold text-green-800 flex items-center gap-2">
                  <FaEnvelope className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  {t('producerAuth.signup.labels.email')}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-green-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400 font-medium text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-semibold text-green-800 flex items-center gap-2">
                  <FaLock className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  {t('producerAuth.signup.labels.password')}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Create a strong password"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-green-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400 font-medium text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-semibold text-green-800 flex items-center gap-2">
                  <FaPhone className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  {t('producerAuth.signup.labels.phoneNumber')}
                </label>
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  placeholder="+91 1234567890"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-green-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400 font-medium text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold text-green-800 flex items-center gap-2">
                <FaLeaf className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                {t('producerAuth.signup.labels.categories')}
              </label>
              <Select
                isMulti
                options={availableCategories.map((cat) => ({ value: cat.id, label: cat.name }))}
                value={availableCategories
                  .filter((cat) => form.categories.includes(cat.id))
                  .map((cat) => ({ value: cat.id, label: cat.name }))}
                onChange={(selected) => {
                  const selectedIds = selected.map((s) => s.value);
                  setForm({ ...form, categories: selectedIds });
                }}
                placeholder="Select your product categories..."
                className="text-xs sm:text-sm"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: '#bbf7d0',
                    borderRadius: '8px sm:12px',
                    padding: '2px 4px sm:4px 8px',
                    backgroundColor: 'white',
                    color: '#1f2937',
                    fontSize: '14px',
                    minHeight: '42px sm:48px',
                    borderWidth: '2px',
                    '&:hover': { borderColor: '#16a34a' }
                  }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: '8px sm:12px',
                    overflow: 'hidden',
                    fontSize: '14px',
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected ? '#16a34a' : state.isFocused ? '#dcfce7' : 'white',
                    color: state.isSelected ? 'white' : '#1f2937',
                    fontSize: '14px',
                    padding: '6px 8px sm:8px 12px',
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: '#dcfce7',
                    borderRadius: '6px sm:8px',
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: '#166534',
                    fontSize: '12px sm:13px',
                    fontWeight: '500',
                  }),
                  placeholder: (base) => ({
                    ...base,
                    fontSize: '14px',
                    color: '#9ca3af',
                  }),
                }}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold text-green-800">
                {t('producerAuth.signup.labels.description')}
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Tell us about your farm and products..."
                rows={2}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-green-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400 resize-none font-medium text-sm sm:text-base"
              />
            </div>

            {/* Aadhaar Section */}
            <div className="bg-green-50 border-2 border-green-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="bg-green-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-white">
                  <FaIdCard className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-green-900 text-xs sm:text-sm">{t('producerAuth.signup.section.aadhaarTitle')}</h3>
                  <p className="text-green-700 text-xs">{t('producerAuth.signup.section.aadhaarSubtitle')}</p>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => aadhaarInputRef.current?.click()}
                  className="w-full bg-white border-2 border-dashed border-green-300 hover:border-green-500 text-green-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:bg-green-50 text-xs sm:text-sm"
                >
                  <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                  {t('producerAuth.signup.buttons.chooseAadhaarImages')}
                </button>
                <input
                  ref={aadhaarInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  multiple
                  className="hidden"
                  onChange={handleAadhaarFileSelect}
                />

                {aadhaarFiles.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {aadhaarFiles.slice(0,4).map((file, idx) => (
                      <div key={idx} className="bg-white p-1.5 sm:p-2 rounded-lg border border-green-200 text-center">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                          <FaIdCard className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600" />
                        </div>
                        <span className="text-xs text-green-700 font-medium break-words line-clamp-2">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-green-100/50 rounded-lg sm:rounded-xl">
                  <input
                    id="sameAsPerm"
                    type="checkbox"
                    checked={form.businessSameAsPermanent}
                    onChange={async (e) => {
                      const checked = e.target.checked;
                      setForm(prev => ({ ...prev, businessSameAsPermanent: checked }));
                      if (checked) {
                        if (permanentReady) {
                          setForm(prev => ({
                            ...prev,
                            businessAddressLine1: permanentAddress.addressLine1 || prev.businessAddressLine1,
                            businessAddressLine2: permanentAddress.addressLine2 || prev.businessAddressLine2,
                            businessCity: permanentAddress.city || prev.businessCity,
                            businessState: permanentAddress.state || prev.businessState,
                            businessPostalCode: permanentAddress.postalCode || prev.businessPostalCode,
                            businessCountry: permanentAddress.country || prev.businessCountry || 'India',
                          }));
                        } else {
                          const ok = await parseAadhaarAndStorePermanent(null, true);
                          if (!ok) setForm(prev => ({ ...prev, businessSameAsPermanent: false }));
                        }
                      }
                    }}
                    className="mt-0.5 sm:mt-1 text-green-600 focus:ring-green-500 scale-90 sm:scale-100"
                  />
                  <label htmlFor="sameAsPerm" className="text-green-800 text-xs sm:text-sm font-medium flex-1 leading-tight">
                    {t('producerAuth.signup.labels.useAadhaarAsBusiness')}
                  </label>
                </div>
              </div>
            </div>

            
{/* Business Address */}
<div className="space-y-3 sm:space-y-4">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="font-bold text-green-900 text-xs sm:text-sm flex items-center gap-2">
        <FaMapMarkerAlt className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
        {t('producerAuth.signup.section.businessAddressTitle')}
      </h3>
      <p className="text-green-700 text-xs mt-1">
        Recommended: Capture your farm location for better visibility
      </p>
    </div>
    <button
      type="button"
      onClick={captureLocation}
      disabled={capturingLocation || locationCaptured}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        locationCaptured
          ? 'bg-green-100 text-green-700 border-2 border-green-500 shadow-sm cursor-not-allowed'
          : capturingLocation
          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white cursor-wait'
          : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
      } disabled:opacity-90 min-w-[140px] justify-center`}
    >
      {capturingLocation ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Capturing...
        </>
      ) : locationCaptured ? (
        <>
          <FaCheck className="w-3 h-3" />
          Location Captured
        </>
      ) : (
        <>
          <FaMapMarkerAlt className="w-3 h-3" />
          Capture Location
        </>
      )}
    </button>
  </div>

  {!locationCaptured && (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
          <FaMapMarkerAlt className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-blue-900 text-sm mb-1">Enhance Your Profile</h4>
          <p className="text-blue-800 text-xs leading-relaxed">
            <strong>Capture your farm location now</strong> to get better visibility with local buyers 
            and accurate delivery estimates. You can also do this later from your profile settings.
          </p>
          <p className="text-blue-700 text-xs mt-2 italic">
            Note: Capture location when you're physically at the site.
          </p>
        </div>
      </div>
    </div>
  )}

  {locationCaptured && form.latitude && form.longitude && (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-3 sm:p-4 relative">
      <button
        type="button"
        onClick={() => {
          setForm(prev => ({ ...prev, latitude: null, longitude: null }));
          setLocationCaptured(false);
        }}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-all z-10"
        aria-label="Remove location"
      >
        <FaTimes className="w-3 h-3" />
      </button>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <FaCheck className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h4 className="font-bold text-green-900 text-sm">Farm Location Added</h4>
            <p className="text-green-700 text-xs">
              Coordinates: <strong>{form.latitude.toFixed(6)}</strong>, <strong>{form.longitude.toFixed(6)}</strong>
            </p>
          </div>
        </div>
        <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          ADDED
        </div>
      </div>
    </div>
  )}

  {/* Rest of the address fields remain exactly the same */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
    <div className="space-y-2">
      <label className="text-xs sm:text-sm font-semibold text-green-800">{t('producerAuth.signup.labels.addressLine1')}</label>
      <input
        value={form.businessAddressLine1}
        onChange={(e) => setForm({ ...form, businessAddressLine1: e.target.value })}
        placeholder="Street address"
        disabled={form.businessSameAsPermanent}
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-green-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400 font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>

    <div className="space-y-2">
      <label className="text-xs sm:text-sm font-semibold text-green-800">{t('producerAuth.signup.labels.addressLine2')}</label>
      <input
        value={form.businessAddressLine2}
        onChange={(e) => setForm({ ...form, businessAddressLine2: e.target.value })}
        placeholder="Apartment, suite, etc."
        disabled={form.businessSameAsPermanent}
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-green-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400 font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>

    <div className="space-y-2">
      <label className="text-xs sm:text-sm font-semibold text-green-800">{t('producerAuth.signup.labels.city')}</label>
      <input
        value={form.businessCity}
        onChange={(e) => setForm({ ...form, businessCity: e.target.value })}
        placeholder="City"
        disabled={form.businessSameAsPermanent}
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-green-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400 font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>

    <div className="space-y-2">
      <label className="text-xs sm:text-sm font-semibold text-green-800">{t('producerAuth.signup.labels.state')}</label>
      <input
        value={form.businessState}
        onChange={(e) => setForm({ ...form, businessState: e.target.value })}
        placeholder="State"
        disabled={form.businessSameAsPermanent}
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-green-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400 font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>

    <div className="space-y-2">
      <label className="text-xs sm:text-sm font-semibold text-green-800">{t('producerAuth.signup.labels.postalCode')}</label>
      <input
        value={form.businessPostalCode}
        onChange={(e) => setForm({ ...form, businessPostalCode: e.target.value })}
        placeholder="PIN code"
        disabled={form.businessSameAsPermanent}
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-green-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400 font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>

    <div className="space-y-2">
      <label className="text-xs sm:text-sm font-semibold text-green-800">{t('producerAuth.signup.labels.country')}</label>
      <input
        value={form.businessCountry}
        onChange={(e) => setForm({ ...form, businessCountry: e.target.value })}
        disabled={form.businessSameAsPermanent}
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-green-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400 font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  </div>
</div>

            {/* KYC Documents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <h4 className="font-bold text-amber-900 mb-2 sm:mb-3 flex items-center gap-2 text-xs sm:text-sm">
                  <FaIdCard className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />
                  {t('producerAuth.signup.section.idProofTitle')}
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {idFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <Image 
                          src={URL.createObjectURL(file)} 
                          width={64}
                          height={64}
                          className="w-14 h-14 sm:w-20 sm:h-20 object-cover rounded-lg sm:rounded-xl border-2 border-amber-300 shadow-sm"
                          alt="ID proof"
                        />
                        <button
                          type="button"
                          aria-label="Remove image"
                          onClick={() => setIdFiles((prev) => prev.filter((_, i) => i !== index))}
                          className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-600 text-white rounded-full p-1 shadow-lg hover:bg-red-700 transition-all"
                        >
                          <FaTimes className="w-2 h-2 sm:w-3 sm:h-3" />
                        </button>
                      </div>
                    ))}
                    <label className="w-14 h-14 sm:w-20 sm:h-20 flex flex-col items-center justify-center border-2 border-dashed border-amber-300 rounded-lg sm:rounded-xl cursor-pointer hover:bg-amber-100 transition-all text-amber-600 font-medium text-xs">
                      <FaPlus className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1" />
                      <span className="text-xs">Add ID</span>
                      <input
                        ref={idInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const incoming = Array.from(e.target.files || []);
                          const images = incoming.filter((f) => f.type && f.type.startsWith("image/"));
                          setIdFiles((prev) => [...prev, ...images]);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <h4 className="font-bold text-blue-900 mb-2 sm:mb-3 flex items-center gap-2 text-xs sm:text-sm">
                  <FaMapMarkerAlt className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                  {t('producerAuth.signup.section.addressProofTitle')}
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {addressFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <Image 
                          src={URL.createObjectURL(file)} 
                          width={64}
                          height={64}
                          className="w-14 h-14 sm:w-20 sm:h-20 object-cover rounded-lg sm:rounded-xl border-2 border-blue-300 shadow-sm"
                          alt="Address proof"
                        />
                        <button
                          type="button"
                          aria-label="Remove image"
                          onClick={() => setAddressFiles((prev) => prev.filter((_, i) => i !== index))}
                          className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-600 text-white rounded-full p-1 shadow-lg hover:bg-red-700 transition-all"
                        >
                          <FaTimes className="w-2 h-2 sm:w-3 sm:h-3" />
                        </button>
                      </div>
                    ))}
                    <label className="w-14 h-14 sm:w-20 sm:h-20 flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg sm:rounded-xl cursor-pointer hover:bg-blue-100 transition-all text-blue-600 font-medium text-xs">
                      <FaPlus className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1" />
                      <span className="text-xs">Add Proof</span>
                      <input
                        ref={addrProofInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const incoming = Array.from(e.target.files || []);
                          const images = incoming.filter((f) => f.type && f.type.startsWith("image/"));
                          setAddressFiles((prev) => [...prev, ...images]);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4">
              <Link 
                href="/producer/signin" 
                className="flex-1 text-green-600 hover:text-green-800 font-semibold flex items-center justify-center gap-2 transition-colors px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:bg-green-50 border border-green-200 text-center text-sm sm:text-base"
              >
                {t('producerAuth.signup.links.alreadyHaveAccount')}
              </Link>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white p-2 sm:p-3 rounded-lg sm:rounded-xl font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105 disabled:scale-100 shadow-lg text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('producerAuth.signup.buttons.registering')}
                  </>
                ) : (
                  <>
                    {t('producerAuth.signup.buttons.completeRegistration')}
                  </>
                )}
              </button>
            </div>

            {/* Security Note */}
            <div className="text-center pt-3 sm:pt-4 border-t border-green-200">
              <p className="text-green-600 text-xs font-medium">
                {t('producerAuth.signup.section.secureNote')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
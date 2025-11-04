"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInProducer } from "@/lib/api/producers";
import { toast } from "react-toastify";
import Link from "next/link";
import { GiFarmer } from "react-icons/gi";
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaHome, FaLeaf, FaStore } from "react-icons/fa";
import { useTranslations } from "next-intl";

export default function SignIn() {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [localeUI, setLocaleUI] = useState('en');

  // Read current locale for the dropdown on mount
  function readCookie(name) {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }
  useEffect(() => {
    let l = 'en';
    try { l = readCookie('locale') || localStorage.getItem('locale') || 'en'; } catch {}
    if (!['en','hi','or'].includes(l)) l = 'en';
    setLocaleUI(l);
  }, []);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      toast.error(t('producerAuth.signin.toasts.allFieldsRequired'));
      return;
    }

    setLoading(true);
    try {
      const result = await signInProducer(form);
      localStorage.setItem("token", result.token);
      localStorage.setItem("businessName", result.producer.businessName || "");
      localStorage.setItem("businessLogo", result.producer.businessLogo || "");
      localStorage.setItem("kycStatus", result.producer.kycStatus || "pending");
      
      // Dispatch events for real-time updates
      try {
        window.dispatchEvent(new Event('authUpdate'));
        window.dispatchEvent(new Event('localStorageUpdate'));
        window.dispatchEvent(new Event('kycStatusUpdate'));
      } catch {}

      toast.success(t('producerAuth.signin.toasts.welcomeBack'));
      
      // Redirect based on KYC status
      const destination = result.producer.kycStatus === "approved" 
        ? "/producer" 
        : "/producer/waiting";
      router.replace(destination);
    } catch (error) {
      toast.error(error.message || t('producerAuth.signin.toasts.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 md:p-8 lg:p-14 flex items-center justify-center">
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
                {t('producerAuth.signin.headerTitle')}
              </h1>
              <p className="text-green-700 text-base sm:text-lg mt-2 font-medium ">
                {t('producerAuth.signin.headerSubtitle')}
              </p>
            </div>
          </div>

          <div className="space-y-4 hidden sm:block ">
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
              Welcome back to our growing community of farmers and producers. 
              Continue your journey with access to local markets, fair pricing, and business growth opportunities.
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-green-100 p-4 sm:p-6">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-green-900">Welcome Back</h2>
            <p className="text-green-600 text-sm sm:text-base mt-1 sm:mt-2">Sign in to your producer account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold text-green-800 flex items-center gap-2">
                <FaEnvelope className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                {t('producerAuth.signin.labels.email')}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t('producerAuth.signin.placeholders.email')}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-green-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400 font-medium text-sm sm:text-base"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold text-green-800 flex items-center gap-2">
                <FaLock className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                {t('producerAuth.signin.labels.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={t('producerAuth.signin.placeholders.password')}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 border border-green-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400 font-medium text-sm sm:text-base"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 hover:text-green-800 transition-colors"
                >
                  {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <Link 
                href="/producer/signup" 
                className="flex-1 text-green-600 hover:text-green-800 font-semibold flex items-center justify-center gap-2 transition-colors px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:bg-green-50 border border-green-200 text-center text-sm sm:text-base"
              >
                {t('producerAuth.signin.links.dontHaveAccount')}
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white p-2 sm:p-3 rounded-lg sm:rounded-xl font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105 disabled:scale-100 shadow-lg text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('producerAuth.signin.buttons.signingIn')}
                  </>
                ) : (
                  <>
                    {t('producerAuth.signin.buttons.signIn')}
                  </>
                )}
              </button>
            </div>

            {/* Security Note */}
            <div className="text-center pt-3 sm:pt-4 border-t border-green-200">
              <p className="text-green-600 text-xs font-medium">
                {t('producerAuth.signin.section.secureNote')}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
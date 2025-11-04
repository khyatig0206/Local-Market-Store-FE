"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signupUser, signinUser } from "@/lib/api/users";
import { toast } from "react-toastify";
import { FaUserPlus, FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUser, FaShieldAlt } from "react-icons/fa";

export default function SignupPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true);
    try {
      await signupUser(form);
      
      // Auto-signin after signup
      const signinData = await signinUser({ email: form.email, password: form.password });
      localStorage.setItem("userToken", signinData.token);
      localStorage.setItem("username", signinData.user.username);
      
      try { window.dispatchEvent(new Event('authUpdate')); } catch {}
      
      // Handle pending actions
      try {
        const pendingRaw = localStorage.getItem('postLoginAction');
        if (pendingRaw) {
          const pending = JSON.parse(pendingRaw);
          if (pending?.type === 'addToCart' && pending.productId) {
            try {
              const { addToCart } = await import('@/lib/api/cart');
              await addToCart(pending.productId, pending.quantity || 1);
              let cartCount = parseInt(localStorage.getItem('cartCount') || '0', 10);
              cartCount += (pending.quantity || 1);
              localStorage.setItem('cartCount', cartCount);
              window.dispatchEvent(new Event('cartCountUpdate'));
            } catch {}
          }
        }
        
        try { localStorage.removeItem('postLoginAction'); } catch {}
        const back = localStorage.getItem('postLoginReturnTo');
        try { localStorage.removeItem('postLoginReturnTo'); } catch {}
        
        toast.success("Account created successfully! Welcome!");
        
        if (pendingRaw) {
          router.push('/cart');
        } else if (back) {
          router.push(back);
        } else {
          router.push('/');
        }
      } catch {
        router.push('/');
      }
    } catch (err) {
      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-100 via-white to-blue-100">
      <div className="max-w-md w-full">
        {/* Form Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-green-100 p-4 sm:p-6 ">
          {/* Header with Icon */}
          <div className="text-center mb-4">
            <div className="flex justify-center mb-4">
              <div className="bg-green-600 p-4 rounded-2xl shadow-lg">
                <FaUserPlus className="w-6 h-6 text-white" />
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-green-900">Create Account</h2>
            <p className="text-green-600 text-sm sm:text-base">Join us today and start shopping!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-green-800 flex items-center gap-2">
                <FaUser className="w-4 h-4 text-green-600" />
                Username
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Choose a username"
                className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400 font-medium text-base"
                disabled={loading}
                required
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-green-800 flex items-center gap-2">
                <FaEnvelope className="w-4 h-4 text-green-600" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400 font-medium text-base"
                disabled={loading}
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-green-800 flex items-center gap-2">
                <FaLock className="w-4 h-4 text-green-600" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className="w-full px-4 py-3 pr-12 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400 font-medium text-base"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 hover:text-green-800 transition-colors p-1"
                >
                  {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row items-stretch gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] disabled:scale-100 shadow-lg text-base min-h-[52px]"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </button>
              
              <Link 
                href="/signin" 
                className="flex-1 text-green-600 hover:text-green-800 font-semibold flex items-center justify-center gap-2 transition-colors py-3 rounded-xl hover:bg-green-50 border border-green-200 text-center text-base min-h-[52px]"
              >
                Sign In
              </Link>
            </div>

            {/* Security Note */}
            <div className="text-center pt-4 border-t border-green-200">
              <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium">
                <FaShieldAlt className="w-4 h-4" />
                Your information is secure and encrypted
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInAdmin } from "@/lib/api/admin";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash, FaShieldAlt, FaEnvelope, FaLock, FaUserShield } from "react-icons/fa";

export default function SignInAdmin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const data = await signInAdmin(form);
      localStorage.setItem("adminToken", data.token);
      toast.success("Admin login successful!");
      router.push("/admin");
    } catch (err) {
      toast.error(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4 ">
      <div className="max-w-md w-full">
        {/* Form Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-blue-100 p-4 sm:p-6">
          {/* Header with Icon */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-600 p-4 rounded-2xl shadow-lg">
                <FaUserShield className="w-6 h-6 text-white" />
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-blue-900">Admin Access</h2>
            <p className="text-blue-600 text-sm sm:text-base">Sign in to admin dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                <FaEnvelope className="w-4 h-4 text-blue-600" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400 font-medium text-base"
                disabled={loading}
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                <FaLock className="w-4 h-4 text-blue-600" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400 font-medium text-base"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 transition-colors p-1"
                >
                  {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] disabled:scale-100 shadow-lg text-base min-h-[52px]"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
              
              <div className="text-center text-sm text-gray-600">
                Need producer access?{" "}
                <Link href="/producer/signin" className="text-blue-600 hover:text-blue-800 font-semibold hover:underline">
                  Producer Login
                </Link>
              </div>
            </div>

            {/* Security Note */}
            <div className="text-center pt-4 border-t border-blue-200">
              <div className="flex items-center justify-center gap-2 text-blue-600 text-sm font-medium">
                <FaShieldAlt className="w-4 h-4" />
                Secure admin authentication
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

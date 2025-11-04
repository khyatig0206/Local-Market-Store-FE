"use client";
import { useState } from 'react';
import { FaLock, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { changeUserPassword } from '@/lib/api/users';
import { changeProducerPassword } from '@/lib/api/producers';

/**
 * Reusable change password modal
 * - mode: 'user' | 'producer' (default: 'user')
 * - onClose: () => void
 */
export default function ChangePasswordModal({ mode = 'user', onClose }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!oldPassword || !newPassword || !confirmPassword) {
      return toast.error('Please fill all fields');
    }
    if (newPassword.length < 8) {
      return toast.error('New password must be at least 8 characters');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('New password and confirmation do not match');
    }

    setLoading(true);
    try {
      if (mode === 'producer') {
        await changeProducerPassword({ oldPassword, newPassword });
      } else {
        await changeUserPassword({ oldPassword, newPassword });
      }
      toast.success('Password changed successfully');
      onClose?.();
    } catch (e) {
      toast.error(e?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-base">Change Password</h3>
            <p className="text-green-100 text-xs">Update your security credentials</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/90 hover:text-white rounded-lg hover:bg-white/10">
            <FaTimes size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t bg-white flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 px-4 py-2 text-sm rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2 ${
              loading ? 'bg-green-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-md'
            }`}
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <FaLock className="text-xs" />
                Change Password
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

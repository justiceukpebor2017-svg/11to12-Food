import React, { useState } from 'react';
import { UserProfile } from '../../../types';
import {
  User,
  MapPin,
  Lock,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Building,
  KeyRound,
} from 'lucide-react';

interface CustomerAccountTabProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onChangePassword?: (newPass: string) => void;
  onLogout: () => void;
}

export const CustomerAccountTab: React.FC<CustomerAccountTabProps> = ({
  userProfile,
  onUpdateProfile,
  onChangePassword,
  onLogout,
}) => {
  // Personal Details State
  const [name, setName] = useState(userProfile.name);
  const [phone, setPhone] = useState(userProfile.phone);
  const [company, setCompany] = useState(userProfile.company || '');

  // Delivery Addresses State
  const [address, setAddress] = useState(userProfile.address || '');
  const [secondAddress, setSecondAddress] = useState(userProfile.secondAddress || '');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Status Notices
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const showSaved = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleSavePersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...userProfile,
      name: name.trim(),
      phone: phone.trim(),
      company: company.trim(),
    });
    showSaved('Personal details updated successfully.');
  };

  const handleSaveDeliveryInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...userProfile,
      address: address.trim(),
      secondAddress: secondAddress.trim() || undefined,
    });
    showSaved('Delivery addresses updated successfully.');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (onChangePassword) {
      onChangePassword(newPassword);
    }

    setPasswordError(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showSaved('Password changed successfully.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-['Poppins']">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Account Settings</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Manage your personal details, workstation addresses, and password security
        </p>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* 1. PERSONAL DETAILS */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-[#FF4C00]" />
            <h2 className="text-base font-bold text-zinc-900">Personal Information</h2>
          </div>
        </div>

        <form onSubmit={handleSavePersonalInfo} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                Email Address <span className="text-zinc-400 font-normal">(Account identifier)</span>
              </label>
              <input
                type="email"
                disabled
                value={userProfile.email}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Company / Organization</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
            >
              Save Personal Info
            </button>
          </div>
        </form>
      </div>

      {/* 2. DELIVERY DETAILS */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-[#FF4C00]" />
            <h2 className="text-base font-bold text-zinc-900">Delivery Addresses</h2>
          </div>
          <span className="text-xs text-zinc-400 font-medium">11:00 AM – 12:00 PM Desk Drop</span>
        </div>

        <form onSubmit={handleSaveDeliveryInfo} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                Primary Delivery Address & Floor
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Landmark Towers, Floor 4, Suite 402"
                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                Second Delivery Address <span className="text-zinc-400 font-normal">(Optional backup desk)</span>
              </label>
              <input
                type="text"
                value={secondAddress}
                onChange={(e) => setSecondAddress(e.target.value)}
                placeholder="e.g. Alternate reception or colleague's desk"
                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
            >
              Save Delivery Addresses
            </button>
          </div>
        </form>
      </div>

      {/* 3. SECURITY & CHANGE PASSWORD */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-[#FF4C00]" />
            <h2 className="text-base font-bold text-zinc-900">Security & Password</h2>
          </div>
        </div>

        {passwordError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* 4. LOGOUT */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-900">Sign Out of Dashboard</h3>
          <p className="text-xs text-zinc-500">You can log back in anytime with your email and password.</p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 border border-red-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>

    </div>
  );
};

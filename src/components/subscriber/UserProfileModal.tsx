import React, { useState } from 'react';
import { X, User, Phone, Mail, Building, Bell, Check, Shield } from 'lucide-react';
import { UserProfile } from '../../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
}) => {
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [phone, setPhone] = useState(userProfile.phone);
  const [company, setCompany] = useState(userProfile.company);
  const [address, setAddress] = useState(userProfile.address || '');
  const [spicePref, setSpicePref] = useState<'Mild' | 'Medium' | 'Hot' | 'Pepper Dem'>(
    userProfile.spicePreference || 'Hot'
  );
  const [dislikes, setDislikes] = useState(userProfile.dislikes?.join(', ') || 'No raw onions');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...userProfile,
      name,
      email,
      phone,
      company,
      address,
      spicePreference: spicePref,
      dislikes: dislikes.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Poppins']">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-7 text-left animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2 text-[#FF4C00] mb-1">
          <User className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Account Settings</span>
        </div>
        <h3 className="text-xl font-black text-black">
          Profile & Preferences
        </h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Manage your contact credentials and kitchen taste profile.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          
          <div className="border-b border-zinc-200 pb-2">
            <span className="text-xs font-bold text-black uppercase tracking-wider block">
              Your Contact & Desk Drop Details
            </span>
          </div>

          <div>
            <label className="font-bold text-zinc-700 block mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-zinc-200 font-medium focus:outline-none focus:border-black"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-zinc-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-zinc-200 font-medium focus:outline-none focus:border-black"
                required
              />
            </div>
            <div>
              <label className="font-bold text-zinc-700 block mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-zinc-200 font-medium focus:outline-none focus:border-black"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-zinc-700 block mb-1">Workplace / Building</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Workplace / Office Building"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-zinc-200 font-medium focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="font-bold text-zinc-700 block mb-1">Delivery Address & Floor</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Floor & Suite / Desk Details"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-zinc-200 font-medium focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-zinc-700 block mb-1">Spice Level Preference</label>
            <div className="grid grid-cols-4 gap-2">
              {(['Mild', 'Medium', 'Hot', 'Pepper Dem'] as const).map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setSpicePref(lvl)}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    spicePref === lvl
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-black'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-bold text-zinc-700 block mb-1">Dietary Dislikes / Notes</label>
            <input
              type="text"
              value={dislikes}
              onChange={(e) => setDislikes(e.target.value)}
              placeholder="e.g. No crayfish in sauce, No coleslaw cream"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-zinc-200 font-medium focus:outline-none focus:border-black"
            />
            <span className="text-[10px] text-zinc-400 mt-1 block">
              Directly flagged on Chef Justice morning kitchen prep sheets.
            </span>
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold text-center flex items-center justify-center space-x-1.5 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Preferences saved successfully!</span>
            </div>
          )}

          <div className="pt-3 border-t border-zinc-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-zinc-300 hover:bg-zinc-100 text-xs font-bold text-zinc-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Save Profile
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

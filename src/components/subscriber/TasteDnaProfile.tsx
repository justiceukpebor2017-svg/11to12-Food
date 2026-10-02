import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { Flame, User, Building, MapPin, Clock, Save, CheckCircle2, ShieldCheck } from 'lucide-react';

interface TasteDnaProfileProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const TasteDnaProfile: React.FC<TasteDnaProfileProps> = ({ profile, onUpdateProfile }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [newDislike, setNewDislike] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const spiceLevels: UserProfile['spicePreference'][] = ['Mild', 'Medium', 'Hot', 'Pepper Dem'];
  const availableProteins = ['Grilled Chicken', 'Beef Sauce', 'Smoked Turkey', 'Assorted Goat Meat', 'Fried Fish', 'Vegetarian'];

  const toggleProtein = (protein: string) => {
    setFormData((prev) => {
      const exists = prev.proteinsPreferred.includes(protein);
      const nextList = exists
        ? prev.proteinsPreferred.filter((p) => p !== protein)
        : [...prev.proteinsPreferred, protein];
      return { ...prev, proteinsPreferred: nextList };
    });
  };

  const addDislike = () => {
    if (!newDislike.trim()) return;
    setFormData((prev) => ({
      ...prev,
      dislikes: [...prev.dislikes, newDislike.trim()],
    }));
    setNewDislike('');
  };

  const removeDislike = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      dislikes: prev.dislikes.filter((_, i) => i !== index),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="bg-white border-4 border-black text-black p-6 sm:p-8 shadow-[8px_8px_0px_#000] space-y-8">
      
      <div className="flex items-center justify-between pb-6 border-b-3 border-black">
        <div>
          <span className="text-xs font-black uppercase text-black bg-[#FACC15] px-3 py-1 border-2 border-black font-mono-custom shadow-[2px_2px_0px_#000]">
            TASTE DNA & ROUTINE SETTINGS
          </span>
          <h3 className="text-2xl font-black uppercase font-heading text-black mt-2">PERSONALIZE YOUR KITCHEN DELIVERY</h3>
          <p className="text-xs font-bold text-zinc-700 mt-1 uppercase tracking-wider">
            Kitchen Justice uses these preferences to tailor seasoning, spice, and protein allocations for every single dish.
          </p>
        </div>

        {savedSuccess && (
          <span className="bg-[#22C55E] border-2 border-black text-black font-black text-xs px-4 py-2 shadow-[2px_2px_0px_#000] flex items-center space-x-1 animate-bounce uppercase">
            <CheckCircle2 className="w-4 h-4 stroke-[3]" />
            <span>PROFILE SAVED!</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Section 1: About You & Delivery Identity */}
        <div className="space-y-4">
          <h4 className="text-sm font-black text-black uppercase font-heading tracking-wider flex items-center space-x-2">
            <User className="w-5 h-5 text-[#FF4C00] stroke-[3]" />
            <span>1. ABOUT YOU & CORPORATE ADDRESS</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#F8F8F8] border-3 border-black px-3.5 py-2.5 text-xs font-bold text-black focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Occupation / Role</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="w-full bg-[#F8F8F8] border-3 border-black px-3.5 py-2.5 text-xs font-bold text-black focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full bg-[#F8F8F8] border-3 border-black px-3.5 py-2.5 text-xs font-bold text-black focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1 flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-[#FF4C00] stroke-[3]" />
                <span>Office Delivery Address</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-[#F8F8F8] border-3 border-black px-3.5 py-2.5 text-xs font-bold text-black focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Delivery Zone Area</label>
              <select
                value={formData.deliveryArea}
                onChange={(e) => setFormData({ ...formData, deliveryArea: e.target.value })}
                className="w-full bg-[#F8F8F8] border-3 border-black px-3.5 py-2.5 text-xs font-black text-black focus:outline-none focus:bg-white uppercase"
              >
                <option value="Ikoyi / Victoria Island">Ikoyi / Victoria Island</option>
                <option value="Lekki Phase 1">Lekki Phase 1</option>
                <option value="Ikeja GRA">Ikeja GRA</option>
                <option value="Marina / Lagos Island">Marina / Lagos Island</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Taste DNA Engine */}
        <div className="space-y-4 pt-4 border-t-3 border-black">
          <h4 className="text-sm font-black text-black uppercase font-heading tracking-wider flex items-center space-x-2">
            <Flame className="w-5 h-5 text-[#FF4C00] stroke-[3]" />
            <span>2. TASTE DNA ENGINE</span>
          </h4>

          {/* Spice Level Toggles */}
          <div>
            <label className="block text-xs font-black uppercase font-mono-custom text-black mb-2">Spice Level Tolerance</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {spiceLevels.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFormData({ ...formData, spicePreference: lvl })}
                  className={`py-3 px-3 border-3 border-black text-xs font-black uppercase cursor-pointer transition-all ${
                    formData.spicePreference === lvl
                      ? 'bg-[#FF4C00] text-white shadow-[3px_3px_0px_#000]'
                      : 'bg-[#F8F8F8] text-black hover:bg-[#FACC15]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Proteins */}
          <div>
            <label className="block text-xs font-black uppercase font-mono-custom text-black mb-2">Preferred Protein Allocations</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableProteins.map((protein) => {
                const selected = formData.proteinsPreferred.includes(protein);
                return (
                  <button
                    key={protein}
                    type="button"
                    onClick={() => toggleProtein(protein)}
                    className={`p-3 border-2 border-black text-left text-xs font-black uppercase cursor-pointer transition-all ${
                      selected
                        ? 'bg-[#FACC15] text-black shadow-[3px_3px_0px_#000]'
                        : 'bg-[#F8F8F8] text-zinc-700 hover:bg-white'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '} {protein}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dislikes Tags */}
          <div>
            <label className="block text-xs font-black uppercase font-mono-custom text-black mb-2">Specific Dietary Dislikes / Exclusions</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.dislikes.map((dis, idx) => (
                <span
                  key={idx}
                  className="bg-[#FF4C00] text-white border-2 border-black px-3 py-1 text-xs font-black uppercase flex items-center space-x-2 shadow-[2px_2px_0px_#000]"
                >
                  <span>{dis}</span>
                  <button
                    type="button"
                    onClick={() => removeDislike(idx)}
                    className="text-white hover:text-black font-black text-sm cursor-pointer ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                value={newDislike}
                onChange={(e) => setNewDislike(e.target.value)}
                placeholder="e.g. No crayfish in sauce"
                className="flex-1 bg-[#F8F8F8] border-3 border-black px-3 py-2 text-xs font-bold text-black focus:outline-none focus:bg-white"
              />
              <button
                type="button"
                onClick={addDislike}
                className="px-4 py-2 bg-black hover:bg-[#FF4C00] text-white border-2 border-black text-xs font-black uppercase cursor-pointer"
              >
                ADD
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Routine Settings */}
        <div className="space-y-4 pt-4 border-t-3 border-black">
          <h4 className="text-sm font-black text-black uppercase font-heading tracking-wider flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#22C55E] stroke-[3]" />
            <span>3. ROUTINE & SCHEDULE SETTINGS</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Standard Target Lunch Hour</label>
              <select
                value={formData.standardLunchTime}
                onChange={(e) => setFormData({ ...formData, standardLunchTime: e.target.value })}
                className="w-full bg-[#F8F8F8] border-3 border-black px-3.5 py-2.5 text-xs font-black text-black focus:outline-none uppercase"
              >
                <option value="11:00 AM">11:00 AM PROMPT</option>
                <option value="11:30 AM">11:30 AM PREFERRED</option>
                <option value="12:00 PM">12:00 PM SHARP</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Primary Eating Location</label>
              <select
                value={formData.eatLocation}
                onChange={(e) => setFormData({ ...formData, eatLocation: e.target.value as any })}
                className="w-full bg-[#F8F8F8] border-3 border-black px-3.5 py-2.5 text-xs font-black text-black focus:outline-none uppercase"
              >
                <option value="Work">OFFICE WORKSTATION DESK</option>
                <option value="Home">HOME OFFICE / REMOTE</option>
                <option value="Both">HYBRID WORK MODEL</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-[#FF4C00] hover:bg-[#e04300] text-white font-black text-sm uppercase border-3 border-black shadow-[4px_4px_0px_#000] cursor-pointer transition-all flex items-center justify-center space-x-2"
        >
          <Save className="w-5 h-5 stroke-[3]" />
          <span>SAVE TASTE DNA & ROUTINE</span>
        </button>

      </form>

    </div>
  );
};


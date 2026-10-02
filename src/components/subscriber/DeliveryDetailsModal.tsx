import React, { useState } from 'react';
import { X, MapPin, Plus, Check, Building, Clock } from 'lucide-react';

export interface DeliveryLocation {
  id: string;
  name: string; // e.g. "Primary Office Desk"
  building: string; // "Landmark Towers"
  area: string; // "Victoria Island"
  floor: string; // "Floor 4"
  suite: string; // "Suite 402"
  isDefault: boolean;
  notes?: string;
}

interface DeliveryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: DeliveryLocation[];
  pendingAddressChange?: {
    newLocation: string;
    effectiveAt: string;
    requestedAt: string;
  } | null;
  onScheduleDefaultLocation: (loc: DeliveryLocation) => void;
  onCancelPendingChange?: () => void;
  onSaveLocation: (loc: DeliveryLocation) => void;
}

export const DeliveryDetailsModal: React.FC<DeliveryDetailsModalProps> = ({
  isOpen,
  onClose,
  locations,
  pendingAddressChange,
  onScheduleDefaultLocation,
  onCancelPendingChange,
  onSaveLocation,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newBuilding, setNewBuilding] = useState('');
  const [newArea, setNewArea] = useState('Victoria Island');
  const [newFloor, setNewFloor] = useState('');
  const [newSuite, setNewSuite] = useState('');

  if (!isOpen) return null;

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuilding) return;

    onSaveLocation({
      id: `loc-${Date.now()}`,
      name: `${newBuilding} Desk`,
      building: newBuilding,
      area: newArea,
      floor: newFloor || 'Ground Floor',
      suite: newSuite || 'Reception',
      isDefault: false,
    });

    setIsAddingNew(false);
    setNewBuilding('');
    setNewFloor('');
    setNewSuite('');
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
          <MapPin className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Desk Locations</span>
        </div>
        <h3 className="text-xl font-black text-black">
          Delivery Addresses
        </h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Tell Chef Justice couriers where to drop your lunch before 12:00 PM.
        </p>

        {/* 24-Hour Policy Banner */}
        <div className="mt-3 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start space-x-2">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>24-Hour Transition Policy:</strong> For kitchen route security, address updates take effect 24 hours after request. Today’s delivery remains routed to your active desk. You can cancel pending changes anytime before activation.
          </p>
        </div>

        {/* Pending Change Status Card */}
        {pendingAddressChange && (
          <div className="mt-3 p-3.5 rounded-2xl bg-orange-50 border border-[#FF4C00]/30 flex items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center space-x-1.5 text-[#FF4C00] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#FF4C00] animate-pulse" />
                <span>Pending Switch: {pendingAddressChange.newLocation}</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Effective: {pendingAddressChange.effectiveAt}
              </p>
            </div>
            {onCancelPendingChange && (
              <button
                type="button"
                onClick={onCancelPendingChange}
                className="px-3 py-1 rounded-full border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold transition cursor-pointer shrink-0"
              >
                Cancel Switch
              </button>
            )}
          </div>
        )}

        {/* Existing Locations */}
        <div className="my-5 space-y-3">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
                loc.isDefault
                  ? 'bg-orange-50/50 border-[#FF4C00]/40'
                  : 'bg-[#FAF7F2] border-zinc-200'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-black">{loc.building}</span>
                  {loc.isDefault && (
                    <span className="px-2 py-0.5 rounded-full bg-[#FF4C00] text-white text-[9px] font-bold uppercase">
                      Default Desk (Active)
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-600">
                  {loc.floor}, {loc.suite} • {loc.area}
                </p>
                <div className="flex items-center space-x-1 text-[11px] text-zinc-400 pt-1">
                  <Clock className="w-3 h-3 text-[#FF4C00]" />
                  <span>Delivery Window: 11:00 AM – 12:00 PM</span>
                </div>
              </div>

              {!loc.isDefault && (
                <button
                  onClick={() => onScheduleDefaultLocation(loc)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-zinc-700 hover:text-black border border-zinc-300 hover:bg-white cursor-pointer shrink-0"
                  title="Address changes take effect in 24 hours"
                >
                  Switch (24h)
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add New Address Form / Trigger */}
        {isAddingNew ? (
          <form onSubmit={handleAddNew} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
            <span className="text-xs font-black text-black block">Add Alternative Office</span>
            <div className="space-y-2 text-xs">
              <input
                type="text"
                placeholder="Building Name (e.g. Eko Tower II)"
                value={newBuilding}
                onChange={(e) => setNewBuilding(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-zinc-300 font-medium focus:outline-none focus:border-black"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Floor (e.g. 5th Floor)"
                  value={newFloor}
                  onChange={(e) => setNewFloor(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-zinc-300 font-medium focus:outline-none focus:border-black"
                />
                <input
                  type="text"
                  placeholder="Suite/Dept (e.g. Room 502)"
                  value={newSuite}
                  onChange={(e) => setNewSuite(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-zinc-300 font-medium focus:outline-none focus:border-black"
                />
              </div>
              <select
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-zinc-300 font-medium focus:outline-none focus:border-black"
              >
                <option value="Victoria Island">Victoria Island</option>
                <option value="Ikoyi">Ikoyi</option>
                <option value="Lekki Phase 1">Lekki Phase 1</option>
                <option value="Marina / Lagos Island">Marina / Lagos Island</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2 rounded-full text-xs font-bold text-zinc-600 hover:text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-bold cursor-pointer"
              >
                Save Location
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingNew(true)}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-zinc-300 hover:border-black text-xs font-bold text-zinc-700 hover:text-black flex items-center justify-center space-x-1.5 cursor-pointer transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Another Desk Location</span>
          </button>
        )}

        <div className="mt-6 pt-4 border-t border-zinc-200">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

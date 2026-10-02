import React, { useState } from 'react';
import { ShieldCheck, UserPlus, Key, Settings, Lock, CheckCircle2 } from 'lucide-react';

export const AdminSettingsPermissions: React.FC = () => {
  const [paystackKey, setPaystackKey] = useState('pstk_live_99201994827110');
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [saved, setSaved] = useState(false);

  const [team, setTeam] = useState([
    { name: 'Justice Ukpebor', role: 'Head Chef & Admin', access: 'Full Superadmin' },
    { name: 'Amina Bello', role: 'Kitchen Logistics Lead', access: 'Cook List & Inventory' },
    { name: 'Emmanuel Eze', role: 'Rider Captain', access: 'Dispatch Status Only' },
  ]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white border-4 border-black text-black p-6 sm:p-8 shadow-[8px_8px_0px_#000] space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-3 border-black">
        <div>
          <span className="text-xs font-black uppercase text-black bg-[#FACC15] px-3 py-1 border-2 border-black font-mono-custom shadow-[2px_2px_0px_#000]">
            SYSTEM ADMINISTRATION
          </span>
          <h3 className="text-2xl font-black uppercase font-heading text-black mt-2">ADMIN SETTINGS & GRANULAR TEAM ACCESS</h3>
          <p className="text-xs font-bold text-zinc-700 mt-1 uppercase tracking-wider">
            Configure payment gateway keys, auto-dispatch triggers, and staff access roles.
          </p>
        </div>

        {saved && (
          <span className="bg-[#22C55E] text-black font-black uppercase text-xs px-3 py-2 border-2 border-black shadow-[2px_2px_0px_#000] flex items-center space-x-1 animate-bounce">
            <CheckCircle2 className="w-4 h-4 stroke-[3]" />
            <span>SETTINGS UPDATED!</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-8">
        
        {/* Payment & Infrastructure Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-black text-black uppercase font-heading tracking-wider flex items-center space-x-2">
            <Key className="w-5 h-5 text-[#FF4C00] stroke-[3]" />
            <span>1. PAYMENT GATEWAYS & DISPATCH SETTINGS</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Paystack Secret Live Key</label>
              <input
                type="password"
                value={paystackKey}
                onChange={(e) => setPaystackKey(e.target.value)}
                className="w-full bg-[#F8F8F8] border-3 border-black px-3.5 py-2.5 text-xs font-bold text-black focus:outline-none focus:bg-white font-mono-custom"
              />
            </div>

            <div className="flex items-center justify-between bg-[#F8F8F8] p-4 border-3 border-black shadow-[3px_3px_0px_#000]">
              <div>
                <span className="text-xs font-black uppercase text-black block">Auto-Lock Dispatch at 11:00 AM</span>
                <span className="text-[10px] text-zinc-700 font-bold uppercase">Automatically transitions state to Delivery Hour</span>
              </div>
              <input
                type="checkbox"
                checked={autoDispatch}
                onChange={(e) => setAutoDispatch(e.target.checked)}
                className="w-6 h-6 accent-[#FF4C00] cursor-pointer border-2 border-black"
              />
            </div>
          </div>
        </div>

        {/* Team Roles & Permissions */}
        <div className="space-y-4 pt-4 border-t-3 border-black">
          <h4 className="text-sm font-black text-black uppercase font-heading tracking-wider flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#FF4C00] stroke-[3]" />
            <span>2. STAFF & GRANULAR ACCESS CONTROL</span>
          </h4>

          <div className="space-y-2">
            {team.map((member, idx) => (
              <div key={idx} className="bg-[#F8F8F8] p-4 border-3 border-black flex items-center justify-between shadow-[2px_2px_0px_#000]">
                <div>
                  <span className="text-xs font-black uppercase text-black block">{member.name}</span>
                  <span className="text-[10px] font-bold text-zinc-700 uppercase">{member.role}</span>
                </div>
                <span className="px-3 py-1 bg-[#FACC15] border-2 border-black text-black font-mono-custom font-black text-[10px] uppercase shadow-[1px_1px_0px_#000]">
                  {member.access}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-[#FF4C00] hover:bg-[#e04300] text-white font-black text-sm uppercase border-3 border-black shadow-[4px_4px_0px_#000] cursor-pointer transition-all"
        >
          SAVE SYSTEM CONFIGURATION
        </button>

      </form>

    </div>
  );
};

import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { Search, UserCheck, PauseCircle, Phone, Star, Shield, MapPin, Building, CreditCard, X } from 'lucide-react';

interface SubscriberDirectoryProps {
  subscribers: UserProfile[];
  onToggleUserStatus: (userId: string) => void;
  onRefundCredit: (userId: string) => void;
}

export const SubscriberDirectory: React.FC<SubscriberDirectoryProps> = ({
  subscribers,
  onToggleUserStatus,
  onRefundCredit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserForDeepDive, setSelectedUserForDeepDive] = useState<UserProfile | null>(null);

  const filteredUsers = subscribers.filter((u) => {
    return (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.company.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="bg-white border-4 border-black text-black p-6 sm:p-8 shadow-[8px_8px_0px_#000] space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-3 border-black">
        <div>
          <span className="text-xs font-black uppercase text-black bg-[#FACC15] px-3 py-1 border-2 border-black font-mono-custom shadow-[2px_2px_0px_#000]">
            SUBSCRIBER DIRECTORY & CRM
          </span>
          <h3 className="text-2xl font-black uppercase font-heading text-black mt-2">SUBSCRIBER DATABASE & DEEP-DIVE PROFILE</h3>
          <p className="text-xs font-bold text-zinc-700 mt-1 uppercase tracking-wider">
            Search active subscribers, issue credit refunds, or initiate instant support calls.
          </p>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-black absolute left-3.5 top-3 stroke-[3]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search subscribers..."
            className="w-full bg-[#F8F8F8] border-3 border-black pl-10 pr-4 py-2 text-xs font-bold text-black focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b-3 border-black text-black font-mono-custom font-black uppercase">
              <th className="py-3 px-4">SUBSCRIBER</th>
              <th className="py-3 px-4">COMPANY & LOCATION</th>
              <th className="py-3 px-4">PLAN NAME</th>
              <th className="py-3 px-4">CREDIT STARS</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4 text-right">QUICK ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black font-bold">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-[#FACC15]/20 transition">
                <td className="py-3 px-4">
                  <button
                    onClick={() => setSelectedUserForDeepDive(user)}
                    className="font-black text-[#FF4C00] hover:underline text-left block uppercase"
                  >
                    {user.name}
                  </button>
                  <span className="text-[10px] text-zinc-600 font-mono-custom font-bold">{user.email}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-black font-black uppercase block">{user.company}</span>
                  <span className="text-[10px] text-zinc-600 uppercase font-bold">{user.deliveryArea}</span>
                </td>
                <td className="py-3 px-4 text-black font-mono-custom uppercase font-black">{user.planName}</td>
                <td className="py-3 px-4 font-mono-custom font-black text-black">
                  ★ {user.creditsBalance} Stars
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-1 border-2 border-black text-[10px] font-black uppercase shadow-[1px_1px_0px_#000] ${
                    user.subscriptionStatus === 'Active' ? 'bg-[#22C55E] text-black' :
                    user.subscriptionStatus === 'Paused' ? 'bg-[#FACC15] text-black' :
                    'bg-[#FF4C00] text-white'
                  }`}>
                    {user.subscriptionStatus.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-1.5">
                  <button
                    onClick={() => onToggleUserStatus(user.id)}
                    className="px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 text-black font-black border-2 border-black uppercase transition text-[10px] cursor-pointer"
                    title="Pause or Resume"
                  >
                    STATUS
                  </button>
                  <button
                    onClick={() => onRefundCredit(user.id)}
                    className="px-2.5 py-1 bg-[#22C55E] hover:bg-[#1eb052] text-black font-black border-2 border-black shadow-[2px_2px_0px_#000] uppercase transition text-[10px] cursor-pointer"
                    title="Grant Free Credit Star"
                  >
                    +1 REFUND
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deep Dive Profile View Drawer / Modal */}
      {selectedUserForDeepDive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-white border-4 border-black p-6 sm:p-8 max-w-xl w-full text-black space-y-6 shadow-[12px_12px_0px_#000] relative">
            <div className="flex items-center justify-between pb-4 border-b-3 border-black">
              <div>
                <h4 className="text-xl font-black uppercase font-heading text-black">{selectedUserForDeepDive.name}</h4>
                <p className="text-xs text-[#FF4C00] font-mono-custom uppercase font-black">{selectedUserForDeepDive.occupation} • {selectedUserForDeepDive.company}</p>
              </div>
              <button
                onClick={() => setSelectedUserForDeepDive(null)}
                className="p-1.5 bg-black text-white border-2 border-black hover:bg-[#FF4C00] cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[3]" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#F8F8F8] p-4 border-3 border-black space-y-2 shadow-[2px_2px_0px_#000]">
                <div className="flex items-center space-x-2 text-black font-bold uppercase">
                  <MapPin className="w-4 h-4 text-[#FF4C00] stroke-[3]" />
                  <span><strong>Delivery Address:</strong> {selectedUserForDeepDive.address}</span>
                </div>
                <div className="flex items-center space-x-2 text-black font-bold uppercase">
                  <Phone className="w-4 h-4 text-[#22C55E] stroke-[3]" />
                  <span><strong>Phone WhatsApp:</strong> {selectedUserForDeepDive.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F8F8F8] p-4 border-3 border-black shadow-[2px_2px_0px_#000]">
                  <span className="text-[10px] text-zinc-700 uppercase font-mono-custom font-black block">Taste Spice DNA</span>
                  <span className="text-sm font-black text-[#FF4C00] mt-1 block uppercase">{selectedUserForDeepDive.spicePreference}</span>
                </div>

                <div className="bg-[#F8F8F8] p-4 border-3 border-black shadow-[2px_2px_0px_#000]">
                  <span className="text-[10px] text-zinc-700 uppercase font-mono-custom font-black block">Credits Bank</span>
                  <span className="text-sm font-black text-black mt-1 block font-mono-custom">★ {selectedUserForDeepDive.creditsBalance} Stars</span>
                </div>
              </div>
            </div>

            {/* Admin Quick Action Bar */}
            <div className="pt-2 flex gap-3">
              <a
                href={`tel:${selectedUserForDeepDive.phone}`}
                className="flex-1 py-3 bg-[#22C55E] hover:bg-[#1eb052] text-black font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0px_#000] text-center flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Phone className="w-4 h-4 stroke-[3]" />
                <span>CALL SUBSCRIBER</span>
              </a>

              <button
                onClick={() => {
                  onRefundCredit(selectedUserForDeepDive.id);
                  setSelectedUserForDeepDive({
                    ...selectedUserForDeepDive,
                    creditsBalance: selectedUserForDeepDive.creditsBalance + 1,
                  });
                }}
                className="flex-1 py-3 bg-[#FF4C00] hover:bg-[#e04300] text-white font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0px_#000] cursor-pointer"
              >
                GRANT CREDIT (+1)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

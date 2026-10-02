import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { ShieldCheck, AlertOctagon, PauseCircle, PlayCircle, RefreshCw, XCircle } from 'lucide-react';

interface SubscriptionSettingsProps {
  profile: UserProfile;
  onUpdateStatus: (newStatus: 'Active' | 'Paused' | 'Cancelled') => void;
}

export const SubscriptionSettings: React.FC<SubscriptionSettingsProps> = ({ profile, onUpdateStatus }) => {
  const [showNuclearModal, setShowNuclearModal] = useState(false);

  const handlePauseToggle = () => {
    const nextStatus = profile.subscriptionStatus === 'Active' ? 'Paused' : 'Active';
    onUpdateStatus(nextStatus);
  };

  const handleNuclearCancel = () => {
    onUpdateStatus('Cancelled');
    setShowNuclearModal(false);
  };

  return (
    <div className="bg-white border-4 border-black text-black p-6 sm:p-8 shadow-[8px_8px_0px_#000] space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-3 border-black">
        <div>
          <span className="text-xs font-black uppercase text-black bg-[#FACC15] px-3 py-1 border-2 border-black font-mono-custom shadow-[2px_2px_0px_#000]">
            ACCOUNT & SUBSCRIPTION CONTROLS
          </span>
          <h3 className="text-2xl font-black uppercase font-heading text-black mt-2">MANAGE ACTIVE PLAN</h3>
          <p className="text-xs font-bold text-zinc-700 mt-1 uppercase tracking-wider">
            Toggle your subscription status or manage cancellation securely.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-black uppercase text-zinc-700 font-mono-custom">STATUS:</span>
          <span className={`px-4 py-1.5 border-2 border-black text-xs font-black uppercase font-mono-custom shadow-[2px_2px_0px_#000] ${
            profile.subscriptionStatus === 'Active' ? 'bg-[#22C55E] text-black' :
            profile.subscriptionStatus === 'Paused' ? 'bg-[#FACC15] text-black' :
            'bg-[#FF4C00] text-white'
          }`}>
            {profile.subscriptionStatus.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#F8F8F8] p-5 border-3 border-black shadow-[4px_4px_0px_#000]">
          <span className="text-xs text-zinc-600 font-black uppercase font-mono-custom block">Active Plan Name</span>
          <span className="text-lg font-black uppercase font-heading text-black block mt-1">{profile.planName}</span>
          <span className="text-xs text-[#FF4C00] font-black font-mono-custom block mt-2 uppercase">Next Billing Date: {profile.nextBillingDate}</span>
        </div>

        <div className="bg-[#F8F8F8] p-5 border-3 border-black shadow-[4px_4px_0px_#000]">
          <span className="text-xs text-zinc-600 font-black uppercase font-mono-custom block">Total Deliveries Completed</span>
          <span className="text-lg font-black uppercase font-heading text-black block mt-1">{profile.totalMealsReceived} Meals</span>
          <span className="text-xs text-[#22C55E] font-black font-mono-custom block mt-2 uppercase">Remaining Bank Stars: {profile.creditsBalance}</span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="pt-4 border-t-3 border-black flex flex-col sm:flex-row gap-4 justify-between items-center">
        
        {/* Pause/Resume Toggle */}
        <button
          onClick={handlePauseToggle}
          className={`w-full sm:w-auto px-6 py-4 border-3 border-black font-black text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center space-x-2 ${
            profile.subscriptionStatus === 'Active'
              ? 'bg-[#FACC15] text-black shadow-[4px_4px_0px_#000] hover:bg-[#eab308]'
              : 'bg-[#22C55E] text-black shadow-[4px_4px_0px_#000] hover:bg-[#1eb052]'
          }`}
        >
          {profile.subscriptionStatus === 'Active' ? (
            <>
              <PauseCircle className="w-5 h-5 text-black stroke-[3]" />
              <span>PAUSE SUBSCRIPTION (Temporary Leave)</span>
            </>
          ) : (
            <>
              <PlayCircle className="w-5 h-5 text-black stroke-[3]" />
              <span>RESUME ACTIVE DELIVERIES</span>
            </>
          )}
        </button>

        {/* The Nuclear Option: Cancel */}
        <button
          onClick={() => setShowNuclearModal(true)}
          className="w-full sm:w-auto px-6 py-4 bg-[#FF4C00] hover:bg-[#e04300] text-white font-black text-xs uppercase border-3 border-black shadow-[4px_4px_0px_#000] cursor-pointer transition-all flex items-center justify-center space-x-2"
        >
          <AlertOctagon className="w-5 h-5 stroke-[3]" />
          <span>CANCEL SUBSCRIPTION ("NUCLEAR OPTION")</span>
        </button>

      </div>

      {/* Nuclear Cancellation Modal */}
      {showNuclearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-white border-4 border-black p-6 sm:p-8 max-w-md w-full text-black space-y-6 shadow-[12px_12px_0px_#FF4C00]">
            <div className="w-16 h-16 bg-[#FF4C00] text-white border-3 border-black flex items-center justify-center mx-auto shadow-[4px_4px_0px_#000]">
              <AlertOctagon className="w-9 h-9 stroke-[3]" />
            </div>

            <div className="text-center space-y-2">
              <h4 className="text-2xl font-black uppercase font-heading text-black">ARE YOU SURE YOU WANT TO CANCEL?</h4>
              <p className="text-xs font-bold text-zinc-700 leading-relaxed uppercase">
                Cancelling will permanently forfeit your <strong>{profile.creditsBalance} Meal Credit Stars</strong> and remove your priority desk slot for Lagos 11 AM deliveries.
              </p>
            </div>

            <div className="bg-[#FACC15] p-4 border-3 border-black text-xs text-black font-bold uppercase space-y-1 shadow-[3px_3px_0px_#000]">
              <p className="font-black font-mono-custom">ALTERNATIVE RECOMMENDATION:</p>
              <p className="text-[11px] font-bold">You can pause your plan for up to 30 days without losing your credits or locked-in pricing!</p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  handlePauseToggle();
                  setShowNuclearModal(false);
                }}
                className="w-full py-4 bg-[#22C55E] hover:bg-[#1eb052] text-black font-black text-xs uppercase border-3 border-black shadow-[4px_4px_0px_#000] cursor-pointer transition-all"
              >
                PAUSE INSTEAD (KEEP CREDITS)
              </button>

              <button
                onClick={handleNuclearCancel}
                className="w-full py-3.5 bg-[#FF4C00] hover:bg-[#e04300] text-white font-black text-xs uppercase border-2 border-black cursor-pointer transition-all"
              >
                CONFIRM PERMANENT CANCELLATION
              </button>

              <button
                onClick={() => setShowNuclearModal(false)}
                className="w-full py-2 text-xs font-black uppercase text-zinc-700 hover:text-black cursor-pointer font-mono-custom"
              >
                Nevermind, go back
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


import React, { useState } from 'react';
import {
  UserProfile,
  CreditRedemptionOrder,
  CreditRedemptionDayItem,
  SwallowType,
} from '../../../types';
import {
  Wallet,
  Gift,
  Plus,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  X,
  AlertCircle,
} from 'lucide-react';

interface CustomerWalletTabProps {
  userProfile: UserProfile;
  onAddCreditRedemption?: (order: CreditRedemptionOrder) => void;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const CustomerWalletTab: React.FC<CustomerWalletTabProps> = ({
  userProfile,
  onAddCreditRedemption,
  onUpdateProfile,
}) => {
  const creditsBalance = userProfile.creditsBalance || 0;
  const skippedDates = userProfile.skippedDates || [];

  // Modals
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedRedeemDate, setSelectedRedeemDate] = useState('2026-12-10');
  const [selectedSwallow, setSelectedSwallow] = useState<SwallowType>('Semo');
  const [giftRecipientName, setGiftRecipientName] = useState('');
  const [giftRecipientEmail, setGiftRecipientEmail] = useState('');
  const [giftRecipientDesk, setGiftRecipientDesk] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Derive credit sources from skipped meals
  const creditSources = skippedDates.map((d) => {
    const matched = (userProfile.selectedDays || []).find((s) => s.dateStr === d);
    return {
      dateStr: d,
      mealTitle: matched?.meal.mealName || 'Scheduled Lunch',
      reason: 'Skipped lunch by subscriber',
      creditAmount: 1,
    };
  });

  // Handle Redeeming Credit for Extra Meal
  const handleExecuteRedeemCredit = (e: React.FormEvent) => {
    e.preventDefault();
    if (creditsBalance < 1) {
      showToast('You do not have any available lunch credits.');
      return;
    }

    const newCredits = creditsBalance - 1;

    // Update Profile
    onUpdateProfile({
      ...userProfile,
      creditsBalance: newCredits,
    });

    // Record Credit Redemption Order
    if (onAddCreditRedemption) {
      const order: CreditRedemptionOrder = {
        id: `CREDIT-ORD-${Date.now()}`,
        userId: userProfile.id,
        userName: userProfile.name,
        userPhone: userProfile.phone,
        company: userProfile.company || 'Corporate Office',
        officeAddress: userProfile.address || 'Office Desk',
        items: [
          {
            dateStr: selectedRedeemDate,
            portions: 1,
            dishName: 'Redeemed Credit Extra Plate',
            swallowChoice: selectedSwallow,
          },
        ],
        totalCreditsUsed: 1,
        status: 'Confirmed',
        submittedAt: new Date().toISOString(),
      };
      onAddCreditRedemption(order);
    }

    setShowRedeemModal(false);
    showToast(`✓ Credit redeemed! 1 Extra Meal scheduled for ${selectedRedeemDate}.`);
  };

  // Handle Gifting a Lunch Credit
  const handleExecuteGiftCredit = (e: React.FormEvent) => {
    e.preventDefault();
    if (creditsBalance < 1) {
      showToast('You do not have any available lunch credits.');
      return;
    }
    if (!giftRecipientName.trim() || !giftRecipientEmail.trim()) {
      showToast('Please provide your colleague’s name and email.');
      return;
    }

    const newCredits = creditsBalance - 1;

    onUpdateProfile({
      ...userProfile,
      creditsBalance: newCredits,
    });

    setShowGiftModal(false);
    showToast(`✓ Gift dispatched! 1 Lunch Credit gifted to ${giftRecipientName} (${giftRecipientEmail}).`);
    setGiftRecipientName('');
    setGiftRecipientEmail('');
    setGiftRecipientDesk('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-['Poppins']">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Lunch Wallet</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {creditsBalance} {creditsBalance === 1 ? 'Credit' : 'Credits'} Available
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage your skipped-lunch credits, schedule extra meals, or gift a lunch to a colleague
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowRedeemModal(true)}
            disabled={creditsBalance < 1}
            className="px-4 py-2 rounded-xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center space-x-1.5 shadow-xs disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Use a Credit</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGiftModal(true)}
            disabled={creditsBalance < 1}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-2xs disabled:opacity-40"
          >
            <Gift className="w-3.5 h-3.5 text-zinc-500" />
            <span>Gift a Lunch</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Credit Balance Card */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Wallet className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Available Wallet Balance
              </span>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-4xl font-black text-zinc-900">{creditsBalance}</span>
                <span className="text-sm font-semibold text-zinc-500">
                  {creditsBalance === 1 ? 'Lunch Credit' : 'Lunch Credits'}
                </span>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  ≈ ₦{(creditsBalance * 3200).toLocaleString()} value
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-2 max-w-lg leading-relaxed">
                Whenever you skip a scheduled lunch before the daily cutoff, 100% of the meal value is converted into a credit. You can redeem it anytime as an extra meal or gift it to a colleague.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Where Credits Came From (Credit Sources) */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Where Your Credits Came From</h2>
            <p className="text-xs text-zinc-500">Source log of every lunch credit added to your account</p>
          </div>
        </div>

        {creditSources.length === 0 ? (
          <div className="py-12 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <RotateCcw className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-700">No skipped lunch credits yet</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              When you skip any scheduled lunch date, your credit will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-2xl overflow-hidden">
            {creditSources.map((source, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-zinc-50/80 transition text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-zinc-900">{source.dateStr}</span>
                    <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      +1 Credit
                    </span>
                  </div>
                  <p className="text-zinc-600 font-medium">{source.mealTitle}</p>
                  <p className="text-[11px] text-zinc-400">{source.reason}</p>
                </div>

                <div className="text-right">
                  <span className="font-bold text-emerald-600 text-sm">+₦3,200</span>
                  <span className="block text-[10px] text-zinc-400">Credited to wallet</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* USE CREDIT MODAL */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">Use 1 Lunch Credit</h3>
              <button
                onClick={() => setShowRedeemModal(false)}
                className="p-1 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteRedeemCredit} className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                You currently have <strong>{creditsBalance}</strong> available credit{creditsBalance > 1 ? 's' : ''}. 1 credit will be used to schedule an extra desk drop meal.
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Select Workday for Extra Meal:
                </label>
                <input
                  type="date"
                  required
                  value={selectedRedeemDate}
                  onChange={(e) => setSelectedRedeemDate(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Swallow Choice (If Swallow Meal on this date):
                </label>
                <select
                  value={selectedSwallow}
                  onChange={(e) => setSelectedSwallow(e.target.value as SwallowType)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                >
                  <option value="Eba">Eba</option>
                  <option value="Semo">Semo</option>
                  <option value="Fufu">Fufu</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRedeemModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FF4C00] text-white font-bold text-xs hover:bg-[#E04300] cursor-pointer shadow-xs"
                >
                  Confirm Redemption
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GIFT CREDIT MODAL */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <Gift className="w-4 h-4 text-purple-600" />
                <h3 className="text-base font-bold text-zinc-900">Gift a Lunch Credit</h3>
              </div>
              <button
                onClick={() => setShowGiftModal(false)}
                className="p-1 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteGiftCredit} className="space-y-3.5 text-xs">
              <p className="text-zinc-600">
                Gift 1 hot desk drop lunch credit to a colleague or friend. We will notify them via email.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Recipient Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tunde Adeyemi"
                  value={giftRecipientName}
                  onChange={(e) => setGiftRecipientName(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Recipient Work Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. tunde@company.ng"
                  value={giftRecipientEmail}
                  onChange={(e) => setGiftRecipientEmail(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Recipient Desk / Floor (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Landmark Towers, Floor 3"
                  value={giftRecipientDesk}
                  onChange={(e) => setGiftRecipientDesk(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowGiftModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-black text-white font-bold text-xs hover:bg-zinc-800 cursor-pointer shadow-xs"
                >
                  Dispatch Gift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

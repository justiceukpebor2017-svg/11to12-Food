import React, { useState } from 'react';
import { X, CreditCard, Users, ArrowLeft, CheckCircle2, Gift, Send, Sparkles } from 'lucide-react';

interface SkipConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSkip: () => void;
  onSendToColleague?: (colleague: { name: string; desk: string; note: string }) => void;
  mealTitle: string;
  dateFormatted: string;
}

export const SkipConfirmationModal: React.FC<SkipConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirmSkip,
  onSendToColleague,
  mealTitle,
  dateFormatted,
}) => {
  const [view, setView] = useState<'choose' | 'colleague' | 'done'>('choose');
  const [colleagueName, setColleagueName] = useState('');
  const [colleagueDesk, setColleagueDesk] = useState('');
  const [colleagueNote, setColleagueNote] = useState('');
  const [completedAction, setCompletedAction] = useState<string>('');

  if (!isOpen) return null;

  const handleSaveAsCredit = () => {
    onConfirmSkip();
    setCompletedAction('saved_credit');
    setView('done');
  };

  const handleSendToColleagueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colleagueName.trim()) return;
    if (onSendToColleague) {
      onSendToColleague({
        name: colleagueName,
        desk: colleagueDesk || 'Same floor desk',
        note: colleagueNote || 'Enjoy lunch from your teammate!',
      });
    }
    setCompletedAction('gifted');
    setView('done');
  };

  const handleClose = () => {
    setView('choose');
    setColleagueName('');
    setColleagueDesk('');
    setColleagueNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Poppins']">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-8 text-left animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black cursor-pointer transition"
        >
          <X className="w-5 h-5" />
        </button>

        {view === 'choose' && (
          <div className="space-y-5">
            {/* Header */}
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#FF4C00] block mb-1">
                Flexible Desk Drop
              </span>
              <h3 className="text-2xl font-black text-black tracking-tight">
                Can't eat lunch today?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
                No problem. Your lunch won't disappear.
              </p>
            </div>

            {/* Current Meal Callout */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  {dateFormatted}
                </span>
                <p className="text-sm font-black text-black mt-0.5">
                  {mealTitle}
                </p>
              </div>
              <span className="text-2xl">🍛</span>
            </div>

            {/* Core Value Reinforcement */}
            <div className="p-3.5 rounded-2xl bg-orange-50/80 border border-orange-200/80 flex items-center space-x-2.5 text-xs text-orange-950 font-medium">
              <Sparkles className="w-4 h-4 text-[#FF4C00] shrink-0" />
              <span>
                Skipping doesn’t mean losing your lunch. Choose how you want to use its value:
              </span>
            </div>

            {/* Interactive Options */}
            <div className="space-y-3">
              {/* Option 1: Save as credit */}
              <button
                type="button"
                onClick={handleSaveAsCredit}
                className="w-full p-4 rounded-2xl border-2 border-zinc-200 hover:border-black bg-white hover:bg-zinc-50/80 transition cursor-pointer text-left group flex items-start space-x-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-black">
                      💳 Save as credit
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      +₦3,200 to Wallet
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium mt-1">
                    Keep the full value in your Lunch Wallet to redeem for any future workday or extra plate.
                  </p>
                </div>
              </button>

              {/* Option 2: Send to someone */}
              <button
                type="button"
                onClick={() => setView('colleague')}
                className="w-full p-4 rounded-2xl border-2 border-zinc-200 hover:border-black bg-white hover:bg-zinc-50/80 transition cursor-pointer text-left group flex items-start space-x-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-[#FF4C00] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-black">
                      👥 Send it to someone
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#FF4C00]">
                      Gift to Colleague
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium mt-1">
                    Transfer today’s desk drop hot meal to a colleague or teammate on your floor.
                  </p>
                </div>
              </button>
            </div>

            {/* Keep lunch button */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleClose}
                className="text-xs font-bold text-zinc-500 hover:text-black transition cursor-pointer flex items-center justify-center space-x-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Keep today's lunch</span>
              </button>
            </div>
          </div>
        )}

        {view === 'colleague' && (
          <form onSubmit={handleSendToColleagueSubmit} className="space-y-4">
            <div>
              <button
                type="button"
                onClick={() => setView('choose')}
                className="text-xs font-bold text-zinc-500 hover:text-black flex items-center space-x-1 mb-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <h3 className="text-xl font-black text-black">
                Send Today's Lunch to a Colleague
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                We'll route {mealTitle} directly to their desk today before 12:00 PM.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">
                  Colleague's Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Femi Adeyemi"
                  value={colleagueName}
                  onChange={(e) => setColleagueName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 font-medium text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">
                  Desk / Suite Details (Landmark Towers)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Floor 4, Product Design Cluster"
                  value={colleagueDesk}
                  onChange={(e) => setColleagueDesk(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 font-medium text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">
                  Friendly Note (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Hey Femi, enjoy today's Jollof Rice on me!"
                  value={colleagueNote}
                  onChange={(e) => setColleagueNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 font-medium text-black focus:outline-none focus:border-black resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setView('choose')}
                className="w-1/3 py-3 rounded-full border border-zinc-300 hover:bg-zinc-100 text-xs font-bold text-zinc-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-2/3 py-3 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm Gift to Colleague</span>
              </button>
            </div>
          </form>
        )}

        {view === 'done' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            {completedAction === 'saved_credit' ? (
              <div>
                <h3 className="text-xl font-black text-black">
                  Lunch Saved as Credit!
                </h3>
                <p className="text-xs text-zinc-500 font-medium max-w-sm mx-auto mt-1">
                  ₦3,200 has been added to your Lunch Wallet. It will never expire and can be used on any future workday.
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-black text-black">
                  Lunch Gifted to {colleagueName}!
                </h3>
                <p className="text-xs text-zinc-500 font-medium max-w-sm mx-auto mt-1">
                  Our dispatch rider will deliver today’s warm lunch to {colleagueName} at {colleagueDesk || 'your office cluster'}.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="mt-4 px-8 py-3 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-bold cursor-pointer transition"
            >
              Back to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

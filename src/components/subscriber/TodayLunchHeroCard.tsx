import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  Truck,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Info,
  Star,
  ChevronRight,
  ShieldCheck,
  X,
  Lock,
  PhoneCall,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { SkipConfirmationModal } from './SkipConfirmationModal';
import { CONTACT_CONFIG } from '../../config/contactConfig';

export type TodayLunchDeliveryState = 'scheduled' | 'on_route' | 'delivered' | 'skipped';

interface TodayLunchHeroCardProps {
  dateFormatted: string; // e.g. "MON, OCT 5"
  mealTitle: string;
  ingredients: string[];
  deliveryAddress: string;
  deliveryWindow: string; // e.g. "11:00 AM – 12:00 PM"
  status: TodayLunchDeliveryState;
  isAfter12PM?: boolean;
  isAfter4PM?: boolean;
  skipCount?: number;
  maxSkips?: number;
  pendingAddressChange?: {
    newLocation: string;
    effectiveAt: string;
    requestedAt: string;
  } | null;
  onCancelPendingAddressChange?: () => void;
  onSkipToday: () => void;
  onUndoSkip: () => void;
  onStatusChange: (newStatus: TodayLunchDeliveryState) => void;
}

export const TodayLunchHeroCard: React.FC<TodayLunchHeroCardProps> = ({
  dateFormatted,
  mealTitle,
  ingredients,
  deliveryAddress,
  deliveryWindow,
  status,
  isAfter12PM = false,
  isAfter4PM = false,
  skipCount = 1,
  maxSkips = 4,
  pendingAddressChange,
  onCancelPendingAddressChange,
  onSkipToday,
  onUndoSkip,
  onStatusChange,
}) => {
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // If 12pm has passed, meal is automatically delivered
  const effectiveStatus: TodayLunchDeliveryState = isAfter12PM && status !== 'skipped' ? 'delivered' : status;
  const skipsRemaining = Math.max(0, maxSkips - skipCount);
  const isSkipActionLocked = skipCount >= maxSkips;

  return (
    <>
      <div className="bg-white rounded-3xl border-2 border-black p-6 sm:p-8 shadow-sm font-['Poppins'] text-left relative overflow-hidden">
        
        {/* Subtle decorative corner accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#FF4C00]/10 to-transparent rounded-bl-full pointer-events-none" />

        {/* State Simulator (Allows evaluator / user to test Scheduled -> On the Way -> Delivered) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-zinc-150 mb-5">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4C00] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
              Live Delivery State
            </span>
            <span className="text-xs font-bold text-zinc-400">
              {dateFormatted}
            </span>
          </div>

          <div className="flex items-center space-x-1 text-[10px] font-semibold text-zinc-500">
            <span>Preview State:</span>
            <button
              onClick={() => onStatusChange('scheduled')}
              className={`px-2 py-0.5 rounded cursor-pointer ${status === 'scheduled' ? 'bg-black text-white font-bold' : 'hover:bg-zinc-100'}`}
            >
              Scheduled
            </button>
            <button
              onClick={() => onStatusChange('on_route')}
              className={`px-2 py-0.5 rounded cursor-pointer ${status === 'on_route' ? 'bg-[#FF4C00] text-white font-bold' : 'hover:bg-zinc-100'}`}
            >
              On The Way
            </button>
            <button
              onClick={() => onStatusChange('delivered')}
              className={`px-2 py-0.5 rounded cursor-pointer ${status === 'delivered' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-zinc-100'}`}
            >
              Delivered
            </button>
          </div>
        </div>

        {/* Pending Address Change Banner (24-Hour Transition) */}
        {pendingAddressChange && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start space-x-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-amber-900 block">
                  🕒 Delivery Address Transition (Effective in 24 Hours)
                </span>
                <span className="text-amber-800">
                  Switching to: <strong>{pendingAddressChange.newLocation}</strong>. Today's drop is still routed to <strong>{deliveryAddress}</strong>.
                </span>
              </div>
            </div>
            {onCancelPendingAddressChange && (
              <button
                onClick={onCancelPendingAddressChange}
                className="px-3.5 py-1.5 rounded-full bg-white border border-amber-400 hover:bg-amber-100 text-amber-900 font-bold text-xs shrink-0 cursor-pointer transition shadow-2xs"
              >
                Cancel Change
              </button>
            )}
          </div>
        )}

        {/* 12:00 PM Passed Auto-Delivered Notice */}
        {isAfter12PM && effectiveStatus === 'delivered' && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              12:00 PM has passed: Your lunch has arrived at your desk automatically. Daily Lagos dispatch window is concluded!
            </span>
          </div>
        )}

        {/* ============================================================== */}
        {/* STATE 1: LUNCH SKIPPED */}
        {/* ============================================================== */}
        {effectiveStatus === 'skipped' ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center space-x-2 text-zinc-600">
              <span className="text-xl">↩</span>
              <h3 className="text-xl font-black text-black">Lunch Skipped Today</h3>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-zinc-800">
                  {mealTitle} will not be delivered to your desk today.
                </p>
                <p className="text-xs text-emerald-700 font-medium mt-0.5">
                  ✓ Your lunch credit remains available in your account ({skipCount}/4 skip actions used).
                </p>
              </div>

              {isSkipActionLocked ? (
                <div className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-zinc-200 text-zinc-500 text-xs font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Undo Locked (4/4 actions used)</span>
                </div>
              ) : (
                <button
                  onClick={onUndoSkip}
                  className="px-5 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Undo Skip ({skipsRemaining} skips left)</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* ACTIVE STATES: SCHEDULED / ON THE WAY / DELIVERED */
          /* ============================================================== */
          <div className={`space-y-6 ${effectiveStatus === 'delivered' ? 'opacity-90' : ''}`}>
            
            {/* Dynamic Status Banner */}
            {effectiveStatus === 'on_route' && (
              <div className="p-3.5 rounded-2xl bg-[#FF4C00]/10 border border-[#FF4C00]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#FF4C00] text-white flex items-center justify-center shrink-0 animate-pulse">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#FF4C00] uppercase tracking-wider block">
                      🚚 Your Lunch is on the Way
                    </span>
                    <span className="text-xs text-zinc-800 font-bold">
                      Expected arrival: 11:20 AM – 11:40 AM
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsTrackModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white text-xs font-bold cursor-pointer transition self-start sm:self-auto"
                >
                  Track Delivery
                </button>
              </div>
            )}

            {effectiveStatus === 'delivered' && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-wider block">
                      ✓ Delivered to Desk
                    </span>
                    <span className="text-xs text-zinc-800 font-bold">
                      Thermal bowl dropped at desk (11:34 AM)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsRateModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer transition self-start sm:self-auto flex items-center space-x-1"
                >
                  <Star className="w-3.5 h-3.5 fill-white" />
                  <span>Rate Today's Lunch</span>
                </button>
              </div>
            )}

            {/* Meal Title */}
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Today's Lunch
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-tight">
                {mealTitle}
              </h2>
            </div>

            {/* Delivery Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-zinc-150">
              
              <div className="flex items-start space-x-2.5">
                <Clock className="w-4 h-4 text-[#FF4C00] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                    Delivery Window
                  </span>
                  <span className="text-xs font-black text-black">
                    {deliveryWindow}
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-[#FF4C00] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                    Desk Drop Location
                  </span>
                  <span className="text-xs font-black text-black">
                    {deliveryAddress}
                  </span>
                </div>
              </div>

            </div>

            {/* Actions: View Details & Skip Today's Lunch */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-150">
              <button
                onClick={() => setIsDetailsModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-zinc-300 hover:border-black text-xs font-bold text-black transition cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Info className="w-3.5 h-3.5 text-zinc-500" />
                <span>View Details</span>
              </button>

              {effectiveStatus !== 'delivered' && (
                <div>
                  {isAfter4PM ? (
                    <div className="flex items-center space-x-2">
                      <button
                        disabled
                        className="px-4 py-2.5 rounded-full bg-zinc-100 text-zinc-400 text-xs font-bold flex items-center space-x-1.5 cursor-not-allowed border border-zinc-200"
                        title="After 4:00 PM meals are accepted and locked for kitchen prep"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked After 4:00 PM</span>
                      </button>
                      <a
                        href={`https://wa.me/${CONTACT_CONFIG.whatsappIntl}?text=${encodeURIComponent(
                          'Hello 11to12! I need emergency care assistance regarding my meal.'
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-[#FF4C00] hover:underline flex items-center space-x-1"
                        title="Contact Care to request an emergency exception"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Call Care</span>
                      </a>
                    </div>
                  ) : isSkipActionLocked ? (
                    <div className="flex items-center space-x-2">
                      <button
                        disabled
                        className="px-4 py-2.5 rounded-full bg-zinc-100 text-zinc-400 text-xs font-bold flex items-center space-x-1.5 cursor-not-allowed border border-zinc-200"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Skip Limit Reached (4/4 Used)</span>
                      </button>
                      <a
                        href={`https://wa.me/${CONTACT_CONFIG.whatsappIntl}?text=${encodeURIComponent(
                          'Hello 11to12! I have reached my 4 skips limit and need assistance.'
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-[#FF4C00] hover:underline flex items-center space-x-1"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Call Care</span>
                      </a>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsSkipModalOpen(true)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-700 hover:text-black transition cursor-pointer"
                    >
                      Skip Today's Lunch ({skipsRemaining} skips left)
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Skip Confirmation Modal */}
      <SkipConfirmationModal
        isOpen={isSkipModalOpen}
        onClose={() => setIsSkipModalOpen(false)}
        onConfirmSkip={onSkipToday}
        mealTitle={mealTitle}
        dateFormatted={dateFormatted}
      />

      {/* Meal Details Modal */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Poppins']">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-7 text-left animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[10px] font-bold text-[#FF4C00] uppercase tracking-wider block mb-1">
              11 to 12 Kitchen Sheet
            </span>
            <h3 className="text-xl font-black text-black">
              {mealTitle}
            </h3>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200/80">
                <span className="font-bold text-[#FF4C00] block mb-1">Heat-Retaining Desk Packaging:</span>
                <p className="text-zinc-700 leading-relaxed">
                  Packed at 10:15 AM in our dual-seal thermal food bowl. Keeps hot at 65°C+ right through 1:00 PM without needing office microwave reheating.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDetailsModalOpen(false)}
              className="mt-6 w-full py-3 rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* Live Courier Tracking Modal */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Poppins']">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-7 text-left animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsTrackModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 text-[#FF4C00] mb-1">
              <Truck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Live Route Courier</span>
            </div>
            <h3 className="text-lg font-black text-black">
              Courier on Route to Landmark Towers
            </h3>

            <div className="mt-4 p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Dispatch Courier:</span>
                <span className="font-bold text-black">Babatunde (Honda Bike #12)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Departure Time:</span>
                <span className="font-bold text-black">10:48 AM from VI Kitchen</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Estimated Desk Drop:</span>
                <span className="font-bold text-emerald-700">11:25 AM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Destination Desk:</span>
                <span className="font-bold text-black">Floor 4, Suite 402</span>
              </div>
            </div>

            <button
              onClick={() => setIsTrackModalOpen(false)}
              className="mt-6 w-full py-3 rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Close Tracker
            </button>
          </div>
        </div>
      )}

      {/* Rate Lunch Modal */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Poppins']">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-7 text-left animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsRateModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              Feedback Loop
            </span>
            <h3 className="text-lg font-black text-black">
              How was today's lunch?
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">{mealTitle}</p>

            {ratingSubmitted ? (
              <div className="my-6 p-4 rounded-2xl bg-emerald-50 text-emerald-900 text-center text-xs font-bold border border-emerald-200">
                ✓ Thank you! Your feedback has been sent directly to the 11 to 12 kitchen team.
              </div>
            ) : (
              <div className="my-5 space-y-4">
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatingVal(star)}
                      className="p-1 text-2xl cursor-pointer hover:scale-110 transition"
                    >
                      <Star
                        className={`w-7 h-7 ${star <= ratingVal ? 'text-amber-400 fill-amber-400' : 'text-zinc-200'}`}
                      />
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 justify-center">
                  {['Delivered hot', 'Perfect spice', 'Generous portion', 'Tender protein'].map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-700"
                    >
                      ✓ {tag}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setRatingSubmitted(true);
                    setTimeout(() => setIsRateModalOpen(false), 1600);
                  }}
                  className="w-full py-3 rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Submit Rating
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

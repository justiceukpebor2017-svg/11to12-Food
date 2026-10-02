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
  Flame,
  ChefHat,
  PackageCheck,
  Send,
} from 'lucide-react';
import { SkipConfirmationModal } from './SkipConfirmationModal';

export type TodayLunchDeliveryState = 'preparing' | 'packed' | 'on_the_way' | 'delivered' | 'skipped';

interface TodayLunchHeroCardProps {
  dateFormatted: string; // e.g. "MON, OCT 5"
  mealTitle: string;
  emoji?: string;
  ingredients: string[];
  deliveryAddress: string;
  deliveryWindow?: string; // e.g. "11:00 AM — 12:00 PM"
  status: TodayLunchDeliveryState;
  onChangeDesk?: () => void;
  onSkipToday: () => void;
  onUndoSkip: () => void;
  onStatusChange: (newStatus: TodayLunchDeliveryState) => void;
  onSendToColleague?: (colleague: { name: string; desk: string; note: string }) => void;
}

export const TodayLunchHeroCard: React.FC<TodayLunchHeroCardProps> = ({
  dateFormatted,
  mealTitle,
  emoji = '🍛',
  ingredients,
  deliveryAddress,
  deliveryWindow = '11:00 AM — 12:00 PM',
  status,
  onChangeDesk,
  onSkipToday,
  onUndoSkip,
  onStatusChange,
  onSendToColleague,
}) => {
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);
  const [isWheresMyLunchOpen, setIsWheresMyLunchOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Delivery Stages Definition
  const stages = [
    {
      id: 'preparing',
      label: 'Preparing',
      shortLabel: 'Kitchen',
      icon: ChefHat,
      time: '09:30 AM',
      headline: 'Your lunch is being prepared',
      detail: 'Chef Justice and kitchen team are simmering fresh firewood Jollof and grilling tender chicken.',
      tag: 'Fresh Firewood Kitchen',
    },
    {
      id: 'packed',
      label: 'Packed',
      shortLabel: 'Packed',
      icon: PackageCheck,
      time: '10:45 AM',
      headline: 'Your lunch is packed & sealed',
      detail: 'Sealed hot in our dual-layer insulated thermal bowl at 78°C. Preserved warm until your lunch hour.',
      tag: '78°C Thermal Sealed',
    },
    {
      id: 'on_the_way',
      label: 'On the way',
      shortLabel: 'Rider',
      icon: Truck,
      time: '11:15 AM',
      headline: '🚚 Your lunch has left the kitchen.',
      detail: 'Rider Musa has departed Victoria Island kitchen heading directly to Landmark Towers. Expected before 12:00 PM.',
      tag: 'Lagos Island Express Route',
    },
    {
      id: 'delivered',
      label: 'Delivered',
      shortLabel: 'Desk',
      icon: CheckCircle2,
      time: '11:42 AM',
      headline: '✓ Lunch delivered. Enjoy!',
      detail: 'Dropped safely at Floor 4 desk cluster. Hot, fresh, and ready for your desk break.',
      tag: 'Desk Drop Completed',
    },
  ];

  const currentStageIndex =
    status === 'preparing'
      ? 0
      : status === 'packed'
      ? 1
      : status === 'on_the_way'
      ? 2
      : status === 'delivered'
      ? 3
      : 0;

  // Dynamic countdown headline per user prompt
  const getDynamicCountdownMessage = () => {
    switch (status) {
      case 'preparing':
        return {
          timePill: '10:30 AM',
          text: '🍛 Your lunch is coming. 30 minutes to lunch.',
          accent: 'text-orange-950 bg-orange-100/80 border-orange-200',
        };
      case 'packed':
        return {
          timePill: '10:55 AM',
          text: '🚚 Your lunch is almost here.',
          accent: 'text-amber-950 bg-amber-100/80 border-amber-200',
        };
      case 'on_the_way':
        return {
          timePill: '11:15 AM',
          text: '🚚 Your lunch is on the way.',
          accent: 'text-[#FF4C00] bg-orange-50 border-orange-300 font-bold',
        };
      case 'delivered':
        return {
          timePill: '11:42 AM',
          text: '🍱 Lunch delivered. Enjoy!',
          accent: 'text-emerald-950 bg-emerald-100 border-emerald-300 font-bold',
        };
      default:
        return {
          timePill: 'Today',
          text: 'Your lunch is sorted.',
          accent: 'text-zinc-800 bg-zinc-100 border-zinc-200',
        };
    }
  };

  const dynamicCountdown = getDynamicCountdownMessage();

  return (
    <>
      <div className="bg-white rounded-3xl border-2 border-black p-6 sm:p-8 shadow-sm font-['Poppins'] text-left relative overflow-hidden transition-all">
        {/* Subtle decorative warm gradient corner */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-[#FF4C00]/10 via-amber-100/20 to-transparent rounded-bl-full pointer-events-none" />

        {/* State Simulator Bar (Helps test Preparing -> Packed -> On the way -> Delivered -> Skipped) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-zinc-150 mb-5">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
              Interactive State Tracker
            </span>
          </div>

          <div className="flex items-center space-x-1 text-[11px] font-semibold text-zinc-500 overflow-x-auto py-1">
            <span className="text-[10px] text-zinc-400 mr-1 hidden sm:inline">Preview:</span>
            <button
              type="button"
              onClick={() => onStatusChange('preparing')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                status === 'preparing'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              Preparing
            </button>
            <button
              type="button"
              onClick={() => onStatusChange('packed')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                status === 'packed'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              Packed
            </button>
            <button
              type="button"
              onClick={() => onStatusChange('on_the_way')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                status === 'on_the_way'
                  ? 'bg-[#FF4C00] text-white shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              On the way
            </button>
            <button
              type="button"
              onClick={() => onStatusChange('delivered')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                status === 'delivered'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              Delivered
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SKIPPED STATE */}
        {/* ============================================================== */}
        {status === 'skipped' ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2 text-zinc-500">
              <span className="text-2xl">⏸</span>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">
                  TODAY · {dateFormatted}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-black">
                  Lunch Skipped for Today
                </h3>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-zinc-800">
                  {mealTitle} won't be delivered to your desk today.
                </p>
                <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                  ✓ ₦3,200 preserved in your Lunch Wallet. Ready whenever you want an extra meal.
                </p>
              </div>

              <button
                type="button"
                onClick={onUndoSkip}
                className="px-5 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer self-start sm:self-auto shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo Skip (Restore Lunch)</span>
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* ACTIVE HERO OBJECT */
          /* ============================================================== */
          <div className="space-y-6">
            
            {/* Top Date Header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#FF4C00] block mb-0.5">
                  TODAY · {dateFormatted}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-tight flex items-center space-x-2.5">
                  <span>{emoji}</span>
                  <span>{mealTitle}</span>
                </h2>
              </div>

              {/* Dynamic Time Countdown Callout */}
              <div className={`px-3.5 py-1.5 rounded-2xl border text-xs flex items-center space-x-2 ${dynamicCountdown.accent}`}>
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{dynamicCountdown.text}</span>
              </div>
            </div>

            {/* Current Active Status Headline */}
            <div className="text-base sm:text-lg font-bold text-zinc-800 flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-[#FF4C00] animate-ping" />
              <span>{stages[currentStageIndex].headline}</span>
            </div>

            {/* ============================================================== */}
            {/* DELIVERY STATE TRACKER: Kitchen → Packed → Rider → Desk */}
            {/* ============================================================== */}
            <div className="space-y-3 pt-2">
              <div className="relative">
                {/* Horizontal Progress Bar Track */}
                <div className="absolute top-4 left-6 right-6 h-1 bg-zinc-200 -z-0 rounded-full">
                  <div
                    className="h-full bg-gradient-to-r from-black via-[#FF4C00] to-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width:
                        currentStageIndex === 0
                          ? '12%'
                          : currentStageIndex === 1
                          ? '38%'
                          : currentStageIndex === 2
                          ? '70%'
                          : '100%',
                    }}
                  />
                </div>

                {/* 4 Interactive Milestones */}
                <div className="grid grid-cols-4 gap-2 relative z-10">
                  {stages.map((stg, idx) => {
                    const isCompleted = idx < currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    const IconComponent = stg.icon;

                    return (
                      <button
                        key={stg.id}
                        type="button"
                        onClick={() => {
                          onStatusChange(stg.id as TodayLunchDeliveryState);
                          setIsWheresMyLunchOpen(true);
                        }}
                        className="group flex flex-col items-center text-center cursor-pointer focus:outline-none"
                      >
                        {/* Circle Indicator */}
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                            isCurrent
                              ? 'bg-black text-white ring-4 ring-[#FF4C00]/30 scale-110 shadow-md animate-pulse'
                              : isCompleted
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white border-2 border-zinc-300 text-zinc-400 group-hover:border-zinc-400'
                          }`}
                        >
                          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>

                        {/* Stage Name */}
                        <span
                          className={`mt-2 text-xs font-bold leading-tight block ${
                            isCurrent
                              ? 'text-black font-black'
                              : isCompleted
                              ? 'text-emerald-700'
                              : 'text-zinc-400'
                          }`}
                        >
                          {stg.label}
                        </span>

                        {/* Subtitle / Time */}
                        <span className="text-[10px] text-zinc-400 font-medium hidden sm:inline">
                          {stg.time}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Window Bar */}
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2 text-zinc-700">
                  <Clock className="w-4 h-4 text-[#FF4C00]" />
                  <span className="font-bold">Desk Drop Window:</span>
                  <span className="font-black text-black">{deliveryWindow}</span>
                </div>

                <div className="flex items-center space-x-1.5 text-zinc-600">
                  <MapPin className="w-3.5 h-3.5 text-[#FF4C00]" />
                  <span className="font-medium truncate max-w-[200px] sm:max-w-none">{deliveryAddress}</span>
                  {onChangeDesk && (
                    <button
                      type="button"
                      onClick={onChangeDesk}
                      className="text-[11px] font-bold text-[#FF4C00] hover:underline ml-1 cursor-pointer"
                    >
                      [Change]
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* What's In Today's Lunch preview pills */}
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Included in your desk portion
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ingredients.slice(0, 4).map((ing, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-800"
                  >
                    • {ing}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero Interactive Action Buttons: [ View delivery / Where's my lunch? ] [ Skip lunch ] */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-150">
              <button
                type="button"
                onClick={() => setIsWheresMyLunchOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-2 shadow-xs"
              >
                <Truck className="w-3.5 h-3.5 text-[#FF4C00]" />
                <span>Where's my lunch? (View Delivery)</span>
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                {status === 'delivered' ? (
                  <button
                    type="button"
                    onClick={() => setIsRateModalOpen(true)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
                  >
                    <Star className="w-3.5 h-3.5 fill-white" />
                    <span>Rate Lunch</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSkipModalOpen(true)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-zinc-300 hover:border-black hover:bg-zinc-50 text-xs font-bold text-zinc-700 hover:text-black transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>Skip today's lunch</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ============================================================== */}
      {/* "WHERE'S MY LUNCH?" INTERACTIVE DRAWER / MODAL */}
      {/* ============================================================== */}
      {isWheresMyLunchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Poppins']">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-8 text-left animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsWheresMyLunchOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-[#FF4C00] mb-1">
              <Truck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Live Delivery Tracker
              </span>
            </div>
            <h3 className="text-2xl font-black text-black">
              Where's my lunch?
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Live status for {mealTitle} • {deliveryAddress}
            </p>

            {/* Current Stage Highlight Box */}
            <div className="my-5 p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/50 border border-orange-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-[#FF4C00] text-white text-[10px] font-black uppercase">
                  {stages[currentStageIndex].tag}
                </span>
                <span className="text-xs font-bold text-zinc-500">
                  Updated: {stages[currentStageIndex].time}
                </span>
              </div>
              <h4 className="text-base font-black text-black">
                {stages[currentStageIndex].headline}
              </h4>
              <p className="text-xs text-zinc-700 font-medium leading-relaxed">
                {stages[currentStageIndex].detail}
              </p>
            </div>

            {/* Complete 4-Step Route Details */}
            <div className="space-y-4 text-xs">
              <span className="font-black text-black text-sm block">Route Timeline</span>

              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
                {stages.map((stg, idx) => {
                  const isCurrent = idx === currentStageIndex;
                  const isPast = idx < currentStageIndex;

                  return (
                    <div key={stg.id} className="relative flex items-start space-x-3.5 pl-1">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 text-[10px] font-bold ${
                          isCurrent
                            ? 'bg-[#FF4C00] text-white ring-4 ring-orange-200'
                            : isPast
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-200 text-zinc-500'
                        }`}
                      >
                        {isPast ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1 bg-zinc-50/80 p-3 rounded-2xl border border-zinc-200/70">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className={`font-black ${isCurrent ? 'text-[#FF4C00]' : 'text-black'}`}>
                            {stg.label} ({stg.shortLabel})
                          </span>
                          <span className="text-[11px] text-zinc-400 font-semibold">{stg.time}</span>
                        </div>
                        <p className="text-zinc-600 text-[11px] leading-relaxed">
                          {stg.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Courier & Desk Drop Details */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 space-y-2 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Dedicated Courier:</span>
                  <span className="font-bold text-black">Musa A. (Dispatch Van #04)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Target Delivery Desk:</span>
                  <span className="font-bold text-black">{deliveryAddress}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Thermal Bowl Temp:</span>
                  <span className="font-bold text-emerald-700">75°C (Steam Sealed)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Need Immediate Help?</span>
                  <a
                    href="https://wa.me/2348031234567?text=Hello%2011to12!%20Where%20is%20my%20desk%20drop%20lunch%20today%3F"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#FF4C00] hover:underline"
                  >
                    WhatsApp Kitchen Team →
                  </a>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsWheresMyLunchOpen(false)}
              className="mt-6 w-full py-3 rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Close Tracker
            </button>
          </div>
        </div>
      )}

      {/* Skip Confirmation Modal */}
      <SkipConfirmationModal
        isOpen={isSkipModalOpen}
        onClose={() => setIsSkipModalOpen(false)}
        onConfirmSkip={onSkipToday}
        onSendToColleague={onSendToColleague}
        mealTitle={mealTitle}
        dateFormatted={dateFormatted}
      />

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
                ✓ Thank you! Your feedback has been sent directly to Chef Justice.
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

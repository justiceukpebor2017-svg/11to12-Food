import React, { useState } from 'react';
import { MealRating } from '../../types';
import { Star, Download, FileText, Image as ImageIcon, MessageSquare, CheckCircle2 } from 'lucide-react';

interface MealHistoryArchiveProps {
  ratingsHistory: MealRating[];
  onAddRating: (rating: MealRating) => void;
}

export const MealHistoryArchive: React.FC<MealHistoryArchiveProps> = ({ ratingsHistory, onAddRating }) => {
  const [selectedMealForRating, setSelectedMealForRating] = useState<MealRating | null>(null);
  const [newRatingStars, setNewRatingStars] = useState<number>(5);
  const [newComment, setNewComment] = useState('');

  const handleDownloadReceipt = (monthStr: string) => {
    // Generate simulated printable PDF receipt trigger
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>11 to 12 Corporate Food Subscription Receipt - ${monthStr}</title>
            <style>
              body { font-family: 'Courier New', monospace; padding: 40px; color: #000; background: #fff; }
              .header { border-bottom: 4px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 28px; font-weight: 900; text-transform: uppercase; }
              .meta { font-size: 14px; font-weight: bold; margin-top: 5px; }
              .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .table th, .table td { border: 3px solid #000; padding: 12px; text-align: left; font-weight: bold; }
              .table th { background: #FACC15; }
              .total { font-size: 20px; font-weight: 900; margin-top: 20px; text-align: right; border-top: 4px solid #000; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">11 TO 12 FOOD SERVICE LAGOS</div>
              <div class="meta">CORPORATE EXPENSE TAX RECEIPT • ISSUED TO 11 TO 12 SUBSCRIBER</div>
              <div class="meta">INVOICE MONTH: ${monthStr} • STATUS: PAID (PAYSTACK REF #PSTK-99201)</div>
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>ITEM DESCRIPTION</th>
                  <th>QTY</th>
                  <th>RATE (NGN)</th>
                  <th>AMOUNT (NGN)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Corporate Power Lunch Subscription (20 Workdays)</td>
                  <td>20 Meals</td>
                  <td>₦3,800</td>
                  <td>₦76,000</td>
                </tr>
                <tr>
                  <td>Surprise Snack Pack Add-on (Small Chops & Juice)</td>
                  <td>20 Packs</td>
                  <td>₦1,200</td>
                  <td>₦24,000</td>
                </tr>
                <tr>
                  <td>10% Add-on & Duration Discount</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-₦10,000</td>
                </tr>
              </tbody>
            </table>
            <div class="total">TOTAL PAID: ₦90,000.00</div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const submitNewRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMealForRating) return;

    const updated: MealRating = {
      ...selectedMealForRating,
      rating: newRatingStars,
      comment: newComment || 'Great meal!',
    };

    onAddRating(updated);
    setSelectedMealForRating(null);
    setNewComment('');
  };

  return (
    <div className="space-y-8">
      
      {/* Delivered Meals Rating Table & Photo Gallery */}
      <div className="bg-white border-4 border-black text-black p-6 sm:p-8 shadow-[8px_8px_0px_#000]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-3 border-black">
          <div>
            <span className="text-xs font-black uppercase text-black bg-[#FACC15] px-3 py-1 border-2 border-black font-mono-custom shadow-[2px_2px_0px_#000]">
              KITCHEN FEEDBACK LOOP
            </span>
            <h3 className="text-2xl font-black uppercase font-heading text-black mt-2">DELIVERED MEAL ARCHIVE & RATINGS</h3>
            <p className="text-xs font-bold text-zinc-700 mt-1 uppercase tracking-wider">
              Your star ratings directly influence 11 to 12's menu planning for next month.
            </p>
          </div>

          <span className="text-xs font-black font-mono-custom text-black bg-[#22C55E] px-4 py-2 border-2 border-black shadow-[2px_2px_0px_#000] uppercase">
            {ratingsHistory.length} MEALS DELIVERED
          </span>
        </div>

        {/* Meal Table */}
        <div className="overflow-x-auto mt-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-3 border-black text-black font-mono-custom font-black uppercase">
                <th className="py-3 px-4">DISH PHOTO</th>
                <th className="py-3 px-4">MEAL TITLE</th>
                <th className="py-3 px-4">DELIVERY DATE</th>
                <th className="py-3 px-4">RATING</th>
                <th className="py-3 px-4">YOUR FEEDBACK</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black font-bold">
              {ratingsHistory.map((item) => (
                <tr key={item.id} className="hover:bg-[#FACC15]/20 transition">
                  <td className="py-3 px-4">
                    <img
                      src={item.imageUrl}
                      alt={item.mealTitle}
                      className="w-12 h-12 border-2 border-black object-cover shadow-[2px_2px_0px_#000]"
                    />
                  </td>
                  <td className="py-3 px-4 font-black uppercase text-black max-w-xs">{item.mealTitle}</td>
                  <td className="py-3 px-4 font-mono-custom text-zinc-800">{item.dateStr}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 stroke-[3] ${
                            i < item.rating ? 'fill-[#FF4C00] text-[#FF4C00]' : 'text-zinc-300'
                          }`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-zinc-800 italic max-w-xs truncate">"{item.comment}"</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedMealForRating(item);
                        setNewRatingStars(item.rating);
                        setNewComment(item.comment);
                      }}
                      className="px-3.5 py-1.5 bg-[#FF4C00] hover:bg-[#e04300] text-white font-black uppercase text-[11px] border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer transition-all"
                    >
                      EDIT RATING
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Rating Modal */}
      {selectedMealForRating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-white border-4 border-black p-6 max-w-md w-full text-black shadow-[10px_10px_0px_#000] space-y-4">
            <h4 className="text-xl font-black uppercase font-heading text-black">RATE {selectedMealForRating.mealTitle}</h4>
            
            {/* Star Selector */}
            <div className="flex justify-center space-x-2 my-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewRatingStars(star)}
                  className="p-2 transition transform hover:scale-110 cursor-pointer"
                >
                  <Star
                    className={`w-9 h-9 stroke-[3] ${
                      star <= newRatingStars ? 'fill-[#FF4C00] text-[#FF4C00]' : 'text-zinc-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Feedback for 11 to 12 Kitchen</label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                placeholder="e.g. Loved the firewood aroma! Spicy sauce was spot on."
                className="w-full bg-[#F8F8F8] border-3 border-black p-3 text-xs font-bold text-black focus:outline-none focus:bg-white"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedMealForRating(null)}
                className="flex-1 py-3 bg-zinc-200 hover:bg-zinc-300 text-black font-black uppercase text-xs border-2 border-black cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={submitNewRating}
                className="flex-1 py-3 bg-[#22C55E] hover:bg-[#1eb052] text-black font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0px_#000] cursor-pointer"
              >
                SAVE RATING
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing & Receipts Archive */}
      <div className="bg-white border-4 border-black text-black p-6 sm:p-8 shadow-[8px_8px_0px_#000]">
        <div className="flex items-center justify-between pb-4 border-b-3 border-black">
          <div>
            <h4 className="text-xl font-black uppercase font-heading text-black flex items-center space-x-2">
              <FileText className="w-6 h-6 text-[#FF4C00]" />
              <span>BILLING ARCHIVE & PDF RECEIPTS</span>
            </h4>
            <p className="text-xs font-bold text-zinc-700 mt-1 uppercase tracking-wider">
              Instant tax-ready receipts for corporate expense reimbursement claims.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {['July 2026', 'June 2026', 'May 2026'].map((month, idx) => (
            <div
              key={idx}
              className="bg-[#F8F8F8] p-4 border-3 border-black flex items-center justify-between shadow-[4px_4px_0px_#000]"
            >
              <div>
                <span className="text-xs font-black uppercase text-black block">{month} Subscription</span>
                <span className="text-[10px] text-zinc-600 font-mono-custom font-bold block">INVOICE #INV-2026-{90 + idx}</span>
                <span className="text-xs text-[#22C55E] font-black font-mono-custom">₦90,000.00 PAID</span>
              </div>

              <button
                onClick={() => handleDownloadReceipt(month)}
                className="p-3 bg-[#FF4C00] hover:bg-[#e04300] text-white border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer transition-all"
                title="Download PDF Receipt"
              >
                <Download className="w-5 h-5 stroke-[3]" />
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};


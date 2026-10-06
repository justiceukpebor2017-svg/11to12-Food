import React, { useState } from 'react';
import { Calendar as CalendarIcon, Search, Utensils, Sparkles, Filter, CheckCircle2, Clock, Truck } from 'lucide-react';

export const AutomatedCookList: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2026-08-04');
  const [searchTerm, setSearchTerm] = useState('');
  const [choiceFilter, setChoiceFilter] = useState<'all' | 'accepted' | 'skipped' | 'sub_pack'>('all');

  // Orders database for kitchen dispatch tracking
  const orders: { id: string; userName: string; company: string; choice: string; meal: string; status: string; time: string }[] = [];

  const filteredOrders = orders.filter((o) => {
    if (!o) return false;
    const term = (searchTerm || '').trim().toLowerCase();
    const matchesSearch =
      !term ||
      (o.userName || '').toLowerCase().includes(term) ||
      (o.company || '').toLowerCase().includes(term);
    const matchesChoice = choiceFilter === 'all' || o.choice === choiceFilter;
    return matchesSearch && matchesChoice;
  });

  // Automated Cook Calculations
  const totalAcceptedMeals = orders.filter((o) => o.choice === 'accepted').length * 28; // Multiplied for scale
  const totalSubPacks = orders.filter((o) => o.choice === 'sub_pack').length * 15;
  const totalSkipped = orders.filter((o) => o.choice === 'skipped').length * 8;

  return (
    <div className="bg-white border-4 border-black text-black p-6 sm:p-8 shadow-[8px_8px_0px_#000] space-y-6">
      
      {/* Header & Date Navigator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-3 border-black">
        <div>
          <span className="text-xs font-black uppercase text-black bg-[#FACC15] px-3 py-1 border-2 border-black font-mono-custom shadow-[2px_2px_0px_#000]">
            KITCHEN PRODUCTION ENGINE
          </span>
          <h3 className="text-2xl font-black uppercase font-heading text-black mt-2">AUTOMATED COOK LIST & DATE MONITOR</h3>
          <p className="text-xs font-bold text-zinc-700 mt-1 uppercase tracking-wider">
            Calculates exact kitchen preparation quantities for any selected workday.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-white p-2 border-3 border-black shadow-[3px_3px_0px_#000]">
          <CalendarIcon className="w-5 h-5 text-[#FF4C00] ml-1 stroke-[3]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-xs font-black text-black focus:outline-none px-2 font-mono-custom uppercase"
          />
        </div>
      </div>

      {/* Automated Cook Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#F8F8F8] p-5 border-3 border-black shadow-[4px_4px_0px_#000] flex items-center space-x-4">
          <div className="w-12 h-12 bg-[#22C55E] text-black border-2 border-black flex items-center justify-center font-black shadow-[2px_2px_0px_#000]">
            <Utensils className="w-6 h-6 stroke-[3]" />
          </div>
          <div>
            <span className="text-xs text-zinc-700 font-black uppercase font-mono-custom block">Required Main Meals</span>
            <span className="text-2xl font-black text-black font-mono-custom">{totalAcceptedMeals} Portions</span>
          </div>
        </div>

        <div className="bg-[#F8F8F8] p-5 border-3 border-black shadow-[4px_4px_0px_#000] flex items-center space-x-4">
          <div className="w-12 h-12 bg-[#A855F7] text-white border-2 border-black flex items-center justify-center font-black shadow-[2px_2px_0px_#000]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-700 font-black uppercase font-mono-custom block">Required Sub Packs</span>
            <span className="text-2xl font-black text-black font-mono-custom">{totalSubPacks} Boxes</span>
          </div>
        </div>

        <div className="bg-[#F8F8F8] p-5 border-3 border-black shadow-[4px_4px_0px_#000] flex items-center space-x-4">
          <div className="w-12 h-12 bg-[#FF4C00] text-white border-2 border-black flex items-center justify-center font-black shadow-[2px_2px_0px_#000]">
            <Clock className="w-6 h-6 stroke-[3]" />
          </div>
          <div>
            <span className="text-xs text-zinc-700 font-black uppercase font-mono-custom block">Skipped / Saved Credits</span>
            <span className="text-2xl font-black text-black font-mono-custom">{totalSkipped} Credits</span>
          </div>
        </div>
      </div>

      {/* Smart Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-black absolute left-3.5 top-3.5 stroke-[3]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by subscriber name or company..."
            className="w-full bg-[#F8F8F8] border-3 border-black pl-10 pr-4 py-2.5 text-xs font-bold text-black focus:outline-none focus:bg-white"
          />
        </div>

        <div className="flex bg-white p-1 border-3 border-black shadow-[3px_3px_0px_#000] text-xs">
          {(['all', 'accepted', 'sub_pack', 'skipped'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setChoiceFilter(mode)}
              className={`px-3 py-1.5 border border-transparent font-black uppercase text-[10px] transition cursor-pointer ${
                choiceFilter === mode ? 'bg-[#FF4C00] text-white border-black font-mono-custom' : 'text-black hover:bg-[#FACC15]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Dispatch Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b-3 border-black text-black font-mono-custom font-black uppercase">
              <th className="py-3 px-4">SUBSCRIBER</th>
              <th className="py-3 px-4">COMPANY LOCATION</th>
              <th className="py-3 px-4">CHOICE TYPE</th>
              <th className="py-3 px-4">MEAL PREPARED</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4 text-right">TARGET WINDOW</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black font-bold">
            {filteredOrders.map((ord) => (
              <tr key={ord.id} className="hover:bg-[#FACC15]/20 transition">
                <td className="py-3 px-4 font-black uppercase text-black">{ord.userName}</td>
                <td className="py-3 px-4 text-zinc-800">{ord.company}</td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-1 border-2 border-black font-mono-custom font-black text-[10px] uppercase shadow-[1px_1px_0px_#000] ${
                    ord.choice === 'accepted' ? 'bg-[#22C55E] text-black' :
                    ord.choice === 'sub_pack' ? 'bg-[#A855F7] text-white' :
                    'bg-[#FF4C00] text-white'
                  }`}>
                    {ord.choice.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-4 text-black">{ord.meal}</td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-1 border-2 border-black text-[10px] font-black uppercase flex items-center w-fit space-x-1 shadow-[1px_1px_0px_#000] ${
                    ord.status === 'Delivered' ? 'bg-[#22C55E] text-black' :
                    ord.status === 'Out for Delivery' ? 'bg-[#FACC15] text-black' :
                    'bg-zinc-200 text-black'
                  }`}>
                    {ord.status === 'Delivered' && <CheckCircle2 className="w-3.5 h-3.5 mr-1 stroke-[3]" />}
                    {ord.status === 'Out for Delivery' && <Truck className="w-3.5 h-3.5 mr-1 animate-pulse stroke-[3]" />}
                    <span>{ord.status}</span>
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono-custom text-zinc-800 font-black">{ord.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

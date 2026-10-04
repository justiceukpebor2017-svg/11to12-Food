import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  UtensilsCrossed,
  Truck,
  CreditCard,
  ShoppingBag,
  Sparkles,
  RotateCcw,
  Sliders,
  ChevronRight,
  ExternalLink,
  Quote,
} from 'lucide-react';

export type AdminTab =
  | 'operations-today'
  | 'customers'
  | 'waitlist'
  | 'menu'
  | 'orders'
  | 'production'
  | 'payments'
  | 'credits-skips'
  | 'homepage-sync'
  | 'testimonials';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  onNavigateToHome: () => void;
  pendingOrdersCount: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  onNavigateToHome,
  pendingOrdersCount,
}) => {
  const navSections = [
    {
      group: 'MAIN',
      items: [
        {
          id: 'operations-today' as AdminTab,
          label: "Today's Operations",
          icon: LayoutDashboard,
          badge: 'Live',
          badgeColor: 'bg-emerald-500 text-white',
        },
      ],
    },
    {
      group: 'CUSTOMERS',
      items: [
        { id: 'customers' as AdminTab, label: 'Customers', icon: Users },
        { id: 'waitlist' as AdminTab, label: 'Waitlist', icon: Sparkles },
      ],
    },
    {
      group: 'MENU',
      items: [
        { id: 'menu' as AdminTab, label: 'Weekly Menu', icon: UtensilsCrossed },
      ],
    },
    {
      group: 'OPERATIONS',
      items: [
        {
          id: 'orders' as AdminTab,
          label: 'Orders',
          icon: ShoppingBag,
          badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} new` : undefined,
          badgeColor: 'bg-[#FF4C00] text-white',
        },
        { id: 'production' as AdminTab, label: 'Production', icon: UtensilsCrossed },
      ],
    },
    {
      group: 'FINANCE',
      items: [
        { id: 'payments' as AdminTab, label: 'Payments', icon: CreditCard },
        { id: 'credits-skips' as AdminTab, label: 'Credits / Skips', icon: RotateCcw },
      ],
    },
    {
      group: 'CONTENT & SOCIAL PROOF',
      items: [
        { id: 'testimonials' as AdminTab, label: 'Testimonials', icon: Quote },
        { id: 'homepage-sync' as AdminTab, label: 'Homepage Sync', icon: Sliders },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-zinc-950 text-white flex flex-col border-r border-zinc-800 shrink-0 font-['Poppins']">
      
      {/* Brand Header */}
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
            alt="11 to 12"
            className="h-9 w-auto object-contain"
          />
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">11 to 12</h2>
            <p className="text-[10px] text-[#FF4C00] font-semibold uppercase tracking-wider">
              Operating System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {navSections.map((sec) => (
          <div key={sec.group}>
            <span className="px-3 text-[10px] font-bold text-zinc-500 tracking-wider uppercase block mb-2">
              {sec.group}
            </span>
            <div className="space-y-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-[#FF4C00] text-white shadow-sm font-bold'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-300')
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom User & Home Return */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-[#FF4C00] text-white flex items-center justify-center font-bold text-xs">
              JU
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-white block truncate">Chef Justice</span>
              <span className="text-[10px] text-zinc-400 block truncate">Head of Kitchen Ops</span>
            </div>
          </div>
        </div>

        <button
          onClick={onNavigateToHome}
          className="w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
        >
          <span>View Public Homepage</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

    </aside>
  );
};

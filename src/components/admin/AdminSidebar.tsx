import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  CreditCard,
  UserCheck,
  CalendarDays,
  Settings,
  ExternalLink,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

export type AdminTab =
  | 'dashboard'
  | 'waitlist'
  | 'pending-payments'
  | 'customers'
  | 'meal-schedule'
  | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  onNavigateToHome: () => void;
  onLogout?: () => void;
  pendingOrdersCount: number;
  waitlistCount?: number;
  customersCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  onNavigateToHome,
  onLogout,
  pendingOrdersCount,
  waitlistCount = 0,
  customersCount = 0,
}) => {
  const navItems = [
    {
      id: 'dashboard' as AdminTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'waitlist' as AdminTab,
      label: 'Waitlist',
      icon: Sparkles,
      badge: waitlistCount > 0 ? String(waitlistCount) : undefined,
      badgeColor: 'bg-zinc-800 text-zinc-300',
    },
    {
      id: 'pending-payments' as AdminTab,
      label: 'Pending Payments',
      icon: CreditCard,
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount}` : undefined,
      badgeColor: 'bg-[#FF4C00] text-white animate-pulse',
    },
    {
      id: 'customers' as AdminTab,
      label: 'Customers',
      icon: UserCheck,
      badge: customersCount > 0 ? String(customersCount) : undefined,
      badgeColor: 'bg-emerald-950 text-emerald-400 border border-emerald-800/60',
    },
    {
      id: 'meal-schedule' as AdminTab,
      label: 'Meal Schedule',
      icon: CalendarDays,
    },
    {
      id: 'settings' as AdminTab,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-[#121212] text-white flex flex-col border-r border-zinc-800 shrink-0 font-['Poppins']">
      
      {/* Brand Header */}
      <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
            alt="11 to 12"
            className="h-9 w-auto object-contain"
          />
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">11 to 12</h2>
            <p className="text-[10px] text-[#FF4C00] font-semibold uppercase tracking-wider">
              Admin Control
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-[#FF4C00] text-white shadow-md font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                    item.badgeColor || 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer Actions */}
      <div className="p-4 border-t border-zinc-800/80 space-y-2">
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-white hover:bg-red-950/50 transition cursor-pointer border border-red-900/40"
            title="Safely sign out and release active session"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>Sign Out Admin</span>
          </button>
        )}
        <button
          onClick={onNavigateToHome}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer border border-zinc-800/60"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>View Website</span>
        </button>
      </div>

    </aside>
  );
};

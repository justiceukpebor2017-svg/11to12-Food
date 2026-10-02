import React, { useState } from 'react';
import {
  Bell,
  User,
  ChevronDown,
  LogOut,
  MapPin,
  Settings,
  ShieldCheck,
  Home,
  Calendar,
  Utensils,
  CreditCard,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface UserDashboardHeaderProps {
  activeTab: 'dashboard' | 'lunches' | 'menu' | 'billing' | 'help';
  setActiveTab: (tab: 'dashboard' | 'lunches' | 'menu' | 'billing' | 'help') => void;
  userName: string;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenDeliveryDetails: () => void;
  onSwitchToAdmin: () => void;
  onSwitchToLanding: () => void;
  onLogOut: () => void;
}

export const UserDashboardHeader: React.FC<UserDashboardHeaderProps> = ({
  activeTab,
  setActiveTab,
  userName,
  unreadCount,
  onOpenNotifications,
  onOpenProfile,
  onOpenDeliveryDetails,
  onSwitchToAdmin,
  onSwitchToLanding,
  onLogOut,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <>
      {/* Desktop & Tablet Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 font-['Poppins'] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Brand Logo & Tag */}
            <div className="flex items-center space-x-8">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('dashboard');
                }}
                className="flex items-center space-x-3 group"
              >
                <img
                  src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
                  alt="11 to 12"
                  className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://i.ibb.co/mV0z77Mb/11to12logg.png';
                  }}
                />
              </a>

              {/* Main Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3.5 py-2 rounded-full transition cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                  }`}
                >
                  Dashboard
                </button>

                <button
                  onClick={() => setActiveTab('lunches')}
                  className={`px-3.5 py-2 rounded-full transition cursor-pointer ${
                    activeTab === 'lunches'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                  }`}
                >
                  My Lunches
                </button>

                <button
                  onClick={() => setActiveTab('menu')}
                  className={`px-3.5 py-2 rounded-full transition cursor-pointer ${
                    activeTab === 'menu'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                  }`}
                >
                  Menu
                </button>

                <button
                  onClick={() => setActiveTab('billing')}
                  className={`px-3.5 py-2 rounded-full transition cursor-pointer ${
                    activeTab === 'billing'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                  }`}
                >
                  Plan & Billing
                </button>

                <button
                  onClick={() => setActiveTab('help')}
                  className={`px-3.5 py-2 rounded-full transition cursor-pointer ${
                    activeTab === 'help'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                  }`}
                >
                  Help
                </button>
              </nav>
            </div>

            {/* Right Controls: Notifications & User Avatar Dropdown */}
            <div className="flex items-center space-x-3">
              
              {/* Notification Bell */}
              <button
                onClick={onOpenNotifications}
                className="relative p-2.5 rounded-full hover:bg-zinc-100 text-zinc-600 hover:text-black transition cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#FF4C00] rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* User Dropdown Pill */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2.5 py-1.5 pl-2 pr-3.5 rounded-full bg-[#FAF7F2] hover:bg-zinc-200/70 border border-zinc-200 text-xs font-bold text-black transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs uppercase">
                    {userName.charAt(0)}
                  </div>
                  <span className="hidden sm:inline">{userName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-zinc-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-zinc-100">
                      <p className="text-xs font-bold text-black">{userName}</p>
                      <p className="text-[10px] text-zinc-400">Desk Drop Active</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={onOpenProfile}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center space-x-2 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Profile & Preferences</span>
                      </button>

                      <button
                        onClick={onOpenDeliveryDetails}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center space-x-2 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Delivery Addresses</span>
                      </button>

                      <button
                        onClick={onSwitchToLanding}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center space-x-2 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Public Landing Page</span>
                      </button>

                      <button
                        onClick={onSwitchToAdmin}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-[#FF4C00] hover:bg-orange-50 flex items-center space-x-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#FF4C00]" />
                        <span>Kitchen Admin OS</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-zinc-100">
                      <button
                        onClick={onLogOut}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation (as specified by user) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 px-3 py-2 flex items-center justify-around font-['Poppins'] shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center space-y-1 text-[10px] font-bold py-1 px-2 rounded-xl transition ${
            activeTab === 'dashboard' ? 'text-[#FF4C00]' : 'text-zinc-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('lunches')}
          className={`flex flex-col items-center space-y-1 text-[10px] font-bold py-1 px-2 rounded-xl transition ${
            activeTab === 'lunches' ? 'text-[#FF4C00]' : 'text-zinc-500'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>Lunches</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center space-y-1 text-[10px] font-bold py-1 px-2 rounded-xl transition ${
            activeTab === 'menu' ? 'text-[#FF4C00]' : 'text-zinc-500'
          }`}
        >
          <Utensils className="w-5 h-5" />
          <span>Menu</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`flex flex-col items-center space-y-1 text-[10px] font-bold py-1 px-2 rounded-xl transition ${
            activeTab === 'billing' ? 'text-[#FF4C00]' : 'text-zinc-500'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span>Plan</span>
        </button>

        <button
          onClick={onOpenProfile}
          className="flex flex-col items-center space-y-1 text-[10px] font-bold py-1 px-2 rounded-xl text-zinc-500"
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </button>
      </div>
    </>
  );
};

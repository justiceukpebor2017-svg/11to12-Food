import React from 'react';
import { X, Bell, CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  type: 'delivery' | 'meal' | 'billing' | 'system';
  isUnread: boolean;
}

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-['Poppins']">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FF4C00]/10 flex items-center justify-center text-[#FF4C00]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-black">Notifications</h3>
              <p className="text-[11px] text-zinc-500">Your desk drop and lunch updates</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onMarkAllRead}
              className="text-[11px] font-bold text-[#FF4C00] hover:underline cursor-pointer"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-zinc-200 text-zinc-400 hover:text-black cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border transition ${
                item.isUnread
                  ? 'bg-orange-50/50 border-[#FF4C00]/30 shadow-xs'
                  : 'bg-white border-zinc-150'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-black block">{item.title}</span>
                <span className="text-[10px] text-zinc-400 whitespace-nowrap">{item.timeAgo}</span>
              </div>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{item.message}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 bg-[#FAF7F2] text-center">
          <span className="text-[11px] text-zinc-500">
            Push notifications dispatched daily before 11:00 AM
          </span>
        </div>

      </div>
    </div>
  );
};

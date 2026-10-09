import React, { useState } from 'react';
import {
  MenuItem,
  UserProfile,
  AdminAnnouncement,
  InventoryItem,
  SupportTicket,
  OrderSubmission,
  TimeWindow,
  CustomerRecord,
  WaitlistLead,
  CreditRedemptionOrder,
  TestimonialItem,
  LaunchSettings,
} from '../types';
import { AdminSidebar, AdminTab } from '../components/admin/AdminSidebar';
import { AdminDashboardTab } from '../components/admin/tabs/AdminDashboardTab';
import { AdminWaitlistTab } from '../components/admin/tabs/AdminWaitlistTab';
import { AdminPendingPaymentsTab } from '../components/admin/tabs/AdminPendingPaymentsTab';
import { AdminCustomersTab } from '../components/admin/tabs/AdminCustomersTab';
import { AdminMealScheduleTab } from '../components/admin/tabs/AdminMealScheduleTab';
import { AdminSettingsTab } from '../components/admin/tabs/AdminSettingsTab';
import { Menu, X, Bell, Trash2, Rocket } from 'lucide-react';
import { LAUNCH_CONFIG } from '../config/launchConfig';

const DISMISSED_NOTIFS_KEY = '11to12_dismissed_admin_notifications';

interface AdminDashboardPageProps {
  menuItems: MenuItem[];
  subscribers: UserProfile[];
  announcements: AdminAnnouncement[];
  inventoryItems: InventoryItem[];
  tickets: SupportTicket[];
  submittedOrders?: OrderSubmission[];
  userProfile?: UserProfile;
  onUpdateProfile?: (updated: UserProfile) => void;
  todayMeal?: MenuItem;
  tomorrowMeal?: MenuItem;
  timeWindow?: TimeWindow;
  customers?: CustomerRecord[];
  waitlistLeads?: WaitlistLead[];
  onUpdateWaitlistLead?: (lead: WaitlistLead) => void;
  onDeleteWaitlistLead?: (leadId: string) => void;
  onAddCustomer?: (customer: CustomerRecord) => void;
  onUpdateCustomer?: (customer: CustomerRecord) => void;
  onDeleteCustomer?: (customerId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
  onSimulateUserActivation?: (customer: CustomerRecord) => void;
  onNavigateToSubscriber?: () => void;
  onConfirmOrderPayment?: (orderId: string) => void;
  onNavigateToHome?: () => void;
  onAddAnnouncement?: (ann: AdminAnnouncement) => void;
  onDeleteAnnouncement?: (id: string) => void;
  onUpdateStock?: (id: string, qty: number) => void;
  onAddInventoryItem?: (item: InventoryItem) => void;
  onUpdateMenuItem?: (item: MenuItem) => void;
  onToggleUserStatus?: (userId: string) => void;
  onRefundCredit?: (userId: string) => void;
  onResolveTicket?: (ticketId: string) => void;
  creditRedemptions?: CreditRedemptionOrder[];
  onConfirmCreditRedemption?: (redemptionId: string) => void;
  onConfirmTopUpOrder?: (orderId: string) => void;
  testimonials?: TestimonialItem[];
  onAddTestimonial?: (item: Omit<TestimonialItem, 'id'>) => Promise<TestimonialItem | void>;
  onUpdateTestimonial?: (id: string, patch: Partial<TestimonialItem>) => Promise<TestimonialItem | null | void>;
  onDeleteTestimonial?: (id: string) => Promise<boolean | void>;
  launchSettings?: LaunchSettings;
  onUpdateLaunchSettings?: (settings: LaunchSettings) => void;
  onLogout?: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  submittedOrders = [],
  customers = [],
  waitlistLeads = [],
  onUpdateWaitlistLead,
  onDeleteWaitlistLead,
  onUpdateCustomer,
  onDeleteCustomer,
  onDeleteOrder,
  onConfirmOrderPayment = () => {},
  onNavigateToHome = () => {},
  onLogout,
  launchSettings,
  onUpdateLaunchSettings,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState<CustomerRecord | null>(null);

  // Persistent dismissed notification IDs
  const [dismissedNotifIds, setDismissedNotifIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = localStorage.getItem(DISMISSED_NOTIFS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {}
    return new Set();
  });

  const dismissNotification = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDismissedNotifIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(DISMISSED_NOTIFS_KEY, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const handleNotificationClick = (id: string, targetTab: AdminTab) => {
    dismissNotification(id);
    setActiveTab(targetTab);
    setShowNotifications(false);
  };

  // Compile active un-dismissed notifications
  const activeNotifications = React.useMemo(() => {
    const list: Array<{ id: string; title: string; subtitle: string; tab: AdminTab; type: string; time?: string }> = [];

    // Pending orders
    (submittedOrders || [])
      .filter((o) => o.paymentStatus === 'Pending Verification' && !dismissedNotifIds.has(`order-${o.id}`))
      .forEach((o) => {
        list.push({
          id: `order-${o.id}`,
          title: `Pending Payment: ${o.fullName}`,
          subtitle: `${o.totalDays} Lunches • ₦${(o.finalTotalNGN || 0).toLocaleString()} awaiting verification`,
          tab: 'pending-payments',
          type: 'order',
          time: o.submittedAt,
        });
      });

    // Waitlist leads
    (waitlistLeads || [])
      .filter((l) => l.status === 'Waitlisted' && !dismissedNotifIds.has(`lead-${l.id}`))
      .slice(0, 10)
      .forEach((l) => {
        list.push({
          id: `lead-${l.id}`,
          title: `Waitlist: ${l.name}`,
          subtitle: `Code: ${l.memberCode} • ${l.workplace || 'Office'}`,
          tab: 'waitlist',
          type: 'waitlist',
          time: l.createdAt,
        });
      });

    return list;
  }, [submittedOrders, waitlistLeads, dismissedNotifIds]);

  const pendingOrdersCount = submittedOrders.filter(
    (o) => o.paymentStatus === 'Pending Verification'
  ).length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1A1A] font-['Poppins'] flex flex-col md:flex-row antialiased">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-[#121212] text-white p-4 flex items-center justify-between border-b border-zinc-800 sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <img
            src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
            alt="11 to 12"
            className="h-7 w-auto object-contain"
          />
          <span className="text-xs font-bold text-zinc-300">Admin Control</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Notifications Button */}
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-zinc-900 text-zinc-300 relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {activeNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF4C00] text-white text-[9px] font-bold flex items-center justify-center">
                {activeNotifications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 rounded-xl bg-zinc-900 text-white cursor-pointer"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'customers') setSelectedCustomerProfile(null);
          }}
          onNavigateToHome={onNavigateToHome}
          onLogout={onLogout}
          pendingOrdersCount={pendingOrdersCount}
          waitlistCount={waitlistLeads.length}
          customersCount={customers.length}
        />
      </div>

      {/* Mobile Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 flex">
          <div className="w-64 bg-[#121212] h-full shadow-2xl flex flex-col">
            <AdminSidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setIsMobileSidebarOpen(false);
                if (tab !== 'customers') setSelectedCustomerProfile(null);
              }}
              onNavigateToHome={onNavigateToHome}
              onLogout={onLogout}
              pendingOrdersCount={pendingOrdersCount}
              waitlistCount={waitlistLeads.length}
              customersCount={customers.length}
            />
          </div>
          <div className="flex-1" onClick={() => setIsMobileSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 overflow-y-auto max-w-full">
        
        {/* Top Header Bar for Desktop */}
        <div className="hidden md:flex items-center justify-between pb-6 mb-6 border-b border-zinc-200/80">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF4C00]">
              11 to 12 Kitchen Operations
            </span>
            <h2 className="text-xl font-bold text-zinc-900 capitalize">
              {activeTab.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            
            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-700 hover:text-black hover:border-zinc-300 transition cursor-pointer relative shadow-2xs"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {activeNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF4C00] text-white text-[9px] font-bold flex items-center justify-center shadow-xs animate-pulse">
                    {activeNotifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-3xl p-4 shadow-2xl z-50 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                    <div className="flex items-center space-x-1.5">
                      <Bell className="w-4 h-4 text-[#FF4C00]" />
                      <span className="font-bold text-xs text-zinc-900">Notifications</span>
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      {activeNotifications.length} unread
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100">
                    {activeNotifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-zinc-400">
                        No new notifications. All cleared!
                      </div>
                    ) : (
                      activeNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif.id, notif.tab)}
                          className="py-2.5 px-2 hover:bg-zinc-50 rounded-xl transition cursor-pointer flex items-start justify-between space-x-2 group"
                        >
                          <div>
                            <div className="font-bold text-xs text-zinc-900">{notif.title}</div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">{notif.subtitle}</div>
                            <span className="text-[9px] text-[#FF4C00] font-semibold block mt-0.5">
                              Click to view in {notif.tab.replace('-', ' ')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => dismissNotification(notif.id, e)}
                            className="p-1 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition opacity-60 group-hover:opacity-100"
                            title="Dismiss permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="px-3.5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-semibold text-xs transition cursor-pointer shadow-2xs flex items-center space-x-1.5"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>{LAUNCH_CONFIG.isEnabled ? 'Launch Settings' : 'Settings'}</span>
            </button>
          </div>
        </div>

        {/* 1. Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <AdminDashboardTab
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              if (tab !== 'customers') setSelectedCustomerProfile(null);
            }}
            customers={customers}
            submittedOrders={submittedOrders}
            waitlistLeads={waitlistLeads}
            onOpenCustomerProfile={(c) => {
              setSelectedCustomerProfile(c);
              setActiveTab('customers');
            }}
          />
        )}

        {/* 2. Waitlist Tab */}
        {activeTab === 'waitlist' && (
          <AdminWaitlistTab
            waitlistLeads={waitlistLeads}
            onDeleteWaitlistLead={onDeleteWaitlistLead}
            onUpdateWaitlistLead={onUpdateWaitlistLead}
          />
        )}

        {/* 3. Pending Payments Tab */}
        {activeTab === 'pending-payments' && (
          <AdminPendingPaymentsTab
            orders={submittedOrders}
            customers={customers}
            onConfirmPayment={onConfirmOrderPayment}
            onDeleteOrder={onDeleteOrder}
            onOpenCustomerProfile={(c) => {
              setSelectedCustomerProfile(c);
              setActiveTab('customers');
            }}
          />
        )}

        {/* 4. Customers Tab */}
        {activeTab === 'customers' && (
          <AdminCustomersTab
            customers={customers}
            onUpdateCustomer={onUpdateCustomer}
            onDeleteCustomer={onDeleteCustomer}
            selectedCustomer={selectedCustomerProfile}
            onCloseCustomerProfile={() => setSelectedCustomerProfile(null)}
            onOpenCustomerProfile={(c) => setSelectedCustomerProfile(c)}
          />
        )}

        {/* 5. Meal Schedule Tab */}
        {activeTab === 'meal-schedule' && (
          <AdminMealScheduleTab
            customers={customers}
            onOpenCustomerProfile={(c) => {
              setSelectedCustomerProfile(c);
              setActiveTab('customers');
            }}
          />
        )}

        {/* 6. Settings Tab */}
        {activeTab === 'settings' && (
          <AdminSettingsTab
            launchSettings={launchSettings}
            onUpdateLaunchSettings={onUpdateLaunchSettings}
            onNavigateHome={onNavigateToHome}
          />
        )}

      </main>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
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
import { TodayOperationsView } from '../components/admin/TodayOperationsView';
import { CustomersManager } from '../components/admin/CustomersManager';
import { WaitlistManager } from '../components/admin/WaitlistManager';
import { WeeklyMenuManager } from '../components/admin/WeeklyMenuManager';
import { OrdersManager } from '../components/admin/OrdersManager';
import { ProductionDashboard } from '../components/admin/ProductionDashboard';
import { PaymentsManager } from '../components/admin/PaymentsManager';
import { CreditsSkipsManager } from '../components/admin/CreditsSkipsManager';
import { HomepageSyncManager } from '../components/admin/HomepageSyncManager';
import { TestimonialsManager } from '../components/admin/TestimonialsManager';
import { Menu, X, ArrowLeft, Rocket } from 'lucide-react';
import { LAUNCH_CONFIG, subscribeLaunchConfig } from '../config/launchConfig';

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
  onUpdateLaunchSettings?: (settings: Partial<LaunchSettings>) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  submittedOrders = [],
  customers = [],
  waitlistLeads = [],
  onUpdateWaitlistLead,
  onDeleteWaitlistLead,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onDeleteOrder,
  onSimulateUserActivation,
  onNavigateToSubscriber,
  userProfile,
  onUpdateProfile,
  todayMeal,
  tomorrowMeal,
  timeWindow,
  onConfirmOrderPayment = () => {},
  onNavigateToHome = () => {},
  creditRedemptions = [],
  onConfirmCreditRedemption,
  onConfirmTopUpOrder,
  testimonials = [],
  onAddTestimonial = async () => {},
  onUpdateTestimonial = async () => null,
  onDeleteTestimonial = async () => {},
  launchSettings,
  onUpdateLaunchSettings,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('operations-today');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [adminDate, setAdminDate] = useState<Date>(
    () => new Date(LAUNCH_CONFIG.year, LAUNCH_CONFIG.monthIndex, LAUNCH_CONFIG.day)
  );

  useEffect(() => {
    const unsub = subscribeLaunchConfig((cfg) => {
      setAdminDate(new Date(cfg.year, cfg.monthIndex, cfg.day));
    });
    return () => unsub();
  }, []);

  const pendingOrdersCount = submittedOrders.filter(
    (o) => o.paymentStatus === 'Pending Verification'
  ).length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1A1A] font-['Poppins'] flex flex-col md:flex-row antialiased">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-zinc-950 text-white p-4 flex items-center justify-between border-b border-zinc-800 sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <img
            src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
            alt="11 to 12"
            className="h-7 w-auto object-contain brightness-0 invert"
          />
          <span className="text-xs font-bold text-zinc-400">Admin Control</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onNavigateToHome}
            className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#FF4C00]" />
            <span>Storefront</span>
          </button>
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-1.5 rounded-lg bg-zinc-800 text-white"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToHome={onNavigateToHome}
          pendingOrdersCount={pendingOrdersCount}
        />
      </div>

      {/* Mobile Sliding Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="w-64 bg-zinc-950 h-full flex flex-col">
            <AdminSidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setIsMobileSidebarOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateToHome={() => {
                setIsMobileSidebarOpen(false);
                onNavigateToHome();
              }}
              pendingOrdersCount={pendingOrdersCount}
            />
          </div>
          <div
            className="flex-1 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        
        {/* Quick Launch Status Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-zinc-200 shadow-2xs text-xs">
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 rounded-lg bg-orange-100 text-[#FF4C00]">
              <Rocket className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                Deliveries Launching Status
              </span>
              <span className="font-bold text-zinc-900">
                {LAUNCH_CONFIG.isEnabled ? (
                  <>🚀 Scheduled: <strong className="text-[#FF4C00]">{LAUNCH_CONFIG.displayDate}</strong> (Live on Homepage)</>
                ) : (
                  <span className="text-emerald-700 font-black">✓ Officially Launched • All Calendars Live (Launch date removed)</span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('homepage-sync')}
              className="px-3 py-1.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-[11px] transition cursor-pointer shadow-2xs"
            >
              {LAUNCH_CONFIG.isEnabled ? 'Edit or Remove Launch Date' : 'Set Launch Date'}
            </button>
          </div>
        </div>

        {/* Operations Today (Home / Mission Control) */}
        {activeTab === 'operations-today' && (
          <TodayOperationsView
            onNavigateTab={(tab) => setActiveTab(tab)}
            submittedOrders={submittedOrders}
            customers={customers}
            waitlistLeads={waitlistLeads}
          />
        )}

        {/* Customers */}
        {activeTab === 'customers' && (
          <CustomersManager
            submittedOrders={submittedOrders}
            customers={customers}
            waitlistLeads={waitlistLeads}
            onAddCustomer={onAddCustomer}
            onUpdateCustomer={onUpdateCustomer}
            onDeleteCustomer={onDeleteCustomer}
            onDeleteOrder={onDeleteOrder}
            onSimulateUserActivation={onSimulateUserActivation}
            onNavigateToSubscriber={onNavigateToSubscriber}
            currentUserProfile={userProfile}
            onUpdateCurrentUserProfile={onUpdateProfile}
            todayMeal={todayMeal}
            tomorrowMeal={tomorrowMeal}
            timeWindow={timeWindow}
            onConfirmOrderPayment={onConfirmOrderPayment}
          />
        )}

        {/* Waitlist & Founding 50 */}
        {activeTab === 'waitlist' && (
          <WaitlistManager
            waitlistLeads={waitlistLeads}
            onUpdateWaitlistLead={onUpdateWaitlistLead}
            onDeleteWaitlistLead={onDeleteWaitlistLead}
            onConvertToCustomer={(lead) => {
              setActiveTab('customers');
            }}
          />
        )}

        {/* Weekly Menu & Recipes */}
        {activeTab === 'menu' && <WeeklyMenuManager />}

        {/* Live Orders & Invoices */}
        {activeTab === 'orders' && (
          <OrdersManager
            orders={submittedOrders}
            onConfirmPayment={onConfirmOrderPayment}
            onConfirmTopUpOrder={onConfirmTopUpOrder}
            onOnboardOrder={(_order) => {
              setActiveTab('customers');
            }}
            creditRedemptions={creditRedemptions}
            onConfirmCreditRedemption={onConfirmCreditRedemption}
            customers={customers}
            onUpdateCustomer={onUpdateCustomer}
            onDeleteOrder={onDeleteOrder}
            selectedDate={adminDate}
            onSelectDate={setAdminDate}
          />
        )}

        {/* Kitchen Production */}
        {activeTab === 'production' && (
          <ProductionDashboard
            customers={customers}
            creditRedemptions={creditRedemptions}
            selectedDate={adminDate}
            onSelectDate={setAdminDate}
            onUpdateCustomer={onUpdateCustomer}
          />
        )}

        {/* Payments & Financials */}
        {activeTab === 'payments' && (
          <PaymentsManager
            submittedOrders={submittedOrders}
            customers={customers}
            onConfirmOrderPayment={onConfirmOrderPayment}
            onDeleteOrder={onDeleteOrder}
          />
        )}

        {/* Credits & Skips */}
        {activeTab === 'credits-skips' && <CreditsSkipsManager />}

        {/* Homepage Sync & Launch Settings */}
        {activeTab === 'homepage-sync' && (
          <HomepageSyncManager
            onNavigateHome={onNavigateToHome}
            launchSettings={launchSettings}
            onUpdateLaunchSettings={onUpdateLaunchSettings}
          />
        )}

        {/* Website Testimonials (Social Proof / Reviews Control) */}
        {activeTab === 'testimonials' && (
          <TestimonialsManager
            testimonials={testimonials}
            onAddTestimonial={onAddTestimonial}
            onUpdateTestimonial={onUpdateTestimonial}
            onDeleteTestimonial={onDeleteTestimonial}
          />
        )}

      </main>
    </div>
  );
};

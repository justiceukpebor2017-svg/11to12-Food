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
import { Menu, X, ArrowLeft } from 'lucide-react';

interface JusticeDashboardPageProps {
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
  onAddCustomer?: (customer: CustomerRecord) => void;
  onUpdateCustomer?: (customer: CustomerRecord) => void;
  onDeleteCustomer?: (customerId: string) => void;
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
}

export const JusticeDashboardPage: React.FC<JusticeDashboardPageProps> = ({
  submittedOrders = [],
  customers = [],
  waitlistLeads = [],
  onUpdateWaitlistLead,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
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
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('operations-today');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [adminDate, setAdminDate] = useState<Date>(new Date(2026, 8, 22)); // Tuesday Sept 22, 2026

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
            onAddCustomer={onAddCustomer}
            onUpdateCustomer={onUpdateCustomer}
            onDeleteCustomer={onDeleteCustomer}
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
            creditRedemptions={creditRedemptions}
            onConfirmCreditRedemption={onConfirmCreditRedemption}
            customers={customers}
            onUpdateCustomer={onUpdateCustomer}
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
          />
        )}

        {/* Credits & Skips */}
        {activeTab === 'credits-skips' && <CreditsSkipsManager />}

        {/* Homepage Sync */}
        {activeTab === 'homepage-sync' && (
          <HomepageSyncManager onNavigateHome={onNavigateToHome} />
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

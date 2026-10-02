import React, { useState, useEffect } from 'react';
import {
  ViewMode,
  TimeWindow,
  UserProfile,
  MenuItem,
  AdminAnnouncement,
  InventoryItem,
  SupportTicket,
  MealRating,
  SelectedLunchDay,
  OrderSummary,
  OrderSubmission,
  CustomerRecord,
  WaitlistLead,
  CreditRedemptionOrder,
  SwallowType,
} from './types';
import {
  INITIAL_MENU_ITEMS,
  INITIAL_USER_PROFILE,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_INVENTORY,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_MEAL_RATINGS,
  INITIAL_CUSTOMERS,
  INITIAL_WAITLIST_LEADS,
} from './data/mockData';
import { getMealForDate } from './data/menuRotation';
import { Header } from './components/Header';
import { HeroTypewriter } from './components/marketing/HeroTypewriter';
import { DeskDropWaitlistAndTeaser } from './components/marketing/DeskDropWaitlistAndTeaser';
import { ProcessGrid } from './components/marketing/ProcessGrid';
import { InteractiveCalendar } from './components/marketing/InteractiveCalendar';
import { PlanBuilder } from './components/marketing/PlanBuilder';
import { TestimonialsCloud } from './components/marketing/TestimonialsCloud';
import { FaqSection } from './components/marketing/FaqSection';
import { Footer } from './components/Footer';
import { CheckoutModal } from './components/marketing/CheckoutModal';
import { SetPasswordModal } from './components/subscriber/SetPasswordModal';
import { SubscriberAuthModal } from './components/subscriber/SubscriberAuthModal';
import { SubscriberDashboardPage } from './pages/SubscriberDashboardPage';
import { JusticeDashboardPage } from './pages/JusticeDashboardPage';
import { ActivateAccountPage } from './pages/ActivateAccountPage';
import { parseMagicLinkFromUrl, createHydratedCustomerFromMagicLink } from './utils/magicLink';

// Storage Keys to safeguard existing real dashboard users across updates and refreshes
const APP_STORAGE_KEYS = {
  CUSTOMERS: '11to12_persistent_customers_v1',
  WAITLIST: '11to12_persistent_waitlist_leads_v1',
  ORDERS: '11to12_persistent_submitted_orders_v1',
  CREDIT_REDEMPTIONS: '11to12_persistent_credit_redemptions_v1',
  USER_PROFILE: '11to12_persistent_user_profile_v1',
};

export default function App() {
  // Check if URL contains magic link parameters on load
  const [activeActivation, setActiveActivation] = useState<{
    customer: CustomerRecord;
    token: string | null;
  } | null>(() => {
    const parsed = parseMagicLinkFromUrl();
    if (!parsed.isActivateRoute) return null;

    let found: CustomerRecord | null = null;
    try {
      const saved = localStorage.getItem(APP_STORAGE_KEYS.CUSTOMERS);
      if (saved) {
        const stored = JSON.parse(saved) as CustomerRecord[];
        if (Array.isArray(stored)) {
          found =
            stored.find(
              (c) =>
                (parsed.email && c.email.toLowerCase() === parsed.email.toLowerCase()) ||
                (parsed.token && c.magicLinkToken === parsed.token)
            ) || null;
        }
      }
    } catch (e) {
      console.error(e);
    }

    if (!found && parsed.email) {
      found = createHydratedCustomerFromMagicLink(parsed.email, parsed.token || '');
    }

    if (found) {
      return { customer: found, token: parsed.token };
    }
    return null;
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const parsed = parseMagicLinkFromUrl();
    if (parsed.isActivateRoute) return 'activate';
    return 'marketing';
  });
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('morning');
  const [showSubscriberAuthModal, setShowSubscriberAuthModal] = useState(false);

  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(APP_STORAGE_KEYS.USER_PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed;
      }
    } catch (e) {
      console.error('Failed to load user profile from storage', e);
    }
    return INITIAL_USER_PROFILE;
  });

  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>(INITIAL_ANNOUNCEMENTS);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_SUPPORT_TICKETS);
  const [ratingsHistory, setRatingsHistory] = useState<MealRating[]>(INITIAL_MEAL_RATINGS);

  // Customer records list with persistent storage (preserves existing users in the dashboard)
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    try {
      const saved = localStorage.getItem(APP_STORAGE_KEYS.CUSTOMERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load customers from storage', e);
    }
    return INITIAL_CUSTOMERS;
  });

  // Website Waitlist Leads (persisted so signups are never lost)
  const [waitlistLeads, setWaitlistLeads] = useState<WaitlistLead[]>(() => {
    try {
      const saved = localStorage.getItem(APP_STORAGE_KEYS.WAITLIST);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load waitlist from storage', e);
    }
    return INITIAL_WAITLIST_LEADS;
  });

  // Magic Link Onboarding / Password Setup
  const [magicLinkCustomer, setMagicLinkCustomer] = useState<CustomerRecord | null>(null);

  // Selected Lunch Days and Calculated Summary for the 6-Month Plan
  const [selectedLunchDays, setSelectedLunchDays] = useState<SelectedLunchDay[]>([]);
  const [calculatedOrderSummary, setCalculatedOrderSummary] = useState<OrderSummary | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Submitted Orders (persisted so invoices and remittances are retained)
  const [submittedOrders, setSubmittedOrders] = useState<OrderSubmission[]>(() => {
    try {
      const saved = localStorage.getItem(APP_STORAGE_KEYS.ORDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load orders from storage', e);
    }
    return [];
  });

  const [creditRedemptions, setCreditRedemptions] = useState<CreditRedemptionOrder[]>(() => {
    try {
      const saved = localStorage.getItem(APP_STORAGE_KEYS.CREDIT_REDEMPTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load credit redemptions from storage', e);
    }
    return [];
  });

  // Automatic persistent background synchronization
  useEffect(() => {
    try {
      localStorage.setItem(APP_STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.error('Failed to save customers', e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(APP_STORAGE_KEYS.WAITLIST, JSON.stringify(waitlistLeads));
    } catch (e) {
      console.error('Failed to save waitlist', e);
    }
  }, [waitlistLeads]);

  useEffect(() => {
    try {
      localStorage.setItem(APP_STORAGE_KEYS.ORDERS, JSON.stringify(submittedOrders));
    } catch (e) {
      console.error('Failed to save orders', e);
    }
  }, [submittedOrders]);

  useEffect(() => {
    try {
      localStorage.setItem(APP_STORAGE_KEYS.CREDIT_REDEMPTIONS, JSON.stringify(creditRedemptions));
    } catch (e) {
      console.error('Failed to save credit redemptions', e);
    }
  }, [creditRedemptions]);

  useEffect(() => {
    try {
      if (userProfile && userProfile.email) {
        localStorage.setItem(APP_STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
      }
    } catch (e) {
      console.error('Failed to save user profile', e);
    }
  }, [userProfile]);

  // Listen for browser navigation / URL magic link changes
  useEffect(() => {
    const handleUrlChange = () => {
      const parsed = parseMagicLinkFromUrl();
      if (parsed.isActivateRoute) {
        let found: CustomerRecord | null = null;
        if (parsed.email || parsed.token) {
          found =
            customers.find(
              (c) =>
                (parsed.email && c.email.toLowerCase() === parsed.email.toLowerCase()) ||
                (parsed.token && c.magicLinkToken === parsed.token)
            ) || null;
        }
        if (!found && parsed.email) {
          found = createHydratedCustomerFromMagicLink(parsed.email, parsed.token || '');
        }
        if (found) {
          setActiveActivation({ customer: found, token: parsed.token });
          setViewMode('activate');
        }
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [customers]);

  // Credit Redemption Handlers
  const handleAddCreditRedemption = (order: CreditRedemptionOrder) => {
    setCreditRedemptions((prev) => [order, ...prev]);
  };

  const handleConfirmCreditRedemption = (redemptionId: string) => {
    setCreditRedemptions((prev) =>
      prev.map((r) => (r.id === redemptionId ? { ...r, status: 'Confirmed' } : r))
    );
  };

  const handleMoveCreditDate = (redemptionId: string, oldDateStr: string, newDateStr: string, newSwallow?: SwallowType) => {
    setCreditRedemptions((prev) =>
      prev.map((r) => {
        if (r.id !== redemptionId) return r;
        const updatedItems = r.items.map((it) => {
          if (it.dateStr === oldDateStr) {
            return {
              ...it,
              dateStr: newDateStr,
              isFriday: new Date(newDateStr).getDay() === 5,
              swallowChoice: newSwallow || it.swallowChoice,
            };
          }
          return it;
        });
        return {
          ...r,
          items: updatedItems,
        };
      })
    );
  };

  // Customer Management Handlers
  const handleAddCustomer = (newCustomer: CustomerRecord) => {
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  const handleUpdateCustomer = (updated: CustomerRecord) => {
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleOpenMagicLinkActivation = (customer: CustomerRecord) => {
    setActiveActivation({ customer, token: customer.magicLinkToken || null });
    setViewMode('activate');
  };

  const handlePasswordSet = (customer: CustomerRecord, newPass: string) => {
    const updatedCust: CustomerRecord = {
      ...customer,
      isPasswordSet: true,
      password: newPass,
      status: 'Active',
    };
    setCustomers((prev) => {
      const exists = prev.some(
        (c) => c.id === customer.id || (c.email && c.email.toLowerCase() === customer.email.toLowerCase())
      );
      if (exists) {
        return prev.map((c) =>
          c.id === customer.id || (c.email && c.email.toLowerCase() === customer.email.toLowerCase())
            ? updatedCust
            : c
        );
      }
      return [updatedCust, ...prev];
    });

    // Synchronize into current userProfile and load all selected days
    setUserProfile({
      id: customer.id,
      name: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      occupation: 'Corporate Professional',
      company: customer.company,
      address: customer.officeAddress,
      floorSuite: customer.floorSuite,
      deliveryArea: customer.deliveryArea || 'Victoria Island',
      creditsBalance: 0,
      spicePreference: 'Medium',
      proteinsPreferred: ['Spiced Grilled Chicken', 'Assorted Goat Meat'],
      dislikes: customer.notes ? [customer.notes] : [],
      standardLunchTime: '11:45 AM',
      eatLocation: 'Work',
      subscriptionStatus: 'Active',
      planName: customer.planName,
      nextBillingDate: 'Nov 1, 2026',
      totalMealsReceived: 0,
      totalSubscribedDays: customer.totalDays,
      skipCount: 0,
      isPasswordSet: true,
      selectedDays: customer.selectedDays,
      pendingAddressChange: null,
    });

    setMagicLinkCustomer(null);
    setActiveActivation(null);
    setViewMode('subscriber');
  };

  // Derive dynamic meals from canonical 26-week rotation based on current date
  const today = new Date();
  const tomorrow = new Date(today);
  // Next workday: if Friday, next is Monday (+3); if Saturday, next is Monday (+2); else tomorrow (+1)
  const daysToAdd = today.getDay() === 5 ? 3 : today.getDay() === 6 ? 2 : 1;
  tomorrow.setDate(today.getDate() + daysToAdd);

  const canonicalTodayMeal = getMealForDate(today) || getMealForDate(new Date(2026, 9, 5)) || menuItems[0];
  const canonicalTomorrowMeal = getMealForDate(tomorrow) || getMealForDate(new Date(2026, 9, 6)) || menuItems[1];

  const handleProceedToCheckout = (selectedDays: SelectedLunchDay[], summary: OrderSummary) => {
    setSelectedLunchDays(selectedDays);
    setCalculatedOrderSummary(summary);
    setIsCheckoutOpen(true);
  };

  const handleOrderSubmitted = (order: OrderSubmission) => {
    setSubmittedOrders((prev) => [order, ...prev]);

    // Create a real customer record from the paid/submitted plan
    const newCustomer: CustomerRecord = {
      id: `cust-${Date.now()}`,
      fullName: order.fullName,
      email: order.email,
      phone: order.phone,
      company: order.company,
      officeAddress: order.officeAddress,
      floorSuite: order.floorSuite || '',
      deliveryArea: order.deliveryArea || 'Victoria Island',
      notes: '',
      status: 'Active',
      paymentStatus: 'Paid',
      planName: `${order.totalDays} Workday Lunch Plan`,
      totalDays: order.totalDays,
      creditsBalance: 0,
      selectedDays: order.selectedDays,
      subtotalNGN: order.subtotalNGN,
      discountNGN: order.discountNGN,
      finalTotalNGN: order.finalTotalNGN,
      orderRef: order.id,
      memberCode: order.memberCode,
      createdAt: order.submittedAt,
      isPasswordSet: false,
      magicLinkToken: Math.random().toString(36).substring(2, 10),
    };
    setCustomers((prev) => [newCustomer, ...prev]);

    // Deduplicate: If this person was in the waitlist (by unique code or email), remove from waitlist so admin has 0 duplicates
    setWaitlistLeads((prev) =>
      prev.filter((lead) => {
        const matchesCode = Boolean(order.memberCode && lead.memberCode && lead.memberCode.toUpperCase() === order.memberCode.toUpperCase());
        const matchesEmail = lead.email.toLowerCase() === order.email.toLowerCase();
        return !(matchesCode || matchesEmail);
      })
    );

    // Save customer details to prepare their account
    setUserProfile((prev) => ({
      ...prev,
      id: newCustomer.id,
      name: order.fullName,
      email: order.email,
      phone: order.phone,
      company: order.company,
      address: order.officeAddress,
      planName: `${order.totalDays} Workday Lunch Plan`,
      subscriptionStatus: 'Active',
      selectedDays: order.selectedDays,
      totalSubscribedDays: order.totalDays,
    }));
  };

  // Top-Up Order submission from active subscriber dashboard
  const handleTopUpOrderSubmitted = (order: OrderSubmission) => {
    setSubmittedOrders((prev) => [order, ...prev]);

    // Create an urgent admin announcement so the admin gets an instant notification
    const topUpAnnouncement: AdminAnnouncement = {
      id: `ann-${Date.now()}`,
      title: `🔔 Paid Top-Up Invoice: ${order.fullName}`,
      message: `${order.fullName} (${order.company}) submitted a top-up of ${order.totalDays} meal days (₦${order.finalTotalNGN.toLocaleString()}). Invoice #${order.id} is awaiting confirmation to add days to their calendar.`,
      type: 'warning',
      active: true,
      postedAt: new Date().toISOString(),
    };
    setAnnouncements((prev) => [topUpAnnouncement, ...prev]);
  };

  // Admin confirms paid top-up order and synchronizes the added meal days to customer's calendar & production
  const handleConfirmTopUpOrder = (orderId: string) => {
    const order = submittedOrders.find((o) => o.id === orderId);
    if (!order) return;

    // 1. Mark order payment as Confirmed
    setSubmittedOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: 'Confirmed' } : o))
    );

    // 2. Locate customer by orderRef, email, or memberCode
    const custIdx = customers.findIndex(
      (c) =>
        c.orderRef === order.id ||
        c.email.toLowerCase() === order.email.toLowerCase() ||
        (order.memberCode && c.memberCode && c.memberCode.toUpperCase() === order.memberCode.toUpperCase())
    );

    if (custIdx >= 0) {
      const cust = customers[custIdx];
      const existingDays = cust.selectedDays || [];
      const newDays = order.selectedDays || [];

      // Deduplicate by dateStr
      const existingDateSet = new Set(existingDays.map((d) => d.dateStr));
      const daysToAdd = newDays.filter((d) => !existingDateSet.has(d.dateStr));
      const mergedDays = [...existingDays, ...daysToAdd].sort((a, b) => a.dateStr.localeCompare(b.dateStr));

      const updatedCust: CustomerRecord = {
        ...cust,
        selectedDays: mergedDays,
        totalDays: mergedDays.length,
        finalTotalNGN: (cust.finalTotalNGN || 0) + order.finalTotalNGN,
        subtotalNGN: (cust.subtotalNGN || 0) + order.subtotalNGN,
        planName: `${mergedDays.length} Workday Lunch Plan`,
        status: 'Active',
        paymentStatus: 'Paid',
      };

      setCustomers((prev) => {
        const copy = [...prev];
        copy[custIdx] = updatedCust;
        return copy;
      });

      // Synchronize active userProfile if this customer is the logged-in user
      if (userProfile.email.toLowerCase() === cust.email.toLowerCase() || userProfile.id === cust.id) {
        setUserProfile((prev) => ({
          ...prev,
          selectedDays: mergedDays,
          totalSubscribedDays: mergedDays.length,
          planName: `${mergedDays.length} Workday Lunch Plan`,
        }));
      }
    } else {
      // If customer was not yet recorded, register them as an active customer
      const newCustomer: CustomerRecord = {
        id: `cust-${Date.now()}`,
        fullName: order.fullName,
        email: order.email,
        phone: order.phone,
        company: order.company,
        officeAddress: order.officeAddress,
        floorSuite: order.floorSuite || '',
        deliveryArea: order.deliveryArea || 'Victoria Island',
        status: 'Active',
        paymentStatus: 'Paid',
        planName: `${order.totalDays} Workday Lunch Plan`,
        totalDays: order.totalDays,
        creditsBalance: 0,
        selectedDays: order.selectedDays,
        subtotalNGN: order.subtotalNGN,
        discountNGN: order.discountNGN,
        finalTotalNGN: order.finalTotalNGN,
        orderRef: order.id,
        memberCode: order.memberCode,
        createdAt: order.submittedAt,
        isPasswordSet: false,
        magicLinkToken: Math.random().toString(36).substring(2, 10),
      };
      setCustomers((prev) => [newCustomer, ...prev]);
    }

    // 3. Post confirmation announcement
    const confirmedAnnouncement: AdminAnnouncement = {
      id: `ann-${Date.now()}`,
      title: `✅ Top-Up Days Confirmed: ${order.fullName}`,
      message: `Payment confirmed for ${order.fullName}. Added ${order.totalDays} meal days to their active desk drop calendar and synced with kitchen production.`,
      type: 'info',
      active: true,
      postedAt: new Date().toISOString(),
    };
    setAnnouncements((prev) => [confirmedAnnouncement, ...prev]);
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    setUserProfile(updated);
  };

  const handleAddRating = (rating: MealRating) => {
    setRatingsHistory((prev) => {
      const idx = prev.findIndex((r) => r.id === rating.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = rating;
        return copy;
      }
      return [rating, ...prev];
    });
  };

  const handleAddAnnouncement = (ann: AdminAnnouncement) => {
    setAnnouncements((prev) => [ann, ...prev]);
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUpdateStock = (id: string, newQty: number) => {
    setInventoryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, currentStock: newQty } : item))
    );
  };

  const handleAddInventoryItem = (newItem: InventoryItem) => {
    setInventoryItems((prev) => [newItem, ...prev]);
  };

  const handleUpdateMenuItem = (updatedItem: MenuItem) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  const handleToggleUserStatus = (_userId: string) => {
    setUserProfile((prev) => {
      const nextStatus = prev.subscriptionStatus === 'Active' ? 'Paused' : 'Active';
      return { ...prev, subscriptionStatus: nextStatus };
    });
  };

  const handleRefundCredit = (_userId: string) => {
    setUserProfile((prev) => ({
      ...prev,
      creditsBalance: prev.creditsBalance + 1,
    }));
  };

  const handleResolveTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'Resolved' } : t))
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1A1A] font-['Poppins'] antialiased selection:bg-[#FF4C00] selection:text-white">
      
      {/* Universal Clean Header with Brand Logo & Log In (Shown on Marketing View) */}
      {viewMode === 'marketing' && (
        <Header
          currentTab={viewMode}
          setCurrentTab={setViewMode}
          timeWindow={timeWindow}
          setTimeWindow={setTimeWindow}
          creditsBalance={userProfile.creditsBalance}
        />
      )}

      {/* VIEW MODE 1: MARKETING PAGE */}
      {viewMode === 'marketing' && (
        <main>
          
          {/* 1. Hero Section */}
          <HeroTypewriter />

          {/* 2. Watch Before You Reserve & Reserve Your Desk Drop */}
          <DeskDropWaitlistAndTeaser
            waitlistCount={waitlistLeads.length}
            confirmedSubscribersCount={customers.length}
            onJoinWaitlist={(lead) => setWaitlistLeads((prev) => [lead, ...prev])}
          />

          {/* 3. Escape Your Lunch Rut (Process Grid) */}
          <ProcessGrid />

          {/* 4. What is the kitchen cooking this week? (6-Month Menu Calendar - No prices shown) */}
          <InteractiveCalendar menuItems={menuItems} />

          {/* 5. Build Your Lunch Plan (Calendar Style, >8 days rule, 20th day free, Calculate Order trigger) */}
          <PlanBuilder onProceedToCheckout={handleProceedToCheckout} />

          {/* 6. People Tolerate Us (Testimonials) */}
          <TestimonialsCloud />

          {/* 7. Your Burning Questions, Answered (FAQ) */}
          <FaqSection />

          {/* Payout & Registration Modal (Official Flutterwave MFB Account, Copy Account, Proof Instructions) */}
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            selectedDays={selectedLunchDays}
            summary={calculatedOrderSummary}
            onOrderSubmitted={handleOrderSubmitted}
            waitlistLeads={waitlistLeads}
          />

        </main>
      )}

      {/* VIEW MODE 2: SUBSCRIBER EXPERIENCE (LUNCH CONTROL CENTER) */}
      {viewMode === 'subscriber' && (
        <SubscriberDashboardPage
          timeWindow={timeWindow}
          todayMeal={canonicalTodayMeal}
          tomorrowMeal={canonicalTomorrowMeal}
          userProfile={userProfile}
          announcements={announcements}
          ratingsHistory={ratingsHistory}
          onUpdateProfile={handleUpdateProfile}
          onAddRating={handleAddRating}
          onNavigateToAdmin={() => setViewMode('admin')}
          onNavigateToLanding={() => setViewMode('marketing')}
          creditRedemptions={creditRedemptions}
          onAddCreditRedemption={handleAddCreditRedemption}
          onMoveCreditDate={handleMoveCreditDate}
          onTopUpOrderSubmitted={handleTopUpOrderSubmitted}
        />
      )}

      {/* VIEW MODE 3: KITCHEN ADMIN CONTROL */}
      {viewMode === 'admin' && (
        <JusticeDashboardPage
          menuItems={menuItems}
          subscribers={[userProfile]}
          announcements={announcements}
          inventoryItems={inventoryItems}
          tickets={tickets}
          submittedOrders={submittedOrders}
          customers={customers}
          waitlistLeads={waitlistLeads}
          creditRedemptions={creditRedemptions}
          onConfirmCreditRedemption={handleConfirmCreditRedemption}
          onConfirmTopUpOrder={handleConfirmTopUpOrder}
          onUpdateWaitlistLead={(updated) =>
            setWaitlistLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
          }
          onAddCustomer={handleAddCustomer}
          onUpdateCustomer={handleUpdateCustomer}
          onSimulateUserActivation={handleOpenMagicLinkActivation}
          onNavigateToSubscriber={() => setViewMode('subscriber')}
          userProfile={userProfile}
          onUpdateProfile={handleUpdateProfile}
          todayMeal={canonicalTodayMeal}
          tomorrowMeal={canonicalTomorrowMeal}
          timeWindow={timeWindow}
          onConfirmOrderPayment={(orderId) => {
            setSubmittedOrders((prev) =>
              prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: 'Confirmed' } : o))
            );
          }}
          onNavigateToHome={() => setViewMode('marketing')}
          onAddAnnouncement={handleAddAnnouncement}
          onDeleteAnnouncement={handleDeleteAnnouncement}
          onUpdateStock={handleUpdateStock}
          onAddInventoryItem={handleAddInventoryItem}
          onUpdateMenuItem={handleUpdateMenuItem}
          onToggleUserStatus={handleToggleUserStatus}
          onRefundCredit={handleRefundCredit}
          onResolveTicket={handleResolveTicket}
        />
      )}

      {/* Magic Link / Set Password Activation Modal */}
      {magicLinkCustomer && (
        <SetPasswordModal
          isOpen={!!magicLinkCustomer}
          customer={magicLinkCustomer}
          onClose={() => setMagicLinkCustomer(null)}
          onPasswordSet={handlePasswordSet}
        />
      )}

      {/* Subscriber Portal Authentication & Forgot Password Modal */}
      {showSubscriberAuthModal && (
        <SubscriberAuthModal
          isOpen={showSubscriberAuthModal}
          onClose={() => setShowSubscriberAuthModal(false)}
          customers={customers}
          onLoginSuccess={(customer) => {
            handlePasswordSet(customer, customer.password || '');
            setShowSubscriberAuthModal(false);
          }}
          onUpdateCustomerPassword={(customerId, newPass) => {
            setCustomers((prev) =>
              prev.map((c) =>
                c.id === customerId
                  ? { ...c, password: newPass, isPasswordSet: true, status: 'Active' }
                  : c
              )
            );
          }}
        />
      )}

      {/* VIEW MODE 4: DEDICATED SUBSCRIBER ACTIVATION PAGE */}
      {viewMode === 'activate' && (
        <ActivateAccountPage
          customer={
            activeActivation?.customer ||
            createHydratedCustomerFromMagicLink(
              'justiceukpebor2017@gmail.com',
              'drh4aqzg'
            )
          }
          token={activeActivation?.token || 'drh4aqzg'}
          onActivateSuccess={(activatedCust, newPass) => {
            handlePasswordSet(activatedCust, newPass);
            try {
              if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
                const cleanPath = window.location.pathname.replace(/\/activate\/?/, '') || '/';
                window.history.replaceState({}, document.title, cleanPath);
              }
            } catch (e) {
              console.error(e);
            }
          }}
          onNavigateHome={() => {
            try {
              if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
                window.history.replaceState({}, document.title, '/');
              }
            } catch (e) {
              console.error(e);
            }
            setViewMode('marketing');
          }}
        />
      )}

      {/* Global 11 to 12 Footer (Hidden during focused Account Activation) */}
      {viewMode !== 'activate' && (
        <Footer
          onNavigateToLanding={() => setViewMode('marketing')}
          onNavigateToSubscriber={() => setShowSubscriberAuthModal(true)}
          onNavigateToAdmin={() => setViewMode('admin')}
        />
      )}

    </div>
  );
}

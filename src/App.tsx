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
  TestimonialItem,
  LaunchSettings,
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
import { getMealForDate, subscribeMenuChanges } from './data/menuRotation';
import { Header } from './components/Header';
import { HeroMapSection } from './components/marketing/HeroMapSection';
import { HeroTypewriter } from './components/marketing/HeroTypewriter';
import { DeskDropWaitlistAndTeaser } from './components/marketing/DeskDropWaitlistAndTeaser';
import { ProcessGrid } from './components/marketing/ProcessGrid';
import { InteractiveCalendar } from './components/marketing/InteractiveCalendar';
import { PlanBuilder } from './components/marketing/PlanBuilder';
import { Testimonials } from './components/ui/testimonials-columns-1';
import { FaqSection } from './components/marketing/FaqSection';
import { Footer } from './components/Footer';
import { CheckoutModal } from './components/marketing/CheckoutModal';
import { GuidedWalkthroughControls, WalkthroughStep } from './components/marketing/GuidedWalkthroughControls';
import { SubscriberAuthModal } from './components/subscriber/SubscriberAuthModal';
import { SubscriberDashboardPage } from './pages/SubscriberDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { generateDefaultPassword } from './utils/credentialUtils';
import { liveSync } from './services/liveSyncService';
import {
  initGoogleAnalytics,
  trackPageView,
  trackEvent,
  trackWaitlistJoined,
  trackBeginCheckout,
  trackOrderSubmitted,
  trackWalkthroughStep,
  trackWalkthroughSkip,
} from './utils/analytics';
import {
  db,
  auth,
  collection,
  onSnapshot,
  onAuthStateChanged,
  saveWaitlistLeadToFirestore,
  saveCustomerToFirestore,
  deleteCustomerFromFirestore,
  deleteWaitlistLeadFromFirestore,
  deleteOrderFromFirestore,
  subscribeToLaunchSettings,
  saveLaunchSettingsToFirestore,
  saveOrderToFirestore,
  logoutSubscriberAccount,
} from './services/firebase';
import { getLaunchSettings, updateLaunchConfig, subscribeLaunchConfig } from './config/launchConfig';

// Storage Keys to safeguard existing real dashboard users across updates and refreshes
const APP_STORAGE_KEYS = {
  CUSTOMERS: '11to12_persistent_customers_v1',
  WAITLIST: '11to12_persistent_waitlist_leads_v1',
  ORDERS: '11to12_persistent_submitted_orders_v1',
  CREDIT_REDEMPTIONS: '11to12_persistent_credit_redemptions_v1',
  USER_PROFILE: '11to12_persistent_user_profile_v1',
};

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('marketing');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('morning');
  const [showSubscriberAuthModal, setShowSubscriberAuthModal] = useState(false);
  
  // Guided Website Walkthrough State: Shown on every load of the website as requested
  const [isWalkthroughActive, setIsWalkthroughActive] = useState<boolean>(true);
  const [walkthroughStep, setWalkthroughStep] = useState<WalkthroughStep>(1);

  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [, setMenuSyncVersion] = useState(0);

  // Subscribe to real-time menu updates
  useEffect(() => {
    const unsub = subscribeMenuChanges(() => {
      setMenuSyncVersion((v) => v + 1);
    });
    return () => unsub();
  }, []);

  // Initialize Google Analytics on mount
  useEffect(() => {
    initGoogleAnalytics();
  }, []);

  // Track page views on tab/viewMode changes
  useEffect(() => {
    const titles: Record<ViewMode, string> = {
      marketing: '11 to 12 - Lagos Office Food Subscription',
      subscriber: 'Subscriber Portal - 11 to 12',
      admin: 'Admin Operations Control - 11 to 12',
    };
    trackPageView(titles[viewMode] || '11 to 12 Food', `/${viewMode}`);
  }, [viewMode]);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (typeof window === 'undefined') return INITIAL_USER_PROFILE;
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
    if (typeof window === 'undefined') return INITIAL_CUSTOMERS;
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
    if (typeof window === 'undefined') return INITIAL_WAITLIST_LEADS;
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

  // Real-time Firestore waitlist counter
  const [waitlistCount, setWaitlistCount] = useState<number>(() => waitlistLeads.length);

  // Selected Lunch Days and Calculated Summary for the 6-Month Plan
  const [selectedLunchDays, setSelectedLunchDays] = useState<SelectedLunchDay[]>([]);
  const [calculatedOrderSummary, setCalculatedOrderSummary] = useState<OrderSummary | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Submitted Orders (persisted so invoices and remittances are retained)
  const [submittedOrders, setSubmittedOrders] = useState<OrderSubmission[]>(() => {
    if (typeof window === 'undefined') return [];
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
    if (typeof window === 'undefined') return [];
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

  // Dynamic Testimonials (Admin manageable and synced in real-time)
  const [liveTestimonials, setLiveTestimonials] = useState<TestimonialItem[]>(() => {
    if (typeof window === 'undefined') return liveSync.getState().testimonials || [];
    try {
      const saved = localStorage.getItem('11to12_testimonials_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load testimonials from storage', e);
    }
    return liveSync.getState().testimonials || [];
  });

  // Central Launch Settings State
  const [launchSettings, setLaunchSettings] = useState<LaunchSettings>(() => getLaunchSettings());

  useEffect(() => {
    const unsub = subscribeLaunchConfig((cfg) => {
      setLaunchSettings({
        launchDate: cfg.dateString,
        isEnabled: cfg.isEnabled,
      });
    });
    const unsubFirestore = subscribeToLaunchSettings((settings) => {
      if (settings && settings.launchDate) {
        updateLaunchConfig(settings);
      }
    });
    return () => {
      unsub();
      unsubFirestore();
    };
  }, []);

  // Automatic persistent background synchronization
  useEffect(() => {
    try {
      localStorage.setItem('11to12_testimonials_v1', JSON.stringify(liveTestimonials));
    } catch (e) {
      console.error('Failed to save testimonials', e);
    }
  }, [liveTestimonials]);
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

  // Real-time multi-device synchronization via LiveSync
  useEffect(() => {
    const unsubscribe = liveSync.subscribe((liveState) => {
      if (liveState.waitlistLeads && Array.isArray(liveState.waitlistLeads)) {
        setWaitlistLeads(liveState.waitlistLeads);
      }
      if (liveState.customers && Array.isArray(liveState.customers)) {
        setCustomers(liveState.customers);
      }
      if (liveState.submittedOrders && Array.isArray(liveState.submittedOrders)) {
        setSubmittedOrders(liveState.submittedOrders);
      }
      if (liveState.creditRedemptions && Array.isArray(liveState.creditRedemptions)) {
        setCreditRedemptions(liveState.creditRedemptions);
      }
      if (liveState.announcements && liveState.announcements.length > 0) {
        setAnnouncements(liveState.announcements);
      }
      if (liveState.testimonials && Array.isArray(liveState.testimonials)) {
        setLiveTestimonials(liveState.testimonials);
      }
      if (liveState.launchSettings) {
        setLaunchSettings(liveState.launchSettings);
        updateLaunchConfig(liveState.launchSettings);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Real-time onSnapshot camera stream: Listen to entire waitlist collection across all devices
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'waitlist'), (snapshot) => {
      setWaitlistCount(snapshot.size);

      const leads: WaitlistLead[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || data.fullName || 'Office Member',
          email: data.email || '',
          phone: data.phone || '',
          workplace: data.workplace || data.company || 'Corporate Office',
          addressFloor: data.addressFloor || data.officeAddress || 'Desk Drop',
          createdAt: data.createdAt || data.joinedAt || new Date().toISOString(),
          status: data.status || 'Waitlisted',
          memberCode: data.memberCode || d.id,
          notes: data.notes || data.dietaryNotes || '',
        };
      });
      setWaitlistLeads(leads);
    }, (error) => {
      console.warn('[Firestore onSnapshot waitlist error]:', error);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Real-time onSnapshot camera stream: Listen to customers collection across all devices
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'customers'), (snapshot) => {
      const firestoreCustomers: CustomerRecord[] = snapshot.docs.map((d) => ({
        ...(d.data() as CustomerRecord),
        id: d.id,
      }));
      // Authoritative live feed: automatically pushes new, updated, and deleted customers to the screen
      setCustomers(firestoreCustomers);
    }, (error) => {
      console.warn('[Firestore onSnapshot customers error]:', error);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Real-time onSnapshot camera stream: Listen to submitted orders collection across all devices
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const firestoreOrders: OrderSubmission[] = snapshot.docs.map((d) => ({
        ...(d.data() as OrderSubmission),
        id: d.id,
      }));
      if (firestoreOrders.length > 0) {
        setSubmittedOrders(firestoreOrders);
      }
    }, (error) => {
      console.warn('[Firestore onSnapshot orders error]:', error);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Listen to real Firebase Authentication state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.email) {
        const cleanEmail = fbUser.email.toLowerCase().trim();
        const matched = customers.find((c) => c.email && c.email.toLowerCase().trim() === cleanEmail);
        if (matched) {
          setUserProfile({
            id: matched.id,
            name: matched.fullName || fbUser.displayName || 'Subscriber',
            email: matched.email,
            phone: matched.phone || '0802 618 0680',
            occupation: 'Corporate Professional',
            company: matched.company || 'Corporate Office',
            address: matched.officeAddress || 'Victoria Island, Lagos',
            floorSuite: matched.floorSuite || 'Desk Drop',
            deliveryArea: matched.deliveryArea || 'Victoria Island',
            creditsBalance: matched.creditsBalance || 0,
            spicePreference: 'Medium',
            proteinsPreferred: ['Spiced Grilled Chicken', 'Assorted Goat Meat'],
            dislikes: matched.notes ? [matched.notes] : [],
            standardLunchTime: '11:45 AM',
            eatLocation: 'Work',
            subscriptionStatus: 'Active',
            planName: matched.planName || 'Standard Lunch Plan',
            nextBillingDate: 'Nov 1, 2026',
            totalMealsReceived: 0,
            totalSubscribedDays: matched.totalDays || 20,
            skipCount: 0,
            isPasswordSet: true,
            selectedDays: matched.selectedDays || [],
            pendingAddressChange: null,
          });
        }
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [customers]);

  // Testimonials Handlers (Admin CRUD synced with central database and homepage)
  const handleAddTestimonial = async (item: Omit<TestimonialItem, 'id'>) => {
    const created = await liveSync.addTestimonial(item);
    setLiveTestimonials((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
    return created;
  };

  const handleUpdateTestimonial = async (id: string, patch: Partial<TestimonialItem>) => {
    const updated = await liveSync.updateTestimonial(id, patch);
    if (updated) {
      setLiveTestimonials((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
    return updated;
  };

  const handleDeleteTestimonial = async (id: string) => {
    const ok = await liveSync.deleteTestimonial(id);
    if (ok) {
      setLiveTestimonials((prev) => prev.filter((t) => t.id !== id));
    }
    return ok;
  };

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
    liveSync.registerCustomer(newCustomer);
    saveCustomerToFirestore(newCustomer).catch(() => {});
  };

  const handleUpdateCustomer = (updated: CustomerRecord) => {
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    liveSync.updateCustomer(updated.id, updated);
    saveCustomerToFirestore(updated).catch(() => {});
  };

  const handleSimulateUserLogin = (customer: CustomerRecord) => {
    handlePasswordSet(customer, customer.password || customer.defaultPassword || 'DeskDrop#100');
  };

  const handlePasswordSet = (customer: CustomerRecord, newPass: string) => {
    const updatedCust: CustomerRecord = {
      ...customer,
      isPasswordSet: true,
      password: newPass,
      defaultPassword: newPass,
      isDefaultPassword: false,
      mustChangePassword: false,
      passwordLastChangedAt: new Date().toISOString(),
      status: 'Active',
    };
    liveSync.updateCustomer(updatedCust.id, updatedCust);
    saveCustomerToFirestore(updatedCust).catch(() => {});
    setCustomers((prev) => {
      const exists = prev.some(
        (c) => c.id === customer.id || Boolean(c.email && customer.email && c.email.toLowerCase() === customer.email.toLowerCase())
      );
      if (exists) {
        return prev.map((c) =>
          c.id === customer.id || Boolean(c.email && customer.email && c.email.toLowerCase() === customer.email.toLowerCase())
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
      secondAddress: customer.secondAddress,
      floorSuite: customer.floorSuite,
      deliveryArea: customer.deliveryArea || 'Victoria Island',
      creditsBalance: customer.creditsBalance || 0,
      skippedDates: customer.skippedDates || [],
      orderTotalNGN: customer.finalTotalNGN,
      orderRef: customer.orderRef || customer.id,
      spicePreference: 'Medium',
      proteinsPreferred: ['Spiced Grilled Chicken', 'Assorted Goat Meat'],
      dislikes: customer.notes ? [customer.notes] : [],
      standardLunchTime: '11:45 AM',
      eatLocation: 'Work',
      subscriptionStatus: 'Active',
      paymentStatus: 'Paid',
      planName: customer.planName,
      nextBillingDate: 'Nov 1, 2026',
      totalMealsReceived: 0,
      totalSubscribedDays: customer.totalDays,
      skipCount: 0,
      isPasswordSet: true,
      selectedDays: customer.selectedDays,
      pendingAddressChange: null,
    });

    setViewMode('subscriber');
  };

  const handleLogout = async () => {
    try {
      await logoutSubscriberAccount();
    } catch (e) {
      console.warn('Logout notice:', e);
    }
    setViewMode('marketing');
  };

  // Derive dynamic meals from canonical 26-week rotation based on current date
  const today = new Date();
  const tomorrow = new Date(today);
  // Next workday: if Friday, next is Monday (+3); if Saturday, next is Monday (+2); else tomorrow (+1)
  const daysToAdd = today.getDay() === 5 ? 3 : today.getDay() === 6 ? 2 : 1;
  tomorrow.setDate(today.getDate() + daysToAdd);

  const canonicalTodayMeal = getMealForDate(today) || getMealForDate(new Date(2026, 11, 7)) || menuItems[0];
  const canonicalTomorrowMeal = getMealForDate(tomorrow) || getMealForDate(new Date(2026, 11, 8)) || menuItems[1];

  const handleProceedToCheckout = (selectedDays: SelectedLunchDay[], summary: OrderSummary) => {
    setSelectedLunchDays(selectedDays);
    setCalculatedOrderSummary(summary);
    setIsCheckoutOpen(true);
    trackBeginCheckout(summary.totalDays, summary.finalTotalNGN);
  };

  const handleOrderSubmitted = async (order: OrderSubmission) => {
    trackOrderSubmitted(order);
    // Paid order request goes under the Order nav ONLY (Pending Invoices).
    // It will be moved to Customer nav automatically only once confirmed by admin.
    setSubmittedOrders((prev) => {
      const exists = prev.some((o) => o.id === order.id);
      if (exists) {
        return prev.map((o) => (o.id === order.id ? order : o));
      }
      return [order, ...prev];
    });

    // Save to central live database and Firestore, and broadcast across all devices
    try {
      await liveSync.submitOrder(order);
    } catch (e) {
      console.warn('liveSync submitOrder notice:', e);
    }
    await saveOrderToFirestore(order).catch(() => {});

    // Deduplicate: If this person was in the waitlist (by unique code or email), remove from waitlist so admin has 0 duplicates
    setWaitlistLeads((prev) =>
      prev.filter((lead) => {
        const matchesCode = Boolean(order.memberCode && lead.memberCode && lead.memberCode.toUpperCase() === order.memberCode.toUpperCase());
        const matchesEmail = Boolean(lead.email && order.email && lead.email.toLowerCase() === order.email.toLowerCase());
        return !(matchesCode || matchesEmail);
      })
    );
  };

  // Top-Up Order submission from active subscriber dashboard
  const handleTopUpOrderSubmitted = (order: OrderSubmission) => {
    trackOrderSubmitted(order);
    setSubmittedOrders((prev) => [order, ...prev]);
    liveSync.submitOrder(order);
    saveOrderToFirestore(order).catch((err) => console.error(err));

    // Create an urgent admin announcement so the admin gets an instant notification
    const topUpAnnouncement: AdminAnnouncement = {
      id: `ann-${Date.now()}`,
      title: `🔔 Paid Top-Up Invoice: ${order.fullName}`,
      message: `${order.fullName} (${order.company}) submitted a top-up of ${order.totalDays || 0} meal days (₦${(order.finalTotalNGN || 0).toLocaleString()}). Invoice #${order.id} is awaiting confirmation to add days to their calendar.`,
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

    liveSync.confirmOrderPayment(orderId);

    // 1. Mark order payment as Confirmed
    setSubmittedOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: 'Confirmed' } : o))
    );

    // 2. Locate customer by orderRef, email, or memberCode
    const custIdx = customers.findIndex(
      (c) =>
        (order.id && c.orderRef === order.id) ||
        Boolean(c.email && order.email && c.email.toLowerCase() === order.email.toLowerCase()) ||
        Boolean(order.memberCode && c.memberCode && c.memberCode.toUpperCase() === order.memberCode.toUpperCase())
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
      if (
        (userProfile.email && cust.email && userProfile.email.toLowerCase() === cust.email.toLowerCase()) ||
        userProfile.id === cust.id
      ) {
        setUserProfile((prev) => ({
          ...prev,
          selectedDays: mergedDays,
          totalSubscribedDays: mergedDays.length,
          planName: `${mergedDays.length} Workday Lunch Plan`,
        }));
      }
    } else {
      // If customer was not yet recorded, register them as an active customer in Customers nav
      const defaultPassword = generateDefaultPassword();
      const newCustomer: CustomerRecord = {
        id: `cust-${order.id || Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: order.fullName,
        email: order.email,
        phone: order.phone,
        company: order.company,
        officeAddress: order.officeAddress,
        secondAddress: order.secondAddress || '',
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
        createdAt: order.submittedAt || new Date().toISOString(),
        isPasswordSet: true,
        defaultPassword: defaultPassword,
        password: defaultPassword,
        isDefaultPassword: true,
        mustChangePassword: true,
      };
      setCustomers((prev) => [newCustomer, ...prev]);
      liveSync.registerCustomer(newCustomer).catch(() => {});
      saveCustomerToFirestore(newCustomer).catch(() => {});
    }

    // 3. Post confirmation announcement
    const confirmedAnnouncement: AdminAnnouncement = {
      id: `ann-${Date.now()}`,
      title: `✅ Payment Confirmed: ${order.fullName}`,
      message: `Payment confirmed for ${order.fullName}. Moved to Customer nav with login credentials generated, and meals synced with kitchen production.`,
      type: 'info',
      active: true,
      postedAt: new Date().toISOString(),
    };
    setAnnouncements((prev) => [confirmedAnnouncement, ...prev]);
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    setUserProfile(updated);

    // Synchronize into customer record for Admin Dashboard in real time
    setCustomers((prev) => {
      const idx = prev.findIndex(
        (c) =>
          c.id === updated.id ||
          Boolean(c.email && updated.email && c.email.toLowerCase() === updated.email.toLowerCase())
      );
      if (idx >= 0) {
        const copy = [...prev];
        const updatedCust: CustomerRecord = {
          ...copy[idx],
          fullName: updated.name,
          phone: updated.phone,
          company: updated.company,
          officeAddress: updated.address,
          secondAddress: updated.secondAddress,
          creditsBalance: updated.creditsBalance,
          skippedDates: updated.skippedDates || [],
          selectedDays: updated.selectedDays || copy[idx].selectedDays,
          totalDays: updated.selectedDays?.length || copy[idx].totalDays,
        };
        copy[idx] = updatedCust;
        liveSync.updateCustomer(updatedCust.id, updatedCust).catch(() => {});
        saveCustomerToFirestore(updatedCust).catch(() => {});
        return copy;
      }
      return prev;
    });
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

  const handleDeleteCustomer = async (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    await liveSync.deleteCustomer(customerId);
    await deleteCustomerFromFirestore(customerId).catch(() => {});
  };

  const handleDeleteWaitlistLead = async (leadId: string) => {
    setWaitlistLeads((prev) => prev.filter((l) => l.id !== leadId));
    await liveSync.deleteWaitlistLead(leadId);
    await deleteWaitlistLeadFromFirestore(leadId).catch(() => {});
  };

  const handleDeleteOrder = async (orderId: string) => {
    setSubmittedOrders((prev) => prev.filter((o) => o.id !== orderId));
    await liveSync.deleteOrder(orderId);
    await deleteOrderFromFirestore(orderId).catch(() => {});
  };

  const handleUpdateLaunchSettings = async (patch: Partial<LaunchSettings>) => {
    const updated = await liveSync.updateLaunchSettings(patch);
    await saveLaunchSettingsToFirestore(updated).catch(() => {});
    setLaunchSettings(updated);
  };

  // Guided Walkthrough Handlers
  const handleWalkthroughSkip = () => {
    setIsWalkthroughActive(false);
  };

  const handleWalkthroughNext = () => {
    if (walkthroughStep === 1) {
      setWalkthroughStep(2);
      const menuEl = document.getElementById('menu');
      if (menuEl) {
        menuEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (walkthroughStep === 2) {
      setWalkthroughStep(3);
      const planEl = document.getElementById('pricing');
      if (planEl) {
        planEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleWalkthroughFinish = () => {
    setIsWalkthroughActive(false);
    const planEl = document.getElementById('pricing');
    if (planEl) {
      planEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1A1A] font-['Poppins'] antialiased selection:bg-[#FF4C00] selection:text-white">
      
      {/* Universal Clean Header with Brand Logo & Log In (Overlay on Marketing View) */}
      {viewMode === 'marketing' && (
        <Header
          currentTab={viewMode}
          setCurrentTab={setViewMode}
          onOpenSubscriberLogin={() => setShowSubscriberAuthModal(true)}
          timeWindow={timeWindow}
          setTimeWindow={setTimeWindow}
          creditsBalance={userProfile.creditsBalance}
        />
      )}

      {/* VIEW MODE 1: MARKETING PAGE */}
      {viewMode === 'marketing' && (
        <>
          {/* Guided Website Walkthrough Floating Controls */}
          {isWalkthroughActive && (
            <GuidedWalkthroughControls
              currentStep={walkthroughStep}
              onNext={handleWalkthroughNext}
              onSkip={handleWalkthroughSkip}
              onFinish={handleWalkthroughFinish}
            />
          )}

          <main className="relative">
            
            {/* 1. First Section: Illustrated Lagos Route Map Hero */}
            <div>
              <HeroMapSection />
            </div>

            {/* 2. Second Section: Restored Original Orange Hero */}
            <div id="home">
              <HeroTypewriter />
            </div>

            {/* 3. Reserve Your Desk (Guided Step 1 Highlighted) */}
            <div
              className={`transition-all duration-500 ${
                isWalkthroughActive
                  ? walkthroughStep === 1
                    ? 'relative z-30 ring-4 ring-[#FF4C00] shadow-2xl rounded-3xl scale-[1.01]'
                    : 'filter blur-sm opacity-40 select-none pointer-events-none'
                  : ''
              }`}
            >
              <DeskDropWaitlistAndTeaser
                waitlistCount={waitlistCount}
                confirmedSubscribersCount={customers.filter((c) => c.status === 'Active' || c.paymentStatus === 'Paid').length}
                existingWaitlist={waitlistLeads}
                existingCustomers={customers}
                onJoinWaitlist={async (leadData) => {
                  const res = await liveSync.joinWaitlist(leadData);
                  if (res.success && res.lead) {
                    await saveWaitlistLeadToFirestore(res.lead);
                    setWaitlistLeads((prev) => [res.lead!, ...prev.filter((l) => l.id !== res.lead!.id)]);
                  }
                  return res;
                }}
              />
            </div>

            {/* 3. Escape Your Lunch Rut (Process Grid) */}
            <div className={isWalkthroughActive ? "transition-all duration-500 filter blur-sm opacity-40 select-none pointer-events-none" : "transition-all duration-300"}>
              <ProcessGrid />
            </div>

            {/* 4. What is the kitchen cooking? (Guided Step 2 Highlighted) */}
            <div
              className={`transition-all duration-500 ${
                isWalkthroughActive
                  ? walkthroughStep === 2
                    ? 'relative z-30 ring-4 ring-[#FF4C00] shadow-2xl rounded-3xl scale-[1.01]'
                    : 'filter blur-sm opacity-40 select-none pointer-events-none'
                  : ''
              }`}
            >
              <InteractiveCalendar menuItems={menuItems} />
            </div>

            {/* 5. Build Your Lunch Plan (Guided Step 3 Highlighted) */}
            <div
              className={`transition-all duration-500 ${
                isWalkthroughActive
                  ? walkthroughStep === 3
                    ? 'relative z-30 ring-4 ring-[#FF4C00] shadow-2xl rounded-3xl scale-[1.01]'
                    : 'filter blur-sm opacity-40 select-none pointer-events-none'
                  : ''
              }`}
            >
              <PlanBuilder onProceedToCheckout={handleProceedToCheckout} />
            </div>

            {/* 6. People Tolerate Us (Testimonials - Animated 3-Column Display with Initials, No Images) */}
            <div className={isWalkthroughActive ? "transition-all duration-500 filter blur-sm opacity-40 select-none pointer-events-none" : "transition-all duration-300"}>
              <Testimonials
                testimonials={liveTestimonials}
                title="What Lagos Office Teams Say"
                subtitle="Piping-hot Nigerian corporate lunches delivered directly to workstations between 11:00 AM and 12:00 PM."
              />
            </div>

            {/* 7. Your Burning Questions, Answered (FAQ) */}
            <div className={isWalkthroughActive ? "transition-all duration-500 filter blur-sm opacity-40 select-none pointer-events-none" : "transition-all duration-300"}>
              <FaqSection />
            </div>

            {/* Payout & Registration Modal (Official Flutterwave MFB & Wema Account, Copy Account, Proof Instructions) */}
            <CheckoutModal
              isOpen={isCheckoutOpen}
              onClose={() => setIsCheckoutOpen(false)}
              selectedDays={selectedLunchDays}
              summary={calculatedOrderSummary}
              onOrderSubmitted={handleOrderSubmitted}
              waitlistLeads={waitlistLeads}
              customers={customers}
            />

          </main>
        </>
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
          onNavigateToLanding={handleLogout}
          creditRedemptions={creditRedemptions}
          onAddCreditRedemption={handleAddCreditRedemption}
          onMoveCreditDate={handleMoveCreditDate}
          onTopUpOrderSubmitted={handleTopUpOrderSubmitted}
          submittedOrders={submittedOrders}
          onChangePassword={(newPass) => {
            const cust = customers.find((c) => c.id === userProfile.id || c.email === userProfile.email);
            if (cust) {
              handlePasswordSet(cust, newPass);
            }
          }}
        />
      )}

      {/* VIEW MODE 3: KITCHEN ADMIN CONTROL */}
      {viewMode === 'admin' && (
        <AdminDashboardPage
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
          onUpdateWaitlistLead={(updated) => {
            setWaitlistLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
            liveSync.updateWaitlistLead(updated.id, updated);
          }}
          onAddCustomer={handleAddCustomer}
          onUpdateCustomer={handleUpdateCustomer}
          onDeleteCustomer={handleDeleteCustomer}
          onDeleteOrder={handleDeleteOrder}
          onDeleteWaitlistLead={handleDeleteWaitlistLead}
          launchSettings={launchSettings}
          onUpdateLaunchSettings={handleUpdateLaunchSettings}
          onSimulateUserActivation={handleSimulateUserLogin}
          onNavigateToSubscriber={() => setViewMode('subscriber')}
          userProfile={userProfile}
          onUpdateProfile={handleUpdateProfile}
          todayMeal={canonicalTodayMeal}
          tomorrowMeal={canonicalTomorrowMeal}
          timeWindow={timeWindow}
          onConfirmOrderPayment={handleConfirmTopUpOrder}
          onNavigateToHome={() => setViewMode('marketing')}
          onAddAnnouncement={handleAddAnnouncement}
          onDeleteAnnouncement={handleDeleteAnnouncement}
          onUpdateStock={handleUpdateStock}
          onAddInventoryItem={handleAddInventoryItem}
          onUpdateMenuItem={handleUpdateMenuItem}
          onToggleUserStatus={handleToggleUserStatus}
          onRefundCredit={handleRefundCredit}
          onResolveTicket={handleResolveTicket}
          testimonials={liveTestimonials}
          onAddTestimonial={handleAddTestimonial}
          onUpdateTestimonial={handleUpdateTestimonial}
          onDeleteTestimonial={handleDeleteTestimonial}
        />
      )}

      {/* Subscriber Portal Authentication & Forgot Password Modal */}
      {showSubscriberAuthModal && (
        <SubscriberAuthModal
          isOpen={showSubscriberAuthModal}
          onClose={() => setShowSubscriberAuthModal(false)}
          customers={customers}
          testimonials={liveTestimonials}
          onLoginSuccess={(customer) => {
            handlePasswordSet(customer, customer.password || customer.defaultPassword || '');
            setShowSubscriberAuthModal(false);
          }}
          onUpdateCustomerPassword={(customerId, newPass) => {
            const cust = customers.find((c) => c.id === customerId);
            if (cust) {
              const patched: CustomerRecord = {
                ...cust,
                password: newPass,
                defaultPassword: newPass,
                isDefaultPassword: false,
                mustChangePassword: false,
                isPasswordSet: true,
                passwordLastChangedAt: new Date().toISOString(),
                status: 'Active',
              };
              setCustomers((prev) => prev.map((c) => (c.id === customerId ? patched : c)));
              liveSync.updateCustomer(customerId, patched);
            }
          }}
          onOpenAdminLogin={() => {
            setShowSubscriberAuthModal(false);
            setViewMode('admin');
          }}
        />
      )}

      {/* Global 11 to 12 Footer */}
      <Footer
        onNavigateToLanding={() => setViewMode('marketing')}
        onNavigateToSubscriber={() => setShowSubscriberAuthModal(true)}
        onNavigateToAdmin={() => setViewMode('admin')}
      />

    </div>
  );
}

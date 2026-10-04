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
import { Testimonials } from './components/ui/testimonials-columns-1';
import { FaqSection } from './components/marketing/FaqSection';
import { Footer } from './components/Footer';
import { CheckoutModal } from './components/marketing/CheckoutModal';
import { WatchBeforeYouReserveModal } from './components/marketing/WatchBeforeYouReserveModal';
import { SubscriberAuthModal } from './components/subscriber/SubscriberAuthModal';
import { SubscriberDashboardPage } from './pages/SubscriberDashboardPage';
import { JusticeDashboardPage } from './pages/JusticeDashboardPage';
import { generateDefaultPassword } from './utils/credentialUtils';
import { liveSync } from './services/liveSyncService';
import {
  db,
  auth,
  collection,
  onSnapshot,
  onAuthStateChanged,
  saveWaitlistLeadToFirestore,
  saveCustomerToFirestore,
  deleteCustomerFromFirestore,
  saveOrderToFirestore,
  logoutSubscriberAccount,
} from './services/firebase';

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
  // "Watch Before You Reserve" on Initial Load with Background Blur EVERY time the site is loaded or refreshed (never bypassed across refreshes)
  const [hasWatchedTeaser, setHasWatchedTeaser] = useState<boolean>(false);

  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
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
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Listen to the entire waitlist collection in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'waitlist'), (snapshot) => {
      // This callback fires immediately with the current count,
      // and again every time a document is added or removed.
      setWaitlistCount(snapshot.size);

      if (!snapshot.empty) {
        const leads: WaitlistLead[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          leads.push({
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
          });
        });
        if (leads.length > 0) {
          setWaitlistLeads(leads);
        }
      }
    }, (error) => {
      console.warn('[Firestore onSnapshot waitlist error]:', error);
    });

    // Don't forget to call unsubscribe() when the component unmounts
    return () => {
      unsubscribe();
    };
  }, []);

  // Listen to customers collection from Firestore in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'customers'), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreCustomers: CustomerRecord[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as CustomerRecord;
          firestoreCustomers.push({ ...data, id: d.id });
        });
        if (firestoreCustomers.length > 0) {
          setCustomers((prev) => {
            const map = new Map<string, CustomerRecord>();
            firestoreCustomers.forEach((c) => map.set(c.id, c));
            prev.forEach((c) => {
              if (!map.has(c.id)) map.set(c.id, c);
            });
            return Array.from(map.values());
          });
        }
      }
    }, (error) => {
      console.warn('[Firestore onSnapshot customers error]:', error);
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
      creditsBalance: customer.creditsBalance || 0,
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
    const initialDefaultPassword = generateDefaultPassword();
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
      status: 'Pending Activation',
      paymentStatus: 'Pending Verification',
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
      isPasswordSet: true,
      defaultPassword: initialDefaultPassword,
      password: initialDefaultPassword,
      isDefaultPassword: true,
      mustChangePassword: true,
    };
    setCustomers((prev) => [newCustomer, ...prev]);

    // Save to central live database and Firestore, and broadcast across all devices
    liveSync.registerCustomer(newCustomer);
    liveSync.submitOrder(order);
    saveCustomerToFirestore(newCustomer).catch(() => {});
    saveOrderToFirestore(order).catch(() => {});

    // Deduplicate: If this person was in the waitlist (by unique code or email), remove from waitlist so admin has 0 duplicates
    setWaitlistLeads((prev) =>
      prev.filter((lead) => {
        const matchesCode = Boolean(order.memberCode && lead.memberCode && lead.memberCode.toUpperCase() === order.memberCode.toUpperCase());
        const matchesEmail = lead.email.toLowerCase() === order.email.toLowerCase();
        return !(matchesCode || matchesEmail);
      })
    );

    // Save customer details to prepare their account with pending verification
    setUserProfile((prev) => ({
      ...prev,
      id: newCustomer.id,
      name: order.fullName,
      email: order.email,
      phone: order.phone,
      company: order.company,
      address: order.officeAddress,
      planName: `${order.totalDays} Workday Lunch Plan`,
      subscriptionStatus: 'Pending Activation',
      paymentStatus: 'Pending Verification',
      selectedDays: order.selectedDays,
      totalSubscribedDays: order.totalDays,
    }));
  };

  // Top-Up Order submission from active subscriber dashboard
  const handleTopUpOrderSubmitted = (order: OrderSubmission) => {
    setSubmittedOrders((prev) => [order, ...prev]);
    liveSync.submitOrder(order);

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

    liveSync.confirmOrderPayment(orderId);

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
        isPasswordSet: true,
        defaultPassword: generateDefaultPassword(),
        password: generateDefaultPassword(),
        isDefaultPassword: true,
        mustChangePassword: true,
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

  const handleDeleteCustomer = async (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    await liveSync.deleteCustomer(customerId);
    await deleteCustomerFromFirestore(customerId).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1A1A] font-['Poppins'] antialiased selection:bg-[#FF4C00] selection:text-white">
      
      {/* Universal Clean Header with Brand Logo & Log In (Shown on Marketing View) */}
      {viewMode === 'marketing' && (
        <div className={!hasWatchedTeaser ? "filter blur-md pointer-events-none select-none transition-all duration-700" : "transition-all duration-500"}>
          <Header
            currentTab={viewMode}
            setCurrentTab={setViewMode}
            onOpenSubscriberLogin={() => setShowSubscriberAuthModal(true)}
            timeWindow={timeWindow}
            setTimeWindow={setTimeWindow}
            creditsBalance={userProfile.creditsBalance}
          />
        </div>
      )}

      {/* VIEW MODE 1: MARKETING PAGE */}
      {viewMode === 'marketing' && (
        <>
          {/* Watch Before You Reserve Focused Spotlight on Website Load & Every Refresh */}
          <WatchBeforeYouReserveModal
            isOpen={!hasWatchedTeaser}
            onWatched={() => {
              setHasWatchedTeaser(true);
            }}
            onSkipToWaitlist={() => {
              setHasWatchedTeaser(true);
              setTimeout(() => {
                const target =
                  document.getElementById('reserve-form') ||
                  document.getElementById('watch-and-reserve') ||
                  document.getElementById('reserve-desk-drop-section');
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              }, 120);
            }}
          />

          <main className={!hasWatchedTeaser ? "filter blur-md pointer-events-none select-none transition-all duration-700" : "transition-all duration-500"}>
            
            {/* 1. Hero Section */}
            <HeroTypewriter />

            {/* 2. Watch Before You Reserve & Reserve Your Desk Drop */}
            <DeskDropWaitlistAndTeaser
              waitlistCount={waitlistCount}
              confirmedSubscribersCount={customers.filter((c) => c.status === 'Active' || c.paymentStatus === 'Paid').length}
              existingWaitlist={waitlistLeads}
              existingCustomers={customers}
              onJoinWaitlist={async (leadData) => {
                const res = await liveSync.joinWaitlist(leadData);
                if (res.success && res.lead) {
                  // Save lead directly to Firestore collection
                  await saveWaitlistLeadToFirestore(res.lead);
                  setWaitlistLeads((prev) => [res.lead!, ...prev.filter((l) => l.id !== res.lead!.id)]);
                }
                return res;
              }}
            />

            {/* 3. Escape Your Lunch Rut (Process Grid) */}
            <ProcessGrid />

            {/* 4. What is the kitchen cooking this week? (6-Month Menu Calendar - No prices shown) */}
            <InteractiveCalendar menuItems={menuItems} />

            {/* 5. Build Your Lunch Plan (Calendar Style, >8 days rule, 20th day free, Calculate Order trigger) */}
            <PlanBuilder onProceedToCheckout={handleProceedToCheckout} />

            {/* 6. People Tolerate Us (Testimonials - Animated 3-Column Display with Initials, No Images) */}
            <Testimonials
              testimonials={liveTestimonials}
              title="What Lagos Office Teams Say"
              subtitle="Piping-hot Nigerian corporate lunches delivered directly to workstations between 11:00 AM and 12:00 PM."
            />

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
          onUpdateWaitlistLead={(updated) => {
            setWaitlistLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
            liveSync.updateWaitlistLead(updated.id, updated);
          }}
          onAddCustomer={handleAddCustomer}
          onUpdateCustomer={handleUpdateCustomer}
          onDeleteCustomer={handleDeleteCustomer}
          onSimulateUserActivation={handleSimulateUserLogin}
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
            liveSync.confirmOrderPayment(orderId);
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

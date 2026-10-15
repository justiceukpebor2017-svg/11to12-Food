import React, { useState, useEffect, useRef } from 'react';
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
  ActiveSessionRecord,
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
import { PlanBuilder } from './components/marketing/PlanBuilder';
import { Testimonials } from './components/ui/testimonials-columns-1';
import { FaqSection } from './components/marketing/FaqSection';
import { Footer } from './components/Footer';
import { CheckoutModal } from './components/marketing/CheckoutModal';
import { SubscriberAuthModal } from './components/subscriber/SubscriberAuthModal';
import { SubscriberDashboardPage } from './pages/SubscriberDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { generateDefaultPassword } from './utils/credentialUtils';
import { liveSync } from './services/liveSyncService';
import {
  claimActiveSession,
  releaseActiveSession,
  listenToSessionConflict,
  listenToAccountDeletion,
  terminateCustomerSession,
  getCurrentSessionToken,
  checkExistingActiveSession,
  requestRemoteSessionYield,
} from './services/sessionService';
import {
  recordCustomerAsDeleted,
  isCustomerRecordedAsDeleted,
  unrecordCustomerAsDeleted,
} from './utils/customerDeletions';
import { SessionConflictModal } from './components/common/SessionConflictModal';
import { DashboardTakeoverModal } from './components/common/DashboardTakeoverModal';
import { ShieldAlert } from 'lucide-react';
import {
  initGoogleAnalytics,
  trackPageView,
  trackEvent,
  trackWaitlistJoined,
  trackBeginCheckout,
  trackOrderSubmitted,
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
  confirmOrderInFirestore,
  logoutSubscriberAccount,
  updateCustomerPasswordInFirestore,
} from './services/firebase';
import { isOrderPendingVerification, recordOrderAsConfirmed, getConfirmedOrderIds } from './utils/finance';
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
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'marketing';
    try {
      const savedMode = localStorage.getItem('11to12_active_view_mode') as ViewMode | null;
      if (savedMode === 'admin') {
        return 'admin';
      }
      if (savedMode === 'subscriber') {
        return 'subscriber';
      }
      if (savedMode === 'marketing') {
        return 'marketing';
      }
    } catch (e) {
      console.error('Failed to restore viewMode from localStorage', e);
    }
    return 'marketing';
  });
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('morning');
  const [showSubscriberAuthModal, setShowSubscriberAuthModal] = useState(false);
  
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

  // Check active session on initial mount for admin mode to prevent unprompted takeover
  useEffect(() => {
    try {
      const initialMode = localStorage.getItem('11to12_active_view_mode');
      if (initialMode === 'admin') {
        checkExistingActiveSession('admin_11to12').then((existing) => {
          const myToken = getCurrentSessionToken();
          if (existing && existing.activeSessionId && existing.activeSessionId !== myToken) {
            setViewMode('marketing');
            setTakeoverPrompt({
              targetRole: 'admin',
              targetUserId: 'admin_11to12',
              targetEmail: 'admin@11to12.food',
              remoteSession: existing,
              onSuccessNavigate: () => {
                setViewMode('admin');
                try {
                  localStorage.setItem('11to12_active_view_mode', 'admin');
                } catch {}
              },
            });
          }
        });
      }
    } catch {}
  }, []);

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

  const userProfileRef = useRef(userProfile);
  useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);

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
  const [planBuilderKey, setPlanBuilderKey] = useState(0);

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

  // Persist active viewMode across reloads so reload stays on active dashboard
  useEffect(() => {
    try {
      localStorage.setItem('11to12_active_view_mode', viewMode);
    } catch (e) {}
  }, [viewMode]);

  // Guaranteed 5-second periodic auto-save and sync for Admin and Subscriber dashboards
  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      if (viewMode === 'subscriber') {
        if (userProfile && userProfile.email) {
          try {
            localStorage.setItem(APP_STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
          } catch (e) {}
        }
      } else if (viewMode === 'admin') {
        try {
          localStorage.setItem(APP_STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
          localStorage.setItem(APP_STORAGE_KEYS.ORDERS, JSON.stringify(submittedOrders));
          localStorage.setItem(APP_STORAGE_KEYS.CREDIT_REDEMPTIONS, JSON.stringify(creditRedemptions));
          localStorage.setItem(APP_STORAGE_KEYS.WAITLIST, JSON.stringify(waitlistLeads));
        } catch (e) {}
      }
    }, 5000);

    return () => clearInterval(autoSaveTimer);
  }, [viewMode, userProfile, customers, submittedOrders, creditRedemptions, waitlistLeads]);

  // Real-time multi-device synchronization via LiveSync
  useEffect(() => {
    const unsubscribe = liveSync.subscribe((liveState) => {
      if (liveState.waitlistLeads && Array.isArray(liveState.waitlistLeads) && liveState.waitlistLeads.length > 0) {
        setWaitlistLeads((prev) => {
          const map = new Map<string, WaitlistLead>();
          prev.forEach((l) => map.set(l.id, l));
          liveState.waitlistLeads.forEach((l) => map.set(l.id, l));
          return Array.from(map.values());
        });
      }
      if (liveState.customers && Array.isArray(liveState.customers)) {
        const validCustomers = liveState.customers.filter(
          (c) => !isCustomerRecordedAsDeleted(c.id, c.email)
        );
        setCustomers(validCustomers);
        try {
          localStorage.setItem(APP_STORAGE_KEYS.CUSTOMERS, JSON.stringify(validCustomers));
        } catch {}
      }
      if (liveState.submittedOrders && Array.isArray(liveState.submittedOrders)) {
        if (liveState.submittedOrders.length > 0) {
          setSubmittedOrders((prev) => {
            const confirmedIds = getConfirmedOrderIds();
            const map = new Map<string, OrderSubmission>();
            prev.forEach((o) => map.set(o.id, o));
            liveState.submittedOrders.forEach((so) => {
              const existing = map.get(so.id);
              if (confirmedIds.has(so.id) || (existing?.paymentStatus === 'Confirmed' && so.paymentStatus !== 'Confirmed')) {
                map.set(so.id, { ...so, paymentStatus: 'Confirmed' });
              } else {
                map.set(so.id, so);
              }
            });
            const merged = Array.from(map.values());
            try {
              localStorage.setItem(APP_STORAGE_KEYS.ORDERS, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      }
      if (liveState.creditRedemptions && Array.isArray(liveState.creditRedemptions) && liveState.creditRedemptions.length > 0) {
        setCreditRedemptions((prev) => {
          const map = new Map<string, CreditRedemptionOrder>();
          prev.forEach((r) => map.set(r.id, r));
          liveState.creditRedemptions.forEach((r) => map.set(r.id, r));
          return Array.from(map.values());
        });
      }
      if (liveState.announcements && liveState.announcements.length > 0) {
        setAnnouncements(liveState.announcements);
      }
      if (liveState.testimonials && Array.isArray(liveState.testimonials) && liveState.testimonials.length > 0) {
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
      if (snapshot.empty) return;
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
      if (leads.length > 0) {
        setWaitlistLeads((prev) => {
          const map = new Map<string, WaitlistLead>();
          prev.forEach((l) => map.set(l.id, l));
          leads.forEach((l) => map.set(l.id, l));
          return Array.from(map.values());
        });
      }
    }, (error) => {
      console.warn('[Firestore onSnapshot waitlist error]:', error);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Real-time onSnapshot camera stream: Listen to customers collection across all devices
  useEffect(() => {
    const unsubscribeLiveSyncDel = liveSync.onCustomerDeleted((delId, delEmail) => {
      recordCustomerAsDeleted(delId, delEmail);
      setCustomers((prev) =>
        prev.filter(
          (c) =>
            (!delId || c.id !== delId) &&
            (!delEmail || !c.email || c.email.trim().toLowerCase() !== delEmail.trim().toLowerCase())
        )
      );
      setWaitlistLeads((prev) =>
        prev.filter(
          (l) => !delEmail || !l.email || l.email.trim().toLowerCase() !== delEmail.trim().toLowerCase()
        )
      );
      setSubmittedOrders((prev) =>
        prev.filter(
          (o) =>
            (!delId || o.id !== delId) &&
            (!delEmail || !o.email || o.email.trim().toLowerCase() !== delEmail.trim().toLowerCase())
        )
      );
      setCreditRedemptions((prev) =>
        prev.filter(
          (r) =>
            (!delId || r.userId !== delId) &&
            (!delEmail || !r.email || r.email.trim().toLowerCase() !== delEmail.trim().toLowerCase())
        )
      );
      const currentId = userProfileRef.current.id;
      const currentEmail = (userProfileRef.current.email || '').trim().toLowerCase();
      if (
        (delId && currentId && (currentId === delId || currentId.toLowerCase() === delId.toLowerCase())) ||
        (delEmail && currentEmail && currentEmail === delEmail.trim().toLowerCase())
      ) {
        handleForceLogoutDueToAccountDeletion();
      }
    });

    const unsubscribe = onSnapshot(collection(db, 'customers'), (snapshot) => {
      // 1. Process deletions directly from Firestore snapshot changes
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') {
          const removedData = change.doc.data() as CustomerRecord;
          const delId = change.doc.id;
          const delEmail = removedData?.email;
          recordCustomerAsDeleted(delId, delEmail);
          setCustomers((prev) =>
            prev.filter(
              (c) =>
                (!delId || c.id !== delId) &&
                (!delEmail || !c.email || c.email.trim().toLowerCase() !== delEmail.trim().toLowerCase())
            )
          );
          setWaitlistLeads((prev) =>
            prev.filter(
              (l) => !delEmail || !l.email || l.email.trim().toLowerCase() !== delEmail.trim().toLowerCase()
            )
          );
          setSubmittedOrders((prev) =>
            prev.filter(
              (o) =>
                (!delId || o.id !== delId) &&
                (!delEmail || !o.email || o.email.trim().toLowerCase() !== delEmail.trim().toLowerCase())
            )
          );
          setCreditRedemptions((prev) =>
            prev.filter(
              (r) =>
                (!delId || r.userId !== delId) &&
                (!delEmail || !r.email || r.email.trim().toLowerCase() !== delEmail.trim().toLowerCase())
            )
          );
          const currentId = userProfileRef.current.id;
          const currentEmail = (userProfileRef.current.email || '').trim().toLowerCase();
          if (
            (delId && currentId && (currentId === delId || currentId.toLowerCase() === delId.toLowerCase())) ||
            (delEmail && currentEmail && currentEmail === delEmail.trim().toLowerCase())
          ) {
            handleForceLogoutDueToAccountDeletion();
          }
        }
      });

      if (snapshot.empty) {
        setCustomers([]);
        try {
          localStorage.setItem(APP_STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
        } catch {}
        return;
      }
      const firestoreCustomers: CustomerRecord[] = snapshot.docs
        .map((d) => ({
          ...(d.data() as CustomerRecord),
          id: d.id,
        }))
        .filter((c) => !isCustomerRecordedAsDeleted(c.id, c.email));

      setCustomers(firestoreCustomers);
      try {
        localStorage.setItem(APP_STORAGE_KEYS.CUSTOMERS, JSON.stringify(firestoreCustomers));
      } catch {}
    }, (error) => {
      console.warn('[Firestore onSnapshot customers error]:', error);
    });

    return () => {
      unsubscribe();
      unsubscribeLiveSyncDel();
    };
  }, []);

  // Real-time onSnapshot camera stream: Listen to submitted orders collection across all devices
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      if (snapshot.empty) return;
      const firestoreOrders: OrderSubmission[] = snapshot.docs.map((d) => ({
        ...(d.data() as OrderSubmission),
        id: d.id,
      }));
      if (firestoreOrders.length > 0) {
        setSubmittedOrders((prev) => {
          const confirmedIds = getConfirmedOrderIds();
          const map = new Map<string, OrderSubmission>();
          prev.forEach((o) => map.set(o.id, o));

          firestoreOrders.forEach((fo) => {
            const existing = map.get(fo.id);
            // If already confirmed locally or belongs to an active confirmed customer, keep Confirmed!
            const isAlreadyConfirmed =
              confirmedIds.has(fo.id) ||
              existing?.paymentStatus === 'Confirmed' ||
              !isOrderPendingVerification(fo, customers);

            if (isAlreadyConfirmed) {
              map.set(fo.id, { ...fo, paymentStatus: 'Confirmed' });
              // Self-heal Firestore if Firestore was still showing unverified
              if (fo.paymentStatus !== 'Confirmed') {
                confirmOrderInFirestore(fo.id).catch(() => {});
              }
            } else {
              map.set(fo.id, fo);
            }
          });

          const merged = Array.from(map.values());
          try {
            localStorage.setItem(APP_STORAGE_KEYS.ORDERS, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    }, (error) => {
      console.warn('[Firestore onSnapshot orders error]:', error);
    });

    return () => {
      unsubscribe();
    };
  }, [customers]);

  // Real-time synchronization: Keep active subscriber's userProfile synchronized with customers state
  // When an admin confirms extra meal days or changes meals, userProfile reflects it immediately
  useEffect(() => {
    if (!userProfile || !userProfile.email) return;
    const userEmail = userProfile.email.trim().toLowerCase();
    const matchedCust = customers.find(
      (c) =>
        (c.id && c.id === userProfile.id) ||
        (c.email && c.email.trim().toLowerCase() === userEmail)
    );
    if (!matchedCust) return;

    const custDays = matchedCust.selectedDays || [];
    const profDays = userProfile.selectedDays || [];

    if (custDays.length > profDays.length || matchedCust.totalDays > (userProfile.totalSubscribedDays || 0)) {
      setUserProfile((prev) => {
        const nextProfile: UserProfile = {
          ...prev,
          selectedDays: custDays,
          totalSubscribedDays: Math.max(matchedCust.totalDays, custDays.length),
          planName: matchedCust.planName || `${custDays.length} Workday Lunch Plan`,
          creditsBalance: matchedCust.creditsBalance ?? prev.creditsBalance,
          skippedDates: matchedCust.skippedDates || prev.skippedDates,
        };
        try {
          localStorage.setItem(APP_STORAGE_KEYS.USER_PROFILE, JSON.stringify(nextProfile));
        } catch {}
        return nextProfile;
      });
    }
  }, [customers, userProfile?.id, userProfile?.email]);

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
            creditsBalance: matched.creditsBalance || 0,
            skippedDates: matched.skippedDates || [],
            creditUsedDates: matched.creditUsedDates || [],
            creditRedemptions: matched.creditRedemptions || [],
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
            skipCount: (matched.skippedDates || []).length,
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
    setCreditRedemptions((prev) => {
      const exists = prev.some((r) => r.id === order.id);
      const next = exists ? prev.map((r) => (r.id === order.id ? order : r)) : [order, ...prev];
      try {
        localStorage.setItem(APP_STORAGE_KEYS.CREDIT_REDEMPTIONS, JSON.stringify(next));
      } catch {}
      return next;
    });

    liveSync.addCreditRedemption(order).catch(() => {});

    const dateStr = order.items?.[0]?.dateStr;
    setCustomers((prev) => {
      const matchedIdx = prev.findIndex(
        (c) =>
          c.id === order.userId ||
          Boolean(c.email && order.email && c.email.toLowerCase() === order.email.toLowerCase())
      );
      if (matchedIdx >= 0) {
        const copy = [...prev];
        const c = copy[matchedIdx];
        const updatedUsedDates = Array.from(new Set([...(c.creditUsedDates || []), ...(dateStr ? [dateStr] : [])]));
        const updatedRedemptions = [...(c.creditRedemptions || []).filter((r) => r.id !== order.id), order];
        const updatedCust: CustomerRecord = {
          ...c,
          creditUsedDates: updatedUsedDates,
          creditRedemptions: updatedRedemptions,
          creditsBalance: Math.max(0, (c.creditsBalance ?? 1) - (order.totalCreditsUsed || 1)),
        };
        copy[matchedIdx] = updatedCust;
        liveSync.updateCustomer(updatedCust.id, updatedCust).catch(() => {});
        saveCustomerToFirestore(updatedCust).catch(() => {});
        try {
          localStorage.setItem(APP_STORAGE_KEYS.CUSTOMERS, JSON.stringify(copy));
        } catch {}
        return copy;
      }
      return prev;
    });
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
    unrecordCustomerAsDeleted(newCustomer.id, newCustomer.email);
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
    handleCustomerLogin(customer);
  };

  const handleCustomerLogin = (customer: CustomerRecord) => {
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
      creditUsedDates: customer.creditUsedDates || [],
      creditRedemptions: customer.creditRedemptions || [],
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
      skipCount: (customer.skippedDates || []).length,
      isPasswordSet: customer.isPasswordSet,
      selectedDays: customer.selectedDays,
      pendingAddressChange: null,
    });

    setViewMode('subscriber');
  };

  const handlePasswordSet = (customer: CustomerRecord, newPass: string) => {
    const cleanPass = newPass.trim();
    const updatedCust: CustomerRecord = {
      ...customer,
      isPasswordSet: true,
      password: cleanPass,
      defaultPassword: '',
      isDefaultPassword: false,
      mustChangePassword: false,
      passwordLastChangedAt: new Date().toISOString(),
      status: 'Active',
    };

    liveSync.updateCustomer(updatedCust.id, updatedCust);
    saveCustomerToFirestore(updatedCust).catch(() => {});
    updateCustomerPasswordInFirestore(updatedCust.id, cleanPass).catch(() => {});

    setCustomers((prev) => {
      const cleanEmail = (customer.email || '').toLowerCase().trim();
      const next = prev.map((c) =>
        c.id === customer.id || Boolean(cleanEmail && c.email && c.email.toLowerCase().trim() === cleanEmail)
          ? updatedCust
          : c
      );
      try {
        localStorage.setItem(APP_STORAGE_KEYS.CUSTOMERS, JSON.stringify(next));
      } catch {}
      return next;
    });

    // Synchronize active userProfile
    handleCustomerLogin(updatedCust);
  };

  // Real-Time Single Concurrent Session Management State
  const [sessionConflict, setSessionConflict] = useState<{
    conflict: ActiveSessionRecord;
    role: 'admin' | 'subscriber';
  } | null>(null);
  const [sessionToast, setSessionToast] = useState<string | null>(null);

  // Takeover Prompt State for Gatekeeper Modal ("Save the other dashboard then open here")
  const [takeoverPrompt, setTakeoverPrompt] = useState<{
    targetRole: 'admin' | 'subscriber';
    targetUserId: string;
    targetEmail?: string;
    remoteSession: ActiveSessionRecord;
    onSuccessNavigate: () => void;
  } | null>(null);

  // Auto-dismiss session toast after 7 seconds
  useEffect(() => {
    if (!sessionToast) return;
    const timer = setTimeout(() => {
      setSessionToast(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [sessionToast]);

  // Real-time password update notification for Admin dashboard
  useEffect(() => {
    const unsub = liveSync.onCustomerUpdated((updatedCust) => {
      setCustomers((prev) =>
        prev.map((c) => (c.id === updatedCust.id ? { ...c, ...updatedCust } : c))
      );
      if (updatedCust.passwordLastChangedAt) {
        setSessionToast(`✓ Customer ${updatedCust.fullName} updated their login password in real-time.`);
      }
    });
    return () => unsub();
  }, []);

  // Single Device Enforcement Lifecycle for Admin and Subscriber
  useEffect(() => {
    if (viewMode !== 'admin' && viewMode !== 'subscriber') {
      return;
    }

    const currentUserId = viewMode === 'admin' ? 'admin_11to12' : (userProfile.id || userProfile.email || 'customer');
    const currentRole: 'admin' | 'subscriber' = viewMode === 'admin' ? 'admin' : 'subscriber';
    const currentEmail = viewMode === 'admin' ? 'admin@11to12.food' : userProfile.email;

    let unsubConflict: (() => void) | null = null;
    let isDisposed = false;

    // Claim active session across all channels (Firestore, Live Backend SSE, BroadcastChannel, localStorage)
    claimActiveSession(currentUserId, currentRole, currentEmail).then((token) => {
      if (isDisposed) return;
      unsubConflict = listenToSessionConflict(
        currentUserId,
        token,
        (remoteSession) => {
          if (!isDisposed) {
            setSessionConflict({
              conflict: remoteSession,
              role: currentRole,
            });
          }
        },
        async (requestingDevice) => {
          // Another device clicked "Save the other dashboard then open here"
          console.warn('[App] Remote dashboard takeover requested by:', requestingDevice);
          try {
            if (currentRole === 'admin') {
              localStorage.setItem(APP_STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
              localStorage.setItem(APP_STORAGE_KEYS.ORDERS, JSON.stringify(submittedOrders));
            }
          } catch {}
          await releaseActiveSession(currentUserId, token);
          setViewMode('marketing');
          setSessionConflict(null);
          setSessionToast(
            `This dashboard was saved and opened on your other device (${requestingDevice}). You were logged out to maintain perfect synchronization.`
          );
        }
      );
    });

    return () => {
      isDisposed = true;
      if (unsubConflict) {
        unsubConflict();
      }
    };
  }, [viewMode, userProfile.id, userProfile.email]);

  const handleAttemptOpenAdmin = async () => {
    const adminUserId = 'admin_11to12';
    const existing = await checkExistingActiveSession(adminUserId);
    const myToken = getCurrentSessionToken();
    if (existing && existing.activeSessionId && existing.activeSessionId !== myToken) {
      setTakeoverPrompt({
        targetRole: 'admin',
        targetUserId: adminUserId,
        targetEmail: 'admin@11to12.food',
        remoteSession: existing,
        onSuccessNavigate: () => {
          setViewMode('admin');
          try {
            localStorage.setItem('11to12_active_view_mode', 'admin');
          } catch {}
        },
      });
      return;
    }
    await claimActiveSession(adminUserId, 'admin', 'admin@11to12.food');
    setViewMode('admin');
    try {
      localStorage.setItem('11to12_active_view_mode', 'admin');
    } catch {}
  };

  const handleAttemptOpenSubscriber = async (customer: CustomerRecord) => {
    if (isCustomerRecordedAsDeleted(customer.id, customer.email)) {
      setSessionToast('This account was removed by administration. Credentials are no longer active.');
      return;
    }
    const custUserId = customer.id || customer.email || 'customer';
    const existing = await checkExistingActiveSession(custUserId);
    const myToken = getCurrentSessionToken();
    if (existing && existing.activeSessionId && existing.activeSessionId !== myToken) {
      setTakeoverPrompt({
        targetRole: 'subscriber',
        targetUserId: custUserId,
        targetEmail: customer.email,
        remoteSession: existing,
        onSuccessNavigate: () => {
          handleCustomerLogin(customer);
        },
      });
      return;
    }
    await claimActiveSession(custUserId, 'subscriber', customer.email);
    handleCustomerLogin(customer);
  };

  const handleAttemptTabSwitch = (tab: ViewMode) => {
    if (tab === 'admin') {
      handleAttemptOpenAdmin();
    } else if (tab === 'subscriber') {
      if (userProfile.id || userProfile.email) {
        const cust = customers.find(
          (c) =>
            (userProfile.id && c.id === userProfile.id) ||
            (userProfile.email && c.email && c.email.trim().toLowerCase() === userProfile.email.trim().toLowerCase())
        );
        if (cust) {
          handleAttemptOpenSubscriber(cust);
          return;
        }
      }
      setShowSubscriberAuthModal(true);
    } else {
      setViewMode('marketing');
      try {
        localStorage.setItem('11to12_active_view_mode', 'marketing');
      } catch {}
    }
  };

  const handleExecuteTakeover = async () => {
    if (!takeoverPrompt) return;
    const { targetUserId, targetRole, targetEmail, onSuccessNavigate } = takeoverPrompt;

    // 1. Send yield request to the remote device
    await requestRemoteSessionYield(targetUserId);

    // 2. Wait for remote dashboard to flush and save
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // 3. Fetch latest authoritative state from backend so this device sees identical records
    try {
      const freshState = await liveSync.fetchBootstrap();
      if (freshState.customers) {
        const clean = freshState.customers.filter((c) => !isCustomerRecordedAsDeleted(c.id, c.email));
        setCustomers(clean);
        try {
          localStorage.setItem(APP_STORAGE_KEYS.CUSTOMERS, JSON.stringify(clean));
        } catch {}
      }
    } catch {}

    // 4. Claim the single active session for this device
    await claimActiveSession(targetUserId, targetRole, targetEmail);

    // 5. Navigate to the dashboard
    onSuccessNavigate();
    setTakeoverPrompt(null);
    setSessionToast(
      `✓ Other dashboard safely saved & closed. This device is now your active live ${targetRole === 'admin' ? 'admin' : 'subscriber'} dashboard.`
    );
  };

  const handleForceLogoutDueToAccountDeletion = async () => {
    console.warn('[App] Customer account deleted by administrator. Forcing logout.');
    setUserProfile(INITIAL_USER_PROFILE);
    try {
      localStorage.removeItem(APP_STORAGE_KEYS.USER_PROFILE);
      localStorage.removeItem('11to12_active_view_mode');
      localStorage.removeItem('11to12_subscriber_profile');
      sessionStorage.removeItem('11to12_active_session_token_v1');
    } catch {}

    try {
      await logoutSubscriberAccount();
    } catch {}

    try {
      const token = getCurrentSessionToken() || '';
      const custId = userProfile.id || userProfile.email || 'customer';
      await releaseActiveSession(custId, token);
    } catch {}

    setViewMode('marketing');
    setSessionConflict(null);
    setSessionToast('Your subscriber account was removed by the administrator. Your active session has ended.');
  };

  // Listen for real-time account deletion across all devices and tabs
  useEffect(() => {
    if (viewMode !== 'subscriber') {
      return;
    }
    const unsub = listenToAccountDeletion(
      userProfile.id || '',
      userProfile.email,
      () => {
        handleForceLogoutDueToAccountDeletion();
      }
    );
    return () => unsub();
  }, [viewMode, userProfile.id, userProfile.email]);

  // Safety watch: if active subscriber record ID is deleted or account is removed from customers, force logout immediately!
  useEffect(() => {
    if (viewMode !== 'subscriber') return;
    const cleanEmail = (userProfile.email || '').trim().toLowerCase();
    const cleanId = (userProfile.id || '').trim();

    if (cleanId && isCustomerRecordedAsDeleted(cleanId)) {
      handleForceLogoutDueToAccountDeletion();
      return;
    }

    if (cleanEmail && customers.length > 0) {
      const isStillInCustomers = customers.some(
        (c) =>
          (cleanId && c.id && (c.id === cleanId || c.id.toLowerCase() === cleanId.toLowerCase())) ||
          (c.email && c.email.trim().toLowerCase() === cleanEmail)
      );
      if (!isStillInCustomers) {
        console.warn('[App] Customer record removed by administrator. Forcing logout immediately.');
        handleForceLogoutDueToAccountDeletion();
      }
    }
  }, [customers, viewMode, userProfile.id, userProfile.email]);

  const handleContinueUsingThisDevice = async () => {
    if (!sessionConflict) return;
    const currentUserId = sessionConflict.role === 'admin' ? 'admin_11to12' : (userProfile.id || userProfile.email || 'customer');
    const currentEmail = sessionConflict.role === 'admin' ? 'admin@11to12.food' : userProfile.email;
    await claimActiveSession(currentUserId, sessionConflict.role, currentEmail);
    setSessionConflict(null);
  };

  const handleSaveAndLogoutConflict = async () => {
    if (!sessionConflict) return;
    const role = sessionConflict.role;
    const currentUserId = role === 'admin' ? 'admin_11to12' : (userProfile.id || userProfile.email || 'customer');
    const token = getCurrentSessionToken() || '';

    if (role === 'admin') {
      try {
        localStorage.setItem(APP_STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
        localStorage.setItem(APP_STORAGE_KEYS.WAITLIST, JSON.stringify(waitlistLeads));
        localStorage.setItem(APP_STORAGE_KEYS.ORDERS, JSON.stringify(submittedOrders));
      } catch {}
      await releaseActiveSession(currentUserId, token);
      setViewMode('marketing');
      setSessionConflict(null);
      setSessionToast('All admin data was safely saved. You were logged out because this account was opened on another device.');
    } else {
      try {
        localStorage.setItem(APP_STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
      } catch {}
      await releaseActiveSession(currentUserId, token);
      try {
        await logoutSubscriberAccount();
      } catch {}
      setViewMode('marketing');
      setSessionConflict(null);
      setSessionToast('Your subscription account was safely saved. You were logged out because your account was opened on another device.');
    }
  };

  const handleAdminLogout = async () => {
    // Explicit manual save pulse on admin logout
    try {
      localStorage.setItem(APP_STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      localStorage.setItem(APP_STORAGE_KEYS.ORDERS, JSON.stringify(submittedOrders));
      localStorage.setItem(APP_STORAGE_KEYS.CREDIT_REDEMPTIONS, JSON.stringify(creditRedemptions));
      localStorage.setItem(APP_STORAGE_KEYS.WAITLIST, JSON.stringify(waitlistLeads));
      localStorage.removeItem('11to12_active_view_mode');
      localStorage.removeItem('11to12_admin_logged_in');
    } catch {}

    const token = getCurrentSessionToken() || '';
    await releaseActiveSession('admin_11to12', token);
    setViewMode('marketing');
    setSessionToast('Admin signed out successfully. All operations data was safely saved.');
  };

  const handleLogout = async () => {
    // Explicit manual save pulse on user logout
    try {
      if (userProfile && userProfile.email) {
        localStorage.setItem(APP_STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
        handleUpdateProfile(userProfile);
      }
      localStorage.removeItem('11to12_active_view_mode');
    } catch {}

    try {
      const token = getCurrentSessionToken() || '';
      const custId = userProfile.id || userProfile.email || 'customer';
      await releaseActiveSession(custId, token);
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

  const handleCloseCheckout = () => {
    setIsCheckoutOpen(false);
    setSelectedLunchDays([]);
    setCalculatedOrderSummary(null);
    setPlanBuilderKey((prev) => prev + 1);

    // Smoothly scroll back to the plan builder so the user can immediately select new dates or register for someone else
    setTimeout(() => {
      const el = document.getElementById('plan-builder') || document.getElementById('pricing') || document.getElementById('home');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleOrderSubmitted = async (order: OrderSubmission) => {
    trackOrderSubmitted(order);
    // 1. Immediately store order in submittedOrders for invoices / verification
    setSubmittedOrders((prev) => {
      const exists = prev.some((o) => o.id === order.id);
      if (exists) {
        return prev.map((o) => (o.id === order.id ? order : o));
      }
      return [order, ...prev];
    });

    // 2. Treat every checkout from home page as a stand-alone new customer
    const cleanEmail = (order.email || '').trim().toLowerCase();
    const defaultPassword = generateDefaultPassword();
    let registeredCustomer: CustomerRecord | null = null;

    setCustomers((prev) => {
      registeredCustomer = {
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
        paymentStatus: 'Pending Verification',
        planName: `${order.totalDays} Workday Lunch Plan`,
        totalDays: order.totalDays,
        creditsBalance: 0,
        skippedDates: [],
        creditUsedDates: [],
        creditRedemptions: [],
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

      unrecordCustomerAsDeleted(registeredCustomer.id, registeredCustomer.email);
      // Ensure no stale record with this email lingers, creating this customer fresh
      const filteredPrev = prev.filter(
        (c) => !c.email || c.email.trim().toLowerCase() !== cleanEmail
      );
      const next = [registeredCustomer, ...filteredPrev];
      try {
        localStorage.setItem(APP_STORAGE_KEYS.CUSTOMERS, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 3. Persist and broadcast customer to Firestore and liveSync
    setTimeout(() => {
      if (registeredCustomer) {
        liveSync.registerCustomer(registeredCustomer).catch(() => {});
        saveCustomerToFirestore(registeredCustomer).catch(() => {});
      }
    }, 0);

    // 4. Save to central live database and Firestore, and broadcast across all devices
    try {
      await liveSync.submitOrder(order);
    } catch (e) {
      console.warn('liveSync submitOrder notice:', e);
    }
    await saveOrderToFirestore(order).catch(() => {});

    // 5. Post urgent admin announcement alert
    const newAnnouncement: AdminAnnouncement = {
      id: `ann-${Date.now()}`,
      title: `🔔 New Customer Payment: ${order.fullName}`,
      message: `${order.fullName} (${order.company}) selected ${order.totalDays} meal days (₦${order.finalTotalNGN.toLocaleString()}) and submitted payment (Invoice #${order.id}). Default Login Password: ${defaultPassword}`,
      type: 'warning',
      active: true,
      postedAt: new Date().toISOString(),
    };
    setAnnouncements((prev) => [newAnnouncement, ...prev]);

    // 6. Deduplicate: If this person was in the waitlist (by unique code or email), remove from waitlist so admin has 0 duplicates
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
    // 1. Permanently record as confirmed so no refresh, re-login or snapshot will ever regress it
    recordOrderAsConfirmed(orderId);

    // Dismiss notification badge for this order permanently
    try {
      const stored = localStorage.getItem('11to12_dismissed_admin_notifications');
      const set = new Set(stored ? JSON.parse(stored) : []);
      set.add(`order-${orderId}`);
      set.add(`notif-order-${orderId}`);
      localStorage.setItem('11to12_dismissed_admin_notifications', JSON.stringify(Array.from(set)));
    } catch {}

    const order = submittedOrders.find((o) => o.id === orderId);

    liveSync.confirmOrderPayment(orderId);

    // 2. Mark order payment as Confirmed in state and local storage
    setSubmittedOrders((prev) => {
      const next = prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: 'Confirmed' as const } : o));
      try {
        localStorage.setItem(APP_STORAGE_KEYS.ORDERS, JSON.stringify(next));
      } catch {}
      return next;
    });

    // Persist confirmed status to Firestore immediately so it never reverts on snapshot updates
    confirmOrderInFirestore(orderId).catch(() => {});

    if (!order) return;

    // 3. Locate customer by orderRef, email, or memberCode
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

      // Deduplicate and merge by dateStr
      const dateMap = new Map<string, SelectedLunchDay>();
      existingDays.forEach((d) => dateMap.set(d.dateStr, d));
      newDays.forEach((d) => dateMap.set(d.dateStr, d));
      const mergedDays = Array.from(dateMap.values()).sort((a, b) => a.dateStr.localeCompare(b.dateStr));

      const updatedCust: CustomerRecord = {
        ...cust,
        selectedDays: mergedDays,
        totalDays: mergedDays.length,
        finalTotalNGN: (cust.finalTotalNGN || 0) + (order.finalTotalNGN || 0),
        subtotalNGN: (cust.subtotalNGN || 0) + (order.subtotalNGN || 0),
        planName: `${mergedDays.length} Workday Lunch Plan`,
        status: 'Active',
        paymentStatus: 'Paid',
      };

      setCustomers((prev) => {
        const copy = [...prev];
        copy[custIdx] = updatedCust;
        try {
          localStorage.setItem(APP_STORAGE_KEYS.CUSTOMERS, JSON.stringify(copy));
        } catch {}
        return copy;
      });

      liveSync.updateCustomer(updatedCust.id, updatedCust).catch(() => {});
      saveCustomerToFirestore(updatedCust).catch(() => {});

      // Synchronize active userProfile if this customer is the logged-in user
      if (
        (userProfile.email && cust.email && userProfile.email.toLowerCase() === cust.email.toLowerCase()) ||
        userProfile.id === cust.id
      ) {
        setUserProfile((prev) => {
          const nextProf: UserProfile = {
            ...prev,
            selectedDays: mergedDays,
            totalSubscribedDays: mergedDays.length,
            planName: `${mergedDays.length} Workday Lunch Plan`,
          };
          try {
            localStorage.setItem(APP_STORAGE_KEYS.USER_PROFILE, JSON.stringify(nextProf));
          } catch {}
          return nextProf;
        });
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
      unrecordCustomerAsDeleted(newCustomer.id, newCustomer.email);
      setCustomers((prev) => {
        const next = [newCustomer, ...prev];
        try {
          localStorage.setItem(APP_STORAGE_KEYS.CUSTOMERS, JSON.stringify(next));
        } catch {}
        return next;
      });
      liveSync.registerCustomer(newCustomer).catch(() => {});
      saveCustomerToFirestore(newCustomer).catch(() => {});
    }

    // 4. Post confirmation announcement and clear previous pending verification announcements
    const confirmedAnnouncement: AdminAnnouncement = {
      id: `ann-${Date.now()}`,
      title: `✅ Payment Confirmed: ${order.fullName}`,
      message: `Payment confirmed for ${order.fullName}. Moved to Customer nav with login credentials generated, and meals synced with kitchen production.`,
      type: 'info',
      active: true,
      postedAt: new Date().toISOString(),
    };
    setAnnouncements((prev) => {
      const filtered = prev.filter(
        (a) =>
          !a.id.includes(orderId) &&
          !a.message?.includes(orderId) &&
          !(a.title?.includes(order.fullName) && a.title?.includes('Top-Up'))
      );
      return [confirmedAnnouncement, ...filtered];
    });
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    try {
      localStorage.setItem(APP_STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
    } catch {}

    // Synchronize into customer record for Admin Dashboard in real time
    setCustomers((prev) => {
      const idx = prev.findIndex(
        (c) =>
          c.id === updated.id ||
          Boolean(c.email && updated.email && c.email.toLowerCase() === updated.email.toLowerCase())
      );
      if (idx >= 0) {
        const copy = [...prev];
        const currentCust = copy[idx];

        // Never drop confirmed meal days or shrink totalDays
        const existingDays = currentCust.selectedDays || [];
        const incomingDays = updated.selectedDays || [];
        let finalDays = existingDays;
        if (incomingDays.length >= existingDays.length) {
          finalDays = incomingDays;
        } else if (incomingDays.length > 0) {
          const dateMap = new Map<string, SelectedLunchDay>();
          existingDays.forEach((d) => dateMap.set(d.dateStr, d));
          incomingDays.forEach((d) => dateMap.set(d.dateStr, d));
          finalDays = Array.from(dateMap.values()).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
        }

        const finalTotalDays = Math.max(currentCust.totalDays || 0, finalDays.length, updated.totalSubscribedDays || 0);

        const updatedCust: CustomerRecord = {
          ...currentCust,
          fullName: updated.name || currentCust.fullName,
          phone: updated.phone || currentCust.phone,
          company: updated.company || currentCust.company,
          officeAddress: updated.address || currentCust.officeAddress,
          secondAddress: updated.secondAddress || currentCust.secondAddress,
          creditsBalance: updated.creditsBalance ?? currentCust.creditsBalance,
          skippedDates: updated.skippedDates || currentCust.skippedDates || [],
          creditUsedDates: updated.creditUsedDates || currentCust.creditUsedDates || [],
          creditRedemptions: updated.creditRedemptions || currentCust.creditRedemptions || [],
          selectedDays: finalDays,
          totalDays: finalTotalDays,
          planName: `${finalTotalDays} Workday Lunch Plan`,
        };
        copy[idx] = updatedCust;
        liveSync.updateCustomer(updatedCust.id, updatedCust).catch(() => {});
        saveCustomerToFirestore(updatedCust).catch(() => {});
        try {
          localStorage.setItem(APP_STORAGE_KEYS.CUSTOMERS, JSON.stringify(copy));
        } catch {}
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

  const handleDeleteCustomer = async (customerId: string, email?: string) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Permanently record deletion in markers so snapshots & liveSync never restore it
    recordCustomerAsDeleted(customerId, cleanEmail);

    // 2. Remove from local customers state and localStorage
    setCustomers((prev) => {
      const next = prev.filter((c) => {
        if (customerId && c.id === customerId) return false;
        if (cleanEmail && c.email && c.email.trim().toLowerCase() === cleanEmail) return false;
        return true;
      });
      try {
        localStorage.setItem(APP_STORAGE_KEYS.CUSTOMERS, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 3. Purge matching waitlist lead if any, ensuring the email is 100% free for new users
    if (cleanEmail) {
      setWaitlistLeads((prev) => prev.filter((l) => !l.email || l.email.trim().toLowerCase() !== cleanEmail));
    }

    // 3b. Purge creditRedemptions so old skips and credits never pollute a future registration with this email
    setCreditRedemptions((prev) => {
      const next = prev.filter((r) => {
        if (customerId && r.userId === customerId) return false;
        if (cleanEmail && r.email && r.email.trim().toLowerCase() === cleanEmail) return false;
        return true;
      });
      try {
        localStorage.setItem(APP_STORAGE_KEYS.CREDIT_REDEMPTIONS, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 3c. Purge submittedOrders for this email so future registrations start completely clean
    setSubmittedOrders((prev) => {
      const next = prev.filter((o) => {
        if (cleanEmail && o.email && o.email.trim().toLowerCase() === cleanEmail) return false;
        return true;
      });
      try {
        localStorage.setItem(APP_STORAGE_KEYS.ORDERS, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 4. Terminate active sessions across all devices and server
    await terminateCustomerSession(customerId, cleanEmail).catch(() => {});
    await liveSync.deleteCustomer(customerId, cleanEmail).catch(() => {});
    await deleteCustomerFromFirestore(customerId, cleanEmail).catch(() => {});

    // 5. If currently active user in this browser is this subscriber, log them off immediately!
    const activeSubscriberId = userProfile.id || userProfileRef.current.id;
    const activeSubscriberEmail = (userProfile.email || userProfileRef.current.email || '').trim().toLowerCase();
    const isCurrentSubscriber =
      (activeSubscriberId && activeSubscriberId === customerId) ||
      (cleanEmail && activeSubscriberEmail && activeSubscriberEmail === cleanEmail);

    if (isCurrentSubscriber) {
      await handleForceLogoutDueToAccountDeletion();
    }
  };

  const handleDeleteWaitlistLead = async (leadId: string) => {
    setWaitlistLeads((prev) => prev.filter((l) => l.id !== leadId));
    await liveSync.deleteWaitlistLead(leadId);
    await deleteWaitlistLeadFromFirestore(leadId).catch(() => {});
  };

  const handleDeleteOrder = async (orderId: string) => {
    setSubmittedOrders((prev) => {
      const next = prev.filter((o) => o.id !== orderId);
      try {
        localStorage.setItem(APP_STORAGE_KEYS.ORDERS, JSON.stringify(next));
      } catch {}
      return next;
    });
    await liveSync.deleteOrder(orderId).catch(() => {});
    await deleteOrderFromFirestore(orderId).catch(() => {});
  };

  const handleUpdateLaunchSettings = async (patch: Partial<LaunchSettings>) => {
    const updated = await liveSync.updateLaunchSettings(patch);
    await saveLaunchSettingsToFirestore(updated).catch(() => {});
    setLaunchSettings(updated);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1A1A] font-['Poppins'] antialiased selection:bg-[#FF4C00] selection:text-white">
      
      {/* Universal Clean Header with Brand Logo & Log In (Overlay on Marketing View) */}
      {viewMode === 'marketing' && (
        <Header
          currentTab={viewMode}
          setCurrentTab={handleAttemptTabSwitch}
          onOpenSubscriberLogin={() => setShowSubscriberAuthModal(true)}
          timeWindow={timeWindow}
          setTimeWindow={setTimeWindow}
          creditsBalance={userProfile.creditsBalance}
        />
      )}

      {/* VIEW MODE 1: MARKETING PAGE */}
      {viewMode === 'marketing' && (
        <>
          <main className="relative">
            
            {/* 1. First Section: Illustrated Lagos Route Map Hero */}
            <HeroMapSection />

            {/* 2. Second Section: Restored Original Orange Hero */}
            <div id="home">
              <HeroTypewriter />
            </div>

            {/* 3. Build Your Lunch Plan */}
            <PlanBuilder key={planBuilderKey} onProceedToCheckout={handleProceedToCheckout} />

            {/* 4. Deliveries Begin / Reserve Your Desk Drop Section */}
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

            {/* 5. Escape Your Lunch Rut (Process Grid) */}
            <ProcessGrid />

            {/* 6. What Lagos Office Teams Say (Testimonials) */}
            <Testimonials
              testimonials={liveTestimonials}
              title="What Lagos Office Teams Say"
              subtitle="Piping-hot Nigerian corporate lunches delivered directly to workstations between 11:00 AM and 12:00 PM."
            />

            {/* 8. FAQ Section */}
            <FaqSection />

            {/* Payout & Registration Modal */}
            <CheckoutModal
              isOpen={isCheckoutOpen}
              onClose={handleCloseCheckout}
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
            const activeEmail = (userProfile.email || '').trim().toLowerCase();
            const cust = customers.find(
              (c) =>
                (userProfile.id && c.id === userProfile.id) ||
                (activeEmail && c.email && c.email.trim().toLowerCase() === activeEmail)
            );
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
          onLogout={handleAdminLogout}
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

      {/* Floating Session Security Alert / Feedback Toast */}
      {sessionToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[110] bg-zinc-900 text-white text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-2xl border border-zinc-700/80 flex items-center space-x-3 animate-fadeIn font-['Poppins']">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="font-medium text-zinc-100">{sessionToast}</span>
          <button
            type="button"
            onClick={() => setSessionToast(null)}
            className="text-zinc-400 hover:text-white ml-2 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Real-Time Single Concurrent Session Conflict Modal */}
      {sessionConflict && (
        <SessionConflictModal
          conflict={sessionConflict.conflict}
          role={sessionConflict.role}
          onContinueHere={handleContinueUsingThisDevice}
          onSaveAndLogout={handleSaveAndLogoutConflict}
          autoLogoutSeconds={45}
        />
      )}

      {/* Single Concurrent Session Takeover Modal (Requires 'Save the other dashboard then open here') */}
      {takeoverPrompt && (
        <DashboardTakeoverModal
          role={takeoverPrompt.targetRole}
          remoteSession={takeoverPrompt.remoteSession}
          onTakeoverAndOpen={handleExecuteTakeover}
          onCancel={() => setTakeoverPrompt(null)}
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
            handleAttemptOpenSubscriber(customer);
            setShowSubscriberAuthModal(false);
          }}
          onUpdateCustomerPassword={(customerId, newPass) => {
            const cust = customers.find((c) => c.id === customerId);
            if (cust) {
              handlePasswordSet(cust, newPass);
            }
          }}
          onOpenAdminLogin={() => {
            setShowSubscriberAuthModal(false);
            handleAttemptOpenAdmin();
          }}
        />
      )}

      {/* Global 11 to 12 Footer */}
      <Footer
        onNavigateToLanding={() => setViewMode('marketing')}
        onNavigateToSubscriber={() => setShowSubscriberAuthModal(true)}
        onNavigateToAdmin={() => handleAttemptOpenAdmin()}
      />

    </div>
  );
}

import { CustomerRecord, WaitlistLead, OrderSubmission, CreditRedemptionOrder, AdminAnnouncement, TestimonialItem, LaunchSettings } from '../types';
import { getStandardPhoneKey, normalizeEmail } from '../utils/phoneUtils';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from './firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getLaunchSettings, updateLaunchConfig } from '../config/launchConfig';
import { PricingSettings, updatePricingSettings as updatePricingSettingsLocal } from '../config/pricingConfig';
import { customMealOverrides, broadcastMenuUpdate } from '../data/menuRotation';
import { recordCustomerAsDeleted, isCustomerRecordedAsDeleted } from '../utils/customerDeletions';

export interface PulseStats {
  waitlistCount: number;
  confirmedSubscribersCount: number;
  totalReserved: number;
  updatedAt: string;
}

export interface LiveSyncState {
  waitlistLeads: WaitlistLead[];
  customers: CustomerRecord[];
  submittedOrders: OrderSubmission[];
  creditRedemptions: CreditRedemptionOrder[];
  announcements: AdminAnnouncement[];
  testimonials: TestimonialItem[];
  launchSettings: LaunchSettings;
  stats: PulseStats;
}

type SyncListener = (state: LiveSyncState) => void;

import { getApiBaseUrl, apiUrl } from '../utils/apiConfig';
export { getApiBaseUrl, apiUrl };

async function safeParseJson(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}

class LiveSyncService {
  private state: LiveSyncState = {
    waitlistLeads: [],
    customers: [],
    submittedOrders: [],
    creditRedemptions: [],
    announcements: [],
    testimonials: [],
    launchSettings: getLaunchSettings(),
    stats: {
      waitlistCount: 0,
      confirmedSubscribersCount: 0,
      totalReserved: 0,
      updatedAt: new Date().toISOString(),
    },
  };

  private listeners: Set<SyncListener> = new Set();
  private sessionListeners: Set<(event: { type: 'CLAIMED' | 'RELEASED'; session: any }) => void> = new Set();
  private customerDeletedListeners: Set<(id: string, email?: string) => void> = new Set();
  private customerUpdatedListeners: Set<(customer: CustomerRecord) => void> = new Set();
  private eventSource: EventSource | null = null;
  private pollInterval: any = null;
  private isConnected = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedCust = localStorage.getItem('11to12_persistent_customers_v1');
        if (savedCust) {
          const parsed = JSON.parse(savedCust);
          if (Array.isArray(parsed) && parsed.length > 0) this.state.customers = parsed;
        }
        const savedOrders = localStorage.getItem('11to12_persistent_submitted_orders_v1');
        if (savedOrders) {
          const parsed = JSON.parse(savedOrders);
          if (Array.isArray(parsed) && parsed.length > 0) this.state.submittedOrders = parsed;
        }
        const savedCredits = localStorage.getItem('11to12_persistent_credit_redemptions_v1');
        if (savedCredits) {
          const parsed = JSON.parse(savedCredits);
          if (Array.isArray(parsed) && parsed.length > 0) this.state.creditRedemptions = parsed;
        }
      } catch {}
      this.init();
    }
  }

  private init() {
    testFirestoreConnection().catch(() => {});
    this.fetchBootstrap();
    // Fetch launch settings immediately to guarantee instant cross-browser synchronization
    fetch(apiUrl('/api/launch-settings'))
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.launchSettings) {
          this.state.launchSettings = json.launchSettings;
          updateLaunchConfig(json.launchSettings);
          this.notify();
        }
      })
      .catch(() => {});

    // Fetch tiered pricing settings immediately
    fetch(apiUrl('/api/pricing-settings'))
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.pricingSettings) {
          updatePricingSettingsLocal(json.pricingSettings);
        }
      })
      .catch(() => {});

    this.connectSSE();

    // Guaranteed multi-device real-time sync auto-saving & refreshing every 5 seconds
    this.pollInterval = setInterval(() => {
      this.fetchPulseAndSync();
    }, 5000);

    // Refresh immediately on tab focus or active
    window.addEventListener('focus', () => this.fetchBootstrap());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.fetchBootstrap();
      }
    });
  }

  private connectSSE() {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.eventSource = new EventSource(apiUrl('/api/live-stream'));

      this.eventSource.addEventListener('live-update', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          this.handleLiveUpdate(data);
        } catch (e) {
          console.error('[LiveSync] Error parsing live-update SSE:', e);
        }
      });

      this.eventSource.onopen = () => {
        this.isConnected = true;
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        // The browser's EventSource will automatically retry connecting
      };
    } catch (e) {
      console.error('[LiveSync] Failed to initiate EventSource:', e);
    }
  }

  private handleLiveUpdate(data: any) {
    if (data.stats) {
      this.state.stats = data.stats;
    }

    if (data.type === 'INITIAL_SYNC' && data.db) {
      if (Array.isArray(data.db.waitlistLeads) && data.db.waitlistLeads.length > 0) {
        this.state.waitlistLeads = data.db.waitlistLeads;
      }
      if (Array.isArray(data.db.deletedCustomerRecords)) {
        data.db.deletedCustomerRecords.forEach((d: any) => {
          recordCustomerAsDeleted(d.id, d.email);
        });
      }
      if (Array.isArray(data.db.customers)) {
        const serverMap = new Map<string, CustomerRecord>();
        data.db.customers.forEach((c: CustomerRecord) => {
          if (!isCustomerRecordedAsDeleted(c.id, c.email)) {
            serverMap.set(c.id, c);
          }
        });
        this.state.customers = Array.from(serverMap.values());
      }
      if (Array.isArray(data.db.submittedOrders)) {
        this.state.submittedOrders = data.db.submittedOrders;
      }
      if (Array.isArray(data.db.creditRedemptions)) {
        this.state.creditRedemptions = data.db.creditRedemptions;
      }
      if (data.db.announcements && Array.isArray(data.db.announcements)) {
        this.state.announcements = data.db.announcements;
      }
      if (data.db.testimonials && Array.isArray(data.db.testimonials)) {
        this.state.testimonials = data.db.testimonials;
      }
      if (data.db.launchSettings) {
        this.state.launchSettings = data.db.launchSettings;
        updateLaunchConfig(data.db.launchSettings);
      }
      this.notify();
      return;
    }

    if (data.type === 'WAITLIST_JOINED' && data.payload) {
      // Add if not already present
      const exists = this.state.waitlistLeads.some((l) => l.id === data.payload.id);
      if (!exists) {
        this.state.waitlistLeads = [data.payload, ...this.state.waitlistLeads];
      }
    } else if (data.type === 'WAITLIST_UPDATED' && data.payload) {
      this.state.waitlistLeads = this.state.waitlistLeads.map((l) =>
        l.id === data.payload.id ? data.payload : l
      );
    } else if (data.type === 'WAITLIST_DELETED' && data.payload) {
      this.state.waitlistLeads = this.state.waitlistLeads.filter((l) => l.id !== data.payload.id);
    } else if (data.type === 'CUSTOMER_CREATED' && data.payload) {
      const exists = this.state.customers.some((c) => c.id === data.payload.id);
      if (!exists && !isCustomerRecordedAsDeleted(data.payload.id, data.payload.email)) {
        this.state.customers = [data.payload, ...this.state.customers];
      }
      // Also remove matching waitlist lead if converted
      const custEmail = normalizeEmail(data.payload.email);
      const custPhone = getStandardPhoneKey(data.payload.phone);
      this.state.waitlistLeads = this.state.waitlistLeads.filter(
        (l) => normalizeEmail(l.email) !== custEmail && getStandardPhoneKey(l.phone) !== custPhone
      );
    } else if (data.type === 'CUSTOMER_UPDATED' && data.payload) {
      const targetId = data.payload.id;
      const targetEmail = (data.payload.email || '').trim().toLowerCase();
      let matched = false;
      this.state.customers = this.state.customers.map((c) => {
        const matchId = targetId && c.id === targetId;
        const matchEmail = targetEmail && c.email && c.email.trim().toLowerCase() === targetEmail;
        if (matchId || matchEmail) {
          matched = true;
          return {
            ...c,
            ...data.payload,
            password: data.payload.password || c.password,
            passwordLastChangedAt: data.payload.passwordLastChangedAt || c.passwordLastChangedAt,
          };
        }
        return c;
      });
      if (!matched && targetId && !isCustomerRecordedAsDeleted(targetId, targetEmail)) {
        this.state.customers = [data.payload, ...this.state.customers];
      }
      this.customerUpdatedListeners.forEach((fn) => {
        try {
          fn(data.payload);
        } catch {}
      });
    } else if (data.type === 'CUSTOMER_DELETED' && data.payload) {
      const delId = data.payload.id;
      const delEmail = (data.payload.email || '').toLowerCase().trim();
      recordCustomerAsDeleted(delId, delEmail);
      this.state.customers = this.state.customers.filter((c) => {
        if (delId && c.id === delId) return false;
        if (delEmail && c.email && c.email.toLowerCase().trim() === delEmail) return false;
        return true;
      });
      if (delEmail) {
        this.state.waitlistLeads = this.state.waitlistLeads.filter(
          (l) => !l.email || l.email.toLowerCase().trim() !== delEmail
        );
      }
      this.customerDeletedListeners.forEach((listener) => {
        try {
          listener(delId, delEmail);
        } catch {}
      });
    } else if (data.type === 'TESTIMONIALS_UPDATED' && Array.isArray(data.payload)) {
      this.state.testimonials = data.payload;
    } else if (data.type === 'ORDER_SUBMITTED' && data.payload) {
      const exists = this.state.submittedOrders.some((o) => o.id === data.payload.id);
      if (!exists) {
        this.state.submittedOrders = [data.payload, ...this.state.submittedOrders];
      }
    } else if (data.type === 'ORDER_PAYMENT_CONFIRMED' && data.payload) {
      if (data.payload.order) {
        this.state.submittedOrders = this.state.submittedOrders.map((o) =>
          o.id === data.payload.order.id ? data.payload.order : o
        );
      }
      if (data.payload.customer) {
        this.state.customers = this.state.customers.map((c) =>
          c.id === data.payload.customer.id ? data.payload.customer : c
        );
      }
    } else if (data.type === 'ORDER_DELETED' && data.payload) {
      this.state.submittedOrders = this.state.submittedOrders.filter((o) => o.id !== data.payload.id);
    } else if (data.type === 'CREDIT_REDEEMED' && data.payload) {
      const exists = this.state.creditRedemptions.some((r) => r.id === data.payload.id);
      if (!exists) {
        this.state.creditRedemptions = [data.payload, ...this.state.creditRedemptions];
      }
    } else if (data.type === 'LAUNCH_SETTINGS_UPDATED' && data.payload) {
      this.state.launchSettings = data.payload;
      updateLaunchConfig(data.payload);
    } else if (data.type === 'PRICING_UPDATED' && data.payload) {
      updatePricingSettingsLocal(data.payload);
    } else if (data.type === 'MEAL_UPDATED' && data.payload) {
      if (data.payload.dateStr && data.payload.meal) {
        customMealOverrides[data.payload.dateStr] = data.payload.meal;
        try {
          localStorage.setItem('11to12_custom_meals_v3', JSON.stringify(customMealOverrides));
        } catch {}
        broadcastMenuUpdate();
      }
    } else if (data.type === 'MEALS_BATCH_UPDATED' && data.payload) {
      Object.assign(customMealOverrides, data.payload);
      try {
        localStorage.setItem('11to12_custom_meals_v3', JSON.stringify(customMealOverrides));
      } catch {}
      broadcastMenuUpdate();
    } else if (data.type === 'SESSION_CLAIMED' && data.payload) {
      this.sessionListeners.forEach((fn) => {
        try {
          fn({ type: 'CLAIMED', session: data.payload });
        } catch {}
      });
    } else if (data.type === 'SESSION_RELEASED' && data.payload) {
      this.sessionListeners.forEach((fn) => {
        try {
          fn({ type: 'RELEASED', session: data.payload });
        } catch {}
      });
    }

    this.notify();
  }

  public async fetchBootstrap(): Promise<LiveSyncState> {
    try {
      const res = await fetch(apiUrl('/api/bootstrap'));
      if (res.ok) {
        const json = await safeParseJson(res);
        if (json?.db) {
          if (Array.isArray(json.db.deletedCustomerRecords)) {
            json.db.deletedCustomerRecords.forEach((d: any) => {
              recordCustomerAsDeleted(d.id, d.email);
            });
          }
          if (Array.isArray(json.db.waitlistLeads)) {
            this.state.waitlistLeads = json.db.waitlistLeads;
          }
          if (Array.isArray(json.db.customers)) {
            const serverMap = new Map<string, CustomerRecord>();
            json.db.customers.forEach((c: CustomerRecord) => {
              if (!isCustomerRecordedAsDeleted(c.id, c.email)) {
                serverMap.set(c.id, c);
              }
            });
            this.state.customers = Array.from(serverMap.values());
          }
          if (Array.isArray(json.db.submittedOrders)) {
            this.state.submittedOrders = json.db.submittedOrders;
          }
          if (Array.isArray(json.db.creditRedemptions) && json.db.creditRedemptions.length > 0) {
            const map = new Map<string, CreditRedemptionOrder>();
            this.state.creditRedemptions.forEach((r) => map.set(r.id, r));
            json.db.creditRedemptions.forEach((r: CreditRedemptionOrder) => map.set(r.id, r));
            this.state.creditRedemptions = Array.from(map.values());
          }
          if (Array.isArray(json.db.announcements) && json.db.announcements.length > 0) {
            this.state.announcements = json.db.announcements;
          }
          if (Array.isArray(json.db.testimonials) && json.db.testimonials.length > 0) {
            this.state.testimonials = json.db.testimonials;
          }
          if (json.db.customMeals && typeof json.db.customMeals === 'object') {
            Object.assign(customMealOverrides, json.db.customMeals);
            try {
              localStorage.setItem('11to12_custom_meals_v2', JSON.stringify(customMealOverrides));
            } catch {}
            broadcastMenuUpdate();
          }
          if (json.db.launchSettings) {
            this.state.launchSettings = json.db.launchSettings;
            updateLaunchConfig(json.db.launchSettings);
          }
        }
        if (json?.stats) {
          this.state.stats = json.stats;
        }
        this.notify();
      }
    } catch (e) {
      console.warn('[LiveSync] Bootstrap fetch failed:', e);
    }
    return this.state;
  }

  public async fetchPulseAndSync(): Promise<void> {
    try {
      const res = await fetch(apiUrl('/api/pulse'));
      if (res.ok) {
        const stats: PulseStats | null = await safeParseJson(res);
        if (!stats) return;
        // If counts changed compared to our local state, fetch full bootstrap
        if (
          stats.waitlistCount !== this.state.waitlistLeads.length ||
          stats.confirmedSubscribersCount !==
            this.state.customers.filter((c) => c.status === 'Active' || c.paymentStatus === 'Paid').length
        ) {
          await this.fetchBootstrap();
        } else {
          this.state.stats = stats;
          this.notify();
        }
      }
    } catch {
      // ignore transient network glitch
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Send current state immediately to the listener
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (e) {
        console.error('[LiveSync] Listener error:', e);
      }
    }
  }

  public getState(): LiveSyncState {
    return this.state;
  }

  /**
   * Client-side duplicate verification helper
   */
  public checkLocalDuplicate(email: string, phone: string): { duplicateEmail: boolean; duplicatePhone: boolean; message?: string } {
    const targetEmail = normalizeEmail(email);
    const targetPhoneKey = getStandardPhoneKey(phone);

    const emailInWaitlist = this.state.waitlistLeads.some((l) => normalizeEmail(l.email) === targetEmail);
    const emailInCustomers = this.state.customers.some((c) => normalizeEmail(c.email) === targetEmail);
    const duplicateEmail = Boolean(targetEmail && (emailInWaitlist || emailInCustomers));

    const phoneInWaitlist = this.state.waitlistLeads.some((l) => getStandardPhoneKey(l.phone) === targetPhoneKey);
    const phoneInCustomers = this.state.customers.some((c) => getStandardPhoneKey(c.phone) === targetPhoneKey);
    const duplicatePhone = Boolean(targetPhoneKey && (phoneInWaitlist || phoneInCustomers));

    let message: string | undefined;
    if (duplicateEmail && duplicatePhone) {
      message = 'Both this email and phone number are already registered on our list!';
    } else if (duplicateEmail) {
      message = `The email ${email} is already registered on our list. You are already reserved!`;
    } else if (duplicatePhone) {
      message = `The phone number ${phone} is already registered. Each member can register once.`;
    }

    return { duplicateEmail, duplicatePhone, message };
  }

  /**
   * Submits a waitlist entry to the central persistent database
   */
  public async joinWaitlist(leadData: {
    name: string;
    email: string;
    phone: string;
    workplace: string;
    addressFloor: string;
    memberCode?: string;
  }): Promise<{ success: boolean; lead?: WaitlistLead; error?: string; message?: string; existingLead?: WaitlistLead }> {
    try {
      const res = await fetch(apiUrl('/api/waitlist'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });

      const json = await safeParseJson(res);
      if (res.ok && json?.lead) {
        // Optimistic local state update
        this.state.waitlistLeads = [json.lead, ...this.state.waitlistLeads.filter((l) => l.id !== json.lead.id)];
        if (json.stats) this.state.stats = json.stats;
        this.notify();
        return {
          success: true,
          lead: json.lead,
        };
      }

      if (json && !res.ok) {
        return {
          success: false,
          error: json.error || 'REGISTRATION_FAILED',
          message: json.message || 'Unable to complete waitlist reservation.',
          existingLead: json.existingLead,
        };
      }
    } catch (e: any) {
      console.warn('[LiveSync] Network joinWaitlist error, using local fallback:', e);
    }

    // Graceful fallback so user is NEVER blocked by network/JSON errors
    const fallbackLead: WaitlistLead = {
      id: `wl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: leadData.name.trim(),
      email: leadData.email.trim().toLowerCase(),
      phone: leadData.phone.trim(),
      workplace: leadData.workplace.trim() || 'Workplace',
      addressFloor: leadData.addressFloor.trim() || 'Floor Location',
      createdAt: new Date().toISOString(),
      status: 'Waitlisted',
      memberCode: leadData.memberCode || `DD-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    this.state.waitlistLeads = [fallbackLead, ...this.state.waitlistLeads];
    this.state.stats = {
      ...this.state.stats,
      waitlistCount: this.state.waitlistLeads.length,
      totalReserved: this.state.waitlistLeads.length + this.state.customers.length,
    };
    this.notify();

    return {
      success: true,
      lead: fallbackLead,
    };
  }

  /**
   * Submits a new customer subscription to the central persistent database
   */
  public async registerCustomer(customer: CustomerRecord): Promise<{
    success: boolean;
    customer?: CustomerRecord;
    error?: string;
    message?: string;
  }> {
    try {
      const res = await fetch(apiUrl('/api/customers'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });

      const json = await safeParseJson(res);
      if (res.ok && json?.customer) {
        this.state.customers = [json.customer, ...this.state.customers.filter((c) => c.id !== json.customer.id)];
        if (json.stats) this.state.stats = json.stats;
        this.notify();
        return {
          success: true,
          customer: json.customer,
        };
      }

      if (json && !res.ok) {
        return {
          success: false,
          error: json.error || 'REGISTRATION_FAILED',
          message: json.message || 'Unable to register subscriber.',
        };
      }
    } catch (e: any) {
      console.warn('[LiveSync] Network registerCustomer error, using local fallback:', e);
    }

    // Fallback registration
    this.state.customers = [customer, ...this.state.customers.filter((c) => c.id !== customer.id)];
    this.state.stats = {
      ...this.state.stats,
      confirmedSubscribersCount: this.state.customers.length,
      totalReserved: this.state.waitlistLeads.length + this.state.customers.length,
    };
    this.notify();

    return {
      success: true,
      customer,
    };
  }

  /**
   * Adds a testimonial
   */
  public async addTestimonial(item: Omit<TestimonialItem, 'id'>): Promise<TestimonialItem> {
    try {
      const res = await fetch(apiUrl('/api/testimonials'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const json = await safeParseJson(res);
      if (res.ok && json) {
        this.state.testimonials = [json, ...this.state.testimonials.filter((t) => t.id !== json.id)];
        this.notify();
        return json;
      }
    } catch (e) {
      console.warn('[LiveSync] addTestimonial network failed:', e);
    }

    const fallback: TestimonialItem = {
      ...item,
      id: `test-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      rating: item.rating || 5,
      featured: item.featured ?? true,
      date: item.date || new Date().toISOString().split('T')[0],
    };
    this.state.testimonials = [fallback, ...this.state.testimonials];
    this.notify();
    return fallback;
  }

  /**
   * Updates a testimonial
   */
  public async updateTestimonial(id: string, patch: Partial<TestimonialItem>): Promise<TestimonialItem | null> {
    try {
      const res = await fetch(apiUrl(`/api/testimonials/${encodeURIComponent(id)}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = await safeParseJson(res);
      if (res.ok && json) {
        this.state.testimonials = this.state.testimonials.map((t) => (t.id === id ? json : t));
        this.notify();
        return json;
      }
    } catch (e) {
      console.warn('[LiveSync] updateTestimonial network failed:', e);
    }

    const existing = this.state.testimonials.find((t) => t.id === id);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    this.state.testimonials = this.state.testimonials.map((t) => (t.id === id ? updated : t));
    this.notify();
    return updated;
  }

  /**
   * Deletes a testimonial
   */
  public async deleteTestimonial(id: string): Promise<boolean> {
    try {
      const res = await fetch(apiUrl(`/api/testimonials/${encodeURIComponent(id)}`), {
        method: 'DELETE',
      });
      if (res.ok) {
        this.state.testimonials = this.state.testimonials.filter((t) => t.id !== id);
        this.notify();
        return true;
      }
    } catch (e) {
      console.warn('[LiveSync] deleteTestimonial network failed:', e);
    }

    this.state.testimonials = this.state.testimonials.filter((t) => t.id !== id);
    this.notify();
    return true;
  }

  /**
   * Updates an existing customer record
   */
  public async updateCustomer(id: string, patch: Partial<CustomerRecord>): Promise<CustomerRecord | null> {
    try {
      const res = await fetch(apiUrl(`/api/customers/${encodeURIComponent(id)}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const updated = await safeParseJson(res);
      if (res.ok && updated) {
        this.state.customers = this.state.customers.map((c) => (c.id === id ? updated : c));
        this.notify();
        return updated;
      }
    } catch (e) {
      console.error('[LiveSync] updateCustomer error:', e);
    }
    return null;
  }

  /**
   * Registers a callback for real-time customer deletion across all devices
   */
  public onCustomerDeleted(listener: (id: string, email?: string) => void): () => void {
    this.customerDeletedListeners.add(listener);
    return () => {
      this.customerDeletedListeners.delete(listener);
    };
  }

  /**
   * Registers a callback for real-time customer updates across all devices (e.g. password changes)
   */
  public onCustomerUpdated(listener: (customer: CustomerRecord) => void): () => void {
    this.customerUpdatedListeners.add(listener);
    return () => {
      this.customerUpdatedListeners.delete(listener);
    };
  }

  /**
   * Completely removes a customer from central database and broadcasts across all devices
   */
  public async deleteCustomer(id: string, email?: string): Promise<boolean> {
    const cleanEmail = (email || '').toLowerCase().trim();
    try {
      const url = cleanEmail
        ? apiUrl(`/api/customers/${encodeURIComponent(id)}?email=${encodeURIComponent(cleanEmail)}`)
        : apiUrl(`/api/customers/${encodeURIComponent(id)}`);
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      if (res.ok) {
        this.state.customers = this.state.customers.filter((c) => {
          if (c.id === id) return false;
          if (cleanEmail && c.email && c.email.toLowerCase().trim() === cleanEmail) return false;
          return true;
        });
        if (cleanEmail) {
          this.state.waitlistLeads = this.state.waitlistLeads.filter(
            (l) => !l.email || l.email.toLowerCase().trim() !== cleanEmail
          );
        }
        this.customerDeletedListeners.forEach((fn) => {
          try {
            fn(id, cleanEmail);
          } catch {}
        });
        this.notify();
        return true;
      }
    } catch (e) {
      console.error('[LiveSync] deleteCustomer error:', e);
    }

    // Graceful local fallback
    this.state.customers = this.state.customers.filter((c) => {
      if (c.id === id) return false;
      if (cleanEmail && c.email && c.email.toLowerCase().trim() === cleanEmail) return false;
      return true;
    });
    if (cleanEmail) {
      this.state.waitlistLeads = this.state.waitlistLeads.filter(
        (l) => !l.email || l.email.toLowerCase().trim() !== cleanEmail
      );
    }
    this.customerDeletedListeners.forEach((fn) => {
      try {
        fn(id, cleanEmail);
      } catch {}
    });
    this.notify();
    return true;
  }

  /**
   * Completely removes a waitlist lead from central database and broadcasts across all devices
   */
  public async deleteWaitlistLead(id: string): Promise<boolean> {
    try {
      const res = await fetch(apiUrl(`/api/waitlist/${encodeURIComponent(id)}`), {
        method: 'DELETE',
      });
      if (res.ok) {
        this.state.waitlistLeads = this.state.waitlistLeads.filter((l) => l.id !== id);
        this.notify();
        return true;
      }
    } catch (e) {
      console.warn('[LiveSync] deleteWaitlistLead network notice:', e);
    }
    // Optimistic local state update
    this.state.waitlistLeads = this.state.waitlistLeads.filter((l) => l.id !== id);
    this.notify();
    return true;
  }

  /**
   * Updates tiered pricing settings on backend and notifies all devices
   */
  public async updatePricingSettings(settings: Partial<PricingSettings>): Promise<PricingSettings | null> {
    try {
      const res = await fetch(apiUrl('/api/pricing-settings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await safeParseJson(res);
      if (res.ok && data?.pricingSettings) {
        updatePricingSettingsLocal(data.pricingSettings);
        return data.pricingSettings;
      }
    } catch (e) {
      console.warn('[LiveSync] updatePricingSettings error:', e);
    }
    return updatePricingSettingsLocal(settings);
  }

  /**
   * Updates an existing waitlist lead
   */
  public async updateWaitlistLead(id: string, patch: Partial<WaitlistLead>): Promise<WaitlistLead | null> {
    try {
      const res = await fetch(apiUrl(`/api/waitlist/${encodeURIComponent(id)}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const updated = await safeParseJson(res);
      if (res.ok && updated) {
        this.state.waitlistLeads = this.state.waitlistLeads.map((l) => (l.id === id ? updated : l));
        this.notify();
        return updated;
      }
    } catch (e) {
      console.error('[LiveSync] updateWaitlistLead error:', e);
    }
    return null;
  }

  /**
   * Submits an order (e.g. top-up or checkout)
   */
  public async submitOrder(order: OrderSubmission): Promise<OrderSubmission | null> {
    try {
      const res = await fetch(apiUrl('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      const submitted = await safeParseJson(res);
      if (res.ok && submitted) {
        this.state.submittedOrders = [submitted, ...this.state.submittedOrders.filter((o) => o.id !== submitted.id)];
        this.notify();
        return submitted;
      }
    } catch (e) {
      console.warn('[LiveSync] Network submitOrder notice, using local fallback:', e);
    }

    // Graceful fallback: maintain local state
    this.state.submittedOrders = [order, ...this.state.submittedOrders.filter((o) => o.id !== order.id)];
    this.notify();
    return order;
  }

  /**
   * Confirms payment for an order
   */
  public async confirmOrderPayment(orderId: string): Promise<boolean> {
    try {
      const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(orderId)}/confirm-payment`), {
        method: 'POST',
      });
      const data = await safeParseJson(res);
      if (res.ok && data) {
        if (data.order) {
          this.state.submittedOrders = this.state.submittedOrders.map((o) =>
            o.id === data.order.id ? data.order : o
          );
        }
        if (data.customer) {
          this.state.customers = this.state.customers.map((c) =>
            c.id === data.customer.id ? data.customer : c
          );
        }
        this.notify();
        return true;
      }
    } catch (e) {
      console.error('[LiveSync] confirmOrderPayment error:', e);
    }
    return false;
  }

  /**
   * Completely removes an order submission/invoice from central database and broadcasts across all devices
   */
  public async deleteOrder(id: string): Promise<boolean> {
    try {
      const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(id)}`), {
        method: 'DELETE',
      });
      if (res.ok) {
        this.state.submittedOrders = this.state.submittedOrders.filter((o) => o.id !== id);
        this.notify();
        return true;
      }
    } catch (e) {
      console.warn('[LiveSync] Network deleteOrder error, falling back locally:', e);
    }

    this.state.submittedOrders = this.state.submittedOrders.filter((o) => o.id !== id);
    this.notify();
    return true;
  }

  /**
   * Returns current launch settings
   */
  public getLaunchSettings(): LaunchSettings {
    return this.state.launchSettings || getLaunchSettings();
  }

  /**
   * Updates launch settings, broadcasts to all clients, and persists
   */
  public async updateLaunchSettings(settings: Partial<LaunchSettings>): Promise<LaunchSettings> {
    updateLaunchConfig(settings);
    this.state.launchSettings = getLaunchSettings();
    this.notify();

    try {
      const res = await fetch(apiUrl('/api/launch-settings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await safeParseJson(res);
        if (data?.launchSettings) {
          this.state.launchSettings = data.launchSettings;
          updateLaunchConfig(data.launchSettings);
          this.notify();
          return data.launchSettings;
        }
      }
    } catch (e) {
      console.warn('[LiveSync] updateLaunchSettings network error:', e);
    }

    return this.state.launchSettings;
  }

  /**
   * Records a credit redemption order and broadcasts across all devices
   */
  public async addCreditRedemption(redemption: CreditRedemptionOrder): Promise<CreditRedemptionOrder> {
    try {
      const res = await fetch(apiUrl('/api/credit-redemptions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(redemption),
      });
      const data = await safeParseJson(res);
      if (res.ok && data) {
        this.state.creditRedemptions = [data, ...this.state.creditRedemptions.filter((r) => r.id !== data.id)];
        this.notify();
        return data;
      }
    } catch (e) {
      console.warn('[LiveSync] Network addCreditRedemption notice:', e);
    }
    this.state.creditRedemptions = [redemption, ...this.state.creditRedemptions.filter((r) => r.id !== redemption.id)];
    try {
      localStorage.setItem('11to12_persistent_credit_redemptions_v1', JSON.stringify(this.state.creditRedemptions));
    } catch {}
    this.notify();
    return redemption;
  }

  /**
   * Subscribes to real-time session claim and release events broadcasted via SSE
   */
  public onSessionEvent(listener: (event: { type: 'CLAIMED' | 'RELEASED'; session: any }) => void): () => void {
    this.sessionListeners.add(listener);
    return () => {
      this.sessionListeners.delete(listener);
    };
  }
}

export const liveSync = new LiveSyncService();

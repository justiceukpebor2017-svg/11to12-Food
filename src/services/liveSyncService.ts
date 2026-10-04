import { CustomerRecord, WaitlistLead, OrderSubmission, CreditRedemptionOrder, AdminAnnouncement, TestimonialItem } from '../types';
import { getStandardPhoneKey, normalizeEmail } from '../utils/phoneUtils';

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
  stats: PulseStats;
}

type SyncListener = (state: LiveSyncState) => void;

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
    stats: {
      waitlistCount: 0,
      confirmedSubscribersCount: 0,
      totalReserved: 0,
      updatedAt: new Date().toISOString(),
    },
  };

  private listeners: Set<SyncListener> = new Set();
  private eventSource: EventSource | null = null;
  private pollInterval: any = null;
  private isConnected = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    this.fetchBootstrap();
    this.connectSSE();

    // Fallback polling every 4 seconds to guarantee multi-device real-time sync
    this.pollInterval = setInterval(() => {
      this.fetchPulseAndSync();
    }, 4000);

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

      this.eventSource = new EventSource('/api/live-stream');

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
      this.state.waitlistLeads = data.db.waitlistLeads || [];
      this.state.customers = data.db.customers || [];
      this.state.submittedOrders = data.db.submittedOrders || [];
      this.state.creditRedemptions = data.db.creditRedemptions || [];
      this.state.announcements = data.db.announcements || [];
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
      if (!exists) {
        this.state.customers = [data.payload, ...this.state.customers];
      }
      // Also remove matching waitlist lead if converted
      const custEmail = normalizeEmail(data.payload.email);
      const custPhone = getStandardPhoneKey(data.payload.phone);
      this.state.waitlistLeads = this.state.waitlistLeads.filter(
        (l) => normalizeEmail(l.email) !== custEmail && getStandardPhoneKey(l.phone) !== custPhone
      );
    } else if (data.type === 'CUSTOMER_UPDATED' && data.payload) {
      this.state.customers = this.state.customers.map((c) =>
        c.id === data.payload.id ? data.payload : c
      );
    } else if (data.type === 'CUSTOMER_DELETED' && data.payload) {
      this.state.customers = this.state.customers.filter((c) => c.id !== data.payload.id);
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
    }

    this.notify();
  }

  public async fetchBootstrap(): Promise<LiveSyncState> {
    try {
      const res = await fetch('/api/bootstrap');
      if (res.ok) {
        const json = await safeParseJson(res);
        if (json?.db) {
          this.state.waitlistLeads = json.db.waitlistLeads || [];
          this.state.customers = json.db.customers || [];
          this.state.submittedOrders = json.db.submittedOrders || [];
          this.state.creditRedemptions = json.db.creditRedemptions || [];
          this.state.announcements = json.db.announcements || [];
          this.state.testimonials = json.db.testimonials || [];
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
      const res = await fetch('/api/pulse');
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
      const res = await fetch('/api/waitlist', {
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
      const res = await fetch('/api/customers', {
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
      const res = await fetch('/api/testimonials', {
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
      const res = await fetch(`/api/testimonials/${encodeURIComponent(id)}`, {
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
      const res = await fetch(`/api/testimonials/${encodeURIComponent(id)}`, {
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
      const res = await fetch(`/api/customers/${encodeURIComponent(id)}`, {
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
   * Completely removes a customer from central database and broadcasts across all devices
   */
  public async deleteCustomer(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/customers/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        this.state.customers = this.state.customers.filter((c) => c.id !== id);
        this.notify();
        return true;
      }
    } catch (e) {
      console.error('[LiveSync] deleteCustomer error:', e);
    }
    return false;
  }

  /**
   * Updates an existing waitlist lead
   */
  public async updateWaitlistLead(id: string, patch: Partial<WaitlistLead>): Promise<WaitlistLead | null> {
    try {
      const res = await fetch(`/api/waitlist/${encodeURIComponent(id)}`, {
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
      const res = await fetch('/api/orders', {
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
      console.error('[LiveSync] submitOrder error:', e);
    }
    return null;
  }

  /**
   * Confirms payment for an order
   */
  public async confirmOrderPayment(orderId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/confirm-payment`, {
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
}

export const liveSync = new LiveSyncService();

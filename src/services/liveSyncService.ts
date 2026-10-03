import { CustomerRecord, WaitlistLead, OrderSubmission, CreditRedemptionOrder, AdminAnnouncement } from '../types';
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
  stats: PulseStats;
}

type SyncListener = (state: LiveSyncState) => void;

class LiveSyncService {
  private state: LiveSyncState = {
    waitlistLeads: [],
    customers: [],
    submittedOrders: [],
    creditRedemptions: [],
    announcements: [],
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
        const json = await res.json();
        if (json.db) {
          this.state.waitlistLeads = json.db.waitlistLeads || [];
          this.state.customers = json.db.customers || [];
          this.state.submittedOrders = json.db.submittedOrders || [];
          this.state.creditRedemptions = json.db.creditRedemptions || [];
          this.state.announcements = json.db.announcements || [];
        }
        if (json.stats) {
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
        const stats: PulseStats = await res.json();
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

      const json = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: json.error || 'REGISTRATION_FAILED',
          message: json.message || 'Unable to complete waitlist reservation.',
          existingLead: json.existingLead,
        };
      }

      if (json.lead) {
        // Optimistic local state update
        this.state.waitlistLeads = [json.lead, ...this.state.waitlistLeads.filter((l) => l.id !== json.lead.id)];
        if (json.stats) this.state.stats = json.stats;
        this.notify();
      }

      return {
        success: true,
        lead: json.lead,
      };
    } catch (e: any) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: e?.message || 'Network error connecting to the 11 to 12 database.',
      };
    }
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

      const json = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: json.error || 'REGISTRATION_FAILED',
          message: json.message || 'Unable to register subscriber.',
        };
      }

      if (json.customer) {
        this.state.customers = [json.customer, ...this.state.customers.filter((c) => c.id !== json.customer.id)];
        if (json.stats) this.state.stats = json.stats;
        this.notify();
      }

      return {
        success: true,
        customer: json.customer,
      };
    } catch (e: any) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: e?.message || 'Network error connecting to the database.',
      };
    }
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
      if (res.ok) {
        const updated = await res.json();
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
      if (res.ok) {
        const updated = await res.json();
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
      if (res.ok) {
        const submitted = await res.json();
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
      if (res.ok) {
        const data = await res.json();
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

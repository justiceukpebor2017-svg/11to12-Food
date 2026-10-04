import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { CustomerRecord, WaitlistLead, OrderSubmission, CreditRedemptionOrder, AdminAnnouncement, TestimonialItem } from '../types';
import { getStandardPhoneKey, normalizeEmail } from '../utils/phoneUtils';

export interface LiveDatabaseSchema {
  waitlistLeads: WaitlistLead[];
  customers: CustomerRecord[];
  submittedOrders: OrderSubmission[];
  creditRedemptions: CreditRedemptionOrder[];
  announcements: AdminAnnouncement[];
  testimonials: TestimonialItem[];
}

const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'test-1',
    name: 'Briana Patton',
    role: 'Operations Lead',
    company: 'Paystack, Victoria Island',
    text: '11 to 12 revolutionized lunch for our product team. Piping hot Nigerian meals arrive at our desks by 11:30 AM without interrupting meetings.',
    officeLocation: 'Victoria Island',
    rating: 5,
    featured: true,
  },
  {
    id: 'test-2',
    name: 'Bilal Ahmed',
    role: 'Senior Software Engineer',
    company: 'Flutterwave, Ikoyi',
    text: 'Skipping days and swallow swaps make this the most flexible office meal setup in Lagos. Lunch is always ready when our sprint standup ends.',
    officeLocation: 'Ikoyi',
    rating: 5,
    featured: true,
  },
  {
    id: 'test-3',
    name: 'Saman Malik',
    role: 'Finance Associate',
    company: 'KPMG Nigeria',
    text: 'The desk drop logistics are flawless. No more waiting downstairs in long delivery lines or dealing with dispatch rider calls.',
    officeLocation: 'Victoria Island',
    rating: 5,
    featured: true,
  },
  {
    id: 'test-4',
    name: 'Omar Raza',
    role: 'Managing Director',
    company: 'Landmark Towers',
    text: 'Our entire floor switched to 11 to 12. Fresh ingredients, consistent quality every workday, and completely hassle-free.',
    officeLocation: 'Victoria Island',
    rating: 5,
    featured: true,
  },
  {
    id: 'test-5',
    name: 'Zainab Hussain',
    role: 'Product Manager',
    company: 'Sterling Bank Marina',
    text: 'The calendar system makes planning meals effortless. The Jollof Rice with grilled chicken is restaurant-grade every single delivery.',
    officeLocation: 'Marina',
    rating: 5,
    featured: true,
  },
  {
    id: 'test-6',
    name: 'Aliza Khan',
    role: 'People Operations Lead',
    company: 'Mulliner Towers',
    text: 'Team productivity jumped noticeably when nobody had to leave their desk or wonder what to eat for lunch. Highly recommended.',
    officeLocation: 'Ikoyi',
    rating: 5,
    featured: true,
  },
  {
    id: 'test-7',
    name: 'Farhan Siddiqui',
    role: 'Growth Director',
    company: 'Techstars Lagos',
    text: 'Exceptional service and packaging. The meals stay hot and fresh, and customer support via WhatsApp is immediate.',
    officeLocation: 'Victoria Island',
    rating: 5,
    featured: true,
  },
  {
    id: 'test-8',
    name: 'Sana Sheikh',
    role: 'Legal Counsel',
    company: 'Churchgate Tower',
    text: 'The transparent pricing and wallet rollover when I have court appearances or off-site meetings give me complete peace of mind.',
    officeLocation: 'Victoria Island',
    rating: 5,
    featured: true,
  },
  {
    id: 'test-9',
    name: 'Hassan Ali',
    role: 'Head of Operations',
    company: 'Eko Atlantic Hub',
    text: 'Best corporate lunch provider in Lagos. Every meal tastes like high-end home cooking, delivered like clockwork between 11 and 12.',
    officeLocation: 'Victoria Island',
    rating: 5,
    featured: true,
  },
];

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'live_database.json');

// Memory cache of the database
let dbState: LiveDatabaseSchema = {
  waitlistLeads: [],
  customers: [],
  submittedOrders: [],
  creditRedemptions: [],
  announcements: [],
  testimonials: [...DEFAULT_TESTIMONIALS],
};

// Connected SSE clients for instantaneous real-time push to all devices
const sseClients: Set<Response> = new Set();

/**
 * Initializes and hydrates the database from persistent disk storage.
 */
export function initLiveDatabase(): void {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      dbState = {
        waitlistLeads: Array.isArray(parsed.waitlistLeads) ? parsed.waitlistLeads : [],
        customers: Array.isArray(parsed.customers) ? parsed.customers : [],
        submittedOrders: Array.isArray(parsed.submittedOrders) ? parsed.submittedOrders : [],
        creditRedemptions: Array.isArray(parsed.creditRedemptions) ? parsed.creditRedemptions : [],
        announcements: Array.isArray(parsed.announcements) ? parsed.announcements : [],
        testimonials: Array.isArray(parsed.testimonials) && parsed.testimonials.length > 0
          ? parsed.testimonials
          : [...DEFAULT_TESTIMONIALS],
      };
      console.log(`[LiveDB] Loaded ${dbState.waitlistLeads.length} waitlist leads, ${dbState.customers.length} customers from disk.`);
    } else {
      saveLiveDatabase();
      console.log('[LiveDB] Initialized fresh persistent database at', DB_FILE_PATH);
    }
  } catch (error) {
    console.error('[LiveDB] Error loading database from disk:', error);
  }
}

/**
 * Persists current database state to disk safely.
 */
export function saveLiveDatabase(): void {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempPath = `${DB_FILE_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(dbState, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_FILE_PATH);
  } catch (error) {
    console.error('[LiveDB] Error saving database to disk:', error);
  }
}

/**
 * Returns summary counts for the live counter pulse
 */
export function getPulseStats() {
  const waitlistCount = dbState.waitlistLeads.length;
  const confirmedSubscribersCount = dbState.customers.filter(
    (c) => c.status === 'Active' || c.paymentStatus === 'Paid'
  ).length;
  const totalReserved = waitlistCount + confirmedSubscribersCount;

  return {
    waitlistCount,
    confirmedSubscribersCount,
    totalReserved,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Broadcasts an event to all connected SSE clients (phones, laptops, tablets)
 */
export function broadcastLiveUpdate(type: string, payload?: any): void {
  const stats = getPulseStats();
  const eventMessage = `event: live-update\ndata: ${JSON.stringify({
    type,
    payload,
    stats,
    timestamp: Date.now(),
  })}\n\n`;

  for (const client of sseClients) {
    try {
      client.write(eventMessage);
    } catch {
      sseClients.delete(client);
    }
  }
}

/**
 * Registers an SSE client
 */
export function registerSSEClient(res: Response): void {
  sseClients.add(res);

  // Send immediate initial sync
  const initialPayload = `event: live-update\ndata: ${JSON.stringify({
    type: 'INITIAL_SYNC',
    stats: getPulseStats(),
    db: dbState,
    timestamp: Date.now(),
  })}\n\n`;
  res.write(initialPayload);
}

/**
 * Unregisters an SSE client
 */
export function unregisterSSEClient(res: Response): void {
  sseClients.delete(res);
}

/**
 * Gets full database state
 */
export function getDatabaseState(): LiveDatabaseSchema {
  return dbState;
}

/**
 * Duplicate check helpers
 */
export function findDuplicateInWaitlist(email: string, phone: string): { duplicateEmail: boolean; duplicatePhone: boolean; existingLead?: WaitlistLead } {
  const targetEmail = normalizeEmail(email);
  const targetPhoneKey = getStandardPhoneKey(phone);

  const matchedEmailLead = dbState.waitlistLeads.find((l) => normalizeEmail(l.email) === targetEmail);
  const matchedPhoneLead = dbState.waitlistLeads.find((l) => getStandardPhoneKey(l.phone) === targetPhoneKey);

  return {
    duplicateEmail: Boolean(targetEmail && matchedEmailLead),
    duplicatePhone: Boolean(targetPhoneKey && matchedPhoneLead),
    existingLead: matchedEmailLead || matchedPhoneLead,
  };
}

export function findDuplicateInCustomers(email: string, phone: string): { duplicateEmail: boolean; duplicatePhone: boolean; existingCustomer?: CustomerRecord } {
  const targetEmail = normalizeEmail(email);
  const targetPhoneKey = getStandardPhoneKey(phone);

  const matchedEmailCustomer = dbState.customers.find((c) => normalizeEmail(c.email) === targetEmail);
  const matchedPhoneCustomer = dbState.customers.find((c) => getStandardPhoneKey(c.phone) === targetPhoneKey);

  return {
    duplicateEmail: Boolean(targetEmail && matchedEmailCustomer),
    duplicatePhone: Boolean(targetPhoneKey && matchedPhoneCustomer),
    existingCustomer: matchedEmailCustomer || matchedPhoneCustomer,
  };
}

/**
 * Adds a new Waitlist lead with strict email & phone duplicate prevention
 */
export function addWaitlistLead(leadData: Omit<WaitlistLead, 'id' | 'createdAt' | 'status'> & { memberCode?: string }): {
  success: boolean;
  lead?: WaitlistLead;
  error?: 'DUPLICATE_EMAIL' | 'DUPLICATE_PHONE' | 'INVALID_DATA';
  message?: string;
  existingLead?: WaitlistLead;
} {
  const email = normalizeEmail(leadData.email);
  const phoneKey = getStandardPhoneKey(leadData.phone);

  if (!leadData.name || !email || !phoneKey) {
    return {
      success: false,
      error: 'INVALID_DATA',
      message: 'Name, email address, and phone number are all required.',
    };
  }

  // 1. Check if email is already in customers
  const custDup = findDuplicateInCustomers(email, leadData.phone);
  if (custDup.duplicateEmail) {
    return {
      success: false,
      error: 'DUPLICATE_EMAIL',
      message: `The email ${email} is already registered as an active office subscriber!`,
    };
  }
  if (custDup.duplicatePhone) {
    return {
      success: false,
      error: 'DUPLICATE_PHONE',
      message: `The phone number ${leadData.phone} is already registered to an active subscriber account!`,
    };
  }

  // 2. Check if email or phone is already on waitlist
  const waitlistDup = findDuplicateInWaitlist(email, leadData.phone);
  if (waitlistDup.duplicateEmail) {
    return {
      success: false,
      error: 'DUPLICATE_EMAIL',
      message: `The email ${email} is already on the waitlist! Member code: ${waitlistDup.existingLead?.memberCode || 'Active'}.`,
      existingLead: waitlistDup.existingLead,
    };
  }
  if (waitlistDup.duplicatePhone) {
    return {
      success: false,
      error: 'DUPLICATE_PHONE',
      message: `The phone number ${leadData.phone} is already registered on our waitlist. Each member can register once.`,
      existingLead: waitlistDup.existingLead,
    };
  }

  const newLead: WaitlistLead = {
    id: `wl-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    name: leadData.name.trim(),
    email: email,
    phone: leadData.phone.trim(),
    workplace: leadData.workplace?.trim() || 'Workplace / Office Building',
    addressFloor: leadData.addressFloor?.trim() || 'Floor & Suite Location',
    createdAt: new Date().toISOString(),
    status: 'Waitlisted',
    memberCode: leadData.memberCode || `DD-${Math.floor(10000 + Math.random() * 90000)}`,
    notes: leadData.notes || '',
  };

  dbState.waitlistLeads.unshift(newLead);
  saveLiveDatabase();
  broadcastLiveUpdate('WAITLIST_JOINED', newLead);

  return {
    success: true,
    lead: newLead,
  };
}

/**
 * Updates a waitlist lead
 */
export function updateWaitlistLead(id: string, patch: Partial<WaitlistLead>): WaitlistLead | null {
  const index = dbState.waitlistLeads.findIndex((l) => l.id === id);
  if (index === -1) return null;

  dbState.waitlistLeads[index] = {
    ...dbState.waitlistLeads[index],
    ...patch,
  };

  saveLiveDatabase();
  broadcastLiveUpdate('WAITLIST_UPDATED', dbState.waitlistLeads[index]);
  return dbState.waitlistLeads[index];
}

/**
 * Deletes a waitlist lead
 */
export function deleteWaitlistLead(id: string): boolean {
  const initialLength = dbState.waitlistLeads.length;
  dbState.waitlistLeads = dbState.waitlistLeads.filter((l) => l.id !== id);
  if (dbState.waitlistLeads.length !== initialLength) {
    saveLiveDatabase();
    broadcastLiveUpdate('WAITLIST_DELETED', { id });
    return true;
  }
  return false;
}

/**
 * Registers a new CustomerRecord (and auto-promotes/deduplicates from waitlist)
 */
export function addCustomerRecord(customer: CustomerRecord): {
  success: boolean;
  customer?: CustomerRecord;
  error?: 'DUPLICATE_EMAIL' | 'DUPLICATE_PHONE';
  message?: string;
} {
  const email = normalizeEmail(customer.email);
  const phoneKey = getStandardPhoneKey(customer.phone);

  // Check duplicate active customer
  const existingEmail = dbState.customers.find((c) => normalizeEmail(c.email) === email);
  if (existingEmail && existingEmail.id !== customer.id) {
    return {
      success: false,
      error: 'DUPLICATE_EMAIL',
      message: `An active subscription already exists for email ${email}.`,
    };
  }

  const existingPhone = dbState.customers.find((c) => getStandardPhoneKey(c.phone) === phoneKey);
  if (existingPhone && existingPhone.id !== customer.id) {
    return {
      success: false,
      error: 'DUPLICATE_PHONE',
      message: `An active subscription already exists with phone number ${customer.phone}.`,
    };
  }

  // Deduplicate waitlist: If user is on waitlist, remove them (since they are now an active subscriber)
  dbState.waitlistLeads = dbState.waitlistLeads.filter((l) => {
    const matchesEmail = normalizeEmail(l.email) === email;
    const matchesPhone = getStandardPhoneKey(l.phone) === phoneKey;
    const matchesCode = Boolean(customer.memberCode && l.memberCode && l.memberCode.toUpperCase() === customer.memberCode.toUpperCase());
    return !(matchesEmail || matchesPhone || matchesCode);
  });

  dbState.customers.unshift(customer);
  saveLiveDatabase();
  broadcastLiveUpdate('CUSTOMER_CREATED', customer);

  return {
    success: true,
    customer,
  };
}

/**
 * Updates a customer record
 */
export function updateCustomerRecord(id: string, patch: Partial<CustomerRecord>): CustomerRecord | null {
  const normId = id.trim().toLowerCase();
  const index = dbState.customers.findIndex(
    (c) => c.id === id || normalizeEmail(c.email) === normId || c.id.toLowerCase() === normId
  );
  if (index === -1) return null;

  dbState.customers[index] = {
    ...dbState.customers[index],
    ...patch,
  };

  saveLiveDatabase();
  broadcastLiveUpdate('CUSTOMER_UPDATED', dbState.customers[index]);
  return dbState.customers[index];
}

/**
 * Deletes a customer record completely from the database
 */
export function deleteCustomerRecord(id: string): boolean {
  const normId = id.trim().toLowerCase();
  const initialLength = dbState.customers.length;
  dbState.customers = dbState.customers.filter(
    (c) => c.id !== id && normalizeEmail(c.email) !== normId && c.id.toLowerCase() !== normId
  );
  if (dbState.customers.length < initialLength) {
    saveLiveDatabase();
    broadcastLiveUpdate('CUSTOMER_DELETED', { id });
    return true;
  }
  return false;
}

/**
 * Adds an order submission
 */
export function addOrderSubmission(order: OrderSubmission): OrderSubmission {
  dbState.submittedOrders.unshift(order);
  saveLiveDatabase();
  broadcastLiveUpdate('ORDER_SUBMITTED', order);
  return order;
}

/**
 * Confirms order payment
 */
export function confirmOrderPaymentInDb(orderId: string): { order?: OrderSubmission; customer?: CustomerRecord } | null {
  const orderIndex = dbState.submittedOrders.findIndex((o) => o.id === orderId);
  if (orderIndex === -1) return null;

  dbState.submittedOrders[orderIndex].paymentStatus = 'Confirmed';
  const order = dbState.submittedOrders[orderIndex];

  // Match corresponding customer
  const custIndex = dbState.customers.findIndex(
    (c) =>
      c.orderRef === orderId ||
      normalizeEmail(c.email) === normalizeEmail(order.email) ||
      (order.memberCode && c.memberCode === order.memberCode)
  );

  let updatedCustomer: CustomerRecord | undefined;
  if (custIndex !== -1) {
    const existing = dbState.customers[custIndex];
    const newSelectedDays = [...existing.selectedDays, ...order.selectedDays];
    dbState.customers[custIndex] = {
      ...existing,
      paymentStatus: 'Paid',
      totalDays: existing.totalDays + order.totalDays,
      selectedDays: newSelectedDays,
    };
    updatedCustomer = dbState.customers[custIndex];
  }

  saveLiveDatabase();
  broadcastLiveUpdate('ORDER_PAYMENT_CONFIRMED', { order, customer: updatedCustomer });
  return { order, customer: updatedCustomer };
}

/**
 * Adds a credit redemption order
 */
export function addCreditRedemptionInDb(redemption: CreditRedemptionOrder): CreditRedemptionOrder {
  dbState.creditRedemptions.unshift(redemption);
  saveLiveDatabase();
  broadcastLiveUpdate('CREDIT_REDEEMED', redemption);
  return redemption;
}

/**
 * Gets all testimonials
 */
export function getTestimonialsList(): TestimonialItem[] {
  return dbState.testimonials || [];
}

/**
 * Adds a new testimonial
 */
export function addTestimonialRecord(item: Omit<TestimonialItem, 'id'> & { id?: string }): TestimonialItem {
  const newTestimonial: TestimonialItem = {
    id: item.id || `test-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: item.name.trim(),
    role: item.role.trim(),
    company: item.company?.trim() || '',
    text: item.text.trim(),
    officeLocation: item.officeLocation?.trim() || 'Victoria Island',
    rating: item.rating || 5,
    featured: item.featured ?? true,
    date: item.date || new Date().toISOString().split('T')[0],
  };

  dbState.testimonials = [newTestimonial, ...(dbState.testimonials || [])];
  saveLiveDatabase();
  broadcastLiveUpdate('TESTIMONIALS_UPDATED', dbState.testimonials);
  return newTestimonial;
}

/**
 * Updates a testimonial
 */
export function updateTestimonialRecord(id: string, patch: Partial<TestimonialItem>): TestimonialItem | null {
  const index = (dbState.testimonials || []).findIndex((t) => t.id === id);
  if (index === -1) return null;

  dbState.testimonials[index] = {
    ...dbState.testimonials[index],
    ...patch,
  };
  saveLiveDatabase();
  broadcastLiveUpdate('TESTIMONIALS_UPDATED', dbState.testimonials);
  return dbState.testimonials[index];
}

/**
 * Deletes a testimonial
 */
export function deleteTestimonialRecord(id: string): boolean {
  const initialLength = (dbState.testimonials || []).length;
  dbState.testimonials = (dbState.testimonials || []).filter((t) => t.id !== id);
  if (dbState.testimonials.length < initialLength) {
    saveLiveDatabase();
    broadcastLiveUpdate('TESTIMONIALS_UPDATED', dbState.testimonials);
    return true;
  }
  return false;
}


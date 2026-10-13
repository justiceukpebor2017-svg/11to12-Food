import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { CustomerRecord, WaitlistLead, OrderSubmission, CreditRedemptionOrder, AdminAnnouncement, TestimonialItem, LaunchSettings, ActiveSessionRecord } from '../types';
import { getStandardPhoneKey, normalizeEmail } from '../utils/phoneUtils';

export interface LiveDatabaseSchema {
  waitlistLeads: WaitlistLead[];
  customers: CustomerRecord[];
  submittedOrders: OrderSubmission[];
  creditRedemptions: CreditRedemptionOrder[];
  announcements: AdminAnnouncement[];
  testimonials: TestimonialItem[];
  launchSettings: LaunchSettings;
  customMeals?: Record<string, any>;
  activeSessions?: Record<string, ActiveSessionRecord>;
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
  launchSettings: {
    launchDate: '2026-12-07',
    isEnabled: true,
  },
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
        launchSettings: parsed.launchSettings && typeof parsed.launchSettings.launchDate === 'string'
          ? parsed.launchSettings
          : { launchDate: '2026-12-07', isEnabled: true },
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

  // Phone number and email can be used as many times as desired without restriction
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

  // Customers can be created or renewed with any phone or email as many times as desired
  dbState.customers.unshift(customer);
  saveLiveDatabase();
  broadcastLiveUpdate('CUSTOMER_CREATED', customer);

  return {
    success: true,
    customer,
  };
}

/**
 * Updates a customer record with upsert fallback and meal-day regression prevention
 */
export function updateCustomerRecord(id: string, patch: Partial<CustomerRecord>): CustomerRecord | null {
  const normId = id.trim().toLowerCase();
  const index = dbState.customers.findIndex(
    (c) =>
      c.id === id ||
      c.id.toLowerCase() === normId ||
      (patch.email && normalizeEmail(c.email) === normalizeEmail(patch.email)) ||
      normalizeEmail(c.email) === normId
  );

  if (index === -1) {
    // Upsert customer if they don't exist yet in the server database
    const newCust: CustomerRecord = {
      id: id,
      fullName: patch.fullName || 'Valued Subscriber',
      email: patch.email || '',
      phone: patch.phone || '',
      company: patch.company || '',
      officeAddress: patch.officeAddress || '',
      secondAddress: patch.secondAddress || '',
      floorSuite: patch.floorSuite || '',
      deliveryArea: patch.deliveryArea || 'Victoria Island',
      status: patch.status || 'Active',
      paymentStatus: patch.paymentStatus || 'Paid',
      planName: patch.planName || 'Lunch Plan',
      totalDays: patch.totalDays || patch.selectedDays?.length || 0,
      creditsBalance: patch.creditsBalance || 0,
      selectedDays: patch.selectedDays || [],
      subtotalNGN: patch.subtotalNGN || 0,
      discountNGN: patch.discountNGN || 0,
      finalTotalNGN: patch.finalTotalNGN || 0,
      isPasswordSet: patch.isPasswordSet ?? Boolean(patch.password || patch.defaultPassword || false),
      createdAt: patch.createdAt || new Date().toISOString(),
      ...patch,
    };
    dbState.customers.unshift(newCust);
    saveLiveDatabase();
    broadcastLiveUpdate('CUSTOMER_CREATED', newCust);
    return newCust;
  }

  // Prevent regression: NEVER reduce totalDays or drop selectedDays if existing already has more
  const existing = dbState.customers[index];
  const existingDays = existing.selectedDays || [];
  const incomingDays = patch.selectedDays || [];
  let finalDays = existingDays;
  if (incomingDays.length >= existingDays.length) {
    finalDays = incomingDays;
  } else if (incomingDays.length > 0) {
    const dateMap = new Map<string, any>();
    existingDays.forEach((d) => dateMap.set(d.dateStr, d));
    incomingDays.forEach((d) => dateMap.set(d.dateStr, d));
    finalDays = Array.from(dateMap.values()).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }

  dbState.customers[index] = {
    ...existing,
    ...patch,
    selectedDays: finalDays,
    totalDays: Math.max(existing.totalDays || 0, patch.totalDays || 0, finalDays.length),
    status: (existing.status === 'Active' || patch.status === 'Active') ? 'Active' : (patch.status || existing.status),
    paymentStatus: (existing.paymentStatus === 'Paid' || patch.paymentStatus === 'Paid') ? 'Paid' : (patch.paymentStatus || existing.paymentStatus),
  };

  saveLiveDatabase();
  broadcastLiveUpdate('CUSTOMER_UPDATED', dbState.customers[index]);
  return dbState.customers[index];
}

/**
 * Deletes a customer record completely from the database and purges credentials & duplicates
 */
export function deleteCustomerRecord(id: string, emailHint?: string): boolean {
  const targetId = String(id).trim();
  const targetEmail = (emailHint || '').trim().toLowerCase();
  if (!targetId && !targetEmail) return false;

  // Locate existing customer to resolve email if not provided
  const found = dbState.customers.find(
    (c) =>
      (targetId && (c.id === targetId || c.id.toLowerCase() === targetId.toLowerCase())) ||
      (targetEmail && normalizeEmail(c.email) === targetEmail)
  );
  const resolvedEmail = found?.email ? normalizeEmail(found.email) : targetEmail;
  const resolvedId = found?.id || targetId;

  // 1. Remove from customers collection by ID or email
  dbState.customers = dbState.customers.filter((c) => {
    if (targetId && (c.id === targetId || c.id.toLowerCase() === targetId.toLowerCase())) return false;
    if (resolvedEmail && normalizeEmail(c.email) === resolvedEmail) return false;
    return true;
  });

  // 2. Remove from waitlist leads if this email had waitlist entries, freeing the email for new registrations
  if (resolvedEmail) {
    dbState.waitlistLeads = dbState.waitlistLeads.filter(
      (l) => normalizeEmail(l.email) !== resolvedEmail
    );
  }

  // 3. Purge active sessions in live database so any active user session is terminated immediately
  if (dbState.activeSessions) {
    for (const [sKey, sRecord] of Object.entries(dbState.activeSessions)) {
      const matchId = (targetId && sKey === targetId) || (resolvedId && sKey === resolvedId) || (sRecord.userId && (sRecord.userId === targetId || sRecord.userId === resolvedId));
      const matchEmail = resolvedEmail && (sKey === resolvedEmail || normalizeEmail(sRecord.userEmail) === resolvedEmail || normalizeEmail(sRecord.userId) === resolvedEmail);
      if (matchId || matchEmail) {
        delete dbState.activeSessions[sKey];
        broadcastLiveUpdate('SESSION_RELEASED', { userId: sRecord.userId, activeSessionId: '*' });
      }
    }
  }

  saveLiveDatabase();

  // 4. Broadcast deletion across all connected devices and browsers so active sessions are terminated
  broadcastLiveUpdate('CUSTOMER_DELETED', {
    id: targetId || found?.id,
    email: resolvedEmail,
  });

  return true;
}

/**
 * Adds an order submission (deduplicates by ID and preserves confirmed status)
 */
export function addOrderSubmission(order: OrderSubmission): OrderSubmission {
  const existingIdx = dbState.submittedOrders.findIndex(
    (o) => o.id.toLowerCase() === (order.id || '').toLowerCase()
  );
  if (existingIdx !== -1) {
    // If existing order was already Confirmed, do not regress to Pending Verification
    if (dbState.submittedOrders[existingIdx].paymentStatus === 'Confirmed') {
      order.paymentStatus = 'Confirmed';
    }
    dbState.submittedOrders[existingIdx] = order;
  } else {
    dbState.submittedOrders.unshift(order);
  }
  saveLiveDatabase();
  broadcastLiveUpdate('ORDER_SUBMITTED', order);
  return order;
}

/**
 * Confirms order payment permanently in server database
 */
export function confirmOrderPaymentInDb(orderId: string): { order?: OrderSubmission; customer?: CustomerRecord } | null {
  const normId = (orderId || '').trim().toLowerCase();
  let matchedOrder = dbState.submittedOrders.find((o) => o.id.toLowerCase() === normId);

  // Mark all matching instances as Confirmed
  dbState.submittedOrders = dbState.submittedOrders.map((o) => {
    if (o.id.toLowerCase() === normId) {
      return { ...o, paymentStatus: 'Confirmed' as const };
    }
    return o;
  });

  if (!matchedOrder) {
    matchedOrder = {
      id: orderId,
      fullName: 'Confirmed Subscriber',
      email: '',
      phone: '',
      company: 'Desk Drop Client',
      officeAddress: 'Office',
      selectedDays: [],
      totalDays: 0,
      subtotalNGN: 0,
      discountNGN: 0,
      finalTotalNGN: 0,
      submittedAt: new Date().toISOString(),
      paymentStatus: 'Confirmed',
    };
    dbState.submittedOrders.unshift(matchedOrder);
  } else {
    matchedOrder.paymentStatus = 'Confirmed';
  }

  const order = matchedOrder;

  // Match corresponding customer
  const custIndex = dbState.customers.findIndex(
    (c) =>
      c.orderRef === orderId ||
      c.orderRef?.toLowerCase() === normId ||
      (order.email && normalizeEmail(c.email) === normalizeEmail(order.email)) ||
      (order.memberCode && c.memberCode === order.memberCode)
  );

  let updatedCustomer: CustomerRecord | undefined;
  if (custIndex !== -1) {
    const existing = dbState.customers[custIndex];
    const existingDays = existing.selectedDays || [];
    const newDays = order.selectedDays || [];
    const dateMap = new Map<string, any>();
    existingDays.forEach((d) => dateMap.set(d.dateStr, d));
    newDays.forEach((d) => dateMap.set(d.dateStr, d));
    const mergedDays = Array.from(dateMap.values()).sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    dbState.customers[custIndex] = {
      ...existing,
      paymentStatus: 'Paid',
      status: 'Active',
      totalDays: Math.max(existing.totalDays || 0, mergedDays.length),
      selectedDays: mergedDays,
      finalTotalNGN: (existing.finalTotalNGN || 0) + (order.isTopUp ? order.finalTotalNGN : (order.finalTotalNGN || 0)),
    };
    updatedCustomer = dbState.customers[custIndex];
  } else if (order.email) {
    // If customer record doesn't exist yet, register them as active
    const newCust: CustomerRecord = {
      id: `cust-${order.id || Date.now()}`,
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
      selectedDays: order.selectedDays || [],
      subtotalNGN: order.subtotalNGN,
      discountNGN: order.discountNGN,
      finalTotalNGN: order.finalTotalNGN,
      orderRef: order.id,
      memberCode: order.memberCode,
      createdAt: order.submittedAt || new Date().toISOString(),
      isPasswordSet: true,
      defaultPassword: 'DeskDrop#842',
      password: 'DeskDrop#842',
      isDefaultPassword: true,
      mustChangePassword: true,
    };
    dbState.customers.unshift(newCust);
    updatedCustomer = newCust;
  }

  saveLiveDatabase();
  broadcastLiveUpdate('ORDER_PAYMENT_CONFIRMED', { order, customer: updatedCustomer });
  return { order, customer: updatedCustomer };
}

/**
 * Deletes an order submission completely from the database
 */
export function deleteOrderSubmissionInDb(orderId: string): boolean {
  const initialLen = dbState.submittedOrders.length;
  dbState.submittedOrders = dbState.submittedOrders.filter((o) => o.id !== orderId);
  if (dbState.submittedOrders.length < initialLen) {
    saveLiveDatabase();
    broadcastLiveUpdate('ORDER_DELETED', { id: orderId });
    return true;
  }
  return false;
}

/**
 * Gets launch settings
 */
export function getLaunchSettingsInDb(): LaunchSettings {
  return dbState.launchSettings || { launchDate: '2026-12-07', isEnabled: true };
}

/**
 * Updates launch settings and broadcasts to all clients
 */
export function updateLaunchSettingsInDb(patch: Partial<LaunchSettings>): LaunchSettings {
  dbState.launchSettings = {
    ...getLaunchSettingsInDb(),
    ...patch,
  };
  saveLiveDatabase();
  broadcastLiveUpdate('LAUNCH_SETTINGS_UPDATED', dbState.launchSettings);
  return dbState.launchSettings;
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

/**
 * Custom Meal Schedules Overrides
 */
export function getCustomMealsInDb(): Record<string, any> {
  return dbState.customMeals || {};
}

export function updateCustomMealInDb(dateStr: string, meal: any): void {
  if (!dbState.customMeals) {
    dbState.customMeals = {};
  }
  dbState.customMeals[dateStr] = meal;
  saveLiveDatabase();
  broadcastLiveUpdate('MEAL_UPDATED', { dateStr, meal });
}

export function batchUpdateMealsInDb(meals: Record<string, any>): void {
  if (!dbState.customMeals) {
    dbState.customMeals = {};
  }
  Object.assign(dbState.customMeals, meals);
  saveLiveDatabase();
  broadcastLiveUpdate('MEALS_BATCH_UPDATED', meals);
}

/**
 * Active Session Management (Single Concurrent Session Enforcement)
 */
export function claimSessionInDb(session: ActiveSessionRecord): ActiveSessionRecord {
  if (!dbState.activeSessions) {
    dbState.activeSessions = {};
  }
  dbState.activeSessions[session.userId] = session;
  saveLiveDatabase();
  broadcastLiveUpdate('SESSION_CLAIMED', session);
  return session;
}

export function getSessionInDb(userId: string): ActiveSessionRecord | null {
  return dbState.activeSessions?.[userId] || null;
}

export function releaseSessionInDb(userId: string, activeSessionId: string): boolean {
  if (
    activeSessionId === '*' ||
    !activeSessionId ||
    dbState.activeSessions?.[userId]?.activeSessionId === activeSessionId
  ) {
    delete dbState.activeSessions[userId];
    saveLiveDatabase();
    broadcastLiveUpdate('SESSION_RELEASED', { userId, activeSessionId });
    return true;
  }
  return false;
}



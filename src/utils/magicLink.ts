import { CustomerRecord, SelectedLunchDay } from '../types';
import { getStructuredMealForDate } from '../data/menuRotation';
import { LAUNCH_CONFIG, getLaunchDate } from '../config/launchConfig';

export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return 'https://11to12.food';
}

export function generateMagicLinkUrl(token: string, email: string): string {
  const base = getAppBaseUrl();
  return `${base}/activate?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email.trim())}`;
}

export interface ParsedMagicLink {
  isActivateRoute: boolean;
  token: string | null;
  email: string | null;
}

export function parseMagicLinkFromUrl(): ParsedMagicLink {
  if (typeof window === 'undefined') {
    return { isActivateRoute: false, token: null, email: null };
  }

  try {
    const pathname = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;

    // Check search params first
    const searchParams = new URLSearchParams(search);
    let token = searchParams.get('token');
    let email = searchParams.get('email');

    // Also check hash in case router or preview uses hash query strings (e.g. #/activate?token=...)
    if (!token && hash.includes('token=')) {
      const hashQuery = hash.includes('?') ? hash.split('?')[1] : hash.replace(/^#\/?/, '');
      const hashParams = new URLSearchParams(hashQuery);
      token = hashParams.get('token') || token;
      email = hashParams.get('email') || email;
    }

    const isActivateRoute =
      pathname.includes('/activate') ||
      pathname.endsWith('/activate') ||
      hash.includes('activate') ||
      Boolean(token && email);

    return {
      isActivateRoute,
      token,
      email: email ? decodeURIComponent(email).trim() : null,
    };
  } catch (e) {
    console.error('Failed to parse URL for magic link', e);
    return { isActivateRoute: false, token: null, email: null };
  }
}

// Helper to build 20 workdays starting from the official launch date
export function buildSubscriberDaysForLaunch(
  startDate: Date = getLaunchDate(),
  totalCount = 20,
  swallowDefault: 'Semo' | 'Eba' | 'Fufu' = 'Semo'
): SelectedLunchDay[] {
  const result: SelectedLunchDay[] = [];
  const cur = new Date(startDate);
  
  // Safeguard: make sure we start on workdays
  while (result.length < totalCount) {
    const dayOfWeek = cur.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const meal = getStructuredMealForDate(cur);
      if (meal && !meal.isHoliday && !meal.isNoDelivery) {
        const yyyy = cur.getFullYear();
        const mm = String(cur.getMonth() + 1).padStart(2, '0');
        const dd = String(cur.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        result.push({
          dateStr,
          meal,
          selectedSwallow: dayOfWeek === 5 ? swallowDefault : undefined,
        });
      }
    }
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

// Helper to create or hydrate a customer record from a magic link if not found in local storage
export function createHydratedCustomerFromMagicLink(email: string, token: string): CustomerRecord {
  const cleanEmail = email.trim();
  const namePart = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : 'Corporate Subscriber';
  const fullName = namePart
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const selectedDays = buildSubscriberDaysForLaunch(getLaunchDate(), 20, 'Semo');

  return {
    id: `cust-${Date.now()}`,
    fullName,
    email: cleanEmail,
    phone: '08026180680',
    company: 'Victoria Island Corporate Office',
    officeAddress: 'Victoria Island, Lagos',
    floorSuite: 'Floor 4, Desk Drop',
    deliveryArea: 'Victoria Island',
    notes: 'Registered via official Desk Drop magic link',
    status: 'Active',
    paymentStatus: 'Paid',
    planName: '20 Workday Corporate Lunch Plan',
    totalDays: 20,
    remainingMeals: 20,
    creditsBalance: 0,
    selectedDays,
    subtotalNGN: 110000,
    discountNGN: 5500,
    finalTotalNGN: 104500,
    orderRef: `ORD-${(token || 'ACTIVE').slice(0, 6).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    magicLinkToken: token,
    magicLinkUrl: generateMagicLinkUrl(token, cleanEmail),
    isPasswordSet: false,
  };
}

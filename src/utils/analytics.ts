/**
 * Google Analytics (GA4) Integration Utility for 11 to 12
 * Handles gtag.js initialization, pageview tracking, and business conversion events.
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const GA_STORAGE_KEY = '11to12_ga_measurement_id';
const DEFAULT_MEASUREMENT_ID = 'G-V5D8ZC0E8Z';

/**
 * Get current Google Analytics Measurement ID
 * Priority: localStorage override -> Environment variable -> Default placeholder
 */
export function getMeasurementId(): string {
  if (typeof window === 'undefined') return DEFAULT_MEASUREMENT_ID;
  try {
    const saved = localStorage.getItem(GA_STORAGE_KEY);
    if (saved && saved.trim().startsWith('G-')) return saved.trim();
  } catch {}

  const envId = ((import.meta as any).env?.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim();
  if (envId && envId.startsWith('G-')) return envId;

  return DEFAULT_MEASUREMENT_ID;
}

/**
 * Update the Google Analytics Measurement ID in localStorage
 */
export function setMeasurementId(newId: string): void {
  if (typeof window === 'undefined') return;
  const clean = newId.trim();
  try {
    if (clean) {
      localStorage.setItem(GA_STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(GA_STORAGE_KEY);
    }
  } catch {}
  initGoogleAnalytics(clean || getMeasurementId());
}

let isInitialized = false;

/**
 * Initialize Google Analytics (gtag.js)
 */
export function initGoogleAnalytics(customId?: string): void {
  if (typeof window === 'undefined') return;

  const measurementId = customId || getMeasurementId();
  if (!measurementId) return;

  // Ensure dataLayer & gtag function exist
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      window.dataLayer.push(arguments);
    };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false, // We control pageviews explicitly for SPA tabs
    anonymize_ip: true,
  });

  // Inject script tag if not already on the page
  const existingScript = document.getElementById('ga-gtag-script');
  if (!existingScript) {
    const script = document.createElement('script');
    script.id = 'ga-gtag-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  } else if (customId) {
    (existingScript as HTMLScriptElement).src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  }

  isInitialized = true;
}

/**
 * Track Page Views (SPA Route / View Mode changes)
 */
export function trackPageView(pageTitle: string, pagePath: string = window.location.pathname): void {
  if (typeof window === 'undefined') return;
  if (!isInitialized) initGoogleAnalytics();

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_title: pageTitle,
        page_location: window.location.href,
        page_path: pagePath,
      });
    }
  } catch (err) {
    console.debug('[GA] trackPageView notice:', err);
  }
}

/**
 * Track Custom Google Analytics Event
 */
export function trackEvent(
  eventName: string,
  params: Record<string, any> = {}
): void {
  if (typeof window === 'undefined') return;
  if (!isInitialized) initGoogleAnalytics();

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  } catch (err) {
    console.debug('[GA] trackEvent notice:', err);
  }
}

// -------------------------------------------------------------
// Pre-built Conversion & Funnel Tracking Events for 11 to 12
// -------------------------------------------------------------

/**
 * 1. Waitlist Lead Submission (Reserve Your Desk Drop)
 */
export function trackWaitlistJoined(lead: { name: string; workplace?: string; memberCode?: string }): void {
  trackEvent('generate_lead', {
    event_category: 'Funnel',
    event_label: lead.workplace || 'Corporate Office',
    member_code: lead.memberCode,
    value: 1,
  });
}

/**
 * 2. Plan Builder: Order Calculation
 */
export function trackPlanCalculated(daysCount: number, totalNGN: number): void {
  trackEvent('calculate_plan', {
    event_category: 'Plan Builder',
    days_selected: daysCount,
    currency: 'NGN',
    value: totalNGN,
  });
}

/**
 * 3. Checkout Started
 */
export function trackBeginCheckout(daysCount: number, totalNGN: number): void {
  trackEvent('begin_checkout', {
    event_category: 'Checkout',
    currency: 'NGN',
    value: totalNGN,
    items: [
      {
        item_id: `plan-${daysCount}-days`,
        item_name: `${daysCount} Workday Lunch Plan`,
        price: totalNGN,
        quantity: 1,
      },
    ],
  });
}

/**
 * 4. Order Placed / Bank Transfer Verification Pending
 */
export function trackOrderSubmitted(order: { id: string; totalDays: number; finalTotalNGN: number; company?: string }): void {
  trackEvent('purchase', {
    transaction_id: order.id,
    currency: 'NGN',
    value: order.finalTotalNGN,
    company: order.company || 'Corporate Office',
    items: [
      {
        item_id: `plan-${order.totalDays}-days`,
        item_name: `${order.totalDays} Workday Lunch Plan`,
        price: order.finalTotalNGN,
        quantity: 1,
      },
    ],
  });
}

/**
 * 5. Guided Website Walkthrough Step Progress
 */
export function trackWalkthroughStep(step: number, stepTitle: string): void {
  trackEvent('walkthrough_progress', {
    event_category: 'Onboarding',
    step_number: step,
    step_title: stepTitle,
  });
}

/**
 * 6. Guided Website Walkthrough Skipped
 */
export function trackWalkthroughSkip(step: number): void {
  trackEvent('walkthrough_skipped', {
    event_category: 'Onboarding',
    dropped_at_step: step,
  });
}

/**
 * 7. Subscriber Portal Login
 */
export function trackSubscriberLogin(method: string = 'email_password'): void {
  trackEvent('login', {
    method,
  });
}

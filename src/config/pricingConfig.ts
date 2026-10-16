export interface PricingSettings {
  minOrderDays: number;
  deliveryFeePerDay: number;
  fiveDaysFlatTotal: number;
  tier6to10Price: number;
  tier11to15Price: number;
  tier16to20Price: number;
  tier21PlusPrice: number;
}

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  minOrderDays: 5,
  deliveryFeePerDay: 0,
  fiveDaysFlatTotal: 20000,
  tier6to10Price: 3600,
  tier11to15Price: 3400,
  tier16to20Price: 3200,
  tier21PlusPrice: 3000,
};

const PRICING_STORAGE_KEY = '11to12_pricing_settings_v3';

let currentPricingSettings: PricingSettings = (() => {
  if (typeof window === 'undefined') return DEFAULT_PRICING_SETTINGS;
  try {
    const saved = localStorage.getItem(PRICING_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_PRICING_SETTINGS, ...parsed, deliveryFeePerDay: 0 };
    }
  } catch {}
  return DEFAULT_PRICING_SETTINGS;
})();

type PricingListener = (settings: PricingSettings) => void;
const pricingListeners = new Set<PricingListener>();

export function getPricingSettings(): PricingSettings {
  return currentPricingSettings;
}

export function updatePricingSettings(partial: Partial<PricingSettings>): PricingSettings {
  currentPricingSettings = {
    ...currentPricingSettings,
    ...partial,
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(currentPricingSettings));
    } catch {}
  }
  pricingListeners.forEach((fn) => {
    try {
      fn(currentPricingSettings);
    } catch {}
  });
  return currentPricingSettings;
}

export function subscribePricingSettings(listener: PricingListener): () => void {
  pricingListeners.add(listener);
  return () => {
    pricingListeners.delete(listener);
  };
}

export interface TierCalculationResult {
  totalNGN: number;
  foodTotalNGN: number;
  deliveryTotalNGN: number;
  currentTierDailyRate: number;
  tierLabel: string;
  isEligible: boolean;
  minDays: number;
}

/**
 * Calculates tiered pricing strictly following business requirements:
 * - Delivery fee (₦500) is taken out from calculation (desk drop delivery included).
 * - 1 to 5 Days = Flat ₦20,000 (minimum order requirement is 5 days)
 * - 6 to 10 Days = Each day from 1 to 10 is priced at ₦3,600 per meal (e.g. 6 days = ₦21,600)
 * - 11 to 15 Days = Each day from 1 to 15 is priced at ₦3,400 per meal (e.g. 11 days = ₦37,400)
 * - 16 to 20 Days = Each day from 1 to 20 is priced at ₦3,200 per meal, but the 20th day is free!
 *   So 19 days = 19 * 3,200 = ₦60,800.
 *   And 20 days = 19 * 3,200 = ₦60,800 (the 20th day is completely free!).
 * - 21+ Days = Each day is priced at ₦3,000 per meal, and the 20th day remains free!
 *   So (daysCount - 1) * 3,000.
 */
export function calculateTieredOrderTotal(
  daysCount: number,
  settings: PricingSettings = currentPricingSettings
): TierCalculationResult {
  const minDays = settings.minOrderDays || 5;
  const isEligible = daysCount >= minDays;

  if (daysCount <= 0) {
    return {
      totalNGN: 0,
      foodTotalNGN: 0,
      deliveryTotalNGN: 0,
      currentTierDailyRate: 4000,
      tierLabel: 'Select at least 5 days',
      isEligible: false,
      minDays,
    };
  }

  // 1 to 5 days
  if (daysCount <= 5) {
    const flatTotal = settings.fiveDaysFlatTotal || 20000;
    const rate = Math.round(flatTotal / 5);
    return {
      totalNGN: flatTotal,
      foodTotalNGN: flatTotal,
      deliveryTotalNGN: 0,
      currentTierDailyRate: rate,
      tierLabel: '5-Day Starter (₦20,000 flat)',
      isEligible: daysCount >= minDays,
      minDays,
    };
  }

  // 6 to 10 days: each day priced at ₦3,600 per meal
  if (daysCount <= 10) {
    const rate = settings.tier6to10Price || 3600;
    const total = daysCount * rate;
    return {
      totalNGN: total,
      foodTotalNGN: total,
      deliveryTotalNGN: 0,
      currentTierDailyRate: rate,
      tierLabel: '6–10 Days Tier (₦3,600/day)',
      isEligible: true,
      minDays,
    };
  }

  // 11 to 15 days: each day priced at ₦3,400 per meal
  if (daysCount <= 15) {
    const rate = settings.tier11to15Price || 3400;
    const total = daysCount * rate;
    return {
      totalNGN: total,
      foodTotalNGN: total,
      deliveryTotalNGN: 0,
      currentTierDailyRate: rate,
      tierLabel: '11–15 Days Tier (₦3,400/day)',
      isEligible: true,
      minDays,
    };
  }

  // 16 to 20 days: each day priced at ₦3,200 per meal, but 20th day is free!
  if (daysCount <= 20) {
    const rate = settings.tier16to20Price || 3200;
    // For 20 days, remove the bill for the 20th day (19 billable days)
    const billableDays = daysCount === 20 ? 19 : daysCount;
    const total = billableDays * rate;
    return {
      totalNGN: total,
      foodTotalNGN: total,
      deliveryTotalNGN: 0,
      currentTierDailyRate: rate,
      tierLabel: daysCount === 20
        ? '16–20 Days Tier (₦3,200/day • 20th Day Free!)'
        : '16–20 Days Tier (₦3,200/day)',
      isEligible: true,
      minDays,
    };
  }

  // 21+ days: each day priced at ₦3,000 per meal, 20th day remains free!
  const rate = settings.tier21PlusPrice || 3000;
  const billableDays = daysCount - 1; // 20th day is free
  const total = billableDays * rate;
  return {
    totalNGN: total,
    foodTotalNGN: total,
    deliveryTotalNGN: 0,
    currentTierDailyRate: rate,
    tierLabel: '21+ Days Best Value (₦3,000/day • 20th Day Free!)',
    isEligible: true,
    minDays,
  };
}

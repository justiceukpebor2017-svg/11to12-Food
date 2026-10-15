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
  deliveryFeePerDay: 500,
  fiveDaysFlatTotal: 20000,
  tier6to10Price: 3600,
  tier11to15Price: 3400,
  tier16to20Price: 3200,
  tier21PlusPrice: 3000,
};

const PRICING_STORAGE_KEY = '11to12_pricing_settings_v2';

let currentPricingSettings: PricingSettings = (() => {
  if (typeof window === 'undefined') return DEFAULT_PRICING_SETTINGS;
  try {
    const saved = localStorage.getItem(PRICING_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_PRICING_SETTINGS, ...parsed };
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
 * - 5 Days = Flat ₦20,000 (unlocks Pay Now)
 * - 6-10 Days = ₦3,600 / day added (+ ₦500 delivery)
 * - 11-15 Days = ₦3,400 / day added (+ ₦500 delivery)
 * - 16-20 Days = ₦3,200 / day added (+ ₦500 delivery)
 * - 21+ Days = ₦3,000 / day added (+ ₦500 delivery)
 * Delivery fee is included seamlessly in totalNGN without showing separate add-on lines.
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

  // If under 5 days, calculate proportional progress towards 20,000 package
  if (daysCount < 5) {
    const proportionalTotal = Math.round((daysCount / 5) * settings.fiveDaysFlatTotal);
    const delivery = daysCount * settings.deliveryFeePerDay;
    return {
      totalNGN: proportionalTotal,
      foodTotalNGN: Math.max(0, proportionalTotal - delivery),
      deliveryTotalNGN: delivery,
      currentTierDailyRate: 4000,
      tierLabel: `${daysCount}/5 Days (Select ${5 - daysCount} more to unlock)`,
      isEligible: false,
      minDays,
    };
  }

  // Exactly 5 days
  if (daysCount === 5) {
    const delivery = 5 * settings.deliveryFeePerDay;
    return {
      totalNGN: settings.fiveDaysFlatTotal,
      foodTotalNGN: Math.max(0, settings.fiveDaysFlatTotal - delivery),
      deliveryTotalNGN: delivery,
      currentTierDailyRate: 4000,
      tierLabel: '5-Day Starter (₦20,000 Package)',
      isEligible: true,
      minDays,
    };
  }

  // 6 to 10 days
  if (daysCount <= 10) {
    const extraDays = daysCount - 5;
    const extraPerDayTotal = settings.tier6to10Price + settings.deliveryFeePerDay;
    const total = settings.fiveDaysFlatTotal + extraDays * extraPerDayTotal;
    const delivery = daysCount * settings.deliveryFeePerDay;
    return {
      totalNGN: total,
      foodTotalNGN: total - delivery,
      deliveryTotalNGN: delivery,
      currentTierDailyRate: extraPerDayTotal,
      tierLabel: '6–10 Days Tier (₦3,600/day + delivery)',
      isEligible: true,
      minDays,
    };
  }

  // 11 to 15 days
  if (daysCount <= 15) {
    const tier1Total = settings.fiveDaysFlatTotal;
    const tier2Total = 5 * (settings.tier6to10Price + settings.deliveryFeePerDay);
    const extraDays = daysCount - 10;
    const extraPerDayTotal = settings.tier11to15Price + settings.deliveryFeePerDay;
    const total = tier1Total + tier2Total + extraDays * extraPerDayTotal;
    const delivery = daysCount * settings.deliveryFeePerDay;
    return {
      totalNGN: total,
      foodTotalNGN: total - delivery,
      deliveryTotalNGN: delivery,
      currentTierDailyRate: extraPerDayTotal,
      tierLabel: '11–15 Days Tier (₦3,400/day + delivery)',
      isEligible: true,
      minDays,
    };
  }

  // 16 to 20 days
  if (daysCount <= 20) {
    const tier1Total = settings.fiveDaysFlatTotal;
    const tier2Total = 5 * (settings.tier6to10Price + settings.deliveryFeePerDay);
    const tier3Total = 5 * (settings.tier11to15Price + settings.deliveryFeePerDay);
    const extraDays = daysCount - 15;
    const extraPerDayTotal = settings.tier16to20Price + settings.deliveryFeePerDay;
    const total = tier1Total + tier2Total + tier3Total + extraDays * extraPerDayTotal;
    const delivery = daysCount * settings.deliveryFeePerDay;
    return {
      totalNGN: total,
      foodTotalNGN: total - delivery,
      deliveryTotalNGN: delivery,
      currentTierDailyRate: extraPerDayTotal,
      tierLabel: '16–20 Days Tier (₦3,200/day + delivery)',
      isEligible: true,
      minDays,
    };
  }

  // 21+ days
  const tier1Total = settings.fiveDaysFlatTotal;
  const tier2Total = 5 * (settings.tier6to10Price + settings.deliveryFeePerDay);
  const tier3Total = 5 * (settings.tier11to15Price + settings.deliveryFeePerDay);
  const tier4Total = 5 * (settings.tier16to20Price + settings.deliveryFeePerDay);
  const extraDays = daysCount - 20;
  const extraPerDayTotal = settings.tier21PlusPrice + settings.deliveryFeePerDay;
  const total = tier1Total + tier2Total + tier3Total + tier4Total + extraDays * extraPerDayTotal;
  const delivery = daysCount * settings.deliveryFeePerDay;
  return {
    totalNGN: total,
    foodTotalNGN: total - delivery,
    deliveryTotalNGN: delivery,
    currentTierDailyRate: extraPerDayTotal,
    tierLabel: '21+ Days Best Value (₦3,000/day + delivery)',
    isEligible: true,
    minDays,
  };
}

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export type ViewMode = 'marketing' | 'subscriber' | 'admin';

export type MealCategory =
  | 'Rice'
  | 'Rice & Beans'
  | 'Pasta'
  | 'Yam'
  | 'Beans / Moi Moi'
  | 'Plantain'
  | 'Swallow'
  | 'Rice + Soup';

export type SwallowType = 'Eba' | 'Semo' | 'Fufu';
export const CANONICAL_SWALLOW_OPTIONS: SwallowType[] = ['Eba', 'Semo', 'Fufu'];

export interface StructuredMeal {
  id: string;
  dateStr: string; // e.g. "2026-10-05"
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | DayOfWeek;
  mealName: string;
  mealCategory: MealCategory;
  baseIngredient?: string;
  protein?: string;
  soup?: string;
  price?: number; // Optional meal-specific override (hierarchy: meal.price -> category default)
  isHoliday?: boolean;
  holidayName?: string;
  isNoDelivery?: boolean;
  swallowOptions?: SwallowType[];
  imageUrl?: string;
  description?: string;
  ingredients?: string[];
  subPackOption?: {
    title: string;
    description: string;
    items: string[];
  };
}

export interface SelectedLunchDay {
  dateStr: string;
  meal: StructuredMeal;
  selectedSwallow?: SwallowType;
}

// Official Settlement Bank Details
export const OFFICIAL_BANK_DETAILS = {
  accountName: '11 TO 12 FOODS LTD',
  bankName: 'Wema Bank',
  accountNumber: '7353969118',
  secondaryBankName: 'Flutterwave MFB',
  secondaryAccountNumber: '9596073284',
  secondaryAccountName: '11 TO 12 FOODS LTD',
  status: 'Active',
};

// Central Default Pricing Rules (can easily be edited)
export const DEFAULT_CATEGORY_PRICES: Record<MealCategory, number> = {
  'Rice': 2900,
  'Rice & Beans': 2900,
  'Pasta': 2800,
  'Yam': 2000,
  'Beans / Moi Moi': 2500,
  'Plantain': 2200,
  'Swallow': 3200,
  'Rice + Soup': 3200,
};

// Calculate meal price: Specific meal price -> category default price
export function calculateMealPrice(meal: StructuredMeal): number {
  if (meal.isHoliday || meal.isNoDelivery) return 0;
  if (typeof meal.price === 'number') {
    return meal.price;
  }
  return DEFAULT_CATEGORY_PRICES[meal.mealCategory] ?? 2900;
}

// Per-Day Addition Fee (configurable)
export const PER_DAY_FEE = 500;

export interface OrderSummary {
  totalDays: number;
  foodTotalNGN: number;
  perDayAdditionNGN: number;
  subtotalNGN: number;
  discountNGN: number;
  finalTotalNGN: number;
  hasTwentyDayBonus: boolean;
}

// Order calculation logic:
// Food Total = Sum of selected meal prices
// Per-Day Addition = selectedDays.length * PER_DAY_FEE
// Final Total = Food Total + Per-Day Addition (- 20th day bonus if applicable)
export function calculateOrderSummary(selectedDays: SelectedLunchDay[]): OrderSummary {
  // Only selectable delivery days count (exclude holidays/no-delivery)
  const validDays = selectedDays.filter((d) => !d.meal.isHoliday && !d.meal.isNoDelivery);
  const totalDays = validDays.length;
  const foodTotalNGN = validDays.reduce((acc, item) => acc + calculateMealPrice(item.meal), 0);
  const perDayAdditionNGN = totalDays * PER_DAY_FEE;
  const subtotalNGN = foodTotalNGN + perDayAdditionNGN;

  let discountNGN = 0;
  if (totalDays >= 20) {
    // 20th day (index 19) food cost is free
    const twentiethDayMeal = validDays[19]?.meal || validDays[validDays.length - 1]?.meal;
    if (twentiethDayMeal) {
      discountNGN = calculateMealPrice(twentiethDayMeal);
    }
  }

  const finalTotalNGN = Math.max(0, subtotalNGN - discountNGN);

  return {
    totalDays,
    foodTotalNGN,
    perDayAdditionNGN,
    subtotalNGN,
    discountNGN,
    finalTotalNGN,
    hasTwentyDayBonus: totalDays >= 20,
  };
}

export interface OrderSubmission {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  officeAddress: string;
  secondAddress?: string;
  floorSuite?: string;
  deliveryArea?: string;
  selectedDays: SelectedLunchDay[];
  totalDays: number;
  planName?: string;
  subtotalNGN: number;
  discountNGN: number;
  finalTotalNGN: number;
  submittedAt: string;
  paymentStatus: 'Pending Verification' | 'Confirmed';
  paymentProofUrl?: string;
  memberCode?: string;
  isTopUp?: boolean;
}

export interface MenuItem {
  id: string;
  day: DayOfWeek;
  dateStr: string; // e.g. "2026-08-04"
  title: string;
  description: string;
  category: 'Rice & Grains' | 'Swallow & Soup' | 'Beans & Delicacies' | 'Special Feast' | 'Pasta & Noodles' | string;
  protein: 'Grilled Chicken' | 'Beef Sauce' | 'Smoked Turkey' | 'Assorted Goat Meat' | 'Fried Fish' | 'Vegetarian' | string;
  spiceLevel: 'Mild' | 'Medium' | 'Hot' | 'Pepper Dem';
  allergens: string[];
  ingredients: string[];
  imageUrl: string;
  subPackOption: {
    title: string;
    description: string;
    items: string[];
  };
}

export interface PlanConfig {
  days: Record<DayOfWeek, boolean>;
  dayMultipliers: Record<DayOfWeek, number>;
  weeks: number;
  snackPackEnabled: boolean;
}

export type TimeWindow = 'morning' | 'delivery' | 'post_lunch';

export interface UserOrderState {
  dateStr: string; // e.g. "2026-08-04"
  day: DayOfWeek;
  status: 'accepted' | 'skipped' | 'sub_pack' | 'delivered' | 'pending';
  mealTitle: string;
  quantity: number;
  confirmedReceived?: boolean;
  actionTimestamp?: number;
}

export interface UndoAction {
  id: string;
  actionType: 'accepted' | 'skipped' | 'sub_pack' | 'credit_redeemed' | 'meal_choice';
  previousState?: UserOrderState['status'];
  newState?: UserOrderState['status'];
  dateStr?: string;
  timestamp?: number;
  expiresAt: number; // Unix timestamp
  description: string;
  revertFn?: () => void;
}

export interface CustomerRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  officeAddress: string;
  secondAddress?: string;
  floorSuite?: string;
  deliveryArea?: string;
  notes?: string;
  status: 'Active' | 'Paused' | 'Pending Activation' | 'Expired';
  paymentStatus: 'Paid' | 'Pending Verification';
  paymentProofUrl?: string;
  planName: string;
  totalDays: number;
  remainingMeals?: number;
  creditsBalance?: number;
  skippedDates?: string[];
  extraPlateDates?: string[];
  dayStatuses?: Record<string, 'Accepted' | 'Skipped' | 'Extra Plate'>;
  selectedDays: SelectedLunchDay[];
  subtotalNGN: number;
  discountNGN: number;
  finalTotalNGN: number;
  orderRef?: string;
  memberCode?: string;
  createdAt: string;
  confirmedAt?: string;
  isPasswordSet: boolean;
  password?: string;
  defaultPassword?: string;
  isDefaultPassword?: boolean;
  mustChangePassword?: boolean;
  passwordLastChangedAt?: string;
  isTrial?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  occupation: string;
  company: string;
  address: string;
  secondAddress?: string;
  floorSuite?: string;
  deliveryArea: string;
  creditsBalance: number;
  remainingMeals?: number;
  skippedDates?: string[];
  orderTotalNGN?: number;
  orderRef?: string;
  spicePreference?: 'Mild' | 'Medium' | 'Hot' | 'Pepper Dem';
  proteinsPreferred: string[];
  dislikes: string[];
  standardLunchTime: string; // e.g. "11:30 AM"
  eatLocation: 'Work' | 'Home' | 'Both';
  subscriptionStatus: 'Active' | 'Paused' | 'Pending Activation' | 'Cancelled' | 'Expired';
  paymentStatus?: 'Paid' | 'Pending Verification';
  planName: string;
  nextBillingDate: string;
  totalMealsReceived: number;
  totalSubscribedDays?: number;
  skipCount?: number;
  selectedDays?: SelectedLunchDay[];
  isPasswordSet?: boolean;
  isTrial?: boolean;
  trialDaysLeft?: number;
  pendingAddressChange?: {
    newLocation: string;
    effectiveAt: string;
    requestedAt: string;
  } | null;
}

export interface MealRating {
  id: string;
  mealId: string;
  mealTitle: string;
  dateStr: string;
  rating: number; // 1-5
  comment: string;
  imageUrl: string;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'delay';
  active: boolean;
  postedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Ingredient' | 'Packaging' | 'Cutlery & Extras';
  unit: 'kg' | 'liters' | 'bags' | 'packs' | 'units';
  currentStock: number;
  requiredStock: number;
  reorderPoint: number;
  costPerUnitNGN: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: 'Meal Quality' | 'Late Delivery' | 'Missing Item' | 'Billing' | 'General';
  subject: string;
  message: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: string;
}

export interface GiveawayEntry {
  id: string;
  email: string;
  wittyConfirmation: string;
  createdAt: string;
  source: string;
}

export interface WaitlistLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  workplace: string;
  addressFloor: string;
  createdAt: string;
  status: 'Waitlisted' | 'Contacted' | 'Converted';
  notes?: string;
  memberCode: string;
}

export interface CreditRedemptionDayItem {
  dateStr: string;
  portions: number;
  dishName: string;
  isFriday?: boolean;
  swallowChoice?: SwallowType;
}

export interface CreditRedemptionOrder {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  company: string;
  officeAddress: string;
  items: CreditRedemptionDayItem[];
  totalCreditsUsed: number;
  status: 'Pending Verification' | 'Confirmed';
  submittedAt: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company?: string;
  text: string;
  officeLocation?: string;
  date?: string;
  rating?: number;
  featured?: boolean;
}

export interface LaunchSettings {
  launchDate: string; // 'YYYY-MM-DD'
  isEnabled: boolean; // true = launch countdown & pre-launch calendar gating active; false = officially launched (launch date removed from homepage)
}

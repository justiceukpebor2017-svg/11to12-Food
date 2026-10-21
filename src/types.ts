import { calculateTieredOrderTotal } from './config/pricingConfig';

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
  hasCustomImage?: boolean; // Set to true when an image is uploaded or linked by the admin
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
  bankName: 'Moniepoint MFB',
  accountNumber: '8026180680',
  secondaryBankName: 'Wema Bank',
  secondaryAccountNumber: '7353969118',
  secondaryAccountName: '11 TO 12 FOODS LTD',
  tertiaryBankName: 'Flutterwave MFB',
  tertiaryAccountNumber: '9596073284',
  tertiaryAccountName: '11 TO 12 FOODS LTD',
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
export const PER_DAY_FEE = 0;

export interface OrderSummary {
  totalDays: number;
  foodTotalNGN: number;
  perDayAdditionNGN: number;
  subtotalNGN: number;
  discountNGN: number;
  finalTotalNGN: number;
  hasTwentyDayBonus: boolean;
}

// Order calculation logic using tiered corporate rates:
// 1 to 5 days: Flat ₦20,000 (minimum order requirement is 5 days)
// 6 to 10 days: ₦3,600 / day
// 11 to 15 days: ₦3,400 / day
// 16 to 20 days: ₦3,200 / day (20th day is free!)
// 21+ days: ₦3,000 / day (20th day is free!)
export function calculateOrderSummary(selectedDays: SelectedLunchDay[]): OrderSummary {
  const validDays = selectedDays.filter((d) => !d.meal.isHoliday && !d.meal.isNoDelivery);
  const totalDays = validDays.length;
  const tiered = calculateTieredOrderTotal(totalDays);

  return {
    totalDays,
    foodTotalNGN: tiered.foodTotalNGN,
    perDayAdditionNGN: tiered.deliveryTotalNGN,
    subtotalNGN: tiered.totalNGN,
    discountNGN: 0,
    finalTotalNGN: tiered.totalNGN,
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
  preferredSwallow?: SwallowType;
  planName: string;
  totalDays: number;
  remainingMeals?: number;
  creditsBalance?: number;
  skippedDates?: string[];
  extraPlateDates?: string[];
  creditUsedDates?: string[];
  creditRedemptions?: CreditRedemptionOrder[];
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
  creditRedemptions?: CreditRedemptionOrder[];
  creditUsedDates?: string[];
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
  email?: string;
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

export interface ActiveSessionRecord {
  id: string; // 'admin' or customerId
  userId: string;
  userEmail?: string;
  role: 'admin' | 'subscriber';
  activeSessionId: string; // Unique session token of current active browser/tab
  deviceInfo: string; // e.g. "Chrome on Windows"
  claimedAt: string;
  updatedAt: string;
  yieldRequested?: boolean;
  yieldRequestedBy?: string;
  yieldRequestedByToken?: string;
}

import { DayOfWeek, MenuItem, MealCategory, StructuredMeal, SwallowType } from '../types';

export interface WeekMenuPlan {
  weekNumber: number;
  monthNumber: number;
  days: {
    Mon: string;
    Tue: string;
    Wed: string;
    Thu: string;
    Fri: string;
  };
}

// Configurable Nigerian Public Holidays & No Delivery Days
export const KNOWN_HOLIDAYS: Record<string, string> = {
  '2026-10-01': 'Public Holiday: Nigeria Independence Day',
  '2026-12-25': 'Public Holiday: Christmas Day',
  '2026-12-26': 'Public Holiday: Boxing Day',
  '2027-01-01': 'Public Holiday: New Year Day',
};

export const TWENTY_SIX_WEEK_MENU: WeekMenuPlan[] = [
  // MONTH 1
  {
    weekNumber: 1,
    monthNumber: 1,
    days: {
      Mon: 'Jollof rice + grilled chicken',
      Tue: 'Beans + fried plantain + fish',
      Wed: 'Stir-fry spaghetti + 2 boiled eggs',
      Thu: 'White rice + stew + chopped fried meat',
      Fri: 'Semo/Eba/Fufu + Egusi soup + fish',
    },
  },
  {
    weekNumber: 2,
    monthNumber: 1,
    days: {
      Mon: 'Fried rice + chicken',
      Tue: 'Yam porridge + vegetables',
      Wed: 'White rice + chicken sauce',
      Thu: 'Moi moi + 3-in-1 garri mix',
      Fri: 'Semo/Eba/Fufu + Vegetable soup + chicken',
    },
  },
  {
    weekNumber: 3,
    monthNumber: 1,
    days: {
      Mon: 'Red-oil rice and beans + fried fish',
      Tue: 'Fried yam + fish sauce',
      Wed: 'Jollof rice + chopped fried meat',
      Thu: 'White rice + beans + stew',
      Fri: 'Semo/Eba/Fufu + Ogbono soup + beef',
    },
  },
  {
    weekNumber: 4,
    monthNumber: 1,
    days: {
      Mon: 'Fried rice + grilled chicken',
      Tue: 'Boiled yam + egg sauce + fish',
      Wed: 'Spaghetti + chicken sauce',
      Thu: 'Red-oil concoction rice + meat + boiled egg',
      Fri: 'Semo/Eba/Fufu + Okra soup + fish',
    },
  },

  // MONTH 2
  {
    weekNumber: 5,
    monthNumber: 2,
    days: {
      Mon: 'White rice + stew + grilled chicken',
      Tue: 'Beans + plantain + fried fish',
      Wed: 'Jollof rice + chicken',
      Thu: 'Grilled plantain + sauce + fish',
      Fri: 'Semo/Eba/Fufu + Afang soup + chicken',
    },
  },
  {
    weekNumber: 6,
    monthNumber: 2,
    days: {
      Mon: 'Fried rice + chopped fried meat',
      Tue: 'Yam porridge + fish',
      Wed: 'Stir-fry spaghetti + chicken',
      Thu: 'Moi moi + 3-in-1 garri mix',
      Fri: 'Semo/Eba/Fufu + Egusi soup + beef',
    },
  },
  {
    weekNumber: 7,
    monthNumber: 2,
    days: {
      Mon: 'Red-oil rice and beans + chicken',
      Tue: 'White rice + vegetable sauce + fish',
      Wed: 'Fried yam + pepper ketchup + chicken',
      Thu: 'Jollof rice + boiled egg',
      Fri: 'Semo/Eba/Fufu + Efo riro + fish',
    },
  },
  {
    weekNumber: 8,
    monthNumber: 2,
    days: {
      Mon: 'White rice + chicken sauce',
      Tue: 'Beans + fried plantain + meat',
      Wed: 'Fried rice + chicken',
      Thu: 'Pepper soup + white rice',
      Fri: 'Semo/Eba/Fufu + Ogbono soup + chicken',
    },
  },

  // MONTH 3
  {
    weekNumber: 9,
    monthNumber: 3,
    days: {
      Mon: 'Jollof rice + grilled chicken',
      Tue: 'Boiled yam + vegetable sauce + fish',
      Wed: 'Stir-fry spaghetti + fried meat',
      Thu: 'Red-oil rice and beans + fish',
      Fri: 'Semo/Eba/Fufu + Vegetable soup + beef',
    },
  },
  {
    weekNumber: 10,
    monthNumber: 3,
    days: {
      Mon: 'Fried rice + chopped fried meat',
      Tue: 'Yam porridge + vegetables',
      Wed: 'White rice + stew + chicken',
      Thu: 'Moi moi + 3-in-1 garri mix',
      Fri: 'Semo/Eba/Fufu + Egusi soup + fish',
    },
  },
  {
    weekNumber: 11,
    monthNumber: 3,
    days: {
      Mon: 'Red-oil concoction rice + meat + boiled egg',
      Tue: 'Fried yam + fish sauce',
      Wed: 'Jollof rice + chicken',
      Thu: 'White rice + beans + stew',
      Fri: 'Semo/Eba/Fufu + Okra soup + chicken',
    },
  },
  {
    weekNumber: 12,
    monthNumber: 3,
    days: {
      Mon: 'White rice + chicken sauce',
      Tue: 'Grilled plantain + sauce + grilled fish',
      Wed: 'Fried rice + chicken',
      Thu: 'Spaghetti + 2 boiled eggs',
      Fri: 'Semo/Eba/Fufu + Efo riro + beef',
    },
  },

  // MONTH 4
  {
    weekNumber: 13,
    monthNumber: 4,
    days: {
      Mon: 'Jollof rice + chopped fried meat',
      Tue: 'Beans + fried plantain + fish',
      Wed: 'White rice + vegetable sauce + chicken',
      Thu: 'Yam porridge + fish',
      Fri: 'Semo/Eba/Fufu + Egusi soup + chicken',
    },
  },
  {
    weekNumber: 14,
    monthNumber: 4,
    days: {
      Mon: 'Fried rice + grilled chicken',
      Tue: 'Boiled yam + egg sauce + fish',
      Wed: 'Stir-fry spaghetti + fried meat',
      Thu: 'Moi moi + 3-in-1 garri mix',
      Fri: 'Semo/Eba/Fufu + Vegetable soup + fish',
    },
  },
  {
    weekNumber: 15,
    monthNumber: 4,
    days: {
      Mon: 'Red-oil rice and beans + chicken',
      Tue: 'Fried yam + pepper ketchup + chicken',
      Wed: 'White rice + stew + boiled egg',
      Thu: 'Jollof rice + fish',
      Fri: 'Semo/Eba/Fufu + Ogbono soup + beef',
    },
  },
  {
    weekNumber: 16,
    monthNumber: 4,
    days: {
      Mon: 'White rice + chicken sauce',
      Tue: 'Grilled plantain + sauce + fish',
      Wed: 'Fried rice + chopped meat',
      Thu: 'Pepper soup + white rice',
      Fri: 'Semo/Eba/Fufu + Okra soup + chicken',
    },
  },

  // MONTH 5
  {
    weekNumber: 17,
    monthNumber: 5,
    days: {
      Mon: 'Jollof rice + chicken',
      Tue: 'Beans + plantain + fried fish',
      Wed: 'Spaghetti + chicken sauce',
      Thu: 'White rice + vegetable sauce + meat',
      Fri: 'Semo/Eba/Fufu + Egusi soup + fish',
    },
  },
  {
    weekNumber: 18,
    monthNumber: 5,
    days: {
      Mon: 'Fried rice + chopped fried meat',
      Tue: 'Yam porridge + vegetables',
      Wed: 'Red-oil rice and beans + chicken',
      Thu: 'Moi moi + 3-in-1 garri mix',
      Fri: 'Semo/Eba/Fufu + Vegetable soup + beef',
    },
  },
  {
    weekNumber: 19,
    monthNumber: 5,
    days: {
      Mon: 'White rice + stew + grilled chicken',
      Tue: 'Fried yam + fish sauce',
      Wed: 'Jollof rice + fried meat',
      Thu: 'Boiled yam + egg sauce + fish',
      Fri: 'Semo/Eba/Fufu + Efo riro + chicken',
    },
  },
  {
    weekNumber: 20,
    monthNumber: 5,
    days: {
      Mon: 'Red-oil concoction rice + meat + boiled egg',
      Tue: 'Grilled plantain + sauce + fish',
      Wed: 'Fried rice + chicken',
      Thu: 'Stir-fry spaghetti + 2 boiled eggs',
      Fri: 'Semo/Eba/Fufu + Ogbono soup + fish',
    },
  },

  // MONTH 6
  {
    weekNumber: 21,
    monthNumber: 6,
    days: {
      Mon: 'Jollof rice + grilled chicken',
      Tue: 'Beans + fried plantain + meat',
      Wed: 'White rice + chicken sauce',
      Thu: 'Yam porridge + fish',
      Fri: 'Semo/Eba/Fufu + Egusi soup + beef',
    },
  },
  {
    weekNumber: 22,
    monthNumber: 6,
    days: {
      Mon: 'Fried rice + chicken',
      Tue: 'Fried yam + pepper ketchup + chicken',
      Wed: 'Red-oil rice and beans + fish',
      Thu: 'Moi moi + 3-in-1 garri mix',
      Fri: 'Semo/Eba/Fufu + Vegetable soup + fish',
    },
  },
  {
    weekNumber: 23,
    monthNumber: 6,
    days: {
      Mon: 'White rice + stew + chopped fried meat',
      Tue: 'Boiled yam + vegetable sauce + fish',
      Wed: 'Stir-fry spaghetti + chicken',
      Thu: 'Jollof rice + boiled egg',
      Fri: 'Semo/Eba/Fufu + Okra soup + chicken',
    },
  },
  {
    weekNumber: 24,
    monthNumber: 6,
    days: {
      Mon: 'Red-oil concoction rice + meat + boiled egg',
      Tue: 'Grilled plantain + sauce + grilled fish',
      Wed: 'Fried rice + chopped meat',
      Thu: 'Pepper soup + white rice',
      Fri: 'Semo/Eba/Fufu + Efo riro + beef',
    },
  },
  {
    weekNumber: 25,
    monthNumber: 6,
    days: {
      Mon: 'Jollof rice + chicken',
      Tue: 'Beans + fried plantain + fish',
      Wed: 'White rice + chicken sauce',
      Thu: 'Fried yam + fish sauce',
      Fri: 'Semo/Eba/Fufu + Egusi soup + fish',
    },
  },
  {
    weekNumber: 26,
    monthNumber: 6,
    days: {
      Mon: 'Fried rice + grilled chicken',
      Tue: 'Yam porridge + vegetables',
      Wed: 'Red-oil rice and beans + meat',
      Thu: 'Stir-fry spaghetti + chicken',
      Fri: 'Semo/Eba/Fufu + Vegetable soup + chicken',
    },
  },
];

// Helper to structure each meal according to user-defined categories
export function parseStructuredMeal(
  mealTitle: string,
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | DayOfWeek,
  dateStr: string,
  priceOverride?: number
): StructuredMeal {
  const titleLower = mealTitle.toLowerCase();

  // Categorize based strictly on the 8 user-defined categories
  let mealCategory: MealCategory = 'Rice';
  let soup: string | undefined = undefined;

  // Extract soup if present
  if (titleLower.includes('egusi soup')) soup = 'Egusi Soup';
  else if (titleLower.includes('vegetable soup')) soup = 'Vegetable Soup';
  else if (titleLower.includes('ogbono soup')) soup = 'Ogbono Soup';
  else if (titleLower.includes('okra soup')) soup = 'Okra Soup';
  else if (titleLower.includes('afang soup')) soup = 'Afang Soup';
  else if (titleLower.includes('efo riro')) soup = 'Efo Riro';
  else if (titleLower.includes('pepper soup')) soup = 'Pepper Soup';
  else if (titleLower.includes('fish sauce')) soup = 'Fish Sauce';
  else if (titleLower.includes('chicken sauce')) soup = 'Chicken Sauce';
  else if (titleLower.includes('egg sauce')) soup = 'Egg Sauce';
  else if (titleLower.includes('stew')) soup = 'Tomato Stew';

  if (
    titleLower.includes('semo') ||
    titleLower.includes('eba') ||
    titleLower.includes('fufu') ||
    titleLower.includes('swallow')
  ) {
    mealCategory = 'Swallow';
  } else if (titleLower.includes('pepper soup') && titleLower.includes('rice')) {
    mealCategory = 'Rice + Soup';
  } else if (
    titleLower.includes('rice and beans') ||
    (titleLower.includes('rice') && titleLower.includes('beans'))
  ) {
    mealCategory = 'Rice & Beans';
  } else if (titleLower.includes('spaghetti') || titleLower.includes('pasta')) {
    mealCategory = 'Pasta';
  } else if (titleLower.includes('yam')) {
    mealCategory = 'Yam';
  } else if (titleLower.includes('beans') || titleLower.includes('moi moi')) {
    mealCategory = 'Beans / Moi Moi';
  } else if (titleLower.includes('plantain') && !titleLower.includes('rice') && !titleLower.includes('beans')) {
    mealCategory = 'Plantain';
  } else {
    mealCategory = 'Rice';
  }

  // Extract Base Ingredient
  let baseIngredient = 'Jollof Rice';
  if (titleLower.includes('fried rice')) baseIngredient = 'Fried Rice';
  else if (titleLower.includes('white rice')) baseIngredient = 'White Rice';
  else if (titleLower.includes('concoction rice')) baseIngredient = 'Red-Oil Concoction Rice';
  else if (titleLower.includes('rice and beans')) baseIngredient = 'Red-Oil Rice and Beans';
  else if (titleLower.includes('stir-fry spaghetti')) baseIngredient = 'Stir-Fry Spaghetti';
  else if (titleLower.includes('spaghetti')) baseIngredient = 'Durum Spaghetti';
  else if (titleLower.includes('yam porridge')) baseIngredient = 'Yam Porridge';
  else if (titleLower.includes('boiled yam')) baseIngredient = 'Boiled White Yam';
  else if (titleLower.includes('fried yam')) baseIngredient = 'Crispy Fried Yam';
  else if (titleLower.includes('moi moi')) baseIngredient = 'Steamed Moi Moi & Garri Mix';
  else if (titleLower.includes('beans')) baseIngredient = 'Honey Beans (Oloyin)';
  else if (titleLower.includes('grilled plantain')) baseIngredient = 'Smoky Grilled Plantain (Boli)';
  else if (mealCategory === 'Swallow') baseIngredient = 'Semo / Eba / Fufu';

  // Extract Protein
  let protein = 'Grilled Chicken';
  if (titleLower.includes('grilled fish') || titleLower.includes('fried fish') || titleLower.includes('fish')) {
    protein = 'Titus / Catfish Seasoned Cut';
  } else if (titleLower.includes('chopped fried meat') || titleLower.includes('fried meat')) {
    protein = 'Chopped Fried Beef';
  } else if (titleLower.includes('beef')) {
    protein = 'Tender Slow-Cooked Beef';
  } else if (titleLower.includes('meat')) {
    protein = 'Fried Beef Chunks';
  } else if (titleLower.includes('2 boiled eggs') || titleLower.includes('boiled egg')) {
    protein = 'Farm-Fresh Boiled Eggs';
  } else if (titleLower.includes('chicken')) {
    protein = 'Spiced Grilled Chicken';
  }

  // Ingredients breakdown
  const ingredients: string[] = [baseIngredient, protein];
  if (soup) ingredients.push(soup);
  if (titleLower.includes('plantain')) ingredients.push('Fried Sweet Plantain (Dodo)');
  if (titleLower.includes('vegetables') || titleLower.includes('vegetable')) ingredients.push('Ugwu & Shoko Greens');
  if (titleLower.includes('garri')) ingredients.push('Crisp Ijebu Garri');

  // Curated Nigerian Food photography
  let imageUrl = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800';
  if (mealCategory === 'Swallow') {
    imageUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800';
  } else if (mealCategory === 'Pasta') {
    imageUrl = 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=800';
  } else if (mealCategory === 'Yam') {
    imageUrl = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800';
  } else if (titleLower.includes('jollof')) {
    imageUrl = 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=800';
  }

  const holidayName = KNOWN_HOLIDAYS[dateStr];
  const isHoliday = Boolean(holidayName);

  return {
    id: `meal-${dateStr}`,
    dateStr,
    day,
    mealName: mealTitle,
    mealCategory,
    baseIngredient,
    protein,
    soup,
    price: priceOverride,
    isHoliday,
    holidayName,
    isNoDelivery: isHoliday,
    swallowOptions: mealCategory === 'Swallow' ? ['Eba', 'Semo', 'Fufu'] : undefined,
    imageUrl,
    ingredients,
  };
}

// Global In-Memory and LocalStorage Overrides for Admin Menu edits (Shared in sync with homepage and subscriber dashboard)
const STORAGE_KEY = '11to12_custom_meals_v2';

function loadStoredOverrides(): Record<string, StructuredMeal> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore storage errors
  }
  return {};
}

export const customMealOverrides: Record<string, StructuredMeal> = loadStoredOverrides();

export function updateCustomMealForDate(dateStr: string, meal: StructuredMeal) {
  customMealOverrides[dateStr] = meal;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customMealOverrides));
  } catch {
    // Ignore storage errors
  }
}

export function getCustomMealForDate(dateStr: string): StructuredMeal | undefined {
  return customMealOverrides[dateStr];
}

// Reference Base Date: Monday, October 5, 2026 = Week 1 (Matches Monday Oct 5: Jollof Rice + Grilled Chicken, Friday Oct 9: Semo/Eba/Fufu + Egusi Soup + Fish)
export const BASE_DATE = new Date(2026, 9, 5); // 9 is October (0-indexed)

export function getStructuredMealForDate(targetDate: Date): StructuredMeal | null {
  const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return null; // Weekend Guard
  }

  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // If the admin has edited or overridden this specific date, return the overridden meal
  if (customMealOverrides[dateStr]) {
    return customMealOverrides[dateStr];
  }

  const dayMap: Record<number, 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
  };
  const dayKeyMap: Record<number, keyof WeekMenuPlan['days']> = {
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
  };

  const dayFullName = dayMap[dayOfWeek] || 'Monday';
  const dayShortKey = dayKeyMap[dayOfWeek] || 'Mon';

  const diffTime = targetDate.getTime() - BASE_DATE.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekNum = Math.floor(diffDays / 7);

  const rotationIndex = ((weekNum % 26) + 26) % 26;
  const currentWeekPlan = TWENTY_SIX_WEEK_MENU[rotationIndex];

  const mealTitle = currentWeekPlan.days[dayShortKey] || 'Jollof rice + grilled chicken';

  return parseStructuredMeal(mealTitle, dayFullName, dateStr);
}

// Backward-compatible getMealDetails helper for admin scheduler
export function getMealDetails(mealTitle: string, day: DayOfWeek, dateStr: string): MenuItem {
  const structured = parseStructuredMeal(mealTitle, day, dateStr);
  return {
    id: structured.id,
    day,
    dateStr: structured.dateStr,
    title: structured.mealName,
    description: structured.description || '',
    category: structured.mealCategory as any,
    protein: structured.protein as any,
    spiceLevel: 'Medium',
    allergens: ['None Reported'],
    ingredients: structured.ingredients || [],
    imageUrl: structured.imageUrl || '',
    subPackOption: structured.subPackOption || {
      title: 'Sub Pack Alternative',
      description: 'Meat pie, puff-puff, zobo',
      items: ['Meat Pie', 'Puff-Puff', 'Zobo'],
    },
  };
}

// Backward-compatible MenuItem getter
export function getMealForDate(targetDate: Date): MenuItem | null {
  const structured = getStructuredMealForDate(targetDate);
  if (!structured) return null;

  const shortDayMap: Record<string, DayOfWeek> = {
    Monday: 'Mon',
    Tuesday: 'Tue',
    Wednesday: 'Wed',
    Thursday: 'Thu',
    Friday: 'Fri',
  };
  const shortDay = shortDayMap[structured.day] || 'Mon';

  return {
    id: structured.id,
    day: shortDay,
    dateStr: structured.dateStr,
    title: structured.mealName,
    description: structured.description || '',
    category: structured.mealCategory as any,
    protein: structured.protein as any,
    spiceLevel: 'Medium',
    allergens: ['None Reported'],
    ingredients: structured.ingredients || [],
    imageUrl: structured.imageUrl || '',
    subPackOption: structured.subPackOption || {
      title: 'Sub Pack Alternative',
      description: 'Meat pie, puff-puff, zobo',
      items: ['Meat Pie', 'Puff-Puff', 'Zobo'],
    },
  };
}

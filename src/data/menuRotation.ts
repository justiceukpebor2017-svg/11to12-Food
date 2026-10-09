import { DayOfWeek, MenuItem, MealCategory, StructuredMeal, SwallowType } from '../types';
import {
  saveMenuOverridesToFirestore,
  subscribeToMenuOverrides,
  getMenuOverridesFromFirestore,
} from '../services/firebase';
import { apiUrl } from '../utils/apiConfig';

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
      Mon: 'Fried yam + egg sauce + fish',
      Tue: 'Jollof rice + chicken + plantain',
      Wed: 'Beans + white rice + beef',
      Thu: 'Fried plantain + chicken',
      Fri: 'Egusi soup',
    },
  },
  {
    weekNumber: 2,
    monthNumber: 1,
    days: {
      Mon: 'Boli + grilled fish',
      Tue: 'White rice + stew + chicken',
      Wed: 'Spaghetti + beef + egg',
      Thu: 'Fried yam + peppered chicken',
      Fri: 'Efo Riro',
    },
  },
  {
    weekNumber: 3,
    monthNumber: 1,
    days: {
      Mon: 'Boiled yam + egg sauce + fish',
      Tue: 'Fried rice + chicken',
      Wed: 'Jollof rice + beef + plantain',
      Thu: 'Boli + fish',
      Fri: 'Okra soup',
    },
  },
  {
    weekNumber: 4,
    monthNumber: 1,
    days: {
      Mon: 'Plantain + egg sauce + chicken',
      Tue: 'White rice + beans + beef',
      Wed: 'Spaghetti + chicken',
      Thu: 'Fried rice + turkey + plantain',
      Fri: 'Ogbono soup',
    },
  },

  // MONTH 2
  {
    weekNumber: 5,
    monthNumber: 2,
    days: {
      Mon: 'Fried yam + peppered chicken',
      Tue: 'Jollof rice + turkey + plantain',
      Wed: 'Beans + rice + chicken',
      Thu: 'Boli + grilled fish',
      Fri: 'Bitterleaf soup (Ofe Onugbu)',
    },
  },
  {
    weekNumber: 6,
    monthNumber: 2,
    days: {
      Mon: 'Boiled sweet potato + egg sauce',
      Tue: 'Fried rice + chicken',
      Wed: 'White rice + stew + beef',
      Thu: 'Fried plantain + chicken',
      Fri: 'Afang soup',
    },
  },
  {
    weekNumber: 7,
    monthNumber: 2,
    days: {
      Mon: 'Boli + fish',
      Tue: 'Spaghetti + chicken',
      Wed: 'Fried rice + beef',
      Thu: 'Ofada rice + ayamase + egg',
      Fri: 'Edikang Ikong',
    },
  },
  {
    weekNumber: 8,
    monthNumber: 2,
    days: {
      Mon: 'Fried plantain + egg + chicken',
      Tue: 'White rice + beans + beef',
      Wed: 'Jollof rice + turkey',
      Thu: 'Boiled yam + peppered fish',
      Fri: 'Oha soup',
    },
  },

  // MONTH 3
  {
    weekNumber: 9,
    monthNumber: 3,
    days: {
      Mon: 'Fried yam + fish + egg sauce',
      Tue: 'Jollof rice + chicken',
      Wed: 'Beans + rice + beef',
      Thu: 'Boli + chicken',
      Fri: 'Banga soup',
    },
  },
  {
    weekNumber: 10,
    monthNumber: 3,
    days: {
      Mon: 'Boli + grilled fish',
      Tue: 'White rice + stew + turkey',
      Wed: 'Fried rice + chicken',
      Thu: 'Spaghetti + beef',
      Fri: 'Okra and egusi soup',
    },
  },
  {
    weekNumber: 11,
    monthNumber: 3,
    days: {
      Mon: 'Boiled yam + egg sauce',
      Tue: 'Jollof rice + beef + plantain',
      Wed: 'Rice + beans + chicken',
      Thu: 'Fried plantain + fish',
      Fri: 'Egusi soup',
    },
  },
  {
    weekNumber: 12,
    monthNumber: 3,
    days: {
      Mon: 'Plantain + egg sauce + chicken',
      Tue: 'Fried rice + turkey',
      Wed: 'White rice + stew + beef',
      Thu: 'Boli + grilled fish',
      Fri: 'Efo Riro',
    },
  },

  // MONTH 4 (Cycle Repeat Weeks 1-4)
  {
    weekNumber: 13,
    monthNumber: 4,
    days: {
      Mon: 'Fried yam + egg sauce + fish',
      Tue: 'Jollof rice + chicken + plantain',
      Wed: 'Beans + white rice + beef',
      Thu: 'Fried plantain + chicken',
      Fri: 'Egusi soup',
    },
  },
  {
    weekNumber: 14,
    monthNumber: 4,
    days: {
      Mon: 'Boli + grilled fish',
      Tue: 'White rice + stew + chicken',
      Wed: 'Spaghetti + beef + egg',
      Thu: 'Fried yam + peppered chicken',
      Fri: 'Efo Riro',
    },
  },
  {
    weekNumber: 15,
    monthNumber: 4,
    days: {
      Mon: 'Boiled yam + egg sauce + fish',
      Tue: 'Fried rice + chicken',
      Wed: 'Jollof rice + beef + plantain',
      Thu: 'Boli + fish',
      Fri: 'Okra soup',
    },
  },
  {
    weekNumber: 16,
    monthNumber: 4,
    days: {
      Mon: 'Plantain + egg sauce + chicken',
      Tue: 'White rice + beans + beef',
      Wed: 'Spaghetti + chicken',
      Thu: 'Fried rice + turkey + plantain',
      Fri: 'Ogbono soup',
    },
  },

  // MONTH 5 (Cycle Repeat Weeks 5-8)
  {
    weekNumber: 17,
    monthNumber: 5,
    days: {
      Mon: 'Fried yam + peppered chicken',
      Tue: 'Jollof rice + turkey + plantain',
      Wed: 'Beans + rice + chicken',
      Thu: 'Boli + grilled fish',
      Fri: 'Bitterleaf soup (Ofe Onugbu)',
    },
  },
  {
    weekNumber: 18,
    monthNumber: 5,
    days: {
      Mon: 'Boiled sweet potato + egg sauce',
      Tue: 'Fried rice + chicken',
      Wed: 'White rice + stew + beef',
      Thu: 'Fried plantain + chicken',
      Fri: 'Afang soup',
    },
  },
  {
    weekNumber: 19,
    monthNumber: 5,
    days: {
      Mon: 'Boli + fish',
      Tue: 'Spaghetti + chicken',
      Wed: 'Fried rice + beef',
      Thu: 'Ofada rice + ayamase + egg',
      Fri: 'Edikang Ikong',
    },
  },
  {
    weekNumber: 20,
    monthNumber: 5,
    days: {
      Mon: 'Fried plantain + egg + chicken',
      Tue: 'White rice + beans + beef',
      Wed: 'Jollof rice + turkey',
      Thu: 'Boiled yam + peppered fish',
      Fri: 'Oha soup',
    },
  },

  // MONTH 6 (Cycle Repeat Weeks 9-12 + 13-14)
  {
    weekNumber: 21,
    monthNumber: 6,
    days: {
      Mon: 'Fried yam + fish + egg sauce',
      Tue: 'Jollof rice + chicken',
      Wed: 'Beans + rice + beef',
      Thu: 'Boli + chicken',
      Fri: 'Banga soup',
    },
  },
  {
    weekNumber: 22,
    monthNumber: 6,
    days: {
      Mon: 'Boli + grilled fish',
      Tue: 'White rice + stew + turkey',
      Wed: 'Fried rice + chicken',
      Thu: 'Spaghetti + beef',
      Fri: 'Okra and egusi soup',
    },
  },
  {
    weekNumber: 23,
    monthNumber: 6,
    days: {
      Mon: 'Boiled yam + egg sauce',
      Tue: 'Jollof rice + beef + plantain',
      Wed: 'Rice + beans + chicken',
      Thu: 'Fried plantain + fish',
      Fri: 'Egusi soup',
    },
  },
  {
    weekNumber: 24,
    monthNumber: 6,
    days: {
      Mon: 'Plantain + egg sauce + chicken',
      Tue: 'Fried rice + turkey',
      Wed: 'White rice + stew + beef',
      Thu: 'Boli + grilled fish',
      Fri: 'Efo Riro',
    },
  },
  {
    weekNumber: 25,
    monthNumber: 6,
    days: {
      Mon: 'Fried yam + egg sauce + fish',
      Tue: 'Jollof rice + chicken + plantain',
      Wed: 'Beans + white rice + beef',
      Thu: 'Fried plantain + chicken',
      Fri: 'Egusi soup',
    },
  },
  {
    weekNumber: 26,
    monthNumber: 6,
    days: {
      Mon: 'Boli + grilled fish',
      Tue: 'White rice + stew + chicken',
      Wed: 'Spaghetti + beef + egg',
      Thu: 'Fried yam + peppered chicken',
      Fri: 'Efo Riro',
    },
  },
];

// Official Ingredients Dictionary per the authentic kitchen recipes
export const MEAL_INGREDIENTS_MAP: Record<string, string[]> = {
  'fried yam + egg sauce + fish': ['Yam', 'Eggs', 'Fish', 'Tomatoes', 'Pepper', 'Onions', 'Vegetable oil', 'Seasoning', 'Salt'],
  'jollof rice + chicken + plantain': ['Rice', 'Chicken', 'Plantain', 'Tomatoes', 'Tatashe', 'Pepper', 'Onions', 'Tomato paste', 'Vegetable oil', 'Curry', 'Thyme', 'Seasoning', 'Salt'],
  'beans + white rice + beef': ['Beans', 'Rice', 'Beef', 'Onions', 'Pepper', 'Vegetable oil', 'Seasoning', 'Salt'],
  'fried plantain + chicken': ['Plantain', 'Chicken', 'Onions', 'Pepper', 'Vegetable oil', 'Seasoning', 'Salt'],
  'egusi soup': ['Egusi', 'Assorted meat', 'Fish', 'Ugu/spinach', 'Palm oil', 'Pepper', 'Onions', 'Crayfish', 'Locust beans', 'Seasoning', 'Salt'],
  'boli + grilled fish': ['Plantain', 'Fish', 'Pepper', 'Onions', 'Palm oil', 'Seasoning', 'Salt'],
  'white rice + stew + chicken': ['Rice', 'Chicken', 'Tomatoes', 'Tatashe', 'Pepper', 'Onions', 'Tomato paste', 'Vegetable oil', 'Seasoning', 'Salt'],
  'spaghetti + beef + egg': ['Spaghetti', 'Beef', 'Eggs', 'Tomatoes', 'Pepper', 'Onions', 'Vegetable oil', 'Seasoning', 'Salt'],
  'fried yam + peppered chicken': ['Yam', 'Chicken', 'Pepper', 'Tomatoes', 'Onions', 'Vegetable oil', 'Seasoning', 'Salt'],
  'efo riro': ['Efo/shoko', 'Assorted meat', 'Fish', 'Palm oil', 'Pepper', 'Tomatoes', 'Onions', 'Crayfish', 'Locust beans', 'Seasoning', 'Salt'],
  'boiled yam + egg sauce + fish': ['Yam', 'Eggs', 'Fish', 'Tomatoes', 'Pepper', 'Onions', 'Vegetable oil', 'Seasoning', 'Salt'],
  'fried rice + chicken': ['Rice', 'Chicken', 'Carrots', 'Green peas', 'Sweet corn', 'Green beans', 'Spring onions', 'Liver', 'Curry', 'Vegetable oil', 'Seasoning', 'Salt'],
  'jollof rice + beef + plantain': ['Rice', 'Beef', 'Plantain', 'Tomatoes', 'Tatashe', 'Pepper', 'Onions', 'Tomato paste', 'Vegetable oil', 'Curry', 'Thyme', 'Seasoning', 'Salt'],
  'boli + fish': ['Plantain', 'Fish', 'Pepper', 'Onions', 'Palm oil', 'Seasoning', 'Salt'],
  'okra soup': ['Okra', 'Assorted meat', 'Fish', 'Palm oil', 'Pepper', 'Onions', 'Crayfish', 'Locust beans', 'Ugu/spinach', 'Seasoning', 'Salt'],
  'plantain + egg sauce + chicken': ['Plantain', 'Eggs', 'Chicken', 'Tomatoes', 'Pepper', 'Onions', 'Vegetable oil', 'Seasoning', 'Salt'],
  'white rice + beans + beef': ['Rice', 'Beans', 'Beef', 'Onions', 'Pepper', 'Vegetable oil', 'Seasoning', 'Salt'],
  'spaghetti + chicken': ['Spaghetti', 'Chicken', 'Tomatoes', 'Pepper', 'Onions', 'Vegetable oil', 'Seasoning', 'Salt'],
  'fried rice + turkey + plantain': ['Rice', 'Turkey', 'Plantain', 'Carrots', 'Peas', 'Sweet corn', 'Green beans', 'Spring onions', 'Curry', 'Vegetable oil', 'Seasoning', 'Salt'],
  'ogbono soup': ['Ogbono', 'Assorted meat', 'Fish', 'Ugu/spinach', 'Palm oil', 'Pepper', 'Onions', 'Crayfish', 'Locust beans', 'Seasoning', 'Salt'],
  'jollof rice + turkey + plantain': ['Rice', 'Turkey', 'Plantain', 'Tomatoes', 'Tatashe', 'Pepper', 'Onions', 'Tomato paste', 'Vegetable oil', 'Curry', 'Thyme', 'Seasoning', 'Salt'],
  'beans + rice + chicken': ['Beans', 'Rice', 'Chicken', 'Onions', 'Pepper', 'Vegetable oil', 'Seasoning', 'Salt'],
  'bitterleaf soup (ofe onugbu)': ['Bitterleaf', 'Assorted meat', 'Stockfish', 'Dry fish', 'Cocoyam', 'Palm oil', 'Pepper', 'Onions', 'Crayfish', 'Seasoning', 'Salt'],
  'boiled sweet potato + egg sauce': ['Sweet potatoes', 'Eggs', 'Tomatoes', 'Pepper', 'Onions', 'Vegetable oil', 'Seasoning', 'Salt'],
  'white rice + stew + beef': ['Rice', 'Beef', 'Tomatoes', 'Tatashe', 'Pepper', 'Onions', 'Tomato paste', 'Vegetable oil', 'Seasoning', 'Salt'],
  'afang soup': ['Afang leaves', 'Waterleaf', 'Assorted meat', 'Stockfish', 'Dry fish', 'Palm oil', 'Pepper', 'Onions', 'Crayfish', 'Seasoning', 'Salt'],
  'fried rice + beef': ['Rice', 'Beef', 'Carrots', 'Peas', 'Sweet corn', 'Green beans', 'Spring onions', 'Liver', 'Curry', 'Vegetable oil', 'Seasoning', 'Salt'],
  'ofada rice + ayamase + egg': ['Ofada rice', 'Green peppers', 'Green scotch bonnet', 'Onions', 'Eggs', 'Palm oil', 'Locust beans', 'Seasoning', 'Salt'],
  'edikang ikong': ['Pumpkin leaves', 'Waterleaf', 'Assorted meat', 'Stockfish', 'Dry fish', 'Palm oil', 'Pepper', 'Onions', 'Crayfish', 'Seasoning', 'Salt'],
  'fried plantain + egg + chicken': ['Plantain', 'Eggs', 'Chicken', 'Pepper', 'Onions', 'Vegetable oil', 'Seasoning', 'Salt'],
  'jollof rice + turkey': ['Rice', 'Turkey', 'Tomatoes', 'Tatashe', 'Pepper', 'Onions', 'Tomato paste', 'Vegetable oil', 'Curry', 'Thyme', 'Seasoning', 'Salt'],
  'boiled yam + peppered fish': ['Yam', 'Fish', 'Tomatoes', 'Pepper', 'Onions', 'Vegetable oil', 'Seasoning', 'Salt'],
  'oha soup': ['Oha leaves', 'Assorted meat', 'Stockfish', 'Dry fish', 'Cocoyam', 'Palm oil', 'Pepper', 'Onions', 'Crayfish', 'Seasoning', 'Salt'],
  'fried yam + fish + egg sauce': ['Yam', 'Fish', 'Eggs', 'Tomatoes', 'Pepper', 'Onions', 'Vegetable oil', 'Seasoning', 'Salt'],
  'jollof rice + chicken': ['Rice', 'Chicken', 'Tomatoes', 'Tatashe', 'Pepper', 'Onions', 'Tomato paste', 'Vegetable oil', 'Curry', 'Thyme', 'Seasoning', 'Salt'],
  'beans + rice + beef': ['Beans', 'Rice', 'Beef', 'Onions', 'Pepper', 'Vegetable oil', 'Seasoning', 'Salt'],
  'boli + chicken': ['Plantain', 'Chicken', 'Pepper', 'Onions', 'Palm oil', 'Seasoning', 'Salt'],
  'banga soup': ['Palm fruit extract', 'Assorted meat', 'Fish', 'Stockfish', 'Dry fish', 'Pepper', 'Onions', 'Crayfish', 'Scent leaves', 'Seasoning', 'Salt'],
  'white rice + stew + turkey': ['Rice', 'Turkey', 'Tomatoes', 'Tatashe', 'Pepper', 'Onions', 'Tomato paste', 'Vegetable oil', 'Seasoning', 'Salt'],
  'spaghetti + beef': ['Spaghetti', 'Beef', 'Tomatoes', 'Pepper', 'Onions', 'Vegetable oil', 'Seasoning', 'Salt'],
  'okra and egusi soup': ['Okra', 'Egusi', 'Assorted meat', 'Fish', 'Palm oil', 'Pepper', 'Onions', 'Crayfish', 'Locust beans', 'Ugu/spinach', 'Seasoning', 'Salt'],
  'boiled yam + egg sauce': ['Yam', 'Eggs', 'Tomatoes', 'Pepper', 'Onions', 'Vegetable oil', 'Seasoning', 'Salt'],
  'rice + beans + chicken': ['Rice', 'Beans', 'Chicken', 'Onions', 'Pepper', 'Vegetable oil', 'Seasoning', 'Salt'],
  'fried plantain + fish': ['Plantain', 'Fish', 'Pepper', 'Onions', 'Vegetable oil', 'Seasoning', 'Salt'],
  'fried rice + turkey': ['Rice', 'Turkey', 'Carrots', 'Peas', 'Sweet corn', 'Green beans', 'Spring onions', 'Liver', 'Curry', 'Vegetable oil', 'Seasoning', 'Salt'],
};

// Helper to structure each meal according to user-defined categories
export function parseStructuredMeal(
  mealTitle: string,
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | DayOfWeek,
  dateStr: string,
  priceOverride?: number
): StructuredMeal {
  const titleLower = mealTitle.toLowerCase().trim();

  // Categorize based on ingredients and cuisine
  let mealCategory: MealCategory = 'Rice';
  let soup: string | undefined = undefined;

  // Extract soup if present
  if (titleLower.includes('egusi soup')) soup = 'Egusi Soup';
  else if (titleLower.includes('efo riro')) soup = 'Efo Riro';
  else if (titleLower.includes('okra and egusi soup')) soup = 'Okra & Egusi Soup';
  else if (titleLower.includes('okra soup')) soup = 'Okra Soup';
  else if (titleLower.includes('ogbono soup')) soup = 'Ogbono Soup';
  else if (titleLower.includes('bitterleaf soup')) soup = 'Bitterleaf Soup';
  else if (titleLower.includes('afang soup')) soup = 'Afang Soup';
  else if (titleLower.includes('edikang ikong')) soup = 'Edikang Ikong';
  else if (titleLower.includes('oha soup')) soup = 'Oha Soup';
  else if (titleLower.includes('banga soup')) soup = 'Banga Soup';
  else if (titleLower.includes('stew')) soup = 'Tomato Stew';
  else if (titleLower.includes('egg sauce')) soup = 'Egg Sauce';
  else if (titleLower.includes('ayamase')) soup = 'Ayamase (Designer Stew)';

  if (
    titleLower.includes('soup') ||
    titleLower.includes('efo riro') ||
    titleLower.includes('semo') ||
    titleLower.includes('eba') ||
    titleLower.includes('fufu') ||
    titleLower.includes('swallow')
  ) {
    mealCategory = 'Swallow';
  } else if (titleLower.includes('spaghetti') || titleLower.includes('pasta')) {
    mealCategory = 'Pasta';
  } else if (titleLower.includes('yam') || titleLower.includes('sweet potato')) {
    mealCategory = 'Yam';
  } else if (titleLower.includes('boli') || (titleLower.includes('plantain') && !titleLower.includes('rice') && !titleLower.includes('beans'))) {
    mealCategory = 'Plantain';
  } else if (titleLower.includes('beans') && titleLower.includes('rice')) {
    mealCategory = 'Rice & Beans';
  } else if (titleLower.includes('beans') || titleLower.includes('moi moi')) {
    mealCategory = 'Beans / Moi Moi';
  } else {
    mealCategory = 'Rice';
  }

  // Extract Base Ingredient
  let baseIngredient = 'Jollof Rice';
  if (mealCategory === 'Swallow') baseIngredient = 'Eba / Semo / Fufu';
  else if (titleLower.includes('fried rice')) baseIngredient = 'Fried Rice';
  else if (titleLower.includes('white rice')) baseIngredient = 'White Rice';
  else if (titleLower.includes('ofada rice')) baseIngredient = 'Ofada Rice';
  else if (titleLower.includes('spaghetti')) baseIngredient = 'Durum Spaghetti';
  else if (titleLower.includes('sweet potato')) baseIngredient = 'Boiled Sweet Potato';
  else if (titleLower.includes('boiled yam')) baseIngredient = 'Boiled White Yam';
  else if (titleLower.includes('fried yam')) baseIngredient = 'Crispy Fried Yam';
  else if (titleLower.includes('boli')) baseIngredient = 'Smoky Grilled Plantain (Boli)';
  else if (titleLower.includes('fried plantain')) baseIngredient = 'Fried Plantain (Dodo)';
  else if (titleLower.includes('beans')) baseIngredient = 'Honey Beans';

  // Extract Protein
  let protein = 'Grilled Chicken';
  if (titleLower.includes('grilled fish') || titleLower.includes('peppered fish') || titleLower.includes('fish')) {
    protein = 'Seasoned Fish';
  } else if (titleLower.includes('turkey')) {
    protein = 'Spiced Turkey';
  } else if (titleLower.includes('beef')) {
    protein = 'Tender Slow-Cooked Beef';
  } else if (titleLower.includes('assorted meat')) {
    protein = 'Assorted Meat & Fish';
  } else if (titleLower.includes('egg') && !titleLower.includes('chicken') && !titleLower.includes('beef') && !titleLower.includes('fish')) {
    protein = 'Farm-Fresh Boiled Eggs';
  } else if (titleLower.includes('chicken')) {
    protein = 'Spiced Chicken';
  }

  // Exact Recipe Ingredients if mapped
  let ingredients = MEAL_INGREDIENTS_MAP[titleLower];
  if (!ingredients) {
    ingredients = [baseIngredient, protein];
    if (soup) ingredients.push(soup);
    if (titleLower.includes('plantain') && !baseIngredient.includes('Plantain')) ingredients.push('Sweet Plantain');
  }

  // Photography URL
  let imageUrl = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800';
  if (mealCategory === 'Swallow') {
    imageUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800';
  } else if (mealCategory === 'Pasta') {
    imageUrl = 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=800';
  } else if (mealCategory === 'Yam') {
    imageUrl = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800';
  } else if (mealCategory === 'Plantain') {
    imageUrl = 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=800';
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
const STORAGE_KEY = '11to12_custom_meals_v3';

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

type MenuChangeListener = () => void;
const menuListeners: Set<MenuChangeListener> = new Set();

export function subscribeMenuChanges(listener: MenuChangeListener): () => void {
  menuListeners.add(listener);
  return () => {
    menuListeners.delete(listener);
  };
}

export function broadcastMenuUpdate(): void {
  menuListeners.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error('[Menu Sync error]:', err);
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('11to12_menu_updated'));
  }
}

// Real-Time Worldwide Cloud Sync via Firestore & Live Server API
if (typeof window !== 'undefined') {
  // 1. Instantly pull latest overrides from Firestore on startup
  try {
    getMenuOverridesFromFirestore()
      .then((remote) => {
        if (remote && typeof remote === 'object' && Object.keys(remote).length > 0) {
          Object.assign(customMealOverrides, remote);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(customMealOverrides));
          } catch {}
          broadcastMenuUpdate();
        }
      })
      .catch(() => {});
  } catch {}

  // 2. Also pull latest overrides from Server API on startup
  try {
    fetch(apiUrl('/api/meals'))
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.meals && typeof json.meals === 'object' && Object.keys(json.meals).length > 0) {
          Object.assign(customMealOverrides, json.meals);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(customMealOverrides));
          } catch {}
          broadcastMenuUpdate();
        }
      })
      .catch(() => {});
  } catch {}

  // 3. Real-time Firestore subscription via onSnapshot
  try {
    subscribeToMenuOverrides((remoteOverrides) => {
      if (remoteOverrides && typeof remoteOverrides === 'object') {
        Object.assign(customMealOverrides, remoteOverrides);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(customMealOverrides));
        } catch {}
        broadcastMenuUpdate();
      }
    });
  } catch (err) {
    console.warn('[Firebase menu subscription init notice]:', err);
  }

  // 4. Cross-Tab Local Storage Sync
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        Object.assign(customMealOverrides, parsed);
        broadcastMenuUpdate();
      } catch {}
    }
  });
}

export function updateCustomMealForDate(dateStr: string, meal: StructuredMeal) {
  customMealOverrides[dateStr] = meal;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customMealOverrides));
  } catch {
    // Ignore storage errors
  }
  broadcastMenuUpdate();

  // Worldwide instant sync 1: Backend Server Database & SSE broadcast
  try {
    fetch(apiUrl('/api/meals'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateStr, meal }),
    }).catch((err) => {
      console.warn('[Server API meal update notice]:', err);
    });
  } catch {}

  // Worldwide instant sync 2: Firestore Cloud Document
  saveMenuOverridesToFirestore(customMealOverrides).catch(() => {});
}

export function batchUpdateMeals(mealsMap: Record<string, StructuredMeal>) {
  Object.assign(customMealOverrides, mealsMap);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customMealOverrides));
  } catch {
    // Ignore storage errors
  }
  broadcastMenuUpdate();

  // Worldwide instant sync 1: Backend Server Database & SSE broadcast
  try {
    fetch(apiUrl('/api/meals/batch'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meals: mealsMap }),
    }).catch((err) => {
      console.warn('[Server API batch meals update notice]:', err);
    });
  } catch {}

  // Worldwide instant sync 2: Firestore Cloud Document
  saveMenuOverridesToFirestore(customMealOverrides).catch(() => {});
}

export function getCustomMealForDate(dateStr: string): StructuredMeal | undefined {
  return customMealOverrides[dateStr];
}

// Reference Base Date: Monday, December 7, 2026 = Week 1 Launch (Mon Dec 7: Fried yam + egg sauce + fish)
export const BASE_DATE = new Date(2026, 11, 7); // 11 is December (0-indexed)

export function parseYmd(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

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

  // UTC-normalized week difference to avoid DST/timezone hour offsets
  const d1 = Date.UTC(BASE_DATE.getFullYear(), BASE_DATE.getMonth(), BASE_DATE.getDate());
  const d2 = Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  const weekNum = Math.floor(diffDays / 7);

  const rotationIndex = ((weekNum % 26) + 26) % 26;
  const currentWeekPlan = TWENTY_SIX_WEEK_MENU[rotationIndex];

  const mealTitle = currentWeekPlan.days[dayShortKey] || 'Fried yam + egg sauce + fish';

  return parseStructuredMeal(mealTitle, dayFullName, dateStr);
}

export function getStructuredMealForDateStr(dateStr: string): StructuredMeal | null {
  if (customMealOverrides[dateStr]) {
    return customMealOverrides[dateStr];
  }
  return getStructuredMealForDate(parseYmd(dateStr));
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

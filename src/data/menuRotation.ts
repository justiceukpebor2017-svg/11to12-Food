import { DayOfWeek, MenuItem, MealCategory, StructuredMeal, SwallowType, MealOption } from '../types';
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
// Admin can explicitly set any date as holiday or delivering food
export const KNOWN_HOLIDAYS: Record<string, string> = {};

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

// Curated Nigerian lunch alternatives for Monday and Thursday dual-meal choices
export const MONDAY_ALTERNATIVE_MEALS: { name: string; category: MealCategory }[] = [
  { name: 'Smoky Jollof Rice + Peppered Chicken + Sweet Plantain', category: 'Rice' },
  { name: 'Special Fried Rice + Grilled Turkey + Coleslaw', category: 'Rice' },
  { name: 'Honey Beans + Sweet Fried Plantain + Fish', category: 'Beans / Moi Moi' },
  { name: 'Stir-fry Spaghetti + Shredded Beef + Fried Egg', category: 'Pasta' },
  { name: 'White Rice + Rich Tomato Stew + Spiced Chicken', category: 'Rice' },
  { name: 'Crispy Fried Yam + Peppered Turkey + Egg Sauce', category: 'Yam' },
  { name: 'Smoky Jollof Rice + Grilled Croaker Fish', category: 'Rice' },
  { name: 'Yam Pottage (Asaro) + Peppered Chicken', category: 'Yam' },
  { name: 'Special Fried Rice + Grilled Chicken + Dodo', category: 'Rice' },
  { name: 'Boiled Sweet Potato + Fish Egg Sauce', category: 'Yam' },
  { name: 'Ofada Rice + Designer Stew (Ayamase) + Boiled Egg', category: 'Rice' },
  { name: 'Honey Beans + Sweet Fried Plantain + Peppered Turkey', category: 'Beans / Moi Moi' },
  { name: 'Jollof Spaghetti + Slow-Cooked Beef + Dodo', category: 'Pasta' },
];

export const THURSDAY_ALTERNATIVE_MEALS: { name: string; category: MealCategory }[] = [
  { name: 'Native Jollof Rice (Iwuk Edesi) + Dry Fish + Boiled Egg', category: 'Rice' },
  { name: 'Yam Pottage (Asaro) + Tender Shredded Beef', category: 'Yam' },
  { name: 'Spicy Singapore Style Noodles + Turkey Bits', category: 'Pasta' },
  { name: 'Ofada Rice + Ayamase Sauce + Seasoned Beef', category: 'Rice' },
  { name: 'Fried Plantain (Dodo) + Peppered Gizzard + Fried Egg', category: 'Plantain' },
  { name: 'Jollof Spaghetti + Spiced Grilled Chicken', category: 'Pasta' },
  { name: 'White Rice + Fresh Fish Pepper Soup', category: 'Rice' },
  { name: 'Honey Beans + Dodo + Peppered Fish', category: 'Beans / Moi Moi' },
  { name: 'Crispy Fried Yam + Spiced Turkey + Tomato Sauce', category: 'Yam' },
  { name: 'Special Fried Rice + Peppered Beef + Dodo', category: 'Rice' },
  { name: 'Smoky Jollof Rice + Grilled Fish + Coleslaw', category: 'Rice' },
  { name: 'Yam Pottage (Asaro) + Peppered Turkey', category: 'Yam' },
  { name: 'White Rice + Rich Chicken Curry Sauce', category: 'Rice' },
];

export function getDefaultDualMealOptions(
  dayFullName: string,
  primaryTitle: string,
  dateStr: string,
  rotationIndex = 0,
  primaryImage?: string,
  primaryCategory: MealCategory = 'Rice',
  primaryPrice?: number
): MealOption[] {
  const isMonday = dayFullName === 'Monday' || dayFullName === 'Mon';
  const altList = isMonday ? MONDAY_ALTERNATIVE_MEALS : THURSDAY_ALTERNATIVE_MEALS;
  const alt = altList[Math.abs(rotationIndex) % altList.length] || altList[0];

  return [
    {
      id: 'opt-1',
      name: primaryTitle,
      category: primaryCategory,
      price: primaryPrice,
      imageUrl: primaryImage,
      hasCustomImage: Boolean(primaryImage),
      description: 'Chef Kitchen Selection (Option 1)',
    },
    {
      id: 'opt-2',
      name: alt.name,
      category: alt.category,
      price: primaryPrice,
      imageUrl: undefined,
      hasCustomImage: false,
      description: 'Alternative Kitchen Selection (Option 2)',
    },
  ];
}

// Helper to structure each meal according to user-defined categories
export function parseStructuredMeal(
  mealTitle: string,
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | DayOfWeek,
  dateStr: string,
  priceOverride?: number,
  customImageUrl?: string
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

  // Photography URL - only set if explicitly uploaded or linked by admin, otherwise undefined
  const imageUrl = customImageUrl && customImageUrl.trim() !== '' ? customImageUrl.trim() : undefined;

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
    hasCustomImage: Boolean(imageUrl),
    ingredients,
    hasDualOptions: false,
  };
}

// Global In-Memory and LocalStorage Overrides for Admin Menu edits (Shared in sync with homepage and subscriber dashboard)
const STORAGE_KEY = '11to12_custom_meals_v3';
const LEGACY_STORAGE_KEY = '11to12_custom_meals_v2';

function loadStoredOverrides(): Record<string, StructuredMeal> {
  if (typeof window === 'undefined') return {};
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      // Clean up legacy hardcoded stock photo URLs if they weren't explicitly custom uploaded
      Object.keys(parsed).forEach((key) => {
        if (
          parsed[key]?.imageUrl &&
          parsed[key].imageUrl.includes('photo-1546069901-ba9599a7e63c') &&
          !parsed[key]?.hasCustomImage
        ) {
          delete parsed[key].imageUrl;
        }
      });
      return parsed;
    }
  } catch {
    // Ignore storage errors
  }
  return {};
}

export function safeSaveStoredOverrides(overrides: Record<string, StructuredMeal>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (err) {
    console.warn('[LocalStorage Quota] Compacting custom meal overrides cache for quota safety...');
    try {
      const lightweight: Record<string, StructuredMeal> = {};
      Object.keys(overrides).forEach((k) => {
        const item = overrides[k];
        let cleanedImg = item.imageUrl;
        if (cleanedImg && cleanedImg.startsWith('data:') && cleanedImg.length > 2000) {
          cleanedImg = '';
        }
        let cleanedOptions = item.mealOptions;
        if (Array.isArray(cleanedOptions)) {
          cleanedOptions = cleanedOptions.map((opt) => {
            if (opt?.imageUrl && opt.imageUrl.startsWith('data:') && opt.imageUrl.length > 2000) {
              return { ...opt, imageUrl: '' };
            }
            return opt;
          });
        }
        lightweight[k] = { ...item, imageUrl: cleanedImg, mealOptions: cleanedOptions };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
    } catch {
      // Storage fully saturated, memory and server persist
    }
  }
}

export const customMealOverrides: Record<string, StructuredMeal> = loadStoredOverrides();

/**
 * Merges incoming remote overrides into local in-memory cache without
 * overwriting custom meal names or images with blank or stale data.
 */
export function mergeRemoteOverrides(incoming: Record<string, any>): void {
  if (!incoming || typeof incoming !== 'object') return;
  let hasChanges = false;

  Object.keys(incoming).forEach((dateKey) => {
    const remoteMeal = incoming[dateKey];
    if (!remoteMeal || typeof remoteMeal !== 'object') return;
    const localMeal = customMealOverrides[dateKey];

    if (!localMeal) {
      customMealOverrides[dateKey] = remoteMeal;
      hasChanges = true;
    } else {
      const finalMealName = remoteMeal.mealName?.trim() || localMeal.mealName;
      const finalImageUrl = remoteMeal.imageUrl || localMeal.imageUrl || '';
      const finalHasCustomImage = Boolean(finalImageUrl) || Boolean(remoteMeal.hasCustomImage || localMeal.hasCustomImage);

      const merged: StructuredMeal = {
        ...localMeal,
        ...remoteMeal,
        mealName: finalMealName,
        imageUrl: finalImageUrl,
        hasCustomImage: finalHasCustomImage,
        isHoliday: remoteMeal.isHoliday ?? localMeal.isHoliday,
        isNoDelivery: remoteMeal.isNoDelivery ?? localMeal.isNoDelivery,
      };

      if (Array.isArray(remoteMeal.mealOptions)) {
        merged.mealOptions = remoteMeal.mealOptions.map((opt: any, idx: number) => {
          const localOpt = localMeal.mealOptions?.[idx];
          const optName = opt?.name?.trim() || localOpt?.name?.trim() || (idx === 0 ? finalMealName : 'Option 2 Alternative');
          const optImg = opt?.imageUrl || localOpt?.imageUrl || (idx === 0 ? finalImageUrl : '');
          return {
            ...localOpt,
            ...opt,
            name: optName,
            imageUrl: optImg,
            hasCustomImage: Boolean(optImg),
          };
        });
      } else if (Array.isArray(localMeal.mealOptions)) {
        merged.mealOptions = localMeal.mealOptions;
      }

      customMealOverrides[dateKey] = merged;
      hasChanges = true;
    }
  });

  if (hasChanges) {
    safeSaveStoredOverrides(customMealOverrides);
    broadcastMenuUpdate();
  }
}

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

// Uploads a meal image data URL to the backend server and returns a lightweight static URL (/uploads/meal-xxx.jpg)
export async function uploadMealImageToServer(imageData: string, fileName?: string): Promise<string | null> {
  try {
    const res = await fetch(apiUrl('/api/upload-meal-image'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData, fileName }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.url) {
        return data.url;
      }
    }
  } catch (e) {
    console.warn('[Upload Image API error]:', e);
  }
  return null;
}

// Real-Time Worldwide Cloud Sync via Firestore & Live Server API
if (typeof window !== 'undefined') {
  // 1. Instantly pull latest overrides from Firestore on startup
  try {
    getMenuOverridesFromFirestore()
      .then((remote) => {
        if (remote && typeof remote === 'object' && Object.keys(remote).length > 0) {
          mergeRemoteOverrides(remote);
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
          mergeRemoteOverrides(json.meals);
        }
      })
      .catch(() => {});
  } catch {}

  // 3. Real-time Firestore subscription via onSnapshot
  try {
    subscribeToMenuOverrides((remoteOverrides) => {
      if (remoteOverrides && typeof remoteOverrides === 'object') {
        mergeRemoteOverrides(remoteOverrides);
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
        mergeRemoteOverrides(parsed);
      } catch {}
    }
  });
}

export function updateCustomMealForDate(dateStr: string, meal: StructuredMeal) {
  // Immediate optimistic update
  customMealOverrides[dateStr] = meal;
  safeSaveStoredOverrides(customMealOverrides);
  broadcastMenuUpdate();

  // Worldwide instant sync 1: Backend Server Database & SSE broadcast
  try {
    fetch(apiUrl('/api/meals'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateStr, meal }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.meal) {
          customMealOverrides[dateStr] = data.meal;
          safeSaveStoredOverrides(customMealOverrides);
          saveMenuOverridesToFirestore(customMealOverrides).catch(() => {});
          broadcastMenuUpdate();
        }
      })
      .catch((err) => {
        console.warn('[Server API meal update notice]:', err);
      });
  } catch {}

  // Worldwide instant sync 2: Firestore Cloud Document
  saveMenuOverridesToFirestore(customMealOverrides).catch(() => {});
}

export function batchUpdateMeals(mealsMap: Record<string, StructuredMeal>) {
  Object.assign(customMealOverrides, mealsMap);
  safeSaveStoredOverrides(customMealOverrides);
  broadcastMenuUpdate();

  // Worldwide instant sync 1: Backend Server Database & SSE broadcast
  try {
    fetch(apiUrl('/api/meals/batch'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meals: mealsMap }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.meals) {
          Object.assign(customMealOverrides, data.meals);
          safeSaveStoredOverrides(customMealOverrides);
          saveMenuOverridesToFirestore(customMealOverrides).catch(() => {});
          broadcastMenuUpdate();
        }
      })
      .catch((err) => {
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

  const dayNames: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
    'Monday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Monday',
  ];
  const dayShortKeys: Array<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri'> = ['Mon', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Mon'];
  const dayFullName = dayNames[dayOfWeek] || 'Monday';
  const dayShortKey = dayShortKeys[dayOfWeek] || 'Mon';

  // UTC-normalized week difference to avoid DST/timezone hour offsets
  const d1 = Date.UTC(BASE_DATE.getFullYear(), BASE_DATE.getMonth(), BASE_DATE.getDate());
  const d2 = Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  const weekNum = Math.floor(diffDays / 7);

  const rotationIndex = ((weekNum % 26) + 26) % 26;
  const currentWeekPlan = TWENTY_SIX_WEEK_MENU[rotationIndex];

  // If the admin has edited or overridden this specific date, return the overridden meal
  if (customMealOverrides[dateStr]) {
    const override = customMealOverrides[dateStr];
    return {
      ...override,
      hasDualOptions: false,
      mealOptions: undefined,
    };
  }

  const mealTitle = currentWeekPlan.days[dayShortKey] || 'Fried yam + egg sauce + fish';
  const structured = parseStructuredMeal(mealTitle, dayFullName, dateStr);
  return structured;
}

export function getStructuredMealForDateStr(dateStr: string): StructuredMeal | null {
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

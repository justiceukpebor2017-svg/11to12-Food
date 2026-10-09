/**
 * Meal Schedule Spreadsheet Import & Template Utility
 * Supports both Excel (.xlsx, .xls) and CSV (.csv) formats using the xlsx library.
 */
import * as XLSX from 'xlsx';
import { StructuredMeal, SwallowType, MealCategory } from '../types';
import { parseStructuredMeal, batchUpdateMeals } from '../data/menuRotation';

export interface ParsedMealRow {
  dateStr: string;
  foodTitle: string;
  category?: string;
  base?: string;
  ingredients?: string;
  rawRow: any;
}

export interface MealImportResult {
  success: boolean;
  importedCount: number;
  importedMeals: StructuredMeal[];
  errors: string[];
}

/**
 * Normalizes any date value from Excel/CSV (string, Date, or Excel serial number)
 * into a clean "YYYY-MM-DD" string.
 */
export function normalizeExcelDate(val: any): string | null {
  if (val === undefined || val === null || val === '') return null;

  // Case 1: Already Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Case 2: Number (Excel serial date number, e.g. 46363)
  if (typeof val === 'number') {
    try {
      const parsed = XLSX.SSF.parse_date_code(val);
      if (parsed) {
        const y = parsed.y;
        const m = String(parsed.m).padStart(2, '0');
        const d = String(parsed.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch {}
  }

  // Case 3: String formats (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, etc.)
  const str = String(val).trim();
  if (!str) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(str)) {
    const parts = str.split(/[\/\-]/).map(Number);
    // Standard international day/month/year
    const d = parts[0];
    const m = parts[1];
    const y = parts[2];
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // Fallback to JS Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

/**
 * Downloads the official Excel spreadsheet template with 1 default sample row.
 */
export function downloadMealExcelTemplate(format: 'xlsx' | 'csv' = 'xlsx'): void {
  const sampleData = [
    {
      'Date (YYYY-MM-DD)': '2026-12-07',
      'Main Food': 'Fried yam + egg sauce + fish',
      'Category': 'Yam',
      'Base': 'Crispy Fried Yam',
      'Ingredients': 'Yam, eggs, fish, tomatoes, pepper, onions, vegetable oil, seasoning, salt',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  // Set nice column widths
  worksheet['!cols'] = [
    { wch: 18 }, // Date
    { wch: 45 }, // Main Food
    { wch: 20 }, // Category
    { wch: 25 }, // Base
    { wch: 45 }, // Ingredients
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '11 to 12 Meal Schedule');

  if (format === 'csv') {
    XLSX.writeFile(workbook, '11to12_meal_schedule_template.csv');
  } else {
    XLSX.writeFile(workbook, '11to12_meal_schedule_template.xlsx');
  }
}

/**
 * Parses an uploaded Excel or CSV file Buffer/ArrayBuffer into StructuredMeal items
 * and automatically distributes them across the application.
 */
export async function parseAndApplyMealSpreadsheet(file: File): Promise<MealImportResult> {
  const errors: string[] = [];
  const buffer = await file.arrayBuffer();

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  } catch (err: any) {
    return {
      success: false,
      importedCount: 0,
      importedMeals: [],
      errors: [`Failed to read spreadsheet file: ${err.message || 'Invalid format'}`],
    };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      success: false,
      importedCount: 0,
      importedMeals: [],
      errors: ['The uploaded spreadsheet is empty. Please use the provided template.'],
    };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rawRows.length === 0) {
    return {
      success: false,
      importedCount: 0,
      importedMeals: [],
      errors: ['No meal rows found in spreadsheet.'],
    };
  }

  const dayNames: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  const newMealsMap: Record<string, StructuredMeal> = {};
  const importedList: StructuredMeal[] = [];

  rawRows.forEach((row, index) => {
    // Look up columns case-insensitively
    let rawDate: any = '';
    let rawFoodTitle: string = '';
    let rawCategory: string = '';
    let rawBase: string = '';
    let rawIngredients: string = '';

    Object.keys(row).forEach((col) => {
      const lower = col.toLowerCase().trim();
      if (lower.includes('date')) rawDate = row[col];
      else if (lower.includes('main food') || lower.includes('food') || lower.includes('meal') || lower.includes('title')) rawFoodTitle = String(row[col]).trim();
      else if (lower.includes('category')) rawCategory = String(row[col]).trim();
      else if (lower.includes('base')) rawBase = String(row[col]).trim();
      else if (lower.includes('ingredient')) rawIngredients = String(row[col]).trim();
    });

    if (!rawDate && !rawFoodTitle) {
      return; // Skip empty row
    }

    const dateStr = normalizeExcelDate(rawDate);
    if (!dateStr) {
      errors.push(`Row ${index + 2}: Invalid date "${rawDate}". Expected YYYY-MM-DD.`);
      return;
    }

    if (!rawFoodTitle) {
      errors.push(`Row ${index + 2} (${dateStr}): Missing Food Title.`);
      return;
    }

    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      errors.push(`Row ${index + 2} (${dateStr}): Falls on a weekend. 11 to 12 operates Monday to Friday.`);
      return;
    }

    const dayName = dayNames[dayOfWeek];

    // Determine category matching MealCategory union
    let category: MealCategory = 'Rice';
    const lowerTitle = rawFoodTitle.toLowerCase();
    const lowerCat = rawCategory.toLowerCase();

    if (lowerCat.includes('swallow') || lowerTitle.includes('swallow') || lowerTitle.includes('egusi') || lowerTitle.includes('efo') || lowerTitle.includes('ogbono') || lowerTitle.includes('semo') || lowerTitle.includes('eba') || lowerTitle.includes('fufu')) {
      category = 'Swallow';
    } else if (lowerCat.includes('bean') || lowerTitle.includes('aganyin') || lowerTitle.includes('beans') || lowerTitle.includes('moi moi')) {
      category = 'Beans / Moi Moi';
    } else if (lowerCat.includes('pasta') || lowerCat.includes('spag') || lowerTitle.includes('spaghetti') || lowerTitle.includes('pasta')) {
      category = 'Pasta';
    } else if (lowerCat.includes('yam') || lowerTitle.includes('yam') || lowerTitle.includes('porridge') || lowerTitle.includes('boli')) {
      category = 'Yam';
    } else if (lowerCat.includes('plantain') || lowerTitle.includes('plantain')) {
      category = 'Plantain';
    } else if (lowerCat.includes('soup') || lowerTitle.includes('soup')) {
      category = 'Rice + Soup';
    } else if (lowerTitle.includes('beans') && lowerTitle.includes('rice')) {
      category = 'Rice & Beans';
    }

    // Default swallow options if swallow
    const swallowOptions: SwallowType[] | undefined = category === 'Swallow' ? ['Eba', 'Semo', 'Fufu'] : undefined;

    // Use parseStructuredMeal or create structured meal
    const structured: StructuredMeal = {
      id: `meal-${dateStr}`,
      dateStr,
      day: dayName as any,
      mealName: rawFoodTitle,
      mealCategory: category,
      baseIngredient: rawBase || rawFoodTitle,
      swallowOptions,
      ingredients: rawIngredients ? rawIngredients.split(',').map((s) => s.trim()) : undefined,
    };

    newMealsMap[dateStr] = structured;
    importedList.push(structured);
  });

  if (importedList.length === 0) {
    return {
      success: false,
      importedCount: 0,
      importedMeals: [],
      errors: errors.length > 0 ? errors : ['No valid workday meal rows were processed from spreadsheet.'],
    };
  }

  // Apply batch update: updates memory, localStorage, server, and broadcasts real-time everywhere
  batchUpdateMeals(newMealsMap);

  return {
    success: true,
    importedCount: importedList.length,
    importedMeals: importedList,
    errors,
  };
}

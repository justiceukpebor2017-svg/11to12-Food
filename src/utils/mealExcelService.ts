/**
 * Meal Schedule Spreadsheet Import & Template Utility
 * Accommodates dual meal options (Option 1 & Option 2), Swallow indicator flags,
 * and Holiday indications for the 8-week menu schedule.
 * Supports both Excel (.xlsx, .xls) and CSV (.csv) formats using the xlsx library.
 */
import * as XLSX from 'xlsx';
import { StructuredMeal } from '../types';
import {
  updateCanonicalOptionsForDate,
  CANONICAL_8_WEEKS_MENU,
  CANONICAL_DATES_MAP,
  customMealOverrides,
  isMealTitleSwallow,
} from '../data/menuRotation';

export interface ParsedMealRow {
  dateStr: string;
  option1: string;
  option1IsSwallow: boolean;
  option2: string;
  option2IsSwallow: boolean;
  isHoliday: boolean;
  holidayReason?: string;
  price?: number;
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
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  return null;
}

/**
 * Helper to check boolean value from spreadsheet cell string (YES, NO, TRUE, FALSE, 1, 0, etc.)
 */
function parseSpreadsheetBoolean(val: any): boolean {
  if (val === undefined || val === null) return false;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  const str = String(val).trim().toLowerCase();
  return str === 'yes' || str === 'y' || str === 'true' || str === '1' || str === 'swallow';
}

/**
 * Downloads the official Excel spreadsheet template pre-populated with all 40 workdays
 * of the 8-week menu schedule, with 2 meal options, swallow flags, and holiday indications.
 */
export function downloadMealExcelTemplate(format: 'xlsx' | 'csv' = 'xlsx'): void {
  const rows: Array<Record<string, any>> = [];

  // Iterate over all 8 canonical weeks
  CANONICAL_8_WEEKS_MENU.forEach((week) => {
    week.days.forEach((day) => {
      const canonical = CANONICAL_DATES_MAP[day.dateStr];
      const override = customMealOverrides[day.dateStr];

      const opt1 = override?.mealOptions?.[0]?.name || (override as any)?.option1 || canonical?.option1 || day.option1;
      const opt2 = override?.mealOptions?.[1]?.name || (override as any)?.option2 || canonical?.option2 || day.option2;
      const isHoliday = override?.isHoliday !== undefined ? Boolean(override.isHoliday) : Boolean(canonical?.isHoliday ?? day.isHoliday);
      const holidayReason = override?.holidayName || canonical?.holidayName || day.holidayName || '';
      const opt1Swallow = override?.option1IsSwallow !== undefined
        ? Boolean(override.option1IsSwallow)
        : (canonical?.option1IsSwallow !== undefined ? Boolean(canonical.option1IsSwallow) : isMealTitleSwallow(opt1));
      const opt2Swallow = override?.option2IsSwallow !== undefined
        ? Boolean(override.option2IsSwallow)
        : (canonical?.option2IsSwallow !== undefined ? Boolean(canonical.option2IsSwallow) : isMealTitleSwallow(opt2));
      const price = override?.price || 2900;

      rows.push({
        'Date (YYYY-MM-DD)': day.dateStr,
        'Day': day.dayShort,
        'Option 1 Meal Name': opt1,
        'Option 1 Swallow? (YES/NO)': opt1Swallow ? 'YES' : 'NO',
        'Option 2 Meal Name': opt2,
        'Option 2 Swallow? (YES/NO)': opt2Swallow ? 'YES' : 'NO',
        'Is Holiday? (YES/NO)': isHoliday ? 'YES' : 'NO',
        'Holiday Reason': holidayReason,
        'Price (NGN)': price,
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  // Column widths
  worksheet['!cols'] = [
    { wch: 18 }, // Date
    { wch: 8 },  // Day
    { wch: 45 }, // Option 1 Meal Name
    { wch: 28 }, // Option 1 Swallow?
    { wch: 45 }, // Option 2 Meal Name
    { wch: 28 }, // Option 2 Swallow?
    { wch: 22 }, // Is Holiday?
    { wch: 30 }, // Holiday Reason
    { wch: 14 }, // Price
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
 * with dual options, swallow flags, and holiday indications, and applies them worldwide.
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

  const importedList: StructuredMeal[] = [];

  rawRows.forEach((row, index) => {
    let rawDate: any = '';
    let rawOpt1: string = '';
    let rawOpt1Swallow: any = '';
    let rawOpt2: string = '';
    let rawOpt2Swallow: any = '';
    let rawIsHoliday: any = '';
    let rawHolidayReason: string = '';
    let rawPrice: any = '';
    let legacyFood: string = '';

    Object.keys(row).forEach((col) => {
      const lower = col.toLowerCase().trim();
      if (lower.includes('date')) {
        rawDate = row[col];
      } else if (lower.includes('option 1 swallow') || lower.includes('opt 1 swallow') || lower.includes('option1 swallow') || lower.includes('option 1 is swallow')) {
        rawOpt1Swallow = row[col];
      } else if (lower.includes('option 2 swallow') || lower.includes('opt 2 swallow') || lower.includes('option2 swallow') || lower.includes('option 2 is swallow')) {
        rawOpt2Swallow = row[col];
      } else if (lower.includes('option 1') || lower.includes('opt 1') || lower.includes('option1')) {
        rawOpt1 = String(row[col]).trim();
      } else if (lower.includes('option 2') || lower.includes('opt 2') || lower.includes('option2')) {
        rawOpt2 = String(row[col]).trim();
      } else if (lower.includes('holiday reason') || lower.includes('holiday name')) {
        rawHolidayReason = String(row[col]).trim();
      } else if (lower.includes('holiday')) {
        rawIsHoliday = row[col];
      } else if (lower.includes('price') || lower.includes('fee') || lower.includes('cost')) {
        rawPrice = row[col];
      } else if (lower.includes('main food') || lower.includes('food') || lower.includes('meal')) {
        legacyFood = String(row[col]).trim();
      }
    });

    if (!rawDate && !rawOpt1 && !rawOpt2 && !legacyFood) {
      return; // Skip empty row
    }

    const dateStr = normalizeExcelDate(rawDate);
    if (!dateStr) {
      errors.push(`Row ${index + 2}: Invalid date "${rawDate}". Expected YYYY-MM-DD.`);
      return;
    }

    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      errors.push(`Row ${index + 2} (${dateStr}): Falls on a weekend. 11 to 12 operates Monday to Friday.`);
      return;
    }

    // Determine Holiday status
    const isHolidayExplicit = parseSpreadsheetBoolean(rawIsHoliday);
    const isHolidayFromReason = Boolean(rawHolidayReason && rawHolidayReason.toLowerCase() !== 'no');
    const isHoliday = isHolidayExplicit || isHolidayFromReason;
    const holidayName = isHoliday ? (rawHolidayReason || 'Holiday (No Service)') : undefined;

    // Determine Option 1 and Option 2
    let opt1 = rawOpt1 || legacyFood;
    let opt2 = rawOpt2;

    // Fallbacks if one option is missing and not a holiday
    if (!opt1 && !isHoliday) {
      const canonical = CANONICAL_DATES_MAP[dateStr];
      opt1 = canonical?.option1 || 'Chef Special Lunch';
    }
    if (!opt2 && !isHoliday) {
      const canonical = CANONICAL_DATES_MAP[dateStr];
      opt2 = canonical?.option2 || opt1;
    }

    // Determine swallow flags
    const opt1IsSwallow = rawOpt1Swallow !== ''
      ? parseSpreadsheetBoolean(rawOpt1Swallow)
      : isMealTitleSwallow(opt1);

    const opt2IsSwallow = rawOpt2Swallow !== ''
      ? parseSpreadsheetBoolean(rawOpt2Swallow)
      : isMealTitleSwallow(opt2);

    // Determine price
    const priceNum = typeof rawPrice === 'number' ? rawPrice : Number(String(rawPrice).replace(/[^\d.]/g, ''));
    const finalPrice = priceNum > 0 ? priceNum : 2900;

    // Apply update to canonical, local state, and broadcast
    const meal = updateCanonicalOptionsForDate(
      dateStr,
      opt1 || 'Holiday',
      opt2 || 'Holiday',
      isHoliday,
      holidayName,
      finalPrice,
      opt1IsSwallow,
      opt2IsSwallow
    );

    importedList.push(meal);
  });

  if (importedList.length === 0) {
    return {
      success: false,
      importedCount: 0,
      importedMeals: [],
      errors: errors.length > 0 ? errors : ['No valid workday meal rows were processed from spreadsheet.'],
    };
  }

  return {
    success: true,
    importedCount: importedList.length,
    importedMeals: importedList,
    errors,
  };
}

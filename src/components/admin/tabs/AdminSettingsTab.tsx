import React, { useState, useEffect, useRef } from 'react';
import {
  StructuredMeal,
  DEFAULT_CATEGORY_PRICES,
  PER_DAY_FEE,
  LaunchSettings,
  calculateMealPrice,
  MealCategory,
  MealOption,
} from '../../../types';
import {
  TWENTY_SIX_WEEK_MENU,
  BASE_DATE,
  getStructuredMealForDate,
  updateCustomMealForDate,
  subscribeMenuChanges,
  uploadMealImageToServer,
} from '../../../data/menuRotation';
import { downloadMealExcelTemplate, parseAndApplyMealSpreadsheet } from '../../../utils/mealExcelService';
import {
  UtensilsCrossed,
  DollarSign,
  CreditCard,
  User,
  CheckCircle2,
  Calendar,
  Save,
  X,
  Plus,
  AlertCircle,
  Lock,
  ChevronLeft,
  ChevronRight,
  Shield,
  Rocket,
  BarChart3,
  ExternalLink,
  Activity,
  Upload,
  FileSpreadsheet,
  Sparkles,
  Image as ImageIcon,
  Trash2,
  Camera,
} from 'lucide-react';
import { getMeasurementId, setMeasurementId, trackEvent } from '../../../utils/analytics';
import {
  getPricingSettings,
  updatePricingSettings,
  PricingSettings,
  DEFAULT_PRICING_SETTINGS,
} from '../../../config/pricingConfig';
import { liveSync } from '../../../services/liveSyncService';

// Client-side image compressor for lightweight storage and fast syncing
function compressMealImage(file: File, maxDim = 600, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface AdminSettingsTabProps {
  launchSettings?: LaunchSettings;
  onUpdateLaunchSettings?: (settings: LaunchSettings) => void;
  onNavigateHome?: () => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  launchSettings,
  onUpdateLaunchSettings,
  onNavigateHome,
}) => {
  type SettingsSubTab = 'meals' | 'pricing' | 'payment' | 'account';
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('meals');

  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const showSaved = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  // --- 1. MEAL SETTINGS STATE ---
  const mealFileInputRef = useRef<HTMLInputElement>(null);
  const mealImageInputRef = useRef<HTMLInputElement>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [editingDateStr, setEditingDateStr] = useState<string | null>(null);
  const [editMealName, setEditMealName] = useState('');
  const [editMealCategory, setEditMealCategory] = useState<MealCategory>('Rice');
  const [editMealPrice, setEditMealPrice] = useState<number>(2900);
  const [editMealImageUrl, setEditMealImageUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Monday & Thursday Dual Meal Type - Option 2 state
  const [editOption2Name, setEditOption2Name] = useState('');
  const [editOption2Category, setEditOption2Category] = useState<MealCategory>('Rice');
  const [editOption2Price, setEditOption2Price] = useState<number>(2900);
  const [editOption2ImageUrl, setEditOption2ImageUrl] = useState<string>('');
  const [isUploadingOption2Image, setIsUploadingOption2Image] = useState(false);
  const [activeEditOptionTab, setActiveEditOptionTab] = useState<'opt1' | 'opt2'>('opt1');
  const option2ImageInputRef = useRef<HTMLInputElement>(null);

  const [editIsUnavailable, setEditIsUnavailable] = useState(false);
  const [quickDateInput, setQuickDateInput] = useState<string>('2026-12-07');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMealImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const compressedDataUrl = await compressMealImage(file, 600, 0.78);
      // Upload to server disk storage to get a permanent, lightweight relative URL (/uploads/...)
      const uploadedUrl = await uploadMealImageToServer(compressedDataUrl, file.name);
      if (uploadedUrl) {
        setEditMealImageUrl(uploadedUrl);
        showSaved('Option 1 representation image uploaded! Click "Save and Distribute" below to apply.');
      } else {
        // Fallback to compressed data URL if offline/network issue
        setEditMealImageUrl(compressedDataUrl);
        showSaved('Option 1 representation image loaded! Click "Save and Distribute" below to apply.');
      }
    } catch (err) {
      console.error('Image compression or upload failed', err);
      showSaved('Failed to load image file. Please try another image or paste URL.');
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleOption2ImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingOption2Image(true);
    try {
      const compressedDataUrl = await compressMealImage(file, 600, 0.78);
      const uploadedUrl = await uploadMealImageToServer(compressedDataUrl, file.name);
      if (uploadedUrl) {
        setEditOption2ImageUrl(uploadedUrl);
        showSaved('Option 2 representation image uploaded! Click "Save and Distribute" below to apply.');
      } else {
        setEditOption2ImageUrl(compressedDataUrl);
        showSaved('Option 2 representation image loaded! Click "Save and Distribute" below to apply.');
      }
    } catch (err) {
      console.error('Option 2 image upload failed', err);
      showSaved('Failed to load Option 2 image file. Please paste URL.');
    } finally {
      setIsUploadingOption2Image(false);
      if (e.target) e.target.value = '';
    }
  };

  // Subscribe to real-time menu updates
  useEffect(() => {
    const unsub = subscribeMenuChanges(() => {
      setRefreshKey((k) => k + 1);
    });
    return () => unsub();
  }, []);

  const handleMealExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await parseAndApplyMealSpreadsheet(file);
      if (res.success) {
        showSaved(`Successfully adapted & auto-filled ${res.importedCount} dates! Distributed real-time everywhere.`);
      } else {
        showSaved(`Spreadsheet notice: ${res.errors.join('; ')}`);
      }
    } catch (err: any) {
      showSaved(`Failed to parse file: ${err.message || 'Check template'}`);
    }
    if (e.target) e.target.value = '';
  };

  // --- 2. PRICING STATE ---
  const [pricingCfg, setPricingCfg] = useState<PricingSettings>(() => getPricingSettings());
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [prices, setPrices] = useState({
    Swallow: DEFAULT_CATEGORY_PRICES['Swallow'] || 3200,
    Rice: DEFAULT_CATEGORY_PRICES['Rice & Grains'] || 2900,
    Special: DEFAULT_CATEGORY_PRICES['Special Feast'] || 3500,
    Pasta: DEFAULT_CATEGORY_PRICES['Pasta & Noodles'] || 2900,
    Beans: DEFAULT_CATEGORY_PRICES['Beans & Delicacies'] || 2700,
  });
  const [perDayFee, setPerDayFee] = useState(PER_DAY_FEE || 500);
  const [launchDiscountActive, setLaunchDiscountActive] = useState(true);

  // --- 3. PAYMENT SETTINGS STATE ---
  const [bankName, setBankName] = useState('Moniepoint MFB / Wema Bank');
  const [accountName, setAccountName] = useState('11 TO 12 FOODS LTD');
  const [accountNumber, setAccountNumber] = useState('8026180680 / 7353969118');
  const [whatsappContact, setWhatsappContact] = useState('+234 802 618 0680');
  const [paymentEmail, setPaymentEmail] = useState('payments@11to12.food');
  const [paymentInstructions, setPaymentInstructions] = useState(
    'Please complete your bank transfer and send both the invoice slip and transaction receipt screenshot via WhatsApp or email.'
  );

  // --- 4. ADMIN ACCOUNT & LAUNCH SETTINGS ---
  const [adminName, setAdminName] = useState('Kitchen Administrator');
  const [adminEmail, setAdminEmail] = useState('admin@11to12.food');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Launch Date
  const [launchDateInput, setLaunchDateInput] = useState(launchSettings?.launchDate || '2026-12-07');
  const [isLaunchEnabled, setIsLaunchEnabled] = useState(launchSettings?.isEnabled ?? true);

  // Google Analytics
  const [gaInput, setGaInput] = useState(getMeasurementId());
  const [gaNotice, setGaNotice] = useState<string | null>(null);

  const handleSaveGa = (e: React.FormEvent) => {
    e.preventDefault();
    if (gaInput.trim()) {
      setMeasurementId(gaInput.trim());
      trackEvent('ga_id_updated', { measurement_id: gaInput.trim() });
      setGaNotice('Google Analytics Measurement ID updated successfully!');
      setTimeout(() => setGaNotice(null), 3500);
    }
  };

  // Helper to get dates for selected week
  const getDaysForWeek = (weekNum: number) => {
    const days: { day: string; dateStr: string; meal: StructuredMeal | null }[] = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    for (let i = 0; i < 5; i++) {
      const d = new Date(BASE_DATE);
      d.setDate(d.getDate() + (weekNum - 1) * 7 + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const meal = getStructuredMealForDate(d);
      days.push({ day: dayNames[i], dateStr, meal });
    }
    return days;
  };

  const weekDays = getDaysForWeek(selectedWeek);

  const handleStartEditMeal = (item: { day: string; dateStr: string; meal: StructuredMeal | null }) => {
    const [y, m, d] = item.dateStr.split('-').map(Number);
    const dayOfWeekIndex = new Date(y, m - 1, d).getDay();
    const isDual = dayOfWeekIndex === 1 || dayOfWeekIndex === 4 || Boolean(item.meal?.hasDualOptions);

    setEditingDateStr(item.dateStr);
    setActiveEditOptionTab('opt1');

    const opt1 = item.meal?.mealOptions?.[0];
    const opt2 = item.meal?.mealOptions?.[1];

    setEditMealName(opt1?.name || item.meal?.mealName || '');
    setEditMealCategory(opt1?.category || item.meal?.mealCategory || 'Rice');
    setEditMealPrice(opt1?.price || (item.meal ? calculateMealPrice(item.meal) : 2900));
    setEditMealImageUrl(opt1?.imageUrl || item.meal?.imageUrl || '');
    setEditIsUnavailable(item.meal?.isHoliday || item.meal?.isNoDelivery || false);

    if (isDual) {
      setEditOption2Name(
        opt2?.name ||
        (dayOfWeekIndex === 1
          ? 'Smoky Jollof Rice + Peppered Chicken + Sweet Plantain'
          : 'Native Jollof Rice (Iwuk Edesi) + Dry Fish + Boiled Egg')
      );
      setEditOption2Category(opt2?.category || 'Rice');
      setEditOption2Price(opt2?.price || (item.meal ? calculateMealPrice(item.meal) : 2900));
      setEditOption2ImageUrl(opt2?.imageUrl || '');
    } else {
      setEditOption2Name('');
      setEditOption2ImageUrl('');
    }
  };

  const handleStartEditByDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const existing = getStructuredMealForDate(new Date(y, m - 1, d));
    const dayOfWeekIndex = new Date(y, m - 1, d).getDay();
    const isDual = dayOfWeekIndex === 1 || dayOfWeekIndex === 4 || Boolean(existing?.hasDualOptions);

    setEditingDateStr(dateStr);
    setActiveEditOptionTab('opt1');

    const opt1 = existing?.mealOptions?.[0];
    const opt2 = existing?.mealOptions?.[1];

    setEditMealName(opt1?.name || existing?.mealName || 'Fried yam + egg sauce + fish');
    setEditMealCategory(opt1?.category || existing?.mealCategory || 'Rice');
    setEditMealPrice(opt1?.price || (existing ? calculateMealPrice(existing) : 2900));
    setEditMealImageUrl(opt1?.imageUrl || existing?.imageUrl || '');
    setEditIsUnavailable(existing?.isHoliday || existing?.isNoDelivery || false);

    if (isDual) {
      setEditOption2Name(
        opt2?.name ||
        (dayOfWeekIndex === 1
          ? 'Smoky Jollof Rice + Peppered Chicken + Sweet Plantain'
          : 'Native Jollof Rice (Iwuk Edesi) + Dry Fish + Boiled Egg')
      );
      setEditOption2Category(opt2?.category || 'Rice');
      setEditOption2Price(opt2?.price || (existing ? calculateMealPrice(existing) : 2900));
      setEditOption2ImageUrl(opt2?.imageUrl || '');
    } else {
      setEditOption2Name('');
      setEditOption2ImageUrl('');
    }
  };

  const handleSaveMealOverride = async () => {
    if (!editingDateStr) return;
    const [y, m, d] = editingDateStr.split('-').map(Number);
    const existing = getStructuredMealForDate(new Date(y, m - 1, d));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekIndex = new Date(y, m - 1, d).getDay();
    const dayName = (dayNames[dayOfWeekIndex] || 'Monday') as any;
    const isDual = dayOfWeekIndex === 1 || dayOfWeekIndex === 4 || Boolean(existing?.hasDualOptions);

    const parsedPrice = Number(editMealPrice) > 0 ? Number(editMealPrice) : 2900;
    
    // Auto-convert any base64 image data URL to permanent static URL on server
    let finalImageUrl = editMealImageUrl.trim();
    if (finalImageUrl.startsWith('data:image/')) {
      try {
        const uploaded = await uploadMealImageToServer(finalImageUrl);
        if (uploaded) {
          finalImageUrl = uploaded;
          setEditMealImageUrl(uploaded);
        }
      } catch (err) {
        console.warn('Image pre-upload notice:', err);
      }
    }

    let mealOptions: MealOption[] | undefined = undefined;
    if (isDual) {
      const parsedOpt2Price = Number(editOption2Price) > 0 ? Number(editOption2Price) : parsedPrice;
      let finalOpt2Image = editOption2ImageUrl.trim();
      if (finalOpt2Image.startsWith('data:image/')) {
        try {
          const uploadedOpt2 = await uploadMealImageToServer(finalOpt2Image);
          if (uploadedOpt2) {
            finalOpt2Image = uploadedOpt2;
            setEditOption2ImageUrl(uploadedOpt2);
          }
        } catch (err) {
          console.warn('Option 2 image pre-upload notice:', err);
        }
      }

      mealOptions = [
        {
          id: 'opt-1',
          name: editMealName.trim() || 'Option 1 Special',
          category: editMealCategory,
          price: parsedPrice,
          imageUrl: finalImageUrl || '',
          hasCustomImage: Boolean(finalImageUrl),
          description: 'Chef Kitchen Selection (Option 1)',
        },
        {
          id: 'opt-2',
          name: editOption2Name.trim() || 'Option 2 Special',
          category: editOption2Category,
          price: parsedOpt2Price,
          imageUrl: finalOpt2Image || '',
          hasCustomImage: Boolean(finalOpt2Image),
          description: 'Alternative Kitchen Selection (Option 2)',
        },
      ];
    }

    const updatedMeal: StructuredMeal = {
      ...(existing || {
        id: `meal-${editingDateStr}`,
        dateStr: editingDateStr,
        day: dayName,
        mealName: editMealName,
        mealCategory: editMealCategory,
      }),
      mealName: editMealName.trim() || (existing?.mealName ?? 'Daily Chef Special'),
      mealCategory: editMealCategory,
      price: parsedPrice,
      imageUrl: finalImageUrl || '',
      hasCustomImage: Boolean(finalImageUrl),
      isHoliday: editIsUnavailable,
      isNoDelivery: editIsUnavailable,
      holidayName: editIsUnavailable ? 'Holiday / No Delivery' : undefined,
      hasDualOptions: isDual,
      mealOptions: isDual ? mealOptions : existing?.mealOptions,
    };

    updateCustomMealForDate(editingDateStr, updatedMeal);
    setRefreshKey((prev) => prev + 1);
    setEditingDateStr(null);
    showSaved(`Saved & Distributed! Meal "${updatedMeal.mealName}"${isDual ? ' with 2 Meal Types' : ''} (₦${parsedPrice.toLocaleString()}) updated real-time across Website, Dashboard & Admin.`);
  };

  const handleSavePricing = async () => {
    setIsSavingPricing(true);
    try {
      updatePricingSettings(pricingCfg);
      await liveSync.updatePricingSettings(pricingCfg);
      showSaved('Pricing settings saved & broadcasted real-time to all devices!');
    } catch (err: any) {
      showSaved('Saved locally. Notice: ' + (err?.message || 'Sync queued'));
    } finally {
      setIsSavingPricing(false);
    }
  };

  const handleSavePaymentSettings = () => {
    showSaved('Payment settings saved successfully.');
  };

  const handleSaveAdminAccount = () => {
    if (newPassword) {
      if (newPassword.length < 6) {
        setPasswordError('Password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError('New passwords do not match.');
        return;
      }
    }
    setPasswordError(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showSaved('Admin account updated successfully.');
  };

  const handleSaveLaunchSettings = () => {
    if (onUpdateLaunchSettings) {
      onUpdateLaunchSettings({
        launchDate: launchDateInput,
        isEnabled: isLaunchEnabled,
      });
    }
    showSaved('Launch settings updated and synced with homepage.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Poppins']">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Settings</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Manage kitchen menu rotation, pricing, bank details, and admin profile
        </p>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* 4 Simple Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-zinc-200 pb-3">
        {[
          { id: 'meals' as SettingsSubTab, label: 'Meal Settings', icon: UtensilsCrossed },
          { id: 'pricing' as SettingsSubTab, label: 'Pricing', icon: DollarSign },
          { id: 'payment' as SettingsSubTab, label: 'Payment Settings', icon: CreditCard },
          { id: 'account' as SettingsSubTab, label: 'Admin & Launch', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-black text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- SUBTAB 1: MEAL SETTINGS --- */}
      {activeSubTab === 'meals' && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Manage Meal Calendar</h2>
              <p className="text-xs text-zinc-500">Edit dishes, upload Excel schedule, or mark dates unavailable. All updates sync real-time.</p>
            </div>

            {/* Hidden Excel File Input & Buttons */}
            <input
              type="file"
              ref={mealFileInputRef}
              onChange={handleMealExcelUpload}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => mealFileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                title="Upload Excel (.xlsx) or CSV meal schedule"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Excel Schedule</span>
              </button>

              <button
                type="button"
                onClick={() => downloadMealExcelTemplate('xlsx')}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                title="Download template with 1 default sample row"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sample Template</span>
              </button>

              {/* Week navigation */}
              <div className="flex items-center space-x-1.5 pl-2 border-l border-zinc-200">
                <button
                  onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
                  disabled={selectedWeek <= 1}
                  className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-zinc-800">
                  Week {selectedWeek} of 26
                </span>
                <button
                  onClick={() => setSelectedWeek(Math.min(26, selectedWeek + 1))}
                  disabled={selectedWeek >= 26}
                  className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Date Picker Bar to Pick Any Date Directly or Browse by Week */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#FF4C00]" />
              <span className="font-bold text-zinc-900">Pick Any Date to Update Meal & Pricing:</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                min="2026-12-07"
                value={quickDateInput}
                onChange={(e) => setQuickDateInput(e.target.value)}
                className="bg-white border border-zinc-300 rounded-xl px-3 py-1.5 font-bold text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
              />
              <button
                type="button"
                onClick={() => handleStartEditByDate(quickDateInput)}
                className="px-4 py-1.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold transition cursor-pointer shadow-xs"
              >
                Edit Selected Date
              </button>
            </div>
          </div>

          {/* Week Days Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {weekDays.map((item) => {
              const currentPrice = item.meal ? calculateMealPrice(item.meal) : 2900;
              const isHoliday = item.meal?.isHoliday || item.meal?.isNoDelivery;
              const isDual = item.day === 'Monday' || item.day === 'Thursday' || Boolean(item.meal?.hasDualOptions);
              const opt1 = item.meal?.mealOptions?.[0];
              const opt2 = item.meal?.mealOptions?.[1];

              return (
                <div
                  key={item.dateStr}
                  className={`p-4 rounded-2xl border space-y-3 flex flex-col justify-between transition ${
                    isHoliday
                      ? 'bg-amber-50/70 border-amber-200'
                      : isDual
                      ? 'bg-[#FAF7F2] border-orange-200/90 shadow-2xs'
                      : 'bg-[#FAF7F2] border-zinc-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-zinc-900">{item.day}</span>
                        {isDual && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-orange-100 text-[#FF4C00] px-1.5 py-0.5 rounded-full">
                            2 Meals
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">{item.dateStr}</span>
                    </div>

                    {/* Dual Meal Day Display (Monday & Thursday) */}
                    {isDual && !isHoliday ? (
                      <div className="mt-2.5 space-y-2">
                        {/* Option 1 */}
                        <div className="p-2 rounded-xl bg-white border border-zinc-200/90 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider text-[#FF4C00] bg-orange-50 px-1.5 py-0.5 rounded">
                              Option 1
                            </span>
                            <span className="text-[10px] font-black text-zinc-800">
                              ₦{(opt1?.price || currentPrice).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            {opt1?.imageUrl || item.meal?.imageUrl ? (
                              <img
                                src={opt1?.imageUrl || item.meal?.imageUrl}
                                alt={opt1?.name || item.meal?.mealName || 'Option 1'}
                                className="w-6 h-6 rounded-md object-cover border border-zinc-200 shrink-0"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-md bg-zinc-100 text-zinc-400 flex items-center justify-center shrink-0">
                                <ImageIcon className="w-3 h-3" />
                              </div>
                            )}
                            <span className="text-[11px] font-bold text-zinc-800 line-clamp-1 leading-tight">
                              {opt1?.name || item.meal?.mealName || 'Option 1'}
                            </span>
                          </div>
                        </div>

                        {/* Option 2 */}
                        <div className="p-2 rounded-xl bg-white border border-blue-200/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              Option 2
                            </span>
                            <span className="text-[10px] font-black text-zinc-800">
                              ₦{(opt2?.price || currentPrice).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            {opt2?.imageUrl ? (
                              <img
                                src={opt2.imageUrl}
                                alt={opt2.name}
                                className="w-6 h-6 rounded-md object-cover border border-zinc-200 shrink-0"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-md bg-zinc-100 text-zinc-400 flex items-center justify-center shrink-0">
                                <ImageIcon className="w-3 h-3" />
                              </div>
                            )}
                            <span className="text-[11px] font-bold text-zinc-800 line-clamp-1 leading-tight">
                              {opt2?.name || 'Option 2 Choice'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center space-x-2">
                          {item.meal?.imageUrl ? (
                            <img
                              src={item.meal.imageUrl}
                              alt={item.meal.mealName}
                              className="w-7 h-7 rounded-md object-cover border border-zinc-200 shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-md bg-zinc-200/60 text-zinc-400 flex items-center justify-center shrink-0">
                              <ImageIcon className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <span className="text-xs font-bold text-zinc-800 line-clamp-2">
                            {item.meal?.mealName || 'No Meal'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[11px] font-black text-[#FF4C00]">
                            ₦{currentPrice.toLocaleString()}
                          </span>
                          {item.meal?.imageUrl ? (
                            <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                              Image attached
                            </span>
                          ) : (
                            <span className="text-[9px] text-zinc-400">Name only</span>
                          )}
                        </div>
                      </div>
                    )}

                    {isHoliday ? (
                      <span className="mt-2 inline-block text-[9px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                        Holiday (No Delivery)
                      </span>
                    ) : (
                      <span className="mt-2 inline-block text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Delivering Food
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartEditMeal(item)}
                    className="w-full py-1.5 rounded-xl border border-zinc-300 hover:border-black text-zinc-800 hover:text-black font-semibold text-[11px] transition cursor-pointer bg-white shadow-2xs"
                  >
                    {isDual ? 'Edit Both Meal Types' : 'Edit Meal & Price'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Edit Meal Drawer / Modal: Pick a date, edit meal name, put price, choose holiday or delivery */}
          {editingDateStr && (() => {
            const [y, m, d] = editingDateStr.split('-').map(Number);
            const dow = new Date(y, m - 1, d).getDay();
            const existing = getStructuredMealForDate(new Date(y, m - 1, d));
            const isEditingDual = dow === 1 || dow === 4 || Boolean(existing?.hasDualOptions);

            return (
              <div className="p-5 rounded-2xl bg-zinc-50 border-2 border-black/80 space-y-4 shadow-sm animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-[#FF4C00]/10 text-[#FF4C00] flex items-center justify-center font-bold">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-zinc-900 block">
                          Edit Meal & Pricing for {editingDateStr}
                        </span>
                        {isEditingDual && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#FF4C00] px-2 py-0.5 rounded-full">
                            2 Meal Types (Customer Choice)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {isEditingDual
                          ? 'This date offers 2 meal options. Customers choose Option 1 or Option 2 in a popup.'
                          : 'Changes update immediately across user dashboard, marketing page & admin schedule.'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingDateStr(null)}
                    className="text-zinc-400 hover:text-zinc-600 cursor-pointer p-1 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Option 1 / Option 2 Tabs for Mondays & Thursdays */}
                {isEditingDual && (
                  <div className="flex items-center space-x-2 p-1.5 rounded-xl bg-zinc-200/70 border border-zinc-300">
                    <button
                      type="button"
                      onClick={() => setActiveEditOptionTab('opt1')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                        activeEditOptionTab === 'opt1'
                          ? 'bg-white text-zinc-900 shadow-xs border border-zinc-300'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF4C00]" />
                      <span>Option 1 (Primary Meal)</span>
                      {editMealName && (
                        <span className="text-[10px] text-zinc-400 font-normal truncate max-w-[140px]">
                          : {editMealName}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveEditOptionTab('opt2')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                        activeEditOptionTab === 'opt2'
                          ? 'bg-white text-zinc-900 shadow-xs border border-zinc-300'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <span>Option 2 (Alternative Meal)</span>
                      {editOption2Name && (
                        <span className="text-[10px] text-zinc-400 font-normal truncate max-w-[140px]">
                          : {editOption2Name}
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* TAB 1: OPTION 1 (or Standard Meal) */}
                {(!isEditingDual || activeEditOptionTab === 'opt1') && (
                  <div className="space-y-4">
                    {isEditingDual && (
                      <div className="flex items-center justify-between text-xs font-bold text-[#FF4C00] bg-orange-50 border border-orange-200 rounded-xl px-3 py-1.5">
                        <span>Editing Option 1 (Primary Kitchen Special)</span>
                        <span className="text-[10px] text-zinc-500">Will be first choice in customer modal</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {/* 1. Meal Name */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                          {isEditingDual ? 'Option 1: Meal Name' : 'Meal Name / Title'}
                        </label>
                        <input
                          type="text"
                          value={editMealName}
                          onChange={(e) => setEditMealName(e.target.value)}
                          placeholder="e.g. Jollof rice + chicken + plantain"
                          className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                        />
                      </div>

                      {/* 2. Meal Price */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                          {isEditingDual ? 'Option 1: Price (₦)' : 'Meal Price (₦)'}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-zinc-400 font-bold">₦</span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={editMealPrice}
                            onChange={(e) => setEditMealPrice(Number(e.target.value))}
                            placeholder="e.g. 2900"
                            className="w-full bg-white border border-zinc-300 rounded-xl pl-8 pr-3.5 py-2.5 text-xs font-black text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                          />
                        </div>
                        <span className="text-[10px] text-zinc-500 mt-1 block">
                          Customer pays: ₦{editMealPrice.toLocaleString()} + ₦{PER_DAY_FEE} desk drop = <strong>₦{(editMealPrice + PER_DAY_FEE).toLocaleString()}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Meal Representation Image */}
                    <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-800">
                            {isEditingDual ? 'Option 1 Image' : 'Meal Representation Image'}
                          </label>
                          <p className="text-[10px] text-zinc-500">
                            Upload an image file or paste a link. Appears on the home page price meter and popup modal.
                          </p>
                        </div>
                        {editMealImageUrl && (
                          <button
                            type="button"
                            onClick={() => setEditMealImageUrl('')}
                            className="inline-flex items-center space-x-1 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition cursor-pointer self-start sm:self-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove Image</span>
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <div>
                          <input
                            ref={mealImageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleMealImageFileChange}
                            className="hidden"
                          />
                          <button
                            type="button"
                            disabled={isUploadingImage}
                            onClick={() => mealImageInputRef.current?.click()}
                            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isUploadingImage ? 'Optimizing Image...' : 'Upload Image File'}</span>
                          </button>
                        </div>

                        <span className="text-[11px] text-zinc-400 font-semibold text-center sm:text-left">or</span>

                        <div className="flex-1 w-full">
                          <input
                            type="url"
                            value={editMealImageUrl}
                            onChange={(e) => setEditMealImageUrl(e.target.value)}
                            placeholder="Paste image URL (e.g. https://... or https://ibb.co/...)"
                            className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none focus:border-[#FF4C00] placeholder-zinc-400"
                          />
                        </div>
                      </div>

                      {editMealImageUrl ? (
                        <div className="mt-2 flex items-center space-x-3 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-200 shrink-0 border border-zinc-300">
                            <img
                              src={editMealImageUrl}
                              alt="Option 1 Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400';
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md mb-1">
                              ✓ Option 1 Image Attached
                            </span>
                            <p className="text-[11px] text-zinc-600 truncate font-mono">
                              {editMealImageUrl.startsWith('data:') ? 'Custom uploaded image file' : editMealImageUrl}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-zinc-50 border border-dashed border-zinc-300 text-center">
                          <p className="text-[11px] text-zinc-500 font-medium">
                            (No image attached — this option will display by title only)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: OPTION 2 (Only on Dual Days) */}
                {isEditingDual && activeEditOptionTab === 'opt2' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5">
                      <span>Editing Option 2 (Alternative Kitchen Special)</span>
                      <span className="text-[10px] text-zinc-500">Will be second choice in customer modal</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {/* Option 2 Name */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                          Option 2: Meal Name
                        </label>
                        <input
                          type="text"
                          value={editOption2Name}
                          onChange={(e) => setEditOption2Name(e.target.value)}
                          placeholder="e.g. Native Jollof Rice + Dry Fish + Boiled Egg"
                          className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-zinc-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      {/* Option 2 Price */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                          Option 2: Price (₦)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-zinc-400 font-bold">₦</span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={editOption2Price}
                            onChange={(e) => setEditOption2Price(Number(e.target.value))}
                            placeholder="e.g. 2900"
                            className="w-full bg-white border border-zinc-300 rounded-xl pl-8 pr-3.5 py-2.5 text-xs font-black text-zinc-900 focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        <span className="text-[10px] text-zinc-500 mt-1 block">
                          Customer pays: ₦{editOption2Price.toLocaleString()} + ₦{PER_DAY_FEE} desk drop = <strong>₦{(editOption2Price + PER_DAY_FEE).toLocaleString()}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Option 2 Representation Image */}
                    <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-800">
                            Option 2 Image
                          </label>
                          <p className="text-[10px] text-zinc-500">
                            Upload an image file or paste a link for Option 2.
                          </p>
                        </div>
                        {editOption2ImageUrl && (
                          <button
                            type="button"
                            onClick={() => setEditOption2ImageUrl('')}
                            className="inline-flex items-center space-x-1 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition cursor-pointer self-start sm:self-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove Image</span>
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <div>
                          <input
                            ref={option2ImageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleOption2ImageFileChange}
                            className="hidden"
                          />
                          <button
                            type="button"
                            disabled={isUploadingOption2Image}
                            onClick={() => option2ImageInputRef.current?.click()}
                            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isUploadingOption2Image ? 'Optimizing Image...' : 'Upload Image File'}</span>
                          </button>
                        </div>

                        <span className="text-[11px] text-zinc-400 font-semibold text-center sm:text-left">or</span>

                        <div className="flex-1 w-full">
                          <input
                            type="url"
                            value={editOption2ImageUrl}
                            onChange={(e) => setEditOption2ImageUrl(e.target.value)}
                            placeholder="Paste image URL (e.g. https://... or https://ibb.co/...)"
                            className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none focus:border-blue-600 placeholder-zinc-400"
                          />
                        </div>
                      </div>

                      {editOption2ImageUrl ? (
                        <div className="mt-2 flex items-center space-x-3 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-200 shrink-0 border border-zinc-300">
                            <img
                              src={editOption2ImageUrl}
                              alt="Option 2 Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400';
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md mb-1">
                              ✓ Option 2 Image Attached
                            </span>
                            <p className="text-[11px] text-zinc-600 truncate font-mono">
                              {editOption2ImageUrl.startsWith('data:') ? 'Custom uploaded image file' : editOption2ImageUrl}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-zinc-50 border border-dashed border-zinc-300 text-center">
                          <p className="text-[11px] text-zinc-500 font-medium">
                            (No image attached — Option 2 will display by title only)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Holiday / Delivering Food Toggle */}
                <div className="p-3.5 rounded-xl bg-white border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-zinc-900 block">
                      Delivery Status for this Day
                    </span>
                    <p className="text-[11px] text-zinc-500">
                      Choose if this date is a holiday or if 11 to 12 will be delivering food.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditIsUnavailable(false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        !editIsUnavailable
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      ✓ Delivering Food
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditIsUnavailable(true)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        editIsUnavailable
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      Holiday (No Delivery)
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
                  <p className="text-[11px] text-zinc-500 hidden sm:block">
                    Clicking <strong>Save and Distribute</strong> instantly updates {isEditingDual ? 'both meal options' : 'this meal'} across user dashboards, the website, and admin.
                  </p>
                  <div className="flex items-center space-x-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setEditingDateStr(null)}
                      className="px-4 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-600 hover:bg-zinc-100 cursor-pointer font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveMealOverride}
                      className="px-5 py-2 rounded-xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center space-x-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Save and Distribute</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      )}

      {/* --- SUBTAB 2: PRICING --- */}
      {activeSubTab === 'pricing' && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
          
          <div className="pb-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Manage Meal Pricing & Day Ranges</h2>
              <p className="text-xs text-zinc-500">Configure tiered day ranges, per-day rates, and 5-day package pricing</p>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-bold text-[#FF4C00]">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>Real-Time Live Sync Enabled</span>
            </div>
          </div>

          {/* Tiered Day Ranges & Package Pricing (Admin Configurable) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/40 border border-orange-200/80 space-y-4">
            <div>
              <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider block">
                Subscription Day Ranges & Decreasing Rate Tiers
              </span>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                The price per meal automatically reduces the more days a customer adds to their cart.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* 5-Day Flat Package */}
              <div className="p-3.5 rounded-xl bg-white border border-orange-200 shadow-2xs space-y-1.5">
                <span className="font-bold text-zinc-900 block text-xs">
                  5 Days Total Package Price (Flat)
                </span>
                <p className="text-[10px] text-zinc-500">
                  Activates Pay Now button when user reaches 5 workdays
                </p>
                <div className="flex items-center space-x-1 pt-1">
                  <span className="text-zinc-500 font-bold">₦</span>
                  <input
                    type="number"
                    value={pricingCfg.fiveDaysFlatTotal}
                    onChange={(e) =>
                      setPricingCfg({ ...pricingCfg, fiveDaysFlatTotal: Number(e.target.value) })
                    }
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-right text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                  />
                </div>
              </div>

              {/* 6 to 10 Days Tier */}
              <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-2xs space-y-1.5">
                <span className="font-bold text-zinc-900 block text-xs">
                  6 – 10 Days Tier (Rate Added / Day)
                </span>
                <p className="text-[10px] text-zinc-500">
                  Cost per day added above 5 days (e.g. ₦3,600)
                </p>
                <div className="flex items-center space-x-1 pt-1">
                  <span className="text-zinc-500 font-bold">₦</span>
                  <input
                    type="number"
                    value={pricingCfg.tier6to10Price}
                    onChange={(e) =>
                      setPricingCfg({ ...pricingCfg, tier6to10Price: Number(e.target.value) })
                    }
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-right text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                  />
                </div>
              </div>

              {/* 11 to 15 Days Tier */}
              <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-2xs space-y-1.5">
                <span className="font-bold text-zinc-900 block text-xs">
                  11 – 15 Days Tier (Rate Added / Day)
                </span>
                <p className="text-[10px] text-zinc-500">
                  Cost per day added above 10 days (e.g. ₦3,400)
                </p>
                <div className="flex items-center space-x-1 pt-1">
                  <span className="text-zinc-500 font-bold">₦</span>
                  <input
                    type="number"
                    value={pricingCfg.tier11to15Price}
                    onChange={(e) =>
                      setPricingCfg({ ...pricingCfg, tier11to15Price: Number(e.target.value) })
                    }
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-right text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                  />
                </div>
              </div>

              {/* 16 to 20 Days Tier */}
              <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-2xs space-y-1.5">
                <span className="font-bold text-zinc-900 block text-xs">
                  16 – 20 Days Tier (Rate Added / Day)
                </span>
                <p className="text-[10px] text-zinc-500">
                  Cost per day added above 15 days (e.g. ₦3,200)
                </p>
                <div className="flex items-center space-x-1 pt-1">
                  <span className="text-zinc-500 font-bold">₦</span>
                  <input
                    type="number"
                    value={pricingCfg.tier16to20Price}
                    onChange={(e) =>
                      setPricingCfg({ ...pricingCfg, tier16to20Price: Number(e.target.value) })
                    }
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-right text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                  />
                </div>
              </div>

              {/* 21+ Days Tier */}
              <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs space-y-1.5">
                <span className="font-bold text-zinc-900 block text-xs">
                  21+ Days Best Value (Rate Added / Day)
                </span>
                <p className="text-[10px] text-zinc-500">
                  Cost per day added above 20 days (e.g. ₦3,000)
                </p>
                <div className="flex items-center space-x-1 pt-1">
                  <span className="text-zinc-500 font-bold">₦</span>
                  <input
                    type="number"
                    value={pricingCfg.tier21PlusPrice}
                    onChange={(e) =>
                      setPricingCfg({ ...pricingCfg, tier21PlusPrice: Number(e.target.value) })
                    }
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-right text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                  />
                </div>
              </div>

              {/* Per-Day Delivery Fee Addition */}
              <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-2xs space-y-1.5">
                <span className="font-bold text-zinc-900 block text-xs">
                  Per-Day Delivery Fee Addition
                </span>
                <p className="text-[10px] text-zinc-500">
                  Desk drop delivery (₦0 = included free in meal price)
                </p>
                <div className="flex items-center space-x-1 pt-1">
                  <span className="text-zinc-500 font-bold">₦</span>
                  <input
                    type="number"
                    value={pricingCfg.deliveryFeePerDay}
                    onChange={(e) =>
                      setPricingCfg({ ...pricingCfg, deliveryFeePerDay: Number(e.target.value) })
                    }
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-right text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                  />
                </div>
              </div>
            </div>

            {/* Minimum Order Days Setting */}
            <div className="p-3.5 rounded-xl bg-white border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-zinc-900 block">Minimum Order Days Requirement</span>
                <p className="text-[11px] text-zinc-500">Customers must select at least this many days to calculate & pay</p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={pricingCfg.minOrderDays}
                  onChange={(e) => setPricingCfg({ ...pricingCfg, minOrderDays: Number(e.target.value) })}
                  className="w-20 bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-center text-zinc-900"
                />
                <span className="text-zinc-600 font-semibold">Days Minimum</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={isSavingPricing}
              onClick={handleSavePricing}
              className="px-6 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isSavingPricing ? (
                <span>Saving & Broadcasting...</span>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Pricing Settings</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}

      {/* --- SUBTAB 3: PAYMENT SETTINGS --- */}
      {activeSubTab === 'payment' && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
          
          <div className="pb-4 border-b border-zinc-100">
            <h2 className="text-base font-bold text-zinc-900">Payment Settings</h2>
            <p className="text-xs text-zinc-500">Bank account and verification contact displayed on customer invoices</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Account Name</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">WhatsApp Verification Contact</label>
              <input
                type="text"
                value={whatsappContact}
                onChange={(e) => setWhatsappContact(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Payment Email</label>
              <input
                type="email"
                value={paymentEmail}
                onChange={(e) => setPaymentEmail(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Payment Instructions</label>
              <textarea
                rows={3}
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSavePaymentSettings}
              className="px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
            >
              Save Payment Settings
            </button>
          </div>

        </div>
      )}

      {/* --- SUBTAB 4: ADMIN ACCOUNT & LAUNCH CONTROLS --- */}
      {activeSubTab === 'account' && (
        <div className="space-y-6">
          
          {/* Admin Account */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="pb-4 border-b border-zinc-100">
              <h2 className="text-base font-bold text-zinc-900">Admin Account</h2>
              <p className="text-xs text-zinc-500">Change administrator credentials and contact details</p>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Admin Name</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Admin Email</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep unchanged"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveAdminAccount}
                className="px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                Update Account
              </button>
            </div>
          </div>

          {/* Launch Controls */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="pb-3 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Official Launch Controls</h2>
                <p className="text-xs text-zinc-500">Control homepage pre-launch countdown & calendar gating</p>
              </div>
              <Rocket className="w-5 h-5 text-[#FF4C00]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Launch Date</label>
                <input
                  type="date"
                  value={launchDateInput}
                  onChange={(e) => setLaunchDateInput(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="launch-enabled"
                  checked={isLaunchEnabled}
                  onChange={(e) => setIsLaunchEnabled(e.target.checked)}
                  className="rounded text-[#FF4C00] cursor-pointer"
                />
                <label htmlFor="launch-enabled" className="text-xs text-zinc-800 font-semibold cursor-pointer">
                  Pre-Launch Gating Active (Uncheck once officially launched)
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveLaunchSettings}
                className="px-5 py-2.5 rounded-xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                Save Launch Settings
              </button>
            </div>
          </div>

          {/* Google Analytics (GA4) Tracking Card */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="pb-3 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF4C00] flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900">Google Analytics 4 (GA4)</h2>
                  <p className="text-xs text-zinc-500">Live traffic, real-time visitors, and conversion event tracking</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Tracking Active</span>
                </span>
                <a
                  href="https://analytics.google.com/analytics/web/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <span>Open GA4 Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {gaNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{gaNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveGa} className="space-y-4">
              <div className="max-w-md">
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Measurement ID (GA4 Property)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={gaInput}
                    onChange={(e) => setGaInput(e.target.value)}
                    placeholder="G-V5D8ZC0E8Z"
                    className="flex-1 bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 font-mono focus:outline-none focus:border-[#FF4C00]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-xs transition cursor-pointer"
                  >
                    Save ID
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Tag installed in &lt;head&gt; across all pages. Default: <code className="font-mono text-zinc-600">G-V5D8ZC0E8Z</code>
                </p>
              </div>
            </form>

            {/* Quick Instruction Guide */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
              <span className="font-bold text-zinc-900 block">How to check your analytics in Google Analytics:</span>
              <ol className="list-decimal list-inside space-y-1 text-zinc-600 text-[11px] leading-relaxed">
                <li>
                  Open <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="text-[#FF4C00] font-semibold hover:underline">analytics.google.com</a> and sign in with your Google account.
                </li>
                <li>
                  In the left navigation menu, click <strong>Reports → Realtime</strong> to watch visitors in live real-time (last 30 mins, location, device, and active pages).
                </li>
                <li>
                  Navigate to <strong>Engagement → Events</strong> to inspect automated funnel conversions:
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 font-mono text-[10px] text-zinc-700">
                    <div>• <strong className="text-zinc-900">page_view:</strong> Page and tab visits</div>
                    <div>• <strong className="text-zinc-900">generate_lead:</strong> Waitlist sign-ups</div>
                    <div>• <strong className="text-zinc-900">calculate_plan:</strong> Custom plan builder</div>
                    <div>• <strong className="text-zinc-900">begin_checkout:</strong> Checkout opened</div>
                    <div>• <strong className="text-zinc-900">purchase:</strong> Confirmed subscriptions</div>
                    <div>• <strong className="text-zinc-900">walkthrough_progress:</strong> Guided tour</div>
                  </div>
                </li>
              </ol>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

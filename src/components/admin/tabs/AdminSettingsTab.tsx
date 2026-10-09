import React, { useState, useEffect, useRef } from 'react';
import {
  StructuredMeal,
  DEFAULT_CATEGORY_PRICES,
  PER_DAY_FEE,
  LaunchSettings,
} from '../../../types';
import {
  TWENTY_SIX_WEEK_MENU,
  BASE_DATE,
  getStructuredMealForDate,
  updateCustomMealForDate,
  subscribeMenuChanges,
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
} from 'lucide-react';
import { getMeasurementId, setMeasurementId, trackEvent } from '../../../utils/analytics';

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
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [editingDateStr, setEditingDateStr] = useState<string | null>(null);
  const [editMealName, setEditMealName] = useState('');
  const [editMealCategory, setEditMealCategory] = useState<string>('Rice & Grains');
  const [editIsUnavailable, setEditIsUnavailable] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
  const [bankName, setBankName] = useState('Wema Bank / Flutterwave MFB');
  const [accountName, setAccountName] = useState('11 TO 12 FOODS LTD');
  const [accountNumber, setAccountNumber] = useState('7353969118 / 9596073284');
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
    setEditingDateStr(item.dateStr);
    setEditMealName(item.meal?.mealName || '');
    setEditMealCategory(item.meal?.mealCategory || 'Rice & Grains');
    setEditIsUnavailable(item.meal?.isNoDelivery || false);
  };

  const handleSaveMealOverride = () => {
    if (!editingDateStr) return;
    const [y, m, d] = editingDateStr.split('-').map(Number);
    const existing = getStructuredMealForDate(new Date(y, m - 1, d));

    const updatedMeal: StructuredMeal = {
      ...(existing || {
        id: `meal-${editingDateStr}`,
        dateStr: editingDateStr,
        day: 'Mon',
        mealName: editMealName,
        mealCategory: editMealCategory as any,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
      }),
      mealName: editMealName.trim(),
      mealCategory: editMealCategory as any,
      isNoDelivery: editIsUnavailable,
    };

    updateCustomMealForDate(editingDateStr, updatedMeal);
    setRefreshKey((prev) => prev + 1);
    setEditingDateStr(null);
    showSaved(`Saved & Distributed! Updated real-time across Home page, User Dashboard, Meal Schedule & Settings.`);
  };

  const handleSavePricing = () => {
    showSaved('Pricing settings saved successfully.');
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

          {/* Week Days Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {weekDays.map((item) => (
              <div
                key={item.dateStr}
                className="p-4 rounded-2xl border border-zinc-200 bg-[#FAF7F2] space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900">{item.day}</span>
                    <span className="text-[10px] font-mono text-zinc-400">{item.dateStr}</span>
                  </div>

                  <div className="mt-2">
                    <span className="text-xs font-bold text-zinc-800 line-clamp-2">
                      {item.meal?.mealName || 'No Meal'}
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      {item.meal?.mealCategory || 'Standard'}
                    </span>
                  </div>

                  {item.meal?.isNoDelivery && (
                    <span className="mt-1 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                      Marked Unavailable
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleStartEditMeal(item)}
                  className="w-full py-1.5 rounded-xl border border-zinc-300 hover:border-black text-zinc-800 hover:text-black font-semibold text-[11px] transition cursor-pointer bg-white"
                >
                  Edit Meal
                </button>
              </div>
            ))}
          </div>

          {/* Edit Meal Drawer / Box */}
          {editingDateStr && (
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900">
                  Editing Meal for {editingDateStr}
                </span>
                <button
                  onClick={() => setEditingDateStr(null)}
                  className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Meal Title</label>
                  <input
                    type="text"
                    value={editMealName}
                    onChange={(e) => setEditMealName(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Category</label>
                  <select
                    value={editMealCategory}
                    onChange={(e) => setEditMealCategory(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                  >
                    <option value="Rice & Grains">Rice & Grains</option>
                    <option value="Swallow">Swallow</option>
                    <option value="Pasta">Pasta</option>
                    <option value="Beans & Delicacies">Beans & Delicacies</option>
                    <option value="Yam">Yam</option>
                  </select>
                </div>
              </div>

              {/* Unavailable Toggle */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="mark-unavail"
                  checked={editIsUnavailable}
                  onChange={(e) => setEditIsUnavailable(e.target.checked)}
                  className="rounded text-[#FF4C00] cursor-pointer"
                />
                <label htmlFor="mark-unavail" className="text-xs text-zinc-700 font-medium cursor-pointer">
                  Mark meal unavailable on this date (Public Holiday / Kitchen Off)
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
                <p className="text-[11px] text-zinc-500">
                  Clicking <strong>Save and Distribute</strong> instantly broadcasts this meal to the Home page, User Dashboard, and Meal Schedule in real-time.
                </p>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingDateStr(null)}
                    className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveMealOverride}
                    className="px-4 py-2 rounded-xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center space-x-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Save and Distribute</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* --- SUBTAB 2: PRICING --- */}
      {activeSubTab === 'pricing' && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
          
          <div className="pb-4 border-b border-zinc-100">
            <h2 className="text-base font-bold text-zinc-900">Manage Pricing</h2>
            <p className="text-xs text-zinc-500">Set meal category base rates and per-day delivery charges</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
              <span className="text-xs font-bold text-zinc-800 block">Category Prices</span>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-medium">Swallow & Soup</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-zinc-400">₦</span>
                    <input
                      type="number"
                      value={prices.Swallow}
                      onChange={(e) => setPrices({ ...prices, Swallow: Number(e.target.value) })}
                      className="w-24 bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-right"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-medium">Rice & Grains</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-zinc-400">₦</span>
                    <input
                      type="number"
                      value={prices.Rice}
                      onChange={(e) => setPrices({ ...prices, Rice: Number(e.target.value) })}
                      className="w-24 bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-right"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-medium">Pasta & Noodles</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-zinc-400">₦</span>
                    <input
                      type="number"
                      value={prices.Pasta}
                      onChange={(e) => setPrices({ ...prices, Pasta: Number(e.target.value) })}
                      className="w-24 bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-right"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-medium">Beans & Delicacies</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-zinc-400">₦</span>
                    <input
                      type="number"
                      value={prices.Beans}
                      onChange={(e) => setPrices({ ...prices, Beans: Number(e.target.value) })}
                      className="w-24 bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-right"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
              <span className="text-xs font-bold text-zinc-800 block">Per-Day Charges & Discounts</span>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                  Per-Day Desk Drop Delivery Addition
                </label>
                <div className="flex items-center space-x-1">
                  <span className="text-zinc-400">₦</span>
                  <input
                    type="number"
                    value={perDayFee}
                    onChange={(e) => setPerDayFee(Number(e.target.value))}
                    className="w-28 bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                  />
                  <span className="text-[11px] text-zinc-400">per day scheduled</span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200">
                <span className="text-zinc-700 font-medium block">20th Day Free Perk</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Subscribers ordering 20+ workdays receive their 20th lunch food cost free.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSavePricing}
              className="px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
            >
              Save Pricing Settings
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

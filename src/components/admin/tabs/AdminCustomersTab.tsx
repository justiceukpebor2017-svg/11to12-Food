import React, { useState, useMemo } from 'react';
import { CustomerRecord, SelectedLunchDay, SwallowType, calculateOrderSummary } from '../../../types';
import { exportToCsv } from '../../../utils/csvExport';
import {
  generateDefaultPassword,
  formatCredentialEmailMessage,
  formatCredentialWhatsAppMessage,
} from '../../../utils/credentialUtils';
import { getStructuredMealForDate } from '../../../data/menuRotation';
import { LAUNCH_CONFIG, isDateBeforeLaunch } from '../../../config/launchConfig';
import {
  Search,
  Download,
  Users,
  Eye,
  Trash2,
  Edit2,
  Copy,
  Check,
  Send,
  X,
  Key,
  ShieldCheck,
  AlertCircle,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  User,
  CheckCircle2,
  Plus,
  Building,
  RefreshCw,
  Utensils,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface AdminCustomersTabProps {
  customers: CustomerRecord[];
  onAddCustomer?: (customer: CustomerRecord) => void;
  onUpdateCustomer?: (customer: CustomerRecord) => void;
  onDeleteCustomer?: (customerId: string, customerEmail?: string) => void;
  onConfirmOrderPayment?: (orderId: string) => void;
  selectedCustomer?: CustomerRecord | null;
  onCloseCustomerProfile?: () => void;
  onOpenCustomerProfile?: (customer: CustomerRecord) => void;
}

export const AdminCustomersTab: React.FC<AdminCustomersTabProps> = ({
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onConfirmOrderPayment,
  selectedCustomer: controlledSelectedCustomer,
  onCloseCustomerProfile,
  onOpenCustomerProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [internalSelectedCustomer, setInternalSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerRecord | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  // Edit form state in Profile Drawer
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPrimaryAddress, setEditPrimaryAddress] = useState('');
  const [editSecondAddress, setEditSecondAddress] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Paused' | 'Pending Activation'>('Active');

  // Add Customer Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTab, setModalTab] = useState<'details' | 'meals' | 'credentials'>('details');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newDeliveryArea, setNewDeliveryArea] = useState('Victoria Island');
  const [newOfficeAddress, setNewOfficeAddress] = useState('');
  const [newSecondAddress, setNewSecondAddress] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState<'Paid' | 'Pending Verification'>('Paid');
  const [newOrderRef, setNewOrderRef] = useState('');
  const [newDefaultPassword, setNewDefaultPassword] = useState(() => generateDefaultPassword());
  const [newSelectedDays, setNewSelectedDays] = useState<SelectedLunchDay[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Month navigation for Add Customer meals calendar
  const [calYear, setCalYear] = useState(LAUNCH_CONFIG.year);
  const [calMonth, setCalMonth] = useState(LAUNCH_CONFIG.monthIndex);

  // Dialog showing generated credentials after creating a customer
  const [createdCredentialsNotice, setCreatedCredentialsNotice] = useState<CustomerRecord | null>(null);

  const activeCustomer = controlledSelectedCustomer || internalSelectedCustomer;

  // Filter customers by search and payment status
  const filteredCustomers = useMemo(() => {
    let list = customers;
    if (statusFilter === 'paid') {
      list = list.filter((c) => c.paymentStatus === 'Paid');
    } else if (statusFilter === 'pending') {
      list = list.filter((c) => c.paymentStatus === 'Pending Verification');
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.officeAddress && c.officeAddress.toLowerCase().includes(q)) ||
        (c.secondAddress && c.secondAddress.toLowerCase().includes(q))
    );
  }, [customers, searchQuery, statusFilter]);

  const paidCount = useMemo(() => customers.filter((c) => c.paymentStatus === 'Paid').length, [customers]);
  const pendingCount = useMemo(() => customers.filter((c) => c.paymentStatus === 'Pending Verification').length, [customers]);

  // Open profile
  const handleOpenProfile = (cust: CustomerRecord) => {
    if (onOpenCustomerProfile) {
      onOpenCustomerProfile(cust);
    } else {
      setInternalSelectedCustomer(cust);
    }
    setEditFullName(cust.fullName);
    setEditEmail(cust.email);
    setEditPhone(cust.phone);
    setEditPrimaryAddress(cust.officeAddress);
    setEditSecondAddress(cust.secondAddress || '');
    setEditStatus(cust.status === 'Paused' ? 'Paused' : 'Active');
    setIsEditing(false);
  };

  const handleCloseProfile = () => {
    if (onCloseCustomerProfile) {
      onCloseCustomerProfile();
    } else {
      setInternalSelectedCustomer(null);
    }
    setIsEditing(false);
  };

  // Save edits
  const handleSaveCustomerEdits = () => {
    if (!activeCustomer || !onUpdateCustomer) return;
    const updated: CustomerRecord = {
      ...activeCustomer,
      fullName: editFullName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      officeAddress: editPrimaryAddress.trim(),
      secondAddress: editSecondAddress.trim() || undefined,
      status: editStatus,
    };
    onUpdateCustomer(updated);
    if (onOpenCustomerProfile) {
      onOpenCustomerProfile(updated);
    } else {
      setInternalSelectedCustomer(updated);
    }
    setIsEditing(false);
    setResendNotice(`✓ Updated customer profile for ${updated.fullName}`);
    setTimeout(() => setResendNotice(null), 3500);
  };

  // CSV Download
  const handleDownloadCsv = () => {
    const headers = [
      'Customer Name',
      'Email',
      'Phone',
      'Company',
      'Account Status',
      'Payment Status',
      'Total Days',
      'Primary Delivery Address',
      'Second Delivery Address',
      'Default Password',
      'Order Amount (NGN)',
    ];

    const rows = filteredCustomers.map((c) => [
      c.fullName,
      c.email,
      c.phone,
      c.company || 'Corporate Client',
      c.status,
      c.paymentStatus || 'Paid',
      c.totalDays,
      c.officeAddress,
      c.secondAddress || '—',
      c.password || c.defaultPassword || '—',
      c.finalTotalNGN || 0,
    ]);

    exportToCsv('customers-list', headers, rows);
  };

  // Open Add Customer Modal
  const handleOpenAddModal = () => {
    setNewFullName('');
    setNewEmail('');
    setNewPhone('');
    setNewCompany('');
    setNewDeliveryArea('Victoria Island');
    setNewOfficeAddress('');
    setNewSecondAddress('');
    setNewPaymentStatus('Paid');
    setNewOrderRef(`ORD-${Math.floor(100000 + Math.random() * 900000)}`);
    setNewDefaultPassword(generateDefaultPassword());
    setNewSelectedDays([]);
    setFormError(null);
    setModalTab('details');
    setCalYear(LAUNCH_CONFIG.year);
    setCalMonth(LAUNCH_CONFIG.monthIndex);
    setShowAddModal(true);
  };

  // Calendar day calculation for selecting meals
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const workdaysInCalMonth = useMemo(() => {
    const list: Array<{ date: Date; dateStr: string; dayName: string }> = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(calYear, calMonth, d);
      const dayOfWeek = dt.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && !isDateBeforeLaunch(dt)) {
        const mm = String(calMonth + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        const dateStr = `${calYear}-${mm}-${dd}`;
        const dayName = dt.toLocaleDateString('en-US', { weekday: 'short' });
        list.push({ date: dt, dateStr, dayName });
      }
    }
    return list;
  }, [calYear, calMonth, daysInMonth]);

  const toggleDaySelection = (date: Date, dateStr: string) => {
    const meal = getStructuredMealForDate(date);
    if (!meal) return;

    setNewSelectedDays((prev) => {
      const exists = prev.some((d) => d.dateStr === dateStr);
      if (exists) {
        return prev.filter((d) => d.dateStr !== dateStr);
      } else {
        const item: SelectedLunchDay = {
          dateStr,
          meal,
          selectedSwallow: meal.mealCategory === 'Swallow' ? 'Semo' : undefined,
        };
        return [...prev, item].sort((a, b) => a.dateStr.localeCompare(b.dateStr));
      }
    });
  };

  const handleSelectQuickDays = (targetCount: number) => {
    const selected: SelectedLunchDay[] = [];
    let curYear = LAUNCH_CONFIG.year;
    let curMonth = LAUNCH_CONFIG.monthIndex;

    while (selected.length < targetCount && curYear <= LAUNCH_CONFIG.year + 1) {
      const totalDays = new Date(curYear, curMonth + 1, 0).getDate();
      for (let d = 1; d <= totalDays && selected.length < targetCount; d++) {
        const dt = new Date(curYear, curMonth, d);
        if (dt.getDay() >= 1 && dt.getDay() <= 5 && !isDateBeforeLaunch(dt)) {
          const mm = String(curMonth + 1).padStart(2, '0');
          const dd = String(d).padStart(2, '0');
          const dateStr = `${curYear}-${mm}-${dd}`;
          const meal = getStructuredMealForDate(dt);
          if (meal) {
            selected.push({
              dateStr,
              meal,
              selectedSwallow: meal.mealCategory === 'Swallow' ? 'Semo' : undefined,
            });
          }
        }
      }
      curMonth++;
      if (curMonth > 11) {
        curMonth = 0;
        curYear++;
      }
    }

    setNewSelectedDays(selected);
  };

  // Submit Add Customer Form
  const handleSaveNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = newFullName.trim();
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanName) {
      setFormError('Please enter the customer full name.');
      setModalTab('details');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('Please enter a valid customer email address.');
      setModalTab('details');
      return;
    }

    // Auto-select 20 workdays if admin left meals empty so calendar is never blank
    let finalMeals = newSelectedDays;
    if (finalMeals.length === 0) {
      const autoDays: SelectedLunchDay[] = [];
      let y = LAUNCH_CONFIG.year;
      let m = LAUNCH_CONFIG.monthIndex;
      while (autoDays.length < 20) {
        const total = new Date(y, m + 1, 0).getDate();
        for (let d = 1; d <= total && autoDays.length < 20; d++) {
          const dt = new Date(y, m, d);
          if (dt.getDay() >= 1 && dt.getDay() <= 5 && !isDateBeforeLaunch(dt)) {
            const mm = String(m + 1).padStart(2, '0');
            const dd = String(d).padStart(2, '0');
            const dateStr = `${y}-${mm}-${dd}`;
            const meal = getStructuredMealForDate(dt);
            if (meal) {
              autoDays.push({
                dateStr,
                meal,
                selectedSwallow: meal.mealCategory === 'Swallow' ? 'Semo' : undefined,
              });
            }
          }
        }
        m++;
        if (m > 11) {
          m = 0;
          y++;
        }
      }
      finalMeals = autoDays;
    }

    const summary = calculateOrderSummary(finalMeals);
    const pass = newDefaultPassword.trim() || generateDefaultPassword();
    const customerId = `cust-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCustomer: CustomerRecord = {
      id: customerId,
      fullName: cleanName,
      email: cleanEmail,
      phone: newPhone.trim() || '+234 800 000 0000',
      company: newCompany.trim() || 'Corporate Client',
      deliveryArea: newDeliveryArea,
      officeAddress: newOfficeAddress.trim() || `${newDeliveryArea}, Lagos Desk Drop`,
      secondAddress: newSecondAddress.trim() || '',
      floorSuite: 'Desk Drop Location',
      status: 'Active',
      paymentStatus: newPaymentStatus,
      planName: `${finalMeals.length} Workday Lunch Plan`,
      totalDays: finalMeals.length,
      selectedDays: finalMeals,
      creditsBalance: 0,
      subtotalNGN: summary.subtotalNGN,
      discountNGN: summary.discountNGN,
      finalTotalNGN: summary.finalTotalNGN,
      orderRef: newOrderRef.trim() || `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      password: pass,
      defaultPassword: pass,
      isDefaultPassword: true,
      mustChangePassword: true,
      isPasswordSet: true,
    };

    if (onAddCustomer) {
      onAddCustomer(newCustomer);
    }

    if (newPaymentStatus === 'Paid' && newCustomer.orderRef && onConfirmOrderPayment) {
      onConfirmOrderPayment(newCustomer.orderRef);
    }

    setShowAddModal(false);
    setCreatedCredentialsNotice(newCustomer);
    setResendNotice(`✓ Customer ${cleanName} created! Default login credentials generated.`);
    setTimeout(() => setResendNotice(null), 5000);
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleResendLogin = (cust: CustomerRecord) => {
    const pass = cust.password || cust.defaultPassword || 'DeskDrop#842';
    const emailMsg = formatCredentialEmailMessage({
      customerName: cust.fullName,
      email: cust.email,
      defaultPassword: pass,
      totalDays: cust.totalDays || cust.selectedDays?.length || 0,
      company: cust.company,
    });
    setResendNotice(`Login credentials for ${cust.email} ready. You can copy or send via WhatsApp/Email.`);
    setTimeout(() => setResendNotice(null), 4000);
  };

  const handleConfirmDelete = () => {
    if (customerToDelete && onDeleteCustomer) {
      onDeleteCustomer(customerToDelete.id, customerToDelete.email);
      if (activeCustomer?.id === customerToDelete.id) {
        handleCloseProfile();
      }
      setCustomerToDelete(null);
    }
  };

  const calculatedNewOrderSummary = useMemo(() => {
    return calculateOrderSummary(newSelectedDays);
  }, [newSelectedDays]);

  const cleanWhatsAppNumber = (phoneStr: string) => {
    const raw = phoneStr.replace(/\D/g, '');
    if (raw.startsWith('0')) return `234${raw.slice(1)}`;
    if (raw.startsWith('234')) return raw;
    return `234${raw}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Poppins']">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Customers</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {customers.length} Total
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage subscriber profiles, desk drop addresses, scheduled lunch calendars, and default login credentials
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-[#FF4C00] hover:bg-[#e04300] text-white font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            disabled={filteredCustomers.length === 0}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs transition cursor-pointer flex items-center space-x-1.5 disabled:opacity-40 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {resendNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{resendNotice}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 bg-zinc-100/80 p-1 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            All Customers ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
              statusFilter === 'paid'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-700 hover:text-emerald-900'
            }`}
          >
            <span>Paid</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded-full font-extrabold ml-1">
              {paidCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-amber-700 hover:text-amber-900'
            }`}
          >
            <span>Pending Verification</span>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full font-extrabold ml-1">
              {pendingCount}
            </span>
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, company, address..."
            className="w-full bg-white border border-zinc-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00] shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Customer List Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
        {filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-zinc-500">
            <Users className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-700">No customers found</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {searchQuery
                ? 'Try a different search query.'
                : 'Click "+ Add Customer" above to manually register a client and set up their meals & login.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-5">Name & Workplace</th>
                  <th className="py-3 px-5">Contact</th>
                  <th className="py-3 px-5">Payment Status</th>
                  <th className="py-3 px-5">Selected Lunches</th>
                  <th className="py-3 px-5">Primary Address</th>
                  <th className="py-3 px-5">Second Optional Address</th>
                  <th className="py-3 px-5">Default Login</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredCustomers.map((cust) => {
                  const isPasswordChanged = Boolean(cust.passwordLastChangedAt) || (!cust.mustChangePassword && !cust.isDefaultPassword && Boolean(cust.password));
                  const currentPassword = cust.password || cust.defaultPassword || 'DeskDrop#842';
                  const isPaid = cust.paymentStatus === 'Paid';

                  return (
                    <tr key={cust.id} className="hover:bg-zinc-50/80 transition">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-zinc-900 text-sm">{cust.fullName}</div>
                        <div className="text-[11px] text-zinc-500 flex items-center space-x-1">
                          <Building className="w-3 h-3 text-zinc-400" />
                          <span>{cust.company || 'Corporate Client'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 text-zinc-600">
                        <div className="font-medium text-zinc-800">{cust.email}</div>
                        <div className="text-[11px] font-mono text-zinc-500">{cust.phone}</div>
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="space-y-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isPaid ? 'Paid' : 'Pending Verification'}
                          </span>

                          {!isPaid && onConfirmOrderPayment && (
                            <div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (cust.orderRef) onConfirmOrderPayment(cust.orderRef);
                                  if (onUpdateCustomer) onUpdateCustomer({ ...cust, paymentStatus: 'Paid' });
                                }}
                                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer flex items-center space-x-0.5"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Verify & Mark Paid</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-bold text-zinc-900 block">
                          {cust.totalDays || cust.selectedDays?.length || 0} lunches
                        </span>
                        <span className="text-[10px] text-zinc-400 block font-mono">
                          ₦{(cust.finalTotalNGN || 0).toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-zinc-700 max-w-[170px] truncate" title={cust.officeAddress}>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-[#FF4C00] shrink-0" />
                          <span className="truncate">{cust.officeAddress}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 text-zinc-500 max-w-[160px] truncate" title={cust.secondAddress || '—'}>
                        {cust.secondAddress ? (
                          <div className="flex items-center space-x-1 text-zinc-700">
                            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-zinc-100 text-zinc-600 uppercase shrink-0">
                              Backup
                            </span>
                            <span className="truncate">{cust.secondAddress}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="space-y-0.5">
                          <div className="font-mono text-zinc-800 font-bold text-[11px]">
                            {currentPassword}
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block ${
                              isPasswordChanged
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isPasswordChanged ? 'Password Changed' : 'Default / Temp'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenProfile(cust)}
                            className="px-2.5 py-1.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-semibold text-[11px] transition cursor-pointer"
                          >
                            Open Profile
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(
                                `Website: ${typeof window !== 'undefined' ? window.location.origin : 'https://11to12.food'}\nEmail: ${cust.email}\nPassword: ${currentPassword}`,
                                `row-${cust.id}`
                              )
                            }
                            className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition cursor-pointer"
                            title="Copy Login Credentials"
                          >
                            {copiedKey === `row-${cust.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <a
                            href={`https://wa.me/${cleanWhatsAppNumber(cust.phone)}?text=${encodeURIComponent(
                              formatCredentialWhatsAppMessage({
                                customerName: cust.fullName,
                                email: cust.email,
                                defaultPassword: currentPassword,
                                totalDays: cust.totalDays || cust.selectedDays?.length || 0,
                                company: cust.company,
                              })
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl hover:bg-emerald-50 text-emerald-600 transition cursor-pointer"
                            title="Send Login Credentials on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => setCustomerToDelete(cust)}
                            className="p-1.5 rounded-xl hover:bg-red-50 text-zinc-400 hover:text-red-600 transition cursor-pointer"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD CUSTOMER MODAL (Details, 2 Addresses, Meal Selection & Default Login) */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 space-y-6 my-auto max-h-[92vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF4C00]/10 text-[#FF4C00] flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">Add New Customer</h2>
                  <p className="text-xs text-zinc-500">
                    Register a client, specify delivery desk drop addresses, select meals from invoice, and issue credentials
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Tabs */}
            <div className="flex items-center space-x-2 border-b border-zinc-100 pb-2">
              <button
                type="button"
                onClick={() => setModalTab('details')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  modalTab === 'details'
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                1. Customer & 2 Addresses
              </button>
              <button
                type="button"
                onClick={() => setModalTab('meals')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                  modalTab === 'meals'
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>2. Select Meals ({newSelectedDays.length} days)</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('credentials')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                  modalTab === 'credentials'
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>3. Default Login</span>
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewCustomer} className="space-y-5">
              
              {/* TAB 1: DETAILS & ADDRESSES */}
              {modalTab === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        placeholder="e.g. Babatunde Alabi"
                        className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Work Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="e.g. b.alabi@accessbankplc.com"
                        className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Phone Number (WhatsApp) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="e.g. 0802 345 6789"
                        className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Company / Employer
                      </label>
                      <input
                        type="text"
                        value={newCompany}
                        onChange={(e) => setNewCompany(e.target.value)}
                        placeholder="e.g. Access Bank HQ, MTN, KPMG"
                        className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                      />
                    </div>
                  </div>

                  {/* Delivery Location & Addresses */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200/80 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block">
                      Desk Drop Workstation Delivery Addresses
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                          Delivery Zone
                        </label>
                        <select
                          value={newDeliveryArea}
                          onChange={(e) => setNewDeliveryArea(e.target.value)}
                          className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                        >
                          <option value="Victoria Island">Victoria Island</option>
                          <option value="Ikoyi">Ikoyi</option>
                          <option value="Lekki Phase 1">Lekki Phase 1</option>
                          <option value="Marina / Lagos Island">Marina / Lagos Island</option>
                          <option value="Ikeja GRA">Ikeja GRA</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                          Primary Delivery Address (Desk & Floor) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newOfficeAddress}
                          onChange={(e) => setNewOfficeAddress(e.target.value)}
                          placeholder="e.g. Floor 7, Treasury Desk 14, Tower B, Victoria Island"
                          className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                        Second Optional Delivery Address <span className="text-zinc-400 font-normal">(Backup reception desk, branch, or floor)</span>
                      </label>
                      <input
                        type="text"
                        value={newSecondAddress}
                        onChange={(e) => setNewSecondAddress(e.target.value)}
                        placeholder="e.g. Ground Floor Security Reception (Alternate pickup point if in meeting)"
                        className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                      />
                    </div>
                  </div>

                  {/* Payment & Invoice Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Payment Status
                      </label>
                      <select
                        value={newPaymentStatus}
                        onChange={(e) => setNewPaymentStatus(e.target.value as any)}
                        className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                      >
                        <option value="Paid">Paid (Payment Verified)</option>
                        <option value="Pending Verification">Pending Verification</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Invoice Reference <span className="text-zinc-400 font-normal">(from invoice slip)</span>
                      </label>
                      <input
                        type="text"
                        value={newOrderRef}
                        onChange={(e) => setNewOrderRef(e.target.value)}
                        placeholder="e.g. ORD-827194"
                        className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setModalTab('meals')}
                      className="px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs cursor-pointer flex items-center space-x-1"
                    >
                      <span>Next: Select Meals Based on Invoice</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: SELECT MEALS BASED ON INVOICE */}
              {modalTab === 'meals' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 p-3 rounded-2xl border border-zinc-200">
                    <div>
                      <span className="text-xs font-bold text-zinc-900 block">
                        Scheduled Lunches: {newSelectedDays.length} Workdays
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        Total Amount: ₦{calculatedNewOrderSummary.finalTotalNGN.toLocaleString()}
                        {calculatedNewOrderSummary.hasTwentyDayBonus && (
                          <span className="text-emerald-600 font-bold ml-1.5">(20th Free Applied)</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleSelectQuickDays(20)}
                        className="px-3 py-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 text-[#FF4C00] font-bold text-xs cursor-pointer"
                      >
                        Select 20 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectQuickDays(10)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs cursor-pointer"
                      >
                        Select 10 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewSelectedDays([])}
                        className="px-3 py-1.5 rounded-lg text-zinc-500 hover:bg-zinc-200 text-xs cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Calendar Month Selector */}
                  <div className="border border-zinc-200 rounded-2xl p-4 bg-white space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                      <button
                        type="button"
                        onClick={() => {
                          if (calMonth === 0) {
                            setCalMonth(11);
                            setCalYear((y) => y - 1);
                          } else {
                            setCalMonth((m) => m - 1);
                          }
                        }}
                        className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-600 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-sm text-zinc-900">
                        {monthNames[calMonth]} {calYear}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (calMonth === 11) {
                            setCalMonth(0);
                            setCalYear((y) => y + 1);
                          } else {
                            setCalMonth((m) => m + 1);
                          }
                        }}
                        className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-600 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Workdays Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
                      {workdaysInCalMonth.map(({ date, dateStr, dayName }) => {
                        const meal = getStructuredMealForDate(date);
                        if (!meal) return null;
                        const isSelected = newSelectedDays.some((d) => d.dateStr === dateStr);
                        const isFriday = date.getDay() === 5;

                        return (
                          <div
                            key={dateStr}
                            onClick={() => toggleDaySelection(date, dateStr)}
                            className={`p-2.5 rounded-xl border text-left cursor-pointer transition select-none flex flex-col justify-between ${
                              isSelected
                                ? 'bg-orange-50/80 border-[#FF4C00] shadow-xs'
                                : 'bg-white border-zinc-200 hover:border-zinc-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-zinc-900 text-xs">
                                {dayName}, {date.getDate()} {monthNames[calMonth].slice(0, 3)}
                              </span>
                              <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                                  isSelected
                                    ? 'bg-[#FF4C00] text-white'
                                    : 'border border-zinc-300 text-transparent'
                                }`}
                              >
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            </div>

                            <p className="text-[11px] font-medium text-zinc-700 line-clamp-1">
                              {meal.mealName}
                            </p>

                            {isFriday && isSelected && (
                              <span className="mt-1 text-[9px] font-bold text-[#FF4C00] bg-orange-100/70 px-1.5 py-0.2 rounded w-fit">
                                Swallow Friday (Semo)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setModalTab('details')}
                      className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 font-semibold text-xs cursor-pointer"
                    >
                      Back: Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalTab('credentials')}
                      className="px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs cursor-pointer flex items-center space-x-1"
                    >
                      <span>Next: Default Login Setup</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: DEFAULT LOGIN GENERATOR & DISPATCH */}
              {modalTab === 'credentials' && (
                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 text-white space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Key className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                          Auto-Generated Default Login Credentials
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewDefaultPassword(generateDefaultPassword())}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-[11px] flex items-center space-x-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Regenerate</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="bg-zinc-800/80 p-3 rounded-xl border border-zinc-700 font-mono text-xs">
                        <span className="text-[10px] text-zinc-400 block mb-0.5">Customer Email</span>
                        <span className="font-bold text-white break-all">{newEmail || 'subscriber@company.ng'}</span>
                      </div>
                      <div className="bg-zinc-800/80 p-3 rounded-xl border border-zinc-700 font-mono text-xs">
                        <span className="text-[10px] text-zinc-400 block mb-0.5">Default Password</span>
                        <input
                          type="text"
                          value={newDefaultPassword}
                          onChange={(e) => setNewDefaultPassword(e.target.value)}
                          className="w-full bg-transparent font-bold text-amber-400 text-sm focus:outline-none"
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 pt-1">
                      The client will use this email and temporary password to log into the 11 to 12 Subscriber Portal. They will be prompted to set their permanent password on their first login.
                    </p>
                  </div>

                  {/* Summary of Plan Created */}
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Subscriber Name:</span>
                      <span className="font-bold text-zinc-900">{newFullName || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Delivery Address 1:</span>
                      <span className="font-semibold text-zinc-800">{newOfficeAddress || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Delivery Address 2 (Optional):</span>
                      <span className="font-semibold text-zinc-800">{newSecondAddress || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Scheduled Meal Days:</span>
                      <span className="font-bold text-emerald-600">
                        {newSelectedDays.length > 0 ? `${newSelectedDays.length} Workday Lunches` : 'Auto-select 20 Workdays'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setModalTab('meals')}
                      className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 font-semibold text-xs cursor-pointer"
                    >
                      Back: Meals
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-[#FF4C00] hover:bg-[#e04300] text-white font-bold text-xs cursor-pointer flex items-center space-x-1.5 shadow-md active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save & Create Customer</span>
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUCCESS CONFIRMATION MODAL: DISPATCH CREDENTIALS TO CLIENT */}
      {/* ========================================================================= */}
      {createdCredentialsNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-zinc-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-zinc-900">Customer Successfully Registered!</h3>
              <p className="text-xs text-zinc-500 mt-1">
                {createdCredentialsNotice.fullName} is now active with {createdCredentialsNotice.totalDays} scheduled lunches.
              </p>
            </div>

            {/* Credential Card */}
            <div className="p-4 rounded-2xl bg-zinc-900 text-white font-mono text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Portal Website:</span>
                <span className="text-zinc-200 font-semibold">
                  {typeof window !== 'undefined' ? window.location.origin : 'https://11to12.food'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Email:</span>
                <span className="text-white font-bold">{createdCredentialsNotice.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Default Password:</span>
                <span className="text-amber-400 font-bold text-sm">
                  {createdCredentialsNotice.password || createdCredentialsNotice.defaultPassword}
                </span>
              </div>
            </div>

            {/* Quick Dispatch Buttons */}
            <div className="space-y-2 pt-1">
              <a
                href={`https://wa.me/${cleanWhatsAppNumber(createdCredentialsNotice.phone)}?text=${encodeURIComponent(
                  formatCredentialWhatsAppMessage({
                    customerName: createdCredentialsNotice.fullName,
                    email: createdCredentialsNotice.email,
                    defaultPassword: createdCredentialsNotice.password || createdCredentialsNotice.defaultPassword || '',
                    totalDays: createdCredentialsNotice.totalDays,
                    company: createdCredentialsNotice.company,
                  })
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send Login via WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() =>
                  handleCopyText(
                    `Hello ${createdCredentialsNotice.fullName}!\n\nYour 11 to 12 Desk Drop lunch plan (${createdCredentialsNotice.totalDays} days) has been registered.\n\nWebsite: ${typeof window !== 'undefined' ? window.location.origin : 'https://11to12.food'}\nEmail: ${createdCredentialsNotice.email}\nDefault Password: ${createdCredentialsNotice.password || createdCredentialsNotice.defaultPassword}\n\nPlease log in and update your password on your first visit!`,
                    'modal-creds'
                  )
                }
                className="w-full py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                {copiedKey === 'modal-creds' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-500" />
                    <span>Copy Full Login Details</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCreatedCredentialsNotice(null)}
                className="w-full py-2 text-zinc-500 hover:text-zinc-800 text-xs font-semibold cursor-pointer text-center"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CUSTOMER PROFILE DRAWER (Full View, Edits & Credentials) */}
      {/* ========================================================================= */}
      {activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-zinc-200 space-y-6 my-auto max-h-[92vh] overflow-y-auto">
            
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4C00]">
                  Customer Profile
                </span>
                <h2 className="text-xl font-bold text-zinc-900">
                  {activeCustomer.fullName}
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs transition cursor-pointer flex items-center space-x-1"
                >
                  <Edit2 className="w-3 h-3 text-zinc-500" />
                  <span>{isEditing ? 'Cancel Edit' : 'Edit Details'}</span>
                </button>

                <button
                  onClick={handleCloseProfile}
                  className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Profile Content */}
            <div className="space-y-5 text-xs">
              
              {/* Section 1: Personal Information */}
              <div className="bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl border border-zinc-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    1. Personal & Company Information
                  </span>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        activeCustomer.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {activeCustomer.paymentStatus || 'Paid'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        activeCustomer.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      {activeCustomer.status}
                    </span>
                  </div>
                </div>

                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                      >
                        <option value="Active">Active</option>
                        <option value="Paused">Paused</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Full Name</span>
                      <span className="font-bold text-zinc-900 text-sm">{activeCustomer.fullName}</span>
                      <span className="text-[11px] text-zinc-500 block">{activeCustomer.company || 'Corporate Client'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Email Address</span>
                      <span className="font-medium text-zinc-800 break-all">{activeCustomer.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Phone Number</span>
                      <span className="font-mono text-zinc-800">{activeCustomer.phone}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Delivery Information (Both Primary and Second Address) */}
              <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                  2. Workstation Delivery Addresses (Desk Drop)
                </span>

                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                        Primary Delivery Address
                      </label>
                      <input
                        type="text"
                        value={editPrimaryAddress}
                        onChange={(e) => setEditPrimaryAddress(e.target.value)}
                        className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                        Second Delivery Address (Optional Backup)
                      </label>
                      <input
                        type="text"
                        value={editSecondAddress}
                        onChange={(e) => setEditSecondAddress(e.target.value)}
                        className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                      <span className="text-[10px] text-zinc-400 block font-bold uppercase">
                        Primary Delivery Address
                      </span>
                      <span className="font-semibold text-zinc-900 text-xs mt-0.5 block">
                        {activeCustomer.officeAddress}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                      <span className="text-[10px] text-zinc-400 block font-bold uppercase">
                        Second Delivery Address (Optional Backup)
                      </span>
                      <span className="text-zinc-700 text-xs mt-0.5 block">
                        {activeCustomer.secondAddress || 'None provided'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Lunch Plan & Scheduled Meals */}
              <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    3. Scheduled Lunches
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {activeCustomer.selectedDays?.length || activeCustomer.totalDays || 0} Lunches
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {activeCustomer.creditsBalance || 0} Credits
                    </span>
                  </div>
                </div>

                {/* Selected Days List */}
                <div className="max-h-40 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-xl p-2 bg-zinc-50/60 text-xs">
                  {(activeCustomer.selectedDays || []).length === 0 ? (
                    <div className="py-4 text-center text-zinc-400">
                      No scheduled dates recorded.
                    </div>
                  ) : (
                    (activeCustomer.selectedDays || []).map((d, i) => (
                      <div key={i} className="py-1.5 px-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-zinc-800">{d.dateStr}</span>
                          <span className="text-zinc-400">
                            ({new Date(d.dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-700 font-medium">{d.meal?.mealName || 'Corporate Nigerian Meal'}</span>
                          {d.selectedSwallow && (
                            <span className="ml-1 text-[9px] font-bold text-[#FF4C00] bg-orange-50 px-1 py-0.2 rounded">
                              {d.selectedSwallow}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Section 4: Payment Details */}
              <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    4. Payment & Invoice
                  </span>
                  {activeCustomer.paymentStatus !== 'Paid' && onConfirmOrderPayment && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeCustomer.orderRef) onConfirmOrderPayment(activeCustomer.orderRef);
                        if (onUpdateCustomer) onUpdateCustomer({ ...activeCustomer, paymentStatus: 'Paid' });
                        setResendNotice(`✓ Verified payment for ${activeCustomer.fullName}! Marked as Paid.`);
                        setTimeout(() => setResendNotice(null), 3500);
                      }}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm & Mark as Paid</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Order Amount</span>
                    <span className="font-bold text-zinc-900 text-sm">
                      ₦{(activeCustomer.finalTotalNGN || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Status</span>
                    <span className={`font-bold text-xs ${activeCustomer.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {activeCustomer.paymentStatus || 'Paid'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Invoice Reference</span>
                    <span className="font-mono text-zinc-700 text-xs truncate block">
                      {activeCustomer.orderRef || activeCustomer.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Registration Date</span>
                    <span className="text-zinc-700 text-xs">
                      {activeCustomer.createdAt ? new Date(activeCustomer.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 5: Default Login Credentials */}
              <div className="bg-zinc-900 text-white p-4 sm:p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    5. Subscriber Portal Login
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeCustomer.mustChangePassword
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {activeCustomer.mustChangePassword ? 'Default / Temp Password' : 'Personal Password Set'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-800/80 p-3 rounded-xl border border-zinc-700 font-mono text-xs">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Current / Default Password</span>
                    <span className="font-bold text-white text-sm">
                      {activeCustomer.password || activeCustomer.defaultPassword || 'DeskDrop#842'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          `Website: ${typeof window !== 'undefined' ? window.location.origin : 'https://11to12.food'}\nEmail: ${activeCustomer.email}\nPassword: ${activeCustomer.password || activeCustomer.defaultPassword || 'DeskDrop#842'}`,
                          'profile-creds'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-semibold text-xs transition cursor-pointer flex items-center space-x-1"
                    >
                      {copiedKey === 'profile-creds' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Details</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`https://wa.me/${cleanWhatsAppNumber(activeCustomer.phone)}?text=${encodeURIComponent(
                        formatCredentialWhatsAppMessage({
                          customerName: activeCustomer.fullName,
                          email: activeCustomer.email,
                          defaultPassword: activeCustomer.password || activeCustomer.defaultPassword || 'DeskDrop#842',
                          totalDays: activeCustomer.totalDays || activeCustomer.selectedDays?.length || 0,
                          company: activeCustomer.company,
                        })
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs transition cursor-pointer flex items-center space-x-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Modal Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setCustomerToDelete(activeCustomer)}
                className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-semibold text-xs transition cursor-pointer"
              >
                Delete Customer
              </button>

              <div className="flex items-center space-x-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleSaveCustomerEdits}
                    className="px-4 py-2 rounded-xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs transition cursor-pointer shadow-xs"
                  >
                    Save Changes
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCloseProfile}
                  className="px-4 py-2 rounded-xl bg-black text-white font-semibold text-xs hover:bg-zinc-800 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Delete Customer Confirmation */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <h3 className="text-base font-bold text-zinc-900">Delete Customer?</h3>
            <p className="text-xs text-zinc-600">
              Are you sure you want to delete <strong>{customerToDelete.fullName}</strong> ({customerToDelete.email})? This action removes their active schedule.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer"
              >
                Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

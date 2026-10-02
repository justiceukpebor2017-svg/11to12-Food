import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Check,
  X,
  CreditCard,
  MapPin,
  Calendar,
  AlertCircle,
  Building,
  Phone,
  Mail,
  RotateCcw,
  Pause,
  Play,
  DollarSign,
  Eye,
  ExternalLink,
  ShieldCheck,
  Plus,
  ArrowRight,
  Sparkles,
  Copy,
  MessageSquare,
  FileText,
  KeyRound,
  CheckCircle2,
  CalendarPlus,
} from 'lucide-react';
import { OrderSubmission, UserProfile, MenuItem, TimeWindow, CustomerRecord, SelectedLunchDay, calculateOrderSummary } from '../../types';
import { CustomerMealCalendarPicker } from './CustomerMealCalendarPicker';
import { generateMagicLinkUrl } from '../../utils/magicLink';

interface CustomersManagerProps {
  submittedOrders: OrderSubmission[];
  customers?: CustomerRecord[];
  onAddCustomer?: (customer: CustomerRecord) => void;
  onUpdateCustomer?: (customer: CustomerRecord) => void;
  onSimulateUserActivation?: (customer: CustomerRecord) => void;
  currentUserProfile?: UserProfile;
  onUpdateCurrentUserProfile?: (updated: UserProfile) => void;
  todayMeal?: MenuItem;
  tomorrowMeal?: MenuItem;
  timeWindow?: TimeWindow;
  onNavigateToSubscriber?: () => void;
  onConfirmOrderPayment?: (orderId: string) => void;
}

export const CustomersManager: React.FC<CustomersManagerProps> = ({
  submittedOrders,
  customers: externalCustomers,
  onAddCustomer: externalOnAddCustomer,
  onUpdateCustomer: externalOnUpdateCustomer,
  onSimulateUserActivation,
  currentUserProfile,
  onUpdateCurrentUserProfile,
  todayMeal,
  tomorrowMeal,
  timeWindow = 'morning',
  onNavigateToSubscriber,
  onConfirmOrderPayment,
}) => {
  // Local state for customers (clean slate by default)
  const [internalCustomers, setInternalCustomers] = useState<CustomerRecord[]>([]);
  const customersList = externalCustomers ?? internalCustomers;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Paused' | 'Pending Activation'>('All');
  
  // Selected Customer for Detailed Profile Modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  // Add / Onboard Customer Modal State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [modalTab, setModalTab] = useState<'details' | 'calendar'>('details');

  // Add Customer Form Fields (Synced with Invoice Schema)
  const [custFullName, setCustFullName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custCompany, setCustCompany] = useState('');
  const [custLocation, setCustLocation] = useState('Victoria Island');
  const [custOfficeAddress, setCustOfficeAddress] = useState('');
  const [custFloorSuite, setCustFloorSuite] = useState('');
  const [custNotes, setCustNotes] = useState('');
  const [custPaymentStatus, setCustPaymentStatus] = useState<'Paid' | 'Pending Verification'>('Paid');
  const [custSelectedDays, setCustSelectedDays] = useState<SelectedLunchDay[]>([]);
  const [syncedOrderRef, setSyncedOrderRef] = useState<string | undefined>(undefined);

  // Magic Link Notification Modal State
  const [magicLinkNotice, setMagicLinkNotice] = useState<{
    customer: CustomerRecord;
    url: string;
    token: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Give Credit Modal State
  const [showGiveCreditModal, setShowGiveCreditModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState('4500');

  // Add More Meal Days Modal State
  const [addingDaysCustomer, setAddingDaysCustomer] = useState<CustomerRecord | null>(null);
  const [additionalSelectedDays, setAdditionalSelectedDays] = useState<SelectedLunchDay[]>([]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAddMoreMealDays = (cust: CustomerRecord) => {
    setAddingDaysCustomer(cust);
    setAdditionalSelectedDays(cust.selectedDays || []);
  };

  const handleSaveAdditionalDays = () => {
    if (!addingDaysCustomer) return;
    const summary = calculateOrderSummary(additionalSelectedDays);
    const existingCount = addingDaysCustomer.selectedDays?.length || 0;
    const newAddedCount = Math.max(0, additionalSelectedDays.length - existingCount);

    const updatedCust: CustomerRecord = {
      ...addingDaysCustomer,
      selectedDays: additionalSelectedDays,
      totalDays: additionalSelectedDays.length,
      planName: `${additionalSelectedDays.length} Workday Lunch Plan`,
      subtotalNGN: summary.subtotalNGN,
      discountNGN: summary.discountNGN,
      finalTotalNGN: summary.finalTotalNGN,
    };

    if (externalOnUpdateCustomer) {
      externalOnUpdateCustomer(updatedCust);
    } else {
      setInternalCustomers((prev) => prev.map((c) => (c.id === updatedCust.id ? updatedCust : c)));
    }

    if (selectedCustomer?.id === updatedCust.id) {
      setSelectedCustomer(updatedCust);
    }

    if (currentUserProfile && currentUserProfile.id === updatedCust.id && onUpdateCurrentUserProfile) {
      onUpdateCurrentUserProfile({
        ...currentUserProfile,
        selectedDays: additionalSelectedDays,
        totalSubscribedDays: additionalSelectedDays.length,
      });
    }

    showToast(`✓ Updated ${addingDaysCustomer.fullName}'s plan: ${additionalSelectedDays.length} total meal days (+${newAddedCount} newly added)!`);
    setAddingDaysCustomer(null);
  };

  // Sync / Auto-fill from an invoice submitted from the homepage
  const handleSyncFromInvoice = (order: OrderSubmission) => {
    setCustFullName(order.fullName);
    setCustEmail(order.email);
    setCustPhone(order.phone);
    setCustCompany(order.company);
    setCustOfficeAddress(order.officeAddress);
    setCustFloorSuite('');
    setCustLocation(
      order.officeAddress.toLowerCase().includes('ikoyi')
        ? 'Ikoyi'
        : order.officeAddress.toLowerCase().includes('lekki')
        ? 'Lekki Phase 1'
        : 'Victoria Island'
    );
    setCustNotes('');
    setCustPaymentStatus(order.paymentStatus === 'Confirmed' ? 'Paid' : 'Paid');
    // Pre-populate exact days selected on homepage
    setCustSelectedDays(order.selectedDays || []);
    setSyncedOrderRef(order.id);
    
    // Open modal directly on calendar tab to review the days
    setModalTab('calendar');
    setShowAddCustomerModal(true);
  };

  const handleOpenNewCustomerModal = () => {
    // Reset form
    setCustFullName('');
    setCustEmail('');
    setCustPhone('');
    setCustCompany('');
    setCustLocation('Victoria Island');
    setCustOfficeAddress('');
    setCustFloorSuite('');
    setCustNotes('');
    setCustPaymentStatus('Paid');
    setCustSelectedDays([]);
    setSyncedOrderRef(undefined);
    setModalTab('details');
    setShowAddCustomerModal(true);
  };

  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custFullName.trim() || !custEmail.trim()) {
      showToast('Please provide customer name and email.');
      return;
    }

    const newId = `cust-${Date.now()}`;
    const token = `mag_${Math.random().toString(36).substring(2, 12)}`;
    const magicUrl = generateMagicLinkUrl(token, custEmail.trim());
    
    const summary = calculateOrderSummary(custSelectedDays);
    const totalDays = custSelectedDays.length > 0 ? custSelectedDays.length : 20;

    const newCustomer: CustomerRecord = {
      id: newId,
      fullName: custFullName.trim(),
      email: custEmail.trim(),
      phone: custPhone.trim() || '+234 800 000 0000',
      company: custCompany.trim() || 'Corporate Client',
      officeAddress: custOfficeAddress.trim() || `${custLocation}, Lagos`,
      floorSuite: custFloorSuite.trim() || 'Floor 4, Desk Drop',
      deliveryArea: custLocation,
      notes: custNotes.trim(),
      status: 'Active',
      paymentStatus: custPaymentStatus,
      planName: `${totalDays} Workday Lunch Plan`,
      totalDays,
      selectedDays: custSelectedDays,
      subtotalNGN: summary.subtotalNGN,
      discountNGN: summary.discountNGN,
      finalTotalNGN: summary.finalTotalNGN,
      orderRef: syncedOrderRef || `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      magicLinkToken: token,
      magicLinkUrl: magicUrl,
      isPasswordSet: false,
    };

    if (externalOnAddCustomer) {
      externalOnAddCustomer(newCustomer);
    } else {
      setInternalCustomers((prev) => [newCustomer, ...prev]);
    }

    if (syncedOrderRef && onConfirmOrderPayment) {
      onConfirmOrderPayment(syncedOrderRef);
    }

    setShowAddCustomerModal(false);

    // Show magic link result modal immediately
    setMagicLinkNotice({
      customer: newCustomer,
      url: magicUrl,
      token,
    });
  };

  const handleGenerateMagicLinkForExisting = (customer: CustomerRecord) => {
    const token = customer.magicLinkToken || `mag_${Math.random().toString(36).substring(2, 12)}`;
    const magicUrl = generateMagicLinkUrl(token, customer.email);
    setMagicLinkNotice({
      customer,
      url: magicUrl,
      token,
    });
  };

  const handleCopyMagicLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLaunchSetPasswordFlow = (customer: CustomerRecord) => {
    setMagicLinkNotice(null);
    if (onSimulateUserActivation) {
      onSimulateUserActivation(customer);
    } else if (onUpdateCurrentUserProfile) {
      // Sync into current user profile and transition to subscriber dashboard
      onUpdateCurrentUserProfile({
        id: customer.id,
        name: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        occupation: 'Corporate Professional',
        company: customer.company,
        address: customer.officeAddress,
        floorSuite: customer.floorSuite,
        deliveryArea: customer.deliveryArea || 'Victoria Island',
        creditsBalance: 0,
        spicePreference: 'Medium',
        proteinsPreferred: ['Spiced Grilled Chicken', 'Assorted Goat Meat'],
        dislikes: customer.notes ? [customer.notes] : [],
        standardLunchTime: '11:45 AM',
        eatLocation: 'Work',
        subscriptionStatus: 'Active',
        planName: customer.planName,
        nextBillingDate: 'Nov 1, 2026',
        totalMealsReceived: 0,
        totalSubscribedDays: customer.totalDays,
        skipCount: 0,
        isPasswordSet: true,
        selectedDays: customer.selectedDays,
        pendingAddressChange: null,
      });
      if (onNavigateToSubscriber) onNavigateToSubscriber();
    }
  };

  const filteredCustomers = customersList.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.deliveryArea && c.deliveryArea.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All' ? true : c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingHomepageOrders = submittedOrders.filter(
    (ord) =>
      ord.paymentStatus === 'Pending Verification' &&
      !customersList.some(
        (c) => c.orderRef === ord.id || c.email.toLowerCase() === ord.email.toLowerCase()
      )
  );

  return (
    <div className="space-y-6 font-['Poppins']">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-70 bg-zinc-950 text-white px-5 py-3 rounded-2xl shadow-2xl border border-zinc-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Title & Onboarding Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <span className="text-xs font-bold text-[#FF4C00] uppercase tracking-wider">
            Customer Management & Onboarding
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black mt-0.5">
            Customers ({customersList.length})
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal">
            Onboard new clients, sync paid invoices, select meal days on the calendar, and generate magic links.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleOpenNewCustomerModal}
            className="px-5 py-2.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Onboard New Customer</span>
          </button>
        </div>
      </div>

      {/* PENDING HOMEPAGE INVOICES (Section 1 Sync) */}
      {pendingHomepageOrders.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-white rounded-3xl border border-[#FF4C00]/30 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FF4C00] text-white flex items-center justify-center font-bold text-xs">
                {pendingHomepageOrders.length}
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900">
                  Pending Homepage Orders & Invoices
                </h3>
                <p className="text-xs text-zinc-500">
                  These customers selected their meal days on the homepage and completed payment. Sync to create their profile and issue their magic link.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#FF4C00] bg-white px-3 py-1 rounded-full border border-[#FF4C00]/20 self-start sm:self-auto">
              Ready for Verification
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingHomepageOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs flex flex-col justify-between hover:border-[#FF4C00] transition"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-[#FF4C00]">{ord.id}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {ord.paymentStatus}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-zinc-900">{ord.fullName}</h4>
                  <p className="text-xs text-zinc-600 font-medium">{ord.company}</p>
                  <p className="text-[11px] text-zinc-400 truncate mt-1">{ord.officeAddress}</p>

                  <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-600">{ord.totalDays} Days Selected</span>
                    <span className="font-black text-zinc-900">₦{ord.finalTotalNGN.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-4 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSyncFromInvoice(ord)}
                    className="w-full py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#FF4C00]" />
                    <span>Sync & Onboard from Invoice</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, company, email, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF7F2] border border-zinc-200 rounded-xl text-xs font-medium text-black focus:outline-hidden focus:border-[#FF4C00]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#FAF7F2] border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 focus:outline-hidden"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Pending Activation">Pending Activation</option>
          </select>
        </div>
      </div>

      {/* CUSTOMER LIST TABLE / ZERO STATE */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-[#FAF7F2] border border-zinc-200 flex items-center justify-center mx-auto mb-4 text-zinc-400">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-zinc-900 mb-1">
            {searchTerm ? 'No matching customers found' : 'No active customers yet'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mb-6">
            {searchTerm
              ? 'Try modifying your search term or filters.'
              : 'Start by having a customer place an order on the homepage, or onboard a customer manually using the meal calendar picker.'}
          </p>
          <button
            type="button"
            onClick={handleOpenNewCustomerModal}
            className="px-6 py-3 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-black text-xs uppercase tracking-wider transition shadow-sm cursor-pointer inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Onboard First Customer</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-[#FAF7F2] text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Company & Location</th>
                  <th className="py-3.5 px-4">Plan & Days</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-zinc-50 transition cursor-pointer"
                    onClick={() => setSelectedCustomer(cust)}
                  >
                    <td className="py-4 px-4">
                      <div className="font-black text-zinc-900 text-sm">{cust.fullName}</div>
                      <div className="text-zinc-500 text-[11px] font-medium">{cust.email}</div>
                      <div className="text-zinc-400 text-[11px]">{cust.phone}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-zinc-900">{cust.company}</div>
                      <div className="text-zinc-500 text-[11px]">{cust.deliveryArea}</div>
                      <div className="text-zinc-400 text-[11px] truncate max-w-xs">{cust.officeAddress}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-zinc-900">{cust.planName}</div>
                      <div className="text-[#FF4C00] font-black text-xs">
                        {cust.totalDays} Meals ({cust.selectedDays?.length || 0} scheduled)
                      </div>
                      <div className="text-zinc-500 text-[11px]">
                        ₦{(cust.finalTotalNGN || 0).toLocaleString()}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          cust.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        ✓ {cust.paymentStatus}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            cust.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {cust.status}
                        </span>
                        <div>
                          {cust.isPasswordSet ? (
                            <span className="text-[10px] font-semibold text-emerald-600 block">
                              ● Password Activated
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-600 block">
                              ⏳ Awaiting Magic Link
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        {/* Magic Link Action */}
                        <button
                          type="button"
                          onClick={() => handleGenerateMagicLinkForExisting(cust)}
                          className="px-3 py-1.5 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs transition cursor-pointer flex items-center space-x-1"
                          title="Generate or view magic onboarding link"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                          <span>Magic Link</span>
                        </button>

                        {/* Add More Meal Days Action */}
                        <button
                          type="button"
                          onClick={() => handleOpenAddMoreMealDays(cust)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-[#FF4C00] text-white font-bold text-xs transition cursor-pointer flex items-center space-x-1.5"
                          title="Add more meal days to customer plan"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 text-[#FF4C00]" />
                          <span>Add Meal Days</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD NEW CUSTOMER MODAL WITH FULL INVOICE SYNC & MEAL CALENDAR */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-y-auto font-['Poppins']">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-[#1A1A1A] text-white flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FF4C00] bg-[#FF4C00]/20 border border-[#FF4C00]/30 px-2.5 py-0.5 rounded-full">
                    Customer Onboarding Flow
                  </span>
                  {syncedOrderRef && (
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                      Synced from Invoice {syncedOrderRef}
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Onboard Customer & Assign Meal Days
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Fill in customer details matching their invoice, pick their paid days on the calendar, and generate a magic link.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Stepper / Tab Toggle */}
            <div className="flex border-b border-zinc-200 bg-zinc-50 text-xs font-bold">
              <button
                type="button"
                onClick={() => setModalTab('details')}
                className={`flex-1 py-3 px-4 text-center border-b-2 transition cursor-pointer ${
                  modalTab === 'details'
                    ? 'border-[#FF4C00] text-[#FF4C00] bg-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                1. Customer & Delivery Info (Invoice Synced)
              </button>
              <button
                type="button"
                onClick={() => setModalTab('calendar')}
                className={`flex-1 py-3 px-4 text-center border-b-2 transition cursor-pointer flex items-center justify-center space-x-2 ${
                  modalTab === 'calendar'
                    ? 'border-[#FF4C00] text-[#FF4C00] bg-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Calendar className="w-4 h-4 text-[#FF4C00]" />
                <span>2. Select Meal Calendar Days ({custSelectedDays.length} selected)</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateCustomerSubmit} className="p-5 sm:p-7 space-y-6 text-xs max-h-[70vh] overflow-y-auto">
              
              {/* TAB 1: DETAILS */}
              {modalTab === 'details' && (
                <div className="space-y-4">
                  
                  {/* Quick Sync Dropdown if pending orders exist */}
                  {submittedOrders.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-orange-900 block">
                          ⚡ Quick Fill from Pending Homepage Invoices
                        </span>
                        <p className="text-[11px] text-orange-700">
                          Select an order to pre-fill all customer details and their exact calendar days.
                        </p>
                      </div>
                      <select
                        onChange={(e) => {
                          const ord = submittedOrders.find((o) => o.id === e.target.value);
                          if (ord) handleSyncFromInvoice(ord);
                        }}
                        defaultValue=""
                        className="bg-white border border-orange-300 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 focus:outline-hidden"
                      >
                        <option value="" disabled>Choose an order to sync...</option>
                        {submittedOrders.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.fullName} — {o.company} ({o.totalDays} days, ₦{o.finalTotalNGN.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Section Title matching homepage and everywhere */}
                  <div className="border-b border-zinc-200 pb-2">
                    <span className="text-xs font-bold text-black uppercase tracking-wider block">
                      Your Contact & Desk Drop Details
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Standard corporate customer details matching homepage and subscriber dashboard
                    </span>
                  </div>

                  {/* Customer Identity Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-zinc-800 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={custFullName}
                        onChange={(e) => setCustFullName(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-black focus:outline-hidden focus:border-[#FF4C00]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-zinc-800 block mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        value={custEmail}
                        onChange={(e) => setCustEmail(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-black focus:outline-hidden focus:border-[#FF4C00]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-zinc-800 block mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="Phone Number"
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-black focus:outline-hidden focus:border-[#FF4C00]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-zinc-800 block mb-1">Workplace / Building *</label>
                      <input
                        type="text"
                        required
                        placeholder="Workplace / Office Building"
                        value={custCompany}
                        onChange={(e) => setCustCompany(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-black focus:outline-hidden focus:border-[#FF4C00]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-zinc-800 block mb-1">Delivery Address & Floor *</label>
                    <input
                      type="text"
                      required
                      placeholder="Floor & Suite / Delivery Details"
                      value={custOfficeAddress}
                      onChange={(e) => setCustOfficeAddress(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-black focus:outline-hidden focus:border-[#FF4C00]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-zinc-800 block mb-1">Payment Status</label>
                      <select
                        value={custPaymentStatus}
                        onChange={(e) => setCustPaymentStatus(e.target.value as any)}
                        className="w-full bg-[#FAF7F2] border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-black focus:outline-hidden focus:border-[#FF4C00]"
                      >
                        <option value="Paid">Paid (Flutterwave MFB Verified)</option>
                        <option value="Pending Verification">Pending Verification</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-zinc-800 block mb-1">Dietary Preferences / Allergy Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. No beef, extra hot sauce"
                        value={custNotes}
                        onChange={(e) => setCustNotes(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs font-medium text-black focus:outline-hidden focus:border-[#FF4C00]"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setModalTab('calendar')}
                      className="px-6 py-3 rounded-full bg-zinc-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition cursor-pointer"
                    >
                      <span>Proceed to Meal Calendar</span>
                      <ArrowRight className="w-4 h-4 text-[#FF4C00]" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: MEAL CALENDAR PICKER (IDENTICAL TO HOMEPAGE CALENDAR) */}
              {modalTab === 'calendar' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                    <div>
                      <h4 className="font-black text-sm text-zinc-900">
                        Select Paid Workday Lunches
                      </h4>
                      <p className="text-xs text-zinc-500">
                        Pick the exact days the customer paid for. You can choose their swallow preferences (Semo, Eba, Fufu) directly on swallow days.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalTab('details')}
                      className="text-xs text-[#FF4C00] font-bold hover:underline cursor-pointer"
                    >
                      ← Back to Details
                    </button>
                  </div>

                  {/* Embedded Homepage-Style Meal Calendar */}
                  <CustomerMealCalendarPicker
                    selectedDays={custSelectedDays}
                    onChange={(updated) => setCustSelectedDays(updated)}
                  />

                  {/* Submission Footer */}
                  <div className="pt-4 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs">
                      <span className="text-zinc-500">Assigning for: </span>
                      <strong className="text-zinc-900">{custFullName || 'Customer'} ({custCompany || 'Company'})</strong>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setShowAddCustomerModal(false)}
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-full border border-zinc-300 text-zinc-600 hover:bg-zinc-100 font-bold text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={custSelectedDays.length === 0}
                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] disabled:bg-zinc-300 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Create & Generate Magic Link</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      )}

      {/* MAGIC LINK RESULT MODAL (Section 4 & 5 Flow) */}
      {magicLinkNotice && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto font-['Poppins']">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200 shadow-2xl text-left space-y-5 animate-in fade-in zoom-in duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                    Magic Link Generated
                  </span>
                  <h4 className="text-lg font-black text-zinc-900 mt-0.5">
                    Account Activation Ready
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMagicLinkNotice(null)}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Plan Summary Card */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-zinc-900 text-sm block">
                    {magicLinkNotice.customer.fullName}
                  </span>
                  <span className="text-zinc-500 font-medium">
                    {magicLinkNotice.customer.email} • {magicLinkNotice.customer.company}
                  </span>
                </div>
                <span className="font-black text-[#FF4C00] text-sm">
                  {magicLinkNotice.customer.totalDays} Lunches
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 border-t border-zinc-200/60 pt-2">
                📍 {magicLinkNotice.customer.officeAddress} ({magicLinkNotice.customer.floorSuite})
              </p>
            </div>

            {/* Important Flow Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                Customer First-Time Experience:
              </span>
              <p className="text-[11px] leading-relaxed text-amber-800">
                When the user opens this link, the <strong>very first thing they do is set their password</strong>.
                Once set, they immediately enter their Lunch Dashboard with the exact days and meals you assigned!
              </p>
            </div>

            {/* Magic Link URL Field with Copy */}
            <div>
              <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider block mb-1.5">
                Magic Activation Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={magicLinkNotice.url}
                  className="flex-1 bg-zinc-100 border border-zinc-300 rounded-xl px-3 py-2 text-xs font-mono text-zinc-800 select-all focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => handleCopyMagicLink(magicLinkNotice.url)}
                  className="px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Share Actions */}
            <div className="pt-2 border-t border-zinc-100 flex flex-col sm:flex-row gap-2.5">
              
              {/* WhatsApp Share Button */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hello ${magicLinkNotice.customer.fullName}, your 11 to 12 corporate lunch subscription (${magicLinkNotice.customer.totalDays} meals) is confirmed! Click here to set your password and access your Lunch Dashboard: ${magicLinkNotice.url}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Send WhatsApp</span>
              </a>

              {/* Email Share Button */}
              <a
                href={`mailto:${magicLinkNotice.customer.email}?subject=${encodeURIComponent(
                  'Your 11 to 12 Lunch Subscription Activation Link'
                )}&body=${encodeURIComponent(
                  `Hello ${magicLinkNotice.customer.fullName},\n\nYour ${magicLinkNotice.customer.totalDays} workday lunch plan is set up.\n\nClick this magic link to set your password and access your Lunch Dashboard:\n${magicLinkNotice.url}\n\nWarm regards,\n11 to 12 Kitchen Team`
                )}`}
                className="flex-1 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <Mail className="w-4 h-4 text-zinc-600" />
                <span>Send Email</span>
              </a>

              {/* Direct Open Activation Page Button */}
              <a
                href={magicLinkNotice.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer"
                title="Open user's personalized activation portal"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Activation Page</span>
              </a>

            </div>

          </div>
        </div>
      )}

      {/* CUSTOMER PROFILE DETAILS MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Poppins']">
          <div className="relative w-full max-w-xl bg-white text-zinc-900 rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden my-6">
            <div className="p-6 border-b border-zinc-100 bg-[#FAF7F2] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4C00] bg-[#FF4C00]/10 px-2 py-0.5 rounded-full">
                  Customer Profile
                </span>
                <h3 className="text-xl font-black text-black mt-1">
                  {selectedCustomer.fullName}
                </h3>
                <p className="text-xs text-zinc-500 font-medium">
                  {selectedCustomer.company} • {selectedCustomer.deliveryArea}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const cust = selectedCustomer;
                    handleOpenAddMoreMealDays(cust);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#FF4C00] hover:bg-[#E04300] text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Add More Meal Days</span>
                </button>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 rounded-full hover:bg-zinc-200 transition text-zinc-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs text-left max-h-[75vh] overflow-y-auto">
              
              {/* Plan Card */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  SUBSCRIPTION PLAN
                </span>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-bold text-sm text-black">{selectedCustomer.planName}</span>
                  <span className="font-black text-black text-base">
                    ₦{(selectedCustomer.finalTotalNGN || 0).toLocaleString()}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500 block">
                  {selectedCustomer.totalDays} Total Meals • Payment: <strong className="text-emerald-600">{selectedCustomer.paymentStatus}</strong>
                </span>
              </div>

              {/* Delivery Desk */}
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  DELIVERY DESK DROP
                </span>
                <p className="font-semibold text-zinc-800 text-xs">
                  {selectedCustomer.officeAddress} ({selectedCustomer.floorSuite})
                </p>
                <p className="text-zinc-500 text-[11px] pt-0.5">
                  {selectedCustomer.phone} • {selectedCustomer.email}
                </p>
              </div>

              {/* Selected Days Count */}
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  ASSIGNED CALENDAR MEALS ({selectedCustomer.selectedDays?.length || 0})
                </span>
                {selectedCustomer.selectedDays && selectedCustomer.selectedDays.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedCustomer.selectedDays.map((d, idx) => (
                      <div key={idx} className="p-2 rounded-xl border border-zinc-200 bg-zinc-50 text-[11px]">
                        <span className="font-bold text-zinc-900 block">{d.dateStr}</span>
                        <span className="text-zinc-600 truncate block">{d.meal.mealName}</span>
                        {d.selectedSwallow && (
                          <span className="text-[10px] font-bold text-[#FF4C00]">
                            Swallow: {d.selectedSwallow}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400 italic">No specific calendar meals selected yet.</p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-zinc-100 flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const cust = selectedCustomer;
                    handleOpenAddMoreMealDays(cust);
                  }}
                  className="px-4 py-2 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs cursor-pointer flex items-center space-x-1.5 transition shadow-xs"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Add More Meal Days</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleGenerateMagicLinkForExisting(selectedCustomer);
                    setSelectedCustomer(null);
                  }}
                  className="px-4 py-2 rounded-full border border-purple-300 bg-purple-50 text-purple-900 hover:bg-purple-100 font-bold text-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                  <span>Generate Magic Link</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ADD MORE MEAL DAYS MODAL */}
      {addingDaysCustomer && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto font-['Poppins']">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-zinc-100 bg-[#FAF7F2] shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF4C00]/10 text-[#FF4C00] flex items-center justify-center font-bold">
                  <CalendarPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black">
                    Add More Meal Days • {addingDaysCustomer.fullName}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {addingDaysCustomer.company} • {addingDaysCustomer.deliveryArea || 'Victoria Island'} ({addingDaysCustomer.officeAddress})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAddingDaysCustomer(null)}
                className="p-2 rounded-full hover:bg-zinc-200 transition text-zinc-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Stat Strip */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">
                    Initial Subscription
                  </span>
                  <span className="text-base font-black text-zinc-900">
                    {addingDaysCustomer.selectedDays?.length || 0} meals
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">
                    Updated Calendar Total
                  </span>
                  <span className="text-base font-black text-black">
                    {additionalSelectedDays.length} meals
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 uppercase tracking-wider font-bold block">
                    Net New Meals Added
                  </span>
                  <span className="text-base font-black text-emerald-600">
                    +{Math.max(0, additionalSelectedDays.length - (addingDaysCustomer.selectedDays?.length || 0))} days
                  </span>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-xs text-zinc-600">
                <p>
                  Click on any available workday below to assign additional lunches for <strong>{addingDaysCustomer.fullName}</strong>. On Friday swallow days, you can choose their preferred swallow (Semo, Eba, or Fufu). Days already scheduled are preserved.
                </p>
              </div>

              {/* Calendar Picker Component */}
              <CustomerMealCalendarPicker
                selectedDays={additionalSelectedDays}
                onChange={(updated) => setAdditionalSelectedDays(updated)}
              />

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-zinc-200 bg-[#FAF7F2] shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-zinc-600">
                <span>Saving updates for: </span>
                <strong className="text-black">{addingDaysCustomer.fullName}</strong>
                <span> • </span>
                <span className="font-semibold text-[#FF4C00]">{additionalSelectedDays.length} days total</span>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setAddingDaysCustomer(null)}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-full border border-zinc-300 text-zinc-600 hover:bg-zinc-100 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAdditionalDays}
                  disabled={additionalSelectedDays.length === 0}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] disabled:bg-zinc-300 text-white font-black text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>Save & Update Meal Days</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

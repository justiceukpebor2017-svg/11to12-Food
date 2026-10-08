import React, { useState, useMemo } from 'react';
import { CustomerRecord } from '../../../types';
import { exportToCsv } from '../../../utils/csvExport';
import {
  formatCredentialEmailMessage,
  formatCredentialWhatsAppMessage,
} from '../../../utils/credentialUtils';
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
} from 'lucide-react';

interface AdminCustomersTabProps {
  customers: CustomerRecord[];
  onUpdateCustomer?: (customer: CustomerRecord) => void;
  onDeleteCustomer?: (customerId: string) => void;
  selectedCustomer?: CustomerRecord | null;
  onCloseCustomerProfile?: () => void;
  onOpenCustomerProfile?: (customer: CustomerRecord) => void;
}

export const AdminCustomersTab: React.FC<AdminCustomersTabProps> = ({
  customers,
  onUpdateCustomer,
  onDeleteCustomer,
  selectedCustomer: controlledSelectedCustomer,
  onCloseCustomerProfile,
  onOpenCustomerProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalSelectedCustomer, setInternalSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerRecord | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  // Edit form state
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPrimaryAddress, setEditPrimaryAddress] = useState('');
  const [editSecondAddress, setEditSecondAddress] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Paused' | 'Pending Activation'>('Active');

  const activeCustomer = controlledSelectedCustomer || internalSelectedCustomer;

  // Filter confirmed customers
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.officeAddress && c.officeAddress.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  // Open profile
  const handleOpenProfile = (cust: CustomerRecord) => {
    if (onOpenCustomerProfile) {
      onOpenCustomerProfile(cust);
    } else {
      setInternalSelectedCustomer(cust);
    }
    // initialize edit fields
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
  };

  // CSV Download
  const handleDownloadCsv = () => {
    const headers = [
      'Customer Name',
      'Email',
      'Phone',
      'Account Status',
      'Total Days',
      'Primary Delivery Address',
      'Second Delivery Address',
      'Password Status',
      'Credits Balance',
      'Order Amount (NGN)',
    ];

    const rows = filteredCustomers.map((c) => [
      c.fullName,
      c.email,
      c.phone,
      c.status,
      c.totalDays,
      c.officeAddress,
      c.secondAddress || '—',
      c.mustChangePassword ? 'Temporary Password' : 'Password Changed',
      c.creditsBalance || 0,
      c.finalTotalNGN || 0,
    ]);

    exportToCsv('customers-list', headers, rows);
  };

  // Resend Login
  const handleResendLogin = (cust: CustomerRecord) => {
    const pass = cust.defaultPassword || cust.password || 'DeskDrop#842';
    const emailMsg = formatCredentialEmailMessage({
      customerName: cust.fullName,
      email: cust.email,
      defaultPassword: pass,
      totalDays: cust.totalDays || cust.selectedDays?.length || 0,
      company: cust.company,
    });
    setResendNotice(`Login credentials resent to ${cust.email}. Details are ready to copy.`);
    setTimeout(() => setResendNotice(null), 4000);
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleConfirmDelete = () => {
    if (customerToDelete && onDeleteCustomer) {
      onDeleteCustomer(customerToDelete.id);
      if (activeCustomer?.id === customerToDelete.id) {
        handleCloseProfile();
      }
      setCustomerToDelete(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Poppins']">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Customers</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {customers.length} Confirmed
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            All subscribers whose payment and lunch schedules are confirmed
          </p>
        </div>

        <div className="flex items-center space-x-2">
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

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customers by name, email, phone, or address..."
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

      {/* Customer List Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
        {filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-zinc-500">
            <Users className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-700">No confirmed customers found</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {searchQuery ? 'Try a different search query.' : 'Customers will appear here once payment is verified.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-5">Name</th>
                  <th className="py-3 px-5">Contact</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Selected Lunches</th>
                  <th className="py-3 px-5">Primary Address</th>
                  <th className="py-3 px-5">Second Address</th>
                  <th className="py-3 px-5">Password Setup</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredCustomers.map((cust) => {
                  const isPasswordChanged = !cust.mustChangePassword && !cust.isDefaultPassword;

                  return (
                    <tr key={cust.id} className="hover:bg-zinc-50/80 transition">
                      <td className="py-3.5 px-5 font-bold text-zinc-900">
                        {cust.fullName}
                      </td>

                      <td className="py-3.5 px-5 text-zinc-600">
                        <div>{cust.email}</div>
                        <div className="text-[11px] font-mono text-zinc-400">{cust.phone}</div>
                      </td>

                      <td className="py-3.5 px-5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            cust.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-zinc-200 text-zinc-700'
                          }`}
                        >
                          {cust.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-bold text-zinc-900">
                          {cust.totalDays || cust.selectedDays?.length || 0} lunches
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-zinc-700 max-w-[160px] truncate" title={cust.officeAddress}>
                        {cust.officeAddress}
                      </td>

                      <td className="py-3.5 px-5 text-zinc-500 max-w-[140px] truncate" title={cust.secondAddress || '—'}>
                        {cust.secondAddress || '—'}
                      </td>

                      <td className="py-3.5 px-5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPasswordChanged
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isPasswordChanged ? 'Password Changed' : 'Temporary Password'}
                        </span>
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
                            onClick={() => handleResendLogin(cust)}
                            className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition cursor-pointer"
                            title="Resend Login Information"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

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

      {/* Customer Profile Modal */}
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
                    1. Personal Information
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

              {/* Section 2: Delivery Information */}
              <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                  2. Delivery Information
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
                        Second Delivery Address (Optional)
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
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Primary Delivery Address</span>
                      <span className="font-semibold text-zinc-900">{activeCustomer.officeAddress}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Second Delivery Address</span>
                      <span className="text-zinc-600">{activeCustomer.secondAddress || 'None provided'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Lunch Plan */}
              <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    3. Lunch Plan
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {activeCustomer.selectedDays?.length || 0} Lunches
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {activeCustomer.creditsBalance || 0} Credits
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-zinc-700">
                    <span>Skipped Meals:</span>
                    <span className="font-bold text-zinc-900">
                      {(activeCustomer.skippedDates || []).length > 0
                        ? `${activeCustomer.skippedDates?.length} skipped (${activeCustomer.skippedDates?.join(', ')})`
                        : '0 (None skipped)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-medium text-zinc-700">
                    <span>Lunch Credits Generated:</span>
                    <span className="font-bold text-emerald-600">
                      ₦{((activeCustomer.creditsBalance || 0) * 3200).toLocaleString()} ({activeCustomer.creditsBalance || 0} credits)
                    </span>
                  </div>

                  {/* Selected Days Preview */}
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">
                      Scheduled Meal Dates & Meals:
                    </span>
                    <div className="max-h-36 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-xl p-2 bg-zinc-50/60 text-xs">
                      {(activeCustomer.selectedDays || []).map((d, i) => {
                        const isSkipped = (activeCustomer.skippedDates || []).includes(d.dateStr);
                        return (
                          <div key={i} className="py-1.5 px-2 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-zinc-800">{d.dateStr}</span>
                              <span className="text-zinc-400">({d.day})</span>
                              {isSkipped && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                  Skipped
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-zinc-700 font-medium">{d.meal.mealName}</span>
                              {d.selectedSwallow && (
                                <span className="ml-1 text-[9px] font-bold text-[#FF4C00] bg-orange-50 px-1 py-0.2 rounded">
                                  {d.selectedSwallow}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Payment */}
              <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                  4. Payment
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Order Amount</span>
                    <span className="font-bold text-zinc-900 text-sm">
                      ₦{(activeCustomer.finalTotalNGN || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Payment Status</span>
                    <span className="font-bold text-emerald-600 text-xs">
                      {activeCustomer.paymentStatus || 'Paid'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Reference</span>
                    <span className="font-mono text-zinc-700 text-xs truncate block" title={activeCustomer.orderRef || activeCustomer.id}>
                      {activeCustomer.orderRef || activeCustomer.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Payment Date</span>
                    <span className="text-zinc-700 text-xs">
                      {activeCustomer.createdAt ? new Date(activeCustomer.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 5: Account & Login */}
              <div className="bg-zinc-900 text-white p-4 sm:p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    5. Account & Login
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeCustomer.mustChangePassword
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {activeCustomer.mustChangePassword ? 'Temporary Password Pending Change' : 'Personal Password Set'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-800/80 p-3 rounded-xl border border-zinc-700 font-mono text-xs">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Current / Default Password</span>
                    <span className="font-bold text-white text-sm">
                      {activeCustomer.defaultPassword || activeCustomer.password || 'DeskDrop#842'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          `Email: ${activeCustomer.email}\nPassword: ${activeCustomer.defaultPassword || activeCustomer.password || 'DeskDrop#842'}`,
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

                    <button
                      type="button"
                      onClick={() => handleResendLogin(activeCustomer)}
                      className="px-3 py-1.5 rounded-lg bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs transition cursor-pointer flex items-center space-x-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Resend Setup Info</span>
                    </button>
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

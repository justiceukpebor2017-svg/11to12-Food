import React, { useState, useEffect } from 'react';
import { CustomerRecord } from '../../types';
import {
  X,
  KeyRound,
  Mail,
  Copy,
  Check,
  Send,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Building,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import {
  generateDefaultPassword,
  formatCredentialWhatsAppMessage,
  formatCredentialEmailMessage,
} from '../../utils/credentialUtils';

interface CustomerCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerRecord | null;
  onUpdatePassword: (customerId: string, newDefaultPassword: string) => void;
}

export const CustomerCredentialsModal: React.FC<CustomerCredentialsModalProps> = ({
  isOpen,
  onClose,
  customer,
  onUpdatePassword,
}) => {
  if (!isOpen || !customer) return null;

  const [currentPassword, setCurrentPassword] = useState(
    customer.password || customer.defaultPassword || generateDefaultPassword()
  );
  const [showPassword, setShowPassword] = useState(true);
  const [copiedType, setCopiedType] = useState<'password' | 'email' | 'all' | 'wa' | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if customer password changes in real-time across devices
  useEffect(() => {
    if (customer) {
      setCurrentPassword(customer.password || customer.defaultPassword || '');
    }
  }, [customer?.id, customer?.password, customer?.defaultPassword]);

  const handleGenerateNew = () => {
    const newPass = generateDefaultPassword();
    setCurrentPassword(newPass);
    onUpdatePassword(customer.id, newPass);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleManualSave = () => {
    if (!currentPassword.trim()) return;
    onUpdatePassword(customer.id, currentPassword.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCopy = (text: string, type: 'password' | 'email' | 'all' | 'wa') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const waMessage = formatCredentialWhatsAppMessage({
    customerName: customer.fullName,
    email: customer.email,
    defaultPassword: currentPassword,
    totalDays: customer.totalDays,
    company: customer.company,
  });

  const emailData = formatCredentialEmailMessage({
    customerName: customer.fullName,
    email: customer.email,
    defaultPassword: currentPassword,
    totalDays: customer.totalDays,
    company: customer.company,
  });

  const phoneDigits = customer.phone ? customer.phone.replace(/\D/g, '') : '';
  const waTarget = phoneDigits.startsWith('234')
    ? phoneDigits
    : phoneDigits.startsWith('0')
    ? `234${phoneDigits.slice(1)}`
    : `234${phoneDigits}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs font-['Poppins']">
      <div className="relative w-full max-w-lg bg-white text-zinc-900 rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-[#FAF7F2] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF4C00]/15 text-[#FF4C00] flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-black">Customer Login Credentials</h3>
              <p className="text-xs text-zinc-500">Default Password & Multi-Device Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-200 transition text-zinc-400 hover:text-zinc-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Subscriber Identity Summary Card */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-base font-bold text-zinc-900">{customer.fullName}</h4>
                <div className="flex items-center space-x-2 text-xs text-zinc-500 mt-0.5">
                  <Building className="w-3.5 h-3.5" />
                  <span>{customer.company || 'Corporate Client'}</span>
                  <span>•</span>
                  <span>{customer.totalDays} Workdays Plan</span>
                </div>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  customer.isDefaultPassword !== false
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {customer.isDefaultPassword !== false ? '🟡 Default Password' : '🟢 Custom Password Set'}
              </span>
            </div>

            <div className="text-xs text-zinc-600 pt-1">
              📍 <strong>Desk Drop:</strong> {customer.officeAddress} ({customer.floorSuite || 'Desk Drop'})
            </div>
          </div>

          {/* Email Login Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block">
              1. Registered Login Email
            </label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  readOnly
                  value={customer.email}
                  className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-800 outline-none select-all"
                />
              </div>
              <button
                type="button"
                onClick={() => handleCopy(customer.email, 'email')}
                className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shrink-0"
              >
                {copiedType === 'email' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedType === 'email' ? 'Copied' : 'Copy Email'}</span>
              </button>
            </div>
          </div>

          {/* Default Password Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block">
                2. Customer Password
              </label>
              <button
                type="button"
                onClick={handleGenerateNew}
                className="text-xs font-bold text-[#FF4C00] hover:text-[#d43f00] flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generate Random Password</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative flex-1 flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter or generate password"
                  className="w-full bg-white border border-zinc-300 focus:border-[#FF4C00] rounded-xl pl-4 pr-10 py-2.5 text-sm font-mono font-bold text-zinc-900 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(currentPassword, 'password')}
                className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shrink-0"
              >
                {copiedType === 'password' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedType === 'password' ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleManualSave}
                className="px-3.5 py-2.5 bg-[#FF4C00] hover:bg-[#E04300] text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                Save
              </button>
            </div>

            {saveSuccess && (
              <span className="text-xs text-emerald-600 font-bold block animate-fadeIn">
                ✓ Password updated and synced in real-time!
              </span>
            )}
            
            <p className="text-[11px] text-zinc-500">
              When the user logs in for the first time with this default password, they will be prompted to create their permanent personal password.
            </p>
          </div>

          {/* Quick Dispatch Links */}
          <div className="pt-2 space-y-2.5">
            <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider block">
              3. Send Login Details to Customer
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* WhatsApp Button */}
              <a
                href={`https://wa.me/${waTarget}?text=${encodeURIComponent(waMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Send via WhatsApp</span>
              </a>

              {/* Email Client Button */}
              <a
                href={`mailto:${customer.email}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`}
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-sm"
              >
                <Mail className="w-4 h-4" />
                <span>Send via Email Client</span>
              </a>
            </div>

            {/* Copy Full Credentials Text */}
            <button
              type="button"
              onClick={() => handleCopy(waMessage, 'all')}
              className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer border border-zinc-200"
            >
              {copiedType === 'all' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedType === 'all' ? 'Full Credentials Message Copied!' : 'Copy Full Formatted Message'}</span>
            </button>
          </div>

          {/* Real-time sync guarantee */}
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center space-x-2 text-[11px] text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Real-time Sync Active: When the customer changes their password on their device, it updates this dashboard automatically.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 bg-[#FAF7F2] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-full transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Shield, FileText, Cookie, RefreshCw, X, Check, Building, Mail, Phone } from 'lucide-react';
import { CONTACT_CONFIG } from '../../config/contactConfig';

export type PolicyTab = 'privacy' | 'terms' | 'cookies' | 'refund';

interface LegalPoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: PolicyTab;
}

export const LegalPoliciesModal: React.FC<LegalPoliciesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-90 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto font-['Poppins']">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-[#1A1A1A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#FF4C00]/20 rounded-2xl border border-[#FF4C00]/30 text-[#FF4C00]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">11 to 12 Legal & Policies</h3>
              <p className="text-xs text-zinc-400">11 to 12 Foods Limited • Lagos Corporate Desk Drops</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 bg-[#FAF7F2] p-2 gap-1 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-black hover:bg-zinc-200/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-black hover:bg-zinc-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cookies')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeTab === 'cookies'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-black hover:bg-zinc-200/60'
            }`}
          >
            <Cookie className="w-3.5 h-3.5" />
            <span>Cookie Policy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('refund')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeTab === 'refund'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-black hover:bg-zinc-200/60'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refund & Cancellation</span>
          </button>
        </div>

        {/* Policy Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto text-left text-xs sm:text-sm text-zinc-700 leading-relaxed space-y-5">
          
          {/* PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h4 className="text-base font-black text-zinc-900">Privacy Policy (NDPA & NDPR Compliant)</h4>
              <p className="text-zinc-500 text-xs">Last updated: October 2026</p>
              
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl text-xs text-orange-950 font-medium">
                <strong>Data Minimization Commitment:</strong> We only collect data strictly necessary to prepare and deliver hot lunches to your corporate workstation in Lagos. We do not sell, rent, or trade your personal data.
              </div>

              <h5 className="font-bold text-zinc-900">1. Data We Collect</h5>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-600">
                <li><strong>Identity Information:</strong> Full name and work email address.</li>
                <li><strong>Delivery Coordinates:</strong> Corporate building name, floor number, suite, and office area (Victoria Island, Ikoyi, Marina, Lekki Phase 1).</li>
                <li><strong>Contact Phone:</strong> WhatsApp or mobile number strictly for courier delivery arrival alerts.</li>
                <li><strong>Meal Preferences:</strong> Swallow selection, spice level, and dietary dislikes.</li>
              </ul>

              <h5 className="font-bold text-zinc-900">2. How We Use Your Data</h5>
              <p className="text-zinc-600">
                Your data is exclusively used to fulfill desk drop logistics, update your active lunch calendar, manage wallet credits, and dispatch couriers before 12:00 PM on workdays.
              </p>

              <h5 className="font-bold text-zinc-900">3. Data Security & Storage</h5>
              <p className="text-zinc-600">
                All records are securely stored and encrypted in transit. Passwords are never stored in plain text. You retain the right under Nigerian Data Protection legislation to inspect, update, or request deletion of your account.
              </p>
            </div>
          )}

          {/* TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <h4 className="text-base font-black text-zinc-900">Terms of Service</h4>
              <p className="text-zinc-500 text-xs">Effective for all desk drop subscribers</p>

              <h5 className="font-bold text-zinc-900">1. Delivery Window & Service Territory</h5>
              <p className="text-zinc-600">
                11 to 12 guarantees desk drop delivery between <strong>11:00 AM and 12:00 PM</strong> Monday through Friday (excluding statutory Nigerian public holidays) to registered corporate addresses in Victoria Island, Ikoyi, Marina, and Lekki Phase 1.
              </p>

              <h5 className="font-bold text-zinc-900">2. Plan Flexibility & Cutoff Rules</h5>
              <p className="text-zinc-600">
                Subscribers may pick their daily meals and specify swallow preferences anytime. Same-day lunch cancellations or date skips must be finalized before the <strong>12:00 PM daily cutoff</strong> to credit your wallet.
              </p>

              <h5 className="font-bold text-zinc-900">3. Payment & Subscription Activation</h5>
              <p className="text-zinc-600">
                Subscriptions and trial plans are activated upon receipt of payment verification. Invoices reflect genuine food preparation and delivery fees with transparent breakdowns.
              </p>
            </div>
          )}

          {/* COOKIE POLICY */}
          {activeTab === 'cookies' && (
            <div className="space-y-4">
              <h4 className="text-base font-black text-zinc-900">Cookie & Local Storage Policy</h4>
              <p className="text-zinc-500 text-xs">Essential operations only</p>

              <h5 className="font-bold text-zinc-900">1. Strictly Essential Cookies</h5>
              <p className="text-zinc-600">
                We use strictly essential local storage and first-party cookies to remember your authenticated subscriber session, preserve your default delivery desk preferences, and sync your selected meal calendar.
              </p>

              <h5 className="font-bold text-zinc-900">2. No Third-Party Tracking</h5>
              <p className="text-zinc-600">
                We do not deploy intrusive third-party advertising cookies or cross-site tracking beacons.
              </p>
            </div>
          )}

          {/* REFUND & CANCELLATION */}
          {activeTab === 'refund' && (
            <div className="space-y-4">
              <h4 className="text-base font-black text-zinc-900">Refund & Meal Credit Policy</h4>
              <p className="text-zinc-500 text-xs">Full credit preservation rules</p>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 font-medium">
                <strong>100% Credit Preservation:</strong> You never lose money on skipped lunches. Each skipped meal immediately credits ₦4,500 back to your wallet for future use or extra plates.
              </div>

              <h5 className="font-bold text-zinc-900">1. Meal Skipping vs. Refunds</h5>
              <p className="text-zinc-600">
                If you have an offsite meeting, travel, or change of schedule, skipping the meal preserves 100% of your credit in your wallet with no expiration date. You can redeem preserved credits anytime for additional colleague plates.
              </p>

              <h5 className="font-bold text-zinc-900">2. Service Guarantee & Refund Requests</h5>
              <p className="text-zinc-600">
                If a delivery fails to reach your desk due to a courier error or meal defect, we immediately issue an automatic extra meal credit or process a monetary refund to your original source upon request.
              </p>
            </div>
          )}

          {/* Registered Business Details Section */}
          <div className="pt-6 border-t border-zinc-200 bg-zinc-50 -mx-6 -mb-8 p-6 rounded-b-3xl space-y-2 text-xs">
            <h5 className="font-black text-zinc-900 uppercase tracking-wider text-[11px]">
              Registered Business Entity
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-zinc-600 pt-1">
              <div className="flex items-center space-x-2">
                <Building className="w-3.5 h-3.5 text-[#FF4C00] shrink-0" />
                <span className="truncate">11 to 12 Foods Limited</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-[#FF4C00] shrink-0" />
                <a href={`tel:${CONTACT_CONFIG.phoneClickable}`} className="hover:underline text-zinc-800 font-medium">
                  {CONTACT_CONFIG.phoneFormatted}
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-[#FF4C00] shrink-0" />
                <a href={`mailto:${CONTACT_CONFIG.email}`} className="hover:underline text-zinc-800 font-medium">
                  {CONTACT_CONFIG.email}
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-zinc-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-zinc-900 hover:bg-[#FF4C00] text-white font-bold text-xs transition cursor-pointer"
          >
            Close Policy
          </button>
        </div>

      </div>
    </div>
  );
};

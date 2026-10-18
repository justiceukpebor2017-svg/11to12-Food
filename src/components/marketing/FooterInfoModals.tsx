import React from 'react';
import { X, Sparkles, MapPin, Phone, Mail, Clock, MessageCircle, ShieldCheck, CheckCircle2, FileText, Utensils, Cookie, Lock } from 'lucide-react';
import { CONTACT_CONFIG } from '../../config/contactConfig';

export type FooterModalType = 'about' | 'contact' | 'terms' | 'privacy' | null;

interface FooterInfoModalsProps {
  activeModal: FooterModalType;
  onClose: () => void;
}

export const FooterInfoModals: React.FC<FooterInfoModalsProps> = ({ activeModal, onClose }) => {
  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto font-['Poppins'] animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white text-zinc-900 rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-zinc-100 bg-[#FAF7F2] shrink-0">
          <div className="flex items-center space-x-3">
            <img
              src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
              alt="11 to 12"
              className="h-8 w-auto object-contain"
            />
            <div>
              <h3 className="text-lg font-black text-black">
                {activeModal === 'about' && 'About 11 to 12 Desk Drop'}
                {activeModal === 'contact' && 'Contact Kitchen Operations'}
                {activeModal === 'terms' && 'Terms of Service & Delivery Policies'}
                {activeModal === 'privacy' && 'Privacy Policy & Data Protection'}
              </h3>
              <p className="text-xs text-zinc-500">
                {activeModal === 'about' && 'Lagos Workday Lunch Reimagined'}
                {activeModal === 'contact' && 'Direct Support & Workstation Delivery Inquiry'}
                {activeModal === 'terms' && 'Clear Guarantees & Operational Standards'}
                {activeModal === 'privacy' && 'NDPR Compliant • Transparent Data Practices'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-200 text-zinc-500 hover:text-black transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs sm:text-sm text-zinc-700 leading-relaxed">
          
          {/* 1. ABOUT US SCREEN */}
          {activeModal === 'about' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#FFF5EF] border border-[#FF4C00]/20 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#FF4C00] flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>The 11 to 12 Philosophy</span>
                </span>
                <p className="text-zinc-800 font-semibold text-sm">
                  Never leave your desk to scavenge for overpriced, cold lunch again.
                </p>
                <p className="text-xs text-zinc-600">
                  In fast-paced Nigerian corporate districts—Victoria Island, Ikoyi, Marina, and Lekki—lunch break is too short to endure rider delays, delivery app markups, and mediocre fast food.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-black text-sm flex items-center space-x-2">
                  <Utensils className="w-4 h-4 text-[#FF4C00]" />
                  <span>Piping-Hot Lunches Delivered Before Noon</span>
                </h4>
                <p>
                  11 to 12 was built specifically for Lagos professionals. Our kitchen operates on a strict batch-dispatch model: every single meal is prepared fresh in the morning, sealed into medical-grade double-wall insulated thermal bowls, and placed directly on your office workstation between <strong>11:00 AM and 12:00 PM</strong>.
                </p>
                <p>
                  When your official lunch hour strikes, your steaming Nigerian meal is already waiting right at your desk—ready to eat immediately without reheating or waiting in queues.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200">
                  <span className="font-black text-black block mb-1">0 Delivery Fees</span>
                  <p className="text-[11px] text-zinc-500">No surge pricing, rider tips, or hidden logistics costs ever.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200">
                  <span className="font-black text-black block mb-1">Authentic Nigerian</span>
                  <p className="text-[11px] text-zinc-500">26-day chef rotation: Jollof, Semo/Egusi, Yam Porridge, and Fish Stew.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200">
                  <span className="font-black text-black block mb-1">Flexible Credits</span>
                  <p className="text-[11px] text-zinc-500">Skip before 8 AM and roll over your lunch credit without penalty.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 text-xs space-y-1.5">
                <span className="font-bold text-zinc-900 block">Kitchen Base & Corporate Coverage:</span>
                <p className="text-zinc-600">
                  Direct route drops serving corporate buildings across Victoria Island, Ikoyi, Broad Street Marina, and Lekki Phase 1, Lagos.
                </p>
              </div>
            </div>
          )}

          {/* 2. CONTACT US SCREEN */}
          {activeModal === 'contact' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#FF4C00] flex items-center space-x-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Direct Communication Lines</span>
                </span>
                <p className="text-zinc-800 font-semibold text-sm">
                  We are reachable via WhatsApp, Phone, and Email throughout workday hours.
                </p>
                <p className="text-xs text-zinc-600">
                  Have inquiries regarding group corporate billing, dietary modifications, office building route addition, or payment verification? Reach out immediately.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${CONTACT_CONFIG.whatsappIntl}?text=${encodeURIComponent('Hello 11 to 12! I would like to inquire about lunch desk drop delivery.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-start space-x-3 transition cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-950 block text-xs">WhatsApp Instant Support</span>
                    <span className="text-xs font-semibold text-emerald-700 mt-0.5 block">{CONTACT_CONFIG.whatsappDisplay}</span>
                    <span className="text-[10px] text-emerald-600 mt-1 block group-hover:underline">Click to chat directly →</span>
                  </div>
                </a>

                {/* Direct Phone */}
                <a
                  href={`tel:${CONTACT_CONFIG.whatsappDisplay.replace(/\s+/g, '')}`}
                  className="p-4 rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-200 flex items-start space-x-3 transition cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#FF4C00] text-white flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-orange-950 block text-xs">Direct Operations Hotline</span>
                    <span className="text-xs font-semibold text-orange-700 mt-0.5 block">{CONTACT_CONFIG.whatsappDisplay}</span>
                    <span className="text-[10px] text-orange-600 mt-1 block group-hover:underline">Click to dial hotline →</span>
                  </div>
                </a>

                {/* Email Support */}
                <a
                  href={`mailto:${CONTACT_CONFIG.supportEmail}`}
                  className="p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 flex items-start space-x-3 transition cursor-pointer group sm:col-span-2"
                >
                  <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-black block text-xs">Email Orders & Accounts</span>
                    <span className="text-xs font-semibold text-zinc-700 mt-0.5 block">{CONTACT_CONFIG.supportEmail}</span>
                    <span className="text-[10px] text-zinc-500 mt-1 block">Official remittance, company invoices & billing reconciliations</span>
                  </div>
                </a>
              </div>

              {/* Operating Hours & Kitchen Base */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="flex items-start space-x-3 text-xs">
                  <Clock className="w-4 h-4 text-[#FF4C00] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black block">Customer Care Hours</span>
                    <span className="text-zinc-600">Monday – Friday: 8:00 AM – 5:00 PM WAT</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-xs">
                  <MapPin className="w-4 h-4 text-[#FF4C00] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black block">Central Kitchen Hub</span>
                    <span className="text-zinc-600">Victoria Island Commercial Kitchen Hub, Lagos, Nigeria</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. TERMS OF SERVICE SCREEN */}
          {activeModal === 'terms' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#FF4C00] flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Fair Corporate Subscription Terms</span>
                </span>
                <p className="text-zinc-800 font-semibold text-sm">
                  Transparent guidelines designed for working professionals.
                </p>
                <p className="text-xs text-zinc-600">
                  Last updated: October 2026. By reserving or subscribing to 11 to 12 Desk Drop, you agree to these clear operational terms.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-black text-xs uppercase tracking-wider">
                    1. Workstation Delivery Guarantee Window
                  </h4>
                  <p className="text-zinc-600 text-xs">
                    All lunches are dispatched on dedicated routes to arrive at your workplace front desk or designated floor drop point between <strong>11:00 AM and 12:00 PM</strong> on active scheduled workdays. 11 to 12 does not charge additional delivery fees.
                  </p>
                </div>

                <div className="space-y-1.5 border-t border-zinc-100 pt-3">
                  <h4 className="font-bold text-black text-xs uppercase tracking-wider">
                    2. Lunch Skip & Flexible Credit Policy
                  </h4>
                  <p className="text-zinc-600 text-xs">
                    Need to attend an offsite client meeting or working from home? You can skip any upcoming lunch directly from your Subscriber Dashboard before <strong>8:00 AM WAT</strong> on that delivery day. Skipped lunches convert automatically into 1 flexible Meal Credit that never expires and can be redeemed for extra plates or future rollover days.
                  </p>
                </div>

                <div className="space-y-1.5 border-t border-zinc-100 pt-3">
                  <h4 className="font-bold text-black text-xs uppercase tracking-wider">
                    3. Minimum Plan Requirement & 20th Day Reward
                  </h4>
                  <p className="text-zinc-600 text-xs">
                    To maintain dedicated kitchen batch efficiency and workstation logistics, lunch plans require a minimum selection of 8 workdays. Subscribers who select 20 or more workdays in a plan cycle receive the 20th workday meal completely free as our loyalty bonus.
                  </p>
                </div>

                <div className="space-y-1.5 border-t border-zinc-100 pt-3">
                  <h4 className="font-bold text-black text-xs uppercase tracking-wider">
                    4. Food Safety, Hygiene & Thermal Bowls
                  </h4>
                  <p className="text-zinc-600 text-xs">
                    Meals are cooked fresh each morning in our licensed commercial facility adhering to NAFDAC and Lagos State hygiene standards. All meals are heat-sealed in premium thermal containers. Any specific allergy or dietary preference noted in your profile is tracked on your kitchen label.
                  </p>
                </div>

                <div className="space-y-1.5 border-t border-zinc-100 pt-3">
                  <h4 className="font-bold text-black text-xs uppercase tracking-wider">
                    5. Payment & Account Verification
                  </h4>
                  <p className="text-zinc-600 text-xs">
                    Payments are remitted via corporate bank transfer or verified gateways. Once transfer proof is matched by kitchen operations, the customer account is activated and credentials provided for dashboard login.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. PRIVACY POLICY SCREEN */}
          {activeModal === 'privacy' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#FFF8F4] border border-[#FF4C00]/25 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#FF4C00] flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Nigeria Data Protection Regulation (NDPR) & NDPA Compliance</span>
                </span>
                <p className="text-zinc-900 font-bold text-sm">
                  11 TO 12 FOODS LTD Data Protection & Privacy Policy
                </p>
                <p className="text-xs text-zinc-600">
                  Effective Date: October 2026. This policy governs how we collect, handle, store, and protect your personal and delivery data when using the 11 to 12 Desk Drop platform.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-black text-xs uppercase tracking-wider flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FF4C00]" />
                    <span>1. Information We Collect</span>
                  </h4>
                  <p className="text-zinc-600 text-xs leading-relaxed">
                    We collect only the essential information needed to prepare, heat-seal, and hand-deliver your hot meals directly to your workplace:
                  </p>
                  <ul className="list-disc pl-5 text-xs text-zinc-600 space-y-1 mt-1">
                    <li><strong>Contact Details:</strong> Full Name, Corporate/Personal Email address, WhatsApp and Phone number.</li>
                    <li><strong>Workplace Delivery Address:</strong> Company/Building Name, Office Address, Floor/Suite, and Desk Drop delivery corridor (e.g. Victoria Island, Ikoyi, Marina, Lekki, Epe, Ajah, Sangotedo, Chevron, Jakunde, Lakowe, Eleko, Obalende).</li>
                    <li><strong>Lunch Preferences:</strong> Workdays chosen, Swallow selections (Eba, Semo, Fufu), soup choices, and allergy or dietary notices.</li>
                    <li><strong>Payment & Verification Records:</strong> Order reference IDs, payment verification timestamps, and invoice slips. We do not store credit card CVV or banking passwords; all payments are processed through verified direct settlement channels (Moniepoint MFB, Wema Bank, Flutterwave MFB).</li>
                  </ul>
                </div>

                <div className="space-y-1.5 border-t border-zinc-100 pt-3">
                  <h4 className="font-bold text-black text-xs uppercase tracking-wider flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FF4C00]" />
                    <span>2. Purpose & Legal Basis of Processing</span>
                  </h4>
                  <p className="text-zinc-600 text-xs leading-relaxed">
                    Your data is processed strictly under lawful contractual necessity and explicit consent to:
                  </p>
                  <ul className="list-disc pl-5 text-xs text-zinc-600 space-y-1 mt-1">
                    <li>Fulfill daily lunch preparation and drop-off to your desk between 11:00 AM and 12:00 PM.</li>
                    <li>Provide instant delivery alerts and WhatsApp concierge customer support.</li>
                    <li>Manage your meal skip credits and account rollover balance.</li>
                    <li>Generate authentic tax-compliant invoices and verify payment receipts.</li>
                  </ul>
                </div>

                <div className="space-y-1.5 border-t border-zinc-100 pt-3">
                  <h4 className="font-bold text-black text-xs uppercase tracking-wider flex items-center space-x-1.5">
                    <Cookie className="w-3.5 h-3.5 text-[#FF4C00]" />
                    <span>3. Cookies & Local Storage Policy</span>
                  </h4>
                  <p className="text-zinc-600 text-xs leading-relaxed">
                    We use cookies and browser local storage responsibly:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                      <span className="font-bold text-black block text-xs mb-1">Essential Cookies</span>
                      <p className="text-[11px] text-zinc-500">
                        Required for session persistence, authentication, keeping lunch day selections intact, and securing multi-device admin logins.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                      <span className="font-bold text-black block text-xs mb-1">Preference & Analytics</span>
                      <p className="text-[11px] text-zinc-500">
                        Remembers your swallow choices, meal rotations, and anonymous dispatch corridor traffic metrics.
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 pt-1">
                    You can click <strong>"Reject Cookies"</strong> on our consent banner to disable non-essential cookies at any time, or modify preferences via the footer link.
                  </p>
                </div>

                <div className="space-y-1.5 border-t border-zinc-100 pt-3">
                  <h4 className="font-bold text-black text-xs uppercase tracking-wider flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#FF4C00]" />
                    <span>4. Data Security, Retention & Third Parties</span>
                  </h4>
                  <p className="text-zinc-600 text-xs leading-relaxed">
                    We employ modern TLS 1.3 encryption for all data in transit, strict role-based admin session protections, and automated live database replication. We never sell or rent your personal data to advertisers. Information is only shared with our internal dispatch drivers for the sole purpose of finding your desk.
                  </p>
                </div>

                <div className="space-y-1.5 border-t border-zinc-100 pt-3">
                  <h4 className="font-bold text-black text-xs uppercase tracking-wider flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FF4C00]" />
                    <span>5. Your Data Rights Under Nigerian Law</span>
                  </h4>
                  <p className="text-zinc-600 text-xs leading-relaxed">
                    Under the Nigeria Data Protection Act, you have the right to:
                  </p>
                  <ul className="list-disc pl-5 text-xs text-zinc-600 space-y-1 mt-1">
                    <li>Access and review all personal and order data linked to your account.</li>
                    <li>Update your corporate delivery location or contact numbers anytime.</li>
                    <li>Request total deletion and erasure of your profile and historical records.</li>
                    <li>Withdraw consent or opt out of notification channels.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-1.5">
                  <span className="font-bold text-black block">Data Protection Officer & Privacy Inquiries:</span>
                  <p className="text-zinc-600">
                    If you have questions regarding this Privacy Policy or wish to exercise your data rights, contact our Data Protection desk:
                  </p>
                  <div className="pt-1 space-y-0.5 font-medium text-zinc-800">
                    <div>✉️ Email: <span className="text-[#FF4C00]">privacy@11to12.food</span> / <span className="text-[#FF4C00]">{CONTACT_CONFIG.supportEmail}</span></div>
                    <div>📱 Phone / WhatsApp: <span className="text-[#FF4C00]">{CONTACT_CONFIG.whatsappDisplay}</span></div>
                    <div>📍 Office: 11 to 12 Foods Ltd, Victoria Island / Lekki Corridor, Lagos State, Nigeria.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Close Button */}
        <div className="p-4 sm:p-5 border-t border-zinc-100 bg-[#FAF7F2] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

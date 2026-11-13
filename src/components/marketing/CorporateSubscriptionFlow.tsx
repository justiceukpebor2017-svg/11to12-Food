import React, { useState, useEffect, useMemo } from 'react';
import {
  CorporateAccount,
  CorporateEmployeeRecord,
  OrderSubmission,
  OFFICIAL_BANK_DETAILS,
} from '../../types';
import { calculateTieredOrderTotal } from '../../config/pricingConfig';
import { CONTACT_CONFIG } from '../../config/contactConfig';
import {
  saveCorporateAccountToFirestore,
  subscribeToCorporateAccount,
  subscribeToCorporateEmployees,
  getCorporateAccountByAccessCodeOrEmail,
  saveOrderToFirestore,
} from '../../services/firebase';
import { CANONICAL_8_WEEKS_MENU } from '../../data/menuRotation';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Users,
  CalendarDays,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  CreditCard,
  ShieldCheck,
  Utensils,
  Truck,
  Wallet,
  Loader2,
  AlertCircle,
  Upload,
  MessageSquare,
  Mail,
  Clock,
  Sparkles,
} from 'lucide-react';

interface CorporateSubscriptionFlowProps {
  onBackToPackages: () => void;
  onOpenEmployeeInvite: (account: CorporateAccount) => void;
  onCorporateOrderSubmitted?: (order: OrderSubmission) => void;
  externalEmployeesVersion?: number;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

function compressReceiptImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 900;
        let { width, height } = img;
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
          reject(new Error('Image compression failed'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = () => reject(new Error('Could not read image file'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

function buildIllustrativeDemoAccount(): CorporateAccount {
  return {
    id: 'corp-demo-50x20',
    companyName: 'Vanguard Horizon Technologies Ltd.',
    adminName: 'Tolu Adeyemi (People Ops)',
    adminEmail: 'peopleops@vanguardhorizon.ng',
    adminPhone: '0809 441 2200',
    officeAddress: '14 Adeola Odeku Street, Victoria Island, Lagos',
    totalEmployees: 50,
    usedSlots: 38,
    mealDaysPerEmployee: 20,
    pricePerEmployeeNGN: 64000,
    totalPackageNGN: 3200000,
    totalMealCredits: 1000,
    usedMealCredits: 380,
    inviteCode: 'CORP-VH5020',
    accessCode: 'BOSS-5020',
    paymentStatus: 'Confirmed',
    deliveryStatus: 'Scheduled',
    createdAt: new Date().toISOString(),
  };
}

function buildIllustrativeDemoEmployees(account: CorporateAccount): CorporateEmployeeRecord[] {
  const week1 = CANONICAL_8_WEEKS_MENU[0]?.days || [];
  const week2 = CANONICAL_8_WEEKS_MENU[1]?.days || [];
  const sampleDays = [...week1, ...week2].filter((d) => !d.isHoliday);

  const samplePeople = [
    { name: 'Adaeze Nwosu', dept: 'Product Design', desk: '3rd Floor · Desk 12', pickedCount: 20 },
    { name: 'Babajide Ogunleye', dept: 'Engineering', desk: '4th Floor · Desk 04', pickedCount: 20 },
    { name: 'Chisom Eze', dept: 'Finance', desk: '2nd Floor · Suite B', pickedCount: 18 },
    { name: 'Damilola Balogun', dept: 'Growth', desk: '3rd Floor · Desk 07', pickedCount: 20 },
    { name: 'Efosa Igbinedion', dept: 'Operations', desk: '1st Floor · Reception Wing', pickedCount: 10 },
  ];

  return samplePeople.map((person, idx) => {
    const pickedDays = sampleDays.slice(0, Math.min(person.pickedCount, sampleDays.length)).map((d, dIdx) => {
      const useOpt2 = (idx + dIdx) % 2 === 1;
      const mealTitle = useOpt2 ? d.option2 : d.option1;
      return {
        dateStr: d.dateStr,
        meal: {
          id: `demo-${d.dateStr}`,
          dateStr: d.dateStr,
          day: d.dayFull as any,
          mealName: mealTitle,
          mealCategory: (d.option1IsSwallow && !useOpt2 ? 'Swallow' : 'Rice') as any,
          hasDualOptions: true,
          selectedOptionId: useOpt2 ? ('opt-2' as const) : ('opt-1' as const),
        },
        selectedMealOption: {
          id: useOpt2 ? ('opt-2' as const) : ('opt-1' as const),
          name: mealTitle,
          category: 'Rice' as any,
        },
        selectedSwallow: (mealTitle.toLowerCase().includes('egusi') || mealTitle.toLowerCase().includes('efo')
          ? 'Semo'
          : undefined) as any,
      };
    });

    return {
      id: `demo-emp-${idx + 1}`,
      corporateId: account.id,
      inviteCode: account.inviteCode,
      companyName: account.companyName,
      fullName: person.name,
      email: `${person.name.toLowerCase().replace(/\s+/g, '.')}@vanguardhorizon.ng`,
      phone: `0803 555 010${idx}`,
      department: person.dept,
      deskLocation: person.desk,
      selectedDays: pickedDays,
      mealDaysAllocated: account.mealDaysPerEmployee,
      hasSelectedMeals: pickedDays.length > 0,
      registeredAt: new Date(Date.now() - idx * 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

export const CorporateSubscriptionFlow: React.FC<CorporateSubscriptionFlowProps> = ({
  onBackToPackages,
  onOpenEmployeeInvite,
  onCorporateOrderSubmitted,
}) => {
  const [activeView, setActiveView] = useState<'wizard' | 'lookup' | 'dashboard'>('wizard');
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);

  // Step 1 & Step 2 inputs
  const [totalEmployees, setTotalEmployees] = useState<number>(20);
  const [mealDaysPerEmployee, setMealDaysPerEmployee] = useState<number>(5);

  // Step 4 Company Details & Payment Proof
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [secondAddress, setSecondAddress] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [copiedBank, setCopiedBank] = useState<'moniepoint' | 'wema' | 'flw' | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [submittedAccount, setSubmittedAccount] = useState<CorporateAccount | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Employer Dashboard / Lookup state
  const [activeCorporate, setActiveCorporate] = useState<CorporateAccount | null>(null);
  const [employees, setEmployees] = useState<CorporateEmployeeRecord[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [lookupInput, setLookupInput] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  useEffect(() => {
    if (!activeCorporate || isDemoMode) return;
    const unsubAcct = subscribeToCorporateAccount(activeCorporate.id, (updated) => {
      if (updated) setActiveCorporate(updated);
    });
    const unsubEmps = subscribeToCorporateEmployees(activeCorporate.id, (list) => {
      setEmployees(list);
    });
    return () => {
      unsubAcct();
      unsubEmps();
    };
  }, [activeCorporate?.id, isDemoMode]);

  const perEmployeePricing = useMemo(() => {
    return calculateTieredOrderTotal(mealDaysPerEmployee);
  }, [mealDaysPerEmployee]);

  const pricePerEmployeeNGN = perEmployeePricing.totalNGN;
  const totalPackageNGN = totalEmployees * pricePerEmployeeNGN;
  const totalMealCredits = totalEmployees * mealDaysPerEmployee;

  const handleCopyAccount = (acct: string, bank: 'moniepoint' | 'wema' | 'flw') => {
    navigator.clipboard.writeText(acct);
    setCopiedBank(bank);
    setTimeout(() => setCopiedBank(null), 2500);
  };

  const handleProofFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSetupError(null);
    try {
      const compressed = await compressReceiptImage(file);
      setPaymentProofUrl(compressed);
      setProofFileName(file.name);
    } catch {
      setSetupError('Could not process that image file. Please try another screenshot or send directly via WhatsApp.');
    }
  };

  const handleOpenDemoDashboard = () => {
    const demoAcct = buildIllustrativeDemoAccount();
    const demoEmps = buildIllustrativeDemoEmployees(demoAcct);
    setIsDemoMode(true);
    setActiveCorporate(demoAcct);
    setEmployees(demoEmps);
    setActiveView('dashboard');
  };

  const handleLookupAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupInput.trim()) return;
    setLookupError(null);
    setIsLookingUp(true);
    try {
      const found = await getCorporateAccountByAccessCodeOrEmail(lookupInput);
      if (found) {
        setIsDemoMode(false);
        setActiveCorporate(found);
        setActiveView('dashboard');
      } else {
        setLookupError('No corporate account found for that Access Code or Work Email.');
      }
    } catch {
      setLookupError('Could not retrieve corporate dashboard. Please check your code and try again.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleWizardBack = () => {
    setSetupError(null);
    if (wizardStep === 1) {
      onBackToPackages();
    } else if (wizardStep === 5) {
      onBackToPackages();
    } else {
      setWizardStep((s) => (s - 1) as WizardStep);
    }
  };

  const handleSubmitCorporateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError(null);

    if (!companyName.trim() || !adminName.trim() || !adminEmail.trim() || !adminPhone.trim() || !officeAddress.trim()) {
      setSetupError('Please fill in your company name, HR contact details, and primary office address.');
      return;
    }

    setIsCreating(true);
    try {
      const nowIso = new Date().toISOString();
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const companyPrefix =
        companyName
          .trim()
          .replace(/[^a-zA-Z0-9]/g, '')
          .slice(0, 4)
          .toUpperCase() || 'TEAM';
      const inviteCode = `CORP-${companyPrefix}${randSuffix}`;
      const accessCode = `BOSS-${randSuffix}`;
      const corpId = `corp-${Date.now()}`;

      const newCorporate: CorporateAccount = {
        id: corpId,
        companyName: companyName.trim(),
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim().toLowerCase(),
        adminPhone: adminPhone.trim(),
        officeAddress: officeAddress.trim(),
        secondAddress: secondAddress.trim() || undefined,
        totalEmployees,
        usedSlots: 0,
        mealDaysPerEmployee,
        pricePerEmployeeNGN,
        totalPackageNGN,
        totalMealCredits,
        usedMealCredits: 0,
        inviteCode,
        accessCode,
        paymentStatus: 'Pending Verification',
        paymentProofUrl: paymentProofUrl || undefined,
        deliveryStatus: 'Scheduled',
        createdAt: nowIso,
      };

      await saveCorporateAccountToFirestore(newCorporate);

      const corpOrder: OrderSubmission = {
        id: `CORP-ORD-${randSuffix}`,
        fullName: `${adminName.trim()} (${companyName.trim()})`,
        email: adminEmail.trim().toLowerCase(),
        phone: adminPhone.trim(),
        company: companyName.trim(),
        officeAddress: officeAddress.trim(),
        secondAddress: secondAddress.trim() || undefined,
        selectedDays: [],
        totalDays: totalMealCredits,
        planName: `Corporate: ${totalEmployees} Employees × ${mealDaysPerEmployee} Meal Days`,
        subtotalNGN: totalPackageNGN,
        discountNGN: 0,
        finalTotalNGN: totalPackageNGN,
        submittedAt: nowIso,
        paymentStatus: 'Pending Verification',
        paymentProofUrl: paymentProofUrl || undefined,
        memberCode: inviteCode,
      };
      await saveOrderToFirestore(corpOrder).catch(() => {});
      if (onCorporateOrderSubmitted) {
        onCorporateOrderSubmitted(corpOrder);
      }

      setSubmittedAccount(newCorporate);
      setWizardStep(5);
    } catch (err: any) {
      setSetupError(err?.message || 'Unable to submit corporate request. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const dashboardStats = useMemo(() => {
    if (!activeCorporate) {
      return {
        invited: 0,
        registered: 0,
        selectedMealsCount: 0,
        remainingCredits: 0,
        remainingValueNGN: 0,
        dailyMealsBreakdown: [] as Array<{ dateStr: string; count: number; opt1: number; opt2: number }>,
      };
    }

    const invited = activeCorporate.totalEmployees;
    const registered = isDemoMode
      ? Math.max(38, employees.length)
      : Math.max(activeCorporate.usedSlots || 0, employees.length);
    const employeesWithMeals = employees.filter((e) => e.hasSelectedMeals && e.selectedDays.length > 0);
    const selectedMealsCount = isDemoMode
      ? Math.max(32, employeesWithMeals.length)
      : employeesWithMeals.length;

    const totalPlatesAllocated = employees.reduce((acc, e) => acc + (e.selectedDays?.length || 0), 0);
    const usedCredits = isDemoMode
      ? Math.max(activeCorporate.usedMealCredits, totalPlatesAllocated)
      : totalPlatesAllocated;

    const remainingCredits = Math.max(0, activeCorporate.totalMealCredits - usedCredits);
    const ratePerPlate = Math.round(
      activeCorporate.pricePerEmployeeNGN / Math.max(1, activeCorporate.mealDaysPerEmployee)
    );
    const remainingValueNGN = remainingCredits * ratePerPlate;

    const dailyMap = new Map<string, { dateStr: string; count: number; opt1: number; opt2: number }>();
    employees.forEach((emp) => {
      (emp.selectedDays || []).forEach((sel) => {
        const cur = dailyMap.get(sel.dateStr) || { dateStr: sel.dateStr, count: 0, opt1: 0, opt2: 0 };
        cur.count += 1;
        if (sel.selectedMealOption?.id === 'opt-2') cur.opt2 += 1;
        else cur.opt1 += 1;
        dailyMap.set(sel.dateStr, cur);
      });
    });

    const dailyMealsBreakdown = Array.from(dailyMap.values())
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr))
      .slice(0, 10);

    return {
      invited,
      registered,
      selectedMealsCount,
      remainingCredits,
      remainingValueNGN,
      dailyMealsBreakdown,
    };
  }, [activeCorporate, employees, isDemoMode]);

  const inviteUrl = activeCorporate
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?corp=${activeCorporate.inviteCode}`
    : '';

  const handleCopyInviteLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const whatsappProofUrl = `https://wa.me/${CONTACT_CONFIG.whatsappIntl}?text=${encodeURIComponent(
    `Hello 11:12 Food! We just submitted a Corporate Package payment for ${
      submittedAccount?.companyName || companyName || 'our company'
    }: ${totalEmployees} employees × ${mealDaysPerEmployee} meal days (Total: ₦${totalPackageNGN.toLocaleString()}). HR Contact: ${
      adminName || 'HR Team'
    } (${adminPhone || ''}). Attached is our transfer proof so Admin can verify and generate our company link.`
  )}`;

  const emailProofUrl = `mailto:${CONTACT_CONFIG.supportEmail}?subject=${encodeURIComponent(
    `Corporate Meal Payment Proof - ${submittedAccount?.companyName || companyName || 'Company Plan'}`
  )}&body=${encodeURIComponent(
    `Hello 11:12 Food Admin,\n\nPlease verify our corporate lunch package transfer:\n- Company: ${
      submittedAccount?.companyName || companyName
    }\n- Package: ${totalEmployees} employees × ${mealDaysPerEmployee} meal days\n- Total Paid: ₦${totalPackageNGN.toLocaleString()}\n- HR Contact: ${adminName} (${adminPhone})\n\nWe will attach our bank transfer screenshot to this email.`
  )}`;

  const stepLabels = [
    { step: 1, title: 'Employees' },
    { step: 2, title: 'Meal Days' },
    { step: 3, title: 'Price' },
    { step: 4, title: 'Details & Proof' },
    { step: 5, title: 'Submitted' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-['Poppins']">
      {/* Top Bar Controls — Orange Gradient + Gray (Zero Black Cards) */}
      <div className="bg-gradient-to-r from-[#FF4C00] via-[#FF5E14] to-[#FF8533] text-white rounded-3xl p-4 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={
              activeView === 'wizard'
                ? handleWizardBack
                : () => setActiveView('wizard')
            }
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-[#1A1A1A] text-xs font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{activeView === 'wizard' && wizardStep > 1 && wizardStep < 5 ? 'Back Step' : 'Go Back'}</span>
          </button>
          <div>
            <h3 className="text-lg sm:text-2xl font-black text-white">
              Your Boss Will Pay
            </h3>
            <p className="text-xs text-orange-50 font-medium">
              Step-by-step corporate team lunch subscription
            </p>
          </div>
        </div>

        {/* Switch between New Plan Wizard vs Employer Login */}
        <div className="flex items-center gap-1.5 p-1 bg-white/20 rounded-xl border border-white/25 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveView('wizard')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeView === 'wizard'
                ? 'bg-white text-[#FF4C00] shadow-xs'
                : 'text-white hover:bg-white/10'
            }`}
          >
            New Package
          </button>
          <button
            type="button"
            onClick={() => setActiveView('lookup')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeView === 'lookup' || activeView === 'dashboard'
                ? 'bg-white text-[#FF4C00] shadow-xs'
                : 'text-white hover:bg-white/10'
            }`}
          >
            Employer Portal
          </button>
        </div>
      </div>

      {/* WIZARD MODE */}
      {activeView === 'wizard' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Clean Step Progress Bar (Gray card) */}
          <div className="bg-zinc-200/80 border border-zinc-300 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            {stepLabels.map((item) => {
              const isActive = wizardStep === item.step;
              const isDone = wizardStep > item.step;
              return (
                <div
                  key={item.step}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white shadow-xs'
                      : isDone
                      ? 'bg-white text-emerald-700 border border-emerald-200'
                      : 'text-zinc-600'
                  }`}
                >
                  <span className="tabular-nums">0{item.step}.</span>
                  <span>{item.title}</span>
                </div>
              );
            })}
          </div>

          {/* STEP 1: NUMBER OF EMPLOYEES */}
          {wizardStep === 1 && (
            <div className="bg-zinc-100 border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
              <div className="space-y-2 text-center max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF4C00] to-[#FF782C] text-white flex items-center justify-center mx-auto shadow-sm">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#FF4C00]">
                  Step 1 of 4
                </p>
                <h4 className="text-2xl sm:text-3xl font-black text-black">
                  How many employees are on your team?
                </h4>
                <p className="text-sm text-zinc-600">
                  Pick a quick team size below or enter the exact number of workers. Each employee gets their own seat on your unique invite link.
                </p>
              </div>

              {/* Preset Buttons */}
              <div className="flex flex-wrap justify-center gap-2.5">
                {[10, 20, 30, 50, 100, 250].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTotalEmployees(num)}
                    className={`px-5 py-3 rounded-2xl text-sm font-black border transition cursor-pointer tabular-nums whitespace-nowrap ${
                      totalEmployees === num
                        ? 'bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white border-[#FF4C00] shadow-md scale-[1.03]'
                        : 'bg-white text-zinc-800 border-zinc-300 hover:border-[#FF4C00]'
                    }`}
                  >
                    {num} Workers
                  </button>
                ))}
              </div>

              {/* Custom Employee Number Slot */}
              <div className="max-w-xs mx-auto bg-white border border-zinc-300 rounded-2xl p-4 text-center space-y-2">
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider">
                  Or Enter Exact Number of Employees
                </label>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTotalEmployees((prev) => Math.max(2, prev - 1))}
                    className="w-10 h-10 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-black font-black text-lg cursor-pointer"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={2}
                    max={5000}
                    value={totalEmployees}
                    onChange={(e) => setTotalEmployees(Math.max(2, Number(e.target.value) || 2))}
                    className="w-28 text-center py-2 px-3 rounded-xl border border-zinc-300 focus:border-[#FF4C00] outline-none text-2xl font-black text-black tabular-nums"
                    aria-label="Number of employees"
                  />
                  <button
                    type="button"
                    onClick={() => setTotalEmployees((prev) => Math.min(5000, prev + 1))}
                    className="w-10 h-10 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-black font-black text-lg cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-200 gap-3">
                <button
                  type="button"
                  onClick={onBackToPackages}
                  className="px-5 py-3 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Packages</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] hover:from-[#E04300] hover:to-[#FF4C00] text-white text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <span>Next: Meal Days Per Employee</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: MEAL DAYS PER EMPLOYEE (SLIDER + DIRECT INPUT SLOT STARTING AT 5) */}
          {wizardStep === 2 && (
            <div className="bg-gradient-to-br from-[#FFF4ED] to-[#FFE8D8] border border-orange-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
              <div className="space-y-2 text-center max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF4C00] to-[#FF782C] text-white flex items-center justify-center mx-auto shadow-sm">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#FF4C00]">
                  Step 2 of 4 · {totalEmployees} Employees Selected
                </p>
                <h4 className="text-2xl sm:text-3xl font-black text-black">
                  Meal days per employee
                </h4>
                <p className="text-sm text-zinc-700">
                  Slide to increase meal days starting from 5 days, or type the exact number of days in the slot below.
                </p>
              </div>

              {/* Slider Toggle Effect + Input Slot Card */}
              <div className="bg-white border border-orange-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                      Selected Duration
                    </span>
                    <div className="text-4xl font-black text-[#FF4C00] tabular-nums mt-1">
                      {mealDaysPerEmployee} Days
                      <span className="text-sm font-bold text-zinc-500 ml-2">per employee</span>
                    </div>
                  </div>

                  {/* Direct Numeric Input Slot starting from 5 */}
                  <div className="bg-zinc-100 border border-zinc-300 rounded-2xl p-3 flex items-center gap-3 shrink-0">
                    <label htmlFor="corp-days-input" className="text-xs font-bold text-zinc-700 whitespace-nowrap">
                      Insert Days (min 5):
                    </label>
                    <input
                      id="corp-days-input"
                      type="number"
                      min={5}
                      max={60}
                      value={mealDaysPerEmployee}
                      onChange={(e) => {
                        const raw = parseInt(e.target.value, 10);
                        if (Number.isNaN(raw)) return;
                        setMealDaysPerEmployee(Math.max(5, Math.min(60, raw)));
                      }}
                      className="w-20 px-3 py-2 rounded-xl bg-white border border-zinc-300 focus:border-[#FF4C00] outline-none text-center text-lg font-black text-black tabular-nums"
                    />
                  </div>
                </div>

                {/* Interactive Range Slider starting from 5 days */}
                <div className="space-y-3">
                  <input
                    type="range"
                    min={5}
                    max={40}
                    step={1}
                    value={Math.min(40, Math.max(5, mealDaysPerEmployee))}
                    onChange={(e) => setMealDaysPerEmployee(Math.max(5, Number(e.target.value)))}
                    className="w-full h-3 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-[#FF4C00]"
                    aria-label="Slide to select meal days per employee"
                  />
                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 tabular-nums">
                    <span>5 Days</span>
                    <span>10 Days</span>
                    <span>15 Days</span>
                    <span>20 Days</span>
                    <span>23 Days</span>
                    <span>30 Days</span>
                    <span>40 Days</span>
                  </div>
                </div>

                {/* Quick Day Presets */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {[5, 10, 15, 20, 23, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setMealDaysPerEmployee(d)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer tabular-nums ${
                        mealDaysPerEmployee === d
                          ? 'bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white border-[#FF4C00]'
                          : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:border-[#FF4C00]'
                      }`}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-2 gap-3">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-5 py-3 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] hover:from-[#E04300] hover:to-[#FF4C00] text-white text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <span>Reveal Corporate Price</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CALCULATED PRICE REVEAL */}
          {wizardStep === 3 && (
            <div className="bg-zinc-100 border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
              <div className="space-y-2 text-center max-w-lg mx-auto">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#FF4C00] to-[#FF782C] text-white text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Calculated From Meal Plan Rate</span>
                </span>
                <h4 className="text-2xl sm:text-3xl font-black text-black">
                  Your Corporate Package Price
                </h4>
                <p className="text-sm text-zinc-600">
                  Calculated directly for {totalEmployees} workers × {mealDaysPerEmployee} meal days ({totalMealCredits.toLocaleString()} total desk deliveries).
                </p>
              </div>

              {/* Big Orange Gradient Reveal Card */}
              <div className="bg-gradient-to-br from-[#FF4C00] via-[#FF5E14] to-[#FF8533] text-white rounded-3xl p-6 sm:p-8 text-center shadow-lg space-y-4">
                <div className="text-xs font-bold uppercase tracking-widest text-orange-100">
                  Total Corporate Package
                </div>
                <div className="text-4xl sm:text-6xl font-black tracking-tight tabular-nums">
                  ₦{totalPackageNGN.toLocaleString()}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/25 text-left">
                  <div className="bg-white/15 rounded-2xl p-3.5">
                    <div className="text-[11px] font-semibold text-orange-100">Employees</div>
                    <div className="text-xl font-black tabular-nums">{totalEmployees} Workers</div>
                  </div>
                  <div className="bg-white/15 rounded-2xl p-3.5">
                    <div className="text-[11px] font-semibold text-orange-100">Duration Per Worker</div>
                    <div className="text-xl font-black tabular-nums">{mealDaysPerEmployee} Meal Days</div>
                  </div>
                  <div className="bg-white/15 rounded-2xl p-3.5">
                    <div className="text-[11px] font-semibold text-orange-100">Per Employee Rate</div>
                    <div className="text-xl font-black tabular-nums">₦{pricePerEmployeeNGN.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* What happens next */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-2 text-xs sm:text-sm text-zinc-700">
                <p className="font-bold text-black">How your company invite link works:</p>
                <p>
                  Once you submit payment proof, our Admin verifies your transfer, activates your company portal, and sends your unique invite link to HR. Your link is capped at <strong>{totalEmployees} employee slots</strong> — every time an employee finishes picking their {mealDaysPerEmployee} meals, 1 slot is claimed automatically.
                </p>
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-2 gap-3">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-5 py-3 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(4)}
                  className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] hover:from-[#E04300] hover:to-[#FF4C00] text-white text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <span>Next: Company Details &amp; Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: COMPANY DETAILS, BANK PAYMENT & PROOF */}
          {wizardStep === 4 && (
            <form
              onSubmit={handleSubmitCorporateRequest}
              className="bg-zinc-100 border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#FF4C00]">
                    Step 4 of 4
                  </p>
                  <h4 className="text-xl sm:text-2xl font-black text-black">
                    Company Details &amp; Payment Proof
                  </h4>
                </div>
                <div className="bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white px-4 py-2 rounded-2xl text-right shrink-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-100">
                    {totalEmployees} Staff × {mealDaysPerEmployee} Days
                  </div>
                  <div className="text-lg font-black tabular-nums">
                    ₦{totalPackageNGN.toLocaleString()}
                  </div>
                </div>
              </div>

              {setupError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{setupError}</span>
                </div>
              )}

              {/* Company Details Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Paystack Nigeria"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-zinc-300 focus:border-[#FF4C00] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">HR / Contact Full Name *</label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-zinc-300 focus:border-[#FF4C00] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Work / HR Email *</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="hr@company.com"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-zinc-300 focus:border-[#FF4C00] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">WhatsApp / Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="+234 903 955 7219"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-zinc-300 focus:border-[#FF4C00] outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Primary Office Address *</label>
                  <input
                    type="text"
                    required
                    value={officeAddress}
                    onChange={(e) => setOfficeAddress(e.target.value)}
                    placeholder="Street, Building & Reception/Floor"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-zinc-300 focus:border-[#FF4C00] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Second Office / Drop Point <span className="text-zinc-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={secondAddress}
                    onChange={(e) => setSecondAddress(e.target.value)}
                    placeholder="Annex building or alternate floor"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-zinc-300 focus:border-[#FF4C00] outline-none text-sm"
                  />
                </div>
              </div>

              {/* Settlement Bank Accounts (Clean, Large, Distraction-Free) */}
              <div className="space-y-3">
                <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#FFF4ED] to-[#FFE7D6] border-2 border-[#FF4C00] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg sm:text-xl font-black text-[#FF4C00]">
                      {OFFICIAL_BANK_DETAILS.bankName}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyAccount(OFFICIAL_BANK_DETAILS.accountNumber, 'moniepoint')}
                      className="px-3.5 py-1.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {copiedBank === 'moniepoint' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedBank === 'moniepoint' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-black font-mono tabular-nums tracking-wider select-all">
                    {OFFICIAL_BANK_DETAILS.accountNumber}
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-zinc-900">
                    {OFFICIAL_BANK_DETAILS.accountName}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-200 border border-zinc-300 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm sm:text-base font-black text-black">
                        {OFFICIAL_BANK_DETAILS.secondaryBankName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyAccount(OFFICIAL_BANK_DETAILS.secondaryAccountNumber, 'wema')}
                        className="px-2.5 py-1 rounded-full bg-white text-zinc-800 text-[11px] font-bold border border-zinc-300 cursor-pointer shrink-0"
                      >
                        {copiedBank === 'wema' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-black font-mono tabular-nums tracking-wider select-all">
                      {OFFICIAL_BANK_DETAILS.secondaryAccountNumber}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-zinc-800">
                      {OFFICIAL_BANK_DETAILS.secondaryAccountName}
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-200 border border-zinc-300 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm sm:text-base font-black text-black">
                        {OFFICIAL_BANK_DETAILS.tertiaryBankName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyAccount(OFFICIAL_BANK_DETAILS.tertiaryAccountNumber, 'flw')}
                        className="px-2.5 py-1 rounded-full bg-white text-zinc-800 text-[11px] font-bold border border-zinc-300 cursor-pointer shrink-0"
                      >
                        {copiedBank === 'flw' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-black font-mono tabular-nums tracking-wider select-all">
                      {OFFICIAL_BANK_DETAILS.tertiaryAccountNumber}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-zinc-800">
                      {OFFICIAL_BANK_DETAILS.tertiaryAccountName}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Proof Upload & WhatsApp / Email Sending */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4">
                <div>
                  <h5 className="text-sm font-black text-black">Send Payment Proof for Admin Confirmation</h5>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Attach your transfer screenshot below and also send confirmation to our company WhatsApp (<strong>{CONTACT_CONFIG.whatsappDisplay}</strong>) or Email (<strong>{CONTACT_CONFIG.supportEmail}</strong>).
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <label className="flex-1 px-4 py-3 rounded-xl border-2 border-dashed border-orange-300 bg-[#FFF4ED] hover:bg-[#FFE8D8] text-xs font-bold text-[#FF4C00] flex items-center justify-center gap-2 cursor-pointer transition">
                    <Upload className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {proofFileName ? `Attached: ${proofFileName}` : 'Upload Transfer Screenshot'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofFileUpload}
                      className="hidden"
                    />
                  </label>

                  <a
                    href={whatsappProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span>WhatsApp Proof ({CONTACT_CONFIG.whatsappDisplay})</span>
                  </a>

                  <a
                    href={emailProofUrl}
                    className="px-4 py-3 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-900 text-xs font-bold flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Mail className="w-4 h-4 shrink-0" />
                    <span>Email Proof</span>
                  </a>
                </div>

                {paymentProofUrl && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <img
                      src={paymentProofUrl}
                      alt="Transfer proof preview"
                      className="w-12 h-12 rounded-lg object-cover border border-emerald-300"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-emerald-800">Payment Screenshot Ready</div>
                      <div className="text-emerald-700">Will be attached directly for Admin verification.</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-2 gap-3">
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="px-5 py-3 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-7 py-4 rounded-full bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] hover:from-[#E04300] hover:to-[#FF4C00] text-white text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer inline-flex items-center gap-2 whitespace-nowrap disabled:opacity-60"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Payment Details...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Package &amp; Payment Proof</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 5: SUBMITTED — PENDING ADMIN SETUP (DOES NOT ISSUE LINK YET) */}
          {wizardStep === 5 && submittedAccount && (
            <div className="bg-zinc-100 border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-sm text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF4C00] to-[#FF782C] text-white flex items-center justify-center mx-auto shadow-md">
                <Clock className="w-8 h-8" />
              </div>

              <div className="max-w-lg mx-auto space-y-2">
                <span className="inline-block px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                  Pending Admin Payment Verification
                </span>
                <h4 className="text-2xl sm:text-3xl font-black text-black">
                  Corporate Request Received for {submittedAccount.companyName}!
                </h4>
                <p className="text-sm text-zinc-700 leading-relaxed">
                  Our Admin team will confirm your transfer of{' '}
                  <strong>₦{submittedAccount.totalPackageNGN.toLocaleString()}</strong>, set up your dedicated company dashboard, and send your unique employee invitation link directly to HR (<strong>{submittedAccount.adminEmail}</strong> / WhatsApp <strong>{submittedAccount.adminPhone}</strong>).
                </p>
              </div>

              <div className="max-w-md mx-auto bg-white border border-zinc-200 rounded-2xl p-5 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Employees Covered:</span>
                  <span className="font-bold text-black tabular-nums">{submittedAccount.totalEmployees} Slots</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Meal Days Per Employee:</span>
                  <span className="font-bold text-black tabular-nums">{submittedAccount.mealDaysPerEmployee} Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total Package Value:</span>
                  <span className="font-black text-[#FF4C00] tabular-nums">
                    ₦{submittedAccount.totalPackageNGN.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Employer Access Reference:</span>
                  <span className="font-mono font-bold text-black">{submittedAccount.accessCode}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#FFF4ED] to-[#FFE7D6] border border-orange-200 rounded-2xl p-4 max-w-lg mx-auto text-xs text-zinc-800 space-y-3">
                <p className="font-semibold">
                  Haven&apos;t sent your bank transfer receipt yet? Send your payment proof directly so we activate your link immediately:
                </p>
                <div className="flex flex-wrap justify-center gap-2.5">
                  <a
                    href={whatsappProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold inline-flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Proof on WhatsApp ({CONTACT_CONFIG.whatsappDisplay})</span>
                  </a>
                  <a
                    href={emailProofUrl}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-bold inline-flex items-center gap-1.5"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email ({CONTACT_CONFIG.supportEmail})</span>
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={onBackToPackages}
                  className="px-7 py-3 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-900 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Back to Packages
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LOOKUP EMPLOYER PORTAL */}
      {activeView === 'lookup' && (
        <div className="max-w-xl mx-auto bg-zinc-100 border border-zinc-200 rounded-3xl p-6 sm:p-10 space-y-5 shadow-sm">
          <div className="space-y-1">
            <h4 className="text-2xl font-black text-black">Open Your Employer Dashboard</h4>
            <p className="text-xs sm:text-sm text-zinc-600">
              Enter your corporate Access Code (e.g. BOSS-...) or the HR Work Email sent after Admin confirmation.
            </p>
          </div>

          <form onSubmit={handleLookupAccount} className="space-y-3">
            <input
              type="text"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              placeholder="Access Code or HR Email"
              className="w-full px-4 py-3 rounded-xl bg-white border border-zinc-300 focus:border-[#FF4C00] outline-none text-sm"
            />
            {lookupError && <p className="text-xs font-semibold text-rose-600">{lookupError}</p>}
            <div className="flex flex-wrap gap-2.5">
              <button
                type="submit"
                disabled={isLookingUp}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                {isLookingUp ? 'Looking up...' : 'Open Live Dashboard'}
              </button>
              <button
                type="button"
                onClick={handleOpenDemoDashboard}
                className="px-5 py-3 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-900 text-xs font-bold cursor-pointer"
              >
                Preview Sample Dashboard
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 2: EMPLOYER DASHBOARD */}
      {activeView === 'dashboard' && activeCorporate && (
        <div className="space-y-6">
          {/* Employer Identity Banner — Orange Gradient Card */}
          <div className="bg-gradient-to-br from-[#FF4C00] via-[#FF5E14] to-[#FF8533] text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-md">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 text-xs text-orange-100 font-semibold">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>{isDemoMode ? 'Sample Employer Dashboard (50 Employees × 20 Days)' : 'Live Employer Dashboard'}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">Access Code: {activeCorporate.accessCode}</span>
              </div>
              <h4 className="text-2xl sm:text-3xl font-black text-white truncate">
                {activeCorporate.companyName}
              </h4>
              <p className="text-xs text-orange-50">
                {activeCorporate.officeAddress} · {activeCorporate.mealDaysPerEmployee} meal days per employee
              </p>
            </div>

            {activeCorporate.paymentStatus === 'Confirmed' ? (
              <div className="bg-white/15 backdrop-blur-xs border border-white/25 rounded-2xl p-4 space-y-2.5 lg:min-w-[380px]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Unique Employee Invitation Link</span>
                  <span className="font-mono text-orange-100 font-bold">{activeCorporate.inviteCode}</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl">
                  <span className="text-xs font-mono text-zinc-800 truncate flex-1">{inviteUrl}</span>
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="px-3 py-1.5 rounded-lg bg-[#FF4C00] hover:bg-[#E04300] text-white text-xs font-bold cursor-pointer flex items-center space-x-1 shrink-0"
                  >
                    {copiedInvite ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedInvite ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-orange-50">
                    {dashboardStats.registered} / {dashboardStats.invited} slots claimed
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenEmployeeInvite(activeCorporate)}
                    className="px-3 py-1.5 rounded-lg bg-white text-[#FF4C00] hover:bg-zinc-100 text-xs font-bold cursor-pointer flex items-center space-x-1 shrink-0 whitespace-nowrap"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Employee Link</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white text-zinc-900 rounded-2xl p-4 lg:max-w-sm space-y-1.5 shadow-sm">
                <div className="text-xs font-black text-amber-700 uppercase tracking-wider">
                  Awaiting Admin Confirmation
                </div>
                <p className="text-xs text-zinc-600">
                  Your unique employee invitation link will unlock automatically once 11:12 Admin verifies payment and activates your team link.
                </p>
              </div>
            )}
          </div>

          {/* 6 Employer Metrics (Gray & White Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-zinc-100 border border-zinc-200 rounded-2xl p-5">
              <div className="flex items-center justify-between text-xs text-zinc-600 font-semibold">
                <span>Employees Invited</span>
                <Users className="w-4 h-4 text-[#FF4C00]" />
              </div>
              <div className="text-3xl font-black text-black mt-2 tabular-nums">
                {dashboardStats.invited}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Total purchased team slots</p>
            </div>

            <div className="bg-zinc-100 border border-zinc-200 rounded-2xl p-5">
              <div className="flex items-center justify-between text-xs text-zinc-600 font-semibold">
                <span>Slots Claimed / Registered</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-black mt-2 tabular-nums">
                {dashboardStats.registered}{' '}
                <span className="text-base font-bold text-zinc-400">/ {dashboardStats.invited}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {Math.max(0, dashboardStats.invited - dashboardStats.registered)} slots still available
              </p>
            </div>

            <div className="bg-zinc-100 border border-zinc-200 rounded-2xl p-5">
              <div className="flex items-center justify-between text-xs text-zinc-600 font-semibold">
                <span>Selected Their Meals</span>
                <Utensils className="w-4 h-4 text-[#FF4C00]" />
              </div>
              <div className="text-3xl font-black text-black mt-2 tabular-nums">
                {dashboardStats.selectedMealsCount}{' '}
                <span className="text-base font-bold text-zinc-400">/ {dashboardStats.registered}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Employees with dates &amp; dishes locked</p>
            </div>

            <div className="bg-zinc-100 border border-zinc-200 rounded-2xl p-5">
              <div className="flex items-center justify-between text-xs text-zinc-600 font-semibold">
                <span>Remaining Meal Credits</span>
                <Wallet className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="text-3xl font-black text-black mt-2 tabular-nums">
                {dashboardStats.remainingCredits.toLocaleString()}
              </div>
              <p className="text-xs text-emerald-700 font-semibold mt-1 tabular-nums">
                ₦{dashboardStats.remainingValueNGN.toLocaleString()} remaining balance
              </p>
            </div>

            <div className="bg-zinc-100 border border-zinc-200 rounded-2xl p-5">
              <div className="flex items-center justify-between text-xs text-zinc-600 font-semibold">
                <span>Delivery Status</span>
                <Truck className="w-4 h-4 text-[#FF4C00]" />
              </div>
              <div className="text-2xl font-black text-black mt-2">
                {activeCorporate.deliveryStatus}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Window: 11:00 AM – 12:00 PM WAT</p>
            </div>

            <div className="bg-zinc-100 border border-zinc-200 rounded-2xl p-5">
              <div className="flex items-center justify-between text-xs text-zinc-600 font-semibold">
                <span>Total Package Value</span>
                <CreditCard className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="text-2xl font-black text-black mt-2 tabular-nums">
                ₦{activeCorporate.totalPackageNGN.toLocaleString()}
              </div>
              <p className="text-xs text-zinc-600 mt-1">
                Status: <strong className="text-black">{activeCorporate.paymentStatus}</strong>
              </p>
            </div>
          </div>

          {/* Meals Required Per Day + Registered Employees Roster */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-3xl p-6 space-y-4">
              <div>
                <h5 className="text-base font-black text-black">Number of Meals Required Per Day</h5>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Automatically tallied from employee calendar selections.
                </p>
              </div>
              {dashboardStats.dailyMealsBreakdown.length === 0 ? (
                <div className="p-6 rounded-2xl bg-zinc-100 text-center text-xs font-semibold text-zinc-600">
                  No employee dates selected yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 text-zinc-500 font-semibold">
                        <th className="py-2 pr-2">Delivery Date</th>
                        <th className="py-2 px-2 text-right">Opt 1</th>
                        <th className="py-2 px-2 text-right">Opt 2</th>
                        <th className="py-2 pl-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 tabular-nums">
                      {dashboardStats.dailyMealsBreakdown.map((row) => (
                        <tr key={row.dateStr}>
                          <td className="py-2.5 pr-2 font-bold text-zinc-900">{row.dateStr}</td>
                          <td className="py-2.5 px-2 text-right text-zinc-600">{row.opt1}</td>
                          <td className="py-2.5 px-2 text-right text-zinc-600">{row.opt2}</td>
                          <td className="py-2.5 pl-2 text-right font-black text-[#FF4C00]">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h5 className="text-base font-black text-black">Employee Roster &amp; Meal Status</h5>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Live employee signups via {activeCorporate.inviteCode}
                  </p>
                </div>
                {activeCorporate.paymentStatus === 'Confirmed' && (
                  <button
                    type="button"
                    onClick={() => onOpenEmployeeInvite(activeCorporate)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                  >
                    + Add Employee via Link
                  </button>
                )}
              </div>

              {employees.length === 0 ? (
                <div className="p-6 rounded-2xl bg-zinc-100 text-center text-xs font-semibold text-zinc-600">
                  Waiting for employees to claim their slots via {activeCorporate.inviteCode}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 text-zinc-500 font-semibold">
                        <th className="py-2 pr-3">Employee</th>
                        <th className="py-2 px-2">Delivery Option 1 / 2</th>
                        <th className="py-2 px-2 text-right">Days Picked</th>
                        <th className="py-2 pl-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {employees.map((emp) => (
                        <tr key={emp.id}>
                          <td className="py-2.5 pr-3">
                            <div className="font-bold text-black">{emp.fullName}</div>
                            <div className="text-[11px] text-zinc-500">{emp.email}</div>
                          </td>
                          <td className="py-2.5 px-2 text-zinc-600">
                            <div>{emp.deskLocation}</div>
                            {emp.secondAddress && (
                              <div className="text-[11px] text-zinc-400">Alt: {emp.secondAddress}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold tabular-nums">
                            {emp.selectedDays.length} / {emp.mealDaysAllocated}
                          </td>
                          <td className="py-2.5 pl-2 text-right font-bold text-emerald-700">
                            Meals Ready
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

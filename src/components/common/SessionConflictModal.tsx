import React, { useState, useEffect } from 'react';
import { AlertTriangle, Laptop, Smartphone, ShieldAlert, LogOut, CheckCircle2, RefreshCw } from 'lucide-react';
import { ActiveSessionRecord } from '../../types';

interface SessionConflictModalProps {
  conflict: ActiveSessionRecord;
  role: 'admin' | 'subscriber';
  onContinueHere: () => void;
  onSaveAndLogout: () => void;
  autoLogoutSeconds?: number;
}

export const SessionConflictModal: React.FC<SessionConflictModalProps> = ({
  conflict,
  role,
  onContinueHere,
  onSaveAndLogout,
  autoLogoutSeconds = 45,
}) => {
  const [timeLeft, setTimeLeft] = useState(autoLogoutSeconds);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSaveAndLogout();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSaveAndLogout = async () => {
    setIsSaving(true);
    try {
      await onSaveAndLogout();
    } finally {
      setIsSaving(false);
    }
  };

  const formattedTime = conflict.claimedAt
    ? new Date(conflict.claimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Just now';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-['Poppins'] animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-zinc-200/90 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Warning Badge Header */}
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/30">
            <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
              <AlertTriangle className="w-3 h-3 text-amber-700" />
              <span>Concurrent Session Detected</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">
              {role === 'admin' ? 'Admin Dashboard Active Elsewhere' : 'Account Logged In On Another Device'}
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Your {role === 'admin' ? 'Admin account' : 'Lunch Subscription account'} was just opened on another browser or device. To prevent data conflicts, 11 to 12 only permits 1 active session at a time.
            </p>
          </div>
        </div>

        {/* Remote Device Card */}
        <div className="bg-[#FAF7F2] border border-zinc-200 rounded-2xl p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium border-b border-zinc-200/60 pb-2">
            <span>New Login Detected From:</span>
            <span className="font-mono text-zinc-400">{formattedTime}</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0">
              {/iPhone|Android|iPad/i.test(conflict.deviceInfo) ? (
                <Smartphone className="w-5 h-5 text-[#FF4C00]" />
              ) : (
                <Laptop className="w-5 h-5 text-[#FF4C00]" />
              )}
            </div>
            <div>
              <p className="font-bold text-zinc-900 text-sm">
                {conflict.deviceInfo || 'Another browser / device'}
              </p>
              <p className="text-[11px] text-zinc-500">
                Active session transferred to that device.
              </p>
            </div>
          </div>
        </div>

        {/* Countdown notice */}
        <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-3 text-xs text-amber-900 flex items-center justify-between">
          <span className="font-medium">
            Auto-saving & logging out in:
          </span>
          <span className="font-mono font-bold text-sm bg-white px-2.5 py-0.5 rounded-lg border border-amber-300 text-amber-700 shadow-2xs">
            {timeLeft}s
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={onContinueHere}
            className="w-full py-3.5 rounded-2xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Continue Using This Device</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAndLogout}
            disabled={isSaving}
            className="w-full py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center space-x-2 border border-zinc-200 disabled:opacity-50"
          >
            {isSaving ? (
              <span>Saving work & logging out...</span>
            ) : (
              <>
                <LogOut className="w-4 h-4 text-zinc-500" />
                <span>Save Work & Log Out Now</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

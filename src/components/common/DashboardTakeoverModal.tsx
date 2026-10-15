import React, { useState } from 'react';
import {
  Laptop,
  Smartphone,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  X,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { ActiveSessionRecord } from '../../types';

interface DashboardTakeoverModalProps {
  role: 'admin' | 'subscriber';
  remoteSession: ActiveSessionRecord;
  onTakeoverAndOpen: () => Promise<void>;
  onCancel: () => void;
}

export const DashboardTakeoverModal: React.FC<DashboardTakeoverModalProps> = ({
  role,
  remoteSession,
  onTakeoverAndOpen,
  onCancel,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isMobile = /iPhone|Android|iPad/i.test(remoteSession.deviceInfo || '');
  const formattedTime = remoteSession.claimedAt
    ? new Date(remoteSession.claimedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recently';

  const handleConfirmTakeover = async () => {
    setIsProcessing(true);
    setStatusMessage('Saving other dashboard session...');
    try {
      await onTakeoverAndOpen();
    } catch (err) {
      console.error('[DashboardTakeover] Takeover failed:', err);
      setStatusMessage('Connection error. Retrying sync...');
      setTimeout(() => {
        setIsProcessing(false);
        setStatusMessage(null);
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-['Poppins'] animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Close / Cancel Button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-black hover:bg-zinc-100 transition cursor-pointer disabled:opacity-30"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Badge Header */}
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-[#FF4C00] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-[#FF4C00] text-[10px] font-extrabold uppercase tracking-wider">
              <span>Live Session Active Elsewhere</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">
              {role === 'admin'
                ? 'Admin Dashboard is Already Open'
                : 'Subscriber Dashboard is Already Open'}
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              This dashboard is currently open live on another platform. To prevent data divergence and ensure both devices stay 100% consistent, the other session must be saved before opening here.
            </p>
          </div>
        </div>

        {/* Remote Active Device Card */}
        <div className="bg-[#FAF7F2] border border-orange-200/80 rounded-2xl p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-semibold border-b border-orange-100 pb-2">
            <span>Currently Active Live On:</span>
            <span className="font-mono text-zinc-600 bg-white px-2 py-0.5 rounded border border-zinc-200">
              Opened {formattedTime}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0 shadow-2xs">
              {isMobile ? (
                <Smartphone className="w-5 h-5 text-[#FF4C00]" />
              ) : (
                <Laptop className="w-5 h-5 text-[#FF4C00]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-zinc-900 text-sm truncate">
                {remoteSession.deviceInfo || 'Another browser or device'}
              </p>
              <p className="text-[11px] text-zinc-500">
                Single concurrent session policy protects meal calendar consistency.
              </p>
            </div>
          </div>
        </div>

        {/* Synchronization Guarantee Note */}
        <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 flex items-start space-x-2.5">
          <Database className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Clicking below will securely flush all changes from the other dashboard to the database, cleanly log out that session, and synchronize this dashboard so you see the <strong>exact same customer and meal records</strong>.
          </p>
        </div>

        {/* Processing State Notice */}
        {isProcessing && (
          <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs font-bold text-[#FF4C00] flex items-center space-x-2 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{statusMessage || 'Saving remote session and loading identical data...'}</span>
          </div>
        )}

        {/* Primary Action Button - EXACT USER SPECIFICATION */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleConfirmTakeover}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-500/25 active:scale-95 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Other Dashboard & Synchronizing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save the other dashboard then open here</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={onCancel}
            className="w-full py-2.5 rounded-xl text-zinc-500 hover:text-zinc-800 font-semibold text-xs transition cursor-pointer"
          >
            Cancel & Keep Other Dashboard Active
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { UndoAction } from '../../types';
import { Undo2, Clock, AlertCircle } from 'lucide-react';

interface SafetyNetUndoProps {
  undoActions: UndoAction[];
  onPerformUndo: (actionId: string) => void;
}

export const SafetyNetUndo: React.FC<SafetyNetUndoProps> = ({ undoActions, onPerformUndo }) => {
  const [, setTick] = useState(0);

  // Re-render every second to tick down active timers
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const now = Math.floor(Date.now() / 1000);
  const activeActions = undoActions.filter((a) => a.expiresAt > now);

  if (activeActions.length === 0) return null;

  return (
    <div className="bg-[#FACC15] text-black border-4 border-black p-4 shadow-[6px_6px_0px_#000] animate-fade-in space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider font-mono-custom text-black">
          <Clock className="w-4 h-4 animate-spin text-black" />
          <span>5-MINUTE SAFETY NET ACTIVE (300S UNDO BUFFER)</span>
        </div>
        <span className="text-[10px] text-zinc-800 font-black font-mono-custom uppercase">Accidental click protection</span>
      </div>

      <div className="space-y-2">
        {activeActions.map((item) => {
          const secondsRemaining = Math.max(0, item.expiresAt - now);

          return (
            <div
              key={item.id}
              className="bg-white text-black p-3.5 border-3 border-black flex items-center justify-between gap-3 shadow-[2px_2px_0px_#000]"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <AlertCircle className="w-5 h-5 text-[#FF4C00] flex-shrink-0 stroke-[3]" />
                <div className="truncate">
                  <p className="text-xs font-black text-black uppercase truncate">{item.description}</p>
                  <p className="text-[10px] text-zinc-700 font-black font-mono-custom uppercase">
                    Time Left to Revert: <strong className="text-[#FF4C00]">{secondsRemaining}s</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => onPerformUndo(item.id)}
                className="px-4 py-2 bg-[#FF4C00] hover:bg-[#e04300] text-white font-black text-xs border-2 border-black uppercase shadow-[2px_2px_0px_#000] cursor-pointer transition-all flex items-center space-x-1 flex-shrink-0"
              >
                <Undo2 className="w-4 h-4 stroke-[3]" />
                <span>UNDO</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};


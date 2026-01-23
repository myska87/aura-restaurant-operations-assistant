import React, { useState } from 'react';
import { useMode, MODES, MODE_CONFIG } from './ModeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function ModeSelector({ user }) {
  const { currentMode, setCurrentMode, canAccessMode } = useMode();
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetMode, setTargetMode] = useState(null);

  const handleModeSwitch = (mode) => {
    if (mode === currentMode) return;
    if (!canAccessMode(mode, user?.role)) return;
    
    setTargetMode(mode);
    setShowConfirm(true);
  };

  const confirmSwitch = () => {
    setCurrentMode(targetMode);
    setShowConfirm(false);
    setTargetMode(null);
  };

  return (
    <>
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
        {Object.entries(MODE_CONFIG).map(([mode, config]) => {
          const isActive = currentMode === mode;
          const canAccess = canAccessMode(mode, user?.role);
          
          return (
            <button
              key={mode}
              onClick={() => handleModeSwitch(mode)}
              disabled={!canAccess}
              className={`
                px-4 py-2 rounded-md font-semibold text-sm transition-all
                ${isActive ? `${config.color} text-white shadow-md` : 'bg-white text-slate-600 hover:bg-slate-50'}
                ${!canAccess ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex flex-col items-center">
                <span>{config.label}</span>
                <span className="text-[10px] opacity-75">{config.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Switch Mode?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-600">
              Switching to <strong>{MODE_CONFIG[targetMode]?.label} Mode</strong> will change your interface and available features.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmSwitch}
                className={MODE_CONFIG[targetMode]?.color}
              >
                Switch to {MODE_CONFIG[targetMode]?.label}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
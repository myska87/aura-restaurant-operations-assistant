import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RotateCcw, Code } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function DevResetConsole({ user }) {
  // Check if DEV_MODE is enabled or user is owner/admin
  const isDev = process.env.REACT_APP_DEV_MODE === 'true' || user?.role === 'owner' || user?.role === 'admin';
  
  const [showConsole, setShowConsole] = useState(false);
  const [activeReset, setActiveReset] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  if (!isDev) return null;

  const resetOptions = [
    {
      id: 'daily-ops',
      label: 'Daily Operations',
      description: 'Clear check-ins, briefings, handovers',
      action: async () => {
        const checkIns = await base44.entities.DailyCheckIn.filter({ shift_date: today });
        const briefings = await base44.entities.DailyBriefing.filter({ date: today });
        const handovers = await base44.entities.ShiftHandover.filter({ shift_date: today });
        
        for (const item of [...checkIns, ...briefings, ...handovers]) {
          await base44.entities[item.entityName || (item.shift_date ? 'DailyCheckIn' : item.date ? 'DailyBriefing' : 'ShiftHandover')].delete(item.id);
        }
        return `${checkIns.length + briefings.length + handovers.length} records cleared`;
      }
    },
    {
      id: 'temp-logs',
      label: 'Temperature Logs',
      description: 'Clear all temperature logs for today',
      action: async () => {
        const logs = await base44.entities.TemperatureLog.filter({ log_date: today });
        for (const log of logs) {
          await base44.entities.TemperatureLog.delete(log.id);
        }
        queryClient.invalidateQueries(['temperatureLogs']);
        queryClient.invalidateQueries(['temps']);
        return `${logs.length} temperature logs cleared`;
      }
    },
    {
      id: 'checklists',
      label: 'Checklists (Opening/Closing)',
      description: 'Clear opening and closing checklist completions',
      action: async () => {
        const completions = await base44.entities.ChecklistCompletion.filter({ date: today });
        for (const comp of completions) {
          await base44.entities.ChecklistCompletion.delete(comp.id);
        }
        queryClient.invalidateQueries(['completions']);
        return `${completions.length} checklist completions cleared`;
      }
    },
    {
      id: 'hygiene',
      label: 'Hygiene Declarations',
      description: 'Clear personal hygiene declarations for today',
      action: async () => {
        const declarations = await base44.entities.PersonalHygieneDeclaration.filter({ shift_date: today });
        for (const decl of declarations) {
          await base44.entities.PersonalHygieneDeclaration.delete(decl.id);
        }
        queryClient.invalidateQueries(['hygieneDeclarations']);
        return `${declarations.length} hygiene declarations cleared`;
      }
    },
    {
      id: 'ccp',
      label: 'CCP Checks',
      description: 'Clear critical control point checks for today',
      action: async () => {
        const checks = await base44.entities.CriticalControlPointCheck.filter({ check_date: today });
        for (const check of checks) {
          await base44.entities.CriticalControlPointCheck.delete(check.id);
        }
        queryClient.invalidateQueries(['ccpChecks']);
        return `${checks.length} CCP checks cleared`;
      }
    },
    {
      id: 'training',
      label: 'Training Progress',
      description: 'Reset training course progress for today',
      action: async () => {
        const progress = await base44.entities.TrainingProgress.filter({ 
          completion_date: { $gte: today } 
        });
        for (const p of progress) {
          await base44.entities.TrainingProgress.delete(p.id);
        }
        queryClient.invalidateQueries(['trainingProgress']);
        return `${progress.length} training records cleared`;
      }
    },
    {
      id: 'shifts',
      label: 'Staff Shifts',
      description: 'Clear staff shift records for today',
      action: async () => {
        const shifts = await base44.entities.Shift.filter({ date: today });
        for (const shift of shifts) {
          await base44.entities.Shift.delete(shift.id);
        }
        queryClient.invalidateQueries(['shifts']);
        return `${shifts.length} shift records cleared`;
      }
    },
    {
      id: 'all',
      label: '⚠️ Reset ALL',
      description: 'Clear everything above in one action',
      action: async () => {
        const allResets = resetOptions.filter(opt => opt.id !== 'all');
        let totalCleared = 0;
        
        for (const opt of allResets) {
          try {
            const result = await opt.action();
            const match = result.match(/(\d+)/);
            if (match) totalCleared += parseInt(match[1]);
          } catch (e) {
            console.error(`Error in ${opt.id}:`, e);
          }
        }
        
        return `${totalCleared} total records cleared`;
      }
    }
  ];

  const handleReset = async (option) => {
    if (confirmText !== 'RESET') {
      toast.error('Type "RESET" to confirm');
      return;
    }

    setIsResetting(true);
    try {
      const result = await option.action();
      toast.success(`✅ ${option.label}: ${result}`);
      setActiveReset(null);
      setConfirmText('');
      
      // Refresh all queries
      queryClient.invalidateQueries(['checkIns']);
      queryClient.invalidateQueries(['briefings']);
      queryClient.invalidateQueries(['handovers']);
    } catch (error) {
      console.error('Reset error:', error);
      toast.error(`❌ Reset failed: ${error.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      {/* DEV Console Trigger Button */}
      <Button
        onClick={() => setShowConsole(true)}
        variant="outline"
        className="border-2 border-purple-500 text-purple-700 hover:bg-purple-50"
      >
        <Code className="w-4 h-4 mr-2" />
        🧪 Dev Reset Console
      </Button>

      {/* DEV Console Modal */}
      <Dialog open={showConsole} onOpenChange={setShowConsole}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="w-6 h-6 text-purple-600" />
              Development Reset Console
            </DialogTitle>
            <DialogDescription>
              Reset individual operational areas for testing. Each reset requires typing "RESET" to confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-purple-900">
                <strong>Development Mode Only</strong> - This console is only visible to developers and owners. 
                No production data is affected. All resets are logged.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resetOptions.map((option) => (
              <Card 
                key={option.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  option.id === 'all' ? 'border-red-300 bg-red-50 md:col-span-2' : ''
                }`}
              >
                <CardContent className="p-4">
                  <button
                    onClick={() => {
                      setActiveReset(option);
                      setConfirmText('');
                    }}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{option.label}</h4>
                      <RotateCcw className="w-4 h-4 text-slate-600" />
                    </div>
                    <p className="text-xs text-slate-600">{option.description}</p>
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConsole(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Each Reset */}
      {activeReset && (
        <Dialog open={!!activeReset} onOpenChange={(open) => !open && setActiveReset(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Confirm Reset: {activeReset.label}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-900">
                ⚠️ This will delete all {activeReset.label.toLowerCase()} records for today ({today}).
                This action cannot be undone.
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Type "RESET" to confirm:
                </label>
                <Input
                  placeholder='Type "RESET"'
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={isResetting}
                  className="font-mono"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setActiveReset(null)}
                disabled={isResetting}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleReset(activeReset)}
                disabled={isResetting || confirmText !== 'RESET'}
                className="bg-red-600 hover:bg-red-700"
              >
                {isResetting ? 'Resetting...' : 'Confirm Reset'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
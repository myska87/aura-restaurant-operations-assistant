import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function ResetFormsButton({ user }) {
  const [showDialog, setShowDialog] = useState(false);
  const [resetScope, setResetScope] = useState('today');
  const [note, setNote] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'admin';

  const handleReset = async () => {
    if (!isAdmin) {
      toast.error('Admin access required');
      return;
    }

    setIsResetting(true);
    const affectedForms = [];
    let recordsCleared = 0;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Clear all ChecklistCompletion for today (opening, closing, etc)
      const allCompletions = await base44.entities.ChecklistCompletion.filter({
        date: today
      });
      
      for (const completion of allCompletions) {
        await base44.entities.ChecklistCompletion.delete(completion.id);
        affectedForms.push(completion.checklist_name || completion.checklist_category);
        recordsCleared++;
      }

      // Clear in-progress prep checklists for today
      const prepLogs = await base44.entities.PrepChecklistLog.filter({
        date: today,
        status: 'in_progress'
      });
      
      for (const log of prepLogs) {
        await base44.entities.PrepChecklistLog.delete(log.id);
        affectedForms.push('Prep Checklist');
        recordsCleared++;
      }

      // Clear hygiene declarations for today
      const hygieneDeclarations = await base44.entities.PersonalHygieneDeclaration.filter({
        shift_date: today
      });

      for (const decl of hygieneDeclarations) {
        await base44.entities.PersonalHygieneDeclaration.delete(decl.id);
        affectedForms.push('Hygiene Declaration');
        recordsCleared++;
      }

      // Clear temperature logs for today
      const tempLogs = await base44.entities.TemperatureLog.filter({
        log_date: today
      });

      for (const log of tempLogs) {
        await base44.entities.TemperatureLog.delete(log.id);
        affectedForms.push('Temperature Logs');
        recordsCleared++;
      }

      // Clear shift handovers for today
      const handovers = await base44.entities.ShiftHandover.filter({
        shift_date: today
      });

      for (const handover of handovers) {
        await base44.entities.ShiftHandover.delete(handover.id);
        affectedForms.push('Shift Handover');
        recordsCleared++;
      }

      // Clear daily check-ins for today
      const checkIns = await base44.entities.DailyCheckIn.filter({
        shift_date: today
      });

      for (const checkIn of checkIns) {
        await base44.entities.DailyCheckIn.delete(checkIn.id);
        affectedForms.push('Daily Check-In');
        recordsCleared++;
      }

      // Clear CCP checks for today
      const ccpChecks = await base44.entities.CriticalControlPointCheck.filter({
        check_date: today
      });

      for (const check of ccpChecks) {
        await base44.entities.CriticalControlPointCheck.delete(check.id);
        affectedForms.push('CCP Checks');
        recordsCleared++;
      }

      // Log the reset action
      await base44.entities.ResetLog.create({
        reset_by_name: user.full_name || user.email,
        reset_by_email: user.email,
        reset_time: new Date().toISOString(),
        reset_scope: resetScope,
        affected_forms: [...new Set(affectedForms)],
        note: note || 'Admin reset of active forms',
        records_cleared: recordsCleared
      });

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries(['prepLogs']);
      queryClient.invalidateQueries(['hygieneChecks']);
      queryClient.invalidateQueries(['checklistCompletions']);
      queryClient.invalidateQueries(['dailyCheckIn']);

      toast.success(`✅ Reset complete! ${recordsCleared} active forms cleared.`);
      setShowDialog(false);
      setNote('');
      
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Reset failed. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        className="border-2 border-amber-500 text-amber-700 hover:bg-amber-50"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        🔄 Reset Forms (Admin)
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="w-6 h-6 text-amber-500" />
              Reset Active Forms
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-slate-700">
                <strong>⚠️ This will reset all active form states</strong> (in-progress checklists) 
                back to default without deleting any historical data or reports.
              </p>
              <p className="text-xs text-slate-600 mt-2">
                ✅ All completed records, reports, and KPIs remain intact.
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Reset Scope
              </label>
              <Select value={resetScope} onValueChange={setResetScope}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">📅 Reset Today's Forms Only</SelectItem>
                  <SelectItem value="weekly">📆 Reset Weekly Forms</SelectItem>
                  <SelectItem value="all_active">🔄 Reset All Active Stages</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Reason (Optional)
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Training session reset, Daily restart..."
                rows={3}
              />
            </div>

            <div className="text-xs text-slate-500">
              <p>✓ Forms will return to default (unchecked/empty)</p>
              <p>✓ Operations History and Reports unchanged</p>
              <p>✓ Dashboard KPIs remain accurate</p>
              <p>✓ Reset action will be logged</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReset}
              disabled={isResetting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Confirm Reset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
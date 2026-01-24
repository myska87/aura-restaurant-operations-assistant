import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import CorrectiveActionForm from './CorrectiveActionForm';
import { logFoodSafetyIncident } from './IncidentLogger';

export default function CCPCheckModal({ open, onClose, ccp, user, onSuccess }) {
  const [recordedValue, setRecordedValue] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [error, setError] = useState(null);
  const [showCorrectiveAction, setShowCorrectiveAction] = useState(false);

  if (!ccp) return null;

  const parseValue = (valueStr) => {
    const numMatch = valueStr.match(/[\d.]+/);
    return numMatch ? parseFloat(numMatch[0]) : null;
  };

  const parseCriticalLimit = () => {
    const numMatch = ccp.critical_limit.match(/[\d.]+/);
    return numMatch ? parseFloat(numMatch[0]) : null;
  };

  const performCheck = async () => {
    setLoading(true);
    setError(null);
    setCheckResult(null);

    try {
      const inputValue = parseValue(recordedValue);
      const limitValue = parseCriticalLimit();

      if (inputValue === null || limitValue === null) {
        setError('Invalid value format. Please enter a numeric value.');
        setLoading(false);
        return;
      }

      const isPassed = inputValue >= limitValue;

      const checkData = {
        ccp_id: ccp.id,
        ccp_name: ccp.name,
        check_date: new Date().toISOString().split('T')[0],
        check_time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        recorded_value: recordedValue,
        unit: ccp.unit,
        critical_limit: ccp.critical_limit,
        status: isPassed ? 'pass' : 'fail',
        staff_id: user?.id,
        staff_name: user?.full_name || user?.email,
        staff_email: user?.email,
        notes: notes,
        timestamp: new Date().toISOString()
      };

      // If FAIL: trigger corrective actions and block menu items
      if (!isPassed && ccp.corrective_actions) {
        checkData.corrective_actions_triggered = ccp.corrective_actions.map(action => ({
          action: action.action,
          responsible_person: action.responsible_person,
          time_limit: action.time_limit,
          status: 'pending'
        }));
        checkData.blocked_menu_items = ccp.linked_menu_items || [];

        // Create notifications for managers
        const managers = await base44.entities.Staff.filter({ role: 'manager' });
        for (const manager of managers) {
          await base44.entities.Notification.create({
            recipient_email: manager.email,
            recipient_name: manager.full_name,
            title: `🚨 CCP FAILED: ${ccp.name}`,
            message: `Critical Control Point failed. Value: ${recordedValue} (Limit: ${ccp.critical_limit}). Corrective actions required.`,
            type: 'alert',
            priority: 'critical',
            is_read: false,
            related_entity: 'CriticalControlPointCheck'
          }).catch(() => {});
        }
      }

      // Save the check
       const result = await base44.entities.CriticalControlPointCheck.create(checkData);

       // If FAIL: Log to IncidentRecord (permanent audit trail)
       if (!isPassed) {
         await logFoodSafetyIncident(ccp, { ...checkData, id: result.id }, user);
       }

       // Create corresponding OperationReport
      await base44.entities.OperationReport.create({
        reportType: 'CCP',
        locationId: 'default',
        staffId: user?.id,
        staffName: user?.full_name || user?.email,
        staffEmail: user?.email,
        reportDate: new Date().toISOString().split('T')[0],
        completionPercentage: 100,
        status: isPassed ? 'pass' : 'fail',
        checklistItems: [{ item_id: ccp.id, item_name: ccp.name, answer: recordedValue }],
        sourceEntityId: result.id,
        sourceEntityType: 'CriticalControlPointCheck',
        timestamp: new Date().toISOString()
      }).catch(() => {});

      setCheckResult({ passed: isPassed, value: recordedValue, limit: ccp.critical_limit });
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        setRecordedValue('');
        setNotes('');
        setCheckResult(null);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to record check');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>CCP Check: {ccp.name}</DialogTitle>
          <DialogDescription>
            Monitor: {ccp.monitoring_parameter} | Check Frequency: {ccp.check_frequency}
          </DialogDescription>
        </DialogHeader>

        {checkResult ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-lg text-center ${
              checkResult.passed
                ? 'bg-emerald-50 border-2 border-emerald-300'
                : 'bg-red-50 border-2 border-red-300'
            }`}
          >
            {checkResult.passed ? (
              <>
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-emerald-900">✓ CHECK PASSED</h3>
                <p className="text-sm text-emerald-700 mt-2">
                  Value: {checkResult.value} ≥ {checkResult.limit}
                </p>
                <p className="text-xs text-emerald-600 mt-1">Workflow may continue</p>
              </>
            ) : (
              <>
                <XCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-red-900">✗ CHECK FAILED</h3>
                <p className="text-sm text-red-700 mt-2">
                  Value: {checkResult.value} &lt; {checkResult.limit}
                </p>
                <p className="text-xs text-red-600 mt-1">Corrective actions triggered. Menu items blocked.</p>
              </>
            )}
            </motion.div>
            ) : showCorrectiveAction && checkResult ? (
            <CorrectiveActionForm
            ccpCheck={checkResult}
            user={user}
            onActionSubmitted={() => {
             setRecordedValue('');
             setNotes('');
             setCheckResult(null);
             setShowCorrectiveAction(false);
             if (onSuccess) onSuccess();
             onClose();
            }}
            onCancel={() => setShowCorrectiveAction(false)}
            />
            ) : (
            <div className="space-y-4">
            {/* CCP Info Card */}
            <Card className="bg-slate-50">
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">Stage:</span>
                    <span className="text-slate-600 capitalize">{ccp.stage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">Critical Limit:</span>
                    <span className="text-slate-600 font-bold text-amber-700">{ccp.critical_limit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">Method:</span>
                    <span className="text-slate-600">{ccp.monitoring_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">Responsible:</span>
                    <span className="text-slate-600">{ccp.responsible_role}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Input Section */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">
                Recorded Value ({ccp.unit})
              </label>
              <Input
                type="text"
                placeholder={`e.g., 75${ccp.unit === 'celsius' ? '°C' : ''}`}
                value={recordedValue}
                onChange={(e) => setRecordedValue(e.target.value)}
                className="text-lg font-bold"
                disabled={loading}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">
                Notes (optional)
              </label>
              <Input
                type="text"
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={performCheck}
                disabled={!recordedValue || loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? 'Recording...' : 'Record Check'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
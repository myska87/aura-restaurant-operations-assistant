import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Heart, CheckCircle, Meh, XCircle } from 'lucide-react';

const issueTypes = [
  { value: 'wrong_item', label: 'Wrong item served', icon: '🔄' },
  { value: 'food_quality', label: 'Food quality issue', icon: '🍽️' },
  { value: 'long_wait', label: 'Long wait time', icon: '⏰' },
  { value: 'missing_item', label: 'Missing item', icon: '❓' },
  { value: 'temperature', label: 'Temperature issue', icon: '🌡️' },
  { value: 'allergen_concern', label: 'Allergen concern', icon: '⚠️' },
  { value: 'service_attitude', label: 'Service attitude issue', icon: '😐' },
  { value: 'cleanliness', label: 'Environment/cleanliness', icon: '🧹' },
  { value: 'other', label: 'Other', icon: '💬' }
];

const recoveryActions = {
  staff: [
    { value: 'remade', label: 'Remade item', needsApproval: false },
    { value: 'replaced', label: 'Replaced item', needsApproval: false },
    { value: 'free_chai', label: 'Free chai offered', needsApproval: false },
    { value: 'apology_only', label: 'Sincere apology', needsApproval: false }
  ],
  manager: [
    { value: 'refunded', label: 'Refunded', needsApproval: true },
    { value: 'free_dessert', label: 'Free dessert', needsApproval: true },
    { value: 'voucher', label: 'Voucher issued', needsApproval: true },
    { value: 'discount', label: 'Discount applied', needsApproval: true }
  ]
};

export default function ServiceRecoveryForm({ onClose }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [startTime] = useState(Date.now());
  
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [menuItemId, setMenuItemId] = useState('');
  const [recoveryAction, setRecoveryAction] = useState('');
  const [recoveryValue, setRecoveryValue] = useState('');
  const [guestOutcome, setGuestOutcome] = useState('');
  const [notes, setNotes] = useState('');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items-simple'],
    queryFn: () => base44.entities.MenuItem.list('name', 100)
  });

  const createRecoveryMutation = useMutation({
    mutationFn: async (data) => {
      const recovery = await base44.entities.ServiceRecovery.create(data);
      
      // If allergen concern, create incident
      if (data.issue_type === 'allergen_concern') {
        // TODO: Link to incident module when available
      }

      return recovery;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['service-recoveries']);
      onClose();
    }
  });

  const handleSubmit = () => {
    if (!user || !issueType || !recoveryAction || !guestOutcome) return;

    const now = new Date();
    const hour = now.getHours();
    let shiftType = 'opening';
    if (hour >= 12 && hour < 18) shiftType = 'mid';
    else if (hour >= 18) shiftType = 'closing';

    const resolutionTime = Math.round((Date.now() - startTime) / 1000 / 60);

    const selectedMenuItem = menuItems.find(m => m.id === menuItemId);
    const needsApproval = recoveryActions.manager.some(a => a.value === recoveryAction);

    createRecoveryMutation.mutate({
      issue_date: new Date().toISOString(),
      issue_type: issueType,
      description,
      menu_item_id: menuItemId || null,
      menu_item_name: selectedMenuItem?.name || null,
      recovery_action: recoveryAction,
      recovery_value: parseFloat(recoveryValue) || 0,
      guest_outcome: guestOutcome,
      staff_email: user.email,
      staff_name: user.full_name,
      staff_role: user.role,
      manager_approved: needsApproval ? false : true,
      notes,
      shift_type: shiftType,
      resolution_time_minutes: resolutionTime,
      incident_created: issueType === 'allergen_concern'
    });
  };

  const availableActions = user?.role === 'manager' || user?.role === 'owner' || user?.role === 'admin'
    ? [...recoveryActions.staff, ...recoveryActions.manager]
    : recoveryActions.staff;

  const selectedAction = availableActions.find(a => a.value === recoveryAction);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-purple-600" />
            Service Recovery - Step {step} of 3
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Identify Issue */}
          {step === 1 && (
            <>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-1">Step 1: Listen & Acknowledge</h4>
                <p className="text-sm text-purple-700">"Thank you for telling us. I'm sorry this happened."</p>
              </div>

              <div>
                <Label>What happened? *</Label>
                <Select value={issueType} onValueChange={setIssueType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {issueTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Details</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what happened..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Related Menu Item (Optional)</Label>
                <Select value={menuItemId} onValueChange={setMenuItemId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select menu item" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItems.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {issueType === 'allergen_concern' && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">Allergen Concern Detected</p>
                      <p className="text-xs text-red-700 mt-1">
                        This will automatically create an incident report. Manager must review immediately.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={() => setStep(2)} 
                disabled={!issueType}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Next: Fix the Issue
              </Button>
            </>
          )}

          {/* Step 2: Recovery Action */}
          {step === 2 && (
            <>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-1">Step 2: Fix the Issue</h4>
                <p className="text-sm text-blue-700">Choose the appropriate recovery action.</p>
              </div>

              <div>
                <Label>Recovery Action *</Label>
                <Select value={recoveryAction} onValueChange={setRecoveryAction}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-xs font-semibold text-slate-500">
                      ✅ You can approve:
                    </div>
                    {recoveryActions.staff.map(action => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                    {(user?.role === 'manager' || user?.role === 'owner' || user?.role === 'admin') && (
                      <>
                        <div className="px-2 py-1 text-xs font-semibold text-slate-500 mt-2">
                          👔 Manager authority:
                        </div>
                        {recoveryActions.manager.map(action => (
                          <SelectItem key={action.value} value={action.value}>
                            {action.label}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedAction?.needsApproval && user?.role === 'staff' && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg">
                  <p className="text-sm text-amber-800">
                    ⚠️ This action requires manager approval. Please ask your manager to log this recovery.
                  </p>
                </div>
              )}

              {(recoveryAction === 'refunded' || recoveryAction === 'voucher' || recoveryAction === 'discount') && (
                <div>
                  <Label>Amount (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={recoveryValue}
                    onChange={(e) => setRecoveryValue(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  disabled={!recoveryAction}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Next: Guest Outcome
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Guest Outcome */}
          {step === 3 && (
            <>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h4 className="font-semibold text-emerald-900 mb-1">Step 3: Guest Outcome</h4>
                <p className="text-sm text-emerald-700">How did the guest respond to your recovery?</p>
              </div>

              <div>
                <Label className="mb-3 block">Guest Outcome *</Label>
                <div className="grid gap-3">
                  <button
                    onClick={() => setGuestOutcome('satisfied')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      guestOutcome === 'satisfied'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className={`w-8 h-8 ${guestOutcome === 'satisfied' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <div>
                        <p className="font-semibold">✅ Satisfied / Raving Fan</p>
                        <p className="text-sm text-slate-600">Guest left happy and satisfied</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setGuestOutcome('neutral')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      guestOutcome === 'neutral'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Meh className={`w-8 h-8 ${guestOutcome === 'neutral' ? 'text-amber-600' : 'text-slate-400'}`} />
                      <div>
                        <p className="font-semibold">⚠️ Neutral</p>
                        <p className="text-sm text-slate-600">Guest accepted but not enthusiastic</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setGuestOutcome('unhappy')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      guestOutcome === 'unhappy'
                        ? 'border-red-500 bg-red-50'
                        : 'border-slate-200 hover:border-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <XCircle className={`w-8 h-8 ${guestOutcome === 'unhappy' ? 'text-red-600' : 'text-slate-400'}`} />
                      <div>
                        <p className="font-semibold">❌ Unhappy / Lost Guest</p>
                        <p className="text-sm text-slate-600">Guest remained dissatisfied</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <Label>Additional Notes (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional context or learnings..."
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!guestOutcome || createRecoveryMutation.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {createRecoveryMutation.isPending ? 'Saving...' : 'Complete Recovery'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
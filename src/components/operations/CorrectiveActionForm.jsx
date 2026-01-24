import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Upload, Loader } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const APPROVED_ACTIONS = [
  {
    id: 're_cook_recheck',
    label: 'Re-cook & Re-check',
    description: 'Re-cook item and perform CCP check again',
    color: 'bg-amber-100 text-amber-900'
  },
  {
    id: 'discard_batch',
    label: 'Discard batch',
    description: 'Discard entire batch - unsafe for service',
    color: 'bg-orange-100 text-orange-900'
  },
  {
    id: 'stop_service',
    label: 'Stop service & inform manager',
    description: 'Stop service immediately and notify management',
    color: 'bg-red-100 text-red-900'
  }
];

export default function CorrectiveActionForm({ 
  ccpCheck, 
  user, 
  onActionSubmitted, 
  onCancel 
}) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const queryClient = useQueryClient();

  const createActionMutation = useMutation({
    mutationFn: async (actionData) => {
      // Upload photo if provided
      let photoUrl = null;
      if (photoFile) {
        const uploadRes = await base44.integrations.Core.UploadFile({ file: photoFile });
        photoUrl = uploadRes.file_url;
      }

      // Create corrective action record
      const action = await base44.entities.CorrectiveAction.create({
        ccp_check_id: ccpCheck.id,
        ccp_id: ccpCheck.ccp_id,
        ccp_name: ccpCheck.ccp_name,
        action_type: actionData.actionType,
        action_description: APPROVED_ACTIONS.find(a => a.id === actionData.actionType)?.label,
        initiated_by_id: user?.id,
        initiated_by_name: user?.full_name,
        initiated_by_email: user?.email,
        initiated_at: new Date().toISOString(),
        photo_url: photoUrl,
        notes: actionData.notes,
        status: 'pending',
        requires_recheck: true
      });

      // If Stop Service - notify managers
      if (actionData.actionType === 'stop_service') {
        await base44.entities.Notification.create({
          recipient_email: 'management@chaipatta.com',
          title: '🚨 URGENT: CCP Failure - Service Stopped',
          message: `${ccpCheck.ccp_name} failed (${ccpCheck.recorded_value} vs limit ${ccpCheck.critical_limit}). Service halted. Corrective action initiated by ${user?.full_name}`,
          type: 'alert',
          priority: 'critical',
          is_read: false
        }).catch(() => {});
      }

      return action;
    },
    onSuccess: () => {
      toast.success('✓ Corrective action recorded & logged');
      queryClient.invalidateQueries(['correctiveActions']);
      setSelectedAction(null);
      setNotes('');
      setPhotoFile(null);
      setPhotoPreview(null);
      if (onActionSubmitted) onActionSubmitted();
    },
    onError: () => {
      toast.error('Failed to record corrective action');
    }
  });

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!selectedAction) {
      toast.error('Please select a corrective action');
      return;
    }
    
    createActionMutation.mutate({
      actionType: selectedAction,
      notes
    });
  };

  return (
    <Card className="bg-red-50 border-2 border-red-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-900">
          <AlertCircle className="w-5 h-5" />
          Corrective Action Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Failed CCP Info */}
        <div className="bg-white rounded-lg p-3 border border-red-200">
          <p className="text-sm font-semibold text-red-900">{ccpCheck.ccp_name}</p>
          <p className="text-xs text-red-700 mt-1">
            Failed: {ccpCheck.recorded_value} &lt; {ccpCheck.critical_limit}
          </p>
        </div>

        {/* Action Selection */}
        <div className="space-y-3">
          <Label className="font-bold text-slate-900">Select Approved Action</Label>
          <div className="grid gap-3">
            {APPROVED_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => setSelectedAction(action.id)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedAction === action.id
                    ? `${action.color} border-current`
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <p className="font-semibold text-sm">{action.label}</p>
                <p className="text-xs opacity-75 mt-1">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label className="font-semibold">Additional Notes (Optional)</Label>
          <Textarea
            placeholder="Document what happened, actions taken, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <Label className="font-semibold mb-2 block">Evidence Photo (Optional)</Label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
            {photoPreview ? (
              <div className="space-y-2">
                <img src={photoPreview} alt="Preview" className="h-32 mx-auto rounded" />
                <button
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Upload className="w-5 h-5 mx-auto text-slate-400 mb-2" />
                <p className="text-xs text-slate-600">Click to upload photo</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Staff Info */}
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-600">Recorded by</p>
          <p className="font-semibold text-slate-900">{user?.full_name || user?.email}</p>
          <p className="text-xs text-slate-500 mt-1">
            {new Date().toLocaleString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={createActionMutation.isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createActionMutation.isPending}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            {createActionMutation.isPending ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Recording...
              </>
            ) : (
              '🔒 Record Action & Lock Menu'
            )}
          </Button>
        </div>

        {/* Re-check Required Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-amber-900">
            ⚠️ After corrective action is completed, you will be required to re-check this CCP
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
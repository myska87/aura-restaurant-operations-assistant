import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function EquipmentAuditForm({ open, onClose, equipment, allEquipment = [], user }) {
  const [formData, setFormData] = useState({
    equipment_names: [],
    condition: '',
    cleanliness: '✓',
    calibration_due_date: '',
    safety_check_passed: true,
    notes: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleEquipmentChange = (equipmentName) => {
    setFormData(prev => ({
      ...prev,
      equipment_names: prev.equipment_names.includes(equipmentName)
        ? prev.equipment_names.filter(e => e !== equipmentName)
        : [...prev.equipment_names, equipmentName]
    }));
  };

  const handleSubmit = async () => {
    if (formData.equipment_names.length === 0 || !formData.condition) {
      toast.error('Please select equipment and condition');
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl = null;
      if (photoFile) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: photoFile });
        photoUrl = uploadResult.file_url;
      }

      const complianceScore = 
        (formData.condition === 'excellent' ? 100 : formData.condition === 'good' ? 75 : 50) +
        (formData.cleanliness === '✓' ? 0 : formData.cleanliness === '⚠' ? -10 : -25) +
        (formData.safety_check_passed ? 0 : -50);

      const auditData = {
        equipment_names: formData.equipment_names,
        condition: formData.condition,
        cleanliness: formData.cleanliness,
        calibration_due_date: formData.calibration_due_date || null,
        safety_check_passed: formData.safety_check_passed,
        notes: formData.notes,
        photo_url: photoUrl,
        audit_date: new Date().toISOString(),
        audited_by_name: user?.full_name || 'Unknown',
        audited_by_email: user?.email || '',
        compliance_score: Math.min(100, Math.max(0, complianceScore))
      };

      await base44.entities.EquipmentAuditLog.create(auditData);

      // Update equipment last audit date
      for (const eqName of formData.equipment_names) {
        const eq = allEquipment.find(e => e.asset_name === eqName);
        if (eq) {
          await base44.entities.Assets_Registry_v1.update(eq.id, {
            last_audit_date: new Date().toISOString()
          });
        }
      }

      toast.success('Audit recorded successfully');
      queryClient.invalidateQueries(['equipment']);
      onClose();
    } catch (error) {
      console.error('Error recording audit:', error);
      toast.error('Failed to record audit');
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Equipment Audit & Inspection</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Equipment Selection */}
          <div>
            <label className="text-sm font-medium block mb-2">Select Equipment *</label>
            <div className="space-y-2 border rounded-lg p-3 bg-slate-50">
              {allEquipment.map(eq => (
                <label key={eq.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded">
                  <input
                    type="checkbox"
                    checked={formData.equipment_names.includes(eq.asset_name)}
                    onChange={() => handleEquipmentChange(eq.asset_name)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{eq.asset_name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="text-sm font-medium block mb-1">Condition *</label>
            <Select value={formData.condition} onValueChange={(value) => setFormData({...formData, condition: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent - No issues</SelectItem>
                <SelectItem value="good">Good - Minor wear</SelectItem>
                <SelectItem value="needs_repair">Needs Repair - Attention required</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cleanliness */}
          <div>
            <label className="text-sm font-medium block mb-1">Cleanliness</label>
            <Select value={formData.cleanliness} onValueChange={(value) => setFormData({...formData, cleanliness: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="✓">✓ Clean & Hygienic</SelectItem>
                <SelectItem value="⚠">⚠ Needs Cleaning</SelectItem>
                <SelectItem value="❌">❌ Deep Clean Required</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calibration Due Date */}
          <div>
            <label className="text-sm font-medium block mb-1">Calibration Due Date</label>
            <input
              type="date"
              value={formData.calibration_due_date}
              onChange={(e) => setFormData({...formData, calibration_due_date: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Safety Check */}
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <input
              type="checkbox"
              checked={formData.safety_check_passed}
              onChange={(e) => setFormData({...formData, safety_check_passed: e.target.checked})}
              className="w-4 h-4"
            />
            <label className="text-sm font-medium text-slate-700">Safety Check Passed</label>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium block mb-1">Notes</label>
            <Textarea
              placeholder="Any observations or issues..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>

          {/* Photo */}
          <div>
            <label className="text-sm font-medium block mb-1">Photo Proof (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0])}
              className="w-full"
            />
            {photoFile && <p className="text-sm text-emerald-600 mt-1">✓ {photoFile.name}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? 'Recording...' : 'Record Audit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
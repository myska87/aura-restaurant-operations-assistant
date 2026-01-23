import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickFaultReportForm({ open, onClose, equipment, allEquipment = [], user }) {
  const [formData, setFormData] = useState({
    equipment_name: equipment?.asset_name || '',
    fault_type: '',
    description: '',
    severity: 'medium',
    assigned_to: 'manager',
    notes: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!formData.equipment_name || !formData.fault_type || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl = null;
      if (photoFile) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: photoFile });
        photoUrl = uploadResult.file_url;
      }

      const faultData = {
        equipment_name: formData.equipment_name,
        fault_type: formData.fault_type,
        description: formData.description,
        severity: formData.severity,
        assigned_to: formData.assigned_to,
        notes: formData.notes,
        photo_url: photoUrl,
        fault_date: new Date().toISOString(),
        reported_by_name: user?.full_name || 'Unknown',
        reported_by_email: user?.email || '',
        status: 'reported',
        impact: 'operational'
      };

      await base44.entities.EquipmentFault.create(faultData);

      // Create notification for manager
      await base44.entities.Notification.create({
        recipient_email: 'manager@example.com',
        title: `Equipment Fault: ${formData.equipment_name}`,
        message: `${formData.severity.toUpperCase()} severity fault reported: ${formData.description}`,
        type: 'equipment_fault',
        is_read: false
      });

      toast.success('Fault reported successfully');
      queryClient.invalidateQueries(['equipment-faults-active']);
      queryClient.invalidateQueries(['equipment-faults-all']);
      onClose();
    } catch (error) {
      console.error('Error reporting fault:', error);
      toast.error('Failed to report fault');
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Report Equipment Fault
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Equipment */}
          <div>
            <label className="text-sm font-medium block mb-1">Equipment *</label>
            <Select value={formData.equipment_name} onValueChange={(value) => setFormData({...formData, equipment_name: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allEquipment.map(eq => (
                  <SelectItem key={eq.id} value={eq.asset_name}>{eq.asset_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fault Type */}
          <div>
            <label className="text-sm font-medium block mb-1">Fault Type *</label>
            <Select value={formData.fault_type} onValueChange={(value) => setFormData({...formData, fault_type: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="temperature">Temperature</SelectItem>
                <SelectItem value="mechanical">Mechanical</SelectItem>
                <SelectItem value="hygiene">Hygiene/Cleaning</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium block mb-1">Description *</label>
            <Textarea
              placeholder="Describe the fault in detail..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          {/* Severity */}
          <div>
            <label className="text-sm font-medium block mb-1">Severity *</label>
            <Select value={formData.severity} onValueChange={(value) => setFormData({...formData, severity: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Minor issue, can wait</SelectItem>
                <SelectItem value="medium">Medium - Affects operations</SelectItem>
                <SelectItem value="critical">Critical - Safety/Food risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assigned To */}
          <div>
            <label className="text-sm font-medium block mb-1">Assign To</label>
            <Select value={formData.assigned_to} onValueChange={(value) => setFormData({...formData, assigned_to: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="engineer">Engineer</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Photo */}
          <div>
            <label className="text-sm font-medium block mb-1">Photo (optional)</label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0])}
                className="flex-1"
              />
              {photoFile && <span className="text-sm text-emerald-600">✓ Selected</span>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium block mb-1">Additional Notes</label>
            <Textarea
              placeholder="Any other information..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {submitting ? 'Reporting...' : 'Report Fault'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
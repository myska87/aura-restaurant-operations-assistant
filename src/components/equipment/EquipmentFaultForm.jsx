import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Camera } from 'lucide-react';

export default function EquipmentFaultForm({ equipment, allEquipment, onClose }) {
  const queryClient = useQueryClient();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(equipment?.id || '');
  const [faultType, setFaultType] = useState('mechanical');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [impact, setImpact] = useState('service');
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const createFaultMutation = useMutation({
    mutationFn: async (data) => {
      let photoUrls = [];
      
      if (photoFile) {
        setUploading(true);
        const uploadResult = await base44.integrations.Core.UploadFile({ file: photoFile });
        photoUrls = [uploadResult.file_url];
        setUploading(false);
      }

      return base44.entities.EquipmentFault.create({
        ...data,
        photo_urls: photoUrls
      });
    },
    onSuccess: async (fault) => {
      queryClient.invalidateQueries(['equipment-faults-active']);
      queryClient.invalidateQueries(['equipment-faults-all']);
      
      // Create notification for manager
      await base44.entities.Notification.create({
        title: `${fault.severity.toUpperCase()}: Equipment Fault Reported`,
        message: `${fault.equipment_name} - ${fault.description}`,
        type: fault.severity === 'critical' ? 'critical' : 'warning',
        recipient_email: 'manager@chaipatta.com', // Should be dynamic
        is_read: false
      });

      // If impact includes food_safety, create incident
      if (fault.impact === 'food_safety' || fault.impact === 'both') {
        // TODO: Auto-create incident when incidents module is available
      }
      
      onClose();
    }
  });

  const handleSubmit = () => {
    if (!user || !selectedEquipmentId || !description) return;

    const selectedEquip = allEquipment.find(e => e.id === selectedEquipmentId);

    createFaultMutation.mutate({
      equipment_id: selectedEquipmentId,
      equipment_name: selectedEquip.name,
      fault_date: new Date().toISOString(),
      fault_type: faultType,
      description,
      severity,
      impact,
      reported_by: user.email,
      reported_by_name: user.full_name,
      status: 'reported',
      hq_notified: severity === 'critical'
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-900">
            <AlertTriangle className="w-5 h-5" />
            Report Equipment Fault
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="equipment">Equipment *</Label>
            <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
              <SelectTrigger id="equipment">
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {allEquipment.map(eq => (
                  <SelectItem key={eq.id} value={eq.id}>
                    {eq.name} - {eq.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fault-type">Fault Type *</Label>
            <Select value={faultType} onValueChange={setFaultType}>
              <SelectTrigger id="fault-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mechanical">Mechanical</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="temperature">Temperature</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Fault Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the fault in detail..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="severity">Severity *</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger id="severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Minor issue</SelectItem>
                <SelectItem value="medium">Medium - Affects operations</SelectItem>
                <SelectItem value="critical">Critical - Immediate action needed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="impact">Impact *</Label>
            <Select value={impact} onValueChange={setImpact}>
              <SelectTrigger id="impact">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="food_safety">Food Safety Risk</SelectItem>
                <SelectItem value="service">Service/Operations</SelectItem>
                <SelectItem value="both">Both Food Safety & Service</SelectItem>
                <SelectItem value="none">No immediate impact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Photo (Optional)</Label>
            <div className="mt-1">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setPhotoFile(e.target.files[0])}
                className="hidden"
                id="fault-photo-upload"
              />
              <label htmlFor="fault-photo-upload">
                <Button type="button" variant="outline" className="w-full" asChild>
                  <span>
                    <Camera className="w-4 h-4 mr-2" />
                    {photoFile ? photoFile.name : 'Take Photo of Fault'}
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {(severity === 'critical' || impact === 'food_safety' || impact === 'both') && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-sm text-red-900 font-semibold">⚠️ Critical Issue</p>
              <p className="text-sm text-red-700 mt-1">
                Manager and HQ will be notified immediately. If food safety is at risk, operations may need to stop until resolved.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createFaultMutation.isPending || uploading || !selectedEquipmentId || !description}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {uploading ? 'Uploading...' : createFaultMutation.isPending ? 'Reporting...' : 'Report Fault'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertTriangle, AlertCircle, Upload, Camera } from 'lucide-react';
import { format } from 'date-fns';

export default function EquipmentCheckForm({ equipment, onClose }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('ok');
  const [comment, setComment] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const createCheckMutation = useMutation({
    mutationFn: async (data) => {
      let photoUrl = null;
      
      if (photoFile) {
        setUploading(true);
        const uploadResult = await base44.integrations.Core.UploadFile({ file: photoFile });
        photoUrl = uploadResult.file_url;
        setUploading(false);
      }

      return base44.entities.EquipmentCheck.create({
        ...data,
        photo_url: photoUrl
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries(['equipment-checks-today']);
      
      // If status is not OK, create notification for manager
      if (status !== 'ok') {
        await base44.entities.Notification.create({
          title: `Equipment ${status === 'fault' ? 'Fault' : 'Warning'}: ${equipment.name}`,
          message: comment || `${equipment.name} requires attention`,
          type: status === 'fault' ? 'critical' : 'warning',
          recipient_email: 'manager@chaipatta.com', // This should be dynamic
          is_read: false
        });
      }
      
      onClose();
    }
  });

  const handleSubmit = () => {
    if (!user) return;

    const now = new Date();
    const hour = now.getHours();
    let checkTime = 'opening';
    if (hour >= 12 && hour < 18) checkTime = 'mid_shift';
    else if (hour >= 18) checkTime = 'closing';

    createCheckMutation.mutate({
      check_date: format(now, 'yyyy-MM-dd'),
      check_time: checkTime,
      equipment_id: equipment.id,
      equipment_name: equipment.name,
      status,
      comment,
      checked_by: user.email,
      checked_by_name: user.full_name,
      manager_notified: status !== 'ok',
      follow_up_required: status === 'fault'
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Equipment Health Check</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">{equipment.name}</Label>
            <p className="text-sm text-slate-600">{equipment.location}</p>
          </div>

          <div>
            <Label className="mb-3 block">Status *</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setStatus('ok')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  status === 'ok' 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${status === 'ok' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <p className={`text-sm font-semibold ${status === 'ok' ? 'text-emerald-900' : 'text-slate-600'}`}>OK</p>
                <p className="text-xs text-slate-500">Working normally</p>
              </button>

              <button
                onClick={() => setStatus('warning')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  status === 'warning' 
                    ? 'border-amber-500 bg-amber-50' 
                    : 'border-slate-200 hover:border-amber-300'
                }`}
              >
                <AlertCircle className={`w-8 h-8 mx-auto mb-2 ${status === 'warning' ? 'text-amber-600' : 'text-slate-400'}`} />
                <p className={`text-sm font-semibold ${status === 'warning' ? 'text-amber-900' : 'text-slate-600'}`}>Warning</p>
                <p className="text-xs text-slate-500">Needs attention</p>
              </button>

              <button
                onClick={() => setStatus('fault')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  status === 'fault' 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-slate-200 hover:border-red-300'
                }`}
              >
                <AlertTriangle className={`w-8 h-8 mx-auto mb-2 ${status === 'fault' ? 'text-red-600' : 'text-slate-400'}`} />
                <p className={`text-sm font-semibold ${status === 'fault' ? 'text-red-900' : 'text-slate-600'}`}>Fault</p>
                <p className="text-xs text-slate-500">Not working</p>
              </button>
            </div>
          </div>

          {status !== 'ok' && (
            <>
              <div>
                <Label htmlFor="comment">Comment / Details *</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe the issue..."
                  className="mt-1"
                  rows={3}
                />
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
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload">
                    <Button type="button" variant="outline" className="w-full" asChild>
                      <span>
                        <Camera className="w-4 h-4 mr-2" />
                        {photoFile ? photoFile.name : 'Take Photo'}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createCheckMutation.isPending || uploading || (status !== 'ok' && !comment)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {uploading ? 'Uploading...' : createCheckMutation.isPending ? 'Saving...' : 'Submit Check'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
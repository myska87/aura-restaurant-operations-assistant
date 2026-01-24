import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, addMonths, addQuarters } from 'date-fns';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Upload, CheckCircle2 } from 'lucide-react';

const EQUIPMENT_DETAILS = {
  oven: { name: 'Oven' },
  fridge: { name: 'Fridge' },
  freezer: { name: 'Freezer' },
  extraction: { name: 'Extraction Hood' },
  drains: { name: 'Drains' },
  storage_shelves: { name: 'Storage Shelves' },
};

const FREQUENCIES = {
  weekly: { label: 'Weekly' },
  monthly: { label: 'Monthly' },
  quarterly: { label: 'Quarterly' },
};

export default function DeepCleaningScheduleForm({ user, onSuccess }) {
  const [equipment, setEquipment] = useState('');
  const [frequency, setFrequency] = useState('');
  const [assignedRole, setAssignedRole] = useState('');
  const [lastCompletedDate, setLastCompletedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [supervisorApproval, setSupervisorApproval] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const queryClient = useQueryClient();

  const calculateNextDueDate = (baseDate, freq) => {
    const date = new Date(baseDate);
    if (freq === 'weekly') return addDays(date, 7);
    if (freq === 'monthly') return addMonths(date, 1);
    if (freq === 'quarterly') return addQuarters(date, 1);
    return date;
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      let beforePhotoUrl = null;
      let afterPhotoUrl = null;

      // Upload photos if provided
      if (beforePhoto) {
        const res = await base44.integrations.Core.UploadFile({ file: beforePhoto });
        beforePhotoUrl = res.file_url;
      }
      if (afterPhoto) {
        const res = await base44.integrations.Core.UploadFile({ file: afterPhoto });
        afterPhotoUrl = res.file_url;
      }

      const nextDue = calculateNextDueDate(lastCompletedDate, frequency);
      const now = new Date();
      const isOverdue = new Date(nextDue) < now;

      const data = {
        area_equipment: equipment,
        area_equipment_name: EQUIPMENT_DETAILS[equipment].name,
        frequency,
        last_completed_date: lastCompletedDate,
        next_due_date: format(nextDue, 'yyyy-MM-dd'),
        is_overdue: isOverdue,
        assigned_role: assignedRole,
        completed_by_id: user.id,
        completed_by_name: user.full_name,
        completed_by_email: user.email,
        completion_date: now.toISOString(),
        supervisor_approval: supervisorApproval,
        before_photo_url: beforePhotoUrl,
        after_photo_url: afterPhotoUrl,
        notes,
        status: supervisorApproval ? 'approved' : 'completed',
      };

      await base44.entities.DeepCleaningSchedule.create(data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deepCleaningSchedules'] });
      setSuccess(true);
      setEquipment('');
      setFrequency('');
      setAssignedRole('');
      setBeforePhoto(null);
      setAfterPhoto(null);
      setSupervisorApproval(false);
      setNotes('');
      setTimeout(() => setSuccess(false), 3000);
      onSuccess?.();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!equipment || !frequency || !assignedRole || !supervisorApproval) {
      alert('Please fill all required fields and get supervisor approval');
      return;
    }
    setLoading(true);
    submitMutation.mutate();
    setLoading(false);
  };

  const nextDueDate = frequency ? format(calculateNextDueDate(lastCompletedDate, frequency), 'dd MMM yyyy') : 'N/A';

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardTitle className="text-purple-900">Deep Cleaning Schedule</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Equipment Selection */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              Area / Equipment <span className="text-red-600">*</span>
            </label>
            <Select value={equipment} onValueChange={setEquipment}>
              <SelectTrigger className="bg-white border-slate-300">
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EQUIPMENT_DETAILS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Frequency */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              Frequency <span className="text-red-600">*</span>
            </label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="bg-white border-slate-300">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FREQUENCIES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Last Completed Date */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Last Completed Date</label>
            <input
              type="date"
              value={lastCompletedDate}
              onChange={(e) => setLastCompletedDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Next Due Date (auto) */}
          {frequency && (
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <label className="text-sm font-semibold text-slate-700">Next Due Date</label>
              <p className="text-lg font-bold text-purple-700">{nextDueDate}</p>
            </div>
          )}

          {/* Assigned Role */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              Assigned Role <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={assignedRole}
              onChange={(e) => setAssignedRole(e.target.value)}
              placeholder="e.g., Kitchen Manager, Chef"
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Completed By (auto) */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-300">
            <label className="text-sm font-semibold text-slate-700">Completed By</label>
            <p className="text-lg font-bold text-slate-800">{user.full_name}</p>
          </div>

          {/* Before Photo */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Before Photo</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBeforePhoto(e.target.files?.[0] || null)}
                className="flex-1"
              />
              {beforePhoto && <Badge className="bg-purple-600">{beforePhoto.name.slice(0, 15)}...</Badge>}
            </div>
          </div>

          {/* After Photo */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">After Photo</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAfterPhoto(e.target.files?.[0] || null)}
                className="flex-1"
              />
              {afterPhoto && <Badge className="bg-purple-600">{afterPhoto.name.slice(0, 15)}...</Badge>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations or issues found..."
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows="2"
            />
          </div>

          {/* Supervisor Approval */}
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-amber-900">Supervisor Approval Required</span>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={supervisorApproval}
                onChange={(e) => setSupervisorApproval(e.target.checked)}
                className="w-5 h-5 accent-amber-600"
              />
              <span className="text-slate-800">I confirm this deep cleaning has been completed to standard and approved.</span>
            </label>
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-emerald-50 border border-emerald-400 rounded-lg flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-emerald-800">Deep cleaning recorded successfully!</span>
            </motion.div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!equipment || !frequency || !assignedRole || !supervisorApproval || loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3"
          >
            {loading ? 'Submitting...' : 'Submit Deep Cleaning Log'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
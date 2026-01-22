import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function ShiftApprovalDialog({ shift, open, onOpenChange, user }) {
  const [hasIssues, setHasIssues] = useState(shift?.has_issues || false);
  const [issueType, setIssueType] = useState(shift?.issue_type || '');
  const [managerNotes, setManagerNotes] = useState(shift?.manager_notes || '');
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Shift.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      queryClient.invalidateQueries(['pending-approvals']);
      queryClient.invalidateQueries(['shifts-month']);
      onOpenChange(false);
    }
  });

  const handleApprove = () => {
    if (hasIssues && !managerNotes) {
      alert('Manager notes are MANDATORY when there are issues with the shift.');
      return;
    }

    updateMutation.mutate({
      id: shift.id,
      data: {
        status: 'approved',
        needs_approval: false,
        approved_by: user?.email,
        approved_date: new Date().toISOString(),
        has_issues: hasIssues,
        issue_type: hasIssues ? issueType : null,
        manager_notes: managerNotes
      }
    });
  };

  const handleReject = () => {
    if (!managerNotes) {
      alert('Manager notes are MANDATORY when rejecting a shift.');
      return;
    }

    updateMutation.mutate({
      id: shift.id,
      data: {
        status: 'rejected',
        needs_approval: false,
        approved_by: user?.email,
        approved_date: new Date().toISOString(),
        has_issues: true,
        issue_type: issueType || 'other',
        manager_notes: managerNotes
      }
    });
  };

  if (!shift) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Approve Shift</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-xs text-slate-600 font-semibold">Staff Member</p>
              <p className="font-bold">{shift.staff_name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-semibold">Date</p>
              <p className="font-bold">{format(new Date(shift.date), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-semibold">Scheduled</p>
              <p className="font-bold">{shift.scheduled_start} - {shift.scheduled_end}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-semibold">Actual</p>
              <p className="font-bold">
                {shift.actual_clock_in ? format(new Date(shift.actual_clock_in), 'HH:mm') : '-'} - {' '}
                {shift.actual_clock_out ? format(new Date(shift.actual_clock_out), 'HH:mm') : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-semibold">Duration</p>
              <p className="font-bold">{shift.duration?.toFixed(2) || 0} hours</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-semibold">Cost</p>
              <p className="font-bold text-emerald-600">£{shift.total_cost?.toFixed(2) || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <input
              type="checkbox"
              checked={hasIssues}
              onChange={(e) => setHasIssues(e.target.checked)}
              className="w-4 h-4"
            />
            <Label>This shift has issues (incorrect hours, late arrival, performance problem, etc.)</Label>
          </div>

          {hasIssues && (
            <div>
              <Label>Issue Type *</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select issue type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incorrect_hours">Incorrect Hours</SelectItem>
                  <SelectItem value="late_arrival">Late Arrival</SelectItem>
                  <SelectItem value="early_departure">Early Departure</SelectItem>
                  <SelectItem value="performance">Performance Issue</SelectItem>
                  <SelectItem value="attendance">Attendance Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="flex items-center gap-2">
              Manager Notes
              {hasIssues && (
                <Badge className="bg-red-500">MANDATORY</Badge>
              )}
            </Label>
            <Textarea
              value={managerNotes}
              onChange={(e) => setManagerNotes(e.target.value)}
              rows={4}
              placeholder={hasIssues ? "Explain the issue and actions taken..." : "Optional notes about this shift..."}
              className="mt-2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={updateMutation.isPending}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CheckCircle, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function HandoverForm({ checkIn, user, onComplete }) {
  const [formData, setFormData] = useState({
    stock_issues: '',
    equipment_issues: '',
    prep_status: '',
    cleaning_status: '',
    general_notes: ''
  });

  const queryClient = useQueryClient();

  const createHandoverMutation = useMutation({
    mutationFn: (data) => base44.entities.ShiftHandover.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shiftHandovers']);
      onComplete(true);
      alert('Shift handover completed successfully!');
    }
  });

  const handleSubmit = () => {
    createHandoverMutation.mutate({
      shift_date: checkIn.shift_date,
      shift_type: checkIn.shift_type,
      handover_from: user.email,
      handover_from_name: user.full_name || user.email,
      ...formData
    });
  };

  const isComplete = formData.stock_issues.trim() || 
                     formData.equipment_issues.trim() || 
                     formData.prep_status.trim() || 
                     formData.cleaning_status.trim() || 
                     formData.general_notes.trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Shift Handover
        </CardTitle>
        <p className="text-sm text-slate-600">
          Complete handover before checking out - mandatory for shift closure
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1 block">
            Stock Issues
          </label>
          <Textarea
            value={formData.stock_issues}
            onChange={(e) => setFormData({...formData, stock_issues: e.target.value})}
            placeholder="Any stock shortages, low levels, or ordering needed..."
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1 block">
            Equipment Issues
          </label>
          <Textarea
            value={formData.equipment_issues}
            onChange={(e) => setFormData({...formData, equipment_issues: e.target.value})}
            placeholder="Any equipment problems, maintenance needed, or faults..."
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1 block">
            Prep Status
          </label>
          <Textarea
            value={formData.prep_status}
            onChange={(e) => setFormData({...formData, prep_status: e.target.value})}
            placeholder="What prep is done, what's missing, what needs attention..."
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1 block">
            Cleaning Status
          </label>
          <Textarea
            value={formData.cleaning_status}
            onChange={(e) => setFormData({...formData, cleaning_status: e.target.value})}
            placeholder="What's been cleaned, what needs attention..."
            rows={2}
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1 block">
            General Notes for Next Shift
          </label>
          <Textarea
            value={formData.general_notes}
            onChange={(e) => setFormData({...formData, general_notes: e.target.value})}
            placeholder="Any other important information for the next shift..."
            rows={3}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!isComplete}
          size="lg"
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Complete Handover
        </Button>

        {!isComplete && (
          <p className="text-sm text-amber-700 text-center">
            Please provide at least one note for handover
          </p>
        )}
      </CardContent>
    </Card>
  );
}
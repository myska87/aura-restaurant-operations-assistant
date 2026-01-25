import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const checkConfig = {
  temperature: {
    title: '🌡️ Take Temperature Check',
    description: 'Quick temperature check for hot and cold holding.',
    purpose: 'Confirm all temperature-controlled equipment is maintaining safe holding temperatures during service.'
  },
  hygiene: {
    title: '🧼 Mid-Service Hygiene Check',
    description: 'Confirm hygiene and cleanliness standards during service.',
    purpose: 'Verify that hygiene standards and hand washing procedures are being maintained throughout service.'
  },
  cleaning: {
    title: '🧹 Mid-Service Cleaning Confirmation',
    description: 'Confirm key areas remain clean and safe during service.',
    purpose: 'Verify that food preparation areas, equipment, and surfaces remain clean and free from contamination.'
  },
  allergen: {
    title: '⚠️ Allergen Safety Check',
    description: 'Confirm allergen procedures are being followed.',
    purpose: 'Verify that allergen segregation, labeling, and cross-contamination prevention procedures are in place.'
  }
};

export default function QuickCheckForm({ 
  open, 
  onClose, 
  checkType, 
  user, 
  shiftDate,
  onSuccess 
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const config = checkConfig[checkType];

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.MidServiceCheck.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['midServiceChecks', shiftDate] });
      setConfirmed(false);
      setComments('');
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      console.error('Error submitting check:', error);
      alert('Error submitting check. Please try again.');
    }
  });

  const handleSubmit = async () => {
    if (!confirmed) {
      alert('Please confirm that standards are being met.');
      return;
    }

    setSubmitting(true);
    submitMutation.mutate({
      check_type: checkType,
      check_date: shiftDate,
      check_time: new Date().toISOString(),
      staff_id: user?.id || '',
      staff_name: user?.full_name || user?.email || 'Unknown',
      staff_email: user?.email || '',
      confirmed: true,
      comments: comments || null,
      shift_date: shiftDate,
      status: 'confirmed'
    });
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{config.title}</DialogTitle>
          <DialogDescription className="text-xs">{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Purpose Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-blue-800 leading-relaxed">{config.purpose}</p>
            </CardContent>
          </Card>

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={setConfirmed}
              className="mt-0.5"
            />
            <Label htmlFor="confirm" className="text-xs text-slate-700 font-medium cursor-pointer flex-1">
              I confirm standards are being met
            </Label>
          </div>

          {/* Staff Info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-500 mb-1">Completed by</p>
              <p className="font-semibold text-slate-800">{user?.full_name || user?.email}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Time</p>
              <p className="font-semibold text-slate-800">{format(new Date(), 'HH:mm')}</p>
            </div>
          </div>

          {/* Comments */}
          <div>
            <Label htmlFor="comments" className="text-xs font-medium text-slate-700 mb-2 block">
              Comments (optional)
            </Label>
            <Textarea
              id="comments"
              placeholder="Add any notes or observations..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="text-xs h-20 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!confirmed || submitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              size="sm"
            >
              {submitting ? '⏳ Submitting...' : '✓ Confirm'}
            </Button>
          </div>

          {/* Success Feedback */}
          {submitMutation.isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-800">Check confirmed ✓</span>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
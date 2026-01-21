import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const CHECKLIST_ITEMS = [
  { id: 'ppe_stocked', label: 'PPE properly stocked (gloves, masks, etc.)' },
  { id: 'labeled_correctly', label: 'All chemicals correctly labeled' },
  { id: 'stored_properly', label: 'Chemicals stored in correct areas' },
  { id: 'sds_available', label: 'Safety Data Sheets available on site' },
  { id: 'no_damage', label: 'Containers undamaged and sealed' },
  { id: 'emergency_info', label: 'Emergency contact info visible' },
  { id: 'spill_kit', label: 'Spill kits accessible and stocked' }
];

export default function DailyChemicalChecklist() {
  const [checklist, setChecklist] = useState({});
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();

  const submitChecklistMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.ChemicalCheck.create({
        check_date: new Date().toISOString(),
        checked_by_id: user.id,
        checked_by_name: user.full_name,
        ...data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checks'] });
      setSubmitted(true);
      setTimeout(() => {
        setChecklist({});
        setNotes('');
        setSubmitted(false);
      }, 2000);
    }
  });

  const handleToggle = (id) => {
    setChecklist(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSubmit = () => {
    const checkedCount = Object.values(checklist).filter(Boolean).length;
    submitChecklistMutation.mutate({
      shift_type: 'daily',
      items_checked: CHECKLIST_ITEMS.length,
      items_passed: checkedCount,
      all_checks_passed: checkedCount === CHECKLIST_ITEMS.length,
      notes: notes
    });
  };

  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const completionPercent = Math.round((checkedCount / CHECKLIST_ITEMS.length) * 100);

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="bg-emerald-50 border-emerald-300">
          <CardContent className="pt-6 text-center py-12">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <p className="font-semibold text-emerald-900">Daily checklist submitted</p>
            <p className="text-sm text-emerald-700">Thank you for keeping our facility safe</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daily Safety Checklist</CardTitle>
            <Badge className="bg-blue-100 text-blue-800">{format(new Date(), 'MMM d, yyyy')}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Completion Progress</Label>
              <span className="text-sm font-semibold">{completionPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          {/* Checklist Items */}
          <div className="space-y-3">
            {CHECKLIST_ITEMS.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Checkbox
                  id={item.id}
                  checked={checklist[item.id] || false}
                  onCheckedChange={() => handleToggle(item.id)}
                />
                <Label
                  htmlFor={item.id}
                  className="cursor-pointer flex-1 font-medium text-slate-700"
                >
                  {item.label}
                </Label>
                {checklist[item.id] && <CheckCircle className="w-5 h-5 text-emerald-600" />}
              </motion.div>
            ))}
          </div>

          {/* Notes */}
          <div className="space-y-2 pt-4 border-t">
            <Label>Additional Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any issues or observations?"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline">Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={checkedCount === 0 || submitChecklistMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitChecklistMutation.isPending ? 'Submitting...' : 'Submit Checklist'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
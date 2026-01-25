import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Sparkles, UtensilsCrossed, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const HYGIENE_CHECKS = [
  {
    id: 'general_hygiene',
    icon: Sparkles,
    title: '🧼 General Hygiene',
    description: 'All surfaces sanitized and wiped down, floors mopped and free of debris, bins emptied and cleaned, hand wash stations fully stocked with soap and paper towels, and all staff wearing clean uniforms with proper PPE.',
    color: 'bg-blue-500'
  },
  {
    id: 'food_safety',
    icon: UtensilsCrossed,
    title: '🍴 Food Safety',
    description: 'All food items properly covered and labeled with dates, cold chain maintained (fridges/freezers at safe temps), hot food held above 63°C, raw and cooked foods separated to prevent cross-contamination, and allergen procedures followed with clear labeling.',
    color: 'bg-emerald-500'
  },
  {
    id: 'cleaning_records',
    icon: FileText,
    title: '🧴 Cleaning Records',
    description: 'Daily cleaning log signed and completed, deep clean schedule reviewed and up to date, pest control documentation current with no issues, and waste segregation bins correctly labeled and in use.',
    color: 'bg-purple-500'
  }
];

export default function HygieneCheckForm({ user, onSuccess, onCancel }) {
  const [checks, setChecks] = useState({});
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.DailyCleaningLog.create(data);
    },
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        queryClient.invalidateQueries(['dailyCleaningLogs']);
        onSuccess?.();
      }, 1500);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const allChecked = HYGIENE_CHECKS.every(check => checks[check.id]);
    
    if (!allChecked) {
      alert('Please complete all hygiene checks before submitting');
      return;
    }

    setLoading(true);

    const today = format(new Date(), 'yyyy-MM-dd');
    const completedChecks = HYGIENE_CHECKS.map(check => ({
      category: check.title,
      completed: checks[check.id],
      notes: notes[check.id] || ''
    }));

    submitMutation.mutate({
      date: today,
      area: 'Hygiene Check',
      area_name: 'Daily Hygiene Inspection',
      cleaning_task: 'Complete hygiene check across all areas',
      cleaning_method: 'Visual inspection and verification',
      completed_by_id: user.id,
      completed_by_name: user.full_name,
      completed_by_email: user.email,
      time_completed: new Date().toISOString(),
      status: 'completed',
      supervisor_sign_off: false,
      notes: JSON.stringify(completedChecks)
    });
  };

  const toggleCheck = (checkId) => {
    setChecks(prev => ({
      ...prev,
      [checkId]: !prev[checkId]
    }));
  };

  const completedCount = Object.values(checks).filter(Boolean).length;
  const totalChecks = HYGIENE_CHECKS.length;

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardTitle className="text-2xl text-blue-900 flex items-center justify-between">
          <span>Hygiene Check</span>
          <Badge variant={completedCount === totalChecks ? 'default' : 'outline'} className="text-lg">
            {completedCount}/{totalChecks}
          </Badge>
        </CardTitle>
        <p className="text-sm text-slate-600 mt-2">
          Complete all hygiene checks to ensure safe food handling operations
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {HYGIENE_CHECKS.map((check, idx) => {
            const Icon = check.icon;
            const isChecked = checks[check.id];
            
            return (
              <motion.div
                key={check.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-5 rounded-xl border-2 transition-all ${
                  isChecked 
                    ? 'border-emerald-400 bg-emerald-50' 
                    : 'border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleCheck(check.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`${check.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{check.title}</h3>
                      {isChecked && <CheckCircle2 className="w-5 h-5 text-emerald-600 ml-auto" />}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed mb-3">
                      {check.description}
                    </p>
                    <Textarea
                      value={notes[check.id] || ''}
                      onChange={(e) => setNotes(prev => ({ ...prev, [check.id]: e.target.value }))}
                      placeholder="Add any notes or observations (optional)..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-lg flex items-center gap-3"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span className="font-bold text-emerald-800">Hygiene check completed successfully!</span>
            </motion.div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={completedCount !== totalChecks || loading || success}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Submitting...' : success ? '✓ Complete' : 'Submit Hygiene Check'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
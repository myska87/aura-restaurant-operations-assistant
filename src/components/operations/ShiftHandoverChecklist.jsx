import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ShiftHandoverChecklist({ open, onClose, user, shift, date, onSubmit, loading }) {
  const [answers, setAnswers] = useState({
    incidents: '',
    stock_issues: '',
    equipment_issues: '',
    staff_notes: '',
    general_notes: ''
  });

  const [completed, setCompleted] = useState({
    incidents: false,
    stock_issues: false,
    equipment_issues: false,
    staff_notes: false,
    general_notes: false
  });

  const questions = [
    {
      id: 'incidents',
      label: 'Any incidents or accidents today?',
      required: true,
      placeholder: 'e.g., customer complaint, spillage, injury...'
    },
    {
      id: 'stock_issues',
      label: 'Stock issues or items running low?',
      required: true,
      placeholder: 'e.g., low flour, milk running out, missing items...'
    },
    {
      id: 'equipment_issues',
      label: 'Equipment faults or maintenance needed?',
      required: true,
      placeholder: 'e.g., dishwasher slow, fridge temperature high...'
    },
    {
      id: 'staff_notes',
      label: 'Staff performance or attendance notes?',
      required: false,
      placeholder: 'e.g., Team worked well, John called in sick...'
    },
    {
      id: 'general_notes',
      label: 'Any other important information?',
      required: false,
      placeholder: 'e.g., Next delivery arriving Thursday, special event planned...'
    }
  ];

  const handleToggleQuestion = (id) => {
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTextChange = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
    if (value.trim()) {
      setCompleted(prev => ({ ...prev, [id]: true }));
    }
  };

  const allRequiredAnswered = questions
    .filter(q => q.required)
    .every(q => completed[q.id]);

  const handleSubmit = () => {
    onSubmit({
      shift_date: date,
      shift_type: shift,
      incidents: answers.incidents,
      stock_issues: answers.stock_issues,
      equipment_issues: answers.equipment_issues,
      staff_notes: answers.staff_notes,
      general_notes: answers.general_notes
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            🔄 Shift Handover Checklist
          </DialogTitle>
          <Badge className="w-fit bg-blue-600 mt-2">{shift} Shift</Badge>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  completed[q.id]
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {completed[q.id] && (
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      )}
                      <p className="font-semibold text-slate-800">{q.label}</p>
                      {q.required && (
                        <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Textarea
                  value={answers[q.id]}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  rows={3}
                  className="text-sm"
                />
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!allRequiredAnswered && (
              <div className="flex items-center gap-2 text-amber-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                Complete all required questions
              </div>
            )}
            {allRequiredAnswered && (
              <div className="flex items-center gap-2 text-emerald-700 text-sm">
                <CheckCircle className="w-4 h-4" />
                Ready to submit
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!allRequiredAnswered || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Saving...' : 'Submit Handover'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
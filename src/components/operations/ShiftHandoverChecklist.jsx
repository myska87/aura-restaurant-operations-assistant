import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

export default function ShiftHandoverChecklist({ open, onClose, user, shift, date, onSubmit, loading }) {
  const [answers, setAnswers] = useState({
    incidents: { answer: null, details: '' },
    stock_issues: { answer: null, details: '' },
    equipment_issues: { answer: null, details: '' },
    staff_notes: { answer: null, details: '' },
    general_notes: { answer: null, details: '' }
  });

  const questions = [
    {
      id: 'incidents',
      label: '🚨 Any incidents or accidents?',
      detailsPlaceholder: 'Describe incident details...',
      required: true,
      priority: 'high'
    },
    {
      id: 'stock_issues',
      label: '📦 Stock issues or running low?',
      detailsPlaceholder: 'List items needing attention...',
      required: true,
      priority: 'medium'
    },
    {
      id: 'equipment_issues',
      label: '⚙️ Equipment faults or maintenance needed?',
      detailsPlaceholder: 'Describe equipment issues...',
      required: true,
      priority: 'high'
    },
    {
      id: 'staff_notes',
      label: '👥 Staff performance or attendance notes?',
      detailsPlaceholder: 'Add staff notes...',
      required: false,
      priority: 'low'
    },
    {
      id: 'general_notes',
      label: '📝 Any other important information?',
      detailsPlaceholder: 'Additional notes...',
      required: false,
      priority: 'low'
    }
  ];

  const handleAnswer = (id, value) => {
    setAnswers(prev => ({
      ...prev,
      [id]: { ...prev[id], answer: value, details: value === 'no' ? '' : prev[id].details }
    }));
  };

  const handleDetails = (id, value) => {
    setAnswers(prev => ({
      ...prev,
      [id]: { ...prev[id], details: value }
    }));
  };

  const allRequiredAnswered = questions
    .filter(q => q.required)
    .every(q => answers[q.id].answer !== null);

  const hasIssues = Object.entries(answers).some(([, data]) => data.answer === 'yes');

  const handleSubmit = async () => {
    // Call original submit
    onSubmit({
      shift_date: date,
      shift_type: shift,
      answers,
      has_issues: hasIssues
    });

    // Save to OperationReport
    try {
      await base44.entities.OperationReport.create({
        reportType: 'HANDOVER',
        locationId: 'default',
        staffId: user?.id || 'unknown',
        staffName: user?.full_name || user?.email || 'Staff',
        staffEmail: user?.email || 'unknown@restaurant.com',
        reportDate: date,
        completionPercentage: allRequiredAnswered ? 100 : 0,
        status: hasIssues ? 'fail' : 'pass',
        checklistItems: questions.map(q => ({
          item_id: q.id,
          item_name: q.label,
          answer: answers[q.id].answer || 'not_answered',
          notes: answers[q.id].details || ''
        })),
        failedItems: Object.entries(answers)
          .filter(([_, data]) => data.answer === 'yes')
          .map(([id]) => questions.find(q => q.id === id)?.label || id),
        sourceEntityId: date + '_' + shift,
        sourceEntityType: 'ShiftHandover',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving handover report:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            🔄 Shift Handover Checklist
          </DialogTitle>
          <Badge className="w-fit bg-blue-600 mt-2">{shift} Shift</Badge>
          {hasIssues && (
            <Badge className="w-fit bg-red-600 mt-2 ml-2">⚠️ Issues Detected</Badge>
          )}
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
                  answers[q.id].answer === 'yes'
                    ? 'bg-red-50 border-red-300'
                    : answers[q.id].answer === 'no'
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  {answers[q.id].answer === 'yes' && (
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  {answers[q.id].answer === 'no' && (
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  )}
                  <p className="font-semibold text-slate-800 flex-1">{q.label}</p>
                  {q.required && (
                    <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">
                      Required
                    </Badge>
                  )}
                </div>

                <div className="flex gap-3 mb-3">
                  <Button
                    onClick={() => handleAnswer(q.id, 'yes')}
                    variant={answers[q.id].answer === 'yes' ? 'default' : 'outline'}
                    className={`flex-1 ${
                      answers[q.id].answer === 'yes'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : ''
                    }`}
                  >
                    ✓ Yes
                  </Button>
                  <Button
                    onClick={() => handleAnswer(q.id, 'no')}
                    variant={answers[q.id].answer === 'no' ? 'default' : 'outline'}
                    className={`flex-1 ${
                      answers[q.id].answer === 'no'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : ''
                    }`}
                  >
                    ✗ No
                  </Button>
                </div>

                {answers[q.id].answer === 'yes' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.2 }}
                  >
                    <Textarea
                      value={answers[q.id].details}
                      onChange={(e) => handleDetails(q.id, e.target.value)}
                      placeholder={q.detailsPlaceholder}
                      rows={2}
                      className="text-sm border-red-200"
                    />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!allRequiredAnswered && (
              <div className="flex items-center gap-2 text-amber-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                Answer all required questions
              </div>
            )}
            {allRequiredAnswered && hasIssues && (
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4" />
                Manager will be notified
              </div>
            )}
            {allRequiredAnswered && !hasIssues && (
              <div className="flex items-center gap-2 text-emerald-700 text-sm">
                <CheckCircle className="w-4 h-4" />
                All clear - ready to submit
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
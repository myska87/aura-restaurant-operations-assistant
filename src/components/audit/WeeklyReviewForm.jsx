import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function WeeklyReviewForm({ user, auditForms = [], onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    hygiene_check: '',
    equipment_check: '',
    temperature_logs: '',
    waste_management: '',
    training_compliance: '',
    outstanding_issues: '',
    corrective_actions: '',
    overall_notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const sections = [
    {
      title: '🧼 Hygiene & Cleaning',
      field: 'hygiene_check',
      questions: [
        'Are all surfaces clean and sanitized?',
        'Is equipment properly cleaned?',
        'Are staff following hygiene protocols?'
      ]
    },
    {
      title: '🧰 Equipment Status',
      field: 'equipment_check',
      questions: [
        'All equipment functioning normally?',
        'Any faults or warnings reported?',
        'Maintenance schedules up to date?'
      ]
    },
    {
      title: '🌡️ Temperature & Food Safety',
      field: 'temperature_logs',
      questions: [
        'All refrigeration within range?',
        'Food labels current?',
        'No expired products found?'
      ]
    },
    {
      title: '🗑️ Waste & Inventory',
      field: 'waste_management',
      questions: [
        'Waste properly disposed?',
        'Stock levels appropriate?',
        'Labeling system in place?'
      ]
    },
    {
      title: '📚 Staff Training',
      field: 'training_compliance',
      questions: [
        'Staff certifications current?',
        'No overdue training?',
        'New starters onboarded?'
      ]
    },
    {
      title: '⚠️ Issues & Actions',
      field: 'outstanding_issues',
      questions: [
        'What issues were identified?',
        'What corrective actions are needed?',
        'Who is responsible for follow-up?'
      ]
    }
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const auditData = {
        audit_type: 'weekly_review',
        audited_by_name: user?.full_name || 'Unknown',
        audited_by_email: user?.email || '',
        audit_date: new Date().toISOString(),
        week_of: format(new Date(), 'yyyy-MM-dd'),
        responses: formData,
        score: Math.round((Object.values(formData).filter(v => v && v.length > 0).length / Object.keys(formData).length) * 100)
      };

      await base44.entities.AuditLog.create(auditData);

      // Create notification for pending actions
      if (formData.outstanding_issues) {
        await base44.entities.AuditIssue.create({
          audit_id: 'auto',
          description: formData.outstanding_issues,
          status: 'open',
          severity: 'medium',
          reported_date: new Date().toISOString(),
          reported_by_email: user?.email || ''
        });
      }

      toast.success('Weekly review submitted successfully');
      queryClient.invalidateQueries(['completed-audits']);
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{sections[currentStep].title}</span>
            <span className="text-sm text-slate-600">Step {currentStep + 1} of {sections.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentStep + 1) / sections.length) * 100}%` }}
            />
          </div>

          {/* Questions */}
          <div className="space-y-3">
            {sections[currentStep].questions.map((q, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-700">{q}</p>
              </div>
            ))}
          </div>

          {/* Response Input */}
          <div>
            <label className="text-sm font-medium block mb-2">Your Findings</label>
            <Textarea
              placeholder="Enter your observations and findings..."
              value={formData[sections[currentStep].field]}
              onChange={(e) => setFormData({...formData, [sections[currentStep].field]: e.target.value})}
              rows={4}
            />
          </div>

          {/* Navigation */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              variant="outline"
            >
              ← Previous
            </Button>
            {currentStep < sections.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex-1"
              >
                Next →
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? 'Submitting...' : 'Complete & Submit'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
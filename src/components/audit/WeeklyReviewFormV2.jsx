import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, startOfWeek } from 'date-fns';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Users, Zap } from 'lucide-react';

export default function WeeklyReviewFormV2({ user, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    total_sales: 0,
    aov: 0,
    cogs_percent: 25,
    wastage_percent: 5,
    transactions: 0,
    attendance_compliance: 95,
    training_completion: 80,
    staff_cost_percent: 30,
    incidents_logged: 0,
    reviews_collected: 0,
    average_rating: 4.5,
    repeat_customer_percent: 45,
    complaints_logged: 0,
    hygiene_checklist_percent: 90,
    equipment_issues_open: 0,
    equipment_issues_closed: 0,
    temperature_log_percent: 95,
    label_print_percent: 98,
    comments: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const sections = [
    {
      title: '💰 Sales Summary',
      icon: DollarSign,
      fields: [
        { key: 'total_sales', label: 'Total Sales (£)', type: 'number', placeholder: '10240' },
        { key: 'aov', label: 'Average Order Value (£)', type: 'number', placeholder: '12.50' },
        { key: 'transactions', label: 'Total Transactions', type: 'number', placeholder: '820' },
        { key: 'cogs_percent', label: 'Cost of Goods %', type: 'number', placeholder: '25', min: 0, max: 100 },
        { key: 'wastage_percent', label: 'Wastage %', type: 'number', placeholder: '5', min: 0, max: 100 }
      ]
    },
    {
      title: '👨‍💼 Staff Performance',
      icon: Users,
      fields: [
        { key: 'attendance_compliance', label: 'Attendance Compliance %', type: 'number', placeholder: '95', min: 0, max: 100 },
        { key: 'training_completion', label: 'Training Completion %', type: 'number', placeholder: '80', min: 0, max: 100 },
        { key: 'staff_cost_percent', label: 'Staff Cost %', type: 'number', placeholder: '30', min: 0, max: 100 },
        { key: 'incidents_logged', label: 'Incidents Logged', type: 'number', placeholder: '0' }
      ]
    },
    {
      title: '⭐ Customer Experience',
      icon: Zap,
      fields: [
        { key: 'reviews_collected', label: 'Reviews Collected', type: 'number', placeholder: '5' },
        { key: 'average_rating', label: 'Average Rating (0-5)', type: 'number', placeholder: '4.5', min: 0, max: 5, step: 0.1 },
        { key: 'repeat_customer_percent', label: 'Repeat Customer %', type: 'number', placeholder: '45', min: 0, max: 100 },
        { key: 'complaints_logged', label: 'Complaints Logged', type: 'number', placeholder: '0' }
      ]
    },
    {
      title: '✅ Operational Compliance',
      icon: TrendingUp,
      fields: [
        { key: 'hygiene_checklist_percent', label: 'Hygiene Checklist %', type: 'number', placeholder: '90', min: 0, max: 100 },
        { key: 'equipment_issues_open', label: 'Equipment Issues Open', type: 'number', placeholder: '0' },
        { key: 'equipment_issues_closed', label: 'Equipment Issues Closed', type: 'number', placeholder: '2' },
        { key: 'temperature_log_percent', label: 'Temperature Log %', type: 'number', placeholder: '95', min: 0, max: 100 },
        { key: 'label_print_percent', label: 'Label Print Accuracy %', type: 'number', placeholder: '98', min: 0, max: 100 }
      ]
    }
  ];

  const calculateScore = () => {
    const weights = {
      sales: { total_sales: 0.15, cogs_percent: 0.1, wastage_percent: 0.1 },
      staff: { attendance_compliance: 0.15, training_completion: 0.1 },
      customer: { average_rating: 0.15 },
      operations: { hygiene_checklist_percent: 0.2, temperature_log_percent: 0.05 }
    };

    let score = 0;
    score += (Math.min(formData.total_sales / 15000, 1) * 100) * weights.sales.total_sales;
    score += (formData.cogs_percent <= 30 ? 100 : 70) * weights.sales.cogs_percent;
    score += (formData.wastage_percent <= 5 ? 100 : 70) * weights.sales.wastage_percent;
    score += formData.attendance_compliance * weights.staff.attendance_compliance;
    score += formData.training_completion * weights.staff.training_completion;
    score += (formData.average_rating / 5) * 100 * weights.customer.average_rating;
    score += formData.hygiene_checklist_percent * weights.operations.hygiene_checklist_percent;
    score += formData.temperature_log_percent * weights.operations.temperature_log_percent;

    return Math.min(100, Math.max(0, Math.round(score)));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const weekStart = startOfWeek(new Date());
      const auditData = {
        audit_week: format(weekStart, 'yyyy-\\W\\W'),
        submitted_by_name: user?.full_name || 'Unknown',
        submitted_by_email: user?.email || '',
        submission_date: new Date().toISOString().split('T')[0],
        sales_summary: {
          total_sales: formData.total_sales,
          average_order_value: formData.aov,
          cost_of_goods_percent: formData.cogs_percent,
          wastage_percent: formData.wastage_percent,
          transactions: formData.transactions
        },
        staff_performance: {
          attendance_compliance_percent: formData.attendance_compliance,
          training_completion_percent: formData.training_completion,
          staff_cost_percent: formData.staff_cost_percent,
          incidents_logged: formData.incidents_logged,
          staff_count: 0
        },
        customer_experience: {
          reviews_collected: formData.reviews_collected,
          average_rating: formData.average_rating,
          repeat_customer_percent: formData.repeat_customer_percent,
          complaints_logged: formData.complaints_logged
        },
        operational_compliance: {
          hygiene_checklist_percent: formData.hygiene_checklist_percent,
          equipment_issues_open: formData.equipment_issues_open,
          equipment_issues_closed: formData.equipment_issues_closed,
          temperature_log_completion_percent: formData.temperature_log_percent,
          label_print_accuracy_percent: formData.label_print_percent
        },
        comments: formData.comments,
        audit_score: calculateScore(),
        status: 'submitted'
      };

      await base44.entities.WeeklyAudit.create(auditData);

      // Send notification to owner
      await base44.entities.Notification.create({
        recipient_email: 'owner@example.com',
        title: 'Weekly Audit Submitted',
        message: `Week audit completed by ${user?.full_name}. Score: ${auditData.audit_score}%. Sales: £${formData.total_sales}`,
        type: 'audit_weekly',
        is_read: false
      });

      toast.success(`Weekly audit submitted - Score: ${auditData.audit_score}%`);
      queryClient.invalidateQueries(['weekly-audits']);
      onClose();
    } catch (error) {
      console.error('Error submitting audit:', error);
      toast.error('Failed to submit audit');
    }
    setSubmitting(false);
  };

  const currentSection = sections[currentStep];
  const score = calculateScore();
  const Icon = currentSection.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-xl mx-auto">
      {/* Score Preview */}
      <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-300">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-700 font-medium">Current Audit Score</p>
              <p className={`text-4xl font-bold ${score >= 90 ? 'text-emerald-600' : score >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{score}%</p>
            </div>
            <Progress value={score} className="w-24 h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {currentSection.title}
          </CardTitle>
          <div className="text-xs text-slate-600 mt-2">Step {currentStep + 1} of {sections.length}</div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentSection.fields.map(field => (
            <div key={field.key}>
              <label className="text-sm font-medium block mb-1">{field.label}</label>
              <Input
                type={field.type}
                placeholder={field.placeholder}
                value={formData[field.key]}
                onChange={(e) => setFormData({...formData, [field.key]: field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value})}
                min={field.min}
                max={field.max}
                step={field.step}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Comments (Last Step) */}
      {currentStep === sections.length - 1 && (
        <Card>
          <CardHeader>
            <CardTitle>📝 Comments & Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add any additional comments or observations..."
              value={formData.comments}
              onChange={(e) => setFormData({...formData, comments: e.target.value})}
              rows={4}
            />
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-2">
        <Button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          variant="outline"
          className="flex-1"
        >
          ← Previous
        </Button>
        {currentStep < sections.length - 1 ? (
          <Button onClick={() => setCurrentStep(currentStep + 1)} className="flex-1">
            Next →
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting ? 'Submitting...' : `Submit (Score: ${score}%)`}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
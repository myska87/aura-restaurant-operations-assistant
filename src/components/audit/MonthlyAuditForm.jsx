import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function MonthlyAuditForm({ user, onClose }) {
  const [formData, setFormData] = useState({
    equipment_condition: 'good',
    hygiene_rating: 'good',
    health_safety_rating: 'good',
    training_compliance: 'good',
    inventory_labeling: 'good',
    documentation: 'good',
    equipment_notes: '',
    hygiene_notes: '',
    health_safety_notes: '',
    training_notes: '',
    inventory_notes: '',
    documentation_notes: '',
    corrective_actions: '',
    manager_sign_off: false
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const sections = [
    { title: '🧰 Equipment & Maintenance', field: 'equipment_condition', notesField: 'equipment_notes' },
    { title: '🧼 Hygiene & Food Safety', field: 'hygiene_rating', notesField: 'hygiene_notes' },
    { title: '⚕️ Health & Safety Compliance', field: 'health_safety_rating', notesField: 'health_safety_notes' },
    { title: '📚 Staff Training & Certifications', field: 'training_compliance', notesField: 'training_notes' },
    { title: '📦 Inventory & Labelling', field: 'inventory_labeling', notesField: 'inventory_notes' },
    { title: '📄 Documentation & Records', field: 'documentation', notesField: 'documentation_notes' }
  ];

  const calculateScore = () => {
    const scoreMap = { excellent: 100, good: 75, needs_repair: 50 };
    const scores = sections.map(s => scoreMap[formData[s.field]] || 0);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let photoUrl = null;
      if (photoFile) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: photoFile });
        photoUrl = uploadResult.file_url;
      }

      const score = calculateScore();

      const auditData = {
        audit_type: 'monthly_audit',
        audited_by_name: user?.full_name || 'Unknown',
        audited_by_email: user?.email || '',
        verified_by_manager: formData.manager_sign_off,
        audit_date: new Date().toISOString(),
        month_of: format(new Date(), 'yyyy-MM'),
        score: score,
        sections: {
          equipment: { rating: formData.equipment_condition, notes: formData.equipment_notes },
          hygiene: { rating: formData.hygiene_rating, notes: formData.hygiene_notes },
          health_safety: { rating: formData.health_safety_rating, notes: formData.health_safety_notes },
          training: { rating: formData.training_compliance, notes: formData.training_notes },
          inventory: { rating: formData.inventory_labeling, notes: formData.inventory_notes },
          documentation: { rating: formData.documentation, notes: formData.documentation_notes }
        },
        corrective_actions: formData.corrective_actions,
        photo_evidence: photoUrl
      };

      // Generate AI Summary
      const aiSummary = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a brief audit summary (2-3 sentences) based on these scores:
Equipment: ${formData.equipment_condition}
Hygiene: ${formData.hygiene_rating}
Health & Safety: ${formData.health_safety_rating}
Training: ${formData.training_compliance}
Inventory: ${formData.inventory_labeling}
Documentation: ${formData.documentation}
Overall Score: ${score}%
Focus on key strengths and improvement areas.`,
        add_context_from_internet: false
      });

      // Save to MonthlyAudit entity
      const monthlyAuditData = {
        audit_month: format(new Date(), 'yyyy-MM'),
        submitted_by_name: user?.full_name || 'Unknown',
        submitted_by_email: user?.email || '',
        submission_date: new Date().toISOString().split('T')[0],
        financial_summary: {
          total_sales: 0,
          net_margin_percent: 0,
          wastage_value: 0,
          food_cost_ratio: 0
        },
        compliance_hygiene: {
          fsa_hygiene_score: formData.hygiene_rating === 'excellent' ? 100 : formData.hygiene_rating === 'good' ? 75 : 50,
          equipment_health_score: formData.equipment_condition === 'excellent' ? 100 : formData.equipment_condition === 'good' ? 75 : 50,
          temperature_accuracy_percent: 95,
          critical_hygiene_incidents: 0
        },
        team_metrics: {
          staff_retention_percent: 95,
          attendance_rate: 95,
          training_compliance_percent: formData.training_compliance === 'excellent' ? 100 : formData.training_compliance === 'good' ? 75 : 50,
          health_safety_training_percent: formData.health_safety_rating === 'excellent' ? 100 : formData.health_safety_rating === 'good' ? 75 : 50
        },
        customer_metrics: {
          google_review_average: 4.5,
          customer_return_percent: 45,
          nps_score: 50,
          top_complaints: []
        },
        incidents_safety: {
          total_incidents: 0,
          resolved_percent: 100,
          pending_percent: 0,
          corrective_actions: 0
        },
        ai_summary: aiSummary,
        overall_score: score,
        manager_signature: 'Signed',
        owner_verification: formData.manager_sign_off,
        status: 'submitted'
      };

      await base44.entities.MonthlyAudit.create(monthlyAuditData);

      // Update KPI Summary
      try {
        const monthId = format(new Date(), 'yyyy-MM');
        await base44.entities.AuditKPISummary.create({
          period_type: 'monthly',
          period_identifier: monthId,
          audit_score_avg: score,
          equipment_health_score: monthlyAuditData.compliance_hygiene.equipment_health_score,
          hygiene_percent: monthlyAuditData.compliance_hygiene.fsa_hygiene_score,
          staff_score: monthlyAuditData.team_metrics.training_compliance_percent
        });
      } catch (e) {
        console.log('KPI summary update skipped');
      }

      // Also save to AuditLog for backward compatibility
      await base44.entities.AuditLog.create(auditData);
      
      toast.success(`✅ Monthly Audit completed - Score: ${score}%. AI Summary generated.`);
      queryClient.invalidateQueries(['completed-audits']);
      queryClient.invalidateQueries(['monthly-audits']);
      queryClient.invalidateQueries(['audit-kpi-summary']);
      onClose();
    } catch (error) {
      console.error('Error submitting audit:', error);
      toast.error('Failed to submit audit');
    }
    setSubmitting(false);
  };

  const score = calculateScore();
  const scoreColor = score >= 90 ? 'text-emerald-600' : score >= 75 ? 'text-amber-600' : 'text-red-600';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Score Preview */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100">
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600 mb-1">Calculated Audit Score</p>
            <p className={`text-3xl font-bold ${scoreColor}`}>{score}%</p>
          </div>
          <div className="text-right">
            <Badge className={
              score >= 90 ? 'bg-emerald-100 text-emerald-700' :
              score >= 75 ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }>
              {score >= 90 ? '✓ Excellent' : score >= 75 ? '⚠ Good' : '❌ Needs Work'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Audit Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.field}>
            <CardHeader>
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Condition Rating *</label>
                <Select value={formData[section.field]} onValueChange={(value) => setFormData({...formData, [section.field]: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent - Fully compliant, no issues</SelectItem>
                    <SelectItem value="good">Good - Minor issues, generally compliant</SelectItem>
                    <SelectItem value="needs_repair">Needs Repair - Significant issues, action required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Observations & Findings</label>
                <Textarea
                  placeholder="Detailed notes..."
                  value={formData[section.notesField]}
                  onChange={(e) => setFormData({...formData, [section.notesField]: e.target.value})}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Corrective Actions */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Corrective Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="List any corrective actions required, responsibilities, and timelines..."
            value={formData.corrective_actions}
            onChange={(e) => setFormData({...formData, corrective_actions: e.target.value})}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Photo Evidence */}
      <Card>
        <CardHeader>
          <CardTitle>📸 Photo Evidence (optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0])}
            className="w-full"
          />
          {photoFile && <p className="text-sm text-emerald-600 mt-2">✓ {photoFile.name}</p>}
        </CardContent>
      </Card>

      {/* Sign Off */}
      <Card>
        <CardContent className="pt-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.manager_sign_off}
              onChange={(e) => setFormData({...formData, manager_sign_off: e.target.checked})}
              className="w-4 h-4"
            />
            <span className="text-sm">✓ I confirm this audit is complete and accurate</span>
          </label>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={onClose} variant="outline" className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !formData.manager_sign_off}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
        >
          {submitting ? 'Submitting...' : `Complete Audit (${score}%)`}
        </Button>
      </div>
    </motion.div>
  );
}
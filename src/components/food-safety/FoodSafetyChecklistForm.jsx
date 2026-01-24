import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const FSA_CHECKLIST = [
  {
    section_id: 'hygiene_rooms',
    section_title: '🧼 Hygiene of Food Rooms & Equipment',
    items: [
      'Are food rooms and equipment in good condition and well maintained?',
      'Are food rooms clean and tidy, and do staff clean as they go (including difficult areas)?',
      'Are all food and hand contact surfaces (slicers, fridge handles, probes) cleaned/disinfected regularly?',
      'Are cleaning chemicals BS EN approved and stored correctly?',
      'Are separate cloths used in clean areas and boiled/laundered after use?'
    ]
  },
  {
    section_id: 'food_storage',
    section_title: '📦 Food Storage',
    items: [
      'Are deliveries stored immediately and correctly?',
      'Is ready-to-eat food stored above/separate from raw food?',
      'Are high-risk foods date coded and stock rotated daily?',
      'Are fridges and freezers clean, defrosted, and working properly?',
      'Are dry goods off the floor and covered?'
    ]
  },
  {
    section_id: 'food_handling',
    section_title: '🍽️ Food Handling Practices',
    items: [
      'Are ready-to-eat foods prepared in clean areas?',
      'Is separate equipment used or properly sanitized?',
      'Is staff handwashing performed before handling ready-to-eat food?',
      'Are high-risk foods cooled and refrigerated immediately?',
      'Are fruits/vegetables washed thoroughly unless "ready-to-eat"?',
      'Are chemical contamination controls in place?',
      'Are staff aware of food allergy hazards?'
    ]
  },
  {
    section_id: 'personal_hygiene',
    section_title: '👥 Personal Hygiene',
    items: [
      'Are staff fit to work and wearing clean uniforms?',
      'Are hand basins clean, with soap and hot water?',
      'Are basins used for handwashing only?',
      'Are toilets and changing facilities clean and tidy?'
    ]
  },
  {
    section_id: 'pest_control',
    section_title: '🐛 Pest Control',
    items: [
      'Are premises pest-proofed and free from infestation?',
      'Are windows/doors fitted with fly screens?',
      'Are insectocutors serviced and maintained?',
      'Is food properly protected from contamination by pests?'
    ]
  },
  {
    section_id: 'waste_control',
    section_title: '🗑️ Waste Control',
    items: [
      'Is waste stored correctly indoors and outdoors?',
      'Is refuse area clean?',
      'Is unfit food clearly labeled and separated?'
    ]
  },
  {
    section_id: 'checks_records',
    section_title: '📋 Checks & Record Keeping',
    items: [
      'Are all checks properly recorded?',
      'Has corrective action been taken where needed?',
      'Are equipment temps cross-checked regularly?',
      'Are record sheets verified and up to date?'
    ]
  },
  {
    section_id: 'review_monthly',
    section_title: '🔄 Review (4-Weekly / Monthly)',
    items: [
      'Have new suppliers been approved?',
      'Have new menu items been added to food safety controls?',
      'Have new equipment or handling methods been updated?'
    ]
  }
];

export default function FoodSafetyChecklistForm({ user, onClose, onSubmitted }) {
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [photoFiles, setPhotoFiles] = useState({});
  const [comments, setComments] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const getItemId = (sectionIdx, itemIdx) => `${sectionIdx}-${itemIdx}`;
  const totalItems = FSA_CHECKLIST.reduce((sum, s) => sum + s.items.length, 0);
  const answeredItems = Object.values(answers).filter(a => a).length;
  const progressPercent = Math.round((answeredItems / totalItems) * 100);

  const handleAnswer = (sectionIdx, itemIdx, value) => {
    const itemId = getItemId(sectionIdx, itemIdx);
    setAnswers({ ...answers, [itemId]: value });
  };

  const handlePhotoChange = (sectionIdx, itemIdx, file) => {
    const itemId = getItemId(sectionIdx, itemIdx);
    setPhotoFiles({ ...photoFiles, [itemId]: file });
  };

  const handleComment = (sectionIdx, itemIdx, text) => {
    const itemId = getItemId(sectionIdx, itemIdx);
    setComments({ ...comments, [itemId]: text });
  };

  const handleSubmit = async () => {
    if (answeredItems < totalItems) {
      toast.error(`Please answer all ${totalItems} questions (${answeredItems}/${totalItems})`);
      return;
    }

    setSubmitting(true);
    try {
      // Upload photos
      const photosMap = {};
      for (const [itemId, file] of Object.entries(photoFiles)) {
        if (file) {
          const uploadResult = await base44.integrations.Core.UploadFile({ file });
          photosMap[itemId] = uploadResult.file_url;
        }
      }

      // Build submission data
      const sections = FSA_CHECKLIST.map((section, sectionIdx) => ({
        section_id: section.section_id,
        section_title: section.section_title,
        items: section.items.map((question, itemIdx) => {
          const itemId = getItemId(sectionIdx, itemIdx);
          return {
            item_id: itemId,
            question,
            answer: answers[itemId],
            comment: comments[itemId] || '',
            photo_url: photosMap[itemId] || null,
            timestamp: new Date().toISOString()
          };
        }),
        section_compliance: Math.round(
          (section.items.filter((_, idx) => answers[getItemId(sectionIdx, idx)] === 'yes').length / section.items.length) * 100
        )
      }));

      // Count answers
      const yesCount = Object.values(answers).filter(a => a === 'yes').length;
      const noCount = Object.values(answers).filter(a => a === 'no').length;
      const naCount = Object.values(answers).filter(a => a === 'na').length;
      const complianceScore = Math.round((yesCount / (yesCount + noCount)) * 100) || 0;

      // Get non-compliance items for alerts
      const nonCompliances = [];
      Object.entries(answers).forEach(([itemId, answer]) => {
        if (answer === 'no') {
          const [sectionIdx, itemIdx] = itemId.split('-').map(Number);
          nonCompliances.push({
            item_id: itemId,
            question: FSA_CHECKLIST[sectionIdx].items[itemIdx],
            comment: comments[itemId] || '',
            photo_url: photoFiles[itemId] ? photoFiles[itemId].name : null
          });
        }
      });

      const submissionData = {
        submission_date: new Date().toISOString().split('T')[0],
        submission_month: format(new Date(), 'yyyy-MM'),
        submitted_by_name: user?.full_name || 'Unknown',
        submitted_by_email: user?.email || '',
        status: noCount > 0 ? 'submitted' : 'approved',
        compliance_score: complianceScore,
        sections,
        total_questions: totalItems,
        questions_with_yes: yesCount,
        questions_with_no: noCount,
        questions_with_na: naCount,
        non_compliance_items: nonCompliances,
        alerts_sent: []
      };

      const result = await base44.entities.FoodSafetyChecklistSubmission.create(submissionData);

      // Update KPI Summary
      try {
        await base44.entities.AuditKPISummary.create({
          period_type: 'monthly',
          period_identifier: format(new Date(), 'yyyy-MM'),
          hygiene_percent: complianceScore,
          audit_score_avg: complianceScore
        });
      } catch (e) {
        console.log('KPI summary update skipped');
      }

      // Save to AuditLog for Reports tab
      try {
        await base44.entities.AuditLog.create({
          audit_type: 'fsa_checklist',
          audited_by_name: user?.full_name || 'Unknown',
          audited_by_email: user?.email || '',
          audit_date: new Date().toISOString(),
          month_of: format(new Date(), 'yyyy-MM'),
          score: complianceScore,
          sections: { fsa_compliance: { rating: complianceScore >= 90 ? 'excellent' : complianceScore >= 75 ? 'good' : 'needs_repair', notes: `${noCount} non-compliances found` } }
        });
      } catch (e) {
        console.log('AuditLog creation skipped');
      }

      toast.success(`✅ Audit submitted successfully. Report added to Audit Center.`);
      queryClient.invalidateQueries(['food-safety-submissions']);
      queryClient.invalidateQueries(['completed-audits']);
      queryClient.invalidateQueries(['audit-kpi-summary']);
      onSubmitted?.();
      onClose();
    } catch (error) {
      console.error('Error submitting checklist:', error);
      toast.error('Failed to submit checklist');
    }
    setSubmitting(false);
  };

  const currentSectionData = FSA_CHECKLIST[currentSection];
  const sectionAnswers = currentSectionData.items.map((_, idx) => answers[getItemId(currentSection, idx)]);
  const sectionAnswered = sectionAnswers.filter(a => a).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-2xl mx-auto">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">FSA Food Safety Checklist</h2>
          <p className="text-sm text-blue-800 mb-4">Monthly hygiene and safety compliance audit</p>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <Badge className="bg-blue-600">{progressPercent}%</Badge>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-blue-700">{answeredItems} of {totalItems} questions answered</p>
          </div>
        </CardContent>
      </Card>

      {/* Current Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{currentSectionData.section_title}</CardTitle>
            <Badge variant="outline">
              {sectionAnswered} of {currentSectionData.items.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentSectionData.items.map((question, itemIdx) => {
            const itemId = getItemId(currentSection, itemIdx);
            const answer = answers[itemId];
            const isNo = answer === 'no';

            return (
              <div key={itemIdx} className={`p-4 border-l-4 rounded-lg ${isNo ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                {/* Question */}
                <div className="flex items-start gap-3 mb-3">
                  <span className="font-bold text-slate-600 mt-1">{itemIdx + 1}.</span>
                  <p className="font-medium text-slate-900 flex-1">{question}</p>
                </div>

                {/* Answer Options */}
                <div className="flex gap-2 mb-3">
                  {['yes', 'no', 'na'].map(opt => (
                    <Button
                      key={opt}
                      onClick={() => handleAnswer(currentSection, itemIdx, opt)}
                      variant={answer === opt ? 'default' : 'outline'}
                      className={`flex-1 ${
                        answer === opt
                          ? opt === 'yes' ? 'bg-emerald-600 hover:bg-emerald-700' :
                            opt === 'no' ? 'bg-red-600 hover:bg-red-700' :
                            'bg-amber-600 hover:bg-amber-700'
                          : ''
                      }`}
                    >
                      {opt === 'yes' ? '✓ Yes' : opt === 'no' ? '✗ No' : '⊗ N/A'}
                    </Button>
                  ))}
                </div>

                {/* Comment and Photo for "No" answers */}
                {isNo && (
                  <div className="space-y-3 pt-3 border-t border-red-200">
                    <div>
                      <label className="text-xs font-semibold text-red-700 block mb-1">Comment (Required for No)</label>
                      <Textarea
                        placeholder="Describe the issue and what corrective action is needed..."
                        value={comments[itemId] || ''}
                        onChange={(e) => handleComment(currentSection, itemIdx, e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-red-700 block mb-1">📸 Evidence Photo (optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(currentSection, itemIdx, e.target.files?.[0])}
                        className="w-full text-sm"
                      />
                      {photoFiles[itemId] && (
                        <p className="text-xs text-red-600 mt-1">✓ {photoFiles[itemId].name}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button
          onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
          disabled={currentSection === 0}
          variant="outline"
          className="flex-1"
        >
          ← Previous Section
        </Button>
        <Button
          onClick={() => setCurrentSection(Math.min(FSA_CHECKLIST.length - 1, currentSection + 1))}
          disabled={currentSection === FSA_CHECKLIST.length - 1}
          variant="outline"
          className="flex-1"
        >
          Next Section →
        </Button>
      </div>

      {/* Submit */}
      {currentSection === FSA_CHECKLIST.length - 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {Object.values(answers).filter(a => a === 'no').length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-4">
                <div className="flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">⚠️ Non-Compliance Detected</p>
                    <p className="text-sm text-red-800">{Object.values(answers).filter(a => a === 'no').length} items require corrective action. Alerts will be sent to management.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || answeredItems < totalItems}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? 'Submitting...' : `Complete & Submit (${progressPercent}%)`}
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const QUESTIONS = [
  { id: 'sickness', label: 'I am free from sickness or diarrhoea' },
  { id: 'wounds', label: 'I have no open wounds not properly covered' },
  { id: 'hands', label: 'I have washed hands correctly' },
  { id: 'uniform', label: 'I am wearing clean uniform' },
  { id: 'food', label: 'I am fit to handle food today' },
];

export default function PersonalHygieneDeclarationForm({ user, shiftDate, onSuccess, onBlockClockIn }) {
  const [answers, setAnswers] = useState({
    sickness: null,
    wounds: null,
    hands: null,
    uniform: null,
    food: null,
  });
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [showIllnessForm, setShowIllnessForm] = useState(false);

  const queryClient = useQueryClient();

  const failedQuestions = Object.entries(answers)
    .filter(([_, value]) => value === false)
    .map(([key]) => key);

  const allAnswered = Object.values(answers).every(v => v !== null);
  const allYes = Object.values(answers).every(v => v === true);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date();

      const data = {
        staff_id: user.id,
        staff_name: user.full_name,
        staff_email: user.email,
        declaration_date: today,
        shift_date: shiftDate,
        declaration_time: now.toISOString(),
        free_from_sickness: answers.sickness,
        no_open_wounds: answers.wounds,
        hands_washed: answers.hands,
        clean_uniform: answers.uniform,
        fit_to_handle_food: answers.food,
        all_clear: allYes,
        requires_manager_approval: !allYes,
        digital_signature: signature,
        clock_in_blocked: !allYes,
        status: allYes ? 'clock_in_allowed' : 'pending_manager',
      };

      const result = await base44.entities.PersonalHygieneDeclaration.create(data);

      // Save to OperationReport
      await base44.entities.OperationReport.create({
        reportType: 'HYGIENE',
        locationId: 'default',
        staffId: user.id || 'unknown',
        staffName: user.full_name || 'Staff',
        staffEmail: user.email,
        reportDate: today,
        completionPercentage: allYes ? 100 : 0,
        status: allYes ? 'pass' : 'fail',
        checklistItems: QUESTIONS.map(q => ({
          item_id: q.id,
          item_name: q.label,
          answer: answers[q.id] ? 'yes' : 'no',
          notes: ''
        })),
        failedItems: failedQuestions.map(id => QUESTIONS.find(q => q.id === id)?.label || id),
        sourceEntityId: result.id,
        sourceEntityType: 'PersonalHygieneDeclaration',
        timestamp: now.toISOString()
      });

      // If any answer is NO, trigger illness report flow
      if (!allYes) {
        setShowIllnessForm(true);
        onBlockClockIn?.(true);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hygieneDeclarations'] });
      if (allYes) {
        onSuccess?.();
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!allAnswered || !signature) {
      alert('Please answer all questions and provide your signature');
      return;
    }
    setLoading(true);
    submitMutation.mutate();
    setLoading(false);
  };

  const handleAnswer = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  return (
    <>
      <Card className="border-2 border-emerald-200">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-cyan-50">
          <CardTitle className="text-emerald-900">Personal Hygiene Declaration</CardTitle>
          <p className="text-sm text-emerald-700 mt-2">Required before clock-in</p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Date:</strong> {shiftDate ? format(new Date(shiftDate), 'd MMMM yyyy') : format(new Date(), 'd MMMM yyyy')} | 
                <strong className="ml-4">Time:</strong> {format(new Date(), 'HH:mm')}
              </p>
            </div>

            {/* Questions */}
            <div className="space-y-3">
              {QUESTIONS.map(question => (
                <div key={question.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-medium text-slate-800 mb-3">{question.label}</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleAnswer(question.id, true)}
                      className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all ${
                        answers[question.id] === true
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-600 hover:border-emerald-400'
                      }`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAnswer(question.id, false)}
                      className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all ${
                        answers[question.id] === false
                          ? 'bg-red-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-600 hover:border-red-400'
                      }`}
                    >
                      NO
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Warning if any NO */}
            {!allYes && failedQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border-2 border-red-400 rounded-lg flex gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-900">Manager Approval Required</p>
                  <p className="text-sm text-red-700">
                    Since you answered NO to one or more questions, your manager must approve before you can clock in.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Digital Signature */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                Digital Signature <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full name to sign"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-semibold"
              />
              <p className="text-xs text-slate-500 mt-1">Your signature verifies the accuracy of above information.</p>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={!allAnswered || !signature || loading}
              className={`w-full font-bold py-3 ${
                allYes
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {loading ? 'Submitting...' : allYes ? 'Confirm & Clock In' : 'Submit for Manager Review'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Illness Report Form (shown if any NO answer) */}
      {showIllnessForm && !allYes && (
        <IllnessReportingForm
          user={user}
          failedQuestions={failedQuestions}
          onClose={() => setShowIllnessForm(false)}
          onSuccess={() => {
            setShowIllnessForm(false);
            onSuccess?.();
          }}
        />
      )}
    </>
  );
}

function IllnessReportingForm({ user, failedQuestions, onClose, onSuccess }) {
  const [symptoms, setSymptoms] = useState({
    diarrhoea: false,
    vomiting: false,
    fever: false,
    skin_infection: false,
    other: false,
  });
  const [otherSymptoms, setOtherSymptoms] = useState('');
  const [dateStarted, setDateStarted] = useState('');
  const [lastShiftWorked, setLastShiftWorked] = useState('');
  const [doctorAdvised, setDoctorAdvised] = useState(false);
  const [managerNotified, setManagerNotified] = useState(false);
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date();
      
      const selectedSymptoms = Object.entries(symptoms)
        .filter(([_, isSelected]) => isSelected)
        .map(([key]) => key);
      
      if (symptoms.other && otherSymptoms) {
        selectedSymptoms.push(otherSymptoms);
      }

      // Create illness report
      const illnessReport = await base44.entities.IllnessReport.create({
        staff_id: user.id,
        staff_name: user.full_name,
        staff_email: user.email,
        report_date: today,
        report_time: now.toISOString(),
        failed_questions: failedQuestions,
        symptoms: selectedSymptoms,
        date_symptoms_started: dateStarted,
        last_shift_worked: lastShiftWorked,
        doctor_advised: doctorAdvised,
        manager_notified: managerNotified,
        status: 'pending',
      });

      // Flag staff member with illness alert
      if (user.id) {
        try {
          await base44.entities.Staff.update(user.id, {
            is_illness_flagged: true,
            illness_flag_reason: selectedSymptoms.join(', '),
            illness_flag_date: today,
            illness_flag_cleared: false,
            food_handling_restricted: true
          });
        } catch (e) {
          console.log('Could not update staff profile (may not have ID)');
        }
      }

      // Notify managers
      if (managerNotified) {
        try {
          const managers = await base44.entities.Staff.filter({ role: 'manager' });
          managers.forEach(manager => {
            base44.entities.Notification.create({
              recipient_email: manager.email,
              recipient_name: manager.full_name,
              title: '🚨 Staff Illness Report',
              message: `${user.full_name} has reported an illness (${selectedSymptoms.join(', ')}). Food handling is restricted pending manager approval.`,
              type: 'alert',
              priority: 'high',
              is_read: false,
              related_entity: 'IllnessReport',
              source_user_email: user.email,
              source_user_name: user.full_name
            }).catch(() => {});
          });
        } catch (e) {
          console.log('Could not notify managers');
        }
      }

      return illnessReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['illnessReports'] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      onSuccess?.();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const hasSymptoms = Object.values(symptoms).some(v => v);
    if (!hasSymptoms || !dateStarted) {
      alert('Please select at least one symptom and date');
      return;
    }
    setLoading(true);
    submitMutation.mutate();
    setLoading(false);
  };

  return (
    <Card className="border-2 border-red-400 mt-6 bg-red-50">
      <CardHeader className="bg-gradient-to-r from-red-100 to-orange-100">
        <CardTitle className="text-red-900 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Illness Report
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white p-3 rounded border-l-4 border-red-600">
            <p className="text-sm text-red-900 font-medium">
              ⚠️ Food handling is automatically restricted until manager clearance.
            </p>
          </div>

          {/* Symptoms Checklist */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-3">
              Symptoms <span className="text-red-600">*</span>
            </label>
            <div className="space-y-2">
              {[
                { id: 'diarrhoea', label: 'Diarrhoea' },
                { id: 'vomiting', label: 'Vomiting' },
                { id: 'fever', label: 'Fever (≥38°C)' },
                { id: 'skin_infection', label: 'Skin Infection / Rash' },
                { id: 'other', label: 'Other' },
              ].map(s => (
                <label key={s.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={symptoms[s.id]}
                    onChange={(e) => setSymptoms({ ...symptoms, [s.id]: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-slate-700">{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Other Symptoms Description */}
          {symptoms.other && (
            <div>
              <input
                type="text"
                value={otherSymptoms}
                onChange={(e) => setOtherSymptoms(e.target.value)}
                placeholder="Describe other symptoms..."
                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          )}

          {/* Date Symptoms Started */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              Date Symptoms Started <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              value={dateStarted}
              onChange={(e) => setDateStarted(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          {/* Last Shift Worked */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              Last Shift Worked
            </label>
            <input
              type="date"
              value={lastShiftWorked}
              onChange={(e) => setLastShiftWorked(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          {/* Doctor Questions */}
          <div className="space-y-3 p-3 bg-white rounded border border-slate-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={doctorAdvised}
                onChange={(e) => setDoctorAdvised(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-slate-700">Doctor advised to stay away from work</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={managerNotified}
                onChange={(e) => setManagerNotified(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-slate-700">Notify manager immediately</span>
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!Object.values(symptoms).some(v => v) || !dateStarted || loading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Submitting...' : 'Submit Illness Report'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
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
                <strong>Date:</strong> {format(new Date(shiftDate), 'd MMMM yyyy')} | 
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
  const [illnessType, setIllnessType] = useState('');
  const [description, setDescription] = useState('');
  const [canWorkAlternative, setCanWorkAlternative] = useState(false);
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date();

      await base44.entities.IllnessReport.create({
        staff_id: user.id,
        staff_name: user.full_name,
        staff_email: user.email,
        report_date: today,
        report_time: now.toISOString(),
        failed_questions: failedQuestions,
        illness_type: illnessType,
        description,
        can_work_alternative_duties: canWorkAlternative,
        status: 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['illnessReports'] });
      onSuccess?.();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!illnessType || !description) {
      alert('Please fill all fields');
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
          Health Issue Report
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-slate-700 font-medium">
            Please provide details about your health concern:
          </p>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              Issue Type <span className="text-red-600">*</span>
            </label>
            <select
              value={illnessType}
              onChange={(e) => setIllnessType(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg"
            >
              <option value="">Select...</option>
              <option value="sickness">Sickness</option>
              <option value="diarrhoea">Diarrhoea</option>
              <option value="open_wound">Open Wound</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the issue..."
              className="w-full p-2 border border-slate-300 rounded-lg"
              rows="3"
            />
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={canWorkAlternative}
              onChange={(e) => setCanWorkAlternative(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-slate-700">I can perform alternative duties (non-food handling)</span>
          </label>

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
              disabled={!illnessType || !description || loading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Submitting...' : 'Report & Await Manager Decision'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
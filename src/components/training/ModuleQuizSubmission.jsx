import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function ModuleQuizSubmission({ 
  moduleId, 
  moduleName,
  questions, 
  userAnswers,
  user,
  journeyProgress,
  onQuizPassed,
  disabled = false 
}) {
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const queryClient = useQueryClient();

  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      let correct = 0;
      const answers = questions.map((q, idx) => {
        const selected = userAnswers[idx];
        const isCorrect = selected === q.correct;
        if (isCorrect) correct++;
        return {
          question_id: idx,
          question_text: q.question,
          selected_answer: selected,
          correct_answer: q.correct,
          is_correct: isCorrect
        };
      });

      const score = (correct / questions.length) * 100;
      const passed = score >= 80;

      // Create quiz attempt
      const attempt = await base44.entities.TrainingQuizAttempt.create({
        staff_id: user.id,
        staff_email: user.email,
        module_id: moduleId,
        module_name: moduleName,
        attempt_number: 1,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        total_questions: questions.length,
        correct_answers: correct,
        score: score,
        passed: passed,
        answers: answers
      });

      // Log attempt
      await base44.entities.TrainingAuditLog.create({
        staff_id: user.id,
        staff_email: user.email,
        action: passed ? 'quiz_passed' : 'quiz_failed',
        module_id: moduleId,
        module_name: moduleName,
        quiz_attempt_id: attempt.id,
        details: { score, correct, total: questions.length },
        performed_by_email: user.email,
        timestamp: new Date().toISOString()
      });

      if (passed && journeyProgress) {
        // CRITICAL: Update GLOBAL state to unlock "Next Module" button
        const moduleStatuses = { ...journeyProgress.moduleStatuses };
        moduleStatuses[moduleId] = 'quiz_passed';
        
        await base44.entities.TrainingJourneyProgress.update(journeyProgress.id, {
          moduleStatuses,
          lastUpdated: new Date().toISOString()
        });
      }

      return { passed, score, correct, total: questions.length };
    },
    onSuccess: (data) => {
      setResult(data);
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['trainingJourney'] });
      if (data.passed && onQuizPassed) {
        onQuizPassed();
      }
    }
  });

  const handleSubmit = () => {
    if (Object.keys(userAnswers).length < questions.length) {
      alert('Please answer all questions before submitting');
      return;
    }
    submitQuizMutation.mutate();
  };

  if (submitted && result) {
    return (
      <Card className={result.passed ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {result.passed ? (
              <CheckCircle className="w-8 h-8 text-emerald-600 flex-shrink-0 mt-1" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
            )}
            <div className="flex-1">
              <h3 className={`text-xl font-bold mb-2 ${result.passed ? 'text-emerald-900' : 'text-red-900'}`}>
                {result.passed ? '🎉 Quiz Passed!' : '❌ Quiz Failed'}
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <Badge className={result.passed ? 'bg-emerald-600' : 'bg-red-600'} variant="default">
                  {result.score.toFixed(0)}%
                </Badge>
                <p className={result.passed ? 'text-emerald-800' : 'text-red-800'}>
                  {result.correct} of {result.total} correct
                </p>
              </div>
              {result.passed ? (
                <p className="text-emerald-800">
                  Great! You've passed the quiz. Click the "Next Module" button to continue.
                </p>
              ) : (
                <p className="text-red-800">
                  You need 80% to pass. Review the material and try again.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Button
      onClick={handleSubmit}
      disabled={disabled || submitQuizMutation.isPending || Object.keys(userAnswers).length < questions.length}
      size="lg"
      className="w-full bg-blue-600 hover:bg-blue-700"
    >
      {submitQuizMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
    </Button>
  );
}
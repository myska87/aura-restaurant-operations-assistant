import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  CheckCircle, XCircle, AlertTriangle, FileText, Printer, Download,
  ChevronRight, Shield, Award, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TrainingModuleQuiz from '@/components/training/TrainingModuleQuiz';
import TrainingJourneyBar from '@/components/training/TrainingJourneyBar';

const hygieneQuizQuestions = [
  {
    question: 'What is the main objective of food safety checks and record keeping?',
    options: [
      'To ensure food safety compliance and prevent contamination',
      'To complete paperwork only',
      'To waste time',
      'None of the above'
    ],
    correct: 0
  },
  {
    question: 'Why is proper food storage important?',
    options: [
      'To prevent cross-contamination between raw and ready-to-eat foods',
      'To make storage look neat',
      'To save space',
      'To reduce costs only'
    ],
    correct: 0
  },
  {
    question: 'What should be checked regarding equipment and food rooms?',
    options: [
      'Cleanliness, maintenance, and proper functionality',
      'Just the appearance',
      'Nothing specific',
      'Only once a month'
    ],
    correct: 0
  },
  {
    question: 'How should staff handle ready-to-eat foods?',
    options: [
      'In separate clean areas using separate utensils',
      'The same way as raw food',
      'With bare hands for speed',
      'Without any special precautions'
    ],
    correct: 0
  },
  {
    question: 'What is essential for personal hygiene in food areas?',
    options: [
      'Clean clothing, handwashing, and fitness to work',
      'Just wearing a uniform',
      'Eating near food areas',
      'No specific requirements'
    ],
    correct: 0
  }
];

const checklistSections = {
  hygiene_equipment: {
    title: 'Hygiene of Food Rooms & Equipment',
    icon: Shield,
    questions: [
      'Food rooms and equipment in good condition and well maintained',
      'Food rooms clean and tidy; staff clean as they go (including difficult areas)',
      'Equipment easy to clean and kept clean',
      'Food & hand contact surfaces cleaned and disinfected regularly',
      'Approved BS EN cleaning chemicals available, stored correctly, used properly',
      'Separate cleaning cloths used; re-used cloths boil-washed'
    ]
  },
  food_storage: {
    title: 'Food Storage',
    icon: FileText,
    questions: [
      'Deliveries stored appropriately immediately',
      'Ready-to-eat food stored above/separate from raw food',
      'Food in fridges/freezers covered',
      'High-risk foods date-coded, checked daily, rotated',
      'Dry goods stored correctly (off floor, covered)',
      'Outer packaging removed before entering clean area',
      'Freezers working properly',
      'Fridges/freezers defrosted regularly'
    ]
  },
  food_handling: {
    title: 'Food Handling Practices',
    icon: Award,
    questions: [
      'Ready-to-eat foods prepared in separate clean areas',
      'Separate utensils/equipment used or disinfected in dishwasher',
      'Wrapping & packaging kept in clean area',
      'Controls followed for staff clothing & handwashing',
      'Separate complex equipment for ready-to-eat food',
      'Minimal hand contact (tongs used)',
      'Colour-coded equipment used correctly',
      'High-risk foods prepared in small batches',
      'Food cooled quickly and safely',
      'Produce washed thoroughly unless ready-to-eat',
      'Ready-to-eat foods separated and screened on display',
      'Clean utensils for self-service',
      'Frozen food defrosted safely',
      'Controls to prevent chemical/foreign body contamination',
      'Staff aware of food allergy hazards',
      'Handwashing after raw food and before touching surfaces',
      'Separate probe thermometer used and disinfected'
    ]
  },
  personal_hygiene: {
    title: 'Personal Hygiene',
    icon: Shield,
    questions: [
      'Staff fit to work, clean clothing, following hygiene rules',
      'Handwash basins clean, hot water, soap, drying facilities',
      'Handwash basins used only for handwashing',
      'Toilets and changing facilities clean'
    ]
  },
  pest_control: {
    title: 'Pest Control',
    icon: AlertTriangle,
    questions: [
      'Premises pest-proofed, no signs of pests',
      'Fly screens fitted where needed',
      'Insectocutors maintained',
      'Food protected from pest contamination'
    ]
  },
  waste_control: {
    title: 'Waste Control',
    icon: FileText,
    questions: [
      'Waste stored correctly in food rooms',
      'External waste stored correctly; refuse area clean',
      'Unfit food clearly labelled and stored separately'
    ]
  },
  checks_records: {
    title: 'Checks & Record Keeping',
    icon: FileText,
    questions: [
      'Checks taken and recorded',
      'Corrective actions taken',
      'Records up-to-date, checked, verified',
      'Time/temperature checks cross-checked'
    ]
  },
  review_4week: {
    title: '4-Weekly Review',
    icon: Calendar,
    questions: [
      'New suppliers approved list updated',
      'New menu items updated',
      'New food handling methods/equipment updated'
    ]
  }
};

export default function FoodSafetyChecklist() {
  const [user, setUser] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [frequency, setFrequency] = useState('weekly');
  const [answers, setAnswers] = useState({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [signature, setSignature] = useState('');
  const [quizPassed, setQuizPassed] = useState(false);
  const [journeyProgress, setJourneyProgress] = useState(null);

  const queryClient = useQueryClient();
  const sectionKeys = Object.keys(checklistSections);
  const currentSectionKey = sectionKeys[currentSection];
  const currentSectionData = checklistSections[currentSectionKey];
  const totalQuestions = Object.values(checklistSections).reduce((sum, s) => sum + s.questions.length, 0);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: journeyProgressData } = useQuery({
    queryKey: ['trainingJourney', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const existing = await base44.entities.TrainingJourneyProgress.filter({
        staff_email: user.email
      });
      if (existing.length > 0) {
        setJourneyProgress(existing[0]);
        return existing[0];
      }
      return null;
    },
    enabled: !!user?.email
  });

  const { data: recentChecklists = [] } = useQuery({
    queryKey: ['foodSafetyChecklists'],
    queryFn: () => base44.entities.FoodSafetyChecklist.list('-inspection_date', 10)
  });

  const submitChecklistMutation = useMutation({
    mutationFn: (data) => base44.entities.FoodSafetyChecklist.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['foodSafetyChecklists']);
      // Reset form
      setAnswers({});
      setCurrentSection(0);
      setSignature('');
      setShowSubmitDialog(false);
    }
  });

  const handleAnswer = (sectionKey, questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [`${sectionKey}_${questionIndex}`]: { answer, action: prev[`${sectionKey}_${questionIndex}`]?.action || '' }
    }));
  };

  const handleAction = (sectionKey, questionIndex, action) => {
    setAnswers(prev => ({
      ...prev,
      [`${sectionKey}_${questionIndex}`]: { ...prev[`${sectionKey}_${questionIndex}`], action }
    }));
  };

  const getAnsweredCount = () => {
    return Object.values(answers).filter(a => a.answer).length;
  };

  const getCriticalIssues = () => {
    return Object.values(answers).filter(a => a.answer === 'no').length;
  };

  const canProceed = () => {
    const currentQuestions = currentSectionData.questions;
    return currentQuestions.every((_, idx) => {
      const key = `${currentSectionKey}_${idx}`;
      const answer = answers[key];
      if (!answer?.answer) return false;
      if (answer.answer === 'no' && !answer.action?.trim()) return false;
      return true;
    });
  };

  const handleNext = () => {
    if (currentSection < sectionKeys.length - 1) {
      setCurrentSection(prev => prev + 1);
    } else {
      setShowSubmitDialog(true);
    }
  };

  const handleSubmit = async () => {
    if (!signature.trim()) {
      alert('Please sign the form');
      return;
    }

    const formattedData = {};
    sectionKeys.forEach(sectionKey => {
      formattedData[sectionKey] = checklistSections[sectionKey].questions.map((question, idx) => {
        const answer = answers[`${sectionKey}_${idx}`];
        return {
          question,
          answer: answer?.answer || 'no',
          action_taken: answer?.action || ''
        };
      });
    });

    const checklistData = {
      inspection_date: format(new Date(), 'yyyy-MM-dd'),
      frequency,
      inspector_email: user.email,
      inspector_name: user.full_name || user.email,
      inspector_position: user.role || 'Staff',
      ...formattedData,
      digital_signature: signature,
      critical_issues_count: getCriticalIssues(),
      completion_percentage: 100,
      status: 'submitted'
    };

    submitChecklistMutation.mutate(checklistData);
  };

  const progressPercentage = (getAnsweredCount() / totalQuestions) * 100;

  if (!user) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {journeyProgress && (
        <TrainingJourneyBar progress={journeyProgress} compact />
      )}

      <PageHeader
        title="Food Safety Inspection Checklist"
        description="UK Food Safety Standards Compliance"
      />

      {/* Progress Overview */}
      <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-emerald-100 text-sm mb-1">Inspection Progress</p>
              <p className="text-3xl font-bold">{Math.round(progressPercentage)}%</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-100 text-sm mb-1">Questions Answered</p>
              <p className="text-2xl font-bold">{getAnsweredCount()} / {totalQuestions}</p>
            </div>
          </div>
          <Progress value={progressPercentage} className="bg-emerald-800" />
          {getCriticalIssues() > 0 && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <p className="font-semibold">{getCriticalIssues()} Critical Issue(s) Identified</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Frequency Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection Frequency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {['weekly', 'fortnightly', 'monthly'].map(freq => (
              <Button
                key={freq}
                variant={frequency === freq ? 'default' : 'outline'}
                onClick={() => setFrequency(freq)}
                className={frequency === freq ? 'bg-emerald-600' : ''}
              >
                {freq.charAt(0).toUpperCase() + freq.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sectionKeys.map((key, idx) => {
          const section = checklistSections[key];
          const isCompleted = section.questions.every((_, qIdx) => answers[`${key}_${qIdx}`]?.answer);
          const isCurrent = idx === currentSection;
          
          return (
            <Button
              key={key}
              variant={isCurrent ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentSection(idx)}
              className={`flex-shrink-0 ${isCurrent ? 'bg-emerald-600' : ''}`}
            >
              {isCompleted && <CheckCircle className="w-3 h-3 mr-2" />}
              {idx + 1}. {section.title}
            </Button>
          );
        })}
      </div>

      {/* Current Section */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <currentSectionData.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle>{currentSectionData.title}</CardTitle>
                  <p className="text-sm text-slate-500">Section {currentSection + 1} of {sectionKeys.length}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentSectionData.questions.map((question, idx) => {
                const answerKey = `${currentSectionKey}_${idx}`;
                const answer = answers[answerKey];
                const needsAction = answer?.answer === 'no';

                return (
                  <div key={idx} className={`p-4 rounded-xl border-2 ${
                    needsAction ? 'bg-red-50 border-red-300' : 
                    answer?.answer === 'yes' ? 'bg-emerald-50 border-emerald-300' : 
                    'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-semibold text-slate-800 flex-1">
                        {idx + 1}. {question}
                      </p>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant={answer?.answer === 'yes' ? 'default' : 'outline'}
                          onClick={() => handleAnswer(currentSectionKey, idx, 'yes')}
                          className={answer?.answer === 'yes' ? 'bg-emerald-600' : ''}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Yes
                        </Button>
                        <Button
                          size="sm"
                          variant={answer?.answer === 'no' ? 'default' : 'outline'}
                          onClick={() => handleAnswer(currentSectionKey, idx, 'no')}
                          className={answer?.answer === 'no' ? 'bg-red-600' : ''}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          No
                        </Button>
                      </div>
                    </div>
                    
                    {needsAction && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-3 border-t border-red-200"
                      >
                        <label className="text-sm font-semibold text-red-700 mb-2 block">
                          ⚠️ Corrective Action Required *
                        </label>
                        <Textarea
                          placeholder="Describe the action taken to resolve this issue..."
                          value={answer?.action || ''}
                          onChange={(e) => handleAction(currentSectionKey, idx, e.target.value)}
                          className="border-red-300"
                          rows={3}
                        />
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentSection(prev => Math.max(0, prev - 1))}
          disabled={currentSection === 0}
        >
          Previous Section
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          className="bg-emerald-600"
        >
          {currentSection === sectionKeys.length - 1 ? 'Review & Submit' : 'Next Section'}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Recent Checklists */}
      {recentChecklists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentChecklists.map(checklist => (
                <div key={checklist.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{checklist.inspector_name}</p>
                    <p className="text-sm text-slate-600">
                      {format(new Date(checklist.inspection_date), 'PPP')} • {checklist.frequency}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {checklist.critical_issues_count > 0 && (
                      <Badge className="bg-red-600">
                        {checklist.critical_issues_count} issue(s)
                      </Badge>
                    )}
                    <Badge className={
                      checklist.status === 'submitted' ? 'bg-emerald-600' :
                      checklist.status === 'reviewed' ? 'bg-blue-600' :
                      'bg-amber-600'
                    }>
                      {checklist.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hygiene & Safety Quiz */}
      {journeyProgress && journeyProgress.currentStep === 'hygiene' && (
        <div className="mt-12 pt-8 border-t-2 border-slate-200">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Hygiene & Safety Knowledge Check
            </h2>
            <p className="text-slate-600 mb-6">
              Test your understanding of food safety practices and standards.
            </p>
            <TrainingModuleQuiz
              questions={hygieneQuizQuestions}
              passMarkPercent={80}
              onQuizPassed={(passed) => setQuizPassed(passed)}
            />
          </div>
        </div>
      )}

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review & Submit Checklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600">{getAnsweredCount()}</p>
                <p className="text-xs text-slate-600">Total Checks</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{getCriticalIssues()}</p>
                <p className="text-xs text-slate-600">Issues Found</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{getAnsweredCount() - getCriticalIssues()}</p>
                <p className="text-xs text-slate-600">Passed</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="font-semibold text-blue-900 mb-2">Declaration</p>
              <p className="text-sm text-blue-800 mb-3">
                I confirm that this inspection has been conducted thoroughly and all corrective actions documented are accurate.
              </p>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Name:</p>
                    <p className="font-semibold">{user.full_name || user.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Position:</p>
                    <p className="font-semibold capitalize">{user.role || 'Staff'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Digital Signature *</label>
                  <Input
                    placeholder="Type your full name to sign"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!signature.trim() || submitChecklistMutation.isPending}
                className="bg-emerald-600"
              >
                {submitChecklistMutation.isPending ? 'Submitting...' : 'Submit Checklist'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
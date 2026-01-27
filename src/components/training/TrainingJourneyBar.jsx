import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Lock, Clock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const journeySteps = [
  { id: 'invitation', label: 'Invitation', key: 'invitationAccepted' },
  { id: 'vision', label: 'Vision', key: 'visionWatched' },
  { id: 'values', label: 'Values', key: 'valuesCompleted' },
  { id: 'raving_fans', label: 'Raving Fans', key: 'ravingFansCompleted' },
  { id: 'hygiene', label: 'Hygiene', key: 'hygieneCompleted' },
  { id: 'certification', label: 'Certification', key: 'certified' },
  { id: 'growth', label: 'Growth', key: 'onsiteAccessEnabled' }
];

export default function TrainingJourneyBar({ progress, compact = false }) {
  const getStepStatus = (step, index) => {
    if (!progress) return 'locked';
    
    const isCompleted = progress[step.key];
    if (isCompleted) return 'completed';
    
    // Check if previous step is completed (unlocked)
    if (index === 0) return progress.invitationAccepted ? 'completed' : 'in_progress';
    
    const prevStep = journeySteps[index - 1];
    const prevCompleted = progress[prevStep.key];
    if (prevCompleted) return 'in_progress';
    
    return 'locked';
  };

  const completedCount = journeySteps.filter(step => progress?.[step.key]).length;
  const progressPercentage = (completedCount / journeySteps.length) * 100;

  if (compact) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">Training Journey</span>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
            {completedCount}/{journeySteps.length}
          </Badge>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-6 shadow-lg border-2 border-emerald-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Your Training Journey
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Complete all steps to unlock full certification
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-emerald-700">{completedCount}/{journeySteps.length}</div>
          <p className="text-xs text-slate-500">Steps Completed</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-3 mb-6 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"
        />
      </div>

      {/* Journey Steps */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {journeySteps.map((step, index) => {
          const status = getStepStatus(step, index);
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                relative rounded-xl p-3 text-center transition-all duration-300
                ${status === 'completed' ? 'bg-emerald-100 border-2 border-emerald-500' : ''}
                ${status === 'in_progress' ? 'bg-blue-100 border-2 border-blue-400 animate-pulse' : ''}
                ${status === 'locked' ? 'bg-slate-100 border-2 border-slate-300 opacity-50' : ''}
              `}
            >
              <div className="flex flex-col items-center gap-2">
                {status === 'completed' && (
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                )}
                {status === 'in_progress' && (
                  <Clock className="w-6 h-6 text-blue-600" />
                )}
                {status === 'locked' && (
                  <Lock className="w-6 h-6 text-slate-400" />
                )}
                <span className={`
                  text-xs font-semibold
                  ${status === 'completed' ? 'text-emerald-700' : ''}
                  ${status === 'in_progress' ? 'text-blue-700' : ''}
                  ${status === 'locked' ? 'text-slate-500' : ''}
                `}>
                  {step.label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Certification Status */}
      {progress?.certified && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-4 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-xl border-2 border-amber-400"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-amber-600" />
            <div>
              <p className="font-bold text-amber-900">🎉 Certified!</p>
              <p className="text-sm text-amber-700">
                You've completed the full training journey
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
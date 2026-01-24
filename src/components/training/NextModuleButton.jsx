import React from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { createPageUrl } from '@/utils';

const trainingModules = [
  { id: 'invitation', page: 'Invitation' },
  { id: 'vision', page: 'WelcomeVision' },
  { id: 'values', page: 'Culture' },
  { id: 'raving_fans', page: 'RavingFans' },
  { id: 'skills', page: 'SOPs' },
  { id: 'hygiene', page: 'Training' },
  { id: 'certification', page: 'Certification' },
  { id: 'growth', page: 'LeadershipPathway' }
];

export default function NextModuleButton({
  currentModuleId,
  journeyProgress,
  user,
  onComplete,
  disabled = false
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const nextModuleMutation = useMutation({
    mutationFn: async () => {
      const currentIndex = trainingModules.findIndex(m => m.id === currentModuleId);
      const nextModule = trainingModules[currentIndex + 1];

      if (!nextModule) {
        return { nextPage: null };
      }

      // CRITICAL: Mark current module as completed AND increment index
      const moduleStatuses = { ...journeyProgress.moduleStatuses };
      moduleStatuses[currentModuleId] = 'completed';

      await base44.entities.TrainingJourneyProgress.update(journeyProgress.id, {
        currentModuleIndex: currentIndex + 1,
        moduleStatuses,
        lastUpdated: new Date().toISOString()
      });

      // Log progression
      await base44.entities.TrainingAuditLog.create({
        staff_id: user.id,
        staff_email: user.email,
        action: 'next_module_unlocked',
        module_id: currentModuleId,
        details: { nextModuleId: nextModule.id },
        performed_by_email: user.email,
        timestamp: new Date().toISOString()
      });

      return { nextPage: nextModule.page };
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['trainingJourney'] });
      onComplete && onComplete();
      if (data.nextPage) {
        navigate(createPageUrl(data.nextPage));
      }
    }
  });

  const currentIndex = trainingModules.findIndex(m => m.id === currentModuleId);
  const nextModule = trainingModules[currentIndex + 1];
  const quizPassed = journeyProgress?.moduleStatuses?.[currentModuleId] === 'quiz_passed';
  const alreadyCompleted = journeyProgress?.moduleStatuses?.[currentModuleId] === 'completed';

  // Only show if quiz passed, not already completed, and there's a next module
  if (!quizPassed || alreadyCompleted || !nextModule || !journeyProgress) {
    return null;
  }

  return (
    <Button
      onClick={() => nextModuleMutation.mutate()}
      disabled={disabled || nextModuleMutation.isPending}
      size="lg"
      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-lg h-12 font-semibold"
    >
      <ChevronRight className="w-5 h-5 mr-2" />
      {nextModuleMutation.isPending ? 'Moving to next module...' : 'Next Module →'}
    </Button>
  );
}
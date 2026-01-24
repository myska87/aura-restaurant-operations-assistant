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
  disabled = false
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const nextModuleMutation = useMutation({
    mutationFn: async () => {
      const currentModule = trainingModules.find(m => m.id === currentModuleId);
      const currentIndex = trainingModules.findIndex(m => m.id === currentModuleId);
      const nextModule = trainingModules[currentIndex + 1];

      if (!nextModule) {
        // No more modules
        return { nextPage: null };
      }

      // Mark current module as completed
      const moduleStatuses = journeyProgress.moduleStatuses || {};
      moduleStatuses[currentModuleId] = 'completed';

      // Increment module index
      const newIndex = currentIndex + 1;

      // Update journey progress
      await base44.entities.TrainingJourneyProgress.update(journeyProgress.id, {
        currentModuleIndex: newIndex,
        moduleStatuses: moduleStatuses,
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
      if (data.nextPage) {
        navigate(createPageUrl(data.nextPage));
      }
    }
  });

  const currentIndex = trainingModules.findIndex(m => m.id === currentModuleId);
  const nextModule = trainingModules[currentIndex + 1];
  const quizPassed = journeyProgress?.moduleStatuses?.[currentModuleId] === 'quiz_passed';

  // Only show if quiz passed and there's a next module
  if (!quizPassed || !nextModule) {
    return null;
  }

  return (
    <Button
      onClick={() => nextModuleMutation.mutate()}
      disabled={disabled || nextModuleMutation.isPending}
      size="lg"
      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-lg h-12"
    >
      <ChevronRight className="w-5 h-5 mr-2" />
      {nextModuleMutation.isPending ? 'Loading...' : `Continue to ${nextModule.id}`}
    </Button>
  );
}
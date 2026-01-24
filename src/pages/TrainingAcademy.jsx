import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Leaf, Shield, ChefHat, Trophy, CheckCircle, Lock } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import TrainingJourneyBar from '@/components/training/TrainingJourneyBar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const trainingOptions = [
  {
    title: 'Invitation — You Are Chosen',
    description: 'Welcome to Chai Patta — start your journey',
    icon: Leaf,
    page: 'Invitation',
    color: 'from-amber-500 to-orange-600',
    roles: ['all'],
    isInvitation: true
  },
  {
    title: 'Culture & Values',
    description: 'Chai Patta culture, values & behaviour standards',
    icon: Leaf,
    page: 'Culture',
    color: 'from-emerald-500 to-green-600',
    roles: ['all']
  },
  {
    title: 'Hygiene & Safety',
    description: 'Level 1, 2 & 3 hygiene training + certificates',
    icon: Shield,
    page: 'Training',
    color: 'from-blue-500 to-blue-600',
    roles: ['all']
  },
  {
    title: 'Skills & SOPs',
    description: 'Kitchen skills, FOH training & SOP library',
    icon: ChefHat,
    page: 'SOPs',
    color: 'from-amber-500 to-orange-600',
    roles: ['all']
  },
  {
    title: 'Leadership Pathway',
    description: 'Progress levels, requirements & leadership journal',
    icon: Trophy,
    page: 'LeadershipPathway',
    color: 'from-purple-500 to-pink-600',
    roles: ['all']
  }
];

export default function TrainingAcademy() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  // Fetch or create journey progress
  const { data: journeyProgress, isLoading } = useQuery({
    queryKey: ['trainingJourney', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      
      const existing = await base44.entities.TrainingJourneyProgress.filter({
        staff_email: user.email
      });
      
      if (existing.length > 0) {
        return existing[0];
      }
      
      // Create initial progress
      const newProgress = await base44.entities.TrainingJourneyProgress.create({
        staff_id: user.id,
        staff_email: user.email,
        staff_name: user.full_name || user.email,
        invitationAccepted: false,
        visionWatched: false,
        valuesCompleted: false,
        ravingFansCompleted: false,
        skillsCompleted: false,
        hygieneCompleted: false,
        certified: false,
        onsiteAccessEnabled: false,
        currentStep: 'invitation',
        lastUpdated: new Date().toISOString()
      });
      
      return newProgress;
    },
    enabled: !!user
  });

  // Auto-sync with existing training completions
  useEffect(() => {
    if (!user || !journeyProgress) return;

    const syncProgress = async () => {
      // Check Culture & Values completion
      const cultureAck = await base44.entities.CultureAcknowledgment.filter({
        staff_email: user.email,
        acknowledged: true
      });

      // Check Hygiene training completion
      const trainingProgress = await base44.entities.TrainingProgress.filter({
        staff_email: user.email,
        status: 'completed'
      });
      const hygieneCompleted = trainingProgress.some(t => 
        t.course_id && (t.course_id.includes('hygiene') || t.course_id.includes('safety'))
      );

      // Check SOP acknowledgments
      const sopAcks = await base44.entities.SOPAcknowledgment.filter({
        staff_email: user.email,
        acknowledged: true
      });

      // Calculate certification gate
      const allGatesPassed = 
        journeyProgress.invitationAccepted &&
        journeyProgress.visionWatched &&
        (cultureAck.length > 0 || journeyProgress.valuesCompleted) &&
        journeyProgress.ravingFansCompleted &&
        (sopAcks.length >= 3 || journeyProgress.skillsCompleted) &&
        (hygieneCompleted || journeyProgress.hygieneCompleted);

      // Update if needed
      const updates = {};
      if (cultureAck.length > 0 && !journeyProgress.valuesCompleted) {
        updates.valuesCompleted = true;
      }
      if (hygieneCompleted && !journeyProgress.hygieneCompleted) {
        updates.hygieneCompleted = true;
      }
      if (sopAcks.length >= 3 && !journeyProgress.skillsCompleted) {
        updates.skillsCompleted = true;
      }
      if (allGatesPassed && !journeyProgress.certified) {
        updates.certified = true;
        updates.certificateIssuedAt = new Date().toISOString();
      }

      if (Object.keys(updates).length > 0) {
        await base44.entities.TrainingJourneyProgress.update(journeyProgress.id, {
          ...updates,
          lastUpdated: new Date().toISOString()
        });
        queryClient.invalidateQueries(['trainingJourney']);
      }
    };

    syncProgress();
  }, [user, journeyProgress, queryClient]);

  const acceptInvitationMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.TrainingJourneyProgress.update(journeyProgress.id, {
        invitationAccepted: true,
        currentStep: 'vision',
        lastUpdated: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingJourney']);
    }
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading your training journey..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Academy"
        description="Your complete learning journey from invitation to certification"
      />

      {/* Training Journey Progress */}
      <TrainingJourneyBar progress={journeyProgress} />



      <div className="grid md:grid-cols-2 gap-6">
        {trainingOptions.map((option) => {
          const Icon = option.icon;
          
          // Invitation is always unlocked
          let isUnlocked = option.isInvitation ? true : (journeyProgress?.invitationAccepted || false);
          let completionStatus = null;
          
          if (option.isInvitation) {
            completionStatus = journeyProgress?.invitationAccepted;
          } else if (option.page === 'Culture') {
            completionStatus = journeyProgress?.valuesCompleted;
          } else if (option.page === 'Training') {
            completionStatus = journeyProgress?.hygieneCompleted;
          } else if (option.page === 'SOPs') {
            completionStatus = journeyProgress?.skillsCompleted;
          } else if (option.page === 'LeadershipPathway') {
            isUnlocked = journeyProgress?.certified || false;
            completionStatus = journeyProgress?.onsiteAccessEnabled;
          }
          
          const CardWrapper = isUnlocked ? Link : 'div';
          const cardProps = isUnlocked ? { to: createPageUrl(option.page) } : {};
          
          return (
            <CardWrapper key={option.page} {...cardProps}>
              <Card className={`
                transition-all duration-300 border-2 h-full relative
                ${isUnlocked ? 'hover:shadow-xl hover:border-emerald-400 cursor-pointer' : 'opacity-60 cursor-not-allowed'}
                ${completionStatus ? 'border-emerald-500 bg-emerald-50' : ''}
              `}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${option.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    {!isUnlocked && (
                      <Lock className="w-6 h-6 text-slate-400" />
                    )}
                    {completionStatus && (
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    )}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{option.title}</h3>
                  <p className="text-slate-600 text-lg">{option.description}</p>
                  {!isUnlocked && (
                    <p className="text-sm text-amber-600 mt-3 font-semibold">
                      🔒 Accept invitation to unlock
                    </p>
                  )}
                  {completionStatus && (
                    <p className="text-sm text-emerald-600 mt-3 font-semibold">
                      ✓ Completed
                    </p>
                  )}
                </CardContent>
              </Card>
            </CardWrapper>
          );
        })}
      </div>
    </div>
  );
}
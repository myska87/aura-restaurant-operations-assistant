import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Leaf, Shield, ChefHat, Trophy, CheckCircle, Lock, Heart, RotateCcw, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
    step: 'invitation'
  },
  {
    title: 'Welcome & Vision — This Is Bigger Than a Café',
    description: 'Understand our purpose and what we stand for',
    icon: Leaf,
    page: 'WelcomeVision',
    color: 'from-purple-500 to-pink-600',
    roles: ['all'],
    step: 'vision'
  },
  {
    title: 'Culture & Values',
    description: 'Chai Patta culture, values & behaviour standards',
    icon: Leaf,
    page: 'Culture',
    color: 'from-emerald-500 to-green-600',
    roles: ['all'],
    step: 'values'
  },
  {
    title: 'Raving Fans — Ordinary Service Is Not Enough',
    description: 'Creating memorable experiences that turn guests into fans',
    icon: Heart,
    page: 'RavingFans',
    color: 'from-rose-500 to-pink-600',
    roles: ['all'],
    step: 'raving_fans'
  },
  {
    title: 'Skills & SOPs',
    description: 'Kitchen skills, FOH training & SOP library',
    icon: ChefHat,
    page: 'SOPs',
    color: 'from-amber-500 to-orange-600',
    roles: ['all'],
    step: 'skills'
  },
  {
    title: 'Hygiene & Safety',
    description: 'Level 1, 2 & 3 hygiene training + certificates',
    icon: Shield,
    page: 'Training',
    color: 'from-blue-500 to-blue-600',
    roles: ['all'],
    step: 'hygiene'
  },
  {
    title: 'Certification — You Are Ready',
    description: 'Final certification and on-site work authorization',
    icon: CheckCircle,
    page: 'Certification',
    color: 'from-emerald-500 to-teal-600',
    roles: ['all'],
    step: 'certification'
  },
  {
    title: 'Growth Centre — This Is Only the Beginning',
    description: 'Leadership pathway, progress levels & development journal',
    icon: Trophy,
    page: 'LeadershipPathway',
    color: 'from-purple-500 to-pink-600',
    roles: ['all'],
    step: 'growth'
  }
];

export default function TrainingAcademy() {
  const [user, setUser] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetMode, setResetMode] = useState('self'); // 'self' or 'other'
  const [selectedStaffEmail, setSelectedStaffEmail] = useState('');
  const [staffList, setStaffList] = useState([]);
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

  // Reset training mutation
  const resetTrainingMutation = useMutation({
    mutationFn: async (targetEmail) => {
      const target = await base44.entities.TrainingJourneyProgress.filter({
        staff_email: targetEmail
      });
      
      if (target.length === 0) return;
      
      await base44.entities.TrainingJourneyProgress.update(target[0].id, {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingJourney']);
      setShowResetConfirm(false);
      setResetMode('self');
      setSelectedStaffEmail('');
    }
  });

  // Fetch staff list for admin reset
  useEffect(() => {
    const loadStaff = async () => {
      if (!user || user.role !== 'admin') return;
      try {
        const staff = await base44.entities.Staff.list('-created_date', 100);
        setStaffList(staff);
      } catch (e) {
        console.error('Failed to load staff', e);
      }
    };
    loadStaff();
  }, [user]);

  if (isLoading) {
    return <LoadingSpinner message="Loading your training journey..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Training Academy</h1>
          <p className="text-slate-600 mt-1">Your complete learning journey from invitation to certification</p>
        </div>
        <Button
          onClick={() => setShowResetConfirm(true)}
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-50"
          size="sm"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Training
        </Button>
      </div>

      {/* Training Journey Progress */}
      <TrainingJourneyBar progress={journeyProgress} />



      <div className="grid md:grid-cols-2 gap-6">
        {trainingOptions.map((option, index) => {
          const Icon = option.icon;
          const currentStep = journeyProgress?.currentStep || 'invitation';
          
          // Strict sequential logic: only current step is unlocked
          const isCurrentStep = option.step === currentStep;
          
          // For certification (index 6), require ALL previous modules completed
          let isUnlocked = isCurrentStep;
          if (option.step === 'certification') {
            isUnlocked = 
              journeyProgress?.invitationAccepted &&
              journeyProgress?.visionWatched &&
              journeyProgress?.valuesCompleted &&
              journeyProgress?.ravingFansCompleted &&
              journeyProgress?.skillsCompleted &&
              journeyProgress?.hygieneCompleted;
          }
          
          // Check completion status
          const stepCompletionMap = {
            'invitation': journeyProgress?.invitationAccepted,
            'vision': journeyProgress?.visionWatched,
            'values': journeyProgress?.valuesCompleted,
            'raving_fans': journeyProgress?.ravingFansCompleted,
            'skills': journeyProgress?.skillsCompleted,
            'hygiene': journeyProgress?.hygieneCompleted,
            'certification': journeyProgress?.certified,
            'growth': journeyProgress?.onsiteAccessEnabled
          };
          
          const completionStatus = stepCompletionMap[option.step];
          
          const CardContent_ = (
            <Card className={`
              transition-all duration-300 border-2 h-full relative
              ${!isUnlocked && !completionStatus ? 'opacity-50 bg-slate-50 border-slate-300' : ''}
              ${completionStatus ? 'border-emerald-500 bg-emerald-50' : ''}
              ${isCurrentStep && !completionStatus ? 'border-blue-400 bg-blue-50 hover:shadow-lg hover:border-blue-500' : ''}
              ${isUnlocked && !completionStatus && !isCurrentStep ? 'hover:shadow-xl hover:border-slate-400 cursor-pointer' : ''}
              ${isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'}
            `}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${option.color} flex items-center justify-center shadow-lg ${!isUnlocked && !completionStatus ? 'opacity-70' : ''}`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  {!isUnlocked && !completionStatus && (
                    <Lock className="w-6 h-6 text-slate-400" />
                  )}
                  {completionStatus && (
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  )}
                  {isCurrentStep && !completionStatus && (
                    <Badge className="bg-blue-600">In Progress</Badge>
                  )}
                </div>
                <h3 className="text-2xl font-bold mb-3">{option.title}</h3>
                <p className="text-slate-600 text-lg">{option.description}</p>
                {!isUnlocked && !completionStatus && (
                  <p className="text-sm text-slate-500 mt-3 font-semibold">
                    🔒 Complete the previous module to unlock
                  </p>
                )}
                {completionStatus && (
                  <p className="text-sm text-emerald-600 mt-3 font-semibold">
                    ✓ Completed
                  </p>
                )}
                {isCurrentStep && !completionStatus && (
                  <p className="text-sm text-blue-600 mt-3 font-semibold">
                    → In Progress — Click to continue
                  </p>
                )}
              </CardContent>
            </Card>
          );
          
          return (
            <TooltipProvider key={option.page}>
              <Tooltip>
                <TooltipTrigger asChild>
                  {isUnlocked ? (
                    <Link to={createPageUrl(option.page)}>
                      {CardContent_}
                    </Link>
                  ) : (
                    <div>
                      {CardContent_}
                    </div>
                  )}
                </TooltipTrigger>
                {!isUnlocked && !completionStatus && (
                  <TooltipContent>Complete the previous module to unlock</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}
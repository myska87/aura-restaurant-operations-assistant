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

const trainingModules = [
  { id: 'invitation', index: 0, title: 'Invitation — You Are Chosen', description: 'Welcome to Chai Patta — start your journey', icon: Leaf, page: 'Invitation', color: 'from-amber-500 to-orange-600', roles: ['all'] },
  { id: 'vision', index: 1, title: 'Welcome & Vision — This Is Bigger Than a Café', description: 'Understand our purpose and what we stand for', icon: Leaf, page: 'WelcomeVision', color: 'from-purple-500 to-pink-600', roles: ['all'] },
  { id: 'values', index: 2, title: 'Culture & Values', description: 'Chai Patta culture, values & behaviour standards', icon: Leaf, page: 'Culture', color: 'from-emerald-500 to-green-600', roles: ['all'] },
  { id: 'raving_fans', index: 3, title: 'Raving Fans — Ordinary Service Is Not Enough', description: 'Creating memorable experiences that turn guests into fans', icon: Heart, page: 'RavingFans', color: 'from-rose-500 to-pink-600', roles: ['all'] },
  { id: 'skills', index: 4, title: 'Skills & SOPs', description: 'Kitchen skills, FOH training & SOP library', icon: ChefHat, page: 'SOPs', color: 'from-amber-500 to-orange-600', roles: ['all'] },
  { id: 'hygiene', index: 5, title: 'Hygiene & Safety', description: 'Level 1, 2 & 3 hygiene training + certificates', icon: Shield, page: 'Training', color: 'from-blue-500 to-blue-600', roles: ['all'] },
  { id: 'certification', index: 6, title: 'Certification — You Are Ready', description: 'Final certification and on-site work authorization', icon: CheckCircle, page: 'Certification', color: 'from-emerald-500 to-teal-600', roles: ['all'] },
  { id: 'growth', index: 7, title: 'Growth Centre — This Is Only the Beginning', description: 'Leadership pathway, progress levels & development journal', icon: Trophy, page: 'LeadershipPathway', color: 'from-purple-500 to-pink-600', roles: ['all'] }
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
      
      if (target.length === 0) throw new Error('Training progress not found');
      
      // Delete Culture Acknowledgments
      const cultureAcks = await base44.entities.CultureAcknowledgment.filter({
        staff_email: targetEmail
      });
      for (const ack of cultureAcks) {
        await base44.entities.CultureAcknowledgment.delete(ack.id);
      }
      
      // Delete Raving Fans Acknowledgments if exists
      try {
        const ravingFansAcks = await base44.entities.RavingFansAcknowledgment.filter({
          staff_email: targetEmail
        });
        for (const ack of ravingFansAcks) {
          await base44.entities.RavingFansAcknowledgment.delete(ack.id);
        }
      } catch (e) {
        // Entity might not exist, continue
      }
      
      return await base44.entities.TrainingJourneyProgress.update(target[0].id, {
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
    onSuccess: async () => {
      // Invalidate all training-related queries
      await queryClient.invalidateQueries({ queryKey: ['trainingJourney'] });
      await queryClient.invalidateQueries({ queryKey: ['cultureAck'] });
      await queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0];
        return key === 'cultureAck' || key === 'trainingJourney';
      }});
      setShowResetConfirm(false);
      setResetMode('self');
      setSelectedStaffEmail('');
    },
    onError: (error) => {
      console.error('Failed to reset training:', error);
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

      {/* Reset Training Modal */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <DialogTitle>Reset Training Progress</DialogTitle>
                <DialogDescription>Start training from the beginning</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Mode Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Reset whose training?</label>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setResetMode('self');
                    setSelectedStaffEmail('');
                  }}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                    resetMode === 'self'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-semibold text-slate-900">My Training</p>
                  <p className="text-sm text-slate-500">Reset your own training</p>
                </button>

                {user?.role === 'admin' && (
                  <button
                    onClick={() => setResetMode('other')}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                      resetMode === 'other'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold text-slate-900">Staff Member</p>
                    <p className="text-sm text-slate-500">Reset another staff member's training</p>
                  </button>
                )}
              </div>
            </div>

            {/* Staff Selection for Admin */}
            {resetMode === 'other' && user?.role === 'admin' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold">Select staff member:</label>
                <select
                  value={selectedStaffEmail}
                  onChange={(e) => setSelectedStaffEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Choose a staff member...</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.email}>
                      {staff.full_name} ({staff.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Warning Message */}
            <div className="p-4 bg-amber-100 border border-amber-300 rounded-lg">
              <p className="text-sm text-amber-900 font-semibold">
                ⚠️ This will reset all training progress and they'll need to start from the beginning.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowResetConfirm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const email = resetMode === 'self' ? user.email : selectedStaffEmail;
                  if (email) {
                    resetTrainingMutation.mutate(email);
                  }
                }}
                disabled={
                  resetTrainingMutation.isPending ||
                  (resetMode === 'other' && !selectedStaffEmail)
                }
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                {resetTrainingMutation.isPending ? 'Resetting...' : 'Reset Training'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
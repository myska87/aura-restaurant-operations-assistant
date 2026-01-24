import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CheckCircle, Award, Lock, Sparkles, Shield, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TrainingJourneyBar from '@/components/training/TrainingJourneyBar';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';

const prerequisites = [
  { id: 'invitationAccepted', label: 'Invitation Accepted', step: 'invitation' },
  { id: 'visionWatched', label: 'Vision Watched', step: 'vision' },
  { id: 'valuesCompleted', label: 'Values Completed', step: 'values' },
  { id: 'ravingFansCompleted', label: 'Raving Fans Completed', step: 'raving_fans' },
  { id: 'skillsCompleted', label: 'Skills Completed', step: 'skills' },
  { id: 'hygieneCompleted', label: 'Hygiene Completed', step: 'hygiene' }
];

export default function Certification() {
  const [user, setUser] = useState(null);
  const [showBypassConfirm, setShowBypassConfirm] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: journeyProgress, isLoading } = useQuery({
    queryKey: ['trainingJourney', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const existing = await base44.entities.TrainingJourneyProgress.filter({
        staff_email: user.email
      });
      return existing.length > 0 ? existing[0] : null;
    },
    enabled: !!user
  });

  const issueCertificateMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.TrainingJourneyProgress.update(journeyProgress.id, {
        certified: true,
        certificateIssuedAt: new Date().toISOString(),
        onsiteAccessEnabled: true,
        currentStep: 'growth',
        lastUpdated: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingJourney']);
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899']
      });
    }
  });

  const bypassCertificationMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.TrainingJourneyProgress.update(journeyProgress.id, {
        certified: true,
        certificateIssuedAt: new Date().toISOString(),
        onsiteAccessEnabled: true,
        currentStep: 'growth',
        lastUpdated: new Date().toISOString()
      });
    },
    onSuccess: () => {
      setShowBypassConfirm(false);
      queryClient.invalidateQueries(['trainingJourney']);
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#ff6b6b', '#ffa94d', '#ffd93d', '#ff922b']
      });
    }
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  const allPrerequisitesComplete = prerequisites.every(p => journeyProgress?.[p.id]);

  if (!allPrerequisitesComplete) {
   const incompletePrereqs = prerequisites.filter(p => !journeyProgress?.[p.id]);

   return (
     <div className="max-w-4xl mx-auto space-y-6">
       <TrainingJourneyBar progress={journeyProgress} compact />

       <Card className="border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50">
         <CardContent className="pt-8 pb-8 px-6 md:px-12">
           <div className="text-center mb-8">
             <Lock className="w-16 h-16 mx-auto mb-4 text-amber-600" />
             <h2 className="text-3xl font-bold text-slate-900 mb-2">Certification Locked</h2>
             <p className="text-lg text-amber-700 font-semibold">
               Complete all required modules to unlock
             </p>
           </div>

           {/* Incomplete Prerequisites Checklist */}
           <div className="bg-white rounded-xl p-6 mb-8 max-w-2xl mx-auto border-2 border-amber-200">
             <h3 className="text-xl font-bold text-slate-900 mb-4">Required Modules</h3>
             <div className="space-y-3">
               {prerequisites.map((prereq) => {
                 const isComplete = journeyProgress?.[prereq.id];
                 return (
                   <div
                     key={prereq.id}
                     className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                       isComplete 
                         ? 'bg-emerald-50 border border-emerald-200' 
                         : 'bg-amber-50 border border-amber-200'
                     }`}
                   >
                     <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                       isComplete ? 'bg-emerald-600' : 'bg-amber-600'
                     }`}>
                       {isComplete && <span className="text-white text-sm">✓</span>}
                       {!isComplete && <span className="text-white text-sm">!</span>}
                     </div>
                     <span className={`font-medium ${isComplete ? 'text-emerald-700 line-through' : 'text-amber-900'}`}>
                       {prereq.label}
                     </span>
                   </div>
                 );
               })}
             </div>
           </div>

           <div className="text-center">
             <p className="text-amber-700 font-semibold mb-6">
               {incompletePrereqs.length} of {prerequisites.length} modules remaining
             </p>
             <Button
               onClick={() => navigate(createPageUrl('TrainingAcademy'))}
               className="bg-amber-600 hover:bg-amber-700"
               size="lg"
             >
               Back to Training Academy
             </Button>
           </div>
         </CardContent>
       </Card>
     </div>
   );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <TrainingJourneyBar progress={journeyProgress} compact />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
          <CardContent className="pt-8 pb-8 px-6 md:px-12">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
                Certification
              </h1>
              <p className="text-xl text-emerald-700 font-semibold">
                You Are Ready
              </p>
            </div>

            {/* Prerequisites Checklist */}
            <div className="bg-white rounded-xl p-6 mb-8 max-w-2xl mx-auto border-2 border-emerald-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Training Journey Completed
              </h3>
              <div className="space-y-3">
                {prerequisites.map((prereq) => (
                  <div
                    key={prereq.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50"
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-800 font-medium">{prereq.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Certification Status */}
            {journeyProgress?.certified ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="inline-block p-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-2xl">
                  <Award className="w-20 h-20 text-white mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">
                    ✅ CERTIFIED
                  </h2>
                  <p className="text-xl text-white/90">
                    APPROVED TO START WORK
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 max-w-md mx-auto border-2 border-emerald-300">
                  <h3 className="font-bold text-slate-900 mb-4">Certificate Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status:</span>
                      <span className="font-semibold text-emerald-700">✓ Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Access Level:</span>
                      <span className="font-semibold text-emerald-700">On-Site Enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Issued:</span>
                      <span className="font-semibold">
                        {format(new Date(journeyProgress.certificateIssuedAt), 'PPP')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Staff Member:</span>
                      <span className="font-semibold">{journeyProgress.staff_name}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl border-2 border-amber-300 max-w-2xl mx-auto">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-left">
                      <p className="font-bold text-amber-900 mb-2">Welcome to the Team!</p>
                      <p className="text-amber-800 leading-relaxed">
                        You've completed the entire training journey. You are now certified and authorized to work on-site. 
                        Continue to Leadership Pathway for advanced growth opportunities.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => navigate(createPageUrl('TrainingAcademy'))}
                  variant="outline"
                  size="lg"
                  className="mt-4"
                >
                  Back to Training Academy
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center space-y-6"
              >
                <div className="p-8 bg-white rounded-xl border-2 border-slate-200 max-w-2xl mx-auto">
                  <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    Ready for Certification
                  </h3>
                  <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                    You have completed all required training modules. Click below to receive your official certification 
                    and unlock on-site work authorization.
                  </p>
                  <Button
                    onClick={() => issueCertificateMutation.mutate()}
                    disabled={issueCertificateMutation.isPending}
                    size="lg"
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-lg px-10 py-6 shadow-xl"
                  >
                    {issueCertificateMutation.isPending ? (
                      'Issuing...'
                    ) : (
                      <>
                        <Award className="w-5 h-5 mr-2" />
                        Issue Certificate
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
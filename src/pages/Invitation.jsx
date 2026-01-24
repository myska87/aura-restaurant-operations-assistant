import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TrainingJourneyBar from '@/components/training/TrainingJourneyBar';
import ModuleQuizSubmission from '@/components/training/ModuleQuizSubmission';
import NextModuleButton from '@/components/training/NextModuleButton';

const invitationQuizQuestions = [
  {
    question: "What is the primary reason you were chosen to join Chai Patta?",
    type: 'multiple-choice',
    options: [
      "We see potential in you to grow and contribute to something bigger",
      "We need someone to fill a position",
      "You applied first",
      "You have the most experience"
    ],
    correct: 0
  },
  {
    question: "Chai Patta stands for culture, ritual, and human connection.",
    type: 'true-false',
    correct: 0
  },
  {
    question: "Which best describes your role at Chai Patta?",
    type: 'multiple-choice',
    options: [
      "Being part of a bigger purpose and representing the brand",
      "Just doing a job for a paycheck",
      "Working while looking for something better",
      "Getting experience for another company"
    ],
    correct: 0
  }
];

export default function Invitation() {
  const [user, setUser] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pageRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!pageRef.current || showQuiz) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        setShowQuiz(true);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showQuiz]);

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

  const acceptInvitationMutation = useMutation({
    mutationFn: async () => {
      if (!quizPassed) {
        throw new Error('Quiz must be passed first');
      }
      await base44.entities.TrainingJourneyProgress.update(journeyProgress.id, {
        invitationAccepted: true,
        currentStep: 'vision',
        lastUpdated: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingJourney']);
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  const handleQuizPassed = (passed, score) => {
    if (passed) {
      setQuizPassed(true);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" ref={pageRef}>
      <TrainingJourneyBar progress={journeyProgress} compact />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="border-2 border-amber-400 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
          <CardContent className="pt-12 pb-12 px-8 md:px-16 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-4xl md:text-5xl font-bold text-slate-900 mb-4"
            >
              You Are Chosen
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xl text-amber-700 font-semibold mb-8"
            >
              Welcome to Chai Patta — this is bigger than a job.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-left max-w-2xl mx-auto space-y-4 text-lg text-slate-700 leading-relaxed mb-10"
            >
              <p>
                Welcome to Chai Patta.
              </p>
              <p>
                You were invited here because we see potential in you — not just to work, but to grow, 
                contribute, and become part of something bigger than a job.
              </p>
              <p>
                Before you step into our space, we want you to understand who we are, why we exist, 
                and what kind of people thrive here.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <Button
                onClick={() => acceptInvitationMutation.mutate()}
                disabled={!quizPassed || acceptInvitationMutation.isPending || journeyProgress?.invitationAccepted}
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-lg px-8 py-6 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {journeyProgress?.invitationAccepted ? (
                  <>✓ Journey Started</>
                ) : (
                  <>
                    Complete & Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              {journeyProgress?.invitationAccepted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-emerald-100 border border-emerald-300 rounded-lg"
                >
                  <p className="text-sm text-emerald-800 font-semibold">
                    ✓ Module completed. Next step unlocked.
                  </p>
                </motion.div>
              )}
              {!quizPassed && (
                <p className="mt-4 text-sm text-amber-600 font-semibold">
                  Complete the quiz below to unlock this button
                </p>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quiz Section */}
      {showQuiz && (
        <TrainingModuleQuiz
          questions={invitationQuizQuestions}
          onQuizPassed={handleQuizPassed}
          moduleName="Invitation"
          passPercentage={80}
        />
      )}
    </div>
  );
}
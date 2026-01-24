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
  const [quizAnswers, setQuizAnswers] = useState({});
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

  const handleQuizPassed = () => {
    setQuizPassed(true);
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


          </CardContent>
        </Card>
      </motion.div>

      {/* Quiz Section */}
      {showQuiz && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="border-2 border-amber-400 bg-amber-50">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-4">
                {invitationQuizQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 bg-white rounded border border-amber-200">
                    <p className="font-semibold text-slate-800 mb-3">{idx + 1}. {q.question}</p>
                    {q.type === 'true-false' ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setQuizAnswers({...quizAnswers, [idx]: 0})}
                          className={`px-4 py-2 rounded text-sm font-medium transition-all ${quizAnswers[idx] === 0 ? 'bg-amber-600 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}
                        >
                          True
                        </button>
                        <button 
                          onClick={() => setQuizAnswers({...quizAnswers, [idx]: 1})}
                          className={`px-4 py-2 rounded text-sm font-medium transition-all ${quizAnswers[idx] === 1 ? 'bg-amber-600 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}
                        >
                          False
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {q.options?.map((opt, i) => (
                          <button 
                            key={i} 
                            onClick={() => setQuizAnswers({...quizAnswers, [idx]: i})}
                            className={`block w-full text-left px-4 py-2 rounded text-sm font-medium transition-all ${quizAnswers[idx] === i ? 'bg-amber-600 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <ModuleQuizSubmission
                moduleId="invitation"
                moduleName="Invitation"
                questions={invitationQuizQuestions}
                userAnswers={quizAnswers}
                user={user}
                journeyProgress={journeyProgress}
                onQuizPassed={handleQuizPassed}
                disabled={Object.keys(quizAnswers).length < invitationQuizQuestions.length}
              />
            </CardContent>
          </Card>

          {quizPassed && journeyProgress && (
            <NextModuleButton
              currentModuleId="invitation"
              journeyProgress={journeyProgress}
              user={user}
              onComplete={() => setTimeout(() => navigate(createPageUrl('WelcomeVision')), 500)}
            />
          )}
        </motion.div>
      )}
    </div>
  );
}
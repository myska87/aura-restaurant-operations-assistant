import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModuleQuizSubmission from '@/components/training/ModuleQuizSubmission';
import NextModuleButton from '@/components/training/NextModuleButton';
import DebugTrainingState from '@/components/training/DebugTrainingState';
import { Video, CheckCircle, Sparkles, Heart, Users, Eye } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TrainingJourneyBar from '@/components/training/TrainingJourneyBar';

const ravingFansQuizQuestions = [
  {
    question: "A satisfied customer might return, but a raving fan will bring others with them.",
    type: 'true-false',
    correct: 0
  },
  {
    question: "How do you create raving fans?",
    type: 'multiple-choice',
    options: [
      "Remember faces, use names, anticipate needs, and care even when busy",
      "Serve food as fast as possible",
      "Treat every guest like they're less important",
      "Ignore guests unless they complain"
    ],
    correct: 0
  },
  {
    question: "Your mission is to turn moments into memories.",
    type: 'true-false',
    correct: 0
  },
  {
    question: "What does treating every guest like a guest in your home mean?",
    type: 'multiple-choice',
    options: [
      "Show genuine care and hospitality even when it's busy",
      "Invite them to your personal home",
      "Ignore them unless they're your family",
      "Charge them less money"
    ],
    correct: 0
  }
];

export default function RavingFans() {
   const [user, setUser] = useState(null);
   const [videoUrl, setVideoUrl] = useState('');
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

  const { data: globalInfo } = useQuery({
    queryKey: ['globalInfo'],
    queryFn: async () => {
      const info = await base44.entities.GlobalInfo.list();
      return info[0] || {};
    }
  });

  const saveVideoUrlMutation = useMutation({
    mutationFn: async (url) => {
      const info = await base44.entities.GlobalInfo.list();
      if (info.length > 0) {
        await base44.entities.GlobalInfo.update(info[0].id, {
          ravingFansVideoUrl: url
        });
      } else {
        await base44.entities.GlobalInfo.create({
          restaurant_name: 'Chai Patta',
          ravingFansVideoUrl: url
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['globalInfo']);
    }
  });



  const handleQuizPassed = () => {
    setQuizPassed(true);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  // Check if unlocked (either valuesCompleted OR no journey progress yet means we're in testing)
  const isUnlocked = journeyProgress?.valuesCompleted;
  
  if (!isUnlocked && journeyProgress) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <TrainingJourneyBar progress={journeyProgress} compact />
        <Card className="border-2 border-amber-400">
          <CardContent className="pt-6 text-center">
            <p className="text-lg text-slate-700 mb-2">
              🔒 Complete Culture & Values first to unlock Raving Fans Philosophy
            </p>
            <p className="text-sm text-slate-600 mb-4">
              Current progress: valuesCompleted = {journeyProgress?.valuesCompleted ? 'true' : 'false'}
            </p>
            <Button
              onClick={() => navigate(createPageUrl('TrainingAcademy'))}
              className="mt-4"
            >
              Back to Training Academy
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6" ref={pageRef}>
      <TrainingJourneyBar progress={journeyProgress} compact />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="border-2 border-rose-400 bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
          <CardContent className="pt-8 pb-8 px-6 md:px-12">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-2xl">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
                Raving Fans Philosophy
              </h1>
              <p className="text-xl text-rose-700 font-semibold">
                Ordinary Service Is Not Enough
              </p>
            </div>

            {/* Video Section */}
            <div className="mb-8">
              {user?.role === 'admin' || user?.role === 'manager' ? (
                <div className="mb-4 p-4 bg-white rounded-lg border-2 border-slate-200">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Raving Fans Video URL (Admin/Manager Only)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="YouTube or Instagram video URL"
                      value={videoUrl || globalInfo?.ravingFansVideoUrl || ''}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                    <Button
                      onClick={() => saveVideoUrlMutation.mutate(videoUrl)}
                      disabled={saveVideoUrlMutation.isPending}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl">
                {globalInfo?.ravingFansVideoUrl ? (
                  <iframe
                    src={globalInfo.ravingFansVideoUrl.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allowFullScreen
                    title="Raving Fans Video"
                  />
                ) : (
                  <div className="text-center text-white p-8">
                    <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Video will appear here once uploaded</p>
                  </div>
                )}
              </div>
            </div>

            {/* Philosophy Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-6 text-lg text-slate-700 leading-relaxed"
            >
              <p className="text-2xl font-bold text-slate-900 text-center mb-6">
                A satisfied customer might return.<br />
                A raving fan will bring others with them.
              </p>

              <div className="bg-white/80 p-6 rounded-xl border-2 border-rose-200">
                <h3 className="text-xl font-bold text-rose-900 mb-4 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-rose-600" />
                  We create raving fans by:
                </h3>
                <ul className="space-y-3 ml-8">
                  <li className="flex items-start gap-3">
                    <Eye className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Remembering faces</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Using names</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Anticipating needs</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Caring even when it's busy</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Treating every guest like a guest in our home</strong></span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-8 rounded-2xl border-2 border-amber-400 text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  Your Mission:
                </h3>
                <p className="text-3xl font-bold text-amber-900">
                  Turn moments into memories.
                </p>
              </div>
            </motion.div>

            {/* CTA Button */}

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
          <Card className="border-2 border-rose-400 bg-rose-50">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-4">
                {ravingFansQuizQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 bg-white rounded border border-rose-200">
                    <p className="font-semibold text-slate-800 mb-3">{idx + 1}. {q.question}</p>
                    {q.type === 'true-false' ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setQuizAnswers({...quizAnswers, [idx]: 0})}
                          className={`px-4 py-2 rounded text-sm font-medium transition-all ${quizAnswers[idx] === 0 ? 'bg-rose-600 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}
                        >
                          True
                        </button>
                        <button 
                          onClick={() => setQuizAnswers({...quizAnswers, [idx]: 1})}
                          className={`px-4 py-2 rounded text-sm font-medium transition-all ${quizAnswers[idx] === 1 ? 'bg-rose-600 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}
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
                            className={`block w-full text-left px-4 py-2 rounded text-sm font-medium transition-all ${quizAnswers[idx] === i ? 'bg-rose-600 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}
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
                moduleId="raving_fans"
                moduleName="Raving Fans Philosophy"
                questions={ravingFansQuizQuestions}
                userAnswers={quizAnswers}
                user={user}
                journeyProgress={journeyProgress}
                onQuizPassed={handleQuizPassed}
                disabled={Object.keys(quizAnswers).length < ravingFansQuizQuestions.length}
              />
            </CardContent>
          </Card>

          {quizPassed && journeyProgress && (
            <NextModuleButton
              currentModuleId="raving_fans"
              journeyProgress={journeyProgress}
              user={user}
              onComplete={() => setTimeout(() => navigate(createPageUrl('SOPs')), 500)}
            />
          )}
        </motion.div>
      )}

      {/* DEBUG OUTPUT */}
      <DebugTrainingState journeyProgress={journeyProgress} currentModuleId="raving_fans" />
    </div>
  );
}
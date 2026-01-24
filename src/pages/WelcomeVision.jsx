import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Video, CheckCircle, Heart } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TrainingJourneyBar from '@/components/training/TrainingJourneyBar';
import TrainingModuleQuiz from '@/components/training/TrainingModuleQuiz';

const welcomeVisionQuizQuestions = [
  {
    question: "What is the core belief Chai Patta is built on?",
    options: [
      "Serving the cheapest drinks possible",
      "People don't remember what you serve — they remember how you make them feel",
      "Speed is more important than quality",
      "We're just another café"
    ],
    correctAnswer: 1
  },
  {
    question: "What are the three key aspects of Chai Patta mentioned in the module?",
    options: [
      "Price, location, hours",
      "Culture, ritual, human connection",
      "Staff, customers, profit",
      "Food, drinks, desserts"
    ],
    correctAnswer: 1
  },
  {
    question: "Which is NOT mentioned as part of Chai Patta's vision?",
    options: [
      "Guests feel seen, safe, and welcomed",
      "Team members feel valued, trained, and empowered",
      "We maximize profits at all costs",
      "Every cup carries intention"
    ],
    correctAnswer: 2
  },
  {
    question: "What is expected from you as a Chai Patta team member?",
    options: [
      "Just show up and do the minimum",
      "Presence, responsibility, pride in your work, and willingness to grow",
      "Only follow orders without thinking",
      "Compete with other team members"
    ],
    correctAnswer: 1
  }
];

export default function WelcomeVision() {
  const [user, setUser] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
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
          founderWelcomeVideoUrl: url
        });
      } else {
        await base44.entities.GlobalInfo.create({
          restaurant_name: 'Chai Patta',
          founderWelcomeVideoUrl: url
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['globalInfo']);
    }
  });

  const markCompletedMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.TrainingJourneyProgress.update(journeyProgress.id, {
        visionWatched: true,
        currentStep: 'values',
        lastUpdated: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingJourney']);
      navigate(createPageUrl('TrainingAcademy'));
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

  if (!journeyProgress?.invitationAccepted) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 border-amber-400">
          <CardContent className="pt-6 text-center">
            <p className="text-lg text-slate-700">
              🔒 Complete the Invitation module first to unlock Welcome & Vision
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
        <Card className="border-2 border-purple-400 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
          <CardContent className="pt-8 pb-8 px-6 md:px-12">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-2xl">
                <Video className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
                Welcome & Vision
              </h1>
              <p className="text-xl text-purple-700 font-semibold">
                This Is Bigger Than a Café
              </p>
            </div>

            {/* Video Section */}
            <div className="mb-8">
              {user?.role === 'admin' || user?.role === 'manager' ? (
                <div className="mb-4 p-4 bg-white rounded-lg border-2 border-slate-200">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Founder Welcome Video URL (Admin/Manager Only)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="YouTube or Instagram video URL"
                      value={videoUrl || globalInfo?.founderWelcomeVideoUrl || ''}
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
                {globalInfo?.founderWelcomeVideoUrl ? (
                  <iframe
                    src={globalInfo.founderWelcomeVideoUrl.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allowFullScreen
                    title="Founder Welcome Video"
                  />
                ) : (
                  <div className="text-center text-white p-8">
                    <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Video will appear here once uploaded</p>
                  </div>
                )}
              </div>
            </div>

            {/* Vision Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-6 text-lg text-slate-700 leading-relaxed"
            >
              <p className="text-2xl font-bold text-slate-900 text-center mb-6">
                Chai Patta is built on one belief:<br />
                People don't remember what you serve — they remember how you make them feel.
              </p>

              <div className="bg-white/80 p-6 rounded-xl border-2 border-purple-200">
                <p className="font-semibold text-purple-900 mb-4">
                  Chai Patta is not just tea.<br />
                  It's culture.<br />
                  It's ritual.<br />
                  It's human connection.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-pink-600" />
                  Our vision is to create spaces where:
                </h3>
                <ul className="space-y-2 ml-8">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>Guests feel seen, safe, and welcomed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>Team members feel valued, trained, and empowered</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>Every cup carries intention</span>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-50 p-6 rounded-xl border-2 border-amber-300">
                <h3 className="text-xl font-bold text-amber-900 mb-3">
                  What we expect from you:
                </h3>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>Presence</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>Responsibility</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>Pride in your work</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>A willingness to grow</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center mt-10"
            >
              <Button
                onClick={() => markCompletedMutation.mutate()}
                disabled={!quizPassed || markCompletedMutation.isPending || journeyProgress?.visionWatched}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg px-10 py-6 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {journeyProgress?.visionWatched ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Completed
                  </>
                ) : (
                  "I've Watched This"
                )}
              </Button>

              {journeyProgress?.visionWatched && (
                <p className="mt-4 text-sm text-emerald-600 font-semibold">
                  ✓ Next: Continue to Culture & Values
                </p>
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
          questions={welcomeVisionQuizQuestions}
          onQuizPassed={handleQuizPassed}
          moduleName="Welcome & Vision"
          passPercentage={80}
        />
      )}
    </div>
  );
}
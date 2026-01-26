import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  GraduationCap, 
  Video, 
  BookOpen, 
  Award,
  PlayCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function TrainHome() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: progress = [] } = useQuery({
    queryKey: ['myProgress', user?.id],
    queryFn: () => user?.id 
      ? base44.entities.TrainingProgress.filter({ staff_id: user.id })
      : [],
    enabled: !!user?.id
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['allCourses'],
    queryFn: () => base44.entities.TrainingCourse.list()
  });

  const { data: globalInfo } = useQuery({
    queryKey: ['globalInfo'],
    queryFn: async () => {
      const info = await base44.entities.GlobalInfo.list();
      return info[0] || {};
    }
  });

  const { data: journeyProgress } = useQuery({
    queryKey: ['journeyProgress', user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      const prog = await base44.entities.TrainingJourneyProgress.filter({ staff_id: user.id });
      return prog[0] || {};
    },
    enabled: !!user?.id
  });

  const completedCount = progress.filter(p => p.status === 'completed').length;
  const inProgressCount = progress.filter(p => p.status === 'in_progress').length;
  const totalCourses = courses.length;
  const overallProgress = totalCourses > 0 ? (completedCount / totalCourses) * 100 : 0;

  const trainingPaths = [
    {
      title: 'My Training',
      icon: GraduationCap,
      color: 'bg-amber-500',
      link: 'TrainingAcademy',
      stat: `${completedCount}/${totalCourses}`
    },
    {
      title: 'Video Library',
      icon: Video,
      color: 'bg-purple-500',
      link: 'Training'
    },
    {
      title: 'SOP Library',
      icon: BookOpen,
      color: 'bg-blue-500',
      link: 'SOPLibrary'
    },
    {
      title: 'My Certificates',
      icon: Award,
      color: 'bg-emerald-500',
      link: 'Profile'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Leadership Welcome Video */}
        {globalInfo?.founderWelcomeVideoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200"
          >
            <div className="p-8 text-center">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Welcome to the Chai Patta Training Academy
              </h1>
              <p className="text-lg text-slate-600 mb-6">
                Where professionals are built — not rushed.
              </p>
            </div>
            <div className="aspect-video bg-slate-900">
              <iframe
                src={globalInfo.founderWelcomeVideoUrl.replace('watch?v=', 'embed/').replace('&', '?')}
                className="w-full h-full"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>
        )}

        {/* Mission & Purpose */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-lg">
            <CardContent className="pt-6 pb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">
                Learning With Purpose
              </h2>
              <div className="space-y-4 text-slate-700 leading-relaxed max-w-4xl mx-auto">
                <p>
                  Excellence in hospitality begins with mastery of fundamentals. This academy is designed to build your confidence, competence, and career through structured learning that respects both the craft and the customer.
                </p>
                <p>
                  Every module you complete strengthens not just your skill set, but your professional identity. You are not learning shortcuts—you are building expertise that will serve you throughout your career.
                </p>
                <p>
                  Take your time. Progress with purpose. Your growth matters to us.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Training Journey Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Your Training Journey</CardTitle>
              <p className="text-center text-slate-600">
                A structured path from foundation to certification
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: 'Welcome & Vision',
                    description: 'Understand our mission, values, and what makes this place special.',
                    page: 'WelcomeVision',
                    progressKey: 'welcome_vision_completed'
                  },
                  {
                    step: 2,
                    title: 'Culture & Values',
                    description: 'Learn the principles that guide how we work and serve.',
                    page: 'Culture',
                    progressKey: 'culture_completed'
                  },
                  {
                    step: 3,
                    title: 'Skills & SOPs',
                    description: 'Master the technical skills and standard operating procedures.',
                    page: 'SOPLibrary',
                    progressKey: 'sops_completed'
                  },
                  {
                    step: 4,
                    title: 'Hygiene & Safety',
                    description: 'Critical knowledge for maintaining standards and customer safety.',
                    page: 'LiveFoodSafety',
                    progressKey: 'hygiene_completed'
                  },
                  {
                    step: 5,
                    title: 'Certification',
                    description: 'Complete assessments and earn your professional certification.',
                    page: 'Certification',
                    progressKey: 'certification_completed'
                  },
                  {
                    step: 6,
                    title: 'Growth Centre',
                    description: 'Continue developing through advanced modules and leadership training.',
                    page: 'LeadershipPathway',
                    progressKey: 'growth_completed'
                  }
                ].map((item, idx) => {
                  const isCompleted = journeyProgress?.[item.progressKey] || false;
                  const isCurrent = idx === 0 || (idx > 0 && !isCompleted && progress.some(p => p.status !== 'not_started'));
                  
                  return (
                    <div
                      key={item.step}
                      className={`
                        flex items-start gap-4 p-4 rounded-lg border-2 transition-all
                        ${isCompleted ? 'bg-emerald-50 border-emerald-300' : ''}
                        ${isCurrent && !isCompleted ? 'bg-blue-50 border-blue-300' : ''}
                        ${!isCurrent && !isCompleted ? 'bg-slate-50 border-slate-200 opacity-60' : ''}
                      `}
                    >
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0
                        ${isCompleted ? 'bg-emerald-600 text-white' : ''}
                        ${isCurrent && !isCompleted ? 'bg-blue-600 text-white' : ''}
                        ${!isCurrent && !isCompleted ? 'bg-slate-300 text-slate-600' : ''}
                      `}>
                        {isCompleted ? '✓' : item.step}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-600 mb-2">
                          {item.description}
                        </p>
                        {isCompleted && (
                          <Badge className="bg-emerald-600 text-white">
                            Completed
                          </Badge>
                        )}
                        {isCurrent && !isCompleted && (
                          <Badge className="bg-blue-600 text-white">
                            Current Step
                          </Badge>
                        )}
                      </div>
                      {(isCompleted || isCurrent) && (
                        <Link to={createPageUrl(item.page)}>
                          <Button variant="outline" size="sm">
                            {isCompleted ? 'Review' : 'Start'}
                          </Button>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Encouragement Block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-2xl">
            <CardContent className="pt-6 pb-6 text-center">
              <h2 className="text-2xl font-bold mb-4">A Message From Leadership</h2>
              <p className="text-lg leading-relaxed max-w-3xl mx-auto mb-6">
                Training is not a hurdle to clear—it is the foundation of your success here. Every hour you invest in learning is an investment in your career, your confidence, and your ability to deliver excellence. We believe in your potential. Now, it is time to build on it.
              </p>
              <p className="text-slate-300 italic">
                Take your time. Learn deeply. Grow with purpose.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Link to={createPageUrl('TrainingAcademy')}>
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-6 shadow-lg">
              Continue Your Training →
            </Button>
          </Link>
        </motion.div>

        {/* Progress Overview */}
        <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6" />
              Your Training Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="h-3 mb-4 bg-white/30" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold">{completedCount}</p>
                <p className="text-sm opacity-90">Completed</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{inProgressCount}</p>
                <p className="text-sm opacity-90">In Progress</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{Math.round(overallProgress)}%</p>
                <p className="text-sm opacity-90">Overall</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-2 gap-4">
          {trainingPaths.map((path, idx) => {
            const Icon = path.icon;
            return (
              <motion.div
                key={path.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="hover:shadow-xl transition-all border-2 border-transparent hover:border-amber-300">
                  <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
                    <div className={`${path.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-3`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <p className="font-bold text-lg text-slate-800 mb-2">{path.title}</p>
                    {path.stat && (
                      <Badge className="mb-3 bg-amber-500">{path.stat}</Badge>
                    )}
                    <Link to={createPageUrl(path.link)} className="w-full">
                      <Button className="w-full bg-amber-600 hover:bg-amber-700">
                        Open
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* In Progress Courses */}
        {inProgressCount > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Continue Learning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {progress
                .filter(p => p.status === 'in_progress')
                .slice(0, 3)
                .map(p => {
                  const course = courses.find(c => c.id === p.course_id);
                  return (
                    <Link key={p.id} to={createPageUrl('TrainingAcademy')}>
                      <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <PlayCircle className="w-5 h-5 text-amber-500" />
                          <div>
                            <p className="font-medium text-slate-800">{course?.title}</p>
                            <p className="text-xs text-slate-500">{p.progress_percent}% complete</p>
                          </div>
                        </div>
                        <Progress value={p.progress_percent} className="w-20 h-2" />
                      </div>
                    </Link>
                  );
                })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
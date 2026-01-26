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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Learning Mode</h1>
          <p className="text-slate-600">Build your skills. Earn certifications.</p>
        </motion.div>

        {/* Training Spotlight */}
        {globalInfo?.training_spotlight_video && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white pb-3">
                <CardTitle className="text-xl font-bold">Training Spotlight</CardTitle>
                <p className="text-sm text-slate-300">Learn from leaders. Train with purpose.</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid md:grid-cols-[60%_40%] gap-0">
                  {/* Left: Video */}
                  <div className="aspect-video bg-black">
                    <iframe
                      src={globalInfo.training_spotlight_video.replace('watch?v=', 'embed/').replace('&', '?')}
                      className="w-full h-full"
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  
                  {/* Right: Mission Text */}
                  <div className="p-6 md:p-8 bg-slate-50 flex flex-col justify-center">
                    {globalInfo.training_spotlight_text_variant === 'short' ? (
                      <>
                        <h3 className="text-lg font-bold text-slate-900 mb-4">This is where professionals are built.</h3>
                        <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                          <p className="font-medium">Learn the standards.<br />Master the systems.<br />Earn your place on the floor.</p>
                          <p className="text-slate-900 font-semibold">Growth here is real — and it's earned.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-bold text-slate-900 mb-3">Learning With Purpose</h3>
                        <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                          <p>At Chai Patta, learning is not optional — it's how we grow.</p>
                          <p className="text-xs space-y-1">
                            <span className="block">Every module you complete builds skill.</span>
                            <span className="block">Every standard you master builds trust.</span>
                            <span className="block">Every certificate you earn builds your future.</span>
                          </p>
                          <p className="text-xs italic text-slate-600">
                            This academy exists to turn effort into excellence and team members into leaders.
                          </p>
                          <p className="font-medium text-slate-900">
                            Learn seriously. Apply consistently. Grow intentionally.
                          </p>
                        </div>
                      </>
                    )}
                    <Link to={createPageUrl('TrainingAcademy')} className="mt-5">
                      <Button variant="outline" className="w-full border-slate-300 hover:bg-slate-100 text-sm">
                        Start Your Next Module →
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Progress Overview */}
        <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
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

        {/* Training Paths */}
        {/* CRITICAL: Cards use Button-based navigation - NO full-card Link wrappers */}
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
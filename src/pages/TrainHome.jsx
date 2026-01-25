import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  GraduationCap, 
  Video, 
  BookOpen, 
  Award,
  PlayCircle,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
  Eye,
  PenTool
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function TrainHome() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

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

  // Fetch training documents to sign
  const { data: documents = [] } = useQuery({
    queryKey: ['trainingDocs', user?.id],
    queryFn: () => user?.id
      ? base44.entities.Document.filter({ 
          document_type: 'policy',
          assigned_to: user?.email,
          requires_signature: true 
        })
      : [],
    enabled: !!user?.id
  });

  // Log document view/sign action
  const logActionMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.DocumentSignature.create({
        document_id: data.documentId,
        staff_email: user?.email,
        staff_name: user?.full_name,
        action: data.action, // 'viewed' or 'signed'
        timestamp: new Date().toISOString(),
        ip_address: 'logged' // Placeholder
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingDocs'] });
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

        {/* Onboarding Progress */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-500" />
              Onboarding Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Overall Completion</span>
                <span className="text-sm font-bold text-blue-600">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 bg-slate-50 rounded">
                <p className="text-lg font-bold text-slate-900">{progress.filter(p => p.status === 'not_started').length}</p>
                <p className="text-xs text-slate-600">Not Started</p>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <p className="text-lg font-bold text-blue-600">{inProgressCount}</p>
                <p className="text-xs text-slate-600">In Progress</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded">
                <p className="text-lg font-bold text-emerald-600">{completedCount}</p>
                <p className="text-xs text-slate-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mandatory Training */}
        {courses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-amber-500" />
                Mandatory Training
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {courses.map(course => {
                const courseProgress = progress.find(p => p.course_id === course.id);
                const status = courseProgress?.status || 'not_started';
                const statusColor = {
                  'completed': 'bg-emerald-50 border-l-4 border-l-emerald-500',
                  'in_progress': 'bg-blue-50 border-l-4 border-l-blue-500',
                  'not_started': 'bg-slate-50 border-l-4 border-l-slate-300'
                };

                return (
                  <div key={course.id} className={`p-4 rounded-lg ${statusColor[status]}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{course.title}</p>
                        <p className="text-sm text-slate-600 mt-1">{course.description}</p>
                      </div>
                      <Badge className={
                        status === 'completed' ? 'bg-emerald-500 text-white' :
                        status === 'in_progress' ? 'bg-blue-500 text-white' :
                        'bg-slate-400 text-white'
                      }>
                        {status === 'completed' ? '✓ Completed' : status === 'in_progress' ? '⏳ In Progress' : 'Not Started'}
                      </Badge>
                    </div>
                    {courseProgress && (
                      <Progress value={courseProgress.progress_percent || 0} className="h-1.5 mt-3" />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Policies & SOPs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              Policies & SOPs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-slate-600 mb-4">
              Review and acknowledge key operational procedures
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Standard Operating Procedures</p>
                  <p className="text-sm text-slate-600 mt-1">View all SOPs and procedures</p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link to={createPageUrl('SOPLibrary')}>
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents to Sign */}
        {documents.length > 0 && (
          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-500" />
                Documents to Sign ({documents.filter(d => !d.signed_date).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {documents.map(doc => {
                const signature = doc.signatures?.find(s => s.staff_email === user?.email);
                const isSigned = !!signature?.signed_date;
                const viewedAt = signature?.view_timestamp ? format(new Date(signature.view_timestamp), 'MMM dd, yyyy HH:mm') : null;
                const signedAt = signature?.signed_date ? format(new Date(signature.signed_date), 'MMM dd, yyyy HH:mm') : null;

                return (
                  <div key={doc.id} className={`p-4 rounded-lg border ${isSigned ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{doc.title}</p>
                        {viewedAt && (
                          <p className="text-xs text-slate-600 mt-1">👁️ Viewed: {viewedAt}</p>
                        )}
                        {signedAt && (
                          <p className="text-xs text-emerald-700 mt-1">✓ Signed: {signedAt}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => logActionMutation.mutate({ documentId: doc.id, action: 'viewed' })}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        {!isSigned && (
                          <Button 
                            size="sm" 
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => logActionMutation.mutate({ documentId: doc.id, action: 'signed' })}
                          >
                            <PenTool className="w-3 h-3 mr-1" />
                            Sign
                          </Button>
                        )}
                        {isSigned && (
                          <Badge className="bg-emerald-500 text-white">✓ Signed</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

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
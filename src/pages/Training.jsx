import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addMonths } from 'date-fns';
import {
  GraduationCap,
  CheckCircle,
  Lock,
  Award,
  AlertTriangle,
  ChevronRight,
  BookOpen,
  ClipboardList,
  Download,
  Shield,
  FileText,
  Heart,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import ValuesSection from '../components/training/ValuesSection';
import ReflectionDialog from '../components/training/ReflectionDialog';

const levels = [
  { id: 'Foundation', name: 'Foundation: Culture & Values', fullName: 'Chai Patta Culture & Values', color: 'from-purple-500 to-pink-600', icon: '❤️', description: 'Start here - Required for all staff', passmark: 80 },
  { id: 'L1', name: 'Level 1: Basic Hygiene', fullName: 'Basic Food Hygiene Certificate', color: 'from-blue-500 to-blue-600', icon: '🧼', description: 'Entry level - New starters, FOH, Trainees', passmark: 80 },
  { id: 'L2', name: 'Level 2: Intermediate', fullName: 'Intermediate Food Hygiene', color: 'from-emerald-500 to-emerald-600', icon: '🔬', description: 'Kitchen staff, Shift leaders', passmark: 85 },
  { id: 'L3', name: 'Level 3: Advanced', fullName: 'Advanced Food Safety & Compliance', color: 'from-amber-500 to-amber-600', icon: '⚖️', description: 'Management, Franchise operators', passmark: 90 }
];

export default function Training() {
  const [user, setUser] = useState(null);
  const [activeLevel, setActiveLevel] = useState('Foundation');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCertificate, setShowCertificate] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showReflection, setShowReflection] = useState(false);
  const [completedCourse, setCompletedCourse] = useState(null);

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

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.TrainingCourse.filter({ is_published: true }, 'order'),
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['trainingProgress', user?.email],
    queryFn: () => user?.email 
      ? base44.entities.TrainingProgress.filter({ staff_email: user.email })
      : [],
    enabled: !!user?.email,
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ['certificates', user?.email],
    queryFn: () => user?.email 
      ? base44.entities.Certificate.filter({ staff_email: user.email })
      : [],
    enabled: !!user?.email,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ courseId, data }) => {
      const existing = progress.find(p => p.course_id === courseId);
      if (existing) {
        return base44.entities.TrainingProgress.update(existing.id, data);
      } else {
        return base44.entities.TrainingProgress.create({
          staff_id: user.id || '',
          staff_email: user.email,
          course_id: courseId,
          ...data
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['trainingProgress'])
  });

  const createCertificateMutation = useMutation({
    mutationFn: (data) => base44.entities.Certificate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['certificates']);
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
    }
  });

  const getCourseProgress = (courseId) => progress.find(p => p.course_id === courseId);

  const getLevelCourses = (levelId) => courses.filter(c => c.level === levelId);

  const getLevelProgress = (levelId) => {
    const levelCourses = getLevelCourses(levelId);
    if (levelCourses.length === 0) return 0;
    const completed = levelCourses.filter(c => getCourseProgress(c.id)?.status === 'completed').length;
    return Math.round((completed / levelCourses.length) * 100);
  };

  const isLevelUnlocked = (levelId) => {
    const levelIndex = levels.findIndex(l => l.id === levelId);
    if (levelIndex === 0) return true;
    const previousLevel = levels[levelIndex - 1];
    return getLevelProgress(previousLevel.id) === 100;
  };

  const handleCompleteCourse = async (course) => {
    // Only show reflection for L3 (last level)
    if (course.level === 'L3') {
      setCompletedCourse(course);
      setShowReflection(true);
    } else {
      // For other levels, complete directly without reflection
      await updateProgressMutation.mutateAsync({
        courseId: course.id,
        data: {
          status: 'completed',
          progress_percent: 100,
          completed_date: new Date().toISOString()
        }
      });
      setSelectedCourse(null);
    }
  };

  const handleReflectionSubmit = async (reflectionData) => {
    await base44.entities.TrainingReflection.create({
      staff_id: user.id || '',
      staff_email: user.email,
      staff_name: user.full_name || user.email,
      course_id: completedCourse.id,
      course_title: completedCourse.title,
      course_level: completedCourse.level,
      reflection_date: new Date().toISOString(),
      ...reflectionData
    });

    await updateProgressMutation.mutateAsync({
      courseId: completedCourse.id,
      data: {
        status: 'completed',
        progress_percent: 100,
        completed_date: new Date().toISOString()
      }
    });

    setShowReflection(false);
    setCompletedCourse(null);
    setSelectedCourse(null);
  };

  const handleSubmitQuiz = async (course) => {
    const questions = course.quiz_questions || [];
    let correct = 0;
    questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct_answer) correct++;
    });
    
    const scorePercent = Math.round((correct / questions.length) * 100);
    setQuizScore(scorePercent);
    setQuizSubmitted(true);

    const passed = scorePercent >= (course.pass_mark_percent || 80);

    if (passed) {
      // Only show reflection for L3 (last level)
      if (course.level === 'L3') {
        setCompletedCourse(course);
        setShowReflection(true);
        
        // Store quiz score for later
        await updateProgressMutation.mutateAsync({
          courseId: course.id,
          data: {
            status: 'in_progress',
            progress_percent: 90,
            quiz_score: scorePercent,
            quiz_attempts: (getCourseProgress(course.id)?.quiz_attempts || 0) + 1
          }
        });
      } else {
        // For other levels, complete directly without reflection
        await updateProgressMutation.mutateAsync({
          courseId: course.id,
          data: {
            status: 'completed',
            progress_percent: 100,
            quiz_score: scorePercent,
            quiz_attempts: (getCourseProgress(course.id)?.quiz_attempts || 0) + 1,
            completed_date: new Date().toISOString()
          }
        });

        // Check if level is complete and issue certificate
        const levelCourses = getLevelCourses(course.level);
        const allCompleted = levelCourses.every(c => {
          if (c.id === course.id) return true;
          return getCourseProgress(c.id)?.status === 'completed';
        });
        
        if (allCompleted && !certificates.find(cert => cert.level === course.level)) {
          const certNumber = `CHAIPATTA-${course.level}-${Date.now().toString(36).toUpperCase()}`;
          const levelInfo = levels.find(l => l.id === course.level);
          const issuedDate = format(new Date(), 'yyyy-MM-dd');
          const expiryDate = format(addMonths(new Date(), 12), 'yyyy-MM-dd');
          
          await createCertificateMutation.mutateAsync({
            staff_id: user.id || '',
            staff_name: user.full_name || user.email,
            staff_email: user.email,
            level: course.level,
            level_name: levelInfo?.fullName || course.level,
            issued_date: issuedDate,
            expiry_date: expiryDate,
            certificate_number: certNumber,
            qr_code_data: certNumber,
            quiz_score: scorePercent
          });
        }
      }
    } else {
      await updateProgressMutation.mutateAsync({
        courseId: course.id,
        data: {
          status: 'in_progress',
          progress_percent: 50,
          quiz_score: scorePercent,
          quiz_attempts: (getCourseProgress(course.id)?.quiz_attempts || 0) + 1
        }
      });
    }
  };

  const finalizeQuizCompletion = async (course, scorePercent) => {
    await updateProgressMutation.mutateAsync({
      courseId: course.id,
      data: {
        status: 'completed',
        progress_percent: 100,
        quiz_score: scorePercent,
        completed_date: new Date().toISOString()
      }
    });

    // Check if level is complete
    const levelCourses = getLevelCourses(course.level);
    const allCompleted = levelCourses.every(c => {
      if (c.id === course.id) return true;
      return getCourseProgress(c.id)?.status === 'completed';
    });
    
    if (allCompleted && !certificates.find(cert => cert.level === course.level)) {
      const certNumber = `CHAIPATTA-${course.level}-${Date.now().toString(36).toUpperCase()}`;
      const levelInfo = levels.find(l => l.id === course.level);
      const issuedDate = format(new Date(), 'yyyy-MM-dd');
      const expiryDate = format(addMonths(new Date(), 12), 'yyyy-MM-dd');
      
      await createCertificateMutation.mutateAsync({
        staff_id: user.id || '',
        staff_name: user.full_name || user.email,
        staff_email: user.email,
        level: course.level,
        level_name: levelInfo?.fullName || course.level,
        issued_date: issuedDate,
        expiry_date: expiryDate,
        certificate_number: certNumber,
        qr_code_data: certNumber,
        quiz_score: scorePercent
      });
    }
  };

  const generateCertificatePDF = (certificate) => {
    const doc = new jsPDF();
    
    // Border
    doc.setLineWidth(2);
    doc.rect(10, 10, 190, 277);
    
    // Title
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Chai Patta Training Academy', 105, 40, { align: 'center' });
    
    doc.setFontSize(22);
    doc.text('Certificate of Completion', 105, 55, { align: 'center' });
    
    // Certificate content
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('This is to certify that', 105, 80, { align: 'center' });
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(certificate.staff_name, 105, 95, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('has successfully completed', 105, 110, { align: 'center' });
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(certificate.level_name || certificate.level, 105, 125, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Assessment Score: ${certificate.quiz_score || 'N/A'}%`, 105, 145, { align: 'center' });
    doc.text(`Issued: ${format(new Date(certificate.issued_date), 'MMMM d, yyyy')}`, 105, 160, { align: 'center' });
    doc.text(`Valid Until: ${format(new Date(certificate.expiry_date), 'MMMM d, yyyy')}`, 105, 170, { align: 'center' });
    doc.text(`Certificate ID: ${certificate.certificate_number}`, 105, 185, { align: 'center' });
    
    // Values Badge
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ Values-Aligned Training Completed', 105, 200, { align: 'center' });
    
    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('UK Food Safety Standards Compliant', 105, 250, { align: 'center' });
    doc.text('This certificate demonstrates competency in food hygiene', 105, 260, { align: 'center' });
    
    // Save
    doc.save(`Certificate-${certificate.certificate_number}.pdf`);
  };

  const getLevelCertificate = (levelId) => certificates.find(c => c.level === levelId);
  const isLevelCertified = (levelId) => !!getLevelCertificate(levelId);

  const expiringSoonCerts = certificates.filter(c => {
    const expiry = new Date(c.expiry_date);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  });

  const expiredCerts = certificates.filter(c => new Date(c.expiry_date) < new Date());

  if (isLoading) return <LoadingSpinner message="Loading Training Academy..." />;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/20 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Heart className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">The Chai Patta Academy</h1>
              <p className="text-white/90 text-lg mt-1">More than skills. Values. Standards. Belonging. Growth.</p>
            </div>
          </div>
          <p className="text-white/80 text-base max-w-3xl leading-relaxed">
            Welcome to a learning experience that goes beyond compliance. Here, we build culture, embed values, 
            and grow together as a family. Every course, every reflection, every conversation shapes who we are 
            and how we create Craving Fans.
          </p>
          <div className="flex items-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>Values-First Training</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>UK Food Safety Standards</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span>Professional Certification</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Alerts */}
      {expiredCerts.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Expired Certificates</h3>
                <p className="text-sm text-red-700">
                  {expiredCerts.length} certificate(s) expired. You must retrain to continue working with food.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {expiringSoonCerts.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">Certificates Expiring Soon</h3>
                <p className="text-sm text-amber-700">
                  {expiringSoonCerts.length} certificate(s) expire within 30 days. Plan retraining.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Level Progress Cards */}
      <div className="grid lg:grid-cols-4 gap-4">
        {levels.map((level, index) => {
          const isUnlocked = isLevelUnlocked(level.id);
          const progressPercent = getLevelProgress(level.id);
          const cert = getLevelCertificate(level.id);
          const isExpired = cert && new Date(cert.expiry_date) < new Date();
          
          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => isUnlocked && setActiveLevel(level.id)}
              className={`
                rounded-2xl p-6 cursor-pointer transition-all relative overflow-hidden
                ${activeLevel === level.id 
                  ? 'bg-gradient-to-br ' + level.color + ' text-white shadow-xl scale-[1.02]' 
                  : isUnlocked
                    ? 'bg-white shadow-md border border-slate-200 hover:shadow-lg'
                    : 'bg-slate-100 opacity-60'
                }
              `}
            >
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-2xl">
                  <Lock className="w-10 h-10 text-white" />
                </div>
              )}
              
              <div className="text-4xl mb-3">{level.icon}</div>
              <h3 className={`font-bold text-lg mb-1 ${activeLevel === level.id ? 'text-white' : 'text-slate-800'}`}>
                {level.name}
              </h3>
              <p className={`text-sm mb-3 ${activeLevel === level.id ? 'text-white/80' : 'text-slate-600'}`}>
                {level.description}
              </p>
              
              <div className="mb-2">
                <Progress 
                  value={progressPercent} 
                  className={`h-2 ${activeLevel === level.id ? 'bg-white/30' : ''}`}
                />
                <p className={`text-xs mt-1 ${activeLevel === level.id ? 'text-white/80' : 'text-slate-500'}`}>
                  {progressPercent}% complete • Pass mark: {level.passmark}%
                </p>
              </div>
              
              {cert && (
                <div className="mt-3">
                  <Badge className={isExpired ? 'bg-red-600' : 'bg-emerald-600'}>
                    <Award className="w-3 h-3 mr-1" />
                    {isExpired ? 'Expired' : 'Certified'}
                  </Badge>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Values Section */}
      {(activeLevel === 'Foundation' || activeLevel === 'L1') && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-purple-600" />
              Our Core Values
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ValuesSection compact />
          </CardContent>
        </Card>
      )}

      {/* My Certificates Section */}
      {certificates.length > 0 && (
        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              My Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {certificates.map(cert => {
                const isExpired = new Date(cert.expiry_date) < new Date();
                return (
                  <Card key={cert.id} className={isExpired ? 'border-red-300 bg-red-50' : 'border-emerald-300 bg-white'}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isExpired ? 'bg-red-100' : 'bg-amber-100'
                            }`}>
                              <Award className={`w-5 h-5 ${isExpired ? 'text-red-600' : 'text-amber-600'}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{cert.level_name}</p>
                              <p className="text-xs text-slate-500">{cert.certificate_number}</p>
                            </div>
                          </div>
                          <div className="text-xs space-y-1">
                            <p className="text-slate-600">
                              Issued: {format(new Date(cert.issued_date), 'MMM d, yyyy')}
                            </p>
                            <p className={isExpired ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                              {isExpired ? '❌ Expired' : 'Valid until'}: {format(new Date(cert.expiry_date), 'MMM d, yyyy')}
                            </p>
                            <p className="text-slate-600">Score: {cert.quiz_score}%</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setShowCertificate(cert)}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{levels.find(l => l.id === activeLevel)?.name} Courses</span>
            {isLevelCertified(activeLevel) && (
              <Button
                size="sm"
                onClick={() => setShowCertificate(getLevelCertificate(activeLevel))}
                variant="outline"
              >
                <Award className="w-4 h-4 mr-2" />
                View Certificate
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <AnimatePresence>
            {getLevelCourses(activeLevel).map((course, index) => {
              const courseProgress = getCourseProgress(course.id);
              const isCompleted = courseProgress?.status === 'completed';
              const attempts = courseProgress?.quiz_attempts || 0;
              
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                    ${isCompleted 
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-slate-200 text-slate-500'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : course.content_type === 'quiz' ? (
                      <ClipboardList className="w-6 h-6" />
                    ) : (
                      <BookOpen className="w-6 h-6" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 mb-1">{course.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-1">{course.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {course.duration_minutes && (
                        <span className="text-xs text-slate-400">{course.duration_minutes} min</span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {course.content_type}
                      </Badge>
                      {course.is_mandatory && (
                        <Badge className="bg-red-100 text-red-700 text-xs">Mandatory</Badge>
                      )}
                      {attempts > 0 && (
                        <span className="text-xs text-slate-500">{attempts} attempt(s)</span>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {getLevelCourses(activeLevel).length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No courses available for this level yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Detail Dialog */}
      <Dialog open={!!selectedCourse} onOpenChange={() => {
        setSelectedCourse(null);
        setQuizAnswers({});
        setQuizSubmitted(false);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedCourse && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCourse.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {selectedCourse.content_type === 'quiz' ? (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-1">Assessment</h4>
                      <p className="text-sm text-blue-700">
                        {selectedCourse.quiz_questions?.length} questions • Pass mark: {selectedCourse.pass_mark_percent}%
                      </p>
                    </div>

                    {!quizSubmitted ? (
                      <div className="space-y-4">
                        {(selectedCourse.quiz_questions || []).map((q, idx) => (
                          <Card key={idx}>
                            <CardContent className="pt-4">
                              <p className="font-semibold mb-3">{idx + 1}. {q.question}</p>
                              <div className="space-y-2">
                                {q.options.map((option, optIdx) => (
                                  <label key={optIdx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`question-${idx}`}
                                      checked={quizAnswers[idx] === optIdx}
                                      onChange={() => setQuizAnswers({...quizAnswers, [idx]: optIdx})}
                                      className="w-4 h-4"
                                    />
                                    <span className="text-sm">{option}</span>
                                  </label>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className={quizScore >= (selectedCourse.pass_mark_percent || 80) ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}>
                        <CardContent className="pt-6 text-center">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white flex items-center justify-center">
                            <span className="text-3xl font-bold">{quizScore}%</span>
                          </div>
                          <h3 className="text-xl font-bold mb-2">
                            {quizScore >= (selectedCourse.pass_mark_percent || 80) ? '🎉 Passed!' : '📚 Try Again'}
                          </h3>
                          <p className="text-sm">
                            {quizScore >= (selectedCourse.pass_mark_percent || 80) 
                              ? 'Congratulations! You passed the assessment.' 
                              : `You need ${selectedCourse.pass_mark_percent}% to pass. Review the material and try again.`}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => {
                        setSelectedCourse(null);
                        setQuizAnswers({});
                        setQuizSubmitted(false);
                      }}>
                        {quizSubmitted ? 'Close' : 'Cancel'}
                      </Button>
                      {!quizSubmitted && (
                        <Button 
                          onClick={() => handleSubmitQuiz(selectedCourse)}
                          disabled={Object.keys(quizAnswers).length !== (selectedCourse.quiz_questions?.length || 0)}
                          className="bg-gradient-to-r from-blue-600 to-blue-700"
                        >
                          Submit Assessment
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="prose prose-sm max-w-none">
                      {selectedCourse.image_url && (
                        <img 
                          src={selectedCourse.image_url} 
                          alt={selectedCourse.title}
                          className="w-full h-48 object-cover rounded-xl mb-4"
                        />
                      )}
                      <div dangerouslySetInnerHTML={{ __html: selectedCourse.content?.replace(/\n/g, '<br/>') }} />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button variant="outline" onClick={() => setSelectedCourse(null)}>
                        Close
                      </Button>
                      <Button 
                        onClick={() => handleCompleteCourse(selectedCourse)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Complete & Reflect
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reflection Dialog */}
      <ReflectionDialog
        course={completedCourse}
        user={user}
        open={showReflection}
        onClose={() => {
          setShowReflection(false);
          setCompletedCourse(null);
          if (quizSubmitted && quizScore >= (completedCourse?.pass_mark_percent || 80)) {
            finalizeQuizCompletion(completedCourse, quizScore);
          }
        }}
        onSubmit={async (reflectionData) => {
          await handleReflectionSubmit(reflectionData);
          if (quizSubmitted && quizScore >= (completedCourse?.pass_mark_percent || 80)) {
            await finalizeQuizCompletion(completedCourse, quizScore);
          }
        }}
      />

      {/* Certificate Dialog */}
      <Dialog open={!!showCertificate} onOpenChange={() => setShowCertificate(null)}>
        <DialogContent className="max-w-md">
          {showCertificate && (
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Award className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Certificate of Completion</h2>
              <p className="text-slate-600 mb-1 font-semibold">{showCertificate.level_name}</p>
              <p className="text-sm text-slate-500 mb-4">UK Food Safety Standards</p>
              
              <Card className="text-left mb-4">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Name:</span>
                    <span className="font-semibold">{showCertificate.staff_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Issued:</span>
                    <span className="font-semibold">{format(new Date(showCertificate.issued_date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Expires:</span>
                    <span className="font-semibold">{format(new Date(showCertificate.expiry_date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Score:</span>
                    <span className="font-semibold">{showCertificate.quiz_score}%</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-slate-500 mb-1">Certificate ID:</p>
                    <p className="font-mono text-xs font-semibold">{showCertificate.certificate_number}</p>
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={() => generateCertificatePDF(showCertificate)}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF Certificate
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
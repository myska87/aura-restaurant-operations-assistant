import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  GraduationCap,
  Play,
  CheckCircle,
  Lock,
  Award,
  MessageSquare,
  Sparkles,
  RotateCcw,
  ChevronRight,
  BookOpen,
  Video,
  ClipboardList,
  Star,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import confetti from 'canvas-confetti';

const levels = [
  { id: 'culture', name: 'Culture', color: 'from-purple-500 to-purple-600', icon: '🌟' },
  { id: 'L1', name: 'Level 1', color: 'from-blue-500 to-blue-600', icon: '📚' },
  { id: 'L2', name: 'Level 2', color: 'from-emerald-500 to-emerald-600', icon: '🚀' },
  { id: 'L3', name: 'Level 3', color: 'from-amber-500 to-amber-600', icon: '👑' }
];

export default function Training() {
  const [user, setUser] = useState(null);
  const [activeLevel, setActiveLevel] = useState('culture');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showCertificate, setShowCertificate] = useState(null);
  const [reflection, setReflection] = useState('');

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
    queryFn: () => base44.entities.TrainingCourse.list('order'),
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

  const { data: posts = [] } = useQuery({
    queryKey: ['trainingPosts'],
    queryFn: () => base44.entities.TrainingPost.list('-created_date', 10),
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
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  });

  const getCourseProgress = (courseId) => {
    return progress.find(p => p.course_id === courseId);
  };

  const getLevelCourses = (levelId) => {
    return courses.filter(c => c.level === levelId);
  };

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
    await updateProgressMutation.mutateAsync({
      courseId: course.id,
      data: {
        status: 'completed',
        progress_percent: 100,
        completed_date: new Date().toISOString(),
        reflection_response: reflection
      }
    });
    
    // Check if level is complete
    const levelCourses = getLevelCourses(course.level);
    const allCompleted = levelCourses.every(c => {
      if (c.id === course.id) return true;
      return getCourseProgress(c.id)?.status === 'completed';
    });
    
    if (allCompleted && !certificates.find(c => c.level === course.level)) {
      const certNumber = `AURA-${course.level.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      await createCertificateMutation.mutateAsync({
        staff_id: user.id || '',
        staff_name: user.full_name || user.email,
        staff_email: user.email,
        level: course.level,
        issued_date: format(new Date(), 'yyyy-MM-dd'),
        certificate_number: certNumber,
        qr_code_data: certNumber
      });
    }
    
    setSelectedCourse(null);
    setReflection('');
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setChatLoading(true);
    
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are AURA's AI Training Mentor. You help restaurant staff with their training questions.
        Be encouraging, helpful, and professional. Keep responses concise but informative.
        
        User question: ${userMessage}
        
        Context: This is for restaurant staff training covering culture, service excellence, and operational procedures.`,
      });
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'I apologize, I encountered an error. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleResetProgress = async () => {
    if (!confirm('This will reset all your learning progress. Certificates will be kept. Continue?')) return;
    
    for (const p of progress) {
      await base44.entities.TrainingProgress.delete(p.id);
    }
    queryClient.invalidateQueries(['trainingProgress']);
  };

  if (isLoading) return <LoadingSpinner message="Loading Training Academy..." />;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 rounded-3xl p-8 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/20 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="w-10 h-10" />
            <h1 className="text-3xl font-bold">Training Academy</h1>
          </div>
          <p className="text-purple-100 text-lg max-w-2xl mb-6">
            "We create Craving Fans — not just customers."
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => setShowChatbot(true)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              AI Training Mentor
            </Button>
            <Button 
              variant="outline"
              onClick={handleResetProgress}
              className="border-white/30 text-white hover:bg-white/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Learning
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Level Progress Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {levels.map((level, index) => {
          const isUnlocked = isLevelUnlocked(level.id);
          const progressPercent = getLevelProgress(level.id);
          const hasCert = certificates.find(c => c.level === level.id);
          
          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => isUnlocked && setActiveLevel(level.id)}
              className={`
                rounded-2xl p-5 cursor-pointer transition-all relative overflow-hidden
                ${activeLevel === level.id 
                  ? 'bg-gradient-to-br ' + level.color + ' text-white shadow-lg scale-[1.02]' 
                  : isUnlocked
                    ? 'bg-white shadow-sm border border-slate-100 hover:shadow-md'
                    : 'bg-slate-100 opacity-60'
                }
              `}
            >
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-2xl">
                  <Lock className="w-8 h-8 text-white" />
                </div>
              )}
              
              <div className="text-3xl mb-2">{level.icon}</div>
              <h3 className={`font-bold text-lg ${activeLevel === level.id ? 'text-white' : 'text-slate-800'}`}>
                {level.name}
              </h3>
              <Progress 
                value={progressPercent} 
                className={`h-2 mt-3 ${activeLevel === level.id ? 'bg-white/30' : ''}`}
              />
              <p className={`text-sm mt-2 ${activeLevel === level.id ? 'text-white/80' : 'text-slate-500'}`}>
                {progressPercent}% complete
              </p>
              
              {hasCert && (
                <Award 
                  className="absolute top-3 right-3 w-6 h-6 text-amber-400 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setShowCertificate(hasCert); }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Course List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {levels.find(l => l.id === activeLevel)?.name} Courses
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          <AnimatePresence>
            {getLevelCourses(activeLevel).map((course, index) => {
              const courseProgress = getCourseProgress(course.id);
              const isCompleted = courseProgress?.status === 'completed';
              const isInProgress = courseProgress?.status === 'in_progress';
              
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
                    w-12 h-12 rounded-xl flex items-center justify-center
                    ${isCompleted 
                      ? 'bg-emerald-100 text-emerald-600'
                      : isInProgress
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-slate-200 text-slate-500'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : course.content_type === 'video' ? (
                      <Video className="w-6 h-6" />
                    ) : course.content_type === 'quiz' ? (
                      <ClipboardList className="w-6 h-6" />
                    ) : (
                      <BookOpen className="w-6 h-6" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{course.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-1">{course.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {course.duration_minutes && (
                        <span className="text-xs text-slate-400">{course.duration_minutes} min</span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {course.content_type}
                      </Badge>
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
        </div>
      </div>

      {/* Posts Feed */}
      {posts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Inspiration & Updates</h2>
          <div className="space-y-4">
            {posts.slice(0, 3).map((post) => (
              <div key={post.id} className="p-4 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3 mb-2">
                  {post.is_ai_generated && <Sparkles className="w-4 h-4 text-amber-500" />}
                  <Badge variant="outline">{post.category}</Badge>
                </div>
                <h3 className="font-semibold text-slate-800">{post.title}</h3>
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{post.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Detail Dialog */}
      <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedCourse && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCourse.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {selectedCourse.video_url && (
                  <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center">
                    <Play className="w-16 h-16 text-white/50" />
                  </div>
                )}
                
                <div className="prose prose-sm max-w-none">
                  <p>{selectedCourse.content || selectedCourse.description}</p>
                </div>
                
                {selectedCourse.reflection_prompt && (
                  <div className="bg-purple-50 rounded-xl p-4">
                    <h4 className="font-semibold text-purple-800 mb-2">Reflection</h4>
                    <p className="text-sm text-purple-600 mb-3">{selectedCourse.reflection_prompt}</p>
                    <Textarea
                      placeholder="Write your reflection..."
                      value={reflection}
                      onChange={(e) => setReflection(e.target.value)}
                      rows={4}
                    />
                  </div>
                )}
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setSelectedCourse(null)}>
                    Close
                  </Button>
                  <Button 
                    onClick={() => handleCompleteCourse(selectedCourse)}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Chatbot Dialog */}
      <Dialog open={showChatbot} onOpenChange={setShowChatbot}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              AI Training Mentor
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-80 border rounded-xl p-4 mb-4">
            {chatMessages.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Ask me anything about your training!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {chatMessages.map((msg, i) => (
                  <div 
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`
                      max-w-[80%] rounded-2xl px-4 py-2
                      ${msg.role === 'user' 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-100 text-slate-700'
                      }
                    `}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl px-4 py-2 text-slate-400">
                      Thinking...
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
          
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask a question..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleChatSubmit())}
              rows={2}
              className="resize-none"
            />
            <Button 
              onClick={handleChatSubmit}
              disabled={chatLoading || !chatInput.trim()}
              className="bg-gradient-to-r from-amber-500 to-amber-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Certificate Dialog */}
      <Dialog open={!!showCertificate} onOpenChange={() => setShowCertificate(null)}>
        <DialogContent className="max-w-md">
          {showCertificate && (
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Award className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Certificate of Completion</h2>
              <p className="text-slate-600 mb-4">{levels.find(l => l.id === showCertificate.level)?.name}</p>
              <p className="font-semibold text-lg text-slate-800">{showCertificate.staff_name}</p>
              <p className="text-sm text-slate-500 mt-2">
                Issued: {format(new Date(showCertificate.issued_date), 'MMMM d, yyyy')}
              </p>
              <div className="mt-4 p-3 bg-slate-100 rounded-lg">
                <p className="text-xs text-slate-500">Certificate ID</p>
                <p className="font-mono text-sm font-semibold">{showCertificate.certificate_number}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
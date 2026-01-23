import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Circle, Lock, Rocket, FileText, Award, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function OnboardingFlow() {
  const [user, setUser] = useState(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      
      await base44.entities.ComplianceLog.create({
        user_id: userData.id,
        user_name: userData.full_name,
        user_email: userData.email,
        user_role: userData.role,
        action_type: 'onboarding_started',
        action_description: 'User began onboarding process',
        action_timestamp: new Date().toISOString()
      });
    };
    loadUser();
  }, []);

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ['onboardingTasks'],
    queryFn: async () => {
      const tasks = await base44.entities.OnboardingTask.filter({ is_active: true }, 'order_index');
      return tasks.filter(task => 
        task.target_roles.includes('all') || 
        task.target_roles.includes(user?.role) ||
        (user?.position?.toLowerCase().includes('chef') && task.target_roles.includes('chef')) ||
        (user?.position?.toLowerCase().includes('foh') && task.target_roles.includes('foh'))
      );
    },
    enabled: !!user
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['userTaskCompletions', user?.id],
    queryFn: () => base44.entities.UserTaskCompletion.filter({ user_id: user?.id }),
    enabled: !!user
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      
      await base44.entities.UserTaskCompletion.create({
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        task_id: taskData.task_id,
        task_title: taskData.task_title,
        completed: true,
        completed_date: new Date().toISOString(),
        time_spent_seconds: timeSpent,
        signature_given: taskData.requires_signature && hasAgreed,
        signature_date: taskData.requires_signature && hasAgreed ? new Date().toISOString() : null
      });

      await base44.entities.ComplianceLog.create({
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        user_role: user.role,
        action_type: 'task_completed',
        action_description: `Completed: ${taskData.task_title}`,
        reference_id: taskData.task_id,
        reference_name: taskData.task_title,
        action_timestamp: new Date().toISOString()
      });

      if (taskData.linked_document_id) {
        await base44.entities.DocumentAcknowledgement.create({
          user_id: user.id,
          user_name: user.full_name,
          user_email: user.email,
          document_id: taskData.linked_document_id,
          document_title: taskData.linked_document_name,
          viewed: true,
          viewed_date: new Date().toISOString(),
          scrolled_to_bottom: scrolledToBottom,
          acknowledged: hasAgreed,
          acknowledged_date: hasAgreed ? new Date().toISOString() : null,
          signed: hasAgreed,
          signed_date: hasAgreed ? new Date().toISOString() : null,
          signature_text: 'I confirm I have read and understood this document'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userTaskCompletions']);
      setScrolledToBottom(false);
      setHasAgreed(false);
      setStartTime(Date.now());
      
      if (currentTaskIndex < allTasks.length - 1) {
        setCurrentTaskIndex(currentTaskIndex + 1);
      }
    }
  });

  const finishOnboardingMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.updateMe({ onboarding_completed: true });
      await base44.entities.ComplianceLog.create({
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        user_role: user.role,
        action_type: 'onboarding_completed',
        action_description: 'User completed full onboarding process',
        action_timestamp: new Date().toISOString()
      });
    },
    onSuccess: () => {
      navigate(createPageUrl('Dashboard'));
    }
  });

  const handleScroll = (e) => {
    const element = e.target;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    if (isAtBottom) setScrolledToBottom(true);
  };

  if (isLoading || !user) return <LoadingSpinner message="Loading onboarding..." />;

  const currentTask = allTasks[currentTaskIndex];
  const completedCount = completions.filter(c => c.completed).length;
  const progressPercent = (completedCount / allTasks.length) * 100;
  const isTaskCompleted = completions.find(c => c.task_id === currentTask?.id && c.completed);

  const taskIcons = {
    app_intro: Rocket,
    values: Award,
    hygiene_training: Shield,
    document_reading: FileText,
    sop_acknowledgement: FileText,
    custom: Circle
  };

  const canProceed = () => {
    if (!currentTask) return true;
    if (currentTask.requires_signature) {
      return scrolledToBottom && hasAgreed;
    }
    return scrolledToBottom || !currentTask.content;
  };

  const allCompleted = completedCount === allTasks.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6 border-2 border-emerald-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Welcome to AURA, {user.full_name}! 🎉</CardTitle>
                <p className="text-slate-600 mt-1">Complete these tasks to unlock full app access</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 text-lg px-4 py-2">
                {completedCount} / {allTasks.length}
              </Badge>
            </div>
            <Progress value={progressPercent} className="mt-4 h-3" />
          </CardHeader>
        </Card>

        {allCompleted ? (
          <Card className="border-2 border-green-300 bg-green-50">
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">Onboarding Complete! 🎊</h2>
              <p className="text-slate-700 mb-6">You're all set to use the AURA system</p>
              <Button onClick={() => finishOnboardingMutation.mutate()} size="lg" className="bg-green-600 hover:bg-green-700">
                Enter Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {allTasks.map((task, idx) => {
                const TaskIcon = taskIcons[task.task_type];
                const isCompleted = completions.find(c => c.task_id === task.id && c.completed);
                const isCurrent = idx === currentTaskIndex;
                
                return (
                  <Card key={task.id} className={`${isCurrent ? 'border-2 border-emerald-500' : ''} ${isCompleted ? 'bg-green-50' : ''}`}>
                    <CardContent className="pt-4 text-center">
                      {isCompleted ? (
                        <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      ) : isCurrent ? (
                        <TaskIcon className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      ) : (
                        <Lock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      )}
                      <p className="text-xs font-medium">{task.task_title}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {currentTask && !isTaskCompleted && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {React.createElement(taskIcons[currentTask.task_type], { className: "w-6 h-6" })}
                    {currentTask.task_title}
                  </CardTitle>
                  <p className="text-sm text-slate-600">{currentTask.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentTask.content && (
                    <ScrollArea className="h-96 border rounded-lg p-4" onScrollCapture={handleScroll}>
                      <div dangerouslySetInnerHTML={{ __html: currentTask.content }} />
                    </ScrollArea>
                  )}

                  {currentTask.video_url && (
                    <div>
                      <iframe
                        src={currentTask.video_url}
                        className="w-full h-64 rounded-lg"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {currentTask.external_url && (
                    <Button variant="outline" className="w-full" onClick={() => window.open(currentTask.external_url, '_blank')}>
                      Open External Training
                    </Button>
                  )}

                  {currentTask.requires_signature && (
                    <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={hasAgreed} onCheckedChange={setHasAgreed} id="agree" />
                        <label htmlFor="agree" className="text-sm font-medium cursor-pointer">
                          I confirm I have read and understood the above
                        </label>
                      </div>
                      {!scrolledToBottom && currentTask.content && (
                        <p className="text-xs text-amber-700">⚠️ Please scroll to the bottom to continue</p>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={() => completeTaskMutation.mutate(currentTask)}
                    disabled={!canProceed() || completeTaskMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {currentTask.requires_signature ? 'Sign & Continue' : 'Mark as Complete'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
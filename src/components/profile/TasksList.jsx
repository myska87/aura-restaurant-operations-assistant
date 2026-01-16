import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, AlertCircle, Clock } from 'lucide-react';
import { format, isPast } from 'date-fns';

export default function TasksList({ user, staffProfile }) {
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['myTasks', user?.email],
    queryFn: () => base44.entities.Task.filter({ assigned_to: user.email }, 'due_date', 50),
    enabled: !!user?.email
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['myTasks'])
  });

  const handleComplete = (task) => {
    completeMutation.mutate({
      id: task.id,
      data: {
        status: 'completed',
        completed_date: new Date().toISOString()
      }
    });
  };

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const priorityColors = {
    urgent: 'bg-red-100 text-red-700 border-red-300',
    high: 'bg-orange-100 text-orange-700 border-orange-300',
    medium: 'bg-amber-100 text-amber-700 border-amber-300',
    low: 'bg-slate-100 text-slate-700 border-slate-300'
  };

  return (
    <div className="space-y-4">
      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Circle className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">To Do ({pendingTasks.length})</h3>
            </div>
            <div className="space-y-2">
              {pendingTasks.map(task => {
                const isOverdue = task.due_date && isPast(new Date(task.due_date));
                return (
                  <div key={task.id} className={`p-3 rounded-lg border-2 ${
                    isOverdue ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleComplete(task)}
                        className="mt-1 flex-shrink-0"
                        disabled={completeMutation.isPending}
                      >
                        <Circle className="w-5 h-5 text-slate-400 hover:text-emerald-600 transition-colors" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className={priorityColors[task.priority]}>
                            {task.priority}
                          </Badge>
                          {task.category && (
                            <Badge variant="outline">{task.category}</Badge>
                          )}
                          {task.due_date && (
                            <Badge variant="outline" className={isOverdue ? 'border-red-300 text-red-700' : ''}>
                              <Clock className="w-3 h-3 mr-1" />
                              {format(new Date(task.due_date), 'MMM d')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold">Completed ({completedTasks.length})</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {completedTasks.slice(0, 5).map(task => (
                <div key={task.id} className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium line-through text-slate-600">{task.title}</p>
                      {task.completed_date && (
                        <p className="text-xs text-slate-500">
                          Completed {format(new Date(task.completed_date), 'MMM d')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tasks.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No tasks assigned</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
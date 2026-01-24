import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, ChefHat } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PREP_CHECKLIST_TEMPLATE = [
  {
    category: '🍛 Main Kitchen',
    items: [
      'Mother Curry Base ready',
      'Chicken Tikka marinated',
      'Proteins portioned (paneer, lamb, prawn, chicken)',
      'Sauces portioned (tikka, korma, makhani, masala)',
      'Rice pre-cooked and labeled',
      'Veg chopped and stored properly',
      'Garnish section stocked',
      'Fryer oil checked & filtered',
      'Stock of naan dough ready'
    ]
  },
  {
    category: '🥐 Pastry & Bakery',
    items: [
      'Croissants baked or thawed',
      'Pastries displayed and labeled',
      'Cakes sliced and covered',
      'Chiller temperature recorded'
    ]
  },
  {
    category: '☕ Drinks & Chai Station',
    items: [
      'Chai base prepared (Karak, Indian, Masala)',
      'Milk and syrups refilled',
      'Ice stock checked',
      'Cups and lids stocked',
      'Blender, grinder, and urn cleaned and ready'
    ]
  },
  {
    category: '🍴 Front-of-House',
    items: [
      'POS working and tested',
      'Cutlery, napkins, packaging ready',
      'Staff briefed on specials and shortages'
    ]
  }
];

export default function PrepStageChecklist({ user, shift, date }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  // Initialize tasks from template
  useEffect(() => {
    const initialTasks = PREP_CHECKLIST_TEMPLATE.flatMap((category) =>
      category.items.map((item, idx) => ({
        task_id: `${category.category}-${idx}`,
        category: category.category,
        task_name: item,
        completed: false,
        completed_at: null,
        notes: ''
      }))
    );
    setTasks(initialTasks);
  }, []);

  // Fetch existing prep log for today
  const { data: existingLog } = useQuery({
    queryKey: ['prepChecklistLog', date, shift],
    queryFn: async () => {
      const logs = await base44.entities.PrepChecklistLog.filter({
        date,
        shift,
        user_email: user?.email
      }, '-created_date', 1);
      return logs[0] || null;
    },
    enabled: !!user?.email && !!date && !!shift
  });

  // Load existing log data
  useEffect(() => {
    if (existingLog?.tasks) {
      setTasks(existingLog.tasks);
      setNotes(existingLog.notes || '');
    }
  }, [existingLog]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingLog?.id) {
        return await base44.entities.PrepChecklistLog.update(existingLog.id, data);
      } else {
        return await base44.entities.PrepChecklistLog.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prepChecklistLog'] });
    }
  });

  // Auto-save on task change
  useEffect(() => {
    if (tasks.length > 0 && user?.email) {
      const timer = setTimeout(() => {
        const completed = tasks.filter(t => t.completed).length;
        const total = tasks.length;
        const percentage = Math.round((completed / total) * 100);

        saveMutation.mutate({
          date,
          shift,
          user_id: user?.id,
          user_name: user?.full_name,
          user_email: user?.email,
          tasks,
          completion_percentage: percentage,
          status: percentage === 100 ? 'completed' : 'in_progress',
          completed_at: percentage === 100 ? new Date().toISOString() : null
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [tasks, user, date, shift]);

  const handleToggleTask = (taskId) => {
    setTasks(prev =>
      prev.map(task =>
        task.task_id === taskId
          ? {
              ...task,
              completed: !task.completed,
              completed_at: !task.completed ? new Date().toISOString() : null
            }
          : task
      )
    );
  };

  const handleMarkComplete = async () => {
    const incomplete = tasks.filter(t => !t.completed);
    if (incomplete.length > 0) {
      toast.error(`${incomplete.length} tasks remaining. Complete all before marking as done.`);
      return;
    }

    const data = {
      date,
      shift,
      user_id: user?.id,
      user_name: user?.full_name,
      user_email: user?.email,
      tasks,
      completion_percentage: 100,
      status: 'completed',
      completed_at: new Date().toISOString(),
      manager_notified: true
    };

    try {
      if (existingLog?.id) {
        await base44.entities.PrepChecklistLog.update(existingLog.id, data);
      } else {
        await base44.entities.PrepChecklistLog.create(data);
      }

      // Notify manager
      await base44.integrations.Core.SendEmail({
        to: 'manager@restaurant.com',
        subject: `✅ Prep Completed - ${shift} Shift`,
        body: `${user?.full_name} has completed all prep tasks for ${shift} shift on ${date}.\n\nAll items are ready for service.`
      });

      toast.success('🎉 Prep completed! Manager notified.');
      queryClient.invalidateQueries({ queryKey: ['prepChecklistLog'] });
    } catch (error) {
      toast.error('Failed to complete prep checklist');
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = percentage === 100;

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg mb-4">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-green-100/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-green-800">🧑‍🍳 Preparation Before Service</h3>
            <p className="text-sm text-green-600">
              {completedCount} / {totalCount} tasks complete ({percentage}%)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isComplete ? (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          ) : (
            <AlertCircle className="w-6 h-6 text-amber-500" />
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-green-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-green-600" />
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 pb-2">
        <div className="w-full h-2 bg-green-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
          />
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {PREP_CHECKLIST_TEMPLATE.map((category) => {
                const categoryTasks = tasks.filter(t => t.category === category.category);
                const categoryComplete = categoryTasks.filter(t => t.completed).length;

                return (
                  <div key={category.category} className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
                    <h4 className="font-bold text-green-800 mb-3 flex items-center justify-between">
                      <span>{category.category}</span>
                      <span className="text-sm text-green-600">
                        {categoryComplete} / {categoryTasks.length}
                      </span>
                    </h4>
                    <div className="space-y-2">
                      {categoryTasks.map((task) => (
                        <div
                          key={task.task_id}
                          className="flex items-center gap-3 p-2 hover:bg-green-50 rounded-md transition-colors"
                        >
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => handleToggleTask(task.task_id)}
                            className="border-green-400"
                          />
                          <span
                            className={`text-sm ${
                              task.completed
                                ? 'line-through text-green-600'
                                : 'text-slate-700 font-medium'
                            }`}
                          >
                            {task.task_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Notes */}
              <div>
                <label className="text-sm font-semibold text-green-800 mb-2 block">
                  Additional Notes
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any prep notes or issues..."
                  className="border-green-200 focus:border-green-400"
                  rows={3}
                />
              </div>

              {/* Mark Complete Button */}
              <Button
                onClick={handleMarkComplete}
                disabled={!isComplete}
                className={`w-full py-6 text-lg font-bold ${
                  isComplete
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                {isComplete ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Mark Prep Complete & Notify Manager
                  </>
                ) : (
                  <>
                    Complete all tasks to finish ({completedCount}/{totalCount})
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
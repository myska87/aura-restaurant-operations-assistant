import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChefHat, Sparkles, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PREP_TEMPLATE = [
  { category: '🍛 Main Kitchen', items: ['Mother Curry Base ready', 'Chicken Tikka marinated', 'Proteins portioned', 'Sauces portioned', 'Rice pre-cooked and labeled', 'Veg chopped and stored', 'Garnish section stocked', 'Fryer oil checked', 'Stock of naan dough ready'] },
  { category: '🥐 Pastry & Bakery', items: ['Croissants baked or thawed', 'Pastries displayed and labeled', 'Cakes sliced and covered', 'Chiller temperature recorded'] },
  { category: '☕ Drinks & Chai Station', items: ['Chai base prepared', 'Milk and syrups refilled', 'Ice stock checked', 'Cups and lids stocked', 'Equipment cleaned and ready'] },
  { category: '🍴 Front-of-House', items: ['POS working and tested', 'Cutlery, napkins, packaging ready', 'Staff briefed on specials'] }
];

const HYGIENE_TEMPLATE = [
  { category: '🧼 General Hygiene', items: ['All surfaces sanitized', 'Floors mopped and clean', 'Bins emptied and clean', 'Hand wash stations stocked', 'Staff in clean uniforms'] },
  { category: '🍴 Food Safety', items: ['All food covered and labeled', 'Cold chain maintained', 'Hot food above 63°C', 'Raw and cooked food separated', 'Allergen procedures followed'] },
  { category: '🧴 Cleaning Records', items: ['Daily cleaning log signed', 'Deep clean schedule checked', 'Pest control up to date', 'Waste segregation correct'] }
];

function ChecklistForm({ type, template, user, shift, date, onComplete, isExpanded, onToggle }) {
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState('');
  const [autoCollapseTimer, setAutoCollapseTimer] = useState(null);
  const queryClient = useQueryClient();

  const icon = type === 'prep' ? ChefHat : Sparkles;
  const title = type === 'prep' ? '🧑‍🍳 Prep Before Service' : '🧼 Hygiene Check';
  const color = type === 'prep' ? 'green' : 'blue';

  // Initialize tasks
  useEffect(() => {
    const initialTasks = template.flatMap((cat) =>
      cat.items.map((item, idx) => ({
        task_id: `${cat.category}-${idx}`,
        category: cat.category,
        task_name: item,
        completed: false,
        completed_at: null
      }))
    );
    setTasks(initialTasks);
  }, [template]);

  // Fetch existing log
  const { data: existingLog } = useQuery({
    queryKey: ['serviceReadiness', type, date, shift],
    queryFn: async () => {
      const logs = await base44.entities.ChecklistCompletion.filter({
        date,
        shift,
        user_email: user?.email,
        checklist_category: type
      }, '-created_date', 1);
      return logs[0] || null;
    },
    enabled: !!user?.email && !!date && !!shift
  });

  useEffect(() => {
    if (existingLog?.answers) {
      const loadedTasks = tasks.map(task => {
        const answer = existingLog.answers.find(a => a.item_id === task.task_id);
        return answer ? { ...task, completed: answer.answer === 'yes', completed_at: answer.timestamp } : task;
      });
      setTasks(loadedTasks);
      setNotes(existingLog.notes || '');
    }
  }, [existingLog]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingLog?.id) {
        return await base44.entities.ChecklistCompletion.update(existingLog.id, data);
      } else {
        return await base44.entities.ChecklistCompletion.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceReadiness'] });
      queryClient.invalidateQueries({ queryKey: ['completions'] });
    }
  });

  const handleToggleTask = (taskId) => {
    setTasks(prev =>
      prev.map(task =>
        task.task_id === taskId
          ? { ...task, completed: !task.completed, completed_at: !task.completed ? new Date().toISOString() : null }
          : task
      )
    );
  };

  const handleSubmit = async () => {
    const incomplete = tasks.filter(t => !t.completed);
    if (incomplete.length > 0) {
      toast.error(`${incomplete.length} tasks remaining`);
      return;
    }

    const answers = tasks.map(task => ({
      item_id: task.task_id,
      question_text: task.task_name,
      question_type: 'yes_no_na',
      answer: task.completed ? 'yes' : 'no',
      notes: '',
      timestamp: task.completed_at || new Date().toISOString()
    }));

    const data = {
      checklist_id: `${type}-checklist`,
      checklist_name: title,
      checklist_category: type,
      date,
      shift,
      user_id: user?.id,
      user_name: user?.full_name,
      user_email: user?.email,
      answers,
      completion_percentage: 100,
      status: 'completed',
      completed_at: new Date().toISOString(),
      notes
    };

    try {
      if (existingLog?.id) {
        await base44.entities.ChecklistCompletion.update(existingLog.id, data);
      } else {
        await base44.entities.ChecklistCompletion.create(data);
      }

      // Fetch manager info and notify
      const globalInfos = await base44.entities.GlobalInfo.list();
      const globalInfo = globalInfos[0];
      const managerEmail = globalInfo?.manager_email;
      
      if (managerEmail) {
        try {
          await base44.integrations.Core.SendEmail({
            to: managerEmail,
            subject: `✅ ${title} Completed - ${shift} Shift`,
            body: `${user?.full_name} completed ${title} for ${shift} shift on ${date}.\n\nAll items verified and ready.`
          });
        } catch (error) {
          console.error('Email error:', error);
        }
      }

      toast.success(`🎉 ${title} Complete!`);
      queryClient.invalidateQueries();
      onComplete();

      // Auto-collapse after 5 seconds
      const timer = setTimeout(() => {
        onToggle();
      }, 5000);
      setAutoCollapseTimer(timer);
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  useEffect(() => {
    return () => {
      if (autoCollapseTimer) clearTimeout(autoCollapseTimer);
    };
  }, [autoCollapseTimer]);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = percentage === 100 && existingLog?.status === 'completed';

  const Icon = icon;

  return (
    <div>
      <Button
        onClick={onToggle}
        disabled={isComplete}
        className={`w-full h-16 text-lg font-bold shadow-lg transition-all ${
          isComplete
            ? `bg-gradient-to-r from-${color}-600 to-${color}-700 text-white`
            : `bg-gradient-to-r from-${color}-500 to-${color}-600 hover:from-${color}-600 hover:to-${color}-700 text-white`
        }`}
      >
        <Icon className="w-6 h-6 mr-3" />
        {isComplete ? (
          <>
            <CheckCircle2 className="w-5 h-5 mr-2" />
            {title} - Completed ✅ 100%
          </>
        ) : (
          <>
            {title} ({completedCount}/{totalCount})
            {isExpanded ? <ChevronUp className="ml-auto w-5 h-5" /> : <ChevronDown className="ml-auto w-5 h-5" />}
          </>
        )}
      </Button>

      <AnimatePresence>
        {isExpanded && !isComplete && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className={`mt-2 border-2 border-${color}-200 bg-${color}-50/50`}>
              <div className="p-4 space-y-4">
                {template.map((category) => {
                  const categoryTasks = tasks.filter(t => t.category === category.category);
                  const categoryComplete = categoryTasks.filter(t => t.completed).length;

                  return (
                    <div key={category.category} className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="font-bold text-slate-800 mb-3 flex justify-between">
                        <span>{category.category}</span>
                        <span className="text-sm text-slate-600">{categoryComplete}/{categoryTasks.length}</span>
                      </h4>
                      <div className="space-y-2">
                        {categoryTasks.map((task) => (
                          <div key={task.task_id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => handleToggleTask(task.task_id)}
                            />
                            <span className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-700'}`}>
                              {task.task_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                  className="border-slate-200"
                />

                <Button
                  onClick={handleSubmit}
                  disabled={completedCount < totalCount}
                  className={`w-full py-6 text-lg font-bold ${
                    completedCount === totalCount
                      ? `bg-gradient-to-r from-${color}-600 to-${color}-700 hover:from-${color}-700 hover:to-${color}-800`
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  {completedCount === totalCount ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Submit & Notify Manager
                    </>
                  ) : (
                    `Complete all tasks (${completedCount}/${totalCount})`
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ServiceReadinessPanel({ user, shift, date }) {
  const [expandedForm, setExpandedForm] = useState(null);

  const { data: prepLog } = useQuery({
    queryKey: ['serviceReadiness', 'prep', date, shift],
    queryFn: async () => {
      const logs = await base44.entities.ChecklistCompletion.filter({
        date,
        shift,
        checklist_category: 'prep'
      }, '-created_date', 1);
      return logs[0] || null;
    },
    enabled: !!date && !!shift
  });

  const { data: hygieneLog } = useQuery({
    queryKey: ['serviceReadiness', 'hygiene', date, shift],
    queryFn: async () => {
      const logs = await base44.entities.ChecklistCompletion.filter({
        date,
        shift,
        checklist_category: 'hygiene'
      }, '-created_date', 1);
      return logs[0] || null;
    },
    enabled: !!date && !!shift
  });

  const prepComplete = prepLog?.status === 'completed';
  const hygieneComplete = hygieneLog?.status === 'completed';
  const allComplete = prepComplete && hygieneComplete;

  return (
    <div className="space-y-3">
      {allComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl p-4 shadow-xl text-center"
        >
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
          <h3 className="text-xl font-bold">🟢 We're Ready to Open!</h3>
          <p className="text-emerald-100 text-sm">All checks complete – Service can begin</p>
        </motion.div>
      )}

      <ChecklistForm
        type="prep"
        template={PREP_TEMPLATE}
        user={user}
        shift={shift}
        date={date}
        isExpanded={expandedForm === 'prep'}
        onToggle={() => setExpandedForm(expandedForm === 'prep' ? null : 'prep')}
        onComplete={() => setExpandedForm(null)}
      />

      <ChecklistForm
        type="hygiene"
        template={HYGIENE_TEMPLATE}
        user={user}
        shift={shift}
        date={date}
        isExpanded={expandedForm === 'hygiene'}
        onToggle={() => setExpandedForm(expandedForm === 'hygiene' ? null : 'hygiene')}
        onComplete={() => setExpandedForm(null)}
      />
    </div>
  );
}
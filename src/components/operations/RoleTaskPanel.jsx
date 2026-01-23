import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Thermometer, ClipboardCheck, Package, Wrench, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RoleTaskPanel({ user, checkIn, todayTemps, tempAssets, onOpenTempTable }) {
  const userRole = user?.role?.toLowerCase() || '';
  const position = user?.position?.toLowerCase() || '';

  // Define role-based tasks
  const getRoleTasks = () => {
    const tasks = [];

    if (position.includes('chef') || position.includes('cook')) {
      tasks.push({
        id: 'temperature_logs',
        label: 'Temperature Checks',
        description: 'Log all fridge & freezer temperatures',
        icon: Thermometer,
        mandatory: true,
        completed: todayTemps.length >= tempAssets.length,
        action: onOpenTempTable,
        actionLabel: 'Log Temperatures'
      });
      tasks.push({
        id: 'prep_confirmation',
        label: 'Prep Confirmation',
        description: 'Verify prep components are ready',
        icon: ClipboardCheck,
        mandatory: false,
        completed: false
      });
      tasks.push({
        id: 'equipment_check',
        label: 'Equipment Status',
        description: 'Check all kitchen equipment',
        icon: Wrench,
        mandatory: false,
        completed: false
      });
    }

    if (position.includes('foh') || position.includes('server') || position.includes('front')) {
      tasks.push({
        id: 'opening_checklist',
        label: 'Opening Checklist',
        description: 'Complete front of house opening tasks',
        icon: ClipboardCheck,
        mandatory: true,
        completed: false
      });
      tasks.push({
        id: 'front_cleaning',
        label: 'Front of House Clean',
        description: 'Tables, counters, and dining area',
        icon: ClipboardCheck,
        mandatory: false,
        completed: false
      });
      tasks.push({
        id: 'stock_check',
        label: 'Visual Stock Check',
        description: 'Check display items and supplies',
        icon: Package,
        mandatory: false,
        completed: false
      });
    }

    if (userRole === 'manager' || userRole === 'owner' || userRole === 'admin') {
      tasks.push({
        id: 'shift_approvals',
        label: 'Shift Approvals',
        description: 'Review and approve pending shifts',
        icon: CheckCircle,
        mandatory: true,
        completed: false
      });
      tasks.push({
        id: 'issue_review',
        label: 'Issue Review',
        description: 'Review any flagged issues',
        icon: AlertCircle,
        mandatory: false,
        completed: false
      });
    }

    return tasks;
  };

  const tasks = getRoleTasks();
  const mandatoryTasks = tasks.filter(t => t.mandatory);
  const completedMandatory = mandatoryTasks.filter(t => t.completed).length;
  const totalMandatory = mandatoryTasks.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Daily Tasks</CardTitle>
          {totalMandatory > 0 && (
            <Badge className={completedMandatory === totalMandatory ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
              {completedMandatory}/{totalMandatory} Mandatory Complete
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task, idx) => {
            const TaskIcon = task.icon;
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={task.completed ? 'bg-emerald-50 border-emerald-200' : task.mandatory ? 'border-amber-200' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {task.completed ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <TaskIcon className="w-4 h-4 text-slate-600" />
                            <p className="font-semibold text-slate-800">{task.label}</p>
                            {task.mandatory && (
                              <Badge className="bg-red-100 text-red-700 text-xs">REQUIRED</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{task.description}</p>
                        </div>
                      </div>
                      {task.action && !task.completed && (
                        <Button size="sm" onClick={task.action}>
                          {task.actionLabel || 'Complete'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
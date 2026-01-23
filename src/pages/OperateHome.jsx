import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  ClipboardCheck, 
  ChefHat, 
  ThermometerSun, 
  AlertTriangle,
  Users,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function OperateHome() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: shifts = [] } = useQuery({
    queryKey: ['todayShifts'],
    queryFn: () => base44.entities.Shift.filter({ 
      date: new Date().toISOString().split('T')[0],
      status: 'clocked_in'
    })
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['todayTasks'],
    queryFn: () => base44.entities.Task.filter({ 
      due_date: new Date().toISOString().split('T')[0],
      status: 'pending'
    })
  });

  const quickActions = [
    {
      title: 'Today\'s Checklists',
      icon: ClipboardCheck,
      color: 'bg-blue-500',
      link: 'FoodSafetyChecklist',
      count: tasks.length
    },
    {
      title: 'Dish Guides',
      icon: ChefHat,
      color: 'bg-emerald-500',
      link: 'VisualDishGuides'
    },
    {
      title: 'Log Temperature',
      icon: ThermometerSun,
      color: 'bg-orange-500',
      link: 'Operations'
    },
    {
      title: 'Report Issue',
      icon: AlertTriangle,
      color: 'bg-red-500',
      link: 'ServiceRecovery'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Service Mode</h1>
          <p className="text-slate-600">Fast actions. Zero thinking.</p>
        </motion.div>

        {/* Active Shift Status */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8" />
                <div>
                  <p className="text-sm opacity-90">Staff on Shift</p>
                  <p className="text-3xl font-bold">{shifts.length}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Tasks Pending</p>
                <p className="text-3xl font-bold">{tasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link to={createPageUrl(action.link)}>
                  <Card className="hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-300 h-40">
                    <CardContent className="pt-6 flex flex-col items-center justify-center h-full text-center">
                      <div className={`${action.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-3`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <p className="font-bold text-lg text-slate-800">{action.title}</p>
                      {action.count > 0 && (
                        <Badge className="mt-2 bg-red-500">{action.count} pending</Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Today's Priority */}
        {tasks.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-amber-900">Today's Priorities</h3>
              </div>
              <div className="space-y-2">
                {tasks.slice(0, 3).map(task => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span className="text-slate-700">{task.title}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
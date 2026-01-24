import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Droplet, CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function CleaningHygieneHub() {
  const [user, setUser] = useState(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: hygieneLogs = [], isLoading } = useQuery({
    queryKey: ['hygieneLogs', today],
    queryFn: () => base44.entities.FoodSafetyChecklistSubmission?.filter?.({ date: today }) || [],
    enabled: !!user
  });

  const { data: cleaningRecords = [] } = useQuery({
    queryKey: ['cleaningRecords', today],
    queryFn: () => base44.entities.ChecklistCompletion?.filter?.({ 
      checklist_category: 'hygiene',
      date: today 
    }) || [],
    enabled: !!user
  });

  if (!user) return <LoadingSpinner />;

  const completedCount = cleaningRecords.filter(r => r.status === 'completed').length;
  const pendingCount = cleaningRecords.filter(r => r.status === 'in_progress').length;
  const failedCount = cleaningRecords.filter(r => r.status === 'failed').length;
  const completionRate = cleaningRecords.length > 0 
    ? (completedCount / cleaningRecords.length) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 pb-24">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Droplet className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
                Cleaning & Hygiene
              </h1>
              <p className="text-lg text-slate-600">
                Daily sanitation & food safety tracking
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className="border-2 border-blue-200 hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Today's Date</p>
                    <p className="text-2xl font-bold text-slate-800">{format(new Date(), 'd MMM')}</p>
                  </div>
                  <Clock className="w-10 h-10 text-blue-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-2 border-emerald-200 hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Completed Tasks</p>
                    <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-emerald-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-2 border-amber-200 hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">In Progress</p>
                    <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                  </div>
                  <Clock className="w-10 h-10 text-amber-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-2 border-red-200 hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Issues Found</p>
                    <p className="text-2xl font-bold text-red-600">{failedCount}</p>
                  </div>
                  <AlertCircle className="w-10 h-10 text-red-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Overall Progress */}
        <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 shadow-xl">
          <CardContent className="pt-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Daily Hygiene Completion</h3>
                <span className="text-3xl font-bold">{Math.round(completionRate)}%</span>
              </div>
              <Progress value={completionRate} className="h-3 bg-blue-400" />
            </div>
            <p className="text-blue-100 text-sm">
              {completedCount} of {cleaningRecords.length} hygiene tasks completed today
            </p>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        {isLoading ? (
          <LoadingSpinner />
        ) : cleaningRecords.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-300">
            <CardContent className="pt-12 text-center">
              <Droplet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No hygiene tasks logged yet</h3>
              <p className="text-slate-500 mb-6">Start by completing your daily cleaning and sanitation checklist</p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Create Cleaning Checklist
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">Today's Tasks</h2>
            {cleaningRecords.map((record, idx) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-all">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-slate-800">{record.checklist_name}</h3>
                          <Badge 
                            className={
                              record.status === 'completed' 
                                ? 'bg-emerald-600' 
                                : record.status === 'failed'
                                ? 'bg-red-600'
                                : 'bg-amber-600'
                            }
                          >
                            {record.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                          By {record.user_name} • {format(new Date(record.created_date), 'HH:mm')}
                        </p>
                        <Progress value={record.completion_percentage} className="h-2" />
                      </div>
                      <div className="ml-6 text-right">
                        <p className="text-2xl font-bold text-slate-800">
                          {Math.round(record.completion_percentage)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
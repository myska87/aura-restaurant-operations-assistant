import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Droplet, CheckCircle, AlertCircle, Clock, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function CleaningHygieneHub() {
  const [user, setUser] = useState(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch cleaning & hygiene related data
  const { data: cleaningRecords = [] } = useQuery({
    queryKey: ['cleaningRecords', today],
    queryFn: () => base44.entities.ChecklistCompletion?.filter?.({ 
      date: today 
    }) || [],
    enabled: !!user
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff?.list?.() || [],
    enabled: !!user
  });

  const { data: healthDeclarations = [] } = useQuery({
    queryKey: ['healthDeclarations', today],
    queryFn: () => base44.entities.DailyCheckIn?.filter?.({ shift_date: today }) || [],
    enabled: !!user
  });

  if (!user) return <LoadingSpinner />;

  // Calculate metrics
  const dailyCleaningCompleted = cleaningRecords.some(r => 
    r.checklist_category === 'cleaning' && r.status === 'completed'
  );
  
  const deepCleaningDue = addDays(new Date(), 7); // Placeholder: due in 7 days
  
  const healthDeclarationsCompleted = healthDeclarations.length;
  const healthDeclarationsTotal = staff.length || 0;
  const illnessAlerts = healthDeclarations.filter(h => h.illness_reported).length;

  // Status indicators
  const getDailyCleaningStatus = () => {
    if (dailyCleaningCompleted) return { status: 'completed', color: 'bg-emerald-100 border-emerald-400', textColor: 'text-emerald-700' };
    return { status: 'pending', color: 'bg-amber-100 border-amber-400', textColor: 'text-amber-700' };
  };

  const getHealthDeclarationStatus = () => {
    if (healthDeclarationsCompleted === healthDeclarationsTotal && healthDeclarationsTotal > 0) 
      return { color: 'bg-emerald-100 border-emerald-400', textColor: 'text-emerald-700' };
    return { color: 'bg-amber-100 border-amber-400', textColor: 'text-amber-700' };
  };

  const getIllnessStatus = () => {
    if (illnessAlerts > 0) return { color: 'bg-red-100 border-red-400', textColor: 'text-red-700' };
    return { color: 'bg-emerald-100 border-emerald-400', textColor: 'text-emerald-700' };
  };

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
              <p className="text-lg text-slate-600 italic">
                "Cleanliness is respect. Hygiene is non-negotiable."
              </p>
            </div>
          </div>
        </div>

        {/* TODAY'S HYGIENE STATUS PANEL */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Daily Cleaning */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className={`border-2 hover:shadow-lg transition-all ${getDailyCleaningStatus().color}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800">Daily Cleaning</h3>
                  {dailyCleaningCompleted ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
                </div>
                <p className={`text-sm font-bold ${getDailyCleaningStatus().textColor}`}>
                  {dailyCleaningCompleted ? '✓ COMPLETED' : '⚠ PENDING'}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Deep Cleaning */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-2 border-blue-400 bg-blue-50 hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800">Deep Cleaning</h3>
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm font-bold text-blue-700">
                  Next: {format(deepCleaningDue, 'd MMM')}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Staff Hygiene Declarations */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className={`border-2 hover:shadow-lg transition-all ${getHealthDeclarationStatus().color}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800">Staff Declarations</h3>
                  <Users className={`w-5 h-5 ${healthDeclarationsCompleted === healthDeclarationsTotal && healthDeclarationsTotal > 0 ? 'text-emerald-600' : 'text-amber-600'}`} />
                </div>
                <p className={`text-sm font-bold ${getHealthDeclarationStatus().textColor}`}>
                  {healthDeclarationsCompleted} / {healthDeclarationsTotal} completed
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Illness Alerts */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className={`border-2 hover:shadow-lg transition-all ${getIllnessStatus().color}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800">Illness Alerts</h3>
                  {illnessAlerts > 0 ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <CheckCircle className="w-5 h-5 text-emerald-600" />}
                </div>
                <p className={`text-sm font-bold ${illnessAlerts > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                  {illnessAlerts > 0 ? `${illnessAlerts} Active` : 'None'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* CLEANING SCHEDULES */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-blue-600" />
              Cleaning Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Morning Opening Clean', 'Mid-Shift Sanitation', 'Evening Deep Clean'].map((task, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-medium text-slate-800">{task}</span>
                  <Badge className="bg-emerald-600">Scheduled</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* STAFF HYGIENE DECLARATIONS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-600" />
              Staff Hygiene Declarations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthDeclarations.length === 0 ? (
              <p className="text-slate-600 text-center py-4">No staff check-ins yet today</p>
            ) : (
              <div className="space-y-2">
                {healthDeclarations.slice(0, 5).map((decl) => (
                  <div key={decl.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="text-sm font-medium">{decl.staff_name}</span>
                    <Badge className={decl.illness_reported ? 'bg-red-600' : 'bg-emerald-600'}>
                      {decl.illness_reported ? '⚠ Reported' : '✓ Clear'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* LOGS & VERIFICATION */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Logs & Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cleaningRecords.length === 0 ? (
              <p className="text-slate-600 text-center py-4">No cleaning logs recorded yet</p>
            ) : (
              <div className="space-y-3">
                {cleaningRecords.slice(0, 5).map((record, idx) => (
                  <div key={record.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border-l-4 border-slate-300">
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{record.checklist_name}</p>
                      <p className="text-xs text-slate-500">{record.user_name} • {format(new Date(record.created_date), 'HH:mm')}</p>
                    </div>
                    <Badge 
                      className={
                        record.status === 'completed' 
                          ? 'bg-emerald-600' 
                          : record.status === 'failed'
                          ? 'bg-red-600'
                          : 'bg-amber-600'
                      }
                    >
                      {record.status === 'completed' ? '✓' : record.status === 'failed' ? '✗' : '⏳'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
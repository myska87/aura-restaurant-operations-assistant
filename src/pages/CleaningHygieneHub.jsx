import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Droplet, CheckCircle, AlertCircle, Clock, TrendingUp, AlertTriangle, Users, Plus } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import DailyCleaningScheduleForm from '@/components/cleaning/DailyCleaningScheduleForm';
import DeepCleaningScheduleForm from '@/components/cleaning/DeepCleaningScheduleForm';

export default function CleaningHygieneHub() {
  const [user, setUser] = useState(null);
  const [showCleaningForm, setShowCleaningForm] = useState(false);
  const [showDeepCleaningForm, setShowDeepCleaningForm] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const queryClient = useQueryClient();

  // Fetch daily cleaning logs
  const { data: cleaningLogs = [] } = useQuery({
    queryKey: ['cleaningLogs', today],
    queryFn: () => base44.entities.DailyCleaningLog?.filter?.({ date: today }) || [],
    enabled: !!user
  });

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

  const { data: deepCleaningSchedules = [] } = useQuery({
    queryKey: ['deepCleaningSchedules'],
    queryFn: () => base44.entities.DeepCleaningSchedule?.list?.() || [],
    enabled: !!user
  });

  if (!user) return <LoadingSpinner />;

  // Required cleaning areas
  const REQUIRED_AREAS = ['front_counter', 'chai_station', 'kitchen_prep', 'cooking_area', 'toilets'];

  // Calculate metrics
  const completedAreas = cleaningLogs
    .filter(log => log.status === 'approved')
    .map(log => log.area);
  
  const allRequiredCleaningDone = REQUIRED_AREAS.every(area => 
    completedAreas.includes(area)
  );
  
  // Find overdue deep cleaning tasks
  const overdueDeepCleans = deepCleaningSchedules.filter(schedule => 
    schedule.is_overdue && schedule.status !== 'approved'
  );
  
  const healthDeclarationsCompleted = healthDeclarations.length;
  const healthDeclarationsTotal = staff.length || 0;
  const illnessAlerts = healthDeclarations.filter(h => h.illness_reported).length;

  // Status indicators
  const getDailyCleaningStatus = () => {
    if (allRequiredCleaningDone) return { status: 'completed', color: 'bg-emerald-100 border-emerald-400', textColor: 'text-emerald-700' };
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
            <Card className={`border-2 hover:shadow-lg transition-all cursor-pointer ${getDailyCleaningStatus().color}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800">Daily Cleaning</h3>
                  {allRequiredCleaningDone ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
                </div>
                <p className={`text-sm font-bold ${getDailyCleaningStatus().textColor}`}>
                  {allRequiredCleaningDone ? '✓ COMPLETED' : `⚠ ${completedAreas.length}/${REQUIRED_AREAS.length} Areas`}
                </p>
                <p className="text-xs text-slate-600 mt-2">Click to view or add logs</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Deep Cleaning */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className={`border-2 hover:shadow-lg transition-all cursor-pointer ${
              overdueDeepCleans.length > 0 
                ? 'border-red-400 bg-red-50' 
                : 'border-blue-400 bg-blue-50'
            }`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800">Deep Cleaning</h3>
                  {overdueDeepCleans.length > 0 ? (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <p className={`text-sm font-bold ${overdueDeepCleans.length > 0 ? 'text-red-700' : 'text-blue-700'}`}>
                  {overdueDeepCleans.length > 0 ? `⚠ ${overdueDeepCleans.length} OVERDUE` : '✓ On Schedule'}
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

        {/* DEEP CLEANING SCHEDULE */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-purple-600" />
              Deep Cleaning Schedule
            </CardTitle>
            <Button 
              onClick={() => setShowDeepCleaningForm(true)}
              className="bg-purple-600 hover:bg-purple-700 gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Log Deep Clean
            </Button>
          </CardHeader>
          <CardContent>
            {deepCleaningSchedules.length === 0 ? (
              <p className="text-slate-600 text-center py-4">No deep cleaning schedules set up yet</p>
            ) : (
              <div className="space-y-3">
                {deepCleaningSchedules.map((schedule) => (
                  <div 
                    key={schedule.id} 
                    className={`p-4 rounded-lg border-l-4 ${
                      schedule.is_overdue && schedule.status !== 'approved'
                        ? 'bg-red-50 border-red-400'
                        : schedule.status === 'approved'
                        ? 'bg-emerald-50 border-emerald-400'
                        : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-slate-800">{schedule.area_equipment_name}</p>
                        <p className="text-sm text-slate-600">{schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} • {schedule.assigned_role}</p>
                      </div>
                      <Badge 
                        className={
                          schedule.is_overdue && schedule.status !== 'approved' 
                            ? 'bg-red-600' 
                            : schedule.status === 'approved'
                            ? 'bg-emerald-600'
                            : 'bg-slate-600'
                        }
                      >
                        {schedule.is_overdue && schedule.status !== 'approved' ? '🔴 OVERDUE' : schedule.status === 'approved' ? '✓' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Next due: {format(new Date(schedule.next_due_date), 'd MMM yyyy')}
                    </p>
                  </div>
                ))}
              </div>
            )}
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Daily Cleaning Logs
            </CardTitle>
            <Button 
              onClick={() => setShowCleaningForm(true)}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Add Log
            </Button>
          </CardHeader>
          <CardContent>
            {cleaningLogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 mb-4">No cleaning logs recorded yet today</p>
                <Button 
                  onClick={() => setShowCleaningForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Record First Cleaning
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {cleaningLogs.map((log, idx) => (
                  <div key={log.id} className={`flex items-start justify-between p-4 rounded-lg border-l-4 ${log.status === 'approved' ? 'bg-emerald-50 border-emerald-400' : 'bg-amber-50 border-amber-400'}`}>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">{log.area_name}</p>
                      <p className="text-sm text-slate-600 mb-1">{log.cleaning_task}</p>
                      <p className="text-xs text-slate-500">
                        {log.completed_by_name} • {format(new Date(log.time_completed), 'HH:mm')} • {log.chemical_used}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={log.status === 'approved' ? 'bg-emerald-600' : 'bg-amber-600'}>
                        {log.status === 'approved' ? '✓ Approved' : log.supervisor_sign_off ? '✓ Signed' : '⏳ Pending'}
                      </Badge>
                      {log.supervisor_sign_off && (
                        <p className="text-xs text-slate-500 mt-1">{log.supervisor_name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Required Areas Checklist */}
            {cleaningLogs.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-300">
                <h4 className="font-semibold text-slate-800 mb-3">Required Areas Status</h4>
                <div className="space-y-2">
                  {REQUIRED_AREAS.map((area) => {
                    const completed = completedAreas.includes(area);
                    const areaNames = {
                      front_counter: 'Front Counter',
                      chai_station: 'Chai Station',
                      kitchen_prep: 'Kitchen Prep',
                      cooking_area: 'Cooking Area',
                      toilets: 'Toilets',
                    };
                    return (
                      <div key={area} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${completed ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                          {completed ? '✓' : '○'}
                        </div>
                        <span className={completed ? 'text-emerald-700 font-medium' : 'text-slate-600'}>
                          {areaNames[area]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cleaning Form Dialog */}
        <Dialog open={showCleaningForm} onOpenChange={setShowCleaningForm}>
          <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Daily Cleaning Log</DialogTitle>
            </DialogHeader>
            {user && (
              <DailyCleaningScheduleForm 
                user={user} 
                onSuccess={() => setShowCleaningForm(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Deep Cleaning Form Dialog */}
        <Dialog open={showDeepCleaningForm} onOpenChange={setShowDeepCleaningForm}>
          <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log Deep Cleaning</DialogTitle>
            </DialogHeader>
            {user && (
              <DeepCleaningScheduleForm 
                user={user} 
                onSuccess={() => setShowDeepCleaningForm(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
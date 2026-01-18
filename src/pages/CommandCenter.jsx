import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Play, Pause, Square, Thermometer, Droplets, Wrench, AlertTriangle, 
  Shield, Tag, ClipboardList, RefreshCw, Trash2, Heart, Calendar,
  CheckCircle2, GraduationCap, FileText, Users, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TemperatureLog from '@/components/operations/TemperatureLog';
import TemperatureReport from '@/components/operations/TemperatureReport';
import LabelPrinter from '@/components/operations/LabelPrinter';
import HandoverForm from '@/components/operations/HandoverForm';
import ServiceRecoveryForm from '@/components/recovery/ServiceRecoveryForm';

export default function CommandCenter() {
  const [user, setUser] = useState(null);
  const [activeDialog, setActiveDialog] = useState(null);
  const [currentShift, setCurrentShift] = useState(null);

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

  const today = format(new Date(), 'yyyy-MM-dd');
  const currentHour = new Date().getHours();
  const shiftType = currentHour < 11 ? 'opening' : currentHour < 17 ? 'mid' : 'closing';

  // Real-time data fetching
  const { data: todayCheckIn } = useQuery({
    queryKey: ['todayCheckIn', user?.email, today],
    queryFn: async () => {
      if (!user?.email) return null;
      const checks = await base44.entities.DailyCheckIn.filter({
        staff_email: user.email,
        shift_date: today
      });
      return checks[0] || null;
    },
    enabled: !!user?.email,
    refetchInterval: 30000
  });

  const { data: tempLogs = [] } = useQuery({
    queryKey: ['tempLogs', today],
    queryFn: () => base44.entities.TemperatureLog.filter({ log_date: today }),
    refetchInterval: 60000
  });

  const { data: myTasks = [] } = useQuery({
    queryKey: ['myTasks', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Task.filter({ 
        assigned_to: user.email,
        status: { $ne: 'completed' }
      });
    },
    enabled: !!user?.email
  });

  const { data: myShifts = [] } = useQuery({
    queryKey: ['myShifts', user?.email, today],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Shift.filter({
        staff_email: user.email,
        shift_date: today
      });
    },
    enabled: !!user?.email
  });

  const { data: trainingProgress = [] } = useQuery({
    queryKey: ['myTraining', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.TrainingProgress.filter({
        staff_email: user.email,
        completion_percentage: { $lt: 100 }
      });
    },
    enabled: !!user?.email
  });

  const { data: equipmentIssues = [] } = useQuery({
    queryKey: ['equipmentIssues'],
    queryFn: () => base44.entities.EquipmentFault.filter({
      status: { $ne: 'resolved' }
    }),
    refetchInterval: 60000
  });

  const { data: lowStock = [] } = useQuery({
    queryKey: ['lowStock'],
    queryFn: () => base44.entities.ChemicalStock.filter({
      status: { $in: ['low', 'out_of_stock'] }
    }),
    refetchInterval: 120000
  });

  const startShiftMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.DailyCheckIn.create({
        staff_email: user.email,
        staff_name: user.full_name,
        shift_date: today,
        shift_type: shiftType,
        staff_role: user.role === 'admin' || user.role === 'manager' ? 'manager' : user.role === 'staff' ? 'foh' : 'kitchen',
        check_in_time: new Date().toISOString(),
        status: 'checked_in'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['todayCheckIn']);
      setActiveDialog('checklist');
    }
  });

  const endShiftMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.DailyCheckIn.update(todayCheckIn.id, {
        check_out_time: new Date().toISOString(),
        status: 'checked_out'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['todayCheckIn']);
      setActiveDialog('handover');
    }
  });

  if (!user) return <LoadingSpinner />;

  const isManager = ['admin', 'manager', 'owner'].includes(user.role);
  const todayShift = myShifts[0];
  const hasStartedShift = !!todayCheckIn;
  const tempLogsComplete = tempLogs.filter(t => t.check_time === shiftType).length >= 3;
  const dueTasks = myTasks.filter(t => t.due_date && new Date(t.due_date) <= new Date());

  // Alert calculations
  const alerts = [
    ...(!tempLogsComplete && hasStartedShift ? [{ type: 'temperature', severity: 'high', message: 'Temperature logs incomplete' }] : []),
    ...equipmentIssues.map(e => ({ type: 'equipment', severity: e.severity, message: `${e.equipment_name} - ${e.fault_type}` })),
    ...lowStock.map(s => ({ type: 'stock', severity: 'medium', message: `${s.chemical_name} low stock` })),
    ...(dueTasks.length > 0 ? [{ type: 'tasks', severity: 'medium', message: `${dueTasks.length} task(s) due today` }] : [])
  ];

  const ShiftButton = ({ icon: Icon, label, onClick, variant = 'default', disabled = false }) => (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`h-24 text-lg font-bold shadow-lg ${
        variant === 'start' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700' :
        variant === 'mid' ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' :
        variant === 'end' ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' :
        ''
      }`}
    >
      <Icon className="w-8 h-8 mr-3" />
      {label}
    </Button>
  );

  const QuickAction = ({ icon: Icon, label, onClick, color = 'blue' }) => (
    <Card 
      className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-emerald-400"
      onClick={onClick}
    >
      <CardContent className="pt-6 pb-6 text-center">
        <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-${color}-500 to-${color}-600 flex items-center justify-center mb-3 shadow-lg`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <p className="font-semibold text-sm">{label}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Command Center</h1>
        <p className="text-emerald-100">Everything you need today — in one place</p>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <Badge className="bg-white/20 text-white border-0">
            {format(new Date(), 'EEEE, MMM d')}
          </Badge>
          <Badge className="bg-white/20 text-white border-0 capitalize">
            {shiftType} Shift
          </Badge>
          {todayShift && (
            <Badge className="bg-emerald-800 text-white border-0">
              On Shift: {format(new Date(todayShift.start_time), 'HH:mm')} - {format(new Date(todayShift.end_time), 'HH:mm')}
            </Badge>
          )}
        </div>
      </div>

      {/* ZONE 1: SHIFT CONTROL */}
      <Card className="bg-gradient-to-br from-slate-50 to-white border-2 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-6 h-6 text-emerald-600" />
            Shift Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {!hasStartedShift ? (
              <>
                <ShiftButton
                  icon={Play}
                  label="Start Shift"
                  onClick={() => startShiftMutation.mutate()}
                  variant="start"
                />
                <div className="col-span-2 flex items-center justify-center text-slate-400">
                  <p>Start your shift to unlock actions</p>
                </div>
              </>
            ) : todayCheckIn?.status === 'checked_out' ? (
              <div className="col-span-3 text-center py-4">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-600" />
                <p className="font-semibold text-lg">Shift Complete</p>
                <p className="text-sm text-slate-600">Great work today!</p>
              </div>
            ) : (
              <>
                <ShiftButton
                  icon={Pause}
                  label="Mid Check"
                  onClick={() => setActiveDialog('checklist')}
                  variant="mid"
                />
                <ShiftButton
                  icon={Square}
                  label="End Shift"
                  onClick={() => endShiftMutation.mutate()}
                  variant="end"
                  disabled={!tempLogsComplete}
                />
                <div className="flex items-center text-xs text-slate-600">
                  {!tempLogsComplete && (
                    <p>⚠️ Complete temp logs first</p>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ZONE 5: SMART ALERTS (Moved up for visibility) */}
      {alerts.length > 0 && (
        <Card className="bg-amber-50 border-2 border-amber-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-6 h-6" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-3 rounded-lg flex items-center gap-3 ${
                    alert.severity === 'critical' ? 'bg-red-100 border border-red-300' :
                    alert.severity === 'high' ? 'bg-orange-100 border border-orange-300' :
                    'bg-yellow-100 border border-yellow-300'
                  }`}
                >
                  <AlertTriangle className={`w-5 h-5 ${
                    alert.severity === 'critical' ? 'text-red-600' :
                    alert.severity === 'high' ? 'text-orange-600' :
                    'text-yellow-600'
                  }`} />
                  <p className="font-medium text-sm">{alert.message}</p>
                  <Badge className={`ml-auto ${
                    alert.severity === 'critical' ? 'bg-red-600' :
                    alert.severity === 'high' ? 'bg-orange-600' :
                    'bg-yellow-600'
                  }`}>
                    {alert.type}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ZONE 2: DAILY CHECKS & SAFETY */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              Daily Checks & Safety
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <QuickAction
                icon={Thermometer}
                label="Log Temperatures"
                onClick={() => setActiveDialog('temperature')}
                color="red"
              />
              <QuickAction
                icon={FileText}
                label="Temp Report"
                onClick={() => setActiveDialog('tempReport')}
                color="blue"
              />
              <QuickAction
                icon={Droplets}
                label="Hygiene Check"
                onClick={() => setActiveDialog('checklist')}
                color="blue"
              />
              <QuickAction
                icon={Wrench}
                label="Equipment Status"
                onClick={() => setActiveDialog('equipment')}
                color="orange"
              />
              <QuickAction
                icon={AlertTriangle}
                label="Report Incident"
                onClick={() => setActiveDialog('incident')}
                color="amber"
              />
              <QuickAction
                icon={Shield}
                label="Allergen Alert"
                onClick={() => setActiveDialog('allergen')}
                color="red"
              />
            </div>
          </CardContent>
        </Card>

        {/* ZONE 3: OPERATIONS QUICK ACTIONS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-emerald-600" />
              Quick Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <QuickAction
                icon={Tag}
                label="Print Label"
                onClick={() => setActiveDialog('label')}
                color="green"
              />
              <QuickAction
                icon={ClipboardList}
                label="Prep Checklist"
                onClick={() => setActiveDialog('prep')}
                color="purple"
              />
              <QuickAction
                icon={RefreshCw}
                label="Shift Handover"
                onClick={() => setActiveDialog('handover')}
                color="indigo"
              />
              <QuickAction
                icon={Trash2}
                label="Log Waste"
                onClick={() => setActiveDialog('waste')}
                color="slate"
              />
              <QuickAction
                icon={Heart}
                label="Service Recovery"
                onClick={() => setActiveDialog('recovery')}
                color="pink"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ZONE 4: PEOPLE & TASKS */}
      <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            My Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-xl border-2 border-slate-200">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{todayShift ? '1' : '0'}</p>
              <p className="text-xs text-slate-600">Shifts Today</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border-2 border-slate-200">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
              <p className="text-2xl font-bold">{myTasks.length}</p>
              <p className="text-xs text-slate-600">Open Tasks</p>
              {dueTasks.length > 0 && (
                <Badge className="mt-1 bg-red-600 text-xs">{dueTasks.length} due</Badge>
              )}
            </div>
            <div className="text-center p-4 bg-white rounded-xl border-2 border-slate-200">
              <GraduationCap className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">{trainingProgress.length}</p>
              <p className="text-xs text-slate-600">Training Due</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border-2 border-slate-200">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-amber-600" />
              <p className="text-2xl font-bold">{hasStartedShift ? '✓' : '-'}</p>
              <p className="text-xs text-slate-600">Shift Status</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mini-Form Dialogs */}
      <Dialog open={activeDialog === 'temperature'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Temperature Logs</DialogTitle>
          </DialogHeader>
          <TemperatureLog user={user} />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'tempReport'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Temperature Report</DialogTitle>
          </DialogHeader>
          <TemperatureReport />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'label'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Print Food Label</DialogTitle>
          </DialogHeader>
          <LabelPrinter />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'handover'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shift Handover</DialogTitle>
          </DialogHeader>
          <HandoverForm />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'recovery'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service Recovery</DialogTitle>
          </DialogHeader>
          <ServiceRecoveryForm onComplete={() => setActiveDialog(null)} />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'checklist'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hygiene Checklist</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">Daily hygiene checks will appear here.</p>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'equipment'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Equipment Status</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">Equipment health monitoring will appear here.</p>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'incident'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Incident</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">Incident reporting form will appear here.</p>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'allergen'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allergen Alert</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">Allergen management will appear here.</p>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'prep'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prep Checklist</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">Prep task checklist will appear here.</p>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'waste'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Waste</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">Waste logging form will appear here.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
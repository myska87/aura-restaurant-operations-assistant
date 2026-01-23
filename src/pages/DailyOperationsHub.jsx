import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInMinutes } from 'date-fns';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Thermometer,
  ClipboardCheck,
  Users,
  MessageSquare,
  Sparkles,
  ChefHat,
  Camera,
  FileText,
  TrendingUp,
  AlertTriangle,
  Plus,
  ExternalLink,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DailyOperationsHub() {
  const [user, setUser] = useState(null);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showTempModal, setShowTempModal] = useState(false);
  const [showHygieneModal, setShowHygieneModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      queryClient.invalidateQueries(['todayData']);
    }, 60000);
    return () => clearInterval(interval);
  }, [queryClient]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const currentHour = new Date().getHours();
  
  // Detect shift
  const detectShift = () => {
    if (currentHour >= 5 && currentHour < 12) return 'Opening';
    if (currentHour >= 12 && currentHour < 17) return 'Mid';
    return 'Closing';
  };
  const currentShift = detectShift();

  // Fetch all data
  const { data: shifts = [] } = useQuery({
    queryKey: ['todayData', 'shifts', today],
    queryFn: () => base44.entities.Shift.filter({ date: today, status: 'clocked_in' }),
    enabled: !!user
  });

  const { data: temperatureLogs = [] } = useQuery({
    queryKey: ['todayData', 'temps', today],
    queryFn: () => base44.entities.TemperatureLog.filter({ log_date: today }),
    enabled: !!user
  });

  const { data: tempAssets = [] } = useQuery({
    queryKey: ['todayData', 'tempAssets'],
    queryFn: () => base44.entities.Assets_Registry_v1.filter({ 
      is_temperature_controlled: true,
      status: { $ne: 'deactivated' }
    }),
    enabled: !!user
  });

  const { data: checklists = [] } = useQuery({
    queryKey: ['todayData', 'checklists', today],
    queryFn: () => base44.entities.FoodSafetyChecklist.filter({ date: today }),
    enabled: !!user
  });

  const { data: handovers = [] } = useQuery({
    queryKey: ['todayData', 'handovers', today],
    queryFn: () => base44.entities.ShiftHandover.filter({ shift_date: today }),
    enabled: !!user
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['todayData', 'tasks', today],
    queryFn: () => base44.entities.Task.filter({ due_date: today }),
    enabled: !!user
  });

  const { data: prepTasks = [] } = useQuery({
    queryKey: ['todayData', 'prep', today],
    queryFn: () => base44.entities.PrepTask.filter({ 
      prep_date: today,
      status: { $ne: 'completed' }
    }),
    enabled: !!user
  });

  // Calculate shift metrics
  const totalHours = shifts.reduce((sum, shift) => {
    if (shift.actual_clock_in && shift.actual_clock_out) {
      const minutes = differenceInMinutes(
        new Date(shift.actual_clock_out),
        new Date(shift.actual_clock_in)
      );
      return sum + (minutes / 60);
    }
    return sum;
  }, 0);

  const estimatedCost = totalHours * 12.5;

  // Calculate completion percentages
  const hygieneProgress = checklists.length > 0 
    ? (checklists.filter(c => c.status === 'completed').length / checklists.length) * 100 
    : 0;

  const tempProgress = tempAssets.length > 0
    ? (temperatureLogs.length / tempAssets.length) * 100
    : 100;

  const cleaningProgress = tasks.length > 0
    ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100
    : 0;

  const prepProgress = prepTasks.length > 0
    ? (prepTasks.filter(p => p.status === 'completed').length / prepTasks.length) * 100
    : 100;

  const overallProgress = (hygieneProgress + tempProgress + cleaningProgress + prepProgress) / 4;

  // Quick action mutations
  const handoverMutation = useMutation({
    mutationFn: (data) => base44.entities.ShiftHandover.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['todayData']);
      setShowHandoverModal(false);
    }
  });

  const tempMutation = useMutation({
    mutationFn: (data) => base44.entities.TemperatureLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['todayData']);
      setShowTempModal(false);
    }
  });

  if (!user) return <LoadingSpinner />;

  const criticalAlerts = [
    tempAssets.length > temperatureLogs.length && 'Missing temperature logs',
    checklists.filter(c => c.status !== 'completed').length > 0 && 'Incomplete hygiene checks',
    prepTasks.filter(p => p.status === 'overdue').length > 0 && 'Overdue prep tasks'
  ].filter(Boolean);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header Summary */}
      <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">Daily Operations Hub</h1>
              <p className="text-emerald-100">
                {format(currentTime, 'EEEE, d MMMM yyyy')} • {currentShift} Shift
              </p>
            </div>
            <div className="text-right">
              <p className="text-emerald-100 text-sm">Shift Progress</p>
              <p className="text-4xl font-bold">{Math.round(overallProgress)}%</p>
            </div>
          </div>
          <Progress value={overallProgress} className="h-3 bg-emerald-800" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
              <p className="text-emerald-100 text-xs mb-1">Staff on Shift</p>
              <p className="text-2xl font-bold">{shifts.length}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
              <p className="text-emerald-100 text-xs mb-1">Total Hours</p>
              <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
              <p className="text-emerald-100 text-xs mb-1">Est. Cost</p>
              <p className="text-2xl font-bold">£{estimatedCost.toFixed(0)}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
              <p className="text-emerald-100 text-xs mb-1">Time</p>
              <p className="text-2xl font-bold">{format(currentTime, 'HH:mm')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-red-900 mb-2">Critical Tasks Pending</p>
                  <ul className="space-y-1">
                    {criticalAlerts.map((alert, idx) => (
                      <li key={idx} className="text-sm text-red-700">• {alert}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Action Toolbar */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => setShowHandoverModal(true)}
              variant="outline" 
              size="sm"
              className="bg-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </Button>
            <Button 
              onClick={() => setShowHygieneModal(true)}
              variant="outline" 
              size="sm"
              className="bg-white"
            >
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Add Hygiene
            </Button>
            <Button 
              onClick={() => setShowTempModal(true)}
              variant="outline" 
              size="sm"
              className="bg-white"
            >
              <Thermometer className="w-4 h-4 mr-2" />
              Log Temperature
            </Button>
            <Button 
              onClick={() => setShowIncidentModal(true)}
              variant="outline" 
              size="sm"
              className="bg-white"
            >
              <Camera className="w-4 h-4 mr-2" />
              Upload Incident
            </Button>
            <Link to={createPageUrl('PrepWorkflow')}>
              <Button variant="outline" size="sm" className="bg-white">
                <ChefHat className="w-4 h-4 mr-2" />
                Add Prep
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hygiene Status */}
        <WidgetCard
          title="Hygiene Check"
          icon={ClipboardCheck}
          color="bg-purple-500"
          status={hygieneProgress === 100 ? 'complete' : 'pending'}
          progress={hygieneProgress}
          count={`${checklists.filter(c => c.status === 'completed').length}/${checklists.length}`}
          lastUpdate={checklists[0]?.updated_date}
          link="FoodSafetyChecklist"
        />

        {/* Temperature Tracker */}
        <WidgetCard
          title="Temperature Log"
          icon={Thermometer}
          color="bg-red-500"
          status={tempProgress === 100 ? 'complete' : 'pending'}
          progress={tempProgress}
          count={`${temperatureLogs.length}/${tempAssets.length}`}
          lastUpdate={temperatureLogs[0]?.updated_date}
          link="Operations"
        />

        {/* Shift Overview */}
        <WidgetCard
          title="Shift Overview"
          icon={Users}
          color="bg-blue-500"
          status="complete"
          count={`${shifts.length} staff`}
          subtitle={`${totalHours.toFixed(1)}h • £${estimatedCost.toFixed(0)}`}
          link="Shifts"
        />

        {/* Team Handover */}
        <WidgetCard
          title="Team Handover"
          icon={MessageSquare}
          color="bg-amber-500"
          status="complete"
          count={`${handovers.length} notes`}
          lastUpdate={handovers[0]?.created_date}
          link="ShiftHandovers"
        />

        {/* Cleaning Schedule */}
        <WidgetCard
          title="Cleaning Tasks"
          icon={Sparkles}
          color="bg-cyan-500"
          status={cleaningProgress === 100 ? 'complete' : 'pending'}
          progress={cleaningProgress}
          count={`${tasks.filter(t => t.status === 'completed').length}/${tasks.length}`}
          link="FoodSafetyChecklist"
        />

        {/* Prep Tracker */}
        <WidgetCard
          title="Prep Workflow"
          icon={ChefHat}
          color="bg-emerald-500"
          status={prepProgress === 100 ? 'complete' : 'pending'}
          progress={prepProgress}
          count={`${prepTasks.filter(p => p.status === 'completed').length}/${prepTasks.length}`}
          link="PrepWorkflow"
        />
      </div>

      {/* Modals */}
      <HandoverModal
        open={showHandoverModal}
        onClose={() => setShowHandoverModal(false)}
        onSubmit={(data) => handoverMutation.mutate({
          ...data,
          shift_date: today,
          shift_type: currentShift,
          handed_over_by: user?.full_name || user?.email
        })}
        loading={handoverMutation.isPending}
      />

      <TempLogModal
        open={showTempModal}
        onClose={() => setShowTempModal(false)}
        assets={tempAssets}
        onSubmit={(data) => tempMutation.mutate({
          ...data,
          log_date: today,
          logged_by: user?.full_name || user?.email
        })}
        loading={tempMutation.isPending}
      />
    </div>
  );
}

// Widget Card Component
function WidgetCard({ title, icon: Icon, color, status, progress, count, subtitle, lastUpdate, link }) {
  return (
    <Link to={createPageUrl(link)}>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-emerald-300 h-full">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{title}</h3>
                  <p className="text-sm text-slate-500">{subtitle || count}</p>
                </div>
              </div>
              <Badge variant={status === 'complete' ? 'default' : 'outline'} 
                     className={status === 'complete' ? 'bg-emerald-500' : 'border-amber-400 text-amber-700'}>
                {status === 'complete' ? '✓ Done' : '⚠ Pending'}
              </Badge>
            </div>
            
            {progress !== undefined && (
              <Progress value={progress} className="h-2 mb-3" />
            )}
            
            <div className="flex items-center justify-between text-xs text-slate-500">
              {lastUpdate && (
                <span>Updated {format(new Date(lastUpdate), 'HH:mm')}</span>
              )}
              <div className="flex items-center gap-1 text-emerald-600 font-medium">
                View Details <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

// Handover Modal
function HandoverModal({ open, onClose, onSubmit, loading }) {
  const [notes, setNotes] = useState('');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Handover Note</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Handover Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What should the next shift know?"
              rows={4}
            />
          </div>
          <Button
            onClick={() => {
              onSubmit({ handover_notes: notes });
              setNotes('');
            }}
            disabled={!notes.trim() || loading}
            className="w-full"
          >
            {loading ? 'Saving...' : 'Save Handover'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Temperature Log Modal
function TempLogModal({ open, onClose, assets, onSubmit, loading }) {
  const [assetId, setAssetId] = useState('');
  const [temp, setTemp] = useState('');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Temperature</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Equipment</Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger>
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {assets.map(asset => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.asset_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Temperature (°C)</Label>
            <Input
              type="number"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              placeholder="e.g. 4.5"
            />
          </div>
          <Button
            onClick={() => {
              const asset = assets.find(a => a.id === assetId);
              onSubmit({
                asset_id: assetId,
                equipment_name: asset?.asset_name,
                temperature: parseFloat(temp),
                status: 'recorded'
              });
              setAssetId('');
              setTemp('');
            }}
            disabled={!assetId || !temp || loading}
            className="w-full"
          >
            {loading ? 'Logging...' : 'Log Temperature'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ClipboardCheck, 
  ThermometerSun, 
  Sparkles, 
  ChefHat, 
  Box,
  AlertTriangle,
  Clock,
  TrendingUp,
  ShieldAlert,
  AlertCircle,
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  Zap,
  Droplet,
  MessageSquare,
  FileText,
  Wrench,
  Shield,
  Thermometer,
  PlayCircle,
  StopCircle,
  MessageCircle,
  BarChart3,
  Settings,
  Eye,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import TodaysRequiredActions from '@/components/operate/TodaysRequiredActions';
import MidServiceChecksPanel from '@/components/operate/MidServiceChecksPanel';
import EquipmentStatusIndicator from '@/components/operate/EquipmentStatusIndicator';
import OperationCard from '@/components/operate/OperationCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ChecklistModal from '@/components/operations/ChecklistModal';
import TemperatureLog from '@/components/operations/TemperatureLog';
import DailyBriefingForm from '@/components/operations/DailyBriefingForm';
import ShiftHandoverChecklist from '@/components/operations/ShiftHandoverChecklist';
import LabelPrintingModal from '@/components/operations/LabelPrintingModal';
import CCPCheckModal from '@/components/operations/CCPCheckModal';
import HotHoldingForm from '@/components/operations/HotHoldingForm';
import PersonalHygieneDeclarationForm from '@/components/hygiene/PersonalHygieneDeclarationForm';
import HygieneCheckForm from '@/components/cleaning/HygieneCheckForm';

export default function OperateHome() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  // State for modals & forms
  const [showOpeningChecklist, setShowOpeningChecklist] = useState(false);
  const [showClosingChecklist, setShowClosingChecklist] = useState(false);
  const [showTempAssets, setShowTempAssets] = useState(false);
  const [showBriefingForm, setShowBriefingForm] = useState(false);
  const [showHandoverChecklist, setShowHandoverChecklist] = useState(false);
  const [showLabelPrinting, setShowLabelPrinting] = useState(false);
  const [showCCPModal, setShowCCPModal] = useState(false);
  const [showHotHoldingForm, setShowHotHoldingForm] = useState(false);
  const [showHygieneDeclaration, setShowHygieneDeclaration] = useState(false);
  const [showHygieneCheck, setShowHygieneCheck] = useState(false);
  const [activeCCP, setActiveCCP] = useState(null);
  const [clockInBlocked, setClockInBlocked] = useState(false);
  const [completionInProgress, setCompletionInProgress] = useState(null);
  const [currentChecklistData, setCurrentChecklistData] = useState(null);
  const [savingHandover, setSavingHandover] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch data for safety status calculation
  const { data: hygieneDeclarations = [] } = useQuery({
    queryKey: ['hygieneDeclarations', today],
    queryFn: () => base44.entities.PersonalHygieneDeclaration.filter({ declaration_date: today }),
    enabled: !!user
  });

  const { data: temperatureLogs = [] } = useQuery({
    queryKey: ['temperatureLogs', today],
    queryFn: () => base44.entities.TemperatureLog.filter({ log_date: today }),
    enabled: !!user
  });

  const { data: cleaningLogs = [] } = useQuery({
    queryKey: ['cleaningLogs', today],
    queryFn: () => base44.entities.DailyCleaningLog.filter({ date: today }),
    enabled: !!user
  });

  const { data: illnessReports = [] } = useQuery({
    queryKey: ['illnessReports', 'active'],
    queryFn: () => base44.entities.IllnessReport.filter({ status: 'pending' }),
    enabled: !!user
  });

  // Additional data fetches for all operational tools
  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts', today],
    queryFn: () => base44.entities.Shift.filter({ date: today, status: 'clocked_in' }),
    enabled: !!user
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', today],
    queryFn: () => base44.entities.DailyCheckIn.filter({ shift_date: today }),
    enabled: !!user
  });

  const { data: tempAssets = [] } = useQuery({
    queryKey: ['tempAssets'],
    queryFn: () => base44.entities.Assets_Registry_v1?.filter?.({ is_temperature_controlled: true, status: { $ne: 'deactivated' } }) || [],
    enabled: !!user
  });

  const { data: handovers = [] } = useQuery({
    queryKey: ['handovers', today],
    queryFn: () => base44.entities.ShiftHandover.filter({ shift_date: today }),
    enabled: !!user
  });

  const { data: equipmentFaults = [] } = useQuery({
    queryKey: ['faults', today],
    queryFn: () => base44.entities.EquipmentFault.filter({ reported_date: today }),
    enabled: !!user
  });

  const { data: labels = [] } = useQuery({
    queryKey: ['labels', today],
    queryFn: () => base44.entities.FoodLabel.filter({ created_date: { $gte: today } }),
    enabled: !!user
  });

  const { data: briefings = [] } = useQuery({
    queryKey: ['briefings', today],
    queryFn: () => base44.entities.DailyBriefing.filter({ date: today }),
    enabled: !!user
  });

  const { data: openingChecklists = [] } = useQuery({
    queryKey: ['checklists', 'opening'],
    queryFn: () => base44.entities.ChecklistMaster.filter({ checklist_category: 'opening', is_published: true, is_active: true }),
    enabled: !!user
  });

  const { data: closingChecklists = [] } = useQuery({
    queryKey: ['checklists', 'closing'],
    queryFn: () => base44.entities.ChecklistMaster.filter({ checklist_category: 'closing', is_published: true, is_active: true }),
    enabled: !!user
  });

  const { data: todayCompletions = [] } = useQuery({
    queryKey: ['completions', today],
    queryFn: () => base44.entities.ChecklistCompletion.filter({ date: today }),
    enabled: !!user
  });

  const { data: activeCCPs = [] } = useQuery({
    queryKey: ['activeCCPs'],
    queryFn: () => base44.entities.CriticalControlPoint.filter({ is_active: true }),
    enabled: !!user
  });

  const { data: ccpChecksToday = [] } = useQuery({
    queryKey: ['ccpChecks', today],
    queryFn: () => base44.entities.CriticalControlPointCheck.filter({ check_date: today }),
    enabled: !!user
  });

  const { data: hygieneDeclarationsToday = [] } = useQuery({
    queryKey: ['hygieneDeclarationsToday', today],
    queryFn: () => base44.entities.PersonalHygieneDeclaration?.filter?.({ shift_date: today, staff_email: user?.email }) || [],
    enabled: !!user?.email
  });

  const { data: dailyHygieneChecks = [] } = useQuery({
    queryKey: ['dailyHygieneChecks', today],
    queryFn: () => base44.entities.DailyCleaningLog.filter({ date: today, area: 'Hygiene Check' }),
    enabled: !!user
  });

  // Handover mutation
  const handoverMutation = useMutation({
    mutationFn: (data) => base44.entities.ShiftHandover.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['handovers']);
      setSavingHandover(false);
      setShowHandoverChecklist(false);
      alert('✅ Shift handover recorded successfully');
    },
    onError: () => {
      setSavingHandover(false);
      alert('Error saving handover. Please try again.');
    }
  });

  // Checklist completion mutation
  const handleChecklistItemToggle = async (itemId, answer, notes) => {
    if (!completionInProgress || !currentChecklistData) return;
    const answers = completionInProgress.answers || [];
    const existingIndex = answers.findIndex(a => a.item_id === itemId);
    const item = currentChecklistData.items?.find(i => i.item_id === itemId);
    if (!item) return;

    const answerData = { item_id: itemId, question_text: item.question_text, question_type: item.question_type, answer, notes: notes || '', timestamp: new Date().toISOString() };
    if (existingIndex >= 0) answers[existingIndex] = answerData;
    else answers.push(answerData);

    const totalRequired = currentChecklistData.items?.filter(i => i.required).length || 1;
    const completedRequired = answers.filter(a => { const checkItem = currentChecklistData.items?.find(i => i.item_id === a.item_id); return checkItem?.required && a.answer && a.answer !== ''; }).length;
    const percentage = (completedRequired / totalRequired) * 100;

    const failedItems = answers.filter(a => { const checkItem = currentChecklistData.items?.find(i => i.item_id === a.item_id); return checkItem?.auto_fail && a.answer === 'no'; }).map(a => a.item_id);

    const updatedCompletion = { ...completionInProgress, answers, completion_percentage: percentage, failed_items: failedItems, status: failedItems.length > 0 ? 'pending_review' : 'in_progress' };
    setCompletionInProgress(updatedCompletion);

    try {
      if (completionInProgress.id) await base44.entities.ChecklistCompletion.update(completionInProgress.id, updatedCompletion);
      else {
        const created = await base44.entities.ChecklistCompletion.create(updatedCompletion);
        setCompletionInProgress({ ...updatedCompletion, id: created.id });
      }
      queryClient.invalidateQueries(['completions']);
    } catch (error) {
      console.error('Error saving checklist:', error);
    }
  };

  const handleCompleteChecklist = async () => {
    if (!completionInProgress) return;
    try {
      const status = completionInProgress.failed_items?.length > 0 ? 'failed' : 'completed';
      const finalData = { ...completionInProgress, status, completed_at: new Date().toISOString(), completion_percentage: 100 };
      if (completionInProgress.id) await base44.entities.ChecklistCompletion.update(completionInProgress.id, finalData);
      else await base44.entities.ChecklistCompletion.create(finalData);
      queryClient.invalidateQueries(['completions']);
      if (status === 'completed') alert(`✅ ${currentChecklistData?.checklist_name} completed successfully at ${format(new Date(), 'HH:mm')}`);
      else alert(`⚠️ Checklist completed with ${completionInProgress.failed_items.length} failed items. Manager review required.`);
      setShowOpeningChecklist(false);
      setShowClosingChecklist(false);
      setCompletionInProgress(null);
      setCurrentChecklistData(null);
    } catch (error) {
      alert('Error completing checklist. Please try again.');
    }
  };

  const openChecklist = (type) => {
    if (!user?.email) { alert('Please log in to access checklists'); return; }
    const checklists = type === 'opening' ? openingChecklists : closingChecklists;
    const checklist = checklists[0];
    if (!checklist) { alert(`⚠️ No ${type} checklist linked.`); return; }
    setCurrentChecklistData(checklist);
    const existing = todayCompletions.find(c => c.checklist_id === checklist.id && c.user_email === user?.email && c.date === today);
    if (existing) setCompletionInProgress(existing);
    else setCompletionInProgress({ checklist_id: checklist.id, checklist_name: checklist.checklist_name, checklist_category: checklist.checklist_category, date: today, shift: detectShift(), user_id: user?.id, user_name: user?.full_name || user?.email, user_email: user?.email, answers: [], completion_percentage: 0, status: 'in_progress', failed_items: [] });
    if (type === 'opening') setShowOpeningChecklist(true);
    else setShowClosingChecklist(true);
  };

  const checkInMutation = useMutation({
    mutationFn: (data) => base44.entities.DailyCheckIn.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['checkIns']);
      if (openingChecklists.length > 0) setTimeout(() => openChecklist('opening'), 500);
    }
  });

  const handleStartShift = () => {
    if (!user?.email) return;
    const todayDeclaration = hygieneDeclarationsToday.find(d => d.staff_email === user.email && d.shift_date === today);
    if (!todayDeclaration) { alert('⚠️ Hygiene Declaration Required'); setShowHygieneDeclaration(true); return; }
    checkInMutation.mutate({ staff_name: user?.full_name || user?.email, staff_email: user?.email, staff_role: user?.role || 'staff', shift_date: today, shift_type: detectShift(), check_in_time: new Date().toISOString(), status: 'in_progress' });
  };

  const handleHandoverSubmit = async (data) => {
    setSavingHandover(true);
    if (data.has_issues) {
      const managers = shifts.filter(s => s.position?.toLowerCase().includes('manager') && s.staff_email);
      managers.forEach(manager => {
        base44.entities.Notification.create({ recipient_email: manager.staff_email, recipient_name: manager.staff_name, title: '🚨 Shift Handover Alert', message: `Issues reported in ${detectShift()} shift`, type: 'alert', priority: 'high', is_read: false, related_entity: 'ShiftHandover', source_user_email: user?.email, source_user_name: user?.full_name }).catch(() => {});
      });
    }
    handoverMutation.mutate({ shift_date: data.shift_date, shift_type: data.shift_type, answers: data.answers, has_issues: data.has_issues, handover_from: user?.email, handover_from_name: user?.full_name || user?.email });
  };

  const detectShift = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 12) return 'Morning';
    if (currentHour >= 12 && currentHour < 17) return 'Mid';
    return 'Closing';
  };

  // Calculations
  const myCheckIn = checkIns.find(c => c.staff_email === user?.email);
  const tempCompletion = tempAssets.length > 0 ? (temperatureLogs.length / tempAssets.length) * 100 : 100;
  const myOpeningCompletion = todayCompletions.find(c => c.user_email === user?.email && c.checklist_category === 'opening' && c.date === today);
  const myClosingCompletion = todayCompletions.find(c => c.user_email === user?.email && c.checklist_category === 'closing' && c.date === today);
  const pendingCCPs = activeCCPs.filter(ccp => !ccpChecksToday.some(check => check.ccp_id === ccp.id));
  const ccpCompletion = activeCCPs.length > 0 ? ((activeCCPs.length - pendingCCPs.length) / activeCCPs.length) * 100 : 100;

  // Equipment status - determine based on fault count
  const getEquipmentStatus = () => {
    if (equipmentFaults.length > 0) return 'critical';
    if (tempAssets.length > 0 && temperatureLogs.length < tempAssets.length) return 'warning';
    return 'ok';
  };
  const equipmentStatus = getEquipmentStatus();

  // Calculate safety status
  const calculateSafetyStatus = () => {
    // RED conditions - critical issues
    const hasCriticalTempFailure = temperatureLogs.some(log => 
      log.status === 'fail' || log.is_out_of_range === true
    );
    const hasActiveIllness = illnessReports.length > 0;
    
    if (hasCriticalTempFailure || hasActiveIllness) {
      return {
        status: 'STOP',
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-900',
        borderColor: 'border-red-500',
        icon: XCircle,
        emoji: '🔴',
        message: hasCriticalTempFailure 
          ? 'Critical temperature breach detected' 
          : 'Active illness report on file'
      };
    }

    // Check if required tasks are completed
    const hygieneComplete = hygieneDeclarations.some(d => d.all_clear === true);
    const tempsLogged = temperatureLogs.length > 0;
    const cleaningDone = cleaningLogs.some(log => log.status === 'completed' || log.status === 'approved');

    // AMBER - tasks pending
    if (!hygieneComplete || !tempsLogged || !cleaningDone) {
      return {
        status: 'ATTENTION',
        color: 'amber',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-900',
        borderColor: 'border-amber-500',
        icon: AlertTriangle,
        emoji: '🟡',
        message: 'Required daily checks pending'
      };
    }

    // GREEN - all good
    return {
      status: 'SAFE',
      color: 'green',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-900',
      borderColor: 'border-emerald-500',
      icon: CheckCircle2,
      emoji: '🟢',
      message: 'All safety checks complete'
    };
  };

  const safetyStatus = calculateSafetyStatus();

  if (!user) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 pb-24">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">Daily Operations Hub</h1>
          <p className="text-lg text-slate-600">All essential tools to run your shift — fast, simple, live.</p>
        </div>

        {/* Safety Status Indicator */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <Card className={`border-2 ${safetyStatus.borderColor} ${safetyStatus.bgColor} shadow-lg`}>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-4">
                <safetyStatus.icon className={`w-10 h-10 ${safetyStatus.textColor} flex-shrink-0`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-xl font-bold ${safetyStatus.textColor}`}>Safety Status: {safetyStatus.status}</h3>
                    <span className="text-2xl">{safetyStatus.emoji}</span>
                  </div>
                  <p className={`text-sm ${safetyStatus.textColor} opacity-90`}>{safetyStatus.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Equipment Status Indicator */}
        <EquipmentStatusIndicator 
          equipmentStatus={equipmentStatus}
        />

        {/* Shift Start Button */}
        {!myCheckIn && (
          <div className="flex gap-3">
            <Button 
              onClick={handleStartShift} 
              disabled={checkInMutation.isPending || clockInBlocked} 
              className="flex-1 h-12 text-lg font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg"
              size="lg"
            >
              <CheckCircle2 className="w-6 h-6 mr-3" />
              Start Shift
            </Button>
          </div>
        )}

        {/* Today's Required Actions */}
        <TodaysRequiredActions user={user} />

        {/* Mid-Service Checks */}
        {myCheckIn && <MidServiceChecksPanel user={user} shiftDate={today} />}

        {/* Opening, Closing, Briefing & Handover Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button onClick={() => openChecklist('opening')} disabled={!myCheckIn || myOpeningCompletion?.status === 'completed'} className="h-20 text-lg font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg" size="lg">
            <PlayCircle className="w-6 h-6 mr-3" />
            {myOpeningCompletion?.status === 'completed' ? '✓ OPENING' : 'OPENING'}
          </Button>
          <Button onClick={() => setShowBriefingForm(true)} disabled={!myCheckIn || briefings.length > 0} className="h-20 text-lg font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg" size="lg">
            <MessageSquare className="w-6 h-6 mr-3" />
            {briefings.length > 0 ? '✓ BRIEFING' : 'BRIEFING'}
          </Button>
          <Button onClick={() => openChecklist('closing')} disabled={!myCheckIn || myClosingCompletion?.status === 'completed'} className="h-20 text-lg font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg" size="lg">
            <StopCircle className="w-6 h-6 mr-3" />
            {myClosingCompletion?.status === 'completed' ? '✓ CLOSING' : 'CLOSING'}
          </Button>
          <Button onClick={() => setShowHandoverChecklist(true)} disabled={!myCheckIn} className="h-20 text-lg font-bold bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg" size="lg">
            <MessageSquare className="w-6 h-6 mr-3" />
            {handovers.length > 0 ? '✓ HANDOVER' : 'HANDOVER'}
          </Button>
        </div>

        {/* Operational Tools Grid - Complete Set */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Temperature Logs */}
          <OperationCard icon={Thermometer} color="bg-red-500" title="Temperature Logs" summary={`${temperatureLogs.length}/${tempAssets.length} logged`} status={tempCompletion === 100 ? 'complete' : 'pending'} actionButtons={[{ label: '→ Log', onClick: () => setShowTempAssets(true) }]} progress={tempCompletion} />
          {/* Hygiene Check */}
          <OperationCard icon={Droplet} color="bg-cyan-500" title="Hygiene Check" summary="Morning mandatory check" status={dailyHygieneChecks.length > 0 ? 'complete' : 'pending'} actionButtons={[{ label: dailyHygieneChecks.length > 0 ? '✓ Checked' : '→ Check', onClick: () => setShowHygieneCheck(true) }]} />
          {/* CCPs */}
          <OperationCard icon={Shield} color="bg-red-600" title="Critical Control Points" summary={`${pendingCCPs.length} pending`} status={pendingCCPs.length === 0 ? 'complete' : 'pending'} actionButtons={[{ label: '→ Check', onClick: () => setShowCCPModal(true) }]} progress={ccpCompletion} />
          {/* Labels */}
          <OperationCard icon={FileText} color="bg-purple-500" title="Food Labels" summary={`${labels.length} printed`} status={labels.length > 0 ? 'complete' : 'pending'} actionButtons={[{ label: '→ Print', onClick: () => setShowLabelPrinting(true) }]} />
          {/* Hot Holding */}
          <OperationCard icon={Thermometer} color="bg-pink-500" title="Hot Hold Temps" summary="Track holding temps" status="pending" actionButtons={[{ label: '→ Log', onClick: () => setShowHotHoldingForm(true) }]} />
          {/* Equipment */}
          <OperationCard icon={Wrench} color="bg-orange-500" title="Equipment Status" summary={`${equipmentFaults.length} faults`} status={equipmentFaults.length === 0 ? 'complete' : 'pending'} actionButtons={[{ label: '→ Check', onClick: () => navigate(createPageUrl('EquipmentHealth')) }]} />
          {/* Cleaning & Hygiene Hub */}
          <OperationCard icon={Sparkles} color="bg-purple-500" title="Cleaning & Hygiene" summary="Daily, deep clean, hygiene" status="pending" actionButtons={[{ label: '→ Hub', onClick: () => navigate(createPageUrl('CleaningHygieneHub')) }]} />
          {/* Prep Workflow */}
          <OperationCard icon={ChefHat} color="bg-amber-500" title="Prep Workflow" summary="Stock, components, prep" status="pending" actionButtons={[{ label: '→ Manage', onClick: () => navigate(createPageUrl('PrepWorkflow')) }]} />
          {/* Visual Dish Guides */}
          <OperationCard icon={Box} color="bg-emerald-500" title="Dish Assembly" summary="Visual step guides" status="pending" actionButtons={[{ label: '→ View', onClick: () => navigate(createPageUrl('VisualDishGuides')) }]} />
          {/* Service Recovery */}
          <OperationCard icon={AlertTriangle} color="bg-orange-500" title="Issues & Recovery" summary="Faults, waste, recovery" status="pending" actionButtons={[{ label: '→ Report', onClick: () => navigate(createPageUrl('ServiceRecovery')) }]} />
          {/* Flow Board */}
          <OperationCard icon={TrendingUp} color="bg-blue-600" title="Live Orders" summary="Kitchen flow board" status="pending" actionButtons={[{ label: '→ Check', onClick: () => navigate(createPageUrl('FlowBoard')) }]} />
          {/* Allergen Dashboard */}
          <OperationCard icon={ShieldAlert} color="bg-red-600" title="Allergens" summary="Search & verify" status="pending" actionButtons={[{ label: '→ Search', onClick: () => navigate(createPageUrl('AllergenDashboard')) }]} />
        </div>

        {/* Modals */}
        <ChecklistModal open={showOpeningChecklist} onClose={() => setShowOpeningChecklist(false)} checklist={currentChecklistData} existingCompletion={completionInProgress} onItemToggle={handleChecklistItemToggle} onComplete={handleCompleteChecklist} loading={false} user={user} />
        <ChecklistModal open={showClosingChecklist} onClose={() => setShowClosingChecklist(false)} checklist={currentChecklistData} existingCompletion={completionInProgress} onItemToggle={handleChecklistItemToggle} onComplete={handleCompleteChecklist} loading={false} user={user} />

        <Dialog open={showTempAssets} onOpenChange={setShowTempAssets}>
          <DialogContent className="max-w-7xl h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader><DialogTitle>Temperature Logs</DialogTitle></DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <TemperatureLog user={user} />
            </div>
          </DialogContent>
        </Dialog>

        <DailyBriefingForm open={showBriefingForm} onClose={() => setShowBriefingForm(false)} user={user} currentShift={detectShift()} today={today} onSuccess={() => queryClient.invalidateQueries(['briefings'])} />

        <ShiftHandoverChecklist open={showHandoverChecklist} onClose={() => setShowHandoverChecklist(false)} user={user} shift={detectShift()} date={today} onSubmit={handleHandoverSubmit} loading={savingHandover} />

        <LabelPrintingModal open={showLabelPrinting} onClose={() => setShowLabelPrinting(false)} user={user} today={today} />

        {showCCPModal && activeCCPs.length > 0 && (
          <Dialog open={showCCPModal} onOpenChange={setShowCCPModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Select CCP to Check</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {activeCCPs.map((ccp) => {
                  const checked = ccpChecksToday.some(c => c.ccp_id === ccp.id);
                  return (
                    <Card key={ccp.id} className={`transition-all ${checked ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300'}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-slate-900">{ccp.name}</h4>
                          {checked && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                        </div>
                        <Badge className="text-xs bg-amber-100 text-amber-800">Limit: {ccp.critical_limit}</Badge>
                        {!checked && (
                          <Button onClick={() => { setActiveCCP(ccp); setShowCCPModal(false); }} className="w-full mt-3 bg-red-600 hover:bg-red-700" size="sm">
                            Check CCP
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <Button variant="outline" onClick={() => setShowCCPModal(false)} className="w-full">Close</Button>
            </DialogContent>
          </Dialog>
        )}

        <CCPCheckModal open={!!activeCCP && !showCCPModal} onClose={() => setActiveCCP(null)} ccp={activeCCP} user={user} onSuccess={() => { queryClient.invalidateQueries(['ccpChecks']); queryClient.invalidateQueries(['activeCCPs']); }} />

        <HotHoldingForm open={showHotHoldingForm} onClose={() => setShowHotHoldingForm(false)} user={user} today={today} />

        <Dialog open={showHygieneCheck} onOpenChange={setShowHygieneCheck}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Daily Hygiene Check</DialogTitle></DialogHeader>
            <HygieneCheckForm user={user} onSuccess={() => { queryClient.invalidateQueries(['dailyHygieneChecks']); setShowHygieneCheck(false); }} onCancel={() => setShowHygieneCheck(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={showHygieneDeclaration} onOpenChange={setShowHygieneDeclaration}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Personal Hygiene Declaration Required</DialogTitle></DialogHeader>
            <PersonalHygieneDeclarationForm user={user} shiftDate={today} onBlockClockIn={(blocked) => setClockInBlocked(blocked)} onSuccess={() => { setShowHygieneDeclaration(false); queryClient.invalidateQueries(['hygieneDeclarations']); setTimeout(() => handleStartShift(), 500); }} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
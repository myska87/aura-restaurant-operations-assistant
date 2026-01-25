import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  ClipboardCheck,
  MessageSquare,
  Thermometer,
  FileText,
  Wrench,
  History,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  MessageCircle,
  BarChart3,
  Settings,
  PlayCircle,
  StopCircle,
  Droplet,
  Eye,
  Shield,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ChecklistModal from '@/components/operations/ChecklistModal';
import TemperatureLog from '@/components/operations/TemperatureLog';
import DailyBriefingForm from '@/components/operations/DailyBriefingForm';
import ShiftHandoverChecklist from '@/components/operations/ShiftHandoverChecklist';
import LabelPrintingModal from '@/components/operations/LabelPrintingModal';
import InteractiveStagesDashboard from '@/components/operations/InteractiveStagesDashboard';
import ServiceReadinessPanel from '@/components/operations/ServiceReadinessPanel';
import ResetFormsButton from '@/components/operations/ResetFormsButton';
import CCPCheckModal from '@/components/operations/CCPCheckModal';
import CCPEnforcement from '@/components/operations/CCPEnforcement';
import ServiceLockdownNotice from '@/components/operations/ServiceLockdownNotice';
import HotHoldingForm from '@/components/operations/HotHoldingForm';
import PersonalHygieneDeclarationForm from '@/components/hygiene/PersonalHygieneDeclarationForm';
import HygieneCheckForm from '@/components/cleaning/HygieneCheckForm';
import OperationCard from '@/components/operate/OperationCard';
import { AnimatePresence } from 'framer-motion';

export default function DailyOperationsHub() {
  const [user, setUser] = useState(null);
  const [showOpeningChecklist, setShowOpeningChecklist] = useState(false);
  const [showClosingChecklist, setShowClosingChecklist] = useState(false);
  const [currentChecklistData, setCurrentChecklistData] = useState(null);
  const [showTempAssets, setShowTempAssets] = useState(false);
  const [showBriefingForm, setShowBriefingForm] = useState(false);
  const [showHandoverChecklist, setShowHandoverChecklist] = useState(false);
  const [savingHandover, setSavingHandover] = useState(false);
  const [showLabelPrinting, setShowLabelPrinting] = useState(false);
  const [showCCPModal, setShowCCPModal] = useState(false);
  const [activeCCP, setActiveCCP] = useState(null);
  const [showHotHoldingForm, setShowHotHoldingForm] = useState(false);
  const [showHygieneDeclaration, setShowHygieneDeclaration] = useState(false);
  const [showHygieneCheck, setShowHygieneCheck] = useState(false);
  const [blockedMenuItems, setBlockedMenuItems] = useState([]);
  const [failedCCPs, setFailedCCPs] = useState([]);
  const [clockInBlocked, setClockInBlocked] = useState(false);
  const [showShiftCloseBlocker, setShowShiftCloseBlocker] = useState(false);
  const [missingItems, setMissingItems] = useState([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const today = format(new Date(), 'yyyy-MM-dd');
  const currentHour = new Date().getHours();
  
  const detectShift = () => {
    if (currentHour >= 5 && currentHour < 12) return 'Morning';
    if (currentHour >= 12 && currentHour < 17) return 'Mid';
    return 'Closing';
  };
  const currentShift = detectShift();

  // Fetch today's data
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

  const { data: temperatureLogs = [] } = useQuery({
    queryKey: ['temps', today],
    queryFn: () => base44.entities.TemperatureLog.filter({ log_date: today }),
    enabled: !!user
  });

  const { data: tempAssets = [] } = useQuery({
    queryKey: ['tempAssets'],
    queryFn: () => base44.entities.Assets_Registry_v1.filter({ 
      is_temperature_controlled: true,
      status: { $ne: 'deactivated' }
    }),
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

  const { data: prepLogs = [] } = useQuery({
    queryKey: ['prepLogs', today],
    queryFn: () => base44.entities.PrepChecklistLog.filter({ date: today }),
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

  const { data: hygieneDeclarations = [] } = useQuery({
    queryKey: ['hygieneDeclarations', today],
    queryFn: () => base44.entities.PersonalHygieneDeclaration?.filter?.({ 
      shift_date: today,
      staff_email: user?.email 
    }) || [],
    enabled: !!user?.email
  });

  const { data: dailyHygieneChecks = [] } = useQuery({
    queryKey: ['dailyHygieneChecks', today],
    queryFn: () => base44.entities.DailyCleaningLog.filter({ 
      date: today,
      area: 'Hygiene Check'
    }),
    enabled: !!user
  });

  const { data: dailyCleaningLogs = [] } = useQuery({
    queryKey: ['dailyCleaningLogs', today],
    queryFn: () => base44.entities.DailyCleaningLog.filter({ 
      date: today,
      status: 'completed'
    }),
    enabled: !!user
  });

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

  const handleHandoverSubmit = async (data) => {
    setSavingHandover(true);
    
    // Notify managers if there are issues
    if (data.has_issues) {
      const managers = shifts.filter(s => 
        s.position?.toLowerCase().includes('manager') && s.staff_email
      );
      
      const issues = [];
      Object.entries(data.answers).forEach(([key, val]) => {
        if (val.answer === 'yes' && val.details) {
          issues.push(`${key.replace(/_/g, ' ')}: ${val.details}`);
        }
      });

      managers.forEach(manager => {
        base44.entities.Notification.create({
          recipient_email: manager.staff_email,
          recipient_name: manager.staff_name,
          title: '🚨 Shift Handover Alert',
          message: `Issues reported in ${currentShift} shift: ${issues.join(' | ')}`,
          type: 'alert',
          priority: 'high',
          is_read: false,
          related_entity: 'ShiftHandover',
          source_user_email: user?.email,
          source_user_name: user?.full_name
        }).catch(() => {});
      });
    }

    handoverMutation.mutate({
      shift_date: data.shift_date,
      shift_type: data.shift_type,
      answers: data.answers,
      has_issues: data.has_issues,
      handover_from: user?.email,
      handover_from_name: user?.full_name || user?.email
    });
  };

  // Fetch checklists from ChecklistMaster
  const { data: openingChecklists = [] } = useQuery({
    queryKey: ['checklists', 'opening'],
    queryFn: () => base44.entities.ChecklistMaster.filter({ 
      checklist_category: 'opening',
      is_published: true,
      is_active: true 
    }),
    enabled: !!user
  });

  const { data: closingChecklists = [] } = useQuery({
    queryKey: ['checklists', 'closing'],
    queryFn: () => base44.entities.ChecklistMaster.filter({ 
      checklist_category: 'closing',
      is_published: true,
      is_active: true 
    }),
    enabled: !!user
  });

  const { data: todayCompletions = [] } = useQuery({
    queryKey: ['completions', today],
    queryFn: () => base44.entities.ChecklistCompletion.filter({ date: today }),
    enabled: !!user
  });

  // Get dishwasher status from checklist answers
  const latestCompletion = todayCompletions.sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  )[0];
  
  // Check if any checklist has a dishwasher-related answer
  const dishwasherAnswer = latestCompletion?.answers?.find(a => 
    a.question_text?.toLowerCase().includes('dishwasher') || 
    a.item_id?.toLowerCase().includes('dishwasher')
  );
  
  // Status is 'on' if dishwasher was turned on (yes), 'off' if turned off (no) or not answered
  const dishwasherStatus = dishwasherAnswer?.answer === 'yes' ? 'on' : 'off';

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (data) => base44.entities.DailyCheckIn.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['checkIns']);
      // Auto-open opening checklist after successful check-in
      if (openingChecklists.length > 0) {
        setTimeout(() => openChecklist('opening'), 500);
      }
    }
  });

  // Checklist completion mutation
  const [completionInProgress, setCompletionInProgress] = useState(null);

  const handleChecklistItemToggle = async (itemId, answer, notes) => {
    if (!completionInProgress || !currentChecklistData) return;

    const answers = completionInProgress.answers || [];
    const existingIndex = answers.findIndex(a => a.item_id === itemId);
    
    const item = currentChecklistData.items?.find(i => i.item_id === itemId);
    if (!item) return;

    const answerData = {
      item_id: itemId,
      question_text: item.question_text,
      question_type: item.question_type,
      answer: answer,
      notes: notes || '',
      timestamp: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      answers[existingIndex] = answerData;
    } else {
      answers.push(answerData);
    }

    // Calculate completion
    const totalRequired = currentChecklistData.items?.filter(i => i.required).length || 1;
    const completedRequired = answers.filter(a => {
      const checkItem = currentChecklistData.items?.find(i => i.item_id === a.item_id);
      return checkItem?.required && a.answer && a.answer !== '';
    }).length;
    const percentage = (completedRequired / totalRequired) * 100;

    // Check for failed items
    const failedItems = answers
      .filter(a => {
        const checkItem = currentChecklistData.items?.find(i => i.item_id === a.item_id);
        return checkItem?.auto_fail && a.answer === 'no';
      })
      .map(a => a.item_id);

    const updatedCompletion = {
      ...completionInProgress,
      answers,
      completion_percentage: percentage,
      failed_items: failedItems,
      status: failedItems.length > 0 ? 'pending_review' : 'in_progress'
    };

    setCompletionInProgress(updatedCompletion);

    // Save to database
    try {
      if (completionInProgress.id) {
        await base44.entities.ChecklistCompletion.update(completionInProgress.id, updatedCompletion);
      } else {
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
      
      const finalData = {
        ...completionInProgress,
        status,
        completed_at: new Date().toISOString(),
        completion_percentage: 100
      };

      if (completionInProgress.id) {
        await base44.entities.ChecklistCompletion.update(completionInProgress.id, finalData);
      } else {
        await base44.entities.ChecklistCompletion.create(finalData);
      }

      queryClient.invalidateQueries(['completions']);
      
      // Show success message
      if (status === 'completed') {
        alert(`✅ ${currentChecklistData?.checklist_name} completed successfully at ${format(new Date(), 'HH:mm')}`);
      } else {
        alert(`⚠️ Checklist completed with ${completionInProgress.failed_items.length} failed items. Manager review required.`);
      }
      
      setShowOpeningChecklist(false);
      setShowClosingChecklist(false);
      setCompletionInProgress(null);
      setCurrentChecklistData(null);
    } catch (error) {
      alert('Error completing checklist. Please try again.');
    }
  };

  const checkShiftCloseRequirements = () => {
    const missing = [];

    // Check if daily cleaning tasks are completed
    if (dailyCleaningLogs.length === 0) {
      missing.push({
        id: 'cleaning',
        title: 'Daily Cleaning Tasks',
        description: 'No cleaning tasks completed today',
        action: () => navigate(createPageUrl('CleaningHygieneHub'))
      });
    }

    // Check if required temperature logs are completed
    const requiredTempCount = tempAssets.length;
    if (temperatureLogs.length < requiredTempCount) {
      missing.push({
        id: 'temps',
        title: 'Temperature Logs',
        description: `Missing ${requiredTempCount - temperatureLogs.length} of ${requiredTempCount} required temperature checks`,
        action: () => setShowTempAssets(true)
      });
    }

    return missing;
  };

  const openChecklist = (type) => {
    if (!user?.email) {
      alert('Please log in to access checklists');
      return;
    }

    // For closing checklist, check requirements first
    if (type === 'closing') {
      const missing = checkShiftCloseRequirements();
      if (missing.length > 0) {
        setMissingItems(missing);
        setShowShiftCloseBlocker(true);
        return;
      }
    }

    const checklists = type === 'opening' ? openingChecklists : closingChecklists;
    const checklist = checklists[0];
    
    if (!checklist) {
      alert(`⚠️ No ${type} checklist linked.\n\nPlease create and publish one in:\nSettings → Checklist Library → Create New`);
      return;
    }

    setCurrentChecklistData(checklist);

    const existing = todayCompletions.find(c => 
      c.checklist_id === checklist.id && 
      c.user_email === user?.email &&
      c.date === today
    );

    if (existing) {
      setCompletionInProgress(existing);
    } else {
      setCompletionInProgress({
        checklist_id: checklist.id,
        checklist_name: checklist.checklist_name,
        checklist_category: checklist.checklist_category,
        date: today,
        shift: currentShift,
        user_id: user?.id,
        user_name: user?.full_name || user?.email,
        user_email: user?.email,
        answers: [],
        completion_percentage: 0,
        status: 'in_progress',
        failed_items: []
      });
    }

    if (type === 'opening') {
      setShowOpeningChecklist(true);
    } else {
      if (dishwasherStatus === 'on') {
        alert('⚠️ Please confirm dishwasher has been turned OFF before closing.');
      }
      setShowClosingChecklist(true);
    }
  };

  const handleStartShift = () => {
    if (!user?.email) return;
    
    // Check if hygiene declaration exists for today
    const todayDeclaration = hygieneDeclarations.find(d => 
      d.staff_email === user.email && 
      d.shift_date === today
    );
    
    if (!todayDeclaration) {
      // Block clock-in, show hygiene declaration modal
      alert('⚠️ Hygiene Declaration Required\n\nYou must complete your Personal Hygiene Declaration before starting your shift.');
      setShowHygieneDeclaration(true);
      return;
    }
    
    checkInMutation.mutate({
      staff_name: user?.full_name || user?.email,
      staff_email: user?.email,
      staff_role: user?.role || 'staff',
      shift_date: today,
      shift_type: currentShift,
      check_in_time: new Date().toISOString(),
      status: 'in_progress'
    });
  };

  // Calculate completion
  const myCheckIn = checkIns.find(c => c.staff_email === user?.email);
  const tempCompletion = tempAssets.length > 0 ? (temperatureLogs.length / tempAssets.length) * 100 : 100;
  
  const myOpeningCompletion = todayCompletions.find(c => 
    c.user_email === user?.email && 
    c.checklist_category === 'opening' && 
    c.date === today
  );
  const myClosingCompletion = todayCompletions.find(c => 
    c.user_email === user?.email && 
    c.checklist_category === 'closing' && 
    c.date === today
  );
  const checklistCompletion = myOpeningCompletion?.status === 'completed' ? 100 : 0;

  // CCP completion tracking
  const pendingCCPs = activeCCPs.filter(ccp => 
    !ccpChecksToday.some(check => check.ccp_id === ccp.id)
  );
  const ccpCompletion = activeCCPs.length > 0 
    ? ((activeCCPs.length - pendingCCPs.length) / activeCCPs.length) * 100 
    : 100;

  const overallCompletion = myCheckIn ? 
    ((tempCompletion + (handovers.length > 0 ? 100 : 0) + checklistCompletion + ccpCompletion) / 4) : 0;

  const manager = shifts.find(s => s.position?.toLowerCase().includes('manager'));

  if (!user) return <LoadingSpinner />;

  const operationTiles = [
    {
      title: 'Hygiene Check',
      summary: 'Morning mandatory check',
      icon: Droplet,
      color: 'bg-cyan-500',
      onClick: () => setShowHygieneCheck(true),
      status: dailyHygieneChecks.length > 0 ? 'complete' : 'pending',
      actionButtons: [
        { label: dailyHygieneChecks.length > 0 ? '✓ Completed' : '→ Check Now', onClick: () => setShowHygieneCheck(true) }
      ],
      details: 'Confirm all mandatory hygiene standards are met before service.'
    },
    {
      title: 'Opening',
      summary: 'Checklists & prep',
      icon: PlayCircle,
      color: 'bg-emerald-500',
      status: myOpeningCompletion?.status === 'completed' ? 'complete' : 'pending',
      actionButtons: [
        { label: myOpeningCompletion?.status === 'completed' ? '✓ Complete' : '→ Start', onClick: () => openChecklist('opening') }
      ],
      progress: myOpeningCompletion?.completion_percentage || 0,
      details: 'Complete opening checklist to start service.'
    },
    {
      title: 'Temperatures',
      summary: `${temperatureLogs.length}/${tempAssets.length} logged`,
      icon: Thermometer,
      color: 'bg-red-500',
      onClick: () => setShowTempAssets(true),
      status: tempCompletion === 100 ? 'complete' : 'pending',
      actionButtons: [
        { label: '→ Log', onClick: () => setShowTempAssets(true) }
      ],
      progress: tempCompletion,
      details: 'Monitor all temperature-controlled equipment throughout the day.'
    },
    {
      title: 'Handover',
      summary: `${handovers.filter(h => h.shift_date === today).length} logged`,
      icon: MessageSquare,
      color: 'bg-amber-500',
      onClick: () => setShowHandoverChecklist(true),
      status: handovers.filter(h => h.shift_date === today).length > 0 ? 'complete' : 'pending',
      actionButtons: [
        { label: '→ Log', onClick: () => setShowHandoverChecklist(true) }
      ],
      details: 'Pass critical info to the next shift.'
    },
    {
      title: 'Labels',
      summary: `${labels.filter(l => l.created_date?.startsWith(today)).length} printed`,
      icon: FileText,
      color: 'bg-purple-500',
      onClick: () => setShowLabelPrinting(true),
      status: labels.filter(l => l.created_date?.startsWith(today)).length > 0 ? 'complete' : 'pending',
      actionButtons: [
        { label: '→ Print', onClick: () => setShowLabelPrinting(true) }
      ],
      details: 'Print and track food safety labels for traceability.'
    },
    {
      title: 'Equipment',
      summary: `${equipmentFaults.length} faults`,
      icon: Wrench,
      color: 'bg-orange-500',
      status: equipmentFaults.length === 0 ? 'complete' : 'pending',
      actionButtons: [
        { label: '→ Check', onClick: () => navigate(createPageUrl('EquipmentHealth')) }
      ],
      details: 'Report equipment issues and maintenance needs immediately.'
    },
    {
      title: 'CCPs',
      summary: `${pendingCCPs.length} pending`,
      icon: Shield,
      color: 'bg-red-600',
      onClick: () => setShowCCPModal(true),
      status: pendingCCPs.length === 0 ? 'complete' : 'pending',
      actionButtons: [
        { label: '→ Check', onClick: () => setShowCCPModal(true) }
      ],
      progress: ccpCompletion,
      details: 'Mandatory Critical Control Point compliance checks.'
    },
    {
      title: 'Hot Hold',
      summary: 'Track holding temps',
      icon: Thermometer,
      color: 'bg-pink-500',
      onClick: () => setShowHotHoldingForm(true),
      status: 'pending',
      actionButtons: [
        { label: '→ Log', onClick: () => setShowHotHoldingForm(true) }
      ],
      details: 'Monitor food holding temperatures during service.'
    },
    {
      title: 'Closing',
      summary: 'End of shift',
      icon: StopCircle,
      color: 'bg-red-600',
      status: myClosingCompletion?.status === 'completed' ? 'complete' : 'pending',
      actionButtons: [
        { label: myClosingCompletion?.status === 'completed' ? '✓ Complete' : '→ Close', onClick: () => openChecklist('closing') }
      ],
      progress: myClosingCompletion?.completion_percentage || 0,
      details: 'Complete closing checklist before leaving.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 pb-24">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
            Daily Operations Hub
          </h1>
          <p className="text-lg text-slate-600">
            All essential tools to run your shift — fast, simple, live.
          </p>
        </div>

        {/* Admin Tools Section */}
        {user?.role === 'admin' && (
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">🛠️ Admin Tools</h3>
                  <p className="text-sm text-slate-600">Reset active forms for testing or training</p>
                </div>
                <ResetFormsButton user={user} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interactive Stages Dashboard */}
        <InteractiveStagesDashboard
          onOpeningClick={() => openChecklist('opening')}
          onServiceClick={() => setShowTempAssets(true)}
          onClosingClick={() => openChecklist('closing')}
          openingCompletion={myOpeningCompletion?.completion_percentage || 0}
          serviceCompletion={tempCompletion}
          closingCompletion={myClosingCompletion?.completion_percentage || 0}
          isShiftActive={!!myCheckIn}
        />

        {/* CCP Enforcement & Blocked Items Alert */}
        {myCheckIn && (
          <CCPEnforcement 
            user={user}
            blockedItems={blockedMenuItems}
            onBlockedItemsChange={(items) => {
              setBlockedMenuItems(items);
              // Update failed CCPs from the checks
              const failedChecks = ccpChecksToday.filter(c => c.status === 'fail');
              setFailedCCPs(failedChecks);
            }}
          />
        )}

        {/* Service Lockdown Notice - Global Alert */}
        {failedCCPs.length > 0 && (
          <ServiceLockdownNotice failedCCPs={failedCCPs} />
        )}

        {/* Service Readiness Panel - Prep & Hygiene Forms */}
         {myCheckIn && (
           <ServiceReadinessPanel 
             user={user} 
             shift={currentShift} 
             date={today} 
           />
         )}

        {/* Opening, Closing, Briefing & Handover Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Button
              onClick={() => openChecklist('opening')}
              disabled={!myCheckIn || myOpeningCompletion?.status === 'completed'}
              className="h-20 w-full text-lg font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg"
              size="lg"
            >
              <PlayCircle className="w-6 h-6 mr-3" />
              {myOpeningCompletion?.status === 'completed' ? '✓ OPENING COMPLETE' : 'OPENING CHECKLIST'}
            </Button>
            {myOpeningCompletion?.status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(createPageUrl('OperationsHistory'))}
                className="w-full flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Report
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <Button
              onClick={() => setShowBriefingForm(true)}
              disabled={!myCheckIn || briefings.length > 0}
              className="h-20 w-full text-lg font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
              size="lg"
            >
              <MessageSquare className="w-6 h-6 mr-3" />
              {briefings.length > 0 ? '✓ BRIEFING LOGGED' : 'DAILY BRIEFING'}
            </Button>
            {briefings.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(createPageUrl('OperationsHistory'))}
                className="w-full flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <Button
              onClick={() => openChecklist('closing')}
              disabled={!myCheckIn || myClosingCompletion?.status === 'completed'}
              className="h-20 w-full text-lg font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg"
              size="lg"
            >
              <StopCircle className="w-6 h-6 mr-3" />
              {myClosingCompletion?.status === 'completed' ? '✓ CLOSING COMPLETE' : 'CLOSING CHECKLIST'}
            </Button>
            {myClosingCompletion?.status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(createPageUrl('OperationsHistory'))}
                className="w-full flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Report
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => setShowHandoverChecklist(true)}
              disabled={!myCheckIn}
              className="h-20 w-full text-lg font-bold bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg"
              size="lg"
            >
              <MessageSquare className="w-6 h-6 mr-3" />
              {handovers.filter(h => h.shift_date === today).length > 0 ? '✓ HANDOVER LOGGED' : 'SHIFT HANDOVER'}
            </Button>
            {handovers.filter(h => h.shift_date === today).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(createPageUrl('OperationsHistory'))}
                className="w-full flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </Button>
            )}
          </div>
        </div>

        {/* Shift Summary Card */}
        <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-0 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-1">
              <div>
                <p className="text-emerald-100 text-xs mb-1">Date</p>
                <p className="font-bold">{format(new Date(), 'd MMM yyyy')}</p>
              </div>
              <div>
                <p className="text-emerald-100 text-xs mb-1">Shift</p>
                <p className="font-bold">{currentShift}</p>
              </div>
              <div>
                <p className="text-emerald-100 text-xs mb-1">Active Staff</p>
                <p className="font-bold">{shifts.length} on shift</p>
              </div>
              <div>
                <p className="text-emerald-100 text-xs mb-1">Manager on Duty</p>
                <p className="font-bold text-sm">{manager?.staff_name || 'None'}</p>
              </div>
                <div>
                  <p className="text-emerald-100 text-xs mb-1">Completion</p>
                  <p className="font-bold">{Math.round(overallCompletion)}%</p>
                </div>
              </div>
              
              {/* Dishwasher Status Badge */}
              <div className="ml-4">
                <Badge 
                  className={`text-lg px-4 py-2 ${
                    dishwasherStatus === 'on' 
                      ? 'bg-green-500 animate-pulse' 
                      : 'bg-slate-600'
                  }`}
                >
                  <Droplet className="w-5 h-5 mr-2" />
                  Dishwasher: {dishwasherStatus.toUpperCase()}
                </Badge>
              </div>
            </div>
            
            <Progress value={overallCompletion} className="h-3 bg-emerald-800 mb-4" />
            
            <div className="flex gap-3">
              {!myCheckIn ? (
                <Button
                  onClick={handleStartShift}
                  disabled={checkInMutation.isPending || clockInBlocked}
                  className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Start Shift
                </Button>
              ) : (
                <Badge className="bg-white text-emerald-700 text-sm px-4 py-2">
                  ✓ Shift Active
                </Badge>
              )}
              {clockInBlocked && (
                <Badge className="bg-red-600 text-white text-sm px-4 py-2">
                  Manager Approval Pending
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alert Banner */}
        {!myCheckIn && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-amber-300 bg-amber-50">
              <CardContent className="pt-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <p className="text-amber-900 font-medium">
                  Start your shift to unlock all operational tools
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {tempCompletion < 100 && myCheckIn && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-4 flex items-center gap-3">
                <Thermometer className="w-5 h-5 text-red-600" />
                <p className="text-red-900 font-medium">
                  Temperature logs incomplete — {tempAssets.length - temperatureLogs.length} equipment pending
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Operations Grid - Fast & Action-Focused */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {operationTiles.map((tile, idx) => (
            <OperationCard
              key={tile.title}
              icon={tile.icon}
              color={tile.color}
              title={tile.title}
              summary={tile.summary}
              details={tile.details}
              status={tile.status}
              actionButtons={tile.actionButtons}
              progress={tile.progress}
              lastUpdate={tile.lastUpdate ? format(new Date(tile.lastUpdate), 'HH:mm') : null}
            />
          ))}
        </div>

        {/* Checklist Modals */}
        <ChecklistModal
          open={showOpeningChecklist}
          onClose={() => setShowOpeningChecklist(false)}
          checklist={currentChecklistData}
          existingCompletion={completionInProgress}
          onItemToggle={handleChecklistItemToggle}
          onComplete={handleCompleteChecklist}
          loading={false}
          user={user}
        />

        <ChecklistModal
          open={showClosingChecklist}
          onClose={() => setShowClosingChecklist(false)}
          checklist={currentChecklistData}
          existingCompletion={completionInProgress}
          onItemToggle={handleChecklistItemToggle}
          onComplete={handleCompleteChecklist}
          loading={false}
          user={user}
        />

        {/* Temperature Logging Component */}
        <Dialog open={showTempAssets} onOpenChange={setShowTempAssets}>
          <DialogContent className="max-w-7xl h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Temperature Logs</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <TemperatureLog user={user} />
            </div>
          </DialogContent>
        </Dialog>

        {/* Daily Briefing Form */}
        <DailyBriefingForm
          open={showBriefingForm}
          onClose={() => setShowBriefingForm(false)}
          user={user}
          currentShift={currentShift}
          today={today}
          onSuccess={() => queryClient.invalidateQueries(['briefings'])}
        />

        {/* Shift Handover Checklist */}
        <ShiftHandoverChecklist
          open={showHandoverChecklist}
          onClose={() => setShowHandoverChecklist(false)}
          user={user}
          shift={currentShift}
          date={today}
          onSubmit={handleHandoverSubmit}
          loading={savingHandover}
        />

        {/* Label Printing Modal */}
        <LabelPrintingModal
          open={showLabelPrinting}
          onClose={() => setShowLabelPrinting(false)}
          user={user}
          today={today}
        />

        {/* CCP Selection Modal */}
        {showCCPModal && activeCCPs.length > 0 && (
          <Dialog open={showCCPModal} onOpenChange={setShowCCPModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Select CCP to Check</DialogTitle>
                <DialogDescription>
                  Mandatory Critical Control Point checks for today ({ccpChecksToday.length} completed)
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {activeCCPs.map((ccp) => {
                  const checked = ccpChecksToday.some(c => c.ccp_id === ccp.id);
                  const latestCheck = ccpChecksToday.find(c => c.ccp_id === ccp.id);
                  return (
                    <Card 
                      key={ccp.id}
                      className={`transition-all ${
                        checked 
                          ? 'border-emerald-400 bg-emerald-50' 
                          : 'border-slate-300'
                      }`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-slate-900">{ccp.name}</h4>
                          {checked && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                        </div>
                        <p className="text-xs text-slate-600 mb-2">{ccp.stage} • {ccp.monitoring_parameter}</p>
                        <Badge className="text-xs bg-amber-100 text-amber-800">
                          Limit: {ccp.critical_limit}
                        </Badge>
                        {latestCheck && (
                          <p className={`text-xs mt-2 font-semibold ${
                            latestCheck.status === 'pass' ? 'text-emerald-700' : 'text-red-700'
                          }`}>
                            Result: {latestCheck.status.toUpperCase()} ({latestCheck.recorded_value})
                          </p>
                        )}
                        {!checked && (
                          <Button 
                            onClick={() => {
                              setActiveCCP(ccp);
                              setShowCCPModal(false);
                            }}
                            className="w-full mt-3 bg-red-600 hover:bg-red-700"
                            size="sm"
                          >
                            Check CCP
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowCCPModal(false)}
                className="w-full"
              >
                Close
              </Button>
            </DialogContent>
          </Dialog>
        )}

        {/* CCP Check Modal */}
        <CCPCheckModal
          open={!!activeCCP && !showCCPModal}
          onClose={() => setActiveCCP(null)}
          ccp={activeCCP}
          user={user}
          onSuccess={() => {
            queryClient.invalidateQueries(['ccpChecks']);
            queryClient.invalidateQueries(['activeCCPs']);
          }}
        />

        {/* Hot Holding Form */}
        <HotHoldingForm
          open={showHotHoldingForm}
          onClose={() => setShowHotHoldingForm(false)}
          user={user}
          today={today}
        />

        {/* Daily Hygiene Check Form */}
        <Dialog open={showHygieneCheck} onOpenChange={setShowHygieneCheck}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Daily Hygiene Check</DialogTitle>
            </DialogHeader>
            {user && (
              <HygieneCheckForm
                user={user}
                onSuccess={() => {
                  queryClient.invalidateQueries(['dailyHygieneChecks']);
                  setShowHygieneCheck(false);
                }}
                onCancel={() => setShowHygieneCheck(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Personal Hygiene Declaration Modal */}
        <Dialog open={showHygieneDeclaration} onOpenChange={setShowHygieneDeclaration}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Personal Hygiene Declaration Required</DialogTitle>
              <p className="text-sm text-slate-600 mt-2">
                Complete this declaration to confirm you're fit to handle food before starting your shift.
              </p>
            </DialogHeader>
            {user && (
              <PersonalHygieneDeclarationForm 
                user={user}
                shiftDate={today}
                onBlockClockIn={(blocked) => setClockInBlocked(blocked)}
                onSuccess={() => {
                  setShowHygieneDeclaration(false);
                  queryClient.invalidateQueries(['hygieneDeclarations']);
                  // Now allow clock-in
                  setTimeout(() => handleStartShift(), 500);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Shift Close Blocker Modal */}
        <Dialog open={showShiftCloseBlocker} onOpenChange={setShowShiftCloseBlocker}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-6 h-6" />
                Complete Required Safety Actions Before Closing
              </DialogTitle>
              <DialogDescription>
                No day ends without compliance evidence. All items must be completed before you can close the shift.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {missingItems.map((item) => (
                <div 
                  key={item.id}
                  className="border-2 border-red-200 bg-red-50 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900">{item.title}</h4>
                      <p className="text-sm text-red-700 mt-1">{item.description}</p>
                    </div>
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  </div>
                  <Button
                    onClick={() => {
                      item.action();
                      setShowShiftCloseBlocker(false);
                    }}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 w-full"
                  >
                    Complete Now
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-600 text-center pt-4 border-t">
              After completing all items, return to close your shift.
            </p>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bottom Quick Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl z-50 lg:left-72">
        <div className="flex items-center justify-around h-16 max-w-7xl mx-auto px-4">
          <Link to={createPageUrl('DailyOperationsHub')}>
            <Button variant="ghost" size="sm" className="flex flex-col h-14 gap-1">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span className="text-xs">Daily Ops</span>
            </Button>
          </Link>
          <Link to={createPageUrl('Operations')}>
            <Button variant="ghost" size="sm" className="flex flex-col h-14 gap-1">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-xs">Tasks</span>
            </Button>
          </Link>
          <Link to={createPageUrl('ShiftHandovers')}>
            <Button variant="ghost" size="sm" className="flex flex-col h-14 gap-1">
              <MessageCircle className="w-5 h-5 text-amber-600" />
              <span className="text-xs">Comms</span>
            </Button>
          </Link>
          <Link to={createPageUrl('Reports')}>
            <Button variant="ghost" size="sm" className="flex flex-col h-14 gap-1">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <span className="text-xs">Reports</span>
            </Button>
          </Link>
          <Link to={createPageUrl('EquipmentHealth')}>
            <Button variant="ghost" size="sm" className="flex flex-col h-14 gap-1">
              <Settings className="w-5 h-5 text-slate-600" />
              <span className="text-xs">Tools</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
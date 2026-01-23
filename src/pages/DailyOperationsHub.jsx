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
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ChecklistModal from '@/components/operations/ChecklistModal';
import TemperatureLog from '@/components/operations/TemperatureLog';
import DailyBriefingForm from '@/components/operations/DailyBriefingForm';
import ShiftHandoverChecklist from '@/components/operations/ShiftHandoverChecklist';
import LabelPrintingModal from '@/components/operations/LabelPrintingModal';

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

  // Get dishwasher status
  const latestCompletion = todayCompletions.sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  )[0];
  const dishwasherStatus = latestCompletion?.dishwasher_status || 'off';

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (data) => base44.entities.DailyCheckIn.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['checkIns']);
      // Auto-open opening checklist on check-in
      if (openingChecklists.length > 0) {
        setShowOpeningChecklist(true);
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

  const openChecklist = (type) => {
    if (!user?.email) {
      alert('Please log in to access checklists');
      return;
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

  const overallCompletion = myCheckIn ? 
    ((tempCompletion + (handovers.length > 0 ? 100 : 0) + checklistCompletion) / 3) : 0;

  const manager = shifts.find(s => s.position?.toLowerCase().includes('manager'));

  if (!user) return <LoadingSpinner />;

  const operationTiles = [
    {
      title: 'Daily Check-In',
      description: 'Opening & closing checklists',
      icon: ClipboardCheck,
      color: 'bg-blue-500',
      page: 'Operations',
      status: myCheckIn ? 'complete' : 'pending',
      count: `${checkIns.length} staff checked in`,
      lastUpdate: checkIns[0]?.created_date
    },
    {
      title: 'Shift Handover',
      description: 'Pass info between shifts',
      icon: MessageSquare,
      color: 'bg-amber-500',
      onClick: () => setShowHandoverChecklist(true),
      status: handovers.filter(h => h.shift_date === today).length > 0 ? 'complete' : 'pending',
      count: `${handovers.filter(h => h.shift_date === today).length} handovers today`,
      lastUpdate: handovers[0]?.created_date
    },
    {
      title: 'Temperature Logs',
      description: 'Equipment & food temp monitoring',
      icon: Thermometer,
      color: 'bg-red-500',
      onClick: () => setShowTempAssets(true),
      status: tempCompletion === 100 ? 'complete' : 'pending',
      count: `${temperatureLogs.length}/${tempAssets.length} logged`,
      progress: tempCompletion,
      lastUpdate: temperatureLogs[0]?.created_date
    },
    {
      title: 'Label Printing',
      description: 'Food safety labels & prep tracking',
      icon: FileText,
      color: 'bg-purple-500',
      onClick: () => setShowLabelPrinting(true),
      status: labels.filter(l => l.created_date?.startsWith(today)).length > 0 ? 'complete' : 'pending',
      count: `${labels.filter(l => l.created_date?.startsWith(today)).length} labels today`,
      lastUpdate: labels[0]?.created_date
    },
    {
      title: 'Equipment Status',
      description: 'Log faults & maintenance',
      icon: Wrench,
      color: 'bg-orange-500',
      page: 'EquipmentHealth',
      status: equipmentFaults.length === 0 ? 'complete' : 'pending',
      count: `${equipmentFaults.length} faults reported`,
      lastUpdate: equipmentFaults[0]?.created_date
    },
    {
      title: 'Operations History',
      description: 'View all logged operations',
      icon: History,
      color: 'bg-slate-600',
      page: 'OperationsHistory',
      status: 'complete',
      count: 'View past logs',
      lastUpdate: null
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
                  disabled={checkInMutation.isPending}
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

        {/* Operations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {operationTiles.map((tile, idx) => {
            const Icon = tile.icon;
            const CardWrapper = tile.onClick ? 'div' : Link;
            const wrapperProps = tile.onClick ? {} : { to: createPageUrl(tile.page) };
            return (
              <motion.div
                key={tile.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <CardWrapper {...wrapperProps}>
                  <Card 
                    onClick={tile.onClick}
                    className="h-full hover:shadow-2xl transition-all cursor-pointer border-2 border-slate-200 hover:border-emerald-400 hover:scale-[1.02] duration-200"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`${tile.color} w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg`}>
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-800">{tile.title}</h3>
                            <p className="text-sm text-slate-500">{tile.description}</p>
                          </div>
                        </div>
                        <Badge 
                          variant={tile.status === 'complete' ? 'default' : 'outline'}
                          className={tile.status === 'complete' ? 'bg-emerald-500' : 'border-amber-400 text-amber-700'}
                        >
                          {tile.status === 'complete' ? '✓' : '⚠'}
                        </Badge>
                      </div>

                      {tile.progress !== undefined && (
                        <Progress value={tile.progress} className="h-2 mb-3" />
                      )}

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-600">{tile.count}</p>
                        {tile.lastUpdate && (
                          <p className="text-xs text-slate-400">
                            Updated {format(new Date(tile.lastUpdate), 'HH:mm')}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CardWrapper>
              </motion.div>
            );
          })}
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
        />

        <ChecklistModal
          open={showClosingChecklist}
          onClose={() => setShowClosingChecklist(false)}
          checklist={currentChecklistData}
          existingCompletion={completionInProgress}
          onItemToggle={handleChecklistItemToggle}
          onComplete={handleCompleteChecklist}
          loading={false}
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
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfWeek, isSameDay, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import {
  Calendar,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  Download,
  Sparkles,
  User,
  Printer,
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Shifts() {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showForm, setShowForm] = useState(false);
  const [showAIScheduler, setShowAIScheduler] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [aiLoading, setAILoading] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [activeTab, setActiveTab] = useState('schedule');
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    staff_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    position: '',
    scheduled_start: '09:00',
    scheduled_end: '17:00',
    break_duration: 30,
    hourly_rate: 12.5,
    notes: ''
  });

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

  useEffect(() => {
    if (editingShift) {
      setFormData({
        staff_id: editingShift.staff_id || '',
        date: editingShift.date || format(new Date(), 'yyyy-MM-dd'),
        position: editingShift.position || '',
        scheduled_start: editingShift.scheduled_start || '09:00',
        scheduled_end: editingShift.scheduled_end || '17:00',
        break_duration: editingShift.break_duration || 30,
        hourly_rate: editingShift.hourly_rate || 12.5,
        notes: editingShift.notes || ''
      });
    } else {
      setFormData({
        staff_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        position: '',
        scheduled_start: '09:00',
        scheduled_end: '17:00',
        break_duration: 30,
        hourly_rate: 12.5,
        notes: ''
      });
    }
  }, [editingShift, showForm]);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts', format(currentWeekStart, 'yyyy-MM-dd')],
    queryFn: () => base44.entities.Shift.filter({
      date: { 
        $gte: format(currentWeekStart, 'yyyy-MM-dd'),
        $lte: format(addDays(currentWeekStart, 6), 'yyyy-MM-dd')
      }
    }, 'date'),
  });

  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => base44.entities.Shift.filter({ needs_approval: true }, '-updated_date', 50),
    enabled: ['owner', 'admin', 'manager'].includes(user?.role)
  });

  const { data: allShiftsThisMonth = [] } = useQuery({
    queryKey: ['shifts-month'],
    queryFn: () => base44.entities.Shift.filter({
      date: {
        $gte: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        $lte: format(endOfMonth(new Date()), 'yyyy-MM-dd')
      }
    })
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.filter({ status: 'active' }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Shift.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      queryClient.invalidateQueries(['shifts-month']);
      setShowForm(false);
      setEditingShift(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Shift.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      queryClient.invalidateQueries(['shifts-month']);
    }
  });

  // Calculate shift duration and cost
  const calculateShiftMetrics = (startTime, endTime, hourlyRate, breakDuration = 30) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    const totalMinutes = endMinutes - startMinutes;
    const workMinutes = totalMinutes - breakDuration;
    const duration = workMinutes / 60;
    const cost = duration * hourlyRate;
    
    return { duration: duration.toFixed(2), totalCost: cost.toFixed(2) };
  };

  const getShiftsForDay = (date) => {
    return shifts.filter(s => s.date === format(date, 'yyyy-MM-dd'));
  };

  const handleClockIn = async (shift) => {
    const now = new Date().toISOString();
    await updateMutation.mutateAsync({
      id: shift.id,
      data: {
        actual_clock_in: now,
        status: 'clocked_in',
        needs_approval: true
      }
    });
  };

  const handleClockOut = async (shift) => {
    const now = new Date().toISOString();
    const clockInTime = new Date(shift.actual_clock_in);
    const clockOutTime = new Date(now);
    const actualDuration = ((clockOutTime - clockInTime) / (1000 * 60 * 60)) - ((shift.break_duration || 30) / 60);
    const actualCost = actualDuration * (shift.hourly_rate || 12.5);
    
    await updateMutation.mutateAsync({
      id: shift.id,
      data: {
        actual_clock_out: now,
        duration: actualDuration.toFixed(2),
        total_cost: actualCost.toFixed(2),
        status: 'completed',
        needs_approval: true
      }
    });
  };

  const handleApproveShift = async (shift) => {
    await updateMutation.mutateAsync({
      id: shift.id,
      data: {
        needs_approval: false,
        approved_by: user?.email,
        approved_date: new Date().toISOString()
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.staff_id) {
      alert('Please select a staff member');
      return;
    }
    
    const selectedStaff = staff.find(s => s.id === formData.staff_id);
    const startTime = formData.scheduled_start;
    const endTime = formData.scheduled_end;
    const hourlyRate = parseFloat(formData.hourly_rate);
    const breakDuration = parseInt(formData.break_duration) || 30;
    
    const { duration, totalCost } = calculateShiftMetrics(startTime, endTime, hourlyRate, breakDuration);
    
    const data = {
      staff_id: formData.staff_id,
      staff_name: selectedStaff?.full_name || '',
      date: formData.date,
      scheduled_start: startTime,
      scheduled_end: endTime,
      position: formData.position,
      hourly_rate: hourlyRate,
      duration: parseFloat(duration),
      total_cost: parseFloat(totalCost),
      break_duration: breakDuration,
      notes: formData.notes,
      status: 'scheduled'
    };
    
    if (editingShift) {
      updateMutation.mutate({ id: editingShift.id, data });
    } else {
      createMutation.mutate(data);
    }
    
    setFormData({
      staff_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      position: '',
      scheduled_start: '09:00',
      scheduled_end: '17:00',
      break_duration: 30,
      hourly_rate: 12.5,
      notes: ''
    });
  };

  const handleAISchedule = async () => {
    if (!aiPrompt.trim()) return;
    
    setAILoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a 7-day staff schedule with LABOR COST OPTIMIZATION for a restaurant.
        
        Request: "${aiPrompt}"
        
        Available staff: ${staff.map(s => `${s.full_name} (${s.position}, £${s.hourly_rate || 12.5}/hr)`).join(', ')}
        Week starting: ${format(currentWeekStart, 'MMMM d, yyyy')}
        
        IMPORTANT: Optimize for 25-30% labor cost ratio. Suggest efficient shifts.
        
        Return JSON:
        {
          "shifts": [
            {
              "staff_name": "Name",
              "position": "Position",
              "date": "YYYY-MM-DD",
              "start_time": "HH:MM",
              "end_time": "HH:MM",
              "hourly_rate": 12.5
            }
          ],
          "insights": "Brief cost optimization insights (1-2 sentences)"
        }`,
        response_json_schema: {
          type: "object",
          properties: {
            shifts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  staff_name: { type: "string" },
                  position: { type: "string" },
                  date: { type: "string" },
                  start_time: { type: "string" },
                  end_time: { type: "string" },
                  hourly_rate: { type: "number" }
                }
              }
            },
            insights: { type: "string" }
          }
        }
      });
      
      if (result.shifts && result.shifts.length > 0) {
        for (const shift of result.shifts) {
          const matchedStaff = staff.find(s => 
            s.full_name.toLowerCase().includes(shift.staff_name.toLowerCase()) ||
            shift.staff_name.toLowerCase().includes(s.full_name.toLowerCase())
          );
          
          const { duration, totalCost } = calculateShiftMetrics(
            shift.start_time,
            shift.end_time,
            shift.hourly_rate || 12.5
          );
          
          await base44.entities.Shift.create({
            staff_id: matchedStaff?.id || '',
            staff_name: shift.staff_name,
            date: shift.date,
            scheduled_start: shift.start_time,
            scheduled_end: shift.end_time,
            position: shift.position,
            hourly_rate: shift.hourly_rate || 12.5,
            duration: parseFloat(duration),
            total_cost: parseFloat(totalCost),
            status: 'scheduled'
          });
        }
        queryClient.invalidateQueries(['shifts']);
        queryClient.invalidateQueries(['shifts-month']);
        setShowAIScheduler(false);
        setAIPrompt('');
        
        if (result.insights) {
          alert(`✅ Schedule created!\n\n${result.insights}`);
        }
      }
    } catch (error) {
      console.error('AI scheduling error:', error);
    } finally {
      setAILoading(false);
    }
  };

  const exportPayroll = async () => {
    const XLSX = (await import('xlsx')).default || (await import('xlsx'));
    
    const headers = ['Staff Name', 'Role', 'Total Hours', 'Hourly Rate (£)', 'Total Pay (£)', 'Status'];
    
    const staffSummary = {};
    shifts.forEach(shift => {
      if (!staffSummary[shift.staff_id]) {
        staffSummary[shift.staff_id] = {
          name: shift.staff_name,
          position: shift.position,
          hours: 0,
          rate: shift.hourly_rate || 0,
          pay: 0,
          completed: 0,
          total: 0
        };
      }
      staffSummary[shift.staff_id].hours += shift.duration || 0;
      staffSummary[shift.staff_id].pay += shift.total_cost || 0;
      staffSummary[shift.staff_id].total++;
      if (shift.status === 'completed') staffSummary[shift.staff_id].completed++;
    });
    
    const rows = Object.values(staffSummary).map(s => [
      s.name,
      s.position,
      s.hours.toFixed(2),
      s.rate.toFixed(2),
      s.pay.toFixed(2),
      `${s.completed}/${s.total} completed`
    ]);
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
    XLSX.writeFile(wb, `payroll-${format(currentWeekStart, 'yyyy-MM-dd')}.xlsx`);
  };

  const exportWeeklyReport = async () => {
    const XLSX = (await import('xlsx')).default || (await import('xlsx'));
    
    const detailHeaders = ['Date', 'Staff', 'Position', 'Scheduled Start', 'Scheduled End', 'Clock In', 'Clock Out', 'Hours', 'Rate (£/hr)', 'Cost (£)', 'Status', 'Approved'];
    const detailRows = shifts.map(s => [
      s.date,
      s.staff_name,
      s.position,
      s.scheduled_start,
      s.scheduled_end,
      s.actual_clock_in ? format(new Date(s.actual_clock_in), 'HH:mm') : '-',
      s.actual_clock_out ? format(new Date(s.actual_clock_out), 'HH:mm') : '-',
      s.duration?.toFixed(2) || 0,
      s.hourly_rate || 0,
      s.total_cost?.toFixed(2) || 0,
      s.status,
      s.needs_approval ? 'Pending' : 'Yes'
    ]);
    
    const summaryHeaders = ['Metric', 'Value'];
    const summaryRows = [
      ['Week', `${format(currentWeekStart, 'MMM d')} - ${format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}`],
      ['Total Shifts', shifts.length],
      ['Total Hours', weekStats.totalHours.toFixed(2)],
      ['Total Cost', `£${weekStats.totalCost.toFixed(2)}`],
      ['Average Rate', `£${weekStats.avgRate.toFixed(2)}/hr`],
      ['Completed Shifts', shifts.filter(s => s.status === 'completed').length],
      ['Pending Approvals', shifts.filter(s => s.needs_approval).length]
    ];
    
    const ws1 = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
    const ws2 = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');
    XLSX.utils.book_append_sheet(wb, ws2, 'Details');
    XLSX.writeFile(wb, `weekly-report-${format(currentWeekStart, 'yyyy-MM-dd')}.xlsx`);
  };

  const exportTimesheet = () => {
    const csvContent = [
      ['Staff', 'Date', 'Start', 'End', 'Duration (hrs)', 'Rate (£/hr)', 'Cost (£)', 'Status'].join(','),
      ...shifts.map(s => [
        s.staff_name,
        s.date,
        s.scheduled_start,
        s.scheduled_end,
        s.duration || 0,
        s.hourly_rate || 0,
        s.total_cost || 0,
        s.status
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-${format(currentWeekStart, 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Cost Analytics
  const weekStats = {
    totalHours: shifts.reduce((sum, s) => sum + (s.duration || 0), 0),
    totalCost: shifts.reduce((sum, s) => sum + (s.total_cost || 0), 0),
    completedHours: shifts.filter(s => s.status === 'completed').reduce((sum, s) => sum + (s.duration || 0), 0),
    avgRate: shifts.length > 0 ? shifts.reduce((sum, s) => sum + (s.hourly_rate || 0), 0) / shifts.length : 0
  };

  const monthStats = {
    totalHours: allShiftsThisMonth.reduce((sum, s) => sum + (s.duration || 0), 0),
    totalCost: allShiftsThisMonth.reduce((sum, s) => sum + (s.total_cost || 0), 0),
  };

  const costByRole = {};
  shifts.forEach(shift => {
    const role = shift.position || 'Other';
    if (!costByRole[role]) {
      costByRole[role] = { hours: 0, cost: 0 };
    }
    costByRole[role].hours += shift.duration || 0;
    costByRole[role].cost += shift.total_cost || 0;
  });

  const staffHours = {};
  allShiftsThisMonth.forEach(shift => {
    if (!staffHours[shift.staff_name]) {
      staffHours[shift.staff_name] = 0;
    }
    staffHours[shift.staff_name] += shift.duration || 0;
  });

  const topStaff = Object.entries(staffHours)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const statusColors = {
    scheduled: 'bg-slate-100 text-slate-600 border-slate-200',
    clocked_in: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    completed: 'bg-blue-100 text-blue-700 border-blue-200',
    missed: 'bg-red-100 text-red-700 border-red-200'
  };

  const getPositionColor = (position) => {
    const positionLower = position?.toLowerCase() || '';
    if (positionLower.includes('chef') || positionLower.includes('cook')) {
      return 'bg-gradient-to-br from-purple-100 to-purple-200 border-purple-300 text-purple-800';
    }
    if (positionLower.includes('manager') || positionLower.includes('supervisor')) {
      return 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-300 text-amber-800';
    }
    if (positionLower.includes('barista') || positionLower.includes('coffee')) {
      return 'bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300 text-orange-800';
    }
    if (positionLower.includes('server') || positionLower.includes('foh') || positionLower.includes('waiter')) {
      return 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300 text-blue-800';
    }
    if (positionLower.includes('bar') || positionLower.includes('bartender')) {
      return 'bg-gradient-to-br from-emerald-100 to-emerald-200 border-emerald-300 text-emerald-800';
    }
    return 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300 text-slate-700';
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <LoadingSpinner message="Loading shifts..." />;

  const canEditRates = ['owner', 'admin'].includes(user?.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shifts & Labor Cost Manager"
        description="Predictive scheduling with real-time cost tracking"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="schedule">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="costing">
            <DollarSign className="w-4 h-4 mr-2" />
            Cost Dashboard
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="staff">
            <User className="w-4 h-4 mr-2" />
            Staff Summary
          </TabsTrigger>
          {['owner', 'admin', 'manager'].includes(user?.role) && (
            <TabsTrigger value="approvals">
              <Clock className="w-4 h-4 mr-2" />
              Approvals
              {pendingApprovals.length > 0 && (
                <Badge className="ml-2 bg-red-500">{pendingApprovals.length}</Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Schedule View */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { setEditingShift(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Shift
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowAIScheduler(true)}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Schedule
            </Button>
            <Button variant="outline" onClick={exportTimesheet}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={exportPayroll}>
              <Download className="w-4 h-4 mr-2" />
              Payroll Excel
            </Button>
            <Button variant="outline" onClick={exportWeeklyReport} className="border-blue-300 text-blue-700 hover:bg-blue-50">
              <Download className="w-4 h-4 mr-2" />
              Weekly Report
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>

          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print-area, .print-area * { visibility: visible; }
              .print-area { position: absolute; left: 0; top: 0; width: 100%; }
              .no-print { display: none !important; }
            }
          `}</style>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 print-area">
            <div className="flex items-center justify-between mb-4 no-print">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-semibold text-slate-700 min-w-[200px] text-center">
                  {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
                </span>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              >
                Today
              </Button>
            </div>

            <div className="hidden print:block mb-4 pb-4 border-b-2 border-slate-300">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Staff Rota & Labor Cost</h1>
              <p className="text-slate-600">
                {format(currentWeekStart, 'MMMM d')} - {format(addDays(currentWeekStart, 6), 'MMMM d, yyyy')}
              </p>
              <p className="text-sm font-bold text-emerald-700 mt-2">
                Weekly Cost: £{weekStats.totalCost.toFixed(2)} • {weekStats.totalHours.toFixed(1)} hours
              </p>
            </div>

            <div className="grid grid-cols-7 gap-2 print:gap-1">
              {weekDays.map((day, index) => {
                const dayShifts = getShiftsForDay(day);
                const isToday = isSameDay(day, new Date());
                const dayCost = dayShifts.reduce((sum, s) => sum + (s.total_cost || 0), 0);
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`min-h-[280px] rounded-xl border-2 p-3 ${
                      isToday 
                        ? 'border-emerald-400 bg-emerald-50/70 shadow-sm' 
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className={`text-center mb-3 pb-2 border-b-2 ${isToday ? 'border-emerald-300' : 'border-slate-300'}`}>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{format(day, 'EEE')}</p>
                      <p className={`text-2xl font-bold ${isToday ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {format(day, 'd')}
                      </p>
                      <p className="text-[10px] text-slate-400">{format(day, 'MMM')}</p>
                      {dayCost > 0 && (
                        <Badge className="mt-1 bg-emerald-600 text-[9px]">
                          £{dayCost.toFixed(0)}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <AnimatePresence>
                        {dayShifts.map((shift) => (
                          <motion.div
                            key={shift.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`p-2.5 rounded-lg border-2 text-xs cursor-pointer hover:shadow-md transition-all ${getPositionColor(shift.position)}`}
                            onClick={() => { setEditingShift(shift); setShowForm(true); }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-bold truncate text-sm">{shift.staff_name}</p>
                              {shift.position && (
                                <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-current opacity-70">
                                  {shift.position}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-semibold opacity-80 mb-1">
                              <Clock className="w-3 h-3" />
                              {shift.scheduled_start} - {shift.scheduled_end}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-bold">
                              £{shift.hourly_rate || 0}/hr • {shift.duration?.toFixed(1) || 0}h = £{shift.total_cost?.toFixed(2) || 0}
                            </div>
                            {shift.needs_approval && (
                              <Badge className="mt-1 bg-amber-500 text-white text-[8px] py-0 px-1">
                                Needs Approval
                              </Badge>
                            )}
                            
                            {isToday && shift.status === 'scheduled' && (
                              <Button 
                                size="sm" 
                                className="w-full mt-2 h-7 text-[10px] bg-emerald-600 no-print"
                                onClick={(e) => { e.stopPropagation(); handleClockIn(shift); }}
                              >
                                <LogIn className="w-3 h-3 mr-1" /> Clock In
                              </Button>
                            )}
                            {isToday && shift.status === 'clocked_in' && (
                              <Button 
                                size="sm" 
                                className="w-full mt-2 h-7 text-[10px] bg-blue-600 no-print"
                                onClick={(e) => { e.stopPropagation(); handleClockOut(shift); }}
                              >
                                <LogOut className="w-3 h-3 mr-1" /> Clock Out
                              </Button>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t-2 border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-sm">
                <span className="text-slate-500">Total Hours:</span>
                <span className="font-bold text-slate-700 ml-2">{weekStats.totalHours.toFixed(1)}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-500">Total Cost:</span>
                <span className="font-bold text-emerald-600 ml-2">£{weekStats.totalCost.toFixed(2)}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-500">Avg Rate:</span>
                <span className="font-bold text-blue-600 ml-2">£{weekStats.avgRate.toFixed(2)}/hr</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-500">Completed:</span>
                <span className="font-bold text-purple-600 ml-2">
                  {shifts.filter(s => s.status === 'completed').length}/{shifts.length}
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Cost Dashboard */}
        <TabsContent value="costing" className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">£{weekStats.totalCost.toFixed(0)}</p>
                    <p className="text-xs text-slate-500">Week Cost</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{weekStats.totalHours.toFixed(0)}</p>
                    <p className="text-xs text-slate-500">Scheduled Hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">£{weekStats.avgRate.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">Avg. Rate/Hr</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <PieChart className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">£{monthStats.totalCost.toFixed(0)}</p>
                    <p className="text-xs text-slate-500">Month Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(costByRole).map(([role, data]) => (
                  <div key={role} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{role}</span>
                        <span className="text-sm text-slate-600">
                          {data.hours.toFixed(1)}h • £{data.cost.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-green-600"
                          style={{ width: `${(data.cost / weekStats.totalCost) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                Predictive Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-slate-700">
                  <strong>Projected Weekly Cost:</strong> £{(weekStats.totalCost * 1.05).toFixed(2)}
                </p>
                <p className="text-slate-700">
                  <strong>Efficiency:</strong> {weekStats.completedHours > 0 
                    ? ((weekStats.completedHours / weekStats.totalHours) * 100).toFixed(0)
                    : 0}% actual vs scheduled
                </p>
                {weekStats.totalCost > 2500 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-100 border border-amber-300 rounded-lg mt-3">
                    <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-900 text-xs">
                      <strong>High Labor Cost Alert:</strong> Weekly labor exceeds £2,500. Consider optimizing shift coverage.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Staff by Hours (This Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topStaff.map(([name, hours], idx) => (
                  <div key={name} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{name}</span>
                        <span className="text-sm text-slate-600">{hours.toFixed(1)} hours</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-green-600"
                          style={{ width: `${(hours / monthStats.totalHours) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500 mb-2">Avg Hours per Employee</p>
                <p className="text-3xl font-bold text-slate-800">
                  {Object.keys(staffHours).length > 0 
                    ? (monthStats.totalHours / Object.keys(staffHours).length).toFixed(1)
                    : 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500 mb-2">Total Shifts</p>
                <p className="text-3xl font-bold text-slate-800">{shifts.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500 mb-2">Monthly Hours</p>
                <p className="text-3xl font-bold text-slate-800">{monthStats.totalHours.toFixed(0)}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Staff Summary */}
        <TabsContent value="staff" className="space-y-4">
          <div className="grid gap-4">
            {staff.map((member) => {
              const memberShifts = allShiftsThisMonth.filter(s => s.staff_id === member.id);
              const totalHours = memberShifts.reduce((sum, s) => sum + (s.duration || 0), 0);
              const totalPay = memberShifts.reduce((sum, s) => sum + (s.total_cost || 0), 0);
              
              return (
                <Card key={member.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-bold text-lg">
                          {member.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{member.full_name}</p>
                          <p className="text-sm text-slate-500">{member.position}</p>
                          <Badge className="mt-1 bg-emerald-100 text-emerald-700 text-xs">
                            £{member.hourly_rate || 12.5}/hr
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-600">£{totalPay.toFixed(0)}</p>
                        <p className="text-xs text-slate-500">{totalHours.toFixed(1)} hours this month</p>
                        <p className="text-xs text-slate-400">{memberShifts.length} shifts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Approvals Tab */}
        {['owner', 'admin', 'manager'].includes(user?.role) && (
          <TabsContent value="approvals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Time Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingApprovals.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No pending approvals</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingApprovals.map((shift) => (
                      <div key={shift.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-bold text-slate-800">{shift.staff_name}</p>
                              <Badge variant="outline">{shift.position}</Badge>
                              <Badge className="bg-amber-100 text-amber-700">{shift.status}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-slate-500">Date</p>
                                <p className="font-semibold">{format(new Date(shift.date), 'MMM d, yyyy')}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Scheduled</p>
                                <p className="font-semibold">{shift.scheduled_start} - {shift.scheduled_end}</p>
                              </div>
                              {shift.actual_clock_in && (
                                <div>
                                  <p className="text-slate-500">Clock In</p>
                                  <p className="font-semibold text-blue-600">
                                    {format(new Date(shift.actual_clock_in), 'HH:mm')}
                                  </p>
                                </div>
                              )}
                              {shift.actual_clock_out && (
                                <div>
                                  <p className="text-slate-500">Clock Out</p>
                                  <p className="font-semibold text-blue-600">
                                    {format(new Date(shift.actual_clock_out), 'HH:mm')}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="text-slate-500">Hours</p>
                                <p className="font-semibold">{shift.duration?.toFixed(2) || 0} hrs</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Cost</p>
                                <p className="font-semibold text-emerald-600">£{shift.total_cost?.toFixed(2) || 0}</p>
                              </div>
                            </div>
                          </div>
                          <Button 
                            onClick={() => handleApproveShift(shift)}
                            disabled={updateMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Shift Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) setEditingShift(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingShift ? 'Edit Shift' : 'Add Shift'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Staff Member *</Label>
              <Select 
                value={formData.staff_id} 
                onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff..." />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name} - {s.position} (£{s.hourly_rate || 12.5}/hr)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input 
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required 
                />
              </div>
              <div>
                <Label>Position/Role</Label>
                <Input 
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g., Chef, FOH, Barista"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Start Time *</Label>
                <Input 
                  type="time"
                  value={formData.scheduled_start}
                  onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                  required 
                />
              </div>
              <div>
                <Label>End Time *</Label>
                <Input 
                  type="time"
                  value={formData.scheduled_end}
                  onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
                  required 
                />
              </div>
              <div>
                <Label>Break (minutes)</Label>
                <Input 
                  type="number"
                  value={formData.break_duration}
                  onChange={(e) => setFormData({ ...formData, break_duration: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>

            <div>
              <Label>Hourly Rate (£) {!canEditRates && '(Admin Only)'} *</Label>
              <Input 
                type="number"
                step="0.01"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 12.5 })}
                disabled={!canEditRates}
                required 
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea 
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700"
              >
                {editingShift ? 'Update' : 'Add'} Shift
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Scheduler Dialog */}
      <Dialog open={showAIScheduler} onOpenChange={setShowAIScheduler}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              AI Schedule Generator with Cost Optimization
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Describe your staffing needs. AI will optimize for 25-30% labor cost ratio.
            </p>
            <Textarea
              placeholder="e.g., I need chef, FOH, and barista coverage. Chef 6am-2pm, FOH 8am-4pm, barista 7am-3pm. Minimize weekend costs."
              value={aiPrompt}
              onChange={(e) => setAIPrompt(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAIScheduler(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAISchedule}
                disabled={aiLoading || !aiPrompt.trim()}
                className="bg-gradient-to-r from-amber-500 to-amber-600"
              >
                {aiLoading ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Optimized Schedule
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
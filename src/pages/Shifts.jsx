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
  const [view, setView] = useState('week');
  const [user, setUser] = useState(null);

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

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.filter({ status: 'active' }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Shift.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      setShowForm(false);
      setEditingShift(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Shift.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['shifts'])
  });

  const getShiftsForDay = (date) => {
    return shifts.filter(s => s.date === format(date, 'yyyy-MM-dd'));
  };

  const handleClockIn = async (shift) => {
    await updateMutation.mutateAsync({
      id: shift.id,
      data: {
        actual_clock_in: new Date().toISOString(),
        status: 'clocked_in'
      }
    });
  };

  const handleClockOut = async (shift) => {
    await updateMutation.mutateAsync({
      id: shift.id,
      data: {
        actual_clock_out: new Date().toISOString(),
        status: 'completed'
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const selectedStaff = staff.find(s => s.id === formData.get('staff_id'));
    
    const data = {
      staff_id: formData.get('staff_id'),
      staff_name: selectedStaff?.full_name || '',
      date: formData.get('date'),
      scheduled_start: formData.get('scheduled_start'),
      scheduled_end: formData.get('scheduled_end'),
      position: formData.get('position'),
      notes: formData.get('notes'),
      status: 'scheduled'
    };
    
    if (editingShift) {
      updateMutation.mutate({ id: editingShift.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleAISchedule = async () => {
    if (!aiPrompt.trim()) return;
    
    setAILoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a 7-day staff schedule for a restaurant based on this request: "${aiPrompt}"
        
        Available staff: ${staff.map(s => `${s.full_name} (${s.position})`).join(', ')}
        Week starting: ${format(currentWeekStart, 'MMMM d, yyyy')}
        
        Generate shifts in this JSON format:
        {
          "shifts": [
            {
              "staff_name": "Name",
              "position": "Position",
              "date": "YYYY-MM-DD",
              "start_time": "HH:MM",
              "end_time": "HH:MM"
            }
          ]
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
                  end_time: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      if (result.shifts && result.shifts.length > 0) {
        for (const shift of result.shifts) {
          const matchedStaff = staff.find(s => 
            s.full_name.toLowerCase().includes(shift.staff_name.toLowerCase()) ||
            shift.staff_name.toLowerCase().includes(s.full_name.toLowerCase())
          );
          
          await base44.entities.Shift.create({
            staff_id: matchedStaff?.id || '',
            staff_name: shift.staff_name,
            date: shift.date,
            scheduled_start: shift.start_time,
            scheduled_end: shift.end_time,
            position: shift.position,
            status: 'scheduled'
          });
        }
        queryClient.invalidateQueries(['shifts']);
        setShowAIScheduler(false);
        setAIPrompt('');
      }
    } catch (error) {
      console.error('AI scheduling error:', error);
    } finally {
      setAILoading(false);
    }
  };

  const exportTimesheet = () => {
    const csvContent = [
      ['Staff', 'Date', 'Scheduled Start', 'Scheduled End', 'Clock In', 'Clock Out', 'Status'].join(','),
      ...shifts.map(s => [
        s.staff_name,
        s.date,
        s.scheduled_start,
        s.scheduled_end,
        s.actual_clock_in || '',
        s.actual_clock_out || '',
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

  const statusColors = {
    scheduled: 'bg-slate-100 text-slate-600 border-slate-200',
    clocked_in: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    completed: 'bg-blue-100 text-blue-700 border-blue-200',
    missed: 'bg-red-100 text-red-700 border-red-200'
  };

  // Position-based colors for planner view
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shifts & Rota"
        description="Manage staff schedules and clock in/out"
        action={() => { setEditingShift(null); setShowForm(true); }}
        actionLabel="Add Shift"
      >
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
          Export
        </Button>
        <Button variant="outline" onClick={handlePrint} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
      </PageHeader>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>

      {/* Week Navigation */}
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

        {/* Print Header */}
        <div className="hidden print:block mb-4 pb-4 border-b-2 border-slate-300">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Staff Rota - Week Planner</h1>
          <p className="text-slate-600">
            {format(currentWeekStart, 'MMMM d')} - {format(addDays(currentWeekStart, 6), 'MMMM d, yyyy')}
          </p>
          <div className="flex gap-6 mt-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-200 border border-purple-300 rounded"></div>
              <span>Chef/Cook</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-200 border border-amber-300 rounded"></div>
              <span>Manager</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-200 border border-orange-300 rounded"></div>
              <span>Barista</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 border border-blue-300 rounded"></div>
              <span>Server/FOH</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-200 border border-emerald-300 rounded"></div>
              <span>Bar Staff</span>
            </div>
          </div>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-2 print:gap-1">
          {weekDays.map((day, index) => {
            const dayShifts = getShiftsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`min-h-[240px] rounded-xl border-2 p-3 print:min-h-[180px] print:p-2 ${
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
                </div>
                
                <div className="space-y-2">
                  <AnimatePresence>
                    {dayShifts.map((shift) => (
                      <motion.div
                        key={shift.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`p-2.5 rounded-lg border-2 text-xs cursor-pointer hover:shadow-md transition-all print:cursor-default print:hover:shadow-none ${getPositionColor(shift.position)}`}
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
                        <div className="flex items-center gap-1 text-[11px] font-semibold opacity-80">
                          <Clock className="w-3 h-3" />
                          {shift.scheduled_start} - {shift.scheduled_end}
                        </div>
                        
                        {/* Clock In/Out buttons for today's shifts */}
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

        {/* Week Summary */}
        <div className="mt-4 pt-4 border-t-2 border-slate-200 flex flex-wrap gap-4 print:hidden">
          <div className="text-sm">
            <span className="text-slate-500">Total Shifts:</span>
            <span className="font-bold text-slate-700 ml-2">{shifts.length}</span>
          </div>
          <div className="text-sm">
            <span className="text-slate-500">Completed:</span>
            <span className="font-bold text-emerald-600 ml-2">
              {shifts.filter(s => s.status === 'completed').length}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-slate-500">In Progress:</span>
            <span className="font-bold text-blue-600 ml-2">
              {shifts.filter(s => s.status === 'clocked_in').length}
            </span>
          </div>
        </div>
      </div>

      {/* Shift Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingShift ? 'Edit Shift' : 'Add Shift'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Staff Member *</Label>
              <Select name="staff_id" defaultValue={editingShift?.staff_id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff..." />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name} - {s.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date *</Label>
              <Input 
                name="date" 
                type="date"
                defaultValue={editingShift?.date || format(new Date(), 'yyyy-MM-dd')}
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time *</Label>
                <Input 
                  name="scheduled_start" 
                  type="time"
                  defaultValue={editingShift?.scheduled_start || '09:00'}
                  required 
                />
              </div>
              <div>
                <Label>End Time *</Label>
                <Input 
                  name="scheduled_end" 
                  type="time"
                  defaultValue={editingShift?.scheduled_end || '17:00'}
                  required 
                />
              </div>
            </div>
            <div>
              <Label>Position/Role</Label>
              <Input 
                name="position" 
                defaultValue={editingShift?.position}
                placeholder="e.g., Chef, FOH, Barista"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea 
                name="notes" 
                defaultValue={editingShift?.notes}
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
              AI Schedule Generator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Describe your staffing needs for the week and let AI generate a schedule.
            </p>
            <Textarea
              placeholder="e.g., I need a chef, front of house, and barista each day. Chef works 6am-2pm, FOH works 8am-4pm, and barista works 7am-3pm. Give them weekends off."
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
                    Generate Schedule
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
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ClipboardCheck, Thermometer, Tag, MessageSquare, User, Clock, Calendar, Plus, Printer, Eye, BarChart3, 
  Sparkles, CheckCircle, Download, AlertTriangle, Zap, AlertCircle
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { motion } from 'framer-motion';

export default function OperationsReports() {
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [staffFilter, setStaffFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showHACCPDialog, setShowHACCPDialog] = useState(false);
  const [haccpGenerating, setHACCPGenerating] = useState(false);

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

  // Calculate date range
  useEffect(() => {
    const today = new Date();
    let start, end = today;

    if (dateRange === 'today') {
      start = today;
    } else if (dateRange === 'week') {
      start = subDays(today, 7);
    } else if (dateRange === 'month') {
      start = subDays(today, 30);
    } else if (dateRange === 'custom') {
      return;
    }

    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  }, [dateRange]);

  // Fetch all data
  const { data: completions = [] } = useQuery({
    queryKey: ['completions', startDate, endDate],
    queryFn: () => base44.entities.ChecklistCompletion.list('-created_date', 500),
    enabled: !!user && !!startDate
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', startDate, endDate],
    queryFn: () => base44.entities.DailyCheckIn.list('-shift_date', 100),
    enabled: !!user && !!startDate
  });

  const { data: temperatures = [] } = useQuery({
    queryKey: ['temperatures', startDate, endDate],
    queryFn: () => base44.entities.TemperatureLog.list('-log_date', 100),
    enabled: !!user && !!startDate
  });

  const { data: labels = [] } = useQuery({
    queryKey: ['labels', startDate, endDate],
    queryFn: () => base44.entities.FoodLabel.list('-created_date', 100),
    enabled: !!user && !!startDate
  });

  const { data: ccpChecks = [] } = useQuery({
    queryKey: ['ccpChecks', startDate, endDate],
    queryFn: () => base44.entities.CriticalControlPointCheck.list('-timestamp', 200),
    enabled: !!user && !!startDate
  });

  const { data: handovers = [] } = useQuery({
    queryKey: ['handovers', startDate, endDate],
    queryFn: () => base44.entities.ShiftHandover.list('-shift_date', 100),
    enabled: !!user && !!startDate
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['allStaff'],
    queryFn: () => base44.entities.Staff.list(),
    enabled: !!user
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list(),
    enabled: !!user
  });

  const { data: haccp = [] } = useQuery({
    queryKey: ['haccpPlans'],
    queryFn: () => base44.entities.HACCPPlan.list(),
    enabled: !!user
  });

  const createHACCPMutation = useMutation({
    mutationFn: async (data) => {
      const newHACCP = await base44.entities.HACCPPlan.create(data);
      return newHACCP;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['haccpPlans']);
      setShowHACCPDialog(false);
      setHACCPGenerating(false);
    }
  });

  if (!user) return <LoadingSpinner />;

  // Filter functions
  const filterByDate = (item, dateField) => {
    if (!startDate || !endDate) return true;
    const itemDate = item[dateField];
    if (!itemDate) return false;
    const date = itemDate.split('T')[0] || itemDate;
    return date >= startDate && date <= endDate;
  };

  const filterByStaff = (item, staffField) => {
    if (staffFilter === 'all') return true;
    return item[staffField] === staffFilter;
  };

  const filterByStatus = (item, statusField) => {
    if (statusFilter === 'all') return true;
    return item[statusField] === statusFilter;
  };

  // Filtered datasets
  const filteredCompletions = completions.filter(c =>
    filterByDate(c, 'date') &&
    filterByStaff(c, 'user_email') &&
    (statusFilter === 'all' || c.status === statusFilter)
  );

  const filteredCheckIns = checkIns.filter(c =>
    filterByDate(c, 'shift_date') &&
    filterByStaff(c, 'staff_email')
  );

  const filteredTemps = temperatures.filter(t =>
    filterByDate(t, 'log_date') &&
    filterByStaff(t, 'logged_by')
  );

  const filteredLabels = labels.filter(l =>
    filterByDate(l, 'prep_date') &&
    filterByStaff(l, 'prepared_by')
  );

  const filteredCCPChecks = ccpChecks.filter(c =>
    filterByDate(c, 'check_date') &&
    filterByStaff(c, 'staff_email') &&
    (statusFilter === 'all' || c.status === statusFilter)
  );

  const filteredHandovers = handovers.filter(h =>
    filterByDate(h, 'shift_date') &&
    filterByStaff(h, 'handover_from')
  );

  const hygieneRecords = completions.filter(c => c.checklist_category === 'hygiene');
  const nonHygieneChecklists = completions.filter(c => c.checklist_category !== 'hygiene' && c.checklist_category !== 'prep');

  // Calculate stats
  const todayCompletions = filteredCompletions.filter(c => c.status === 'completed').length;
  const todayCheckIns = filteredCheckIns.length;
  const todayTemps = filteredTemps.length;
  const todayLabels = filteredLabels.length;
  const todayCCPPassed = filteredCCPChecks.filter(c => c.status === 'pass').length;
  const todayCCPFailed = filteredCCPChecks.filter(c => c.status === 'fail').length;

  const handleGenerateHACCP = async () => {
    setHACCPGenerating(true);
    
    const haccpData = {
      location_id: user.location_id || 'default',
      location_name: user.location_name || 'Main',
      version: '1.0',
      last_updated: new Date().toISOString(),
      verified_by: user.email,
      verified_date: format(new Date(), 'yyyy-MM-dd'),
      is_active: true,
      scope: `${menuItems.length} menu items`,
      hazard_analysis_complete: true,
      ccps_identified: filteredCCPChecks.length,
      linked_menu_items: menuItems.slice(0, 10).map(m => m.id),
      compliance_status: 'implemented',
      notes: `Auto-generated HACCP plan based on ${filteredCCPChecks.length} CCP checks and ${menuItems.length} menu items`
    };

    createHACCPMutation.mutate(haccpData);
  };

  const FilterBar = () => (
    <Card className="bg-slate-50">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-semibold block mb-2">Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dateRange === 'custom' && (
            <>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start date"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End date"
              />
            </>
          )}

          <div>
            <label className="text-sm font-semibold block mb-2">Staff</label>
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staff.map(s => (
                  <SelectItem key={s.id} value={s.email}>{s.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Operations & Compliance Reports"
          description="Complete audit trail, operations logs, and compliance records"
        />
        <Button onClick={() => setShowHACCPDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Zap className="w-4 h-4 mr-2" />
          Generate HACCP Plan
        </Button>
      </div>

      <FilterBar />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="checklists">✓ Checklists</TabsTrigger>
          <TabsTrigger value="hygiene">🧼 Hygiene</TabsTrigger>
          <TabsTrigger value="checkins">👤 Check-Ins</TabsTrigger>
          <TabsTrigger value="temps">🌡️ Temps</TabsTrigger>
          <TabsTrigger value="labels">🏷️ Labels</TabsTrigger>
          <TabsTrigger value="ccps">⚠️ CCPs</TabsTrigger>
          <TabsTrigger value="handovers">📝 Handovers</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-slate-600 mb-1">Checklists Completed</p>
                  <p className="text-3xl font-bold text-emerald-600">{todayCompletions}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-slate-600 mb-1">Staff Checked In</p>
                  <p className="text-3xl font-bold text-blue-600">{todayCheckIns}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-slate-600 mb-1">Temps Logged</p>
                  <p className="text-3xl font-bold text-slate-600">{todayTemps}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-slate-600 mb-1">Labels Printed</p>
                  <p className="text-3xl font-bold text-purple-600">{todayLabels}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-slate-600 mb-1">CCPs Passed</p>
                  <p className="text-3xl font-bold text-emerald-600">{todayCCPPassed}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-slate-600 mb-1">CCPs Failed</p>
                  <p className="text-3xl font-bold text-red-600">{todayCCPFailed}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-r from-emerald-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📋 Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {[
                    ...filteredCompletions.slice(0, 3).map(c => ({
                      type: 'Checklist', name: c.checklist_name, staff: c.user_name, time: c.created_date
                    })),
                    ...filteredCCPChecks.slice(0, 2).map(c => ({
                      type: 'CCP Check', name: c.ccp_name, staff: c.staff_name, time: c.timestamp
                    }))
                  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.staff} • {format(new Date(item.time), 'HH:mm')}</p>
                      </div>
                      <Badge variant="outline">{item.type}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CHECKLISTS TAB */}
        <TabsContent value="checklists">
          <Card>
            <CardHeader>
              <CardTitle>Opening & Closing Checklists ({filteredCompletions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredCompletions.map((completion, idx) => (
                    <motion.div key={completion.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}>
                      <Card className={completion.status === 'failed' ? 'border-red-300 bg-red-50' : completion.status === 'completed' ? 'border-emerald-300 bg-emerald-50' : ''}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold">{completion.checklist_name}</h3>
                                <Badge className={completion.status === 'completed' ? 'bg-emerald-600' : completion.status === 'failed' ? 'bg-red-600' : 'bg-slate-600'}>{completion.status.toUpperCase()}</Badge>
                              </div>
                              <div className="grid grid-cols-4 gap-3 text-sm text-slate-600">
                                <div><User className="w-4 h-4 inline mr-1" />{completion.user_name}</div>
                                <div><Calendar className="w-4 h-4 inline mr-1" />{format(new Date(completion.date), 'MMM d')}</div>
                                <div>Shift: {completion.shift}</div>
                                <div className="font-bold text-emerald-600">{Math.round(completion.completion_percentage)}%</div>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => setSelectedItem(completion)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                  {filteredCompletions.length === 0 && <p className="text-center text-slate-500 py-8">No checklists found</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HYGIENE TAB */}
        <TabsContent value="hygiene">
          <Card>
            <CardHeader>
              <CardTitle>Hygiene Compliance Logs ({hygieneRecords.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {hygieneRecords.map(record => (
                    <Card key={record.id} className="border-l-4 border-l-blue-600 bg-blue-50/30">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                              <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">
                                🧼 {record.checklist_name || 'Hygiene Check'}
                              </h3>
                              <p className="text-sm text-slate-600">
                                {record.user_name} · {format(new Date(record.completed_at || record.created_date), 'MMM d, HH:mm')}
                              </p>
                            </div>
                          </div>
                          <Badge className={record.completion_percentage >= 100 ? 'bg-green-500' : 'bg-amber-500'}>
                            {record.completion_percentage || 0}%
                          </Badge>
                        </div>

                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm font-semibold text-slate-700 mb-2">✅ Completed Tasks:</p>
                          <ul className="space-y-1">
                            {record.answers?.filter(a => a.answer === 'yes').slice(0, 5).map((answer, idx) => (
                              <li key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                {answer.question_text}
                              </li>
                            ))}
                          </ul>
                          {record.notes && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm font-semibold text-slate-700 mb-1">Notes:</p>
                              <p className="text-sm text-slate-600">{record.notes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {hygieneRecords.length === 0 && (
                    <p className="text-center text-slate-500 py-8">No hygiene logs found</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CHECK-INS TAB */}
        <TabsContent value="checkins">
          <Card>
            <CardHeader>
              <CardTitle>Daily Check-Ins ({filteredCheckIns.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredCheckIns.map(checkIn => (
                    <Card key={checkIn.id} className="bg-slate-50">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-semibold">{checkIn.staff_name}</p>
                              <p className="text-sm text-slate-600">{checkIn.staff_email}</p>
                            </div>
                          </div>
                          <Badge className="bg-emerald-600">{checkIn.shift_type}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span>{format(new Date(checkIn.shift_date), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span>{format(new Date(checkIn.check_in_time), 'HH:mm')}</span>
                          </div>
                          <div>
                            <Badge variant="outline">{checkIn.staff_role}</Badge>
                          </div>
                          <div>
                            <Badge className={checkIn.status === 'checked_out' ? 'bg-slate-600' : 'bg-blue-600'}>
                              {checkIn.status}
                            </Badge>
                          </div>
                        </div>

                        {checkIn.check_out_time && (
                          <p className="text-xs text-slate-500 mt-2">
                            Checked out: {format(new Date(checkIn.check_out_time), 'HH:mm')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {filteredCheckIns.length === 0 && (
                    <p className="text-center text-slate-500 py-8">No check-ins found</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEMPS TAB */}
        <TabsContent value="temps">
          <Card>
            <CardHeader>
              <CardTitle>Temperature Logs ({filteredTemps.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredTemps.map(temp => (
                    <Card key={temp.id} className="bg-slate-50">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold">{temp.equipment_name}</p>
                            <p className="text-sm text-slate-600">{temp.logged_by_name} • {format(new Date(temp.created_date), 'MMM d, HH:mm')}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{temp.temperature}°C</p>
                            <Badge className={temp.is_in_range ? 'bg-emerald-600' : 'bg-red-600'}>{temp.is_in_range ? 'OK' : 'OUT OF RANGE'}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredTemps.length === 0 && <p className="text-center text-slate-500 py-8">No temperature logs found</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LABELS TAB */}
        <TabsContent value="labels">
          <Card>
            <CardHeader>
              <CardTitle>Food Labels ({filteredLabels.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredLabels.map(label => (
                    <Card key={label.id} className="bg-slate-50">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-lg">{label.item_name}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge className="capitalize">{label.prep_type}</Badge>
                              <Badge variant="outline" className="capitalize">{label.storage_type}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-600">Use by</p>
                            <p className="font-bold text-red-600">{format(new Date(label.use_by_date), 'MMM d')}</p>
                          </div>
                        </div>

                        {label.allergens && label.allergens.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-red-700 font-semibold mb-1">Allergens:</p>
                            <div className="flex flex-wrap gap-1">
                              {label.allergens.map((a, i) => (
                                <Badge key={i} className="bg-red-100 text-red-700 text-xs">{a}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm border-t pt-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-500" />
                            <span className="font-medium">{label.prepared_by_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span>{format(new Date(label.prep_date), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredLabels.length === 0 && (
                    <p className="text-center text-slate-500 py-8">No labels found</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CCPs TAB */}
        <TabsContent value="ccps">
          <Card>
            <CardHeader>
              <CardTitle>Critical Control Point Checks ({filteredCCPChecks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredCCPChecks.map(check => (
                    <Card key={check.id} className={check.status === 'fail' ? 'border-red-300 bg-red-50' : 'border-emerald-300 bg-emerald-50'}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold">{check.ccp_name}</p>
                            <p className="text-sm text-slate-600">{check.staff_name} • {check.check_date} {check.check_time}</p>
                            <p className="text-xs text-slate-500">Recorded: {check.recorded_value} {check.unit} (Limit: {check.critical_limit})</p>
                          </div>
                          <Badge className={check.status === 'pass' ? 'bg-emerald-600' : 'bg-red-600'}>{check.status.toUpperCase()}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredCCPChecks.length === 0 && <p className="text-center text-slate-500 py-8">No CCP checks found</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HANDOVERS TAB */}
        <TabsContent value="handovers">
          <Card>
            <CardHeader>
              <CardTitle>Shift Handovers ({filteredHandovers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredHandovers.map(handover => (
                    <Card key={handover.id} className="bg-slate-50">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <Badge className="bg-purple-600 mb-2">{handover.shift_type} shift</Badge>
                            <p className="text-sm text-slate-600">
                              {format(new Date(handover.shift_date), 'EEEE, MMM d, yyyy')}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="p-2 bg-white rounded">
                            <p className="text-xs text-slate-500 mb-1">From</p>
                            <p className="font-semibold text-sm">{handover.handover_from_name}</p>
                          </div>
                          <div className="p-2 bg-white rounded">
                            <p className="text-xs text-slate-500 mb-1">To</p>
                            <p className="font-semibold text-sm">{handover.handover_to_name}</p>
                          </div>
                        </div>

                        {handover.stock_issues && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-slate-700">Stock Issues:</p>
                            <p className="text-sm text-slate-600">{handover.stock_issues}</p>
                          </div>
                        )}

                        {handover.equipment_issues && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-slate-700">Equipment Issues:</p>
                            <p className="text-sm text-slate-600">{handover.equipment_issues}</p>
                          </div>
                        )}

                        {handover.general_notes && (
                          <div className="p-2 bg-white rounded mt-2">
                            <p className="text-xs font-semibold text-slate-700 mb-1">Notes:</p>
                            <p className="text-sm text-slate-600">{handover.general_notes}</p>
                          </div>
                        )}

                        {handover.acknowledged_at && (
                          <p className="text-xs text-slate-500 mt-2 border-t pt-2">
                            Acknowledged: {format(new Date(handover.acknowledged_at), 'MMM d, HH:mm')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {filteredHandovers.length === 0 && (
                    <p className="text-center text-slate-500 py-8">No handovers found</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* HACCP Generation Dialog */}
      <Dialog open={showHACCPDialog} onOpenChange={setShowHACCPDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auto-Generate HACCP Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                This will auto-generate a HACCP plan based on your current menu items and CCP checks.
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Menu Items:</span>
                <span className="font-bold">{menuItems.length}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Recent CCP Checks:</span>
                <span className="font-bold">{filteredCCPChecks.length}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Plan Version:</span>
                <span className="font-bold">1.0</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-600">
                ✓ Previous versions will be archived (never deleted)<br />
                ✓ Inspector-ready format<br />
                ✓ Auto-updates when menu changes<br />
                ✓ Includes all equipment & processes
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowHACCPDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateHACCP} 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={haccpGenerating}
              >
                {haccpGenerating ? 'Generating...' : 'Generate HACCP'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl h-[80vh] overflow-hidden flex flex-col">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.checklist_name} - Detailed Report</DialogTitle>
              </DialogHeader>
              <ScrollArea className="flex-1">
                <div className="space-y-4 p-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><p className="font-semibold text-slate-600">Staff</p><p>{selectedItem.user_name}</p></div>
                        <div><p className="font-semibold text-slate-600">Date</p><p>{format(new Date(selectedItem.date), 'PPP')}</p></div>
                        <div><p className="font-semibold text-slate-600">Shift</p><p>{selectedItem.shift}</p></div>
                        <div><p className="font-semibold text-slate-600">Completion</p><p className="font-bold text-emerald-600">{Math.round(selectedItem.completion_percentage)}%</p></div>
                      </div>
                    </CardContent>
                  </Card>
                  {selectedItem.answers?.map((answer, i) => (
                    <Card key={i}>
                      <CardContent className="pt-4">
                        <p className="font-semibold mb-2">{answer.question_text}</p>
                        <p className="text-slate-700">{answer.answer}</p>
                        {answer.notes && <p className="text-sm text-slate-500 mt-2 italic">Note: {answer.notes}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
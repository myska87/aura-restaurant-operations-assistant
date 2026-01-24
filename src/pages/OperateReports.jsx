import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import {
  Calendar,
  FileText,
  Download,
  Eye,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Thermometer,
  Tag,
  MessageSquare,
  ClipboardCheck,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function OperateReports() {
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [staffFilter, setStaffFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
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
      return; // Use manual dates
    }

    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  }, [dateRange]);

  // Fetch all data in parallel
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

  // Calculate today's stats for overview
  const todayCompletions = filteredCompletions.filter(c => c.status === 'completed').length;
  const todayCheckIns = filteredCheckIns.length;
  const todayTemps = filteredTemps.length;
  const todayLabels = filteredLabels.length;
  const todayCCPPassed = filteredCCPChecks.filter(c => c.status === 'pass').length;
  const todayCCPFailed = filteredCCPChecks.filter(c => c.status === 'fail').length;

  // Global filters UI
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
      <PageHeader
        title="Operational Reports"
        description="Complete audit trail of all daily operations, checks, and compliance records"
      />

      <FilterBar />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="checklists">✓ Checklists</TabsTrigger>
          <TabsTrigger value="hygiene">🧼 Hygiene</TabsTrigger>
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
              <CardTitle>Hygiene Compliance Logs ({filteredCompletions.filter(c => c.checklist_category === 'hygiene').length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredCompletions.filter(c => c.checklist_category === 'hygiene').map(record => (
                    <Card key={record.id} className="border-l-4 border-l-blue-600 bg-blue-50/30">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold">🧼 {record.checklist_name}</h3>
                            <p className="text-sm text-slate-600">{record.user_name} • {format(new Date(record.completed_at || record.created_date), 'MMM d, HH:mm')}</p>
                          </div>
                          <Badge className={record.completion_percentage >= 100 ? 'bg-green-500' : 'bg-amber-500'}>{record.completion_percentage}%</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredCompletions.filter(c => c.checklist_category === 'hygiene').length === 0 && <p className="text-center text-slate-500 py-8">No hygiene logs found</p>}
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
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold">{label.item_name}</p>
                            <p className="text-sm text-slate-600">{label.prepared_by_name} • {format(new Date(label.prep_date), 'MMM d, yyyy')}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-red-600">Use by: {format(new Date(label.use_by_date), 'MMM d')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredLabels.length === 0 && <p className="text-center text-slate-500 py-8">No labels found</p>}
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
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Badge className="bg-purple-600 mb-2">{handover.shift_type} Shift</Badge>
                            <p className="text-sm text-slate-600">From {handover.handover_from_name} to {handover.handover_to_name || '(pending)'}</p>
                            <p className="text-xs text-slate-500 mt-1">{format(new Date(handover.shift_date), 'EEEE, MMM d')}</p>
                          </div>
                          {handover.acknowledged_at && <Badge className="bg-emerald-600">Acknowledged</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredHandovers.length === 0 && <p className="text-center text-slate-500 py-8">No handovers found</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
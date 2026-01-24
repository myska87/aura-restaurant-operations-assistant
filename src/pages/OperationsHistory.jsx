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
import { ClipboardCheck, Thermometer, Tag, MessageSquare, User, Clock, Calendar, Plus, Printer, Eye, BarChart3, Sparkles, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ReportsHub from '@/components/operations/ReportsHub';

export default function OperationsHistory() {
  const [user, setUser] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showTempDialog, setShowTempDialog] = useState(false);
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);

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

  const { data: checkIns = [] } = useQuery({
    queryKey: ['allCheckIns', dateFilter],
    queryFn: () => base44.entities.DailyCheckIn.list('-shift_date', 100),
    enabled: !!user
  });

  const { data: temperatures = [] } = useQuery({
    queryKey: ['allTemperatures', dateFilter],
    queryFn: () => base44.entities.TemperatureLog.list('-log_date', 100),
    enabled: !!user
  });

  const { data: labels = [] } = useQuery({
    queryKey: ['allLabels', dateFilter],
    queryFn: () => base44.entities.FoodLabel.list('-created_date', 100),
    enabled: !!user
  });

  const { data: handovers = [] } = useQuery({
    queryKey: ['allHandovers', dateFilter],
    queryFn: () => base44.entities.ShiftHandover.list('-shift_date', 100),
    enabled: !!user
  });

  const { data: checklists = [] } = useQuery({
    queryKey: ['allChecklists', dateFilter],
    queryFn: () => base44.entities.ChecklistCompletion.list('-completed_at', 100),
    enabled: !!user
  });

  const hygieneRecords = checklists.filter(c => c.checklist_category === 'hygiene');
  const nonHygieneChecklists = checklists.filter(c => c.checklist_category !== 'hygiene' && c.checklist_category !== 'prep');

  // Mutations for adding new records - MUST be before any early returns
  const createCheckInMutation = useMutation({
    mutationFn: (data) => base44.entities.DailyCheckIn.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allCheckIns']);
      setShowCheckInDialog(false);
    }
  });

  const createTempMutation = useMutation({
    mutationFn: (data) => base44.entities.TemperatureLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allTemperatures']);
      setShowTempDialog(false);
    }
  });

  const createLabelMutation = useMutation({
    mutationFn: (data) => base44.entities.FoodLabel.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allLabels']);
      setShowLabelDialog(false);
    }
  });

  const createHandoverMutation = useMutation({
    mutationFn: (data) => base44.entities.ShiftHandover.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allHandovers']);
      setShowHandoverDialog(false);
    }
  });

  if (!user) return <LoadingSpinner />;

  const filteredCheckIns = dateFilter 
    ? checkIns.filter(c => c.shift_date === dateFilter)
    : checkIns;

  const filteredTemps = dateFilter 
    ? temperatures.filter(t => t.log_date === dateFilter)
    : temperatures;

  const filteredLabels = dateFilter 
    ? labels.filter(l => l.prep_date === dateFilter)
    : labels;

  const filteredHandovers = dateFilter 
    ? handovers.filter(h => h.shift_date === dateFilter)
    : handovers;

  const filteredChecklists = dateFilter 
    ? nonHygieneChecklists.filter(c => c.date === dateFilter)
    : nonHygieneChecklists;

  const filteredHygiene = dateFilter 
    ? hygieneRecords.filter(c => c.date === dateFilter)
    : hygieneRecords;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations History"
        description="Track all daily operations and who completed them"
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-600" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="max-w-xs"
              placeholder="Filter by date"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Clear filter
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="checklists">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="checklists">
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Checklists
          </TabsTrigger>
          <TabsTrigger value="hygiene">
            <Sparkles className="w-4 h-4 mr-2" />
            Hygiene
          </TabsTrigger>
          <TabsTrigger value="checkins">
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Check-Ins
          </TabsTrigger>
          <TabsTrigger value="temperatures">
            <Thermometer className="w-4 h-4 mr-2" />
            Temperatures
          </TabsTrigger>
          <TabsTrigger value="labels">
            <Tag className="w-4 h-4 mr-2" />
            Labels
          </TabsTrigger>
          <TabsTrigger value="handovers">
            <MessageSquare className="w-4 h-4 mr-2" />
            Handovers
          </TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart3 className="w-4 h-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Checklists */}
        <TabsContent value="checklists">
          <Card>
            <CardHeader>
              <CardTitle>Opening & Closing Checklists ({filteredChecklists.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredChecklists.map(checklist => (
                    <Card key={checklist.id} className={`${
                      checklist.checklist_category === 'opening' ? 'border-l-4 border-l-emerald-600' : 'border-l-4 border-l-red-600'
                    }`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className={checklist.checklist_category === 'opening' ? 'bg-emerald-600' : 'bg-red-600'}>
                                {checklist.checklist_category?.toUpperCase()}
                              </Badge>
                              <Badge className={checklist.status === 'completed' ? 'bg-emerald-600' : checklist.status === 'failed' ? 'bg-red-600' : 'bg-amber-600'}>
                                {checklist.status?.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="font-semibold">{checklist.checklist_name}</p>
                            <p className="text-sm text-slate-600">{checklist.user_name}</p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <p className="text-3xl font-bold text-emerald-600">{Math.round(checklist.completion_percentage)}%</p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.print()}
                                className="flex items-center gap-1"
                              >
                                <Printer className="w-4 h-4" />
                                Print
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                          <div className="p-2 bg-slate-50 rounded">
                            <p className="text-xs text-slate-600">Date</p>
                            <p className="font-semibold">{format(new Date(checklist.date), 'MMM d')}</p>
                          </div>
                          <div className="p-2 bg-slate-50 rounded">
                            <p className="text-xs text-slate-600">Shift</p>
                            <p className="font-semibold">{checklist.shift}</p>
                          </div>
                          <div className="p-2 bg-slate-50 rounded">
                            <p className="text-xs text-slate-600">Completed</p>
                            <p className="font-semibold">{checklist.completed_at ? format(new Date(checklist.completed_at), 'HH:mm') : '-'}</p>
                          </div>
                        </div>

                        {checklist.failed_items && checklist.failed_items.length > 0 && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded mb-2">
                            <p className="text-xs font-semibold text-red-700 mb-1">⚠ {checklist.failed_items.length} Issues Flagged</p>
                            <p className="text-xs text-red-600">Requires manager review</p>
                          </div>
                        )}

                        <div className="border-t pt-2 text-xs text-slate-500">
                          Items completed: {checklist.answers?.length || 0}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredChecklists.length === 0 && (
                    <p className="text-center text-slate-500 py-8">No checklists completed</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hygiene Tab */}
        <TabsContent value="hygiene">
          <Card>
            <CardHeader>
              <CardTitle>Hygiene Compliance Logs ({filteredHygiene.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredHygiene.map(record => (
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
                  {filteredHygiene.length === 0 && (
                    <p className="text-center text-slate-500 py-8">No hygiene logs for this period</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Check-Ins */}
        <TabsContent value="checkins">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daily Check-Ins ({filteredCheckIns.length})</CardTitle>
                <Button onClick={() => setShowCheckInDialog(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Check-In
                </Button>
              </div>
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

        {/* Temperatures */}
        <TabsContent value="temperatures">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Temperature Logs ({filteredTemps.length})</CardTitle>
                <Button onClick={() => setShowTempDialog(true)} size="sm">
                  <Thermometer className="w-4 h-4 mr-2" />
                  Log Temperature
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredTemps.map(temp => (
                    <Card key={temp.id} className="bg-slate-50">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Thermometer className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold">{temp.equipment_name}</p>
                              <p className="text-sm text-slate-600">{temp.location || 'Kitchen'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{temp.temperature}°C</p>
                            <Badge className={temp.is_in_range ? 'bg-emerald-600' : 'bg-red-600'}>
                              {temp.is_in_range ? 'OK' : 'OUT OF RANGE'}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm border-t pt-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-500" />
                            <span className="font-medium">{temp.logged_by_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span>{format(new Date(temp.created_date), 'MMM d, HH:mm')}</span>
                          </div>
                        </div>

                        {temp.notes && (
                          <p className="text-sm text-slate-600 mt-2 p-2 bg-white rounded">
                            Note: {temp.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {filteredTemps.length === 0 && (
                    <p className="text-center text-slate-500 py-8">No temperature logs found</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Labels */}
        <TabsContent value="labels">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Food Labels ({filteredLabels.length})</CardTitle>
                <Button onClick={() => setShowLabelDialog(true)} size="sm">
                  <Tag className="w-4 h-4 mr-2" />
                  Add Label
                </Button>
              </div>
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

                        {label.batch_size && (
                          <p className="text-xs text-slate-500 mt-2">Batch: {label.batch_size}</p>
                        )}
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

        {/* Handovers */}
        <TabsContent value="handovers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Shift Handovers ({filteredHandovers.length})</CardTitle>
                <Button onClick={() => setShowHandoverDialog(true)} size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add Handover
                </Button>
              </div>
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

        {/* Reports */}
        <TabsContent value="reports">
          <ReportsHub user={user} />
        </TabsContent>
      </Tabs>

      {/* Quick Add Dialogs */}
      <QuickAddCheckIn 
        open={showCheckInDialog} 
        onClose={() => setShowCheckInDialog(false)}
        onSubmit={(data) => createCheckInMutation.mutate({...data, staff_email: user?.email, staff_name: user?.full_name})}
        user={user}
      />
      <QuickAddTemperature 
        open={showTempDialog} 
        onClose={() => setShowTempDialog(false)}
        onSubmit={(data) => createTempMutation.mutate({...data, logged_by: user?.email, logged_by_name: user?.full_name})}
      />
      <QuickAddLabel 
        open={showLabelDialog} 
        onClose={() => setShowLabelDialog(false)}
        onSubmit={(data) => createLabelMutation.mutate({...data, prepared_by: user?.email, prepared_by_name: user?.full_name})}
      />
      <QuickAddHandover 
        open={showHandoverDialog} 
        onClose={() => setShowHandoverDialog(false)}
        onSubmit={(data) => createHandoverMutation.mutate({...data, handover_from: user?.email, handover_from_name: user?.full_name})}
      />
    </div>
  );
}

// Quick Add Components
function QuickAddCheckIn({ open, onClose, onSubmit, user }) {
  const [formData, setFormData] = useState({
    shift_date: format(new Date(), 'yyyy-MM-dd'),
    shift_type: 'opening',
    staff_role: 'kitchen',
    check_in_time: new Date().toISOString()
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Check-In</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Date</label>
            <Input type="date" value={formData.shift_date} onChange={(e) => setFormData({...formData, shift_date: e.target.value})} />
          </div>
          <div>
            <label className="text-sm font-medium">Shift Type</label>
            <Select value={formData.shift_type} onValueChange={(v) => setFormData({...formData, shift_type: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="opening">Opening</SelectItem>
                <SelectItem value="mid">Mid</SelectItem>
                <SelectItem value="closing">Closing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <Select value={formData.staff_role} onValueChange={(v) => setFormData({...formData, staff_role: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kitchen">Kitchen</SelectItem>
                <SelectItem value="foh">Front of House</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => onSubmit(formData)} className="w-full">Add Check-In</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QuickAddTemperature({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    equipment_name: '',
    temperature: '',
    log_date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Temperature</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Equipment</label>
            <Input value={formData.equipment_name} onChange={(e) => setFormData({...formData, equipment_name: e.target.value})} placeholder="e.g., Fridge 1" />
          </div>
          <div>
            <label className="text-sm font-medium">Temperature (°C)</label>
            <Input type="number" value={formData.temperature} onChange={(e) => setFormData({...formData, temperature: e.target.value})} />
          </div>
          <div>
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={2} />
          </div>
          <Button onClick={() => onSubmit(formData)} className="w-full">Log Temperature</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QuickAddLabel({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    item_name: '',
    prep_date: format(new Date(), 'yyyy-MM-dd'),
    use_by_date: format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    prep_type: 'fresh',
    storage_type: 'fridge'
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Food Label</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Item Name</label>
            <Input value={formData.item_name} onChange={(e) => setFormData({...formData, item_name: e.target.value})} placeholder="e.g., Chicken Tikka" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Prep Date</label>
              <Input type="date" value={formData.prep_date} onChange={(e) => setFormData({...formData, prep_date: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Use By Date</label>
              <Input type="date" value={formData.use_by_date} onChange={(e) => setFormData({...formData, use_by_date: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Prep Type</label>
              <Select value={formData.prep_type} onValueChange={(v) => setFormData({...formData, prep_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fresh">Fresh</SelectItem>
                  <SelectItem value="cooked">Cooked</SelectItem>
                  <SelectItem value="reheated">Reheated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Storage</label>
              <Select value={formData.storage_type} onValueChange={(v) => setFormData({...formData, storage_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fridge">Fridge</SelectItem>
                  <SelectItem value="freezer">Freezer</SelectItem>
                  <SelectItem value="ambient">Ambient</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => onSubmit(formData)} className="w-full">Add Label</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QuickAddHandover({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    shift_date: format(new Date(), 'yyyy-MM-dd'),
    shift_type: 'morning',
    stock_issues: '',
    equipment_issues: '',
    general_notes: ''
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Handover</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={formData.shift_date} onChange={(e) => setFormData({...formData, shift_date: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Shift</label>
              <Select value={formData.shift_type} onValueChange={(v) => setFormData({...formData, shift_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Stock Issues</label>
            <Textarea value={formData.stock_issues} onChange={(e) => setFormData({...formData, stock_issues: e.target.value})} rows={2} />
          </div>
          <div>
            <label className="text-sm font-medium">Equipment Issues</label>
            <Textarea value={formData.equipment_issues} onChange={(e) => setFormData({...formData, equipment_issues: e.target.value})} rows={2} />
          </div>
          <div>
            <label className="text-sm font-medium">General Notes</label>
            <Textarea value={formData.general_notes} onChange={(e) => setFormData({...formData, general_notes: e.target.value})} rows={3} />
          </div>
          <Button onClick={() => onSubmit(formData)} className="w-full">Add Handover</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
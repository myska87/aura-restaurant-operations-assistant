import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClipboardCheck, Thermometer, Tag, MessageSquare, User, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function OperationsHistory() {
  const [user, setUser] = useState(null);
  const [dateFilter, setDateFilter] = useState('');

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

      <Tabs defaultValue="checkins">
        <TabsList className="grid w-full grid-cols-4">
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
        </TabsList>

        {/* Check-Ins */}
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

        {/* Temperatures */}
        <TabsContent value="temperatures">
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
    </div>
  );
}
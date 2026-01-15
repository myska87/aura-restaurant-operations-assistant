import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ChefHat,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Calendar,
  User,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';

const stations = [
  { value: 'hot_line', label: '🔥 Hot Line', color: 'bg-red-100 text-red-700' },
  { value: 'fryer', label: '🍟 Fryer', color: 'bg-orange-100 text-orange-700' },
  { value: 'chai_station', label: '☕ Chai Station', color: 'bg-amber-100 text-amber-700' },
  { value: 'cold_prep', label: '🥗 Cold Prep', color: 'bg-blue-100 text-blue-700' },
  { value: 'grill', label: '🔥 Grill', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'bakery', label: '🥐 Bakery', color: 'bg-purple-100 text-purple-700' }
];

export default function PrepPlanner() {
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedStation, setSelectedStation] = useState('all');
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completingTask, setCompletingTask] = useState(null);
  const [completionData, setCompletionData] = useState({ quantity_prepped: 0, notes: '', prep_time_actual: 0 });

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

  const { data: prepTasks = [], isLoading } = useQuery({
    queryKey: ['prepTasks', selectedDate],
    queryFn: () => base44.entities.PrepTask.filter({ date: selectedDate }, '-created_date'),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.list(),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PrepTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['prepTasks']);
      setShowCompleteDialog(false);
      setCompletingTask(null);
    }
  });

  const filteredTasks = selectedStation === 'all' 
    ? prepTasks 
    : prepTasks.filter(t => t.station === selectedStation);

  const tasksByStation = stations.map(station => ({
    ...station,
    tasks: prepTasks.filter(t => t.station === station.value),
    completed: prepTasks.filter(t => t.station === station.value && t.status === 'completed').length,
    total: prepTasks.filter(t => t.station === station.value).length
  }));

  const overallProgress = prepTasks.length > 0 
    ? (prepTasks.filter(t => t.status === 'completed').length / prepTasks.length) * 100 
    : 0;

  const handleCompleteTask = (task) => {
    setCompletingTask(task);
    setCompletionData({ 
      quantity_prepped: task.quantity_needed || 0, 
      notes: '', 
      prep_time_actual: 0 
    });
    setShowCompleteDialog(true);
  };

  const handleSubmitCompletion = () => {
    completeMutation.mutate({
      id: completingTask.id,
      data: {
        ...completingTask,
        ...completionData,
        status: 'completed',
        completed_by: user?.email,
        completed_name: user?.full_name || user?.email,
        completed_at: new Date().toISOString()
      }
    });
  };

  const canEdit = ['manager', 'owner', 'admin'].includes(user?.role);

  if (isLoading) return <LoadingSpinner message="Loading prep tasks..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Prep Planner"
        description={`${prepTasks.length} tasks for ${format(new Date(selectedDate), 'MMMM d, yyyy')}`}
      />

      {/* Overall Progress */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Today's Progress</h3>
              <p className="text-sm text-slate-600">
                {prepTasks.filter(t => t.status === 'completed').length} of {prepTasks.length} tasks completed
              </p>
            </div>
            <div className="text-3xl font-bold text-emerald-600">
              {overallProgress.toFixed(0)}%
            </div>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-3">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-48"
        />
        <Select value={selectedStation} onValueChange={setSelectedStation}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stations</SelectItem>
            {stations.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Station Progress Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasksByStation.map(station => (
          <Card key={station.value} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-base">{station.label}</span>
                <Badge className={station.color}>
                  {station.completed}/{station.total}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress 
                value={station.total > 0 ? (station.completed / station.total) * 100 : 0} 
                className="h-2"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.map((task, idx) => {
          const stationInfo = stations.find(s => s.value === task.station);
          const isCompleted = task.status === 'completed';
          const isVerified = task.status === 'verified';

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`${isCompleted ? 'bg-emerald-50 border-emerald-300' : ''}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={stationInfo?.color}>
                          {stationInfo?.label}
                        </Badge>
                        {isVerified && (
                          <Badge className="bg-blue-100 text-blue-700">
                            <CheckCircle className="w-3 h-3 mr-1" /> Verified
                          </Badge>
                        )}
                        {isCompleted && !isVerified && (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            <CheckCircle className="w-3 h-3 mr-1" /> Completed
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-lg text-slate-800 mb-2">
                        {task.menu_item_name}
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-500">Quantity Needed:</span>
                          <span className="font-semibold ml-2">{task.quantity_needed} servings</span>
                        </div>
                        {task.assigned_name && (
                          <div>
                            <span className="text-slate-500">Assigned To:</span>
                            <span className="font-semibold ml-2">{task.assigned_name}</span>
                          </div>
                        )}
                        {task.completed_name && (
                          <div>
                            <span className="text-slate-500">Completed By:</span>
                            <span className="font-semibold ml-2">{task.completed_name}</span>
                          </div>
                        )}
                        {task.prep_time_actual && (
                          <div>
                            <span className="text-slate-500">Time Taken:</span>
                            <span className="font-semibold ml-2">{task.prep_time_actual} min</span>
                          </div>
                        )}
                      </div>

                      {task.notes && (
                        <p className="mt-2 text-sm text-slate-600 bg-white p-2 rounded">
                          {task.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {!isCompleted && (
                        <Button
                          size="sm"
                          onClick={() => handleCompleteTask(task)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      )}
                      {isCompleted && !isVerified && canEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => completeMutation.mutate({
                            id: task.id,
                            data: {
                              ...task,
                              status: 'verified',
                              verified_by: user?.email,
                              verified_at: new Date().toISOString()
                            }
                          })}
                          className="border-blue-300 text-blue-700"
                        >
                          Verify
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ChefHat className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No prep tasks for this station</p>
          </CardContent>
        </Card>
      )}

      {/* Complete Task Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Prep Task</DialogTitle>
          </DialogHeader>
          {completingTask && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{completingTask.menu_item_name}</h3>
                <p className="text-sm text-slate-600">
                  Expected: {completingTask.quantity_needed} servings
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Quantity Prepped</label>
                <Input
                  type="number"
                  value={completionData.quantity_prepped}
                  onChange={(e) => setCompletionData({...completionData, quantity_prepped: Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Time Taken (minutes)</label>
                <Input
                  type="number"
                  value={completionData.prep_time_actual}
                  onChange={(e) => setCompletionData({...completionData, prep_time_actual: Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={completionData.notes}
                  onChange={(e) => setCompletionData({...completionData, notes: e.target.value})}
                  placeholder="Any issues or observations..."
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitCompletion} className="bg-emerald-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Task
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, addMonths, isBefore, differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CheckCircle2, AlertCircle, Clock, Plus, Upload, User } from 'lucide-react';
import { motion } from 'framer-motion';

const EQUIPMENT_OPTIONS = [
  { id: 'oven', name: 'Oven', description: 'Deep clean oven interior, racks, and heating elements' },
  { id: 'fridge', name: 'Fridge', description: 'Deep clean shelves, seals, and interior surfaces' },
  { id: 'freezer', name: 'Freezer', description: 'Defrost and deep clean freezer interior' },
  { id: 'extraction', name: 'Extraction System', description: 'Clean filters, ducts, and extraction hood' },
  { id: 'drains', name: 'Drains', description: 'Deep clean and sanitize floor drains' },
  { id: 'storage_shelves', name: 'Storage Shelves', description: 'Remove items, clean and sanitize all shelving' },
  { id: 'walls_ceilings', name: 'Walls / Ceilings', description: 'Deep clean walls and ceiling surfaces' }
];

export default function DeepCleaningSchedule() {
  const [user, setUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: tasks = [] } = useQuery({
    queryKey: ['deepCleaningSchedule'],
    queryFn: () => base44.entities.DeepCleaningSchedule.list('-next_due_date'),
    enabled: !!user
  });

  // Calculate status for each task
  const getTaskStatus = (task) => {
    if (task.status === 'approved') return 'completed';
    
    const today = new Date();
    const dueDate = new Date(task.next_due_date);
    const daysUntilDue = differenceInDays(dueDate, today);

    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue <= 3) return 'upcoming';
    return 'scheduled';
  };

  const statusConfig = {
    completed: { color: 'bg-emerald-500', icon: CheckCircle2, label: 'Completed' },
    upcoming: { color: 'bg-amber-500', icon: Clock, label: 'Due Soon' },
    overdue: { color: 'bg-red-500', icon: AlertCircle, label: 'Overdue' },
    scheduled: { color: 'bg-blue-500', icon: Calendar, label: 'Scheduled' }
  };

  const overdueCount = tasks.filter(t => getTaskStatus(t) === 'overdue').length;
  const upcomingCount = tasks.filter(t => getTaskStatus(t) === 'upcoming').length;
  const completedCount = tasks.filter(t => t.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Deep Cleaning Schedule</h1>
          <p className="text-slate-600 mt-1">Manage periodic deep cleaning tasks</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">{tasks.length}</div>
              <div className="text-sm text-slate-600">Total Tasks</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{overdueCount}</div>
              <div className="text-sm text-slate-600">Overdue</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">{upcomingCount}</div>
              <div className="text-sm text-slate-600">Due Soon</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">{completedCount}</div>
              <div className="text-sm text-slate-600">Completed</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.map(task => {
          const status = getTaskStatus(task);
          const config = statusConfig[status];
          const StatusIcon = config.icon;

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-l-4" style={{ borderLeftColor: config.color.replace('bg-', '#') }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge className={`${config.color} text-white`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {task.area_equipment_name || task.area_equipment}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-slate-600">Frequency:</span>
                          <p className="font-medium capitalize">{task.frequency}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Next Due:</span>
                          <p className="font-medium">{format(new Date(task.next_due_date), 'd MMM yyyy')}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Assigned:</span>
                          <p className="font-medium">{task.assigned_role}</p>
                        </div>
                        {task.last_completed_date && (
                          <div>
                            <span className="text-slate-600">Last Done:</span>
                            <p className="font-medium">{format(new Date(task.last_completed_date), 'd MMM yyyy')}</p>
                          </div>
                        )}
                      </div>

                      {task.completed_by_name && (
                        <div className="text-sm text-slate-600">
                          Completed by <strong>{task.completed_by_name}</strong> on{' '}
                          {format(new Date(task.completion_date), 'd MMM yyyy, HH:mm')}
                        </div>
                      )}

                      {task.supervisor_approval && (
                        <div className="flex items-center gap-2 text-sm text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                          Approved by {task.supervisor_name}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {task.status !== 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedTask(task);
                            setShowCompleteDialog(true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {tasks.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600">No deep cleaning tasks scheduled</p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                variant="outline"
                className="mt-4"
              >
                Create First Task
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        user={user}
        onSuccess={() => {
          queryClient.invalidateQueries(['deepCleaningSchedule']);
          setShowCreateDialog(false);
        }}
      />

      {/* Complete Task Dialog */}
      {selectedTask && (
        <CompleteTaskDialog
          open={showCompleteDialog}
          onOpenChange={setShowCompleteDialog}
          task={selectedTask}
          user={user}
          onSuccess={() => {
            queryClient.invalidateQueries(['deepCleaningSchedule']);
            setShowCompleteDialog(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}

function CreateTaskDialog({ open, onOpenChange, user, onSuccess }) {
  const [equipment, setEquipment] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [assignedRole, setAssignedRole] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      const equipmentData = EQUIPMENT_OPTIONS.find(e => e.id === equipment);
      const today = format(new Date(), 'yyyy-MM-dd');
      
      let nextDueDate;
      if (frequency === 'weekly') {
        nextDueDate = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      } else if (frequency === 'monthly') {
        nextDueDate = format(addMonths(new Date(), 1), 'yyyy-MM-dd');
      } else {
        nextDueDate = format(addMonths(new Date(), 3), 'yyyy-MM-dd');
      }

      await base44.entities.DeepCleaningSchedule.create({
        area_equipment: equipment,
        area_equipment_name: equipmentData?.name,
        frequency,
        assigned_role: assignedRole,
        next_due_date: nextDueDate,
        status: 'pending'
      });
    },
    onSuccess
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Deep Cleaning Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-2">Equipment / Area</label>
            <Select value={equipment} onValueChange={setEquipment}>
              <SelectTrigger>
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_OPTIONS.map(opt => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">Frequency</label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">Assigned Role</label>
            <input
              type="text"
              value={assignedRole}
              onChange={(e) => setAssignedRole(e.target.value)}
              placeholder="e.g., Kitchen Manager, Chef"
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <Button
            onClick={() => createMutation.mutate()}
            disabled={!equipment || !assignedRole}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            Create Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompleteTaskDialog({ open, onOpenChange, task, user, onSuccess }) {
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [notes, setNotes] = useState('');
  const [supervisorSignOff, setSupervisorSignOff] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isManager = user?.role === 'manager' || user?.role === 'owner' || user?.role === 'admin';

  const completeMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);

      let beforePhotoUrl = null;
      let afterPhotoUrl = null;

      if (beforePhoto) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: beforePhoto });
        beforePhotoUrl = file_url;
      }

      if (afterPhoto) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: afterPhoto });
        afterPhotoUrl = file_url;
      }

      const today = format(new Date(), 'yyyy-MM-dd');
      let nextDueDate;
      
      if (task.frequency === 'weekly') {
        nextDueDate = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      } else if (task.frequency === 'monthly') {
        nextDueDate = format(addMonths(new Date(), 1), 'yyyy-MM-dd');
      } else {
        nextDueDate = format(addMonths(new Date(), 3), 'yyyy-MM-dd');
      }

      const updateData = {
        last_completed_date: today,
        next_due_date: nextDueDate,
        completed_by_id: user.id,
        completed_by_name: user.full_name,
        completed_by_email: user.email,
        completion_date: new Date().toISOString(),
        before_photo_url: beforePhotoUrl,
        after_photo_url: afterPhotoUrl,
        notes,
        status: supervisorSignOff && isManager ? 'approved' : 'completed'
      };

      if (supervisorSignOff && isManager) {
        updateData.supervisor_approval = true;
        updateData.supervisor_id = user.id;
        updateData.supervisor_name = user.full_name;
        updateData.approval_time = new Date().toISOString();
      }

      await base44.entities.DeepCleaningSchedule.update(task.id, updateData);
      setUploading(false);
    },
    onSuccess
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Deep Cleaning Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="font-semibold text-slate-900">{task.area_equipment_name}</p>
            <p className="text-sm text-slate-600 capitalize">Frequency: {task.frequency}</p>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">Before Photo (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBeforePhoto(e.target.files[0])}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">After Photo (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAfterPhoto(e.target.files[0])}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any observations or issues..."
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          {isManager && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={supervisorSignOff}
                  onChange={(e) => setSupervisorSignOff(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-medium text-emerald-900">
                  Supervisor Sign-Off (Manager approval required)
                </span>
              </label>
            </div>
          )}

          <Button
            onClick={() => completeMutation.mutate()}
            disabled={uploading}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {uploading ? 'Uploading...' : 'Mark as Complete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
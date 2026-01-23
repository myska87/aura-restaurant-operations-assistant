import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function PerformanceAppointmentManager({ staffId, staffName, user }) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [appointmentType, setAppointmentType] = useState('review');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [agenda, setAgenda] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const queryClient = useQueryClient();

  const isManager = ['admin', 'manager', 'owner'].includes(user?.role);

  const { data: appointments = [] } = useQuery({
    queryKey: ['performanceAppointments', staffId],
    queryFn: () => base44.entities.PerformanceAppointment.filter({ staff_id: staffId }),
    enabled: !!staffId && isManager
  });

  const scheduleMutation = useMutation({
    mutationFn: (data) => base44.entities.PerformanceAppointment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['performanceAppointments']);
      base44.entities.StaffAuditLog.create({
        staff_id: staffId,
        staff_name: staffName,
        action_type: 'appointment_scheduled',
        action_description: `Performance appointment scheduled for ${appointmentDate}`,
        performed_by_id: user?.id,
        performed_by_name: user?.full_name,
        performed_by_role: user?.role,
        action_date: new Date().toISOString()
      });
      setShowSchedule(false);
      resetForm();
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.PerformanceAppointment.update(id, {
      status,
      completed_date: status === 'completed' ? new Date().toISOString() : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['performanceAppointments']);
    }
  });

  const resetForm = () => {
    setAppointmentDate('');
    setAppointmentTime('');
    setAgenda('');
    setPrivateNotes('');
  };

  const handleSchedule = () => {
    if (!appointmentDate || !appointmentTime) return;
    const datetime = new Date(`${appointmentDate}T${appointmentTime}`);
    scheduleMutation.mutate({
      staff_id: staffId,
      staff_name: staffName,
      appointment_type: appointmentType,
      appointment_date: datetime.toISOString(),
      scheduled_by_id: user?.id,
      scheduled_by_name: user?.full_name,
      agenda,
      private_notes: privateNotes,
      status: 'planned'
    });
  };

  if (!isManager) return null;

  const statusConfig = {
    planned: { label: 'Planned', color: 'bg-blue-100 text-blue-700', icon: Clock },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    follow_up_needed: { label: 'Follow-up', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
    cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-600', icon: AlertCircle }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Performance Appointments
          </CardTitle>
          <Button size="sm" onClick={() => setShowSchedule(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p className="text-sm text-slate-500">No appointments scheduled</p>
        ) : (
          <div className="space-y-2">
            {appointments.map(apt => {
              const config = statusConfig[apt.status];
              const StatusIcon = config.icon;
              return (
                <Card key={apt.id}>
                  <CardContent className="pt-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold capitalize">{apt.appointment_type.replace('_', ' ')}</p>
                          <Badge className={config.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">
                          {format(new Date(apt.appointment_date), 'PPp')}
                        </p>
                        {apt.agenda && (
                          <p className="text-sm text-slate-700 mt-2">{apt.agenda}</p>
                        )}
                      </div>
                      {apt.status === 'planned' && (
                        <Select
                          value={apt.status}
                          onValueChange={(status) => updateStatusMutation.mutate({ id: apt.id, status })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="follow_up_needed">Follow-up</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Performance Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Appointment Type</Label>
              <Select value={appointmentType} onValueChange={setAppointmentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="review">Performance Review</SelectItem>
                  <SelectItem value="warning">Warning Discussion</SelectItem>
                  <SelectItem value="development">Development Plan</SelectItem>
                  <SelectItem value="promotion_discussion">Promotion Discussion</SelectItem>
                  <SelectItem value="check_in">Check-in</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Agenda/Topics</Label>
              <Textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={2} placeholder="What will be discussed..." />
            </div>

            <div>
              <Label>Private Notes (Manager/Admin Only)</Label>
              <Textarea value={privateNotes} onChange={(e) => setPrivateNotes(e.target.value)} rows={2} placeholder="Internal notes..." />
            </div>

            <Button onClick={handleSchedule} disabled={!appointmentDate || !appointmentTime} className="w-full">
              Schedule Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
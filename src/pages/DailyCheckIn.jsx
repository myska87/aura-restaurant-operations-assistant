import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ChecklistForm from '@/components/operations/ChecklistForm';
import HandoverForm from '@/components/operations/HandoverForm';
import TemperatureLog from '@/components/operations/TemperatureLog';
import LabelPrinter from '@/components/operations/LabelPrinter';

export default function DailyCheckIn() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('checkin');
  const [currentCheckIn, setCurrentCheckIn] = useState(null);

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

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: todayCheckIn, isLoading } = useQuery({
    queryKey: ['dailyCheckIn', user?.email, today],
    queryFn: async () => {
      if (!user?.email) return null;
      const checkIns = await base44.entities.DailyCheckIn.filter({
        staff_email: user.email,
        shift_date: today
      });
      return checkIns[0] || null;
    },
    enabled: !!user?.email,
    refetchInterval: 5000
  });

  const createCheckInMutation = useMutation({
    mutationFn: (data) => base44.entities.DailyCheckIn.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['dailyCheckIn']);
      setCurrentCheckIn(data);
    }
  });

  const updateCheckInMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DailyCheckIn.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['dailyCheckIn']);
    }
  });

  const handleStartShift = (shiftType, staffRole) => {
    createCheckInMutation.mutate({
      staff_id: user.id || '',
      staff_email: user.email,
      staff_name: user.full_name || user.email,
      shift_date: today,
      shift_type: shiftType,
      staff_role: staffRole,
      check_in_time: new Date().toISOString(),
      opening_checklist: { completed: false, items: [] },
      position_checklist: { completed: false, items: [] }
    });
  };

  const handleCheckOut = async () => {
    if (!todayCheckIn) return;
    
    if (!todayCheckIn.handover_completed) {
      alert('Please complete shift handover before checking out');
      setActiveTab('handover');
      return;
    }

    await updateCheckInMutation.mutateAsync({
      id: todayCheckIn.id,
      data: {
        ...todayCheckIn,
        check_out_time: new Date().toISOString(),
        status: 'checked_out'
      }
    });
  };

  if (isLoading) return <LoadingSpinner message="Loading shift status..." />;

  const isCheckedIn = todayCheckIn && todayCheckIn.status !== 'checked_out';
  const canStartWork = isCheckedIn && 
                       todayCheckIn.opening_checklist?.completed && 
                       todayCheckIn.position_checklist?.completed;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Operations Control"
        description="Mandatory check-in & shift management system"
      />

      {/* Status Card */}
      <Card className={isCheckedIn ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isCheckedIn ? 'bg-emerald-600' : 'bg-amber-600'
              }`}>
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg">
                  {isCheckedIn ? `Checked In - ${todayCheckIn.shift_type} shift` : 'Not Checked In'}
                </p>
                <p className="text-sm text-slate-600">
                  {isCheckedIn 
                    ? `Started at ${format(new Date(todayCheckIn.check_in_time), 'HH:mm')}`
                    : 'Start your shift to access operations'
                  }
                </p>
              </div>
            </div>
            {isCheckedIn && canStartWork && (
              <Button
                onClick={handleCheckOut}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Check Out
              </Button>
            )}
          </div>

          {isCheckedIn && !canStartWork && (
            <div className="mt-4 p-3 bg-amber-100 rounded-lg border border-amber-300">
              <p className="text-sm text-amber-900 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Complete all checklists before starting work
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {!isCheckedIn ? (
        <CheckInSelector onStartShift={handleStartShift} />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="checkin" className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Checklists
            </TabsTrigger>
            <TabsTrigger value="temperature">
              Temperature
            </TabsTrigger>
            <TabsTrigger value="labels">
              Labels
            </TabsTrigger>
            <TabsTrigger value="handover">
              Handover
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checkin" className="space-y-4">
            <ChecklistForm 
              checkIn={todayCheckIn}
              onUpdate={(data) => updateCheckInMutation.mutate({ id: todayCheckIn.id, data })}
            />
          </TabsContent>

          <TabsContent value="temperature">
            <TemperatureLog user={user} />
          </TabsContent>

          <TabsContent value="labels">
            <LabelPrinter user={user} />
          </TabsContent>

          <TabsContent value="handover">
            <HandoverForm 
              checkIn={todayCheckIn}
              user={user}
              onComplete={(handoverCompleted) => {
                updateCheckInMutation.mutate({
                  id: todayCheckIn.id,
                  data: { ...todayCheckIn, handover_completed: handoverCompleted }
                });
              }}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function CheckInSelector({ onStartShift }) {
  const [selectedShift, setSelectedShift] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const shiftTypes = [
    { id: 'opening', label: 'Opening Shift', icon: '🌅', time: 'Before 12pm' },
    { id: 'mid', label: 'Mid Shift', icon: '☀️', time: '12pm - 6pm' },
    { id: 'closing', label: 'Closing Shift', icon: '🌙', time: 'After 6pm' }
  ];

  const roleTypes = [
    { id: 'kitchen', label: 'Kitchen', icon: '🧑‍🍳' },
    { id: 'foh', label: 'Front of House', icon: '☕' },
    { id: 'manager', label: 'Manager', icon: '👔' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Start Your Shift</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Select Shift Type</p>
            <div className="grid md:grid-cols-3 gap-3">
              {shiftTypes.map(shift => (
                <button
                  key={shift.id}
                  onClick={() => setSelectedShift(shift.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedShift === shift.id
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{shift.icon}</div>
                  <p className="font-semibold text-slate-800">{shift.label}</p>
                  <p className="text-xs text-slate-500">{shift.time}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Select Your Role</p>
            <div className="grid md:grid-cols-3 gap-3">
              {roleTypes.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedRole === role.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{role.icon}</div>
                  <p className="font-semibold text-slate-800">{role.label}</p>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => onStartShift(selectedShift, selectedRole)}
            disabled={!selectedShift || !selectedRole}
            size="lg"
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600"
          >
            <Shield className="w-5 h-5 mr-2" />
            Check In & Load Checklists
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
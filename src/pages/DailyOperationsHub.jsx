import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Thermometer,
  ClipboardCheck,
  LogIn,
  LogOut,
  Shield,
  ChefHat,
  Users,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ShiftStatusHeader from '@/components/operations/ShiftStatusHeader';
import RoleTaskPanel from '@/components/operations/RoleTaskPanel';
import TemperatureTableView from '@/components/operations/TemperatureTableView';

export default function DailyOperationsHub() {
  const [user, setUser] = useState(null);
  const [showTempTable, setShowTempTable] = useState(false);
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
  const currentHour = new Date().getHours();
  const currentShift = currentHour >= 5 && currentHour < 15 ? 'AM' : 'PM';

  // Get today's check-in
  const { data: todayCheckIn } = useQuery({
    queryKey: ['todayCheckIn', user?.email, today],
    queryFn: async () => {
      const checkIns = await base44.entities.DailyCheckIn.filter({
        staff_email: user?.email,
        shift_date: today
      });
      return checkIns[0];
    },
    enabled: !!user
  });

  // Get today's temperature logs
  const { data: todayTemps = [] } = useQuery({
    queryKey: ['todayTemps', today],
    queryFn: () => base44.entities.TemperatureLog.filter({
      log_date: today
    }),
    enabled: !!user
  });

  // Get temperature-controlled assets
  const { data: tempAssets = [] } = useQuery({
    queryKey: ['tempAssets'],
    queryFn: () => base44.entities.Assets_Registry_v1.filter({
      is_temperature_controlled: true,
      status: { $ne: 'deactivated' }
    }),
    enabled: !!user
  });

  const checkInMutation = useMutation({
    mutationFn: (data) => base44.entities.DailyCheckIn.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['todayCheckIn']);
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DailyCheckIn.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['todayCheckIn']);
    }
  });

  const handleCheckIn = () => {
    checkInMutation.mutate({
      staff_name: user?.full_name,
      staff_email: user?.email,
      staff_role: user?.role,
      shift_date: today,
      shift_type: currentShift,
      clock_in_time: new Date().toISOString(),
      status: 'in_progress'
    });
  };

  const handleCheckOut = () => {
    if (!todayCheckIn) return;
    
    checkOutMutation.mutate({
      id: todayCheckIn.id,
      data: {
        clock_out_time: new Date().toISOString(),
        status: 'completed'
      }
    });
  };

  // Calculate shift status
  const getShiftStatus = () => {
    if (!todayCheckIn) return 'not_started';
    if (todayCheckIn.status === 'completed') return 'completed';
    
    // Check for pending tasks based on role
    const userRole = user?.role?.toLowerCase() || '';
    const position = user?.position?.toLowerCase() || '';
    
    if (position.includes('chef') || position.includes('cook')) {
      // Chef needs temperature logs
      if (tempAssets.length > 0 && todayTemps.length === 0) {
        return 'pending_checks';
      }
    }
    
    return 'in_progress';
  };

  const shiftStatus = getShiftStatus();
  const canCheckOut = shiftStatus !== 'pending_checks';

  if (!user) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Operations Hub"
        description="Your intelligent shift command center"
      />

      <ShiftStatusHeader
        user={user}
        checkIn={todayCheckIn}
        shiftType={currentShift}
        status={shiftStatus}
        date={today}
      />

      {!todayCheckIn ? (
        <Card className="border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center">
                  <LogIn className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-900">Ready to Start Your Shift?</h3>
                  <p className="text-sm text-emerald-700">Check in to unlock your daily tasks</p>
                </div>
              </div>
              <Button
                onClick={handleCheckIn}
                disabled={checkInMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
                size="lg"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Check In
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <RoleTaskPanel
            user={user}
            checkIn={todayCheckIn}
            todayTemps={todayTemps}
            tempAssets={tempAssets}
            onOpenTempTable={() => setShowTempTable(true)}
          />

          {shiftStatus === 'pending_checks' && (
            <Card className="border-amber-300 bg-amber-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900">Mandatory Checks Incomplete</p>
                    <p className="text-sm text-amber-700">Complete all required tasks before checking out</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {todayCheckIn.status !== 'completed' && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <LogOut className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Ready to Finish?</h3>
                      <p className="text-sm text-slate-600">
                        {canCheckOut ? 'All tasks complete' : 'Complete mandatory checks first'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleCheckOut}
                    disabled={!canCheckOut || checkOutMutation.isPending}
                    variant={canCheckOut ? 'default' : 'outline'}
                    size="lg"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Check Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <TemperatureTableView
        open={showTempTable}
        onOpenChange={setShowTempTable}
        assets={tempAssets}
        existingLogs={todayTemps}
        user={user}
        date={today}
      />
    </div>
  );
}
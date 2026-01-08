import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, startOfWeek, endOfWeek, isToday, addDays } from 'date-fns';
import {
  Users,
  Calendar,
  GraduationCap,
  Package,
  ClipboardCheck,
  FileText,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import QuickActions from '@/components/dashboard/QuickActions';
import UpcomingShifts from '@/components/dashboard/UpcomingShifts';
import LowStockAlert from '@/components/dashboard/LowStockAlert';
import TrainingProgressWidget from '@/components/dashboard/TrainingProgress';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('staff');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setUserRole(userData.role || 'staff');
      } catch (e) {
        console.log('User not loaded');
      }
    };
    loadUser();
  }, []);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const { data: staff = [], isLoading: loadingStaff } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.list(),
  });

  const { data: shifts = [], isLoading: loadingShifts } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.filter({
      date: { $gte: format(today, 'yyyy-MM-dd'), $lte: format(addDays(today, 7), 'yyyy-MM-dd') }
    }, 'date', 20),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.filter({ status: 'pending' }, '-due_date', 10),
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => base44.entities.Ingredient.list(),
  });

  const { data: sops = [] } = useQuery({
    queryKey: ['sops'],
    queryFn: () => base44.entities.SOP.list(),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.TrainingCourse.list(),
  });

  const { data: trainingProgress = [] } = useQuery({
    queryKey: ['trainingProgress', user?.email],
    queryFn: () => user?.email 
      ? base44.entities.TrainingProgress.filter({ staff_email: user.email })
      : [],
    enabled: !!user?.email,
  });

  const { data: audits = [] } = useQuery({
    queryKey: ['audits'],
    queryFn: () => base44.entities.QualityAudit.list('-audit_date', 5),
  });

  if (loadingStaff && loadingShifts) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const todayShifts = shifts.filter(s => s.date === format(today, 'yyyy-MM-dd'));
  const activeStaff = staff.filter(s => s.status === 'active');
  const lowStockCount = ingredients.filter(i => i.current_stock <= i.min_stock_level).length;
  const pendingSOPs = sops.filter(s => s.status === 'draft').length;
  const weekShifts = shifts.filter(s => {
    const d = new Date(s.date);
    return d >= weekStart && d <= weekEnd;
  });

  // Build activity feed from recent data
  const activities = [
    ...shifts.slice(0, 3).map(s => ({
      id: `shift-${s.id}`,
      type: 'shift',
      title: `${s.staff_name} - ${s.position || 'Shift'}`,
      description: `${s.scheduled_start} - ${s.scheduled_end}`,
      time: s.created_date
    })),
    ...audits.slice(0, 2).map(a => ({
      id: `audit-${a.id}`,
      type: 'audit',
      title: a.title,
      description: `Score: ${a.overall_score}/${a.max_score}`,
      time: a.created_date
    }))
  ].slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-400/20 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-emerald-100 text-sm md:text-base">
            {format(today, 'EEEE, MMMM d, yyyy')} • {todayShifts.length} shifts today
          </p>
          
          {userRole !== 'staff' && (
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2">
                <p className="text-xs text-emerald-200">Team Members</p>
                <p className="text-xl font-bold">{activeStaff.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2">
                <p className="text-xs text-emerald-200">Week Shifts</p>
                <p className="text-xl font-bold">{weekShifts.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2">
                <p className="text-xs text-emerald-200">Tasks Due</p>
                <p className="text-xl font-bold">{tasks.length}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Grid */}
      {userRole !== 'staff' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Today's Shifts"
            value={todayShifts.length}
            subtitle={`${todayShifts.filter(s => s.status === 'clocked_in').length} clocked in`}
            icon={Calendar}
            color="emerald"
            delay={0}
          />
          <StatsCard
            title="Active Staff"
            value={activeStaff.length}
            icon={Users}
            color="blue"
            delay={0.1}
          />
          <StatsCard
            title="Low Stock Items"
            value={lowStockCount}
            icon={Package}
            color={lowStockCount > 0 ? 'amber' : 'emerald'}
            delay={0.2}
          />
          <StatsCard
            title="Pending SOPs"
            value={pendingSOPs}
            icon={FileText}
            color="purple"
            delay={0.3}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Low Stock Alert */}
          <LowStockAlert ingredients={ingredients} />
          
          {/* Upcoming Shifts */}
          <UpcomingShifts shifts={shifts.slice(0, 6)} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Training Progress */}
          <TrainingProgressWidget 
            progress={trainingProgress} 
            totalCourses={courses.length} 
          />
          
          {/* Activity Feed */}
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
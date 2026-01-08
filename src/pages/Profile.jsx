import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Award,
  GraduationCap,
  Clock,
  CheckCircle,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: staffProfile } = useQuery({
    queryKey: ['staffProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const staff = await base44.entities.Staff.filter({ email: user.email });
      return staff[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['myShifts', user?.email],
    queryFn: () => user?.email 
      ? base44.entities.Shift.filter({ staff_id: staffProfile?.id }, '-date', 20)
      : [],
    enabled: !!staffProfile?.id,
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ['myCertificates', user?.email],
    queryFn: () => user?.email 
      ? base44.entities.Certificate.filter({ staff_email: user.email })
      : [],
    enabled: !!user?.email,
  });

  const { data: trainingProgress = [] } = useQuery({
    queryKey: ['myTrainingProgress', user?.email],
    queryFn: () => user?.email 
      ? base44.entities.TrainingProgress.filter({ staff_email: user.email })
      : [],
    enabled: !!user?.email,
  });

  const { data: coaching = [] } = useQuery({
    queryKey: ['myCoaching', user?.email],
    queryFn: () => user?.email 
      ? base44.entities.Coaching.filter({ staff_email: user.email })
      : [],
    enabled: !!user?.email,
  });

  if (!user) return <LoadingSpinner message="Loading profile..." />;

  const completedCourses = trainingProgress.filter(p => p.status === 'completed').length;
  const totalHours = shifts.reduce((sum, s) => {
    if (s.actual_clock_in && s.actual_clock_out) {
      const hours = (new Date(s.actual_clock_out) - new Date(s.actual_clock_in)) / (1000 * 60 * 60);
      return sum + hours;
    }
    return sum;
  }, 0);

  const roleColors = {
    staff: 'bg-slate-100 text-slate-700',
    manager: 'bg-blue-100 text-blue-700',
    owner: 'bg-amber-100 text-amber-700',
    admin: 'bg-purple-100 text-purple-700'
  };

  const levelLabels = {
    culture: 'Culture',
    L1: 'Level 1',
    L2: 'Level 2',
    L3: 'Level 3'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 rounded-3xl p-8 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <Avatar className="w-24 h-24 border-4 border-white/30">
            <AvatarImage src={staffProfile?.avatar_url} />
            <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
              {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold">{user.full_name || 'Team Member'}</h1>
            <p className="text-emerald-100">{staffProfile?.position || 'No position set'}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
              <Badge className={roleColors[user.role] || roleColors.staff}>
                {user.role || 'Staff'}
              </Badge>
              {staffProfile?.department && (
                <Badge variant="outline" className="border-white/30 text-white">
                  {staffProfile.department.replace('_', ' ')}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="md:ml-auto flex gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{Math.round(totalHours)}</p>
              <p className="text-xs text-emerald-200">Hours Worked</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{completedCourses}</p>
              <p className="text-xs text-emerald-200">Courses Done</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{certificates.length}</p>
              <p className="text-xs text-emerald-200">Certificates</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contact Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            {staffProfile?.phone && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="font-medium">{staffProfile.phone}</p>
                </div>
              </div>
            )}
            {staffProfile?.hire_date && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Joined</p>
                  <p className="font-medium">{format(new Date(staffProfile.hire_date), 'MMM d, yyyy')}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="certificates">
        <TabsList className="bg-white border">
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="shifts">Recent Shifts</TabsTrigger>
          <TabsTrigger value="coaching">Coaching History</TabsTrigger>
        </TabsList>

        <TabsContent value="certificates" className="mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {certificates.length > 0 ? (
              certificates.map((cert) => (
                <Card key={cert.id} className="overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-600" />
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                        <Award className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{levelLabels[cert.level] || cert.level}</h3>
                        <p className="text-sm text-slate-500">
                          Issued: {format(new Date(cert.issued_date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs font-mono text-slate-400 mt-1">{cert.certificate_number}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-2">
                <CardContent className="py-12 text-center text-slate-500">
                  <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Complete training levels to earn certificates</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="shifts" className="mt-4">
          <Card>
            <ScrollArea className="h-80">
              <div className="p-4 space-y-3">
                {shifts.length > 0 ? (
                  shifts.map((shift) => (
                    <div key={shift.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          shift.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                          shift.status === 'clocked_in' ? 'bg-blue-100 text-blue-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {shift.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{format(new Date(shift.date), 'EEE, MMM d')}</p>
                          <p className="text-sm text-slate-500">{shift.scheduled_start} - {shift.scheduled_end}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{shift.position || 'Shift'}</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No shift history yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="coaching" className="mt-4">
          <Card>
            <ScrollArea className="h-80">
              <div className="p-4 space-y-3">
                {coaching.length > 0 ? (
                  coaching.map((session) => (
                    <div key={session.id} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{session.coaching_type}</Badge>
                        <span className="text-sm text-slate-500">{format(new Date(session.session_date), 'MMM d, yyyy')}</span>
                      </div>
                      {session.manager_feedback && (
                        <p className="text-sm text-slate-600 mt-2">{session.manager_feedback}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">Manager: {session.manager_name}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No coaching sessions yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
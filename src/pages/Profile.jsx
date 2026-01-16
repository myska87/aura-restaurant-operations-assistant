import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PersonalDetails from '@/components/profile/PersonalDetails';
import DocumentsVault from '@/components/profile/DocumentsVault';
import ShiftsPanel from '@/components/profile/ShiftsPanel';
import TasksList from '@/components/profile/TasksList';
import TrainingView from '@/components/profile/TrainingView';
import NextMeeting from '@/components/profile/NextMeeting';
import PerformanceSnapshot from '@/components/profile/PerformanceSnapshot';

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

  if (!user) return <LoadingSpinner message="Loading your profile..." />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <ProfileHeader user={user} staffProfile={staffProfile} />

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Info */}
        <div className="lg:col-span-1 space-y-4">
          <PersonalDetails user={user} staffProfile={staffProfile} />
          <NextMeeting user={user} staffProfile={staffProfile} />
        </div>

        {/* Right Column - Detailed Info */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="tasks" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="documents">Docs</TabsTrigger>
              <TabsTrigger value="shifts">Shifts</TabsTrigger>
              <TabsTrigger value="training">Training</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks">
              <TasksList user={user} staffProfile={staffProfile} />
            </TabsContent>

            <TabsContent value="documents">
              <DocumentsVault user={user} staffProfile={staffProfile} />
            </TabsContent>

            <TabsContent value="shifts">
              <ShiftsPanel user={user} staffProfile={staffProfile} />
            </TabsContent>

            <TabsContent value="training">
              <TrainingView user={user} />
            </TabsContent>

            <TabsContent value="performance">
              <PerformanceSnapshot user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
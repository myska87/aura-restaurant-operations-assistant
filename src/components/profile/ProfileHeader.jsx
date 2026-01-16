import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Award, Clock, TrendingUp } from 'lucide-react';

export default function ProfileHeader({ user, staffProfile }) {
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: certificates = [] } = useQuery({
    queryKey: ['myCertificates', user?.email],
    queryFn: () => base44.entities.Certificate.filter({ staff_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['myShifts', user?.email],
    queryFn: () => staffProfile?.id 
      ? base44.entities.Shift.filter({ staff_id: staffProfile.id }, '-date', 50)
      : [],
    enabled: !!staffProfile?.id,
  });

  const { data: completedCourses = [] } = useQuery({
    queryKey: ['myCompletedCourses', user?.email],
    queryFn: () => base44.entities.TrainingProgress.filter({ 
      staff_email: user.email, 
      status: 'completed' 
    }),
    enabled: !!user?.email,
  });

  const totalHours = shifts.reduce((sum, s) => {
    if (s.actual_clock_in && s.actual_clock_out) {
      const hours = (new Date(s.actual_clock_out) - new Date(s.actual_clock_in)) / (1000 * 60 * 60);
      return sum + hours;
    }
    return sum;
  }, 0);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !staffProfile) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Staff.update(staffProfile.id, {
        avatar_url: result.file_url
      });
      queryClient.invalidateQueries(['staffProfile']);
      setShowPhotoUpload(false);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const roleColors = {
    staff: 'bg-slate-100 text-slate-700',
    manager: 'bg-blue-100 text-blue-700',
    owner: 'bg-amber-100 text-amber-700',
    admin: 'bg-purple-100 text-purple-700'
  };

  const statusColor = staffProfile?.status === 'active' ? 'bg-emerald-500' :
                      staffProfile?.status === 'on_leave' ? 'bg-amber-500' : 'bg-red-500';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 rounded-3xl p-8 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <Avatar className="w-32 h-32 border-4 border-white/30 shadow-2xl">
              <AvatarImage src={staffProfile?.avatar_url} />
              <AvatarFallback className="bg-white/20 text-white text-3xl font-bold">
                {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => setShowPhotoUpload(true)}
              className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              <Camera className="w-5 h-5 text-emerald-600" />
            </button>
            <div className={`absolute top-0 right-0 w-4 h-4 ${statusColor} rounded-full border-2 border-white`} />
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-1">{user.full_name || 'Team Member'}</h1>
            <p className="text-emerald-100 text-lg mb-3">{staffProfile?.position || 'No position set'}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <Badge className={`${roleColors[user.role] || roleColors.staff} text-sm`}>
                {user.role?.toUpperCase() || 'STAFF'}
              </Badge>
              {staffProfile?.department && (
                <Badge variant="outline" className="border-white/30 bg-white/10 text-white text-sm">
                  {staffProfile.department.replace('_', ' ').toUpperCase()}
                </Badge>
              )}
              <Badge variant="outline" className="border-white/30 bg-white/10 text-white text-sm">
                🟢 {staffProfile?.status?.toUpperCase() || 'ACTIVE'}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2">
                <Clock className="w-8 h-8" />
              </div>
              <p className="text-2xl font-bold">{Math.round(totalHours)}</p>
              <p className="text-xs text-emerald-200">Hours</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2">
                <TrendingUp className="w-8 h-8" />
              </div>
              <p className="text-2xl font-bold">{completedCourses.length}</p>
              <p className="text-xs text-emerald-200">Courses</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2">
                <Award className="w-8 h-8" />
              </div>
              <p className="text-2xl font-bold">{certificates.length}</p>
              <p className="text-xs text-emerald-200">Certificates</p>
            </div>
          </div>
        </div>
      </motion.div>

      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Upload a clear photo of your face. Square photos work best.</p>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="w-full"
            />
            {uploading && <p className="text-sm text-slate-500">Uploading...</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
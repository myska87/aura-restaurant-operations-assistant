import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Droplet, 
  Sparkles, 
  UserCheck, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import DailyCleaningScheduleForm from '@/components/cleaning/DailyCleaningScheduleForm';

export default function CleaningHygieneHub() {
  const [user, setUser] = useState(null);
  const [showDailyForm, setShowDailyForm] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch today's daily cleaning logs
  const { data: dailyLogs = [] } = useQuery({
    queryKey: ['dailyCleaningLogs', today],
    queryFn: () => base44.entities.DailyCleaningLog.filter({ date: today }),
    enabled: !!user
  });
  // Calculate completion status
  const completedLogs = dailyLogs.filter(log => log.status === 'completed' || log.status === 'approved');
  const dailyCompletionRate = dailyLogs.length > 0 
    ? Math.round((completedLogs.length / dailyLogs.length) * 100) 
    : 0;

  const sections = [
    {
      id: 1,
      title: 'Daily Cleaning',
      description: 'Routine cleaning schedules and logs',
      icon: Droplet,
      color: 'bg-blue-500',
      onClick: () => setShowDailyForm(true),
      status: dailyLogs.length > 0 ? 'active' : 'pending',
      count: `${completedLogs.length}/${dailyLogs.length} completed`
    },
    {
      id: 2,
      title: 'Deep Cleaning',
      description: 'Equipment and area deep cleaning',
      icon: Sparkles,
      color: 'bg-purple-500'
    },
    {
      id: 3,
      title: 'Staff Hygiene',
      description: 'Personal hygiene declarations',
      icon: UserCheck,
      color: 'bg-emerald-500'
    },
    {
      id: 4,
      title: 'Illness Reporting',
      description: 'Staff illness notifications',
      icon: AlertCircle,
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
            Cleaning &amp; Hygiene
          </h1>
          <p className="text-lg text-slate-600 italic">
            "Cleanliness is respect. Hygiene is non-negotiable."
          </p>
        </div>

        {/* Placeholder Cards */}
        {/* CRITICAL: Cards are NOT clickable containers - buttons handle navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full border-2 border-slate-200 hover:border-blue-300 transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`${section.color} w-16 h-16 rounded-xl flex items-center justify-center shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{section.title}</CardTitle>
                        <p className="text-sm text-slate-500 mt-1">{section.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {section.status && (
                      <div className="mb-3 flex items-center justify-between">
                        <Badge variant={section.status === 'active' ? 'default' : 'outline'}>
                          {section.status === 'active' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                          {section.count || 'No entries'}
                        </Badge>
                      </div>
                    )}
                    <Button 
                      onClick={section.onClick}
                      disabled={!section.onClick}
                      className="w-full"
                    >
                      {section.onClick ? 'Open' : 'Coming Soon'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Info Badge */}
        <div className="text-center">
          <Badge variant="outline" className="text-slate-600">
            Daily Cleaning is now operational • More features coming soon
          </Badge>
        </div>
      </div>

      {/* Daily Cleaning Form Dialog */}
      <Dialog open={showDailyForm} onOpenChange={setShowDailyForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Daily Cleaning Schedule</DialogTitle>
          </DialogHeader>
          {user && (
            <DailyCleaningScheduleForm
              user={user}
              onSuccess={() => {
                queryClient.invalidateQueries(['dailyCleaningLogs']);
                setShowDailyForm(false);
              }}
              onCancel={() => setShowDailyForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
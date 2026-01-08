import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Clock, 
  FileText, 
  ClipboardCheck, 
  GraduationCap,
  Package,
  User
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const iconMap = {
  shift: Clock,
  sop: FileText,
  audit: ClipboardCheck,
  training: GraduationCap,
  inventory: Package,
  staff: User
};

const colorMap = {
  shift: 'bg-emerald-100 text-emerald-600',
  sop: 'bg-amber-100 text-amber-600',
  audit: 'bg-blue-100 text-blue-600',
  training: 'bg-purple-100 text-purple-600',
  inventory: 'bg-rose-100 text-rose-600',
  staff: 'bg-cyan-100 text-cyan-600'
};

export default function ActivityFeed({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
        <div className="text-center py-8 text-slate-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
      <ScrollArea className="h-80">
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = iconMap[activity.type] || Clock;
            const colorClass = colorMap[activity.type] || 'bg-slate-100 text-slate-600';
            
            return (
              <motion.div
                key={activity.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-4"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">{activity.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{activity.description}</p>
                  <p className="text-xs text-slate-300 mt-1">
                    {activity.time ? format(new Date(activity.time), 'MMM d, h:mm a') : 'Just now'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
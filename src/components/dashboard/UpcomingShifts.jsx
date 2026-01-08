import React from 'react';
import { motion } from 'framer-motion';
import { format, isToday, isTomorrow } from 'date-fns';
import { Clock, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function UpcomingShifts({ shifts = [] }) {
  const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  const statusColors = {
    scheduled: 'bg-slate-100 text-slate-600',
    clocked_in: 'bg-emerald-100 text-emerald-600',
    completed: 'bg-blue-100 text-blue-600',
    missed: 'bg-red-100 text-red-600'
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Upcoming Shifts</h3>
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600">
          {shifts.length} scheduled
        </Badge>
      </div>
      
      {shifts.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No upcoming shifts</p>
        </div>
      ) : (
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {shifts.map((shift, index) => (
              <motion.div
                key={shift.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                  {shift.staff_name?.charAt(0) || <User className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-700 truncate">{shift.staff_name}</p>
                  <p className="text-xs text-slate-400">
                    {formatDateLabel(shift.date)} • {shift.scheduled_start} - {shift.scheduled_end}
                  </p>
                </div>
                <Badge className={statusColors[shift.status] || statusColors.scheduled}>
                  {shift.position || shift.status?.replace('_', ' ')}
                </Badge>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
import React from 'react';
import { format } from 'date-fns';
import { Clock, CheckCircle, AlertCircle, PlayCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ShiftStatusHeader({ user, checkIn, shiftType, status, date }) {
  const statusConfig = {
    not_started: {
      label: 'Not Started',
      color: 'bg-slate-100 text-slate-700',
      icon: Clock
    },
    in_progress: {
      label: 'In Progress',
      color: 'bg-blue-100 text-blue-700',
      icon: PlayCircle
    },
    pending_checks: {
      label: 'Pending Checks',
      color: 'bg-amber-100 text-amber-700',
      icon: AlertCircle
    },
    ready_to_close: {
      label: 'Ready to Close',
      color: 'bg-emerald-100 text-emerald-700',
      icon: CheckCircle
    },
    completed: {
      label: 'Completed',
      color: 'bg-green-100 text-green-700',
      icon: CheckCircle
    }
  };

  const config = statusConfig[status] || statusConfig.not_started;
  const StatusIcon = config.icon;

  return (
    <Card className="border-2">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-sm text-slate-500 font-semibold">Date</p>
              <p className="text-xl font-bold text-slate-800">{format(new Date(date), 'MMM d')}</p>
              <p className="text-xs text-slate-400">{format(new Date(date), 'EEEE')}</p>
            </div>
            <div className="h-12 w-px bg-slate-200" />
            <div className="text-center">
              <p className="text-sm text-slate-500 font-semibold">Shift</p>
              <Badge className="text-lg px-3 py-1 bg-slate-800">{shiftType}</Badge>
            </div>
            <div className="h-12 w-px bg-slate-200" />
            <div>
              <p className="text-sm text-slate-500 font-semibold">Team Member</p>
              <p className="text-lg font-bold text-slate-800">{user?.full_name}</p>
              <p className="text-xs text-slate-600 capitalize">{user?.position || user?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-8 h-8 ${config.color.includes('slate') ? 'text-slate-400' : config.color.includes('blue') ? 'text-blue-600' : config.color.includes('amber') ? 'text-amber-600' : 'text-emerald-600'}`} />
            <div>
              <p className="text-sm text-slate-500 font-semibold">Status</p>
              <Badge className={`${config.color} text-sm px-3 py-1`}>
                {config.label}
              </Badge>
            </div>
          </div>
        </div>
        {checkIn && checkIn.clock_in_time && (
          <div className="mt-4 pt-4 border-t flex items-center gap-6 text-sm">
            <div>
              <span className="text-slate-500">Checked In:</span>
              <span className="ml-2 font-semibold">{format(new Date(checkIn.clock_in_time), 'HH:mm')}</span>
            </div>
            {checkIn.clock_out_time && (
              <div>
                <span className="text-slate-500">Checked Out:</span>
                <span className="ml-2 font-semibold">{format(new Date(checkIn.clock_out_time), 'HH:mm')}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
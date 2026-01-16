import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Calendar } from 'lucide-react';
import { format, isFuture, isPast, isToday } from 'date-fns';

export default function ShiftsPanel({ user, staffProfile }) {
  const { data: shifts = [] } = useQuery({
    queryKey: ['myShifts', staffProfile?.id],
    queryFn: () => base44.entities.Shift.filter({ staff_id: staffProfile.id }, '-date', 30),
    enabled: !!staffProfile?.id
  });

  const upcomingShifts = shifts.filter(s => isFuture(new Date(s.date)) || isToday(new Date(s.date)));
  const pastShifts = shifts.filter(s => isPast(new Date(s.date)) && !isToday(new Date(s.date)));

  return (
    <div className="space-y-4">
      {/* Upcoming Shifts */}
      {upcomingShifts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Upcoming Shifts</h3>
            </div>
            <div className="space-y-2">
              {upcomingShifts.map(shift => (
                <div key={shift.id} className={`p-4 rounded-lg border-2 ${
                  isToday(new Date(shift.date)) 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {format(new Date(shift.date), 'EEEE, MMMM d')}
                        {isToday(new Date(shift.date)) && (
                          <Badge className="ml-2 bg-blue-600">Today</Badge>
                        )}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        {shift.scheduled_start} - {shift.scheduled_end}
                      </p>
                      {shift.position && (
                        <Badge variant="outline" className="mt-2">
                          {shift.position}
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                      {shift.status || 'Scheduled'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Shifts */}
      {pastShifts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold">Recent Shifts</h3>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {pastShifts.slice(0, 10).map(shift => (
                <div key={shift.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-medium text-sm">
                          {format(new Date(shift.date), 'EEE, MMM d')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {shift.scheduled_start} - {shift.scheduled_end}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {shift.position || 'Shift'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {shifts.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No shifts scheduled</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
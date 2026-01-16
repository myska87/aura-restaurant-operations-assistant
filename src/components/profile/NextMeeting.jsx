import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Clock } from 'lucide-react';
import { format, isFuture } from 'date-fns';

export default function NextMeeting({ user, staffProfile }) {
  const { data: meetings = [] } = useQuery({
    queryKey: ['myMeetings', user?.email],
    queryFn: async () => {
      const allMeetings = await base44.entities.Meeting.list('-date', 20);
      return allMeetings.filter(m => 
        m.attendees?.includes(user.email) && 
        isFuture(new Date(m.date)) &&
        m.status !== 'cancelled'
      );
    },
    enabled: !!user?.email
  });

  const nextMeeting = meetings[0];

  if (!nextMeeting) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-8">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No upcoming meetings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-purple-900">Next Meeting</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-lg text-purple-900">{nextMeeting.title}</p>
            <Badge className="bg-purple-600 mt-2">{nextMeeting.meeting_type}</Badge>
          </div>

          <div className="flex items-center gap-2 text-sm text-purple-800">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(nextMeeting.date), 'EEEE, MMMM d')}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-purple-800">
            <Clock className="w-4 h-4" />
            <span>{nextMeeting.start_time} - {nextMeeting.end_time}</span>
          </div>

          {nextMeeting.agenda && (
            <div className="p-3 bg-white/50 rounded-lg">
              <p className="text-xs text-purple-700 font-semibold mb-1">Agenda:</p>
              <p className="text-sm text-purple-900">{nextMeeting.agenda}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
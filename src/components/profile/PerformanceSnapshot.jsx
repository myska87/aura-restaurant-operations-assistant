import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Award, Heart, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function PerformanceSnapshot({ user }) {
  const { data: coaching = [] } = useQuery({
    queryKey: ['myCoaching', user?.email],
    queryFn: () => base44.entities.Coaching.filter({ staff_email: user.email }, '-session_date', 5),
    enabled: !!user?.email
  });

  const { data: recoveries = [] } = useQuery({
    queryKey: ['myRecoveries', user?.email],
    queryFn: () => base44.entities.ServiceRecovery.filter({ staff_email: user.email }, '-issue_date', 10),
    enabled: !!user?.email
  });

  const satisfiedRecoveries = recoveries.filter(r => r.guest_outcome === 'satisfied').length;
  const totalRecoveries = recoveries.length;
  const recoveryRate = totalRecoveries > 0 ? Math.round((satisfiedRecoveries / totalRecoveries) * 100) : 0;

  const latestCoaching = coaching[0];

  return (
    <div className="space-y-4">
      {/* Recovery Performance */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900">Service Recovery</h3>
              <p className="text-sm text-purple-700">How you turn issues into fans</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <p className="text-2xl font-bold text-purple-900">{recoveryRate}%</p>
              <p className="text-xs text-purple-700">Success Rate</p>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <p className="text-2xl font-bold text-purple-900">{totalRecoveries}</p>
              <p className="text-xs text-purple-700">Issues Handled</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest Feedback */}
      {latestCoaching && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Latest Feedback</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{latestCoaching.coaching_type}</Badge>
                <span className="text-sm text-slate-500">
                  {format(new Date(latestCoaching.session_date), 'MMM d, yyyy')}
                </span>
              </div>
              
              {latestCoaching.manager_feedback && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-700">{latestCoaching.manager_feedback}</p>
                </div>
              )}
              
              <p className="text-xs text-slate-500">From {latestCoaching.manager_name}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recognition */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="pt-6 text-center">
          <Award className="w-12 h-12 text-amber-600 mx-auto mb-3" />
          <h4 className="font-semibold text-amber-900 mb-2">Keep Up the Great Work!</h4>
          <p className="text-sm text-amber-800">
            Your dedication and effort make a real difference to our guests and team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
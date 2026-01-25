import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, ClipboardCheck, Thermometer, Clock, UtensilsCrossed, LogOut, Lock } from 'lucide-react';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useDayState, DAY_STATES } from '@/components/daystate/DayStateContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function OperateHome() {
  const [user, setUser] = useState(null);
  const [restaurantState, setRestaurantState] = useState('Not Started');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Determine restaurant day state based on current hour
  const getDayState = () => {
    const hour = new Date().getHours();
    if (hour < 5) return 'Closed';
    if (hour < 11) return 'Opening';
    if (hour < 17) return 'Open';
    if (hour < 22) return 'Closing';
    return 'Closed';
  };

  useEffect(() => {
    setRestaurantState(getDayState());
  }, []);

  // Get state color
  const getStateColor = () => {
    const stateColors = {
      'Not Started': 'bg-slate-100 text-slate-900',
      'Opening': 'bg-blue-100 text-blue-900',
      'Open': 'bg-emerald-100 text-emerald-900',
      'Closing': 'bg-orange-100 text-orange-900',
      'Closed': 'bg-red-100 text-red-900'
    };
    return stateColors[restaurantState] || stateColors['Not Started'];
  };

  // Get state icon
  const getStateIcon = () => {
    const stateIcons = {
      'Not Started': '🔴',
      'Opening': '🟡',
      'Open': '🟢',
      'Closing': '🟠',
      'Closed': '⚫'
    };
    return stateIcons[restaurantState] || '🔴';
  };

  if (!user) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        {/* SECTION A: Today Status */}
        <Card className="border-2 border-emerald-200 shadow-md">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50">
            <CardTitle className="text-2xl">Today's Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Current Date */}
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-600 font-semibold">Date</p>
                  <p className="text-xl font-bold text-slate-900">
                    {format(new Date(), 'EEE, MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              {/* Restaurant Day State */}
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-amber-600" />
                <div>
                  <p className="text-sm text-slate-600 font-semibold">Day State</p>
                  <Badge className={`text-sm font-bold mt-1 ${getStateColor()}`}>
                    {getStateIcon()} {restaurantState}
                  </Badge>
                </div>
              </div>

              {/* User Role */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                  {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-semibold">Your Role</p>
                  <p className="text-lg font-bold text-slate-900 capitalize">
                    {user?.role || 'Staff'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION B: My Tasks */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Auto-filtered by your role and current day state
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Placeholder Task Items */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Opening Checklist</p>
                  <p className="text-sm text-slate-600">Complete before service starts</p>
                </div>
                <Badge variant="outline" className="flex-shrink-0">Pending</Badge>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Temperature Logging</p>
                  <p className="text-sm text-slate-600">Log fridge and freezer temperatures</p>
                </div>
                <Badge variant="outline" className="flex-shrink-0">Pending</Badge>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Personal Hygiene Declaration</p>
                  <p className="text-sm text-slate-600">Required before clocking in</p>
                </div>
                <Badge variant="outline" className="flex-shrink-0">Pending</Badge>
              </div>

              <p className="text-xs text-slate-500 pt-2 italic">
                Read-only view. Task updates managed separately.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SECTION C: Daily Flows */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Daily Flows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <Button 
                disabled 
                className="h-24 flex flex-col items-center justify-center gap-2 bg-blue-50 text-blue-900 border-2 border-blue-200 hover:bg-blue-100"
                variant="outline"
              >
                <ClipboardCheck className="w-6 h-6" />
                <span className="text-xs font-semibold">Opening Checklist</span>
              </Button>

              <Button 
                disabled 
                className="h-24 flex flex-col items-center justify-center gap-2 bg-red-50 text-red-900 border-2 border-red-200 hover:bg-red-100"
                variant="outline"
              >
                <Thermometer className="w-6 h-6" />
                <span className="text-xs font-semibold">Temperature Logs</span>
              </Button>

              <Button 
                disabled 
                className="h-24 flex flex-col items-center justify-center gap-2 bg-amber-50 text-amber-900 border-2 border-amber-200 hover:bg-amber-100"
                variant="outline"
              >
                <Clock className="w-6 h-6" />
                <span className="text-xs font-semibold">Mid-Service Checks</span>
              </Button>

              <Button 
                disabled 
                className="h-24 flex flex-col items-center justify-center gap-2 bg-orange-50 text-orange-900 border-2 border-orange-200 hover:bg-orange-100"
                variant="outline"
              >
                <UtensilsCrossed className="w-6 h-6" />
                <span className="text-xs font-semibold">Closing Checklist</span>
              </Button>

              <Button 
                disabled 
                className="h-24 flex flex-col items-center justify-center gap-2 bg-purple-50 text-purple-900 border-2 border-purple-200 hover:bg-purple-100"
                variant="outline"
              >
                <LogOut className="w-6 h-6" />
                <span className="text-xs font-semibold">Handover Notes</span>
              </Button>
            </div>
            <p className="text-xs text-slate-500 pt-4 italic">
              Logic and routing will be implemented separately.
            </p>
          </CardContent>
        </Card>

        {/* SECTION D: Alerts */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-6 text-center">
              <p className="text-slate-600 text-sm">
                No alerts at this time. This section is reserved for system notifications and important operational messages.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
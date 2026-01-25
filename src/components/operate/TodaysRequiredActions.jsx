import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, Square, XCircle, ChevronRight, Info } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import PersonalHygieneDeclarationForm from '@/components/hygiene/PersonalHygieneDeclarationForm';

export default function TodaysRequiredActions({ user }) {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [hygieneDialogOpen, setHygieneDialogOpen] = useState(false);

  // Fetch today's hygiene declaration
  const { data: hygieneDeclarations = [] } = useQuery({
    queryKey: ['hygieneDeclarations', user?.email, today],
    queryFn: () => base44.entities.PersonalHygieneDeclaration.filter({
      staff_email: user.email,
      declaration_date: today
    }),
    enabled: !!user?.email
  });

  // Fetch today's temperature logs
  const { data: tempLogs = [] } = useQuery({
    queryKey: ['tempLogs', today],
    queryFn: () => base44.entities.TemperatureLog.filter({
      log_date: today
    }),
    enabled: true
  });

  // Fetch today's cleaning logs
  const { data: cleaningLogs = [] } = useQuery({
    queryKey: ['cleaningLogs', today],
    queryFn: () => base44.entities.DailyCleaningLog.filter({
      date: today
    }),
    enabled: true
  });

  const actions = [];

  // Personal Hygiene Declaration
  const hygieneComplete = hygieneDeclarations.length > 0 && hygieneDeclarations[0]?.all_clear;
  const hygieneFailed = hygieneDeclarations.length > 0 && !hygieneDeclarations[0]?.all_clear;
  
  actions.push({
    id: 'hygiene',
    title: 'Personal Hygiene Declaration',
    status: hygieneComplete ? 'complete' : hygieneFailed ? 'failed' : 'pending',
    dueTime: 'Before shift start',
    action: () => setHygieneDialogOpen(true),
    detailsAction: () => navigate(createPageUrl('CleaningHygieneHub'))
  });

  // Temperature Logs (check if any logs exist today)
  const tempLogsComplete = tempLogs.length >= 3; // Assume 3 required daily
  actions.push({
    id: 'temp',
    title: 'Temperature Logs',
    status: tempLogsComplete ? 'complete' : 'pending',
    dueTime: 'Throughout the day',
    count: tempLogs.length,
    action: () => navigate(createPageUrl('DailyOperationsHub')),
    detailsAction: () => navigate(createPageUrl('Operations'))
  });

  // Daily Cleaning Tasks
  const cleaningComplete = cleaningLogs.length >= 5; // Assume 5 required daily
  actions.push({
    id: 'cleaning',
    title: 'Daily Cleaning Tasks',
    status: cleaningComplete ? 'complete' : 'pending',
    dueTime: 'End of shift',
    count: cleaningLogs.length,
    action: () => navigate(createPageUrl('CleaningHygieneHub')),
    detailsAction: () => navigate(createPageUrl('CleaningHygieneHub'))
  });

  const pendingCount = actions.filter(a => a.status === 'pending').length;
  const failedCount = actions.filter(a => a.status === 'failed').length;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Square className="w-5 h-5 text-slate-400" />;
    }
  };

  if (!user) return null;

  return (
    <Card className="border-2 border-blue-300 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Actions Required Today</CardTitle>
          <Badge className="bg-white text-blue-600 font-semibold text-base px-3 py-1">
            {pendingCount + failedCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {actions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No actions configured yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((action) => (
              <div
                key={action.id}
                className={`p-4 rounded-lg border-2 ${
                  action.status === 'complete'
                    ? 'bg-emerald-50 border-emerald-200'
                    : action.status === 'failed'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getStatusIcon(action.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900">{action.title}</h4>
                      {action.count !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          {action.count} logged
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{action.dueTime}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={action.action}
                        size="sm"
                        className={
                          action.status === 'complete'
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : action.status === 'failed'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }
                      >
                        {action.status === 'complete' ? 'View' : 'Do Now'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                      <Button
                        onClick={action.detailsAction}
                        size="sm"
                        variant="outline"
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Hygiene Declaration Dialog */}
      <Dialog open={hygieneDialogOpen} onOpenChange={setHygieneDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Personal Hygiene Declaration</DialogTitle>
          </DialogHeader>
          <PersonalHygieneDeclarationForm 
            user={user} 
            onComplete={() => setHygieneDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
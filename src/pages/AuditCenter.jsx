import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ClipboardList, Calendar, Users, BarChart3, FileText, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import AuditDashboard from '@/components/audit/AuditDashboard';
import WeeklyReviewFormV2 from '@/components/audit/WeeklyReviewFormV2';
import MonthlyAuditForm from '@/components/audit/MonthlyAuditForm';
import AuditFormsLibrary from '@/components/audit/AuditFormsLibrary';
import AuditReportsView from '@/components/audit/AuditReportsView';
import KPIDashboardWidget from '@/components/audit/KPIDashboardWidget';
import AuditPDFExport from '@/components/audit/AuditPDFExport';
import FoodSafetyChecklistForm from '@/components/food-safety/FoodSafetyChecklistForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AuditCenter() {
  const [user, setUser] = useState(null);
  const [showWeeklyForm, setShowWeeklyForm] = useState(false);
  const [showMonthlyForm, setShowMonthlyForm] = useState(false);
  const [showFSAChecklist, setShowFSAChecklist] = useState(false);
  const queryClient = useQueryClient();

  useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      return userData;
    }
  });

  const { data: auditForms = [] } = useQuery({
    queryKey: ['audit-forms'],
    queryFn: () => base44.entities.Form.filter({ is_audit_form: true }, '-created_date', 100)
  });

  const { data: completedAudits = [] } = useQuery({
    queryKey: ['completed-audits'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 100)
  });

  const { data: pendingIssues = [] } = useQuery({
    queryKey: ['pending-issues'],
    queryFn: () => base44.entities.AuditIssue.filter({ status: 'open' }, '-created_date', 50)
  });

  const { data: weeklyAudits = [], error: weeklyAuditsError } = useQuery({
    queryKey: ['weekly-audits'],
    queryFn: async () => {
      try {
        return await base44.entities.WeeklyAudit.list('-submission_date', 20);
      } catch (e) {
        console.error('WeeklyAudit entity error:', e);
        return [];
      }
    }
  });

  const { data: monthlyAudits = [], error: monthlyAuditsError } = useQuery({
    queryKey: ['monthly-audits'],
    queryFn: async () => {
      try {
        return await base44.entities.MonthlyAudit.list('-submission_date', 20);
      } catch (e) {
        console.error('MonthlyAudit entity error:', e);
        return [];
      }
    }
  });

  if (!user) {
    return <LoadingSpinner />;
  }

  const isOwner = user.role === 'admin';
  const isManager = ['admin', 'manager'].includes(user.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="🧾 Audit Center"
        description="Centralized audit hub with compliance tracking and reporting"
      />

      {/* FSA Checklist Alert & Quick Access */}
      <div className="grid md:grid-cols-2 gap-4">
        {pendingIssues.length > 0 && (
          <Card className="bg-amber-50 border-amber-300">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">{pendingIssues.length} open audit issues</p>
                <p className="text-sm text-amber-700">Requiring action or resolution</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50 border-blue-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900">🧼 FSA Food Safety Checklist</p>
                <p className="text-sm text-blue-700">Monthly compliance audit required</p>
              </div>
              <Button
                onClick={() => setShowFSAChecklist(true)}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                Start
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="weekly">
            <Calendar className="w-4 h-4 mr-2" />
            Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly">
            <Calendar className="w-4 h-4 mr-2" />
            Monthly
          </TabsTrigger>
          <TabsTrigger value="forms">
            <ClipboardList className="w-4 h-4 mr-2" />
            Forms
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="w-4 h-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <div className="space-y-6">
            <AuditDashboard
              user={user}
              completedAudits={completedAudits}
              pendingIssues={pendingIssues}
              onStartWeekly={() => setShowWeeklyForm(true)}
              onStartMonthly={() => setShowMonthlyForm(true)}
            />
            
            {/* KPI Integration Widget */}
            <Card>
              <CardHeader>
                <CardTitle>📊 KPI Dashboard - Weekly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <KPIDashboardWidget weeklyAudits={weeklyAudits} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Weekly Reviews Tab */}
        <TabsContent value="weekly">
          {weeklyAuditsError && (
            <Card className="bg-amber-50 border-amber-300 mb-4">
              <CardContent className="pt-6">
                <AlertCircle className="w-5 h-5 text-amber-600 mb-2" />
                <p className="text-sm text-amber-900 font-semibold">⚠️ WeeklyAudit entity not found</p>
                <p className="text-xs text-amber-700 mt-1">Entity exists but may need refresh. Try reloading the page.</p>
              </CardContent>
            </Card>
          )}
          {isManager ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowWeeklyForm(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Start Weekly Review
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>📋 Recent Weekly Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  {weeklyAudits.length === 0 ? (
                    <p className="text-sm text-slate-600 text-center py-4">No weekly reviews yet - start your first one above</p>
                  ) : (
                    <div className="space-y-2">
                      {weeklyAudits.slice(0, 5).map((audit) => (
                        <div key={audit.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{audit.audit_week}</p>
                            <p className="text-xs text-slate-600">by {audit.submitted_by_name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={
                              audit.audit_score >= 90 ? 'bg-emerald-600' : 
                              audit.audit_score >= 75 ? 'bg-amber-600' : 
                              'bg-red-600'
                            }>
                              {audit.audit_score}%
                            </Badge>
                            <AuditPDFExport audit={audit} type="weekly" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-600 font-medium">Manager access required</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Monthly Audits Tab */}
        <TabsContent value="monthly">
          {monthlyAuditsError && (
            <Card className="bg-amber-50 border-amber-300 mb-4">
              <CardContent className="pt-6">
                <AlertCircle className="w-5 h-5 text-amber-600 mb-2" />
                <p className="text-sm text-amber-900 font-semibold">⚠️ MonthlyAudit entity not found</p>
                <p className="text-xs text-amber-700 mt-1">Entity exists but may need refresh. Try reloading the page.</p>
              </CardContent>
            </Card>
          )}
          {isOwner ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowMonthlyForm(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Start Monthly Audit
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>📊 Monthly Audit Records</CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyAudits.length === 0 ? (
                    <p className="text-sm text-slate-600 text-center py-4">No monthly audits yet - start your first one above</p>
                  ) : (
                    <div className="space-y-3">
                      {monthlyAudits.slice(0, 5).map((audit) => (
                        <div key={audit.id} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{audit.audit_month}</p>
                              <p className="text-xs text-slate-600">by {audit.submitted_by_name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={
                                audit.overall_score >= 90 ? 'bg-emerald-600' : 
                                audit.overall_score >= 75 ? 'bg-amber-600' : 
                                'bg-red-600'
                              }>
                                {audit.overall_score}%
                              </Badge>
                              <AuditPDFExport audit={audit} type="monthly" />
                            </div>
                          </div>
                          {audit.ai_summary && (
                            <p className="text-xs text-slate-600 italic border-l-2 border-emerald-500 pl-2">
                              {audit.ai_summary}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-600 font-medium">Owner/Admin access required</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Audit Forms Library Tab */}
        <TabsContent value="forms">
          <AuditFormsLibrary auditForms={auditForms} user={user} />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <AuditReportsView completedAudits={completedAudits} user={user} />
        </TabsContent>
      </Tabs>

      {/* Weekly Review Modal */}
      <Dialog open={showWeeklyForm} onOpenChange={setShowWeeklyForm}>
        <DialogContent className="max-w-xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📊 Weekly Audit & KPI Review</DialogTitle>
          </DialogHeader>
          <WeeklyReviewFormV2
            user={user}
            onClose={() => setShowWeeklyForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Monthly Audit Modal */}
      <Dialog open={showMonthlyForm} onOpenChange={setShowMonthlyForm}>
        <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📅 Monthly Compliance Audit</DialogTitle>
          </DialogHeader>
          <MonthlyAuditForm
            user={user}
            onClose={() => setShowMonthlyForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* FSA Checklist Modal */}
      <Dialog open={showFSAChecklist} onOpenChange={setShowFSAChecklist}>
        <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>FSA Food Safety Checklist</DialogTitle>
          </DialogHeader>
          <FoodSafetyChecklistForm
            user={user}
            onClose={() => setShowFSAChecklist(false)}
            onSubmitted={() => {
              queryClient.invalidateQueries(['completed-audits']);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
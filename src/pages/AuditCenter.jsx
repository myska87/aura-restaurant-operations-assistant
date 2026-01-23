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
import AuditDashboard from '@/components/audit/AuditDashboard';
import WeeklyReviewForm from '@/components/audit/WeeklyReviewForm';
import MonthlyAuditForm from '@/components/audit/MonthlyAuditForm';
import AuditFormsLibrary from '@/components/audit/AuditFormsLibrary';
import AuditReportsView from '@/components/audit/AuditReportsView';

export default function AuditCenter() {
  const [user, setUser] = useState(null);
  const [showWeeklyForm, setShowWeeklyForm] = useState(false);
  const [showMonthlyForm, setShowMonthlyForm] = useState(false);

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

      {/* Quick Alert */}
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
          <AuditDashboard
            user={user}
            completedAudits={completedAudits}
            pendingIssues={pendingIssues}
            onStartWeekly={() => setShowWeeklyForm(true)}
            onStartMonthly={() => setShowMonthlyForm(true)}
          />
        </TabsContent>

        {/* Weekly Reviews Tab */}
        <TabsContent value="weekly">
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
              {showWeeklyForm && (
                <WeeklyReviewForm
                  user={user}
                  auditForms={auditForms}
                  onClose={() => setShowWeeklyForm(false)}
                />
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Weekly Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">Reviews from the last 4 weeks will appear here</p>
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
              {showMonthlyForm && (
                <MonthlyAuditForm
                  user={user}
                  onClose={() => setShowMonthlyForm(false)}
                />
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Audit Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">Monthly audits for this year will appear here</p>
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
    </div>
  );
}
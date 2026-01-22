import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  Lock,
  TrendingUp,
  AlertTriangle,
  Users,
  Calendar,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { motion } from 'framer-motion';

export default function WeeklyManagerReports() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['weeklyManagerReports'],
    queryFn: () => base44.entities.WeeklyManagerReport.list('-week_start_date', 50),
    enabled: !!user
  });

  const canCreateReport = ['manager', 'owner', 'admin'].includes(user?.role);
  const isAdmin = ['owner', 'admin'].includes(user?.role);

  if (isLoading) return <LoadingSpinner message="Loading reports..." />;

  if (!canCreateReport) {
    return (
      <div className="py-12 text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold mb-2">Manager Access Only</h2>
        <p className="text-slate-600">Weekly reports are for managers only.</p>
      </div>
    );
  }

  const statusColors = {
    draft: 'bg-slate-100 text-slate-700',
    submitted: 'bg-blue-100 text-blue-700',
    locked: 'bg-emerald-100 text-emerald-700'
  };

  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const currentWeekReport = reports.find(r => r.week_start_date === currentWeekStart);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Manager Reports"
        description="Leadership visibility and accountability reports"
      />

      <div className="flex gap-2">
        <Link to={createPageUrl('WeeklyManagerReportForm')}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New Report
          </Button>
        </Link>
      </div>

      {currentWeekReport && currentWeekReport.status === 'draft' && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900">Current Week Report Pending</p>
                <p className="text-sm text-amber-700">You have a draft report for this week. Please complete and submit it.</p>
              </div>
              <Link to={createPageUrl(`WeeklyManagerReportForm?id=${currentWeekReport.id}`)}>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                  Complete Report
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reports.length}</p>
                <p className="text-xs text-slate-500">Total Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reports.filter(r => r.status === 'draft').length}</p>
                <p className="text-xs text-slate-500">Draft Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reports.filter(r => r.status === 'submitted' || r.status === 'locked').length}</p>
                <p className="text-xs text-slate-500">Submitted Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reports History</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600 mb-4">No reports yet</p>
              <Link to={createPageUrl('WeeklyManagerReportForm')}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Report
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report, idx) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <p className="font-semibold">
                              Week of {format(new Date(report.week_start_date), 'MMM d')} - {format(new Date(report.week_end_date), 'MMM d, yyyy')}
                            </p>
                            <Badge className={statusColors[report.status]}>
                              {report.status === 'locked' && <Lock className="w-3 h-3 mr-1" />}
                              {report.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">
                            By {report.manager_name}
                            {report.submitted_date && ` • Submitted ${format(new Date(report.submitted_date), 'PPp')}`}
                          </p>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {report.approved_labor_hours && (
                              <div>
                                <p className="text-slate-500">Approved Hours</p>
                                <p className="font-semibold">{report.approved_labor_hours.toFixed(1)}h</p>
                              </div>
                            )}
                            {report.approved_labor_cost && (
                              <div>
                                <p className="text-slate-500">Labor Cost</p>
                                <p className="font-semibold text-emerald-600">£{report.approved_labor_cost.toFixed(2)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <Link to={createPageUrl(`WeeklyManagerReportDetail?id=${report.id}`)}>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import {
  FileText,
  Lock,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Users,
  AlertCircle,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';

export default function WeeklyManagerReportDetail() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get('id');

  const { data: report, isLoading } = useQuery({
    queryKey: ['weeklyReport', reportId],
    queryFn: () => base44.entities.WeeklyManagerReport.filter({ id: reportId }),
    enabled: !!reportId && !!user,
    select: (data) => data[0]
  });

  if (isLoading) return <LoadingSpinner message="Loading report..." />;

  if (!report) {
    return (
      <div className="py-12 text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold mb-2">Report Not Found</h2>
        <Button onClick={() => navigate(createPageUrl('WeeklyManagerReports'))}>
          Back to Reports
        </Button>
      </div>
    );
  }

  const isAdmin = ['owner', 'admin'].includes(user?.role);
  const canEdit = !report.is_locked || isAdmin;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Weekly Manager Report"
        description={`Week of ${format(new Date(report.week_start_date), 'MMM d')} - ${format(new Date(report.week_end_date), 'MMM d, yyyy')}`}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className={report.status === 'locked' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}>
            {report.is_locked && <Lock className="w-3 h-3 mr-1" />}
            {report.status.toUpperCase()}
          </Badge>
          <p className="text-sm text-slate-600">
            By {report.manager_name}
            {report.submitted_date && ` • Submitted ${format(new Date(report.submitted_date), 'PPp')}`}
          </p>
        </div>
        {canEdit && (
          <Link to={createPageUrl(`WeeklyManagerReportForm?id=${report.id}`)}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit Report
            </Button>
          </Link>
        )}
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{report.approved_labor_hours?.toFixed(1) || 0}</p>
                <p className="text-xs text-slate-500">Approved Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold text-emerald-600">£{report.approved_labor_cost?.toFixed(0) || 0}</p>
                <p className="text-xs text-slate-500">Labor Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-slate-600" />
              <div>
                <p className="text-2xl font-bold">{report.scheduled_labor_hours?.toFixed(1) || 0}</p>
                <p className="text-xs text-slate-500">Scheduled Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={report.variance_hours && report.variance_hours !== 0 ? 'border-amber-300 bg-amber-50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              {report.variance_hours > 0 ? (
                <TrendingUp className="w-8 h-8 text-amber-600" />
              ) : report.variance_hours < 0 ? (
                <TrendingDown className="w-8 h-8 text-blue-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-slate-400" />
              )}
              <div>
                <p className="text-2xl font-bold">
                  {report.variance_hours > 0 ? '+' : ''}{report.variance_hours?.toFixed(1) || 0}
                </p>
                <p className="text-xs text-slate-500">Variance (hrs)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.top_performers && report.top_performers.length > 0 && (
            <div>
              <p className="font-semibold text-emerald-700 mb-2">Top Performers</p>
              <div className="space-y-2">
                {report.top_performers.map((p, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-emerald-50 rounded-lg">
                    <Users className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-emerald-900">{p.staff_name}</p>
                      <p className="text-sm text-emerald-700">{p.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.underperformers && report.underperformers.length > 0 && (
            <div>
              <p className="font-semibold text-red-700 mb-2">Underperformers</p>
              <div className="space-y-2">
                {report.underperformers.map((p, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900">{p.staff_name}</p>
                      <p className="text-sm text-red-700">{p.issue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.attendance_issues && report.attendance_issues.length > 0 && (
            <div>
              <p className="font-semibold text-amber-700 mb-2">Attendance Issues</p>
              <div className="space-y-2">
                {report.attendance_issues.map((a, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                    <Clock className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900">{a.staff_name}</p>
                      <p className="text-sm text-amber-700">{a.issue} • {format(new Date(a.date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manager Commentary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-semibold text-emerald-700 mb-2">What Went Well</p>
            <div className="p-4 bg-emerald-50 rounded-lg">
              <p className="text-slate-700 whitespace-pre-wrap">{report.what_went_well}</p>
            </div>
          </div>

          <div>
            <p className="font-semibold text-red-700 mb-2">What Went Wrong</p>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-slate-700 whitespace-pre-wrap">{report.what_went_wrong}</p>
            </div>
          </div>

          {report.actions_taken && (
            <div>
              <p className="font-semibold text-blue-700 mb-2">Actions Taken</p>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-slate-700 whitespace-pre-wrap">{report.actions_taken}</p>
              </div>
            </div>
          )}

          {report.actions_needed && (
            <div>
              <p className="font-semibold text-purple-700 mb-2">Actions Needed</p>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-slate-700 whitespace-pre-wrap">{report.actions_needed}</p>
              </div>
            </div>
          )}

          {report.variance_notes && (
            <div>
              <p className="font-semibold text-amber-700 mb-2">Variance Explanation</p>
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-slate-700 whitespace-pre-wrap">{report.variance_notes}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
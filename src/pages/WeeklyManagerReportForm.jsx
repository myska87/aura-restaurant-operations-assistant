import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import {
  Save,
  Send,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function WeeklyManagerReportForm() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    week_start_date: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    week_end_date: format(endOfWeek(startOfWeek(new Date(), { weekStartsOn: 1 }), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    top_performers: [],
    underperformers: [],
    attendance_issues: [],
    what_went_well: '',
    what_went_wrong: '',
    actions_taken: '',
    actions_needed: '',
    variance_notes: ''
  });
  const [topPerformerInput, setTopPerformerInput] = useState({ staff_name: '', reason: '' });
  const [underperformerInput, setUnderperformerInput] = useState({ staff_name: '', issue: '' });
  const [attendanceInput, setAttendanceInput] = useState({ staff_name: '', issue: '', date: format(new Date(), 'yyyy-MM-dd') });

  const navigate = useNavigate();
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

  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get('id');

  const { data: existingReport, isLoading: loadingReport } = useQuery({
    queryKey: ['weeklyReport', reportId],
    queryFn: () => base44.entities.WeeklyManagerReport.filter({ id: reportId }),
    enabled: !!reportId && !!user,
    select: (data) => data[0]
  });

  const { data: weekShifts = [] } = useQuery({
    queryKey: ['weekShifts', formData.week_start_date],
    queryFn: () => base44.entities.Shift.filter({
      date: {
        $gte: formData.week_start_date,
        $lte: formData.week_end_date
      }
    }),
    enabled: !!user
  });

  useEffect(() => {
    if (existingReport) {
      setFormData(existingReport);
    }
  }, [existingReport]);

  const approvedShifts = weekShifts.filter(s => s.status === 'approved');
  const scheduledHours = weekShifts.reduce((sum, s) => sum + (s.duration || 0), 0);
  const approvedHours = approvedShifts.reduce((sum, s) => sum + (s.duration || 0), 0);
  const approvedCost = approvedShifts.reduce((sum, s) => sum + (s.total_cost || 0), 0);
  const variance = approvedHours - scheduledHours;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WeeklyManagerReport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['weeklyManagerReports']);
      navigate(createPageUrl('WeeklyManagerReports'));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WeeklyManagerReport.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['weeklyManagerReports']);
      navigate(createPageUrl('WeeklyManagerReports'));
    }
  });

  const handleSaveDraft = () => {
    const data = {
      ...formData,
      manager_id: user?.email,
      manager_name: user?.full_name,
      approved_labor_hours: approvedHours,
      approved_labor_cost: approvedCost,
      scheduled_labor_hours: scheduledHours,
      variance_hours: variance,
      status: 'draft'
    };

    if (reportId) {
      updateMutation.mutate({ id: reportId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleSubmit = () => {
    if (!formData.what_went_well || !formData.what_went_wrong) {
      alert('Manager commentary is MANDATORY. Please fill in both "What Went Well" and "What Went Wrong".');
      return;
    }

    const data = {
      ...formData,
      manager_id: user?.email,
      manager_name: user?.full_name,
      approved_labor_hours: approvedHours,
      approved_labor_cost: approvedCost,
      scheduled_labor_hours: scheduledHours,
      variance_hours: variance,
      status: 'submitted',
      submitted_date: new Date().toISOString(),
      is_locked: true
    };

    if (reportId) {
      updateMutation.mutate({ id: reportId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const addTopPerformer = () => {
    if (topPerformerInput.staff_name && topPerformerInput.reason) {
      setFormData({
        ...formData,
        top_performers: [...formData.top_performers, topPerformerInput]
      });
      setTopPerformerInput({ staff_name: '', reason: '' });
    }
  };

  const addUnderperformer = () => {
    if (underperformerInput.staff_name && underperformerInput.issue) {
      setFormData({
        ...formData,
        underperformers: [...formData.underperformers, underperformerInput]
      });
      setUnderperformerInput({ staff_name: '', issue: '' });
    }
  };

  const addAttendanceIssue = () => {
    if (attendanceInput.staff_name && attendanceInput.issue) {
      setFormData({
        ...formData,
        attendance_issues: [...formData.attendance_issues, attendanceInput]
      });
      setAttendanceInput({ staff_name: '', issue: '', date: format(new Date(), 'yyyy-MM-dd') });
    }
  };

  if (loadingReport) return <LoadingSpinner message="Loading report..." />;

  if (!user || !['manager', 'owner', 'admin'].includes(user?.role)) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold mb-2">Manager Access Only</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title={reportId ? 'Edit Weekly Report' : 'Create Weekly Report'}
        description={`Week of ${format(new Date(formData.week_start_date), 'MMM d')} - ${format(new Date(formData.week_end_date), 'MMM d, yyyy')}`}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{approvedHours.toFixed(1)}</p>
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
                <p className="text-2xl font-bold text-emerald-600">£{approvedCost.toFixed(0)}</p>
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
                <p className="text-2xl font-bold">{scheduledHours.toFixed(1)}</p>
                <p className="text-xs text-slate-500">Scheduled Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={variance !== 0 ? 'border-amber-300 bg-amber-50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              {variance > 0 ? (
                <TrendingUp className="w-8 h-8 text-amber-600" />
              ) : variance < 0 ? (
                <TrendingDown className="w-8 h-8 text-blue-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-slate-400" />
              )}
              <div>
                <p className="text-2xl font-bold">{variance > 0 ? '+' : ''}{variance.toFixed(1)}</p>
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
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-3 block">Top Performers</Label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Input
                placeholder="Staff name"
                value={topPerformerInput.staff_name}
                onChange={(e) => setTopPerformerInput({ ...topPerformerInput, staff_name: e.target.value })}
              />
              <Input
                placeholder="Reason"
                value={topPerformerInput.reason}
                onChange={(e) => setTopPerformerInput({ ...topPerformerInput, reason: e.target.value })}
              />
            </div>
            <Button size="sm" variant="outline" onClick={addTopPerformer}>
              Add Top Performer
            </Button>
            <div className="mt-3 space-y-2">
              {formData.top_performers.map((p, idx) => (
                <Badge key={idx} className="bg-emerald-100 text-emerald-800 mr-2 mb-2">
                  {p.staff_name}: {p.reason}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Underperformers</Label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Input
                placeholder="Staff name"
                value={underperformerInput.staff_name}
                onChange={(e) => setUnderperformerInput({ ...underperformerInput, staff_name: e.target.value })}
              />
              <Input
                placeholder="Issue"
                value={underperformerInput.issue}
                onChange={(e) => setUnderperformerInput({ ...underperformerInput, issue: e.target.value })}
              />
            </div>
            <Button size="sm" variant="outline" onClick={addUnderperformer}>
              Add Underperformer
            </Button>
            <div className="mt-3 space-y-2">
              {formData.underperformers.map((p, idx) => (
                <Badge key={idx} className="bg-red-100 text-red-800 mr-2 mb-2">
                  {p.staff_name}: {p.issue}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Attendance Issues</Label>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <Input
                placeholder="Staff name"
                value={attendanceInput.staff_name}
                onChange={(e) => setAttendanceInput({ ...attendanceInput, staff_name: e.target.value })}
              />
              <Input
                placeholder="Issue (late, no-show, etc.)"
                value={attendanceInput.issue}
                onChange={(e) => setAttendanceInput({ ...attendanceInput, issue: e.target.value })}
              />
              <Input
                type="date"
                value={attendanceInput.date}
                onChange={(e) => setAttendanceInput({ ...attendanceInput, date: e.target.value })}
              />
            </div>
            <Button size="sm" variant="outline" onClick={addAttendanceIssue}>
              Add Attendance Issue
            </Button>
            <div className="mt-3 space-y-2">
              {formData.attendance_issues.map((a, idx) => (
                <Badge key={idx} className="bg-amber-100 text-amber-800 mr-2 mb-2">
                  {a.staff_name}: {a.issue} ({format(new Date(a.date), 'MMM d')})
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Manager Commentary (MANDATORY)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>What Went Well *</Label>
            <Textarea
              value={formData.what_went_well}
              onChange={(e) => setFormData({ ...formData, what_went_well: e.target.value })}
              rows={4}
              placeholder="Describe the positive highlights from this week..."
              className="mt-2"
            />
          </div>

          <div>
            <Label>What Went Wrong *</Label>
            <Textarea
              value={formData.what_went_wrong}
              onChange={(e) => setFormData({ ...formData, what_went_wrong: e.target.value })}
              rows={4}
              placeholder="Describe challenges and issues from this week..."
              className="mt-2"
            />
          </div>

          <div>
            <Label>Actions Taken</Label>
            <Textarea
              value={formData.actions_taken}
              onChange={(e) => setFormData({ ...formData, actions_taken: e.target.value })}
              rows={3}
              placeholder="What actions were taken this week..."
              className="mt-2"
            />
          </div>

          <div>
            <Label>Actions Needed</Label>
            <Textarea
              value={formData.actions_needed}
              onChange={(e) => setFormData({ ...formData, actions_needed: e.target.value })}
              rows={3}
              placeholder="What needs to be done going forward..."
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {Math.abs(variance) > 5 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Variance Explanation Required</CardTitle>
          </CardHeader>
          <CardContent>
            <Label>Explain the variance between scheduled and approved hours</Label>
            <Textarea
              value={formData.variance_notes}
              onChange={(e) => setFormData({ ...formData, variance_notes: e.target.value })}
              rows={3}
              placeholder="Significant variance detected. Please explain..."
              className="mt-2"
            />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(createPageUrl('WeeklyManagerReports'))}>
          Cancel
        </Button>
        <Button variant="outline" onClick={handleSaveDraft} disabled={createMutation.isPending || updateMutation.isPending}>
          <Save className="w-4 h-4 mr-2" />
          Save Draft
        </Button>
        <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
          <Send className="w-4 h-4 mr-2" />
          Submit & Lock Report
        </Button>
      </div>
    </div>
  );
}
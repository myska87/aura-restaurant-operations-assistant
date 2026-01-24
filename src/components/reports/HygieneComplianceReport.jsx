import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Download, Calendar, User, Clock, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function HygieneComplianceReport() {
  const [dateFrom, setDateFrom] = useState(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: hygieneRecords = [], isLoading } = useQuery({
    queryKey: ['hygieneReports', dateFrom, dateTo],
    queryFn: async () => {
      return await base44.entities.ChecklistCompletion.filter({
        checklist_category: 'hygiene',
        date: { $gte: dateFrom, $lte: dateTo }
      }, '-date', 100);
    }
  });

  const { data: globalInfo } = useQuery({
    queryKey: ['globalInfo'],
    queryFn: async () => {
      const infos = await base44.entities.GlobalInfo.list();
      return infos[0] || null;
    }
  });

  const handleExportCSV = () => {
    const headers = ['Date', 'Completed By', 'Time', 'Summary', 'Status', 'Manager on Duty', 'Notes'];
    const rows = hygieneRecords.map(record => [
      record.date,
      record.user_name,
      format(new Date(record.completed_at || record.created_date), 'HH:mm'),
      record.answers?.slice(0, 3).map(a => a.question_text).join(', ') || 'N/A',
      `${record.completion_percentage || 0}%`,
      globalInfo?.manager_name || 'N/A',
      record.notes || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hygiene-compliance-${dateFrom}-to-${dateTo}.csv`;
    link.click();
  };

  const totalRecords = hygieneRecords.length;
  const completeRecords = hygieneRecords.filter(r => r.completion_percentage >= 100).length;
  const avgCompletion = totalRecords > 0 
    ? Math.round(hygieneRecords.reduce((sum, r) => sum + (r.completion_percentage || 0), 0) / totalRecords) 
    : 0;

  if (isLoading) return <LoadingSpinner message="Loading hygiene reports..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Hygiene Compliance Reports</h2>
            <p className="text-slate-600">Daily hygiene check records and compliance tracking</p>
          </div>
        </div>
        <Button onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-700">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 mb-2 block">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border-slate-300"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 mb-2 block">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border-slate-300"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Reports</p>
                <p className="text-2xl font-bold text-slate-900">{totalRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Fully Completed</p>
                <p className="text-2xl font-bold text-slate-900">{completeRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Avg Completion</p>
                <p className="text-2xl font-bold text-slate-900">{avgCompletion}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Hygiene Daily Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {hygieneRecords.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No hygiene records found for selected date range</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left p-3 text-sm font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Date
                      </div>
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Completed By
                      </div>
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Time
                      </div>
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-slate-700">Summary</th>
                    <th className="text-left p-3 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left p-3 text-sm font-semibold text-slate-700">Manager</th>
                    <th className="text-left p-3 text-sm font-semibold text-slate-700">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {hygieneRecords.map((record) => {
                    const isComplete = record.completion_percentage >= 100;
                    const summary = record.answers
                      ?.filter(a => a.answer === 'yes')
                      .slice(0, 3)
                      .map(a => a.question_text)
                      .join(', ') || 'No details';

                    return (
                      <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3 text-sm text-slate-900 font-medium">
                          {format(new Date(record.date), 'dd MMM yyyy')}
                        </td>
                        <td className="p-3 text-sm text-slate-700">{record.user_name}</td>
                        <td className="p-3 text-sm text-slate-600">
                          {format(new Date(record.completed_at || record.created_date), 'HH:mm')}
                        </td>
                        <td className="p-3 text-sm text-slate-600 max-w-xs truncate" title={summary}>
                          {summary}
                        </td>
                        <td className="p-3">
                          <Badge
                            className={isComplete ? 'bg-green-500' : 'bg-amber-500'}
                          >
                            {isComplete ? '✅ 100%' : `⚠️ ${record.completion_percentage || 0}%`}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-slate-700">
                          {globalInfo?.manager_name || 'N/A'}
                        </td>
                        <td className="p-3 text-sm text-slate-600 max-w-xs truncate">
                          {record.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Summary */}
      {hygieneRecords.length > 0 && (
        <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-lg font-bold text-slate-900">
                  Restaurant {avgCompletion >= 100 ? '✅ 100% Hygiene Compliant' : `${avgCompletion}% Compliant`}
                </p>
                <p className="text-sm text-slate-600">
                  Period: {format(new Date(dateFrom), 'dd MMM yyyy')} - {format(new Date(dateTo), 'dd MMM yyyy')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
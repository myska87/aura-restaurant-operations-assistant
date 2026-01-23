import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, Eye } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AuditReportsView({ completedAudits = [], user }) {
  const [selectedReport, setSelectedReport] = useState(null);

  // Group audits by month
  const auditsByMonth = {};
  completedAudits.forEach(audit => {
    const month = format(new Date(audit.created_date), 'yyyy-MM');
    if (!auditsByMonth[month]) auditsByMonth[month] = [];
    auditsByMonth[month].push(audit);
  });

  // Trend data
  const trendData = Object.entries(auditsByMonth)
    .sort()
    .map(([month, audits]) => ({
      month: format(new Date(month + '-01'), 'MMM'),
      average: Math.round(audits.reduce((sum, a) => sum + (a.score || 0), 0) / audits.length),
      count: audits.length
    }));

  return (
    <div className="space-y-4">
      {/* Trend Chart */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📈 Audit Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="average" stroke="#10b981" strokeWidth={2} name="Avg Score" />
                <Line yAxisId="right" type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Audits Count" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>All Audit Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {completedAudits.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-8">No audit reports yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {completedAudits.map(audit => (
                <div key={audit.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <p className="font-semibold">
                        {audit.audit_type === 'monthly_audit' ? '📅 Monthly Audit' : '📋 Weekly Review'}
                      </p>
                      <Badge className={
                        audit.score >= 90 ? 'bg-emerald-100 text-emerald-700' :
                        audit.score >= 75 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }>
                        {audit.score}%
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      {format(new Date(audit.created_date), 'MMMM d, yyyy')} by {audit.audited_by_name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedReport(audit)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Detail Modal */}
      {selectedReport && (
        <Card className="border-2 border-emerald-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedReport.audit_type === 'monthly_audit' ? 'Monthly Audit Report' : 'Weekly Review'}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setSelectedReport(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded">
                <p className="text-xs text-slate-600">Audit Date</p>
                <p className="font-semibold">{format(new Date(selectedReport.created_date), 'MMM d, yyyy')}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded">
                <p className="text-xs text-slate-600">Auditor</p>
                <p className="font-semibold">{selectedReport.audited_by_name}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded">
                <p className="text-xs text-slate-600">Score</p>
                <p className="font-semibold text-lg text-emerald-700">{selectedReport.score}%</p>
              </div>
            </div>
            {selectedReport.sections && (
              <div className="space-y-2">
                <p className="font-semibold">Sections</p>
                {Object.entries(selectedReport.sections).map(([key, section]) => (
                  <div key={key} className="p-2 bg-slate-50 rounded text-sm">
                    <p className="font-medium capitalize">{key.replace('_', ' ')}: <Badge className="ml-2">{section.rating}</Badge></p>
                    {section.notes && <p className="text-slate-600 mt-1">{section.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KPIDashboardWidget({ weeklyAudits = [] }) {
  if (!weeklyAudits || weeklyAudits.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-slate-600">
          <p>No audit data available yet</p>
        </CardContent>
      </Card>
    );
  }

  // Sort by submission date
  const sorted = [...weeklyAudits].sort((a, b) => new Date(b.submission_date) - new Date(a.submission_date)).slice(0, 8);

  // Prepare chart data
  const chartData = sorted.reverse().map(audit => ({
    week: audit.audit_week?.slice(-2) || 'N/A',
    sales: audit.sales_summary?.total_sales || 0,
    hygiene: audit.operational_compliance?.hygiene_checklist_percent || 0,
    incidents: audit.staff_performance?.incidents_logged || 0,
    score: audit.audit_score || 0
  }));

  // Latest metrics
  const latest = sorted[sorted.length - 1];
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;

  const getTrend = (current, prev, inverse = false) => {
    if (!prev) return { icon: Minus, color: 'text-slate-400', text: 'N/A' };
    const diff = current - prev;
    const isPositive = inverse ? diff < 0 : diff > 0;
    return {
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? 'text-emerald-600' : 'text-red-600',
      text: `${Math.abs(diff).toFixed(1)}%`,
      isPositive
    };
  };

  const hygieneTrend = getTrend(
    latest.operational_compliance?.hygiene_checklist_percent,
    previous?.operational_compliance?.hygiene_checklist_percent
  );
  const salesTrend = getTrend(
    latest.sales_summary?.total_sales,
    previous?.sales_summary?.total_sales
  );
  const incidentsTrend = getTrend(
    latest.staff_performance?.incidents_logged,
    previous?.staff_performance?.incidents_logged,
    true
  );

  const HygineTrendIcon = hygieneTrend.icon;
  const SalesTrendIcon = salesTrend.icon;
  const IncidentsTrendIcon = incidentsTrend.icon;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid md:grid-cols-3 gap-3">
        <Card className="border-emerald-200">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wide">Hygiene Score</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {latest.operational_compliance?.hygiene_checklist_percent || 0}%
                </p>
              </div>
              <HygineTrendIcon className={`w-5 h-5 ${hygieneTrend.color}`} />
            </div>
            <Badge className="mt-2 bg-emerald-100 text-emerald-800 text-xs">
              {hygieneTrend.text} {hygieneTrend.isPositive ? '↑' : '↓'}
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wide">Weekly Sales</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  £{(latest.sales_summary?.total_sales || 0).toLocaleString()}
                </p>
              </div>
              <SalesTrendIcon className={`w-5 h-5 ${salesTrend.color}`} />
            </div>
            <Badge className="mt-2 bg-blue-100 text-blue-800 text-xs">
              {salesTrend.text} {salesTrend.isPositive ? '↑' : '↓'}
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wide">Incidents</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {latest.staff_performance?.incidents_logged || 0}
                </p>
              </div>
              <IncidentsTrendIcon className={`w-5 h-5 ${incidentsTrend.color}`} />
            </div>
            <Badge className="mt-2 bg-red-100 text-red-800 text-xs">
              {incidentsTrend.text} {incidentsTrend.isPositive ? '↑' : '↓'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Sales vs Hygiene */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">📊 Sales vs Hygiene</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" fontSize={12} />
                <YAxis yAxisId="left" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} name="Sales (£100s)" />
                <Line yAxisId="right" type="monotone" dataKey="hygiene" stroke="#10b981" strokeWidth={2} name="Hygiene %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Compliance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">📈 Overall Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="score" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">📋 Weekly Metrics Summary</CardTitle>
        </CardHeader>
        <CardContent className="max-h-64 overflow-y-auto">
          <div className="space-y-2 text-sm">
            {sorted.reverse().map((audit, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="font-medium">{audit.audit_week}</span>
                <div className="flex gap-3 text-xs">
                  <Badge variant="outline">💰 £{audit.sales_summary?.total_sales || 0}</Badge>
                  <Badge variant="outline">🧼 {audit.operational_compliance?.hygiene_checklist_percent || 0}%</Badge>
                  <Badge 
                    className={
                      audit.audit_score >= 90 ? 'bg-emerald-100 text-emerald-800' :
                      audit.audit_score >= 75 ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }
                  >
                    {audit.audit_score || 0}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
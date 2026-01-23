import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench, AlertTriangle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

export default function EquipmentHealthCard({ equipment = [], activeFaults = [], allFaults = [] }) {
  // Calculate health score
  const totalEquipment = equipment.length;
  const faultyCount = equipment.filter(e => 
    activeFaults.some(f => f.equipment_name === e.asset_name && f.severity === 'critical')
  ).length;
  const healthScore = totalEquipment > 0 ? Math.round(((totalEquipment - faultyCount) / totalEquipment) * 100) : 100;

  // Get next audit needed
  const nextAuditNeeded = equipment.find(e => !e.last_audit_date);

  // Fault trend (last 30 days)
  const faultTrend = {};
  allFaults.filter(f => {
    const faultDate = new Date(f.fault_date);
    return (new Date() - faultDate) < 30 * 24 * 60 * 60 * 1000;
  }).forEach(f => {
    const date = format(new Date(f.fault_date), 'MMM d');
    faultTrend[date] = (faultTrend[date] || 0) + 1;
  });

  const chartData = Object.entries(faultTrend)
    .slice(-7)
    .map(([date, count]) => ({ date, faults: count }));

  const severityCount = {
    critical: activeFaults.filter(f => f.severity === 'critical').length,
    medium: activeFaults.filter(f => f.severity === 'medium').length,
    low: activeFaults.filter(f => f.severity === 'low').length
  };

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Equipment Health
          </CardTitle>
          <Link to={createPageUrl('EquipmentHealth')}>
            <Button size="sm" variant="outline">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Score */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-700 font-medium">Equipment Health Score</p>
              <p className="text-3xl font-bold text-emerald-900">{healthScore}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-emerald-700 font-medium">{activeFaults.length} Active Faults</p>
              <p className="text-lg font-bold text-emerald-900">{severityCount.critical} Critical</p>
            </div>
          </div>
        </div>

        {/* Fault Breakdown */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-red-50 rounded border border-red-200">
            <p className="text-xs text-red-700">Critical</p>
            <p className="text-xl font-bold text-red-600">{severityCount.critical}</p>
          </div>
          <div className="p-2 bg-amber-50 rounded border border-amber-200">
            <p className="text-xs text-amber-700">Medium</p>
            <p className="text-xl font-bold text-amber-600">{severityCount.medium}</p>
          </div>
          <div className="p-2 bg-blue-50 rounded border border-blue-200">
            <p className="text-xs text-blue-700">Low</p>
            <p className="text-xl font-bold text-blue-600">{severityCount.low}</p>
          </div>
        </div>

        {/* Trend Chart */}
        {chartData.length > 0 && (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="faults" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Status Summary */}
        <div className="space-y-2 pt-2 border-t">
          {nextAuditNeeded && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">⚠️ {nextAuditNeeded.asset_name} needs audit</span>
              <Badge className="bg-amber-600 text-xs">Overdue</Badge>
            </div>
          )}
          {severityCount.critical > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">🔴 {severityCount.critical} critical issue(s)</span>
              <Link to={createPageUrl('EquipmentHealth')}>
                <Button size="sm" variant="outline" className="text-xs">Resolve</Button>
              </Link>
            </div>
          )}
          {healthScore >= 90 && (
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <span>✓ Equipment in excellent condition</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
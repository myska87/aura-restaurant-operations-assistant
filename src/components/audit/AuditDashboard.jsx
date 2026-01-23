import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CheckCircle, AlertTriangle, TrendingUp, Download, Zap } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';

export default function AuditDashboard({ user, completedAudits = [], pendingIssues = [], onStartWeekly, onStartMonthly }) {
  const { data: checkIns = [] } = useQuery({
    queryKey: ['dashboard-checkins'],
    queryFn: () => base44.entities.DailyCheckIn.list('-created_date', 200)
  });

  const { data: temperatures = [] } = useQuery({
    queryKey: ['dashboard-temps'],
    queryFn: () => base44.entities.TemperatureLog.list('-created_date', 200)
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['dashboard-equipment'],
    queryFn: () => base44.entities.Assets_Registry_v1.list('-created_date', 100)
  });

  // Calculate compliance scores
  const checkInCompletion = checkIns.length > 0 
    ? Math.round((checkIns.filter(c => c.status === 'completed').length / checkIns.length) * 100)
    : 0;

  const tempCompliance = temperatures.length > 0
    ? Math.round((temperatures.filter(t => t.is_in_range).length / temperatures.length) * 100)
    : 0;

  const equipmentHealth = equipment.length > 0
    ? Math.round(((equipment.length - equipment.filter(e => e.status === 'fault').length) / equipment.length) * 100)
    : 0;

  const overallCompliance = Math.round((checkInCompletion + tempCompliance + equipmentHealth) / 3);

  // Compliance trend (last 7 days)
  const complianceTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, 'MMM d');
    const dayCheckIns = checkIns.filter(c => c.created_date?.split('T')[0] === format(date, 'yyyy-MM-dd'));
    const dayTemps = temperatures.filter(t => t.created_date?.split('T')[0] === format(date, 'yyyy-MM-dd'));
    
    const checkInRate = dayCheckIns.length > 0 ? Math.round((dayCheckIns.filter(c => c.status === 'completed').length / dayCheckIns.length) * 100) : 0;
    const tempRate = dayTemps.length > 0 ? Math.round((dayTemps.filter(t => t.is_in_range).length / dayTemps.length) * 100) : 0;
    
    complianceTrend.push({
      date: dateStr,
      compliance: Math.round((checkInRate + tempRate) / 2) || 0
    });
  }

  // Issues by severity
  const issuesBySeverity = {
    critical: pendingIssues.filter(i => i.severity === 'critical').length,
    medium: pendingIssues.filter(i => i.severity === 'medium').length,
    low: pendingIssues.filter(i => i.severity === 'low').length
  };

  const severityData = [
    { name: 'Critical', value: issuesBySeverity.critical, fill: '#ef4444' },
    { name: 'Medium', value: issuesBySeverity.medium, fill: '#f59e0b' },
    { name: 'Low', value: issuesBySeverity.low, fill: '#3b82f6' }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">Overall Compliance</p>
                <p className="text-4xl font-bold text-emerald-600">{overallCompliance}%</p>
                <Badge className="mt-3 bg-emerald-100 text-emerald-700">
                  {overallCompliance >= 90 ? '✓ Excellent' : overallCompliance >= 75 ? '⚠ Good' : '❌ Needs Work'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">Check-In Rate</p>
                <p className="text-4xl font-bold text-blue-600">{checkInCompletion}%</p>
                <p className="text-xs text-slate-600 mt-3">{checkIns.length} total</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">Temperature Safety</p>
                <p className="text-4xl font-bold text-teal-600">{tempCompliance}%</p>
                <p className="text-xs text-slate-600 mt-3">{temperatures.length} logs</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">Equipment Health</p>
                <p className="text-4xl font-bold text-purple-600">{equipmentHealth}%</p>
                <p className="text-xs text-slate-600 mt-3">{equipment.filter(e => e.status === 'fault').length} issues</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Compliance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📈 Compliance Trend (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={complianceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="compliance" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Issues by Severity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">⚠️ Outstanding Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} (${value})`} outerRadius={80} dataKey="value">
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 Weekly Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">Conduct operational self-check for this week</p>
            <Button onClick={onStartWeekly} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Start Weekly Review
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📅 Monthly Audit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">Full compliance audit with scoring and sign-off</p>
            <Button onClick={onStartMonthly} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Start Monthly Audit
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Audits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📊 Recent Audits</span>
            <Badge variant="outline">{completedAudits.length} total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedAudits.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-4">No audits completed yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {completedAudits.slice(0, 5).map(audit => (
                <div key={audit.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">{audit.audit_type || 'Weekly Review'}</p>
                    <p className="text-xs text-slate-600">{format(new Date(audit.created_date), 'MMM d, HH:mm')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={audit.score >= 90 ? 'bg-emerald-600' : audit.score >= 75 ? 'bg-amber-600' : 'bg-red-600'}>
                      {audit.score || 'N/A'}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
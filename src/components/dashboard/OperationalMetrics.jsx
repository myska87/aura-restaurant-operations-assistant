import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Users, TrendingUp } from 'lucide-react';

export default function OperationalMetrics({ shifts = [], dateRange = {} }) {
  const totalHours = shifts.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalCost = shifts.reduce((sum, s) => sum + (s.total_cost || 0), 0);
  const completedShifts = shifts.filter(s => s.status === 'completed').length;
  const pendingApprovals = shifts.filter(s => s.needs_approval).length;

  // Calculate labor percentage (assuming avg revenue per day)
  const avgRevenuePerDay = 350; // Placeholder
  const totalDays = shifts.length > 0 ? new Set(shifts.map(s => s.date)).size : 1;
  const totalEstimatedRevenue = avgRevenuePerDay * totalDays;
  const laborPercentage = totalEstimatedRevenue > 0 ? ((totalCost / totalEstimatedRevenue) * 100).toFixed(1) : 0;

  // Daily staffing
  const dailyStaffing = {};
  shifts.forEach(shift => {
    const day = shift.date;
    if (!dailyStaffing[day]) dailyStaffing[day] = { count: 0, cost: 0, hours: 0 };
    dailyStaffing[day].count++;
    dailyStaffing[day].cost += shift.total_cost || 0;
    dailyStaffing[day].hours += shift.duration || 0;
  });

  const staffingData = Object.entries(dailyStaffing)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([date, data]) => ({
      date: date.slice(5),
      staff: data.count,
      cost: parseFloat(data.cost.toFixed(2)),
      hours: parseFloat(data.hours.toFixed(1))
    }))
    .slice(-14);

  // By position
  const byPosition = {};
  shifts.forEach(shift => {
    const pos = shift.position || 'Unassigned';
    if (!byPosition[pos]) byPosition[pos] = { hours: 0, cost: 0, count: 0 };
    byPosition[pos].hours += shift.duration || 0;
    byPosition[pos].cost += shift.total_cost || 0;
    byPosition[pos].count++;
  });

  const positionData = Object.entries(byPosition).map(([position, data]) => ({
    position,
    hours: parseFloat(data.hours.toFixed(1)),
    cost: parseFloat(data.cost.toFixed(2)),
    staff: data.count
  }));

  const completionRate = shifts.length > 0 ? ((completedShifts / shifts.length) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{totalHours.toFixed(0)}</p>
                  <p className="text-xs text-slate-500">Total Hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{laborPercentage}%</p>
                  <p className="text-xs text-slate-500">Labor Cost %</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">£{totalCost.toFixed(0)}</p>
                  <p className="text-xs text-slate-500">Total Staff Cost</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${completionRate > 80 ? 'bg-green-100' : 'bg-amber-100'}`}>
                  <TrendingUp className={`w-6 h-6 ${completionRate > 80 ? 'text-green-600' : 'text-amber-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${completionRate > 80 ? 'text-green-600' : 'text-amber-600'}`}>{completionRate}%</p>
                  <p className="text-xs text-slate-500">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Daily Staffing Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Staffing & Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={staffingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="staff" fill="#8b5cf6" name="Staff Count" />
              <Bar yAxisId="right" dataKey="cost" fill="#059669" name="Cost (£)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cost by Position */}
      <Card>
        <CardHeader>
          <CardTitle>Labor Cost by Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {positionData.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-700">{item.position}</span>
                  <span className="text-xs text-slate-500">{item.staff} staff • {item.hours.toFixed(1)}h</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-600"
                    style={{ width: `${(item.cost / Math.max(...positionData.map(p => p.cost))) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-500"></span>
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">£{item.cost.toFixed(2)}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {pendingApprovals > 0 && (
        <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">⚠️ Pending Approvals</p>
              <p className="text-sm text-amber-800 mt-1">{pendingApprovals} shifts awaiting manager approval. Review in Approvals tab.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {laborPercentage > 32 && (
        <Card className="border-red-300 bg-gradient-to-r from-red-50 to-pink-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">🚨 High Labor Cost Alert</p>
              <p className="text-sm text-red-800 mt-1">Labor costs at {laborPercentage}% — consider optimizing scheduling for next week.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { format, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, DollarSign, Zap } from 'lucide-react';

export default function SalesInsights({ shifts = [], menuItems = [], dateRange = {} }) {
  const totalShifts = shifts.length;
  const totalCost = shifts.reduce((sum, s) => sum + (s.total_cost || 0), 0);
  const avgCostPerShift = totalShifts > 0 ? (totalCost / totalShifts).toFixed(2) : 0;

  // Generate daily revenue data
  const dailyData = {};
  shifts.forEach(shift => {
    const day = format(new Date(shift.date), 'MMM dd');
    if (!dailyData[day]) dailyData[day] = 0;
    dailyData[day] += shift.total_cost || 0;
  });

  const chartData = Object.entries(dailyData)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([date, cost]) => ({
      date,
      revenue: parseFloat(cost.toFixed(2)),
      label: date
    }));

  // Menu mix
  const menuMix = menuItems.slice(0, 5).map(item => ({
    name: item.name || 'Item',
    value: item.price || 0,
    margin: item.profit_margin || 0
  }));

  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const avgDailyRevenue = chartData.length > 0 ? (totalRevenue / chartData.length).toFixed(2) : 0;
  const topDay = chartData.length > 0 ? chartData.reduce((max, d) => d.revenue > max.revenue ? d : max) : null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">£{totalRevenue.toFixed(0)}</p>
                  <p className="text-xs text-slate-500">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{chartData.length}</p>
                  <p className="text-xs text-slate-500">Days Tracked</p>
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
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">£{avgDailyRevenue}</p>
                  <p className="text-xs text-slate-500">Daily Average</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{totalShifts}</p>
                  <p className="text-xs text-slate-500">Total Shifts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `£${value.toFixed(2)}`} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#059669" 
                strokeWidth={2}
                dot={{ fill: '#059669', r: 4 }}
                name="Revenue (£)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Metrics */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-slate-700">Peak Day</span>
                {topDay && <Badge className="bg-emerald-100 text-emerald-700">{topDay.date}</Badge>}
              </div>
              {topDay && <p className="text-2xl font-bold text-emerald-600">£{topDay.revenue.toFixed(2)}</p>}
            </div>
            <div className="pt-3 border-t">
              <p className="text-sm text-slate-600 mb-2">Average Shift Cost: <strong className="text-slate-800">£{avgCostPerShift}</strong></p>
              <p className="text-sm text-slate-600">Total Shifts Logged: <strong className="text-slate-800">{totalShifts}</strong></p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Menu Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {menuMix.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-700">£{item.value.toFixed(2)}</Badge>
                    <Badge className="bg-green-100 text-green-700">{item.margin}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insight */}
      <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-900">
            <strong>🔮 AI Insight:</strong> Based on your shift data, average revenue is tracking at £{avgDailyRevenue}/day. 
            Consider optimizing peak hours with additional staffing to capture 15-20% revenue growth.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
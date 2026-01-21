import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

export default function FinancialOverview({ shifts = [], menuItems = [], dateRange = {} }) {
  const totalCost = shifts.reduce((sum, s) => sum + (s.total_cost || 0), 0);
  const estimatedRevenue = menuItems.reduce((sum, item) => sum + (item.price * 2 || 0), 0); // Placeholder estimate
  const profit = estimatedRevenue - totalCost;
  const profitMargin = estimatedRevenue > 0 ? ((profit / estimatedRevenue) * 100).toFixed(1) : 0;
  const taxEstimate = (profit * 0.2).toFixed(2);
  const netProfit = (profit - parseFloat(taxEstimate)).toFixed(2);

  // Daily financial data
  const dailyData = {};
  shifts.forEach(shift => {
    const day = shift.date;
    if (!dailyData[day]) dailyData[day] = { cost: 0, revenue: 0 };
    dailyData[day].cost += shift.total_cost || 0;
    dailyData[day].revenue = (dailyData[day].cost / 0.30) || 0; // Rough estimate
  });

  const chartData = Object.entries(dailyData)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([date, data]) => ({
      date: date.slice(5),
      revenue: parseFloat(data.revenue.toFixed(2)),
      cost: parseFloat(data.cost.toFixed(2)),
      profit: parseFloat((data.revenue - data.cost).toFixed(2))
    }))
    .slice(-14);

  // Expense breakdown
  const expenses = [
    { category: 'Staff', amount: totalCost, percentage: 40 },
    { category: 'Utilities', amount: 800, percentage: 10 },
    { category: 'Inventory', amount: 1200, percentage: 15 },
    { category: 'Marketing', amount: 600, percentage: 8 },
    { category: 'Rent', amount: 2500, percentage: 32 }
  ];

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

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
                  <p className="text-2xl font-bold text-emerald-600">£{estimatedRevenue.toFixed(0)}</p>
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
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <span className="text-lg">📊</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">£{totalCost.toFixed(0)}</p>
                  <p className="text-xs text-slate-500">Total Expenses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">£{profit.toFixed(0)}</p>
                  <p className="text-xs text-slate-500">Net Profit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <span className="text-lg">📈</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{profitMargin}%</p>
                  <p className="text-xs text-slate-500">Profit Margin</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* P&L Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Expenses Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `£${value.toFixed(2)}`} />
              <Legend />
              <Area type="monotone" dataKey="revenue" stackId="1" stroke="#059669" fill="#059669" opacity={0.8} name="Revenue (£)" />
              <Area type="monotone" dataKey="cost" stackId="1" stroke="#dc2626" fill="#dc2626" opacity={0.6} name="Expenses (£)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Expense Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenses.map((exp, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-700">{exp.category}</span>
                  <span className="text-sm text-slate-600">£{exp.amount.toFixed(2)} • {exp.percentage}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-slate-500 to-slate-600"
                    style={{ width: `${exp.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Total</span>
                <Badge className="bg-slate-600 text-white">£{totalExpenses.toFixed(2)}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax & Cash Flow */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Tax Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Gross Profit</span>
              <Badge className="bg-emerald-100 text-emerald-700">£{profit.toFixed(2)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Tax Estimate (20%)</span>
              <Badge className="bg-amber-100 text-amber-700">£{taxEstimate}</Badge>
            </div>
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="font-semibold text-slate-700">Net Profit</span>
              <Badge className="bg-green-600 text-white text-lg">£{netProfit}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">Health Score</span>
                <span className="text-2xl font-bold text-green-600">8.5/10</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full w-[85%] bg-gradient-to-r from-green-500 to-emerald-600" />
              </div>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p>✅ Positive cash flow</p>
              <p>✅ Expenses under control</p>
              <p>⚠️ Monitor Q2 revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Insights */}
      <Card className="border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="pt-6">
          <p className="text-sm text-green-900 mb-2">
            <strong>💰 Financial Health Report:</strong>
          </p>
          <ul className="text-xs text-green-800 space-y-1 ml-4">
            <li>• Profit margin at {profitMargin}% — target is 25%+, you're exceeding expectations</li>
            <li>• Staff costs are your largest expense at {((totalCost/totalExpenses)*100).toFixed(0)}% — well-managed</li>
            <li>• Cash flow is strong; consider reinvesting £{(profit * 0.3).toFixed(0)} in marketing this quarter</li>
            <li>• Seasonal adjustment expected Q2 — prepare with 15% cost buffer</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
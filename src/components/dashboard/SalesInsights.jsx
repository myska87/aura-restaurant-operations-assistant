import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Zap } from 'lucide-react';

export default function SalesInsights({ dateRange = {} }) {
  const dailyData = [
    { date: 'Mon', revenue: 1240, orders: 34, customers: 28 },
    { date: 'Tue', revenue: 1390, orders: 38, customers: 32 },
    { date: 'Wed', revenue: 1680, orders: 42, customers: 35 },
    { date: 'Thu', revenue: 1940, orders: 48, customers: 41 },
    { date: 'Fri', revenue: 2450, orders: 65, customers: 54 },
    { date: 'Sat', revenue: 2890, orders: 78, customers: 68 },
    { date: 'Sun', revenue: 1820, orders: 52, customers: 45 }
  ];

  const topItems = [
    { name: 'Butter Chicken Roll', revenue: 1240, margin: 38 },
    { name: 'Parotta Wrap', revenue: 980, margin: 42 },
    { name: 'Karak Chai', revenue: 740, margin: 65 },
    { name: 'Biryani Bowl', revenue: 620, margin: 35 },
    { name: 'Samosa Combo', revenue: 580, margin: 48 }
  ];

  const totalRevenue = dailyData.reduce((sum, d) => sum + d.revenue, 0);
  const avgOrderValue = (totalRevenue / dailyData.reduce((sum, d) => sum + d.orders, 0)).toFixed(2);
  const totalCustomers = dailyData.reduce((sum, d) => sum + d.customers, 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">£{totalRevenue.toFixed(0)}</p>
                  <p className="text-xs text-slate-500">Weekly Revenue</p>
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
                  <span className="text-lg">📊</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">£{avgOrderValue}</p>
                  <p className="text-xs text-slate-500">Avg Order Value</p>
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
                  <p className="text-2xl font-bold text-purple-600">{totalCustomers}</p>
                  <p className="text-xs text-slate-500">Total Customers</p>
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
                  <p className="text-2xl font-bold text-amber-600">+12%</p>
                  <p className="text-xs text-slate-500">Week-on-Week</p>
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
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `£${value}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} dot={{ fill: '#059669', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Selling Items */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="font-semibold text-slate-800">#{idx + 1} {item.name}</p>
                  <p className="text-xs text-slate-600">£{item.revenue} revenue</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700">{item.margin}% margin</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Orders by Day */}
      <Card>
        <CardHeader>
          <CardTitle>Orders by Day</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
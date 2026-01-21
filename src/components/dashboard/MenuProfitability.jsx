import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertCircle } from 'lucide-react';

export default function MenuProfitability({ menuItems = [], dateRange = {} }) {
  const itemsData = [
    { name: 'Butter Chicken Roll', sales: 342, margin: 38, revenue: 4104 },
    { name: 'Parotta Wrap', sales: 287, margin: 42, revenue: 3148 },
    { name: 'Biryani Bowl', sales: 156, margin: 35, revenue: 1872 },
    { name: 'Samosa Combo', sales: 198, margin: 48, revenue: 1980 },
    { name: 'Karak Chai', sales: 892, margin: 65, revenue: 4460 }
  ];

  const profitData = [
    { name: 'High Margin (40%+)', value: 35, fill: '#059669' },
    { name: 'Medium Margin (25-40%)', value: 45, fill: '#3b82f6' },
    { name: 'Low Margin (<25%)', value: 20, fill: '#f59e0b' }
  ];

  const totalRevenue = itemsData.reduce((sum, item) => sum + item.revenue, 0);
  const totalSales = itemsData.reduce((sum, item) => sum + item.sales, 0);
  const avgMargin = (itemsData.reduce((sum, item) => sum + item.margin, 0) / itemsData.length).toFixed(1);

  const lowMarginItems = itemsData.filter(item => item.margin < 30);

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
                  <p className="text-xs text-slate-500">Menu Revenue</p>
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
                  <p className="text-2xl font-bold text-blue-600">{totalSales}</p>
                  <p className="text-xs text-slate-500">Total Sold</p>
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
                  <span className="text-lg">💰</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{avgMargin}%</p>
                  <p className="text-xs text-slate-500">Avg Margin</p>
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
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{lowMarginItems.length}</p>
                  <p className="text-xs text-slate-500">Low Margin Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Item Profitability */}
      <Card>
        <CardHeader>
          <CardTitle>Top Items by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={itemsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#059669" name="Revenue (£)" />
              <Bar yAxisId="right" dataKey="margin" fill="#f59e0b" name="Margin (%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Profit Distribution */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Margin Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={profitData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {profitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Item Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {itemsData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-600">{item.sales} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">£{item.revenue}</p>
                    <Badge className={item.margin >= 40 ? 'bg-green-100 text-green-700' : item.margin >= 30 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}>
                      {item.margin}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Margin Alert */}
      {lowMarginItems.length > 0 && (
        <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardHeader>
            <CardTitle className="text-amber-900">⚠️ Low Margin Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowMarginItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-amber-200">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-600">{item.sales} sold this week</p>
                  </div>
                  <Badge className="bg-amber-600 text-white">{item.margin}%</Badge>
                </div>
              ))}
              <p className="text-xs text-amber-800 mt-3">
                💡 Tip: Consider reducing portion size, increasing price by 5%, or promoting high-margin alternatives.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu Insights */}
      <Card className="border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50">
        <CardContent className="pt-6">
          <p className="text-sm text-emerald-900 mb-2">
            <strong>📊 Menu Optimization Insights:</strong>
          </p>
          <ul className="text-xs text-emerald-800 space-y-1 ml-4">
            <li>• Average margin of {avgMargin}% across menu — 2% above target</li>
            <li>• High-margin items (Chai, Samosas) driving profit — feature on specials</li>
            <li>• {lowMarginItems.length} items under-performing — review pricing</li>
            <li>• Top performer: Karak Chai at {itemsData.find(i => i.name === 'Karak Chai').margin}% margin</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
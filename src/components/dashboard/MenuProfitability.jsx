import React from 'react';
import { motion } from 'framer-motion';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertCircle } from 'lucide-react';

export default function MenuProfitability({ menuItems = [], shifts = [] }) {
  // Prepare chart data
  const chartData = menuItems
    .filter(item => item.price && item.cost)
    .map(item => ({
      name: item.name || 'Item',
      price: item.price,
      cost: item.cost,
      margin: item.profit_margin || ((item.price - item.cost) / item.price * 100),
      category: item.category || 'Other'
    }))
    .sort((a, b) => b.margin - a.margin);

  // Top performers
  const topPerformers = chartData.slice(0, 5);
  const lowMargin = chartData.filter(item => item.margin < 30).slice(0, 5);

  // Summary metrics
  const avgMargin = chartData.length > 0 
    ? (chartData.reduce((sum, item) => sum + item.margin, 0) / chartData.length).toFixed(1)
    : 0;

  const totalMenuItems = menuItems.length;
  const activeItems = chartData.length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{avgMargin}%</p>
                  <p className="text-xs text-slate-500">Avg Profit Margin</p>
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
                  <span className="font-bold text-blue-600">📊</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{activeItems}/{totalMenuItems}</p>
                  <p className="text-xs text-slate-500">Active Items</p>
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
                  <span className="font-bold text-purple-600">🎯</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{lowMargin.length}</p>
                  <p className="text-xs text-slate-500">Low Margin Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Margin vs Price Scatter */}
      <Card>
        <CardHeader>
          <CardTitle>Price vs Profit Margin</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="price" type="number" name="Price (£)" />
              <YAxis dataKey="margin" type="number" name="Margin (%)" />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value) => value.toFixed(1)}
              />
              <Scatter 
                name="Menu Items" 
                data={chartData} 
                fill="#059669"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top 5 Items */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Best Margin Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div>
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-600">Price: £{item.price.toFixed(2)}</p>
                  </div>
                  <Badge className="bg-emerald-600 text-white">{item.margin.toFixed(0)}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>⚠️ Low Margin Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowMargin.length > 0 ? lowMargin.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div>
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-600">Cost: £{item.cost.toFixed(2)}</p>
                  </div>
                  <Badge className="bg-amber-600 text-white">{item.margin.toFixed(0)}%</Badge>
                </div>
              )) : (
                <p className="text-sm text-slate-600 text-center py-4">All items have healthy margins!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-900 mb-2">
            <strong>🔮 Menu Optimization Tips:</strong>
          </p>
          <ul className="text-xs text-amber-800 space-y-1 ml-4">
            <li>• Your average margin is {avgMargin}% — aim for 40%+ across the board</li>
            <li>• {lowMargin.length} items need cost review or price adjustment</li>
            <li>• Consider bundling high-margin items with popular low-margin dishes</li>
            <li>• Seasonal specials can drive margin improvement by 5-8%</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
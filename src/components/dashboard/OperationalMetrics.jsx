import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle, CheckCircle, Users } from 'lucide-react';

export default function OperationalMetrics({ shifts = [], dateRange = {} }) {
  const avgPrepTime = 8.2;
  const onTimeDelivery = 94;
  const staffEfficiency = 87;
  const orderAccuracy = 96;

  const stations = [
    { name: 'Hot Line', status: 'operational', temp: 165, efficiency: 92 },
    { name: 'Grill', status: 'operational', temp: 188, efficiency: 89 },
    { name: 'Chai Station', status: 'operational', temp: 92, efficiency: 95 },
    { name: 'Fryer', status: 'operational', temp: 175, efficiency: 85 },
    { name: 'Cold Prep', status: 'operational', temp: 4, efficiency: 88 }
  ];

  const shiftData = [
    { shift: 'Morning (6-2)', staff: 6, orders: 124, revenue: 1840 },
    { shift: 'Afternoon (2-10)', staff: 8, orders: 187, revenue: 2950 },
    { shift: 'Night (10-6)', staff: 3, orders: 42, revenue: 680 }
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{avgPrepTime}m</p>
                  <p className="text-xs text-slate-500">Avg Prep Time</p>
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
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{onTimeDelivery}%</p>
                  <p className="text-xs text-slate-500">On-Time Delivery</p>
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
                  <p className="text-2xl font-bold text-purple-600">{staffEfficiency}%</p>
                  <p className="text-xs text-slate-500">Staff Efficiency</p>
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
                  <span className="text-lg">✓</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{orderAccuracy}%</p>
                  <p className="text-xs text-slate-500">Order Accuracy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Station Status */}
      <Card>
        <CardHeader>
          <CardTitle>Station Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stations.map((station, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div>
                    <p className="font-semibold text-slate-800">{station.name}</p>
                    <p className="text-xs text-slate-600">Temp: {station.temp}°{typeof station.temp === 'number' && station.temp > 10 ? 'C' : 'C'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-700">{station.efficiency}% eff.</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">{station.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shift Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Shift Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {shiftData.map((shift, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-slate-800">{shift.shift}</p>
                  <Badge className="bg-blue-100 text-blue-700">{shift.staff} staff</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-600">Orders</p>
                    <p className="font-bold text-slate-800">{shift.orders}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Revenue</p>
                    <p className="font-bold text-emerald-600">£{shift.revenue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Operational Health */}
      <Card className="border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50">
        <CardContent className="pt-6">
          <p className="text-sm text-emerald-900 mb-2">
            <strong>✅ Operational Status:</strong>
          </p>
          <ul className="text-xs text-emerald-800 space-y-1 ml-4">
            <li>• All stations operational and running at peak efficiency</li>
            <li>• On-time delivery at 94% — target is 95%, close to goal</li>
            <li>• Average prep time 8.2 min — well within 10 min target</li>
            <li>• Order accuracy at 96% — excellent customer experience</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
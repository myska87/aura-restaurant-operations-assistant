import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, AlertTriangle, CheckCircle, Target } from 'lucide-react';

export default function FlowAnalytics({ open, onClose }) {
  const { data: todayOrders = [] } = useQuery({
    queryKey: ['todayFlowOrders'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      return base44.entities.FlowOrder.filter({ 
        created_date: { $gte: today }
      });
    },
    enabled: open
  });

  const served = todayOrders.filter(o => o.current_stage === 'served');
  const failed = todayOrders.filter(o => o.current_stage === 'failed');
  const active = todayOrders.filter(o => !['served', 'failed'].includes(o.current_stage));

  const avgTime = served.length > 0
    ? Math.round(served.reduce((sum, o) => sum + (o.total_time_seconds || 0), 0) / served.length)
    : 0;

  const fastestTime = served.length > 0
    ? Math.min(...served.map(o => o.total_time_seconds || Infinity))
    : 0;

  const slowestTime = served.length > 0
    ? Math.max(...served.map(o => o.total_time_seconds || 0))
    : 0;

  const passRate = served.length > 0
    ? Math.round((served.filter(o => o.quality_status === 'pass').length / served.length) * 100)
    : 0;

  // Stage bottleneck detection
  const stageDistribution = active.reduce((acc, order) => {
    acc[order.current_stage] = (acc[order.current_stage] || 0) + 1;
    return acc;
  }, {});

  const bottleneck = Object.entries(stageDistribution)
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Flow Analytics - Today</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Total Orders */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-800">{todayOrders.length}</p>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-emerald-100 text-emerald-800">{served.length} served</Badge>
                <Badge className="bg-blue-100 text-blue-800">{active.length} active</Badge>
                {failed.length > 0 && (
                  <Badge className="bg-red-100 text-red-800">{failed.length} failed</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Average Time */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Average Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-800">
                {Math.floor(avgTime / 60)}:{(avgTime % 60).toString().padStart(2, '0')}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Fastest: {Math.floor(fastestTime / 60)}:{(fastestTime % 60).toString().padStart(2, '0')} • 
                Slowest: {Math.floor(slowestTime / 60)}:{(slowestTime % 60).toString().padStart(2, '0')}
              </p>
            </CardContent>
          </Card>

          {/* Quality Pass Rate */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Quality Pass Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-800">{passRate}%</p>
              <p className="text-xs text-slate-500 mt-1">
                {served.filter(o => o.quality_status === 'pass').length} passed • 
                {served.filter(o => o.quality_status === 'fail').length} failed
              </p>
            </CardContent>
          </Card>

          {/* Bottleneck */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Current Bottleneck
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bottleneck ? (
                <>
                  <p className="text-2xl font-bold text-slate-800 capitalize">
                    {bottleneck[0]}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {bottleneck[1]} orders waiting
                  </p>
                </>
              ) : (
                <p className="text-slate-500">No bottleneck detected</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Most Ordered Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Top Items Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(
                todayOrders.reduce((acc, order) => {
                  acc[order.menu_item_name] = (acc[order.menu_item_name] || 0) + order.quantity;
                  return acc;
                }, {})
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="text-sm font-medium text-slate-700">{name}</span>
                    <Badge variant="outline">{count} orders</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
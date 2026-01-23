import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, 
  ChefHat, 
  Box, 
  Package, 
  CheckCircle, 
  PlayCircle,
  AlertTriangle,
  Clock,
  Plus,
  TrendingUp
} from 'lucide-react';
import FlowOrderCard from '@/components/flow/FlowOrderCard';
import CreateFlowOrderDialog from '@/components/flow/CreateFlowOrderDialog';
import FlowAnalytics from '@/components/flow/FlowAnalytics';

const STAGES = [
  { id: 'ordered', label: 'Ordered', icon: ClipboardList, color: 'bg-slate-500' },
  { id: 'prep', label: 'Prep', icon: ChefHat, color: 'bg-amber-500' },
  { id: 'assembly', label: 'Assembly', icon: Box, color: 'bg-blue-500' },
  { id: 'pack', label: 'Pack', icon: Package, color: 'bg-purple-500' },
  { id: 'quality', label: 'Quality', icon: CheckCircle, color: 'bg-emerald-500' },
  { id: 'served', label: 'Served', icon: PlayCircle, color: 'bg-green-600' }
];

export default function FlowBoard() {
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: activeOrders = [] } = useQuery({
    queryKey: ['flowOrders'],
    queryFn: () => base44.entities.FlowOrder.filter({ 
      current_stage: { $ne: 'served' }
    }, '-created_date'),
    refetchInterval: 3000 // Auto-refresh every 3 seconds
  });

  const { data: servedToday = [] } = useQuery({
    queryKey: ['servedToday'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      return base44.entities.FlowOrder.filter({ 
        current_stage: 'served',
        created_date: { $gte: today }
      });
    }
  });

  const moveToStageMutation = useMutation({
    mutationFn: async ({ orderId, nextStage, updates }) => {
      const stageTimeKey = `${nextStage}_started_at`;
      const currentOrder = activeOrders.find(o => o.id === orderId);
      
      const updateData = {
        current_stage: nextStage,
        stage_times: {
          ...currentOrder.stage_times,
          [stageTimeKey]: new Date().toISOString()
        },
        ...updates
      };

      // If moving to served, calculate total time
      if (nextStage === 'served') {
        const orderedTime = new Date(currentOrder.stage_times?.ordered_at || currentOrder.created_date);
        const servedTime = new Date();
        updateData.total_time_seconds = Math.floor((servedTime - orderedTime) / 1000);
        updateData.stage_times.served_at = servedTime.toISOString();
      }

      return base44.entities.FlowOrder.update(orderId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['flowOrders']);
      queryClient.invalidateQueries(['servedToday']);
    }
  });

  const getOrdersByStage = (stageId) => {
    return activeOrders.filter(order => order.current_stage === stageId);
  };

  const averageTime = servedToday.length > 0 
    ? Math.round(servedToday.reduce((sum, o) => sum + (o.total_time_seconds || 0), 0) / servedToday.length)
    : 0;

  const delayedOrders = activeOrders.filter(o => o.is_delayed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Flow Engine</h1>
            <p className="text-slate-600">Real-time order flow tracking</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowAnalytics(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Analytics
            </Button>
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Order
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <PlayCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-slate-800">{activeOrders.length}</p>
              <p className="text-sm text-slate-600">Active Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-slate-800">{servedToday.length}</p>
              <p className="text-sm text-slate-600">Served Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-slate-800">{Math.floor(averageTime / 60)}:{(averageTime % 60).toString().padStart(2, '0')}</p>
              <p className="text-sm text-slate-600">Avg Time</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-slate-800">{delayedOrders}</p>
              <p className="text-sm text-slate-600">Delayed</p>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-6 gap-4">
          {STAGES.map(stage => {
            const stageOrders = getOrdersByStage(stage.id);
            const Icon = stage.icon;
            
            return (
              <div key={stage.id} className="space-y-3">
                {/* Stage Header */}
                <Card className={`${stage.color} border-0`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-semibold">{stage.label}</span>
                      </div>
                      <Badge className="bg-white/20 text-white">
                        {stageOrders.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                </Card>

                {/* Orders in Stage */}
                <div className="space-y-2 min-h-[400px]">
                  <AnimatePresence>
                    {stageOrders.map(order => (
                      <FlowOrderCard
                        key={order.id}
                        order={order}
                        onMove={(nextStage, updates) => 
                          moveToStageMutation.mutate({ 
                            orderId: order.id, 
                            nextStage, 
                            updates 
                          })
                        }
                        user={user}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Order Dialog */}
      <CreateFlowOrderDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />

      {/* Analytics Dialog */}
      <FlowAnalytics
        open={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />
    </div>
  );
}
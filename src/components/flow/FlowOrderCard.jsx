import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChefHat
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function FlowOrderCard({ order, onMove, user }) {
  const [elapsed, setElapsed] = useState(0);
  const [showQuality, setShowQuality] = useState(false);
  const [failReason, setFailReason] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const startTime = new Date(order.stage_times?.ordered_at || order.created_date);
      setElapsed(Math.floor((new Date() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [order]);

  const handleNextStage = () => {
    const stageMap = {
      'ordered': 'prep',
      'prep': 'assembly',
      'assembly': 'pack',
      'pack': 'quality',
      'quality': 'served'
    };

    const nextStage = stageMap[order.current_stage];
    
    if (nextStage === 'served') {
      setShowQuality(true);
    } else {
      onMove(nextStage, {
        assigned_staff_id: user?.id,
        assigned_staff_name: user?.full_name || user?.email
      });
    }
  };

  const handleQualityCheck = (passed) => {
    if (passed) {
      onMove('served', {
        quality_status: 'pass',
        assigned_staff_id: user?.id,
        assigned_staff_name: user?.full_name || user?.email
      });
    } else {
      onMove('failed', {
        quality_status: 'fail',
        quality_fail_reason: failReason,
        waste_logged: true
      });
    }
    setShowQuality(false);
  };

  const isDelayed = elapsed > 300; // 5 minutes

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <Card className={`
          cursor-pointer hover:shadow-lg transition-all
          ${isDelayed ? 'border-red-300 bg-red-50' : 'border-slate-200'}
        `}>
          <CardContent className="pt-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-slate-800 text-sm">{order.menu_item_name}</p>
                <p className="text-xs text-slate-500">#{order.flow_id?.slice(-6)}</p>
              </div>
              {order.quantity > 1 && (
                <Badge variant="outline">x{order.quantity}</Badge>
              )}
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-xs">
              <Clock className={`w-3 h-3 ${isDelayed ? 'text-red-500' : 'text-slate-500'}`} />
              <span className={isDelayed ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
              </span>
              {isDelayed && (
                <AlertTriangle className="w-3 h-3 text-red-500 ml-auto" />
              )}
            </div>

            {/* Staff */}
            {order.assigned_staff_name && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <User className="w-3 h-3" />
                <span>{order.assigned_staff_name}</span>
              </div>
            )}

            {/* Order Type */}
            <Badge className={
              order.order_type === 'dine_in' ? 'bg-blue-100 text-blue-800' :
              order.order_type === 'takeaway' ? 'bg-amber-100 text-amber-800' :
              'bg-purple-100 text-purple-800'
            }>
              {order.order_type}
            </Badge>

            {/* Action Button */}
            <Button
              size="sm"
              onClick={handleNextStage}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {order.current_stage === 'quality' ? 'Quality Check' : 'Next Stage'}
              <ArrowRight className="w-3 h-3 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quality Check Dialog */}
      <Dialog open={showQuality} onOpenChange={setShowQuality}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quality Check</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-600">Check order quality before serving</p>
            <p className="font-semibold text-slate-800">{order.menu_item_name}</p>
            
            <Textarea
              placeholder="If fail, provide reason..."
              value={failReason}
              onChange={(e) => setFailReason(e.target.value)}
              rows={3}
            />

            <div className="flex gap-3">
              <Button
                onClick={() => handleQualityCheck(false)}
                disabled={!failReason}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Fail
              </Button>
              <Button
                onClick={() => handleQualityCheck(true)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Pass
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
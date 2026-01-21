import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Timer, CheckCircle, Clock, AlertCircle, Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ServiceExecution({ menuItems, user }) {
  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const queryClient = useQueryClient();

  const createOrderMutation = useMutation({
    mutationFn: (orderData) => base44.entities.Sale.create(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      setSelectedItem('');
      setTableNumber('');
    }
  });

  const addToQueue = () => {
    if (!selectedItem || !tableNumber) return;
    
    const menuItem = menuItems.find(m => m.id === selectedItem);
    const newOrder = {
      id: Date.now().toString(),
      menuItem: menuItem?.data,
      tableNumber,
      status: 'preparing',
      startTime: new Date(),
      estimatedTime: menuItem?.data?.prep_time_minutes || 10
    };

    setActiveOrders([...activeOrders, newOrder]);
  };

  const updateOrderStatus = (orderId, status) => {
    setActiveOrders(activeOrders.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));

    if (status === 'completed') {
      const order = activeOrders.find(o => o.id === orderId);
      if (order) {
        createOrderMutation.mutate({
          item_name: order.menuItem?.name,
          quantity: 1,
          price: order.menuItem?.price || 0,
          category: order.menuItem?.category,
          sale_date: new Date().toISOString()
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">⏱️ Flow 3: Service Execution</h2>
        <p className="text-sm text-slate-500">Real-time order tracking and service timing</p>
      </div>

      {/* Quick Order Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Add to Service Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
            >
              <option value="">Select dish...</option>
              {menuItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.data?.name} - £{item.data?.price}
                </option>
              ))}
            </select>
            <Input
              type="text"
              placeholder="Table #"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-24"
            />
            <Button onClick={addToQueue} className="bg-emerald-600">
              <Play className="w-4 h-4 mr-2" />
              Start Order
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Orders */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Active Orders ({activeOrders.filter(o => o.status !== 'completed').length})</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          {activeOrders
            .filter(order => order.status !== 'completed')
            .map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className={`
                  ${order.status === 'preparing' ? 'border-blue-300 bg-blue-50' : ''}
                  ${order.status === 'ready' ? 'border-emerald-300 bg-emerald-50' : ''}
                `}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Table {order.tableNumber}</CardTitle>
                      <Badge className={
                        order.status === 'preparing' 
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }>
                        {order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="font-medium">{order.menuItem?.name}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span>Est. {order.estimatedTime} min</span>
                      </div>
                      
                      <div className="flex gap-2">
                        {order.status === 'preparing' && (
                          <Button 
                            size="sm"
                            className="flex-1 bg-emerald-600"
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Ready
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button 
                            size="sm"
                            className="flex-1 bg-blue-600"
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Served
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </div>

        {activeOrders.filter(o => o.status !== 'completed').length === 0 && (
          <Card className="bg-slate-50">
            <CardContent className="pt-6">
              <div className="text-center text-slate-500">
                <Timer className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No active orders</p>
                <p className="text-xs mt-1">Add items to the service queue to start</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completed Orders Today */}
      {activeOrders.filter(o => o.status === 'completed').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completed Today ({activeOrders.filter(o => o.status === 'completed').length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeOrders
                .filter(order => order.status === 'completed')
                .slice(-5)
                .reverse()
                .map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
                    <span className="font-medium">{order.menuItem?.name}</span>
                    <Badge variant="outline">Table {order.tableNumber}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
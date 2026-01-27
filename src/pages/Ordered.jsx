import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Package, Truck, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Ordered() {
  const [expandedSuppliers, setExpandedSuppliers] = useState({});

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['placed-orders'],
    queryFn: async () => {
      const allOrders = await base44.entities.Order.list('-created_date', 100);
      return allOrders.filter(order => ['pending', 'sent', 'in_transit'].includes(order.status));
    }
  });

  // Group orders by supplier
  const ordersBySupplier = orders.reduce((acc, order) => {
    const supplierName = order.supplier_name || 'Unknown Supplier';
    if (!acc[supplierName]) {
      acc[supplierName] = {
        supplier_id: order.supplier_id,
        supplier_name: supplierName,
        orders: [],
        totalAmount: 0,
        totalItems: 0
      };
    }
    acc[supplierName].orders.push(order);
    acc[supplierName].totalAmount += order.total_amount || 0;
    acc[supplierName].totalItems += (order.items?.length || 0);
    return acc;
  }, {});

  const toggleSupplier = (supplierName) => {
    setExpandedSuppliers(prev => ({
      ...prev,
      [supplierName]: !prev[supplierName]
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Placed Orders</h1>
        <p className="text-slate-600">Track all orders that have been placed with suppliers</p>
      </div>

      {Object.entries(ordersBySupplier).length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="pt-12 text-center">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg">No orders placed yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(ordersBySupplier).map(([supplierName, supplierData]) => (
            <motion.div
              key={supplierName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden">
                <button
                  onClick={() => toggleSupplier(supplierName)}
                  className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Truck className="w-6 h-6 text-emerald-600" />
                    <div className="text-left">
                      <h2 className="text-xl font-bold text-slate-900">{supplierName}</h2>
                      <p className="text-sm text-slate-600">
                        {supplierData.orders.length} order{supplierData.orders.length !== 1 ? 's' : ''} • 
                        {' '}{supplierData.totalItems} product{supplierData.totalItems !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-amber-600" />
                        <div className="text-2xl font-bold text-slate-900">
                          £{supplierData.totalAmount.toFixed(2)}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">Total Value</p>
                    </div>
                    {expandedSuppliers[supplierName] ? (
                      <ChevronUp className="w-6 h-6 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedSuppliers[supplierName] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-200"
                    >
                      <div className="p-6 space-y-4">
                        {supplierData.orders.map(order => (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-slate-50 rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-bold text-slate-900">{order.order_number}</h3>
                                <p className="text-sm text-slate-600">
                                  Expected: {order.expected_delivery || 'N/A'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(order.status)}>
                                  {order.status.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline" className="font-mono">
                                  £{order.total_amount?.toFixed(2) || '0.00'}
                                </Badge>
                              </div>
                            </div>

                            {/* Products List */}
                            <div className="space-y-2 bg-white rounded-lg p-3 border border-slate-200">
                              {order.items?.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-slate-800">{item.ingredient_name}</p>
                                    <p className="text-xs text-slate-500">
                                      {item.quantity} {item.unit} @ £{item.unit_cost?.toFixed(2) || '0.00'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-slate-900">
                                      £{item.total_cost?.toFixed(2) || '0.00'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {order.notes && (
                              <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700 border border-blue-200">
                                <p className="font-medium">Notes:</p>
                                <p>{order.notes}</p>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
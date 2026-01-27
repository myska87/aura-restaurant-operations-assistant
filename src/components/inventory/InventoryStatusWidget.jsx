import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TruckIcon, Thermometer, XCircle, AlertTriangle } from 'lucide-react';
import { format, isToday, isYesterday, subDays } from 'date-fns';

export default function InventoryStatusWidget() {
  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients-master-widget'],
    queryFn: () => base44.entities.Ingredient_Master_v1.list()
  });

  const { data: recentOrders = [] } = useQuery({
    queryKey: ['recent-deliveries'],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({
        status: 'received'
      }, '-actual_delivery_date', 20);
      return orders.filter(o => o.actual_delivery_date && 
        new Date(o.actual_delivery_date) >= subDays(new Date(), 7)
      );
    }
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['delivery-transactions-widget'],
    queryFn: async () => {
      const trans = await base44.entities.InventoryTransaction.filter({
        transaction_type: 'delivery'
      }, '-transaction_date', 50);
      return trans.filter(t => t.transaction_date && 
        new Date(t.transaction_date) >= subDays(new Date(), 7)
      );
    }
  });

  const { data: rejectedOrders = [] } = useQuery({
    queryKey: ['rejected-orders-widget'],
    queryFn: () => base44.entities.Order.filter({ status: 'rejected' }, '-rejected_date', 10)
  });

  const lowStockCount = ingredients.filter(i => 
    i.current_stock <= (i.min_stock_level || 0)
  ).length;

  const tempCompliantCount = transactions.filter(t => 
    t.temperature_status === 'compliant' || t.temperature_status === 'not_applicable'
  ).length;

  const tempComplianceRate = transactions.length > 0 
    ? ((tempCompliantCount / transactions.length) * 100).toFixed(0)
    : 100;

  const getDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-600" />
          Inventory Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Low Stock Alert */}
        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">Low Stock Items</p>
              <p className="text-xs text-amber-700">Require reordering</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-900">{lowStockCount}</div>
        </div>

        {/* Recent Deliveries */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <TruckIcon className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900">Deliveries (7 days)</p>
              <p className="text-xs text-blue-700">Last week</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-900">{recentOrders.length}</div>
        </div>

        {/* Temperature Compliance */}
        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Thermometer className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-900">Temp Compliance</p>
              <p className="text-xs text-emerald-700">Delivery temperature checks</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-900">{tempComplianceRate}%</div>
        </div>

        {/* Rejected Deliveries */}
        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Rejected Deliveries</p>
              <p className="text-xs text-red-700">This month</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-red-900">{rejectedOrders.length}</div>
        </div>

        {/* Recent Deliveries List */}
        {recentOrders.length > 0 && (
          <div className="pt-4 border-t space-y-2">
            <p className="text-sm font-semibold text-slate-700">Recent Deliveries</p>
            {recentOrders.slice(0, 3).map((order) => (
              <div key={order.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded">
                <div>
                  <p className="font-semibold text-slate-800">{order.supplier_name}</p>
                  <p className="text-slate-500">{order.items?.length || 0} items</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {getDateLabel(order.actual_delivery_date)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
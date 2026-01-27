import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TruckIcon, Trophy, AlertCircle, Thermometer } from 'lucide-react';
import { subDays, differenceInDays } from 'date-fns';

export default function SupplierPerformanceWidget() {
  const { data: orders = [] } = useQuery({
    queryKey: ['supplier-performance-orders'],
    queryFn: async () => {
      const allOrders = await base44.entities.Order.list('-created_date');
      return allOrders.filter(o => 
        o.created_date && new Date(o.created_date) >= subDays(new Date(), 30)
      );
    }
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['supplier-temp-compliance'],
    queryFn: async () => {
      const trans = await base44.entities.InventoryTransaction.filter({
        transaction_type: 'delivery'
      }, '-transaction_date', 100);
      return trans.filter(t => 
        t.transaction_date && new Date(t.transaction_date) >= subDays(new Date(), 30)
      );
    }
  });

  // Calculate supplier metrics
  const supplierMetrics = {};
  
  orders.forEach(order => {
    const supplierId = order.supplier_id;
    if (!supplierId) return;

    if (!supplierMetrics[supplierId]) {
      supplierMetrics[supplierId] = {
        name: order.supplier_name,
        totalOrders: 0,
        onTimeDeliveries: 0,
        rejectedOrders: 0,
        receivedOrders: 0,
        tempCompliant: 0,
        tempChecks: 0
      };
    }

    const metrics = supplierMetrics[supplierId];
    metrics.totalOrders++;

    if (order.status === 'received') {
      metrics.receivedOrders++;
      
      // Check on-time delivery
      if (order.expected_delivery && order.actual_delivery_date) {
        const expectedDate = new Date(order.expected_delivery);
        const actualDate = new Date(order.actual_delivery_date);
        const daysDiff = differenceInDays(actualDate, expectedDate);
        
        if (daysDiff <= 0) {
          metrics.onTimeDeliveries++;
        }
      }
    }

    if (order.status === 'rejected') {
      metrics.rejectedOrders++;
    }
  });

  // Add temperature compliance
  transactions.forEach(trans => {
    const supplierId = trans.supplier_id;
    if (!supplierId || !supplierMetrics[supplierId]) return;

    const metrics = supplierMetrics[supplierId];
    if (trans.temperature_status) {
      metrics.tempChecks++;
      if (trans.temperature_status === 'compliant' || trans.temperature_status === 'not_applicable') {
        metrics.tempCompliant++;
      }
    }
  });

  // Calculate rates and sort
  const suppliersList = Object.values(supplierMetrics).map(m => ({
    ...m,
    onTimeRate: m.receivedOrders > 0 ? (m.onTimeDeliveries / m.receivedOrders) * 100 : 0,
    rejectRate: m.totalOrders > 0 ? (m.rejectedOrders / m.totalOrders) * 100 : 0,
    tempComplianceRate: m.tempChecks > 0 ? (m.tempCompliant / m.tempChecks) * 100 : 100
  })).sort((a, b) => b.onTimeRate - a.onTimeRate);

  const topSuppliers = suppliersList.slice(0, 3);
  
  const avgOnTimeRate = suppliersList.length > 0
    ? (suppliersList.reduce((sum, s) => sum + s.onTimeRate, 0) / suppliersList.length).toFixed(0)
    : 0;

  const totalIssues = suppliersList.reduce((sum, s) => sum + s.rejectedOrders, 0);

  const avgTempCompliance = suppliersList.length > 0
    ? (suppliersList.reduce((sum, s) => sum + s.tempComplianceRate, 0) / suppliersList.length).toFixed(0)
    : 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-600" />
          Supplier Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <TruckIcon className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-emerald-900">{avgOnTimeRate}%</p>
            <p className="text-xs text-emerald-700">On-Time</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-red-900">{totalIssues}</p>
            <p className="text-xs text-red-700">Issues</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Thermometer className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-900">{avgTempCompliance}%</p>
            <p className="text-xs text-blue-700">Temp OK</p>
          </div>
        </div>

        {/* Top Suppliers */}
        {topSuppliers.length > 0 && (
          <div className="pt-4 border-t space-y-2">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Top 3 Suppliers
            </p>
            {topSuppliers.map((supplier, index) => (
              <div key={supplier.name} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{supplier.name}</p>
                    <p className="text-xs text-slate-500">
                      {supplier.totalOrders} orders this month
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-emerald-100 text-emerald-700">
                    {supplier.onTimeRate.toFixed(0)}% on-time
                  </Badge>
                  {supplier.tempChecks > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      {supplier.tempComplianceRate.toFixed(0)}% temp OK
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {suppliersList.length === 0 && (
          <div className="text-center py-8">
            <TruckIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No supplier data yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TruckIcon, 
  Download, 
  Calendar, 
  Package, 
  Thermometer,
  Camera,
  AlertTriangle,
  CheckCircle,
  Filter
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DeliveryReport() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['delivery-report-orders'],
    queryFn: () => base44.entities.Order.list('-actual_delivery_date')
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => base44.entities.Supplier_Directory_v1.list()
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['delivery-transactions'],
    queryFn: () => base44.entities.InventoryTransaction.filter({
      transaction_type: 'delivery'
    }, '-transaction_date')
  });

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.actual_delivery_date || order.order_date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const dateMatch = orderDate >= start && orderDate <= end;
    const supplierMatch = filterSupplier === 'all' || order.supplier_id === filterSupplier;
    const statusMatch = filterStatus === 'all' || order.status === filterStatus;
    
    return dateMatch && supplierMatch && statusMatch;
  });

  const exportToCSV = () => {
    let csv = 'Delivery Report\n';
    csv += `Date Range: ${startDate} to ${endDate}\n\n`;
    csv += 'Order Number,Supplier,Order Date,Delivery Date,Items,Total Cost,Status,Temperature Checks,Photos,Notes\n';
    
    filteredOrders.forEach(order => {
      const orderTrans = transactions.filter(t => t.order_id === order.id);
      const tempChecks = orderTrans.filter(t => t.temperature_logged).length;
      const photoCount = order.delivery_photos?.length || 0;
      
      csv += `"${order.order_number}","${order.supplier_name}","${order.order_date}","${order.actual_delivery_date || 'N/A'}","${order.items?.length || 0}","£${order.total_amount?.toFixed(2) || '0.00'}","${order.status}","${tempChecks}","${photoCount}","${order.delivery_notes || ''}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delivery-report-${startDate}-to-${endDate}.csv`;
    a.click();
  };

  const totalDeliveries = filteredOrders.length;
  const totalCost = filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const receivedCount = filteredOrders.filter(o => o.status === 'received').length;
  const rejectedCount = filteredOrders.filter(o => o.status === 'rejected').length;

  const tempComplianceRate = transactions.length > 0
    ? ((transactions.filter(t => t.temperature_status === 'compliant' || t.temperature_status === 'not_applicable').length / transactions.length) * 100).toFixed(0)
    : 100;

  if (isLoading) return <LoadingSpinner message="Loading delivery report..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Report"
        description="Track deliveries, temperatures, and supplier performance"
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Supplier</Label>
              <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.supplier_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button onClick={exportToCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Deliveries</p>
                <p className="text-3xl font-bold text-slate-800">{totalDeliveries}</p>
              </div>
              <TruckIcon className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Cost</p>
                <p className="text-3xl font-bold text-slate-800">£{totalCost.toFixed(2)}</p>
              </div>
              <Package className="w-10 h-10 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Temp Compliance</p>
                <p className="text-3xl font-bold text-emerald-600">{tempComplianceRate}%</p>
              </div>
              <Thermometer className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deliveries List */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredOrders.map(order => {
                const orderTrans = transactions.filter(t => t.order_id === order.id);
                const tempChecks = orderTrans.filter(t => t.temperature_logged);
                
                return (
                  <Card key={order.id} className="border-2">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-bold text-lg">{order.order_number}</p>
                          <p className="text-sm text-slate-600">{order.supplier_name}</p>
                        </div>
                        <Badge className={
                          order.status === 'received' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }>
                          {order.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-slate-500">Order Date</p>
                          <p className="font-semibold">{order.order_date}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Delivery Date</p>
                          <p className="font-semibold">{order.actual_delivery_date || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Items</p>
                          <p className="font-semibold">{order.items?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Total</p>
                          <p className="font-semibold">£{order.total_amount?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>

                      {/* Temperature Checks */}
                      {tempChecks.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Thermometer className="w-4 h-4 text-blue-600" />
                            <p className="text-sm font-semibold text-blue-900">
                              Temperature Checks ({tempChecks.length})
                            </p>
                          </div>
                          <div className="space-y-1">
                            {tempChecks.map((trans, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span>{trans.ingredient_name}</span>
                                <span className="font-semibold">{trans.temperature_logged}°C</span>
                                {trans.temperature_status === 'compliant' ? (
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Photos */}
                      {order.delivery_photos && order.delivery_photos.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Camera className="w-4 h-4 text-purple-600" />
                            <p className="text-sm font-semibold text-purple-900">
                              Photos ({order.delivery_photos.length})
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {order.delivery_photos.slice(0, 3).map((url, i) => (
                              <img
                                key={i}
                                src={url}
                                alt={`Delivery ${i + 1}`}
                                className="w-full h-20 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {order.delivery_notes && (
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-700">{order.delivery_notes}</p>
                        </div>
                      )}

                      {order.rejection_reason && (
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-sm font-semibold text-red-900 mb-1">Rejection Reason:</p>
                          <p className="text-sm text-red-700">{order.rejection_reason}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
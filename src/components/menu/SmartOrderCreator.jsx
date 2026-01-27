import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, AlertCircle, CheckCircle, TruckIcon, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

export default function SmartOrderCreator({ ingredientsList, orderType, open, onClose, menuItemName }) {
  const queryClient = useQueryClient();
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(format(addDays(new Date(), 2), 'yyyy-MM-dd'));
  const [orderNotes, setOrderNotes] = useState('');

  // Group ingredients by supplier
  const groupBySupplier = () => {
    const grouped = {};
    
    ingredientsList.forEach(ing => {
      const supplierId = ing.supplier_id || 'no_supplier';
      const supplierName = ing.supplier_name || 'No Supplier Assigned';
      
      if (!grouped[supplierId]) {
        grouped[supplierId] = {
          supplier_id: supplierId,
          supplier_name: supplierName,
          items: []
        };
      }
      
      grouped[supplierId].items.push({
        ingredient_id: ing.ingredient_id,
        ingredient_name: ing.ingredient_name,
        quantity: ing.quantity,
        unit: ing.unit,
        unit_cost: ing.cost_per_unit || 0,
        total_cost: (ing.quantity || 0) * (ing.cost_per_unit || 0)
      });
    });
    
    return Object.values(grouped);
  };

  const supplierOrders = groupBySupplier();

  const createOrdersMutation = useMutation({
    mutationFn: async (user) => {
      const orderPromises = supplierOrders.map(async (supplierOrder) => {
        const totalAmount = supplierOrder.items.reduce((sum, item) => sum + item.total_cost, 0);
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        return base44.entities.Order.create({
          order_number: orderNumber,
          supplier_id: supplierOrder.supplier_id,
          supplier_name: supplierOrder.supplier_name,
          items: supplierOrder.items,
          total_amount: totalAmount,
          status: 'pending',
          order_type: orderType || 'manual',
          order_date: format(new Date(), 'yyyy-MM-dd'),
          expected_delivery: expectedDeliveryDate,
          created_by: user.email,
          created_by_name: user.full_name || user.email,
          notes: orderNotes || (menuItemName ? `Order for ${menuItemName}` : '')
        });
      });
      
      return Promise.all(orderPromises);
    },
    onSuccess: (createdOrders) => {
      queryClient.invalidateQueries(['orders']);
      toast.success(`${createdOrders.length} order(s) created successfully`);
      onClose();
    },
    onError: (error) => {
      console.error('Order creation error:', error);
      toast.error('Failed to create orders');
    }
  });

  const handleCreateOrders = async () => {
    try {
      const user = await base44.auth.me();
      createOrdersMutation.mutate(user);
    } catch (e) {
      toast.error('User not authenticated');
    }
  };

  const totalItems = ingredientsList.length;
  const totalSuppliers = supplierOrders.length;
  const totalCost = supplierOrders.reduce((sum, supplier) => 
    sum + supplier.items.reduce((itemSum, item) => itemSum + item.total_cost, 0), 0
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TruckIcon className="w-6 h-6 text-emerald-600" />
            Smart Order Creation - Multi-Supplier Split
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <p className="font-semibold text-emerald-900">
                  Your order will be automatically split into {totalSuppliers} supplier order{totalSuppliers > 1 ? 's' : ''}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-slate-800">{totalItems}</p>
                  <p className="text-xs text-slate-600">Total Items</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">{totalSuppliers}</p>
                  <p className="text-xs text-slate-600">Suppliers</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-slate-800">£{totalCost.toFixed(2)}</p>
                  <p className="text-xs text-slate-600">Total Cost</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expected Delivery Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-slate-600" />
                Expected Delivery Date
              </Label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div>
              <Label className="mb-2">Order Notes (Optional)</Label>
              <Textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Add notes for all orders..."
                rows={2}
              />
            </div>
          </div>

          {/* Supplier Orders Preview */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {supplierOrders.map((supplierOrder, index) => {
                const supplierTotal = supplierOrder.items.reduce((sum, item) => sum + item.total_cost, 0);
                
                return (
                  <Card key={index} className="border-2">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                            <Package className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-slate-800">{supplierOrder.supplier_name}</h3>
                            <p className="text-sm text-slate-500">
                              Order #{index + 1} • {supplierOrder.items.length} items
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-800">£{supplierTotal.toFixed(2)}</p>
                          <Badge className="mt-1">Pending</Badge>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-2">
                        {supplierOrder.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800">{item.ingredient_name}</p>
                              <p className="text-sm text-slate-600">
                                {item.quantity} {item.unit} × £{item.unit_cost.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-800">£{item.total_cost.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {supplierOrder.supplier_id === 'no_supplier' && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <p className="text-sm text-amber-800">
                              Some ingredients don't have suppliers assigned. Please assign suppliers before ordering.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateOrders}
            disabled={createOrdersMutation.isPending || supplierOrders.some(o => o.supplier_id === 'no_supplier')}
            className="bg-emerald-600 hover:bg-emerald-700"
            size="lg"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {createOrdersMutation.isPending ? 'Creating Orders...' : `Create ${totalSuppliers} Order${totalSuppliers > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
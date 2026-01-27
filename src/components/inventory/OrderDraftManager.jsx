import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { AlertTriangle, Plus, Trash2, Send, Zap, Package, DollarSign, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrderDraftManager({ draftId, suppliers, ingredients, onClose }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [showPlaceDialog, setShowPlaceDialog] = useState(false);

  // Fetch draft details
  const { data: draftData, isLoading } = useQuery({
    queryKey: ['draft', draftId],
    queryFn: async () => {
      if (!draftId) return null;
      return base44.entities.Order.list('-created_date', 100).then(
        orders => orders.find(o => o.id === draftId)
      );
    }
  });

  React.useEffect(() => {
    if (draftData) setDraft(draftData);
  }, [draftData]);

  // Update item quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async (updatedItems) => {
      const newTotal = updatedItems.reduce((sum, item) => sum + (item.total_cost || 0), 0);
      return base44.entities.Order.update(draftId, {
        items: updatedItems,
        total_amount: newTotal
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['draft']);
      setEditingItemId(null);
    }
  });

  // Remove item from draft
  const removeItemMutation = useMutation({
    mutationFn: async (itemIndex) => {
      const updatedItems = draft.items.filter((_, idx) => idx !== itemIndex);
      const newTotal = updatedItems.reduce((sum, item) => sum + (item.total_cost || 0), 0);
      return base44.entities.Order.update(draftId, {
        items: updatedItems,
        total_amount: newTotal
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['draft']);
      toast.success('Item removed from draft');
    }
  });

  // Delete entire draft
  const deleteDraftMutation = useMutation({
    mutationFn: () => base44.entities.Order.delete(draftId),
    onSuccess: () => {
      queryClient.invalidateQueries(['drafts']);
      toast.success('Draft deleted');
      onClose();
    }
  });

  // Place order (change status from draft to pending and send email)
  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const supplier = suppliers.find(s => s.id === draft.supplier_id);
      
      // Update order status to pending
      await base44.entities.Order.update(draftId, {
        status: 'pending',
        order_date: format(new Date(), 'yyyy-MM-dd'),
        expected_delivery: format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
      });

      // Send email to supplier
      if (supplier?.email) {
        const itemList = draft.items
          .map(i => `- ${i.ingredient_name}: ${i.quantity} ${i.unit} @ £${i.unit_cost.toFixed(2)}`)
          .join('\n');
        
        await base44.integrations.Core.SendEmail({
          to: supplier.email,
          subject: `New Order ${draft.order_number} - ${format(new Date(), 'MMM d, yyyy')}`,
          body: `Dear ${supplier.contact_person || supplier.name},\n\nWe would like to place the following order:\n\n${itemList}\n\nOrder Total: £${draft.total_amount.toFixed(2)}\n\nPlease confirm availability and delivery date.\n\nThank you.`
        });
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['drafts']);
      queryClient.invalidateQueries(['orders']);
      toast.success('Order placed! Supplier notified.');
      setShowPlaceDialog(false);
      onClose();
    }
  });

  // Auto-fill to par level
  const autoFillToPar = () => {
    if (!draft) return;

    const updatedItems = draft.items.map(item => {
      const ingredient = ingredients.find(i => i.id === item.ingredient_id);
      if (!ingredient) return item;

      const parLevel = ingredient.max_stock_level || ingredient.min_stock_level * 2 || 0;
      const currentStock = ingredient.current_stock || 0;
      const neededQty = Math.max(0, parLevel - currentStock);

      return {
        ...item,
        quantity: neededQty > 0 ? neededQty : item.quantity,
        total_cost: (neededQty > 0 ? neededQty : item.quantity) * (item.unit_cost || 0)
      };
    });

    const newTotal = updatedItems.reduce((sum, item) => sum + (item.total_cost || 0), 0);
    
    updateQuantityMutation.mutate(updatedItems);
    toast.success('Draft updated to par levels');
  };

  if (isLoading || !draft) {
    return <div className="p-8 text-center">Loading draft...</div>;
  }

  const supplier = suppliers.find(s => s.id === draft.supplier_id);
  const totalItems = draft.items?.length || 0;
  const lowStockItems = draft.items?.filter(item => {
    const ing = ingredients.find(i => i.id === item.ingredient_id);
    return ing && (ing.current_stock || 0) <= (ing.min_stock_level || 0);
  }).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{draft.order_number}</h2>
          <p className="text-slate-600 text-sm">
            Supplier: <span className="font-semibold">{supplier?.name || 'Unknown'}</span>
          </p>
        </div>
        <Badge className="bg-amber-100 text-amber-800 text-lg px-4 py-2">
          DRAFT
        </Badge>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-900">{lowStockItems} items below par level</p>
            <p className="text-sm text-red-700">Use "Auto-Fill to Par" to optimize quantities</p>
          </div>
          <Button
            onClick={autoFillToPar}
            disabled={updateQuantityMutation.isPending}
            className="bg-red-600 hover:bg-red-700 whitespace-nowrap"
          >
            <Zap className="w-4 h-4 mr-2" />
            Auto-Fill to Par
          </Button>
        </motion.div>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items ({totalItems})
            </span>
            <span className="text-2xl font-bold text-emerald-600">
              £{draft.total_amount?.toFixed(2) || '0.00'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Stock / Par</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Line Total</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {draft.items?.map((item, idx) => {
                    const ing = ingredients.find(i => i.id === item.ingredient_id);
                    const currentStock = ing?.current_stock || 0;
                    const parLevel = ing?.max_stock_level || ing?.min_stock_level || 0;
                    const isLowStock = currentStock <= (ing?.min_stock_level || 0);

                    return (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={isLowStock ? 'bg-red-50' : ''}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{item.ingredient_name}</p>
                            <p className="text-xs text-slate-500">{item.unit}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-slate-700'}`}>
                              {currentStock} / {parLevel}
                            </div>
                            {isLowStock && (
                              <Badge className="bg-red-100 text-red-700 text-xs mt-1">Low Stock</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingItemId === idx ? (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQty = parseFloat(e.target.value) || 0;
                                const updatedItems = [...draft.items];
                                updatedItems[idx] = {
                                  ...item,
                                  quantity: newQty,
                                  total_cost: newQty * (item.unit_cost || 0)
                                };
                                setDraft({ ...draft, items: updatedItems });
                              }}
                              className="w-24 text-center"
                              autoFocus
                            />
                          ) : (
                            <div className="text-center font-semibold cursor-pointer" onClick={() => setEditingItemId(idx)}>
                              {item.quantity}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          £{(item.unit_cost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          £{(item.total_cost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {editingItemId === idx && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-8 bg-emerald-600"
                                  onClick={() => {
                                    updateQuantityMutation.mutate(draft.items);
                                  }}
                                >
                                  ✓
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8"
                                  onClick={() => {
                                    setEditingItemId(null);
                                    queryClient.invalidateQueries(['draft']);
                                  }}
                                >
                                  ✕
                                </Button>
                              </>
                            )}
                            {editingItemId !== idx && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => removeItemMutation.mutate(idx)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
        <Button
          variant="destructive"
          onClick={() => deleteDraftMutation.mutate()}
          disabled={deleteDraftMutation.isPending}
        >
          Delete Draft
        </Button>
        <Button
          onClick={() => setShowPlaceDialog(true)}
          disabled={!draft.items || draft.items.length === 0}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700"
        >
          <Send className="w-4 h-4 mr-2" />
          Place Order
        </Button>
      </div>

      {/* Place Order Confirmation Dialog */}
      <Dialog open={showPlaceDialog} onOpenChange={setShowPlaceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Order with {supplier?.name}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">Order Number</p>
              <p className="text-lg font-mono font-bold">{draft.order_number}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">Items</p>
              <p className="text-lg font-bold">{draft.items?.length || 0} products</p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-700">Total Amount</p>
              <p className="text-3xl font-bold text-emerald-700">£{draft.total_amount?.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-semibold text-blue-900 mb-2">Next Steps:</p>
              <ul className="text-blue-800 space-y-1 list-disc list-inside">
                <li>Email sent to {supplier?.email}</li>
                <li>Order status changes to "Placed"</li>
                <li>Track delivery in Orders tab</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPlaceDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => placeOrderMutation.mutate()}
              disabled={placeOrderMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {placeOrderMutation.isPending ? 'Placing...' : 'Confirm & Place Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  CheckCircle,
  Mail,
  Copy,
  Download,
  Calculator,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

export default function OrderByDishDialog({ menuItem, onClose }) {
  const [servings, setServings] = useState(10);
  const [autoSendEmail, setAutoSendEmail] = useState(false);
  const [orderGenerated, setOrderGenerated] = useState(false);
  const [orderData, setOrderData] = useState(null);

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => base44.entities.Ingredient.list(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list(),
  });

  // Calculate requirements
  const calculateRequirements = () => {
    if (!menuItem?.ingredients) return [];

    return menuItem.ingredients.map(ingredient => {
      const requiredQty = (ingredient.quantity || 0) * servings;
      
      // Find matching inventory item
      const inventoryItem = ingredients.find(inv => 
        inv.name?.toLowerCase().includes(ingredient.ingredient_name?.toLowerCase()) ||
        ingredient.ingredient_name?.toLowerCase().includes(inv.name?.toLowerCase())
      );

      const currentStock = inventoryItem?.current_stock || 0;
      const needsOrder = currentStock < requiredQty;
      const orderQuantity = Math.max(0, requiredQty - currentStock);
      
      // Calculate available servings
      const availableServings = ingredient.quantity > 0 
        ? Math.floor(currentStock / ingredient.quantity) 
        : 0;

      return {
        ...ingredient,
        required_quantity: requiredQty,
        current_stock: currentStock,
        needs_order: needsOrder,
        order_quantity: orderQuantity,
        available_servings: availableServings,
        supplier_id: inventoryItem?.supplier_id,
        supplier_name: inventoryItem?.supplier_name,
        inventory_id: inventoryItem?.id,
        stock_status: currentStock >= requiredQty ? 'sufficient' : currentStock > 0 ? 'partial' : 'out'
      };
    });
  };

  const requirements = calculateRequirements();
  const needsOrdering = requirements.filter(r => r.needs_order);
  const totalCost = requirements.reduce((sum, r) => 
    sum + (r.order_quantity * (r.cost_per_unit || 0)), 0
  );

  // Group by supplier
  const ordersBySupplier = needsOrdering.reduce((acc, item) => {
    const supplierName = item.supplier_name || 'Unknown Supplier';
    if (!acc[supplierName]) {
      acc[supplierName] = {
        supplier_id: item.supplier_id,
        supplier_name: supplierName,
        items: []
      };
    }
    acc[supplierName].items.push(item);
    return acc;
  }, {});

  const handleGenerateOrder = async () => {
    const orderDetails = {
      menu_item: menuItem.name,
      servings: servings,
      generated_at: new Date().toISOString(),
      orders_by_supplier: ordersBySupplier,
      total_cost: totalCost,
      requirements: requirements
    };

    setOrderData(orderDetails);
    setOrderGenerated(true);

    // If auto-send is enabled, send emails
    if (autoSendEmail) {
      await sendOrderEmails(ordersBySupplier);
    }
  };

  const sendOrderEmails = async (supplierOrders) => {
    for (const [supplierName, order] of Object.entries(supplierOrders)) {
      const supplier = suppliers.find(s => s.name === supplierName);
      if (!supplier?.email) continue;

      const itemsTable = order.items.map(item => 
        `${item.ingredient_name} | ${item.order_quantity.toFixed(2)} ${item.unit}`
      ).join('\n');

      const emailBody = `Hello ${supplier.contact_person || supplierName},

Please prepare the following order for Chai Patta:

INGREDIENT | QUANTITY
${itemsTable}

Required for: ${servings} servings of ${menuItem.name}
Total Order Value: £${order.items.reduce((sum, i) => sum + (i.order_quantity * (i.cost_per_unit || 0)), 0).toFixed(2)}

Please confirm availability and delivery time.

Thank you,
AURA System – Chai Patta Operations`;

      try {
        await base44.integrations.Core.SendEmail({
          to: supplier.email,
          subject: `Ingredient Order Request – ${menuItem.name}`,
          body: emailBody,
          from_name: 'Chai Patta AURA'
        });
      } catch (error) {
        console.error('Failed to send email to', supplierName, error);
      }
    }

    // Create order records
    for (const [supplierName, order] of Object.entries(supplierOrders)) {
      try {
        await base44.entities.Order.create({
          supplier_id: order.supplier_id,
          supplier_name: supplierName,
          items: order.items.map(item => ({
            ingredient_id: item.inventory_id,
            ingredient_name: item.ingredient_name,
            quantity: item.order_quantity,
            unit: item.unit,
            unit_cost: item.cost_per_unit,
            total_cost: item.order_quantity * (item.cost_per_unit || 0)
          })),
          total_amount: order.items.reduce((sum, i) => 
            sum + (i.order_quantity * (i.cost_per_unit || 0)), 0
          ),
          status: 'pending',
          order_date: new Date().toISOString().split('T')[0],
          notes: `Auto-generated for ${servings} servings of ${menuItem.name}`
        });
      } catch (error) {
        console.error('Failed to create order for', supplierName, error);
      }
    }
  };

  const copyOrderList = () => {
    const text = Object.entries(ordersBySupplier).map(([supplierName, order]) => {
      const items = order.items.map(item => 
        `  - ${item.ingredient_name}: ${item.order_quantity.toFixed(2)} ${item.unit}`
      ).join('\n');
      return `${supplierName}:\n${items}`;
    }).join('\n\n');

    navigator.clipboard.writeText(text);
  };

  const exportToPDF = () => {
    // Simple CSV export as PDF generation requires additional library
    const csv = [
      ['Supplier', 'Ingredient', 'Quantity', 'Unit', 'Cost per Unit', 'Total Cost'],
      ...Object.entries(ordersBySupplier).flatMap(([supplier, order]) =>
        order.items.map(item => [
          supplier,
          item.ingredient_name,
          item.order_quantity.toFixed(2),
          item.unit,
          (item.cost_per_unit || 0).toFixed(2),
          (item.order_quantity * (item.cost_per_unit || 0)).toFixed(2)
        ])
      )
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-${menuItem.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-none p-6 border-b">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Order Ingredients</h2>
            <p className="text-slate-500">For {menuItem.name}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {!orderGenerated ? (
            <>
              {/* Servings Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    How many servings?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      value={servings}
                      onChange={(e) => setServings(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      className="text-2xl font-bold h-16 text-center"
                    />
                    <div className="text-sm text-slate-500">
                      <p>servings of</p>
                      <p className="font-semibold text-slate-700">{menuItem.name}</p>
                    </div>
                  </div>
                  
                  {/* Quick buttons */}
                  <div className="flex gap-2 mt-4">
                    {[10, 25, 50, 100].map(qty => (
                      <Button
                        key={qty}
                        variant="outline"
                        size="sm"
                        onClick={() => setServings(qty)}
                      >
                        {qty}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Requirements Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Ingredient Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ingredient</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>In Stock</TableHead>
                        <TableHead>To Order</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requirements.map((req, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">
                            {req.ingredient_name}
                          </TableCell>
                          <TableCell>
                            {req.required_quantity.toFixed(2)} {req.unit}
                          </TableCell>
                          <TableCell>
                            {req.current_stock.toFixed(2)} {req.unit}
                            <p className="text-xs text-slate-500">
                              ~{req.available_servings} servings
                            </p>
                          </TableCell>
                          <TableCell>
                            {req.needs_order ? (
                              <span className="font-semibold text-amber-600">
                                {req.order_quantity.toFixed(2)} {req.unit}
                              </span>
                            ) : (
                              <span className="text-emerald-600">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              req.stock_status === 'sufficient' 
                                ? 'bg-emerald-100 text-emerald-700'
                                : req.stock_status === 'partial'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }>
                              {req.stock_status === 'sufficient' && '✓ Available'}
                              {req.stock_status === 'partial' && '⚠ Low Stock'}
                              {req.stock_status === 'out' && '✗ Out of Stock'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Summary */}
              {needsOrdering.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-amber-900 mb-1">
                          Order Required
                        </h3>
                        <p className="text-sm text-amber-700">
                          {needsOrdering.length} ingredient{needsOrdering.length > 1 ? 's' : ''} need to be ordered from suppliers.
                        </p>
                        <p className="text-sm text-amber-700 mt-2">
                          Estimated cost: <span className="font-bold">£{totalCost.toFixed(2)}</span>
                        </p>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={autoSendEmail}
                          onCheckedChange={setAutoSendEmail}
                          id="auto-send"
                        />
                        <label htmlFor="auto-send" className="text-sm text-amber-900 cursor-pointer">
                          Auto-send order emails to suppliers
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {needsOrdering.length === 0 && (
                <Card className="border-emerald-200 bg-emerald-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                      <div>
                        <h3 className="font-semibold text-emerald-900">
                          All Stock Available!
                        </h3>
                        <p className="text-sm text-emerald-700">
                          You have enough ingredients in stock for {servings} servings.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            /* Order Generated View */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                    <h3 className="font-semibold text-emerald-900">Order Generated!</h3>
                  </div>
                  {autoSendEmail && (
                    <p className="text-sm text-emerald-700">
                      Order emails have been sent to suppliers and orders saved to history.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Orders by Supplier */}
              {Object.entries(ordersBySupplier).map(([supplierName, order]) => (
                <Card key={supplierName}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{supplierName}</span>
                      <Badge variant="outline">
                        {order.items.length} items
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                          <span className="font-medium">{item.ingredient_name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-600">
                              {item.order_quantity.toFixed(2)} {item.unit}
                            </span>
                            <span className="font-semibold text-slate-800">
                              £{(item.order_quantity * (item.cost_per_unit || 0)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-4" />
                    <div className="flex justify-between font-bold">
                      <span>Subtotal</span>
                      <span>£{order.items.reduce((sum, i) => 
                        sum + (i.order_quantity * (i.cost_per_unit || 0)), 0
                      ).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex-none p-6 border-t bg-slate-50">
        <div className="flex gap-3">
          {!orderGenerated ? (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleGenerateOrder}
                disabled={needsOrdering.length === 0 && servings > 0}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700"
              >
                {needsOrdering.length > 0 ? (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Generate Order
                  </>
                ) : (
                  'Stock Available'
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={copyOrderList}>
                <Copy className="w-4 h-4 mr-2" />
                Copy List
              </Button>
              <Button variant="outline" onClick={exportToPDF}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={onClose} className="flex-1 bg-emerald-600">
                Done
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
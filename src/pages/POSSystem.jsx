import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, ShoppingCart, Trash2, Check, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';

export default function POSSystem() {
  const [cart, setCart] = useState([]);
  const [saleType, setSaleType] = useState('dine_in');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.log('User not loaded');
      }
    };
    loadUser();
  }, []);

  const { data: menuItems = [], isLoading: menuLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const { data: addOns = [] } = useQuery({
    queryKey: ['addOns'],
    queryFn: () => base44.entities.AddOn.list(),
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => base44.entities.Ingredient.list(),
  });

  const processSaleMutation = useMutation({
    mutationFn: async (saleData) => {
      // Create sale record
      const sale = await base44.entities.Sale.create(saleData);
      
      // Deduct stock for each item
      for (const item of saleData.items) {
        const menuItem = menuItems.find(m => m.id === item.menu_item_id);
        if (menuItem?.ingredients) {
          for (const ing of menuItem.ingredients) {
            const ingredient = ingredients.find(i => i.id === ing.ingredient_id);
            if (ingredient) {
              const newStock = ingredient.current_stock - (ing.quantity * item.quantity);
              await base44.entities.Ingredient.update(ingredient.id, {
                current_stock: newStock
              });

              // Check if stock is below minimum and create alert
              if (newStock <= ingredient.min_stock_level) {
                await base44.entities.StockAlert.create({
                  alert_type: newStock <= 0 ? 'out_of_stock' : 'low_stock',
                  ingredient_id: ingredient.id,
                  ingredient_name: ingredient.name,
                  current_stock: newStock,
                  minimum_stock: ingredient.min_stock_level,
                  severity: newStock <= 0 ? 'critical' : 'high',
                  message: `${ingredient.name} is ${newStock <= 0 ? 'out of stock' : 'running low'}`,
                  action_required: 'Reorder immediately'
                });
              }
            }
          }
        }

        // Deduct stock for add-ons
        if (item.add_ons) {
          for (const addOn of item.add_ons) {
            const addOnData = addOns.find(a => a.id === addOn.add_on_id);
            if (addOnData?.ingredients) {
              for (const ing of addOnData.ingredients) {
                const ingredient = ingredients.find(i => i.id === ing.ingredient_id);
                if (ingredient) {
                  const newStock = ingredient.current_stock - (ing.quantity * addOn.quantity * item.quantity);
                  await base44.entities.Ingredient.update(ingredient.id, {
                    current_stock: newStock
                  });
                }
              }
            }
          }
        }
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ingredients']);
      queryClient.invalidateQueries(['stockAlerts']);
      toast.success('Sale processed and stock updated!');
      setCart([]);
      setShowConfirmDialog(false);
    },
    onError: (error) => {
      toast.error('Failed to process sale');
      console.error(error);
    }
  });

  const addToCart = (item) => {
    const existingItem = cart.find(c => c.menu_item_id === item.id);
    if (existingItem) {
      setCart(cart.map(c => 
        c.menu_item_id === item.id 
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, {
        menu_item_id: item.id,
        menu_item_name: item.name,
        quantity: 1,
        unit_price: item.price,
        unit_cost: item.cost || 0,
        add_ons: []
      }]);
    }
  };

  const updateQuantity = (itemId, delta) => {
    setCart(cart.map(item => {
      if (item.menu_item_id === itemId) {
        const newQuantity = item.quantity + delta;
        return newQuantity <= 0 ? null : { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.menu_item_id !== itemId));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalCost = 0;

    cart.forEach(item => {
      const itemPrice = item.unit_price * item.quantity;
      const itemCost = item.unit_cost * item.quantity;
      
      let addOnsPrice = 0;
      let addOnsCost = 0;
      
      if (item.add_ons) {
        item.add_ons.forEach(addOn => {
          addOnsPrice += addOn.price * addOn.quantity;
          addOnsCost += addOn.cost * addOn.quantity;
        });
      }

      subtotal += itemPrice + addOnsPrice;
      totalCost += itemCost + addOnsCost;
    });

    const grossProfit = subtotal - totalCost;
    const gpPercentage = subtotal > 0 ? ((grossProfit / subtotal) * 100).toFixed(1) : 0;

    return { subtotal, totalCost, grossProfit, gpPercentage };
  };

  const handleCheckout = () => {
    setShowConfirmDialog(true);
  };

  const confirmSale = () => {
    const totals = calculateTotals();
    const saleNumber = `SALE-${Date.now()}`;

    const saleData = {
      sale_number: saleNumber,
      sale_type: saleType,
      items: cart.map(item => ({
        ...item,
        total_price: item.unit_price * item.quantity,
        total_cost: item.unit_cost * item.quantity
      })),
      subtotal: totals.subtotal,
      total_cost: totals.totalCost,
      total_price: totals.subtotal,
      gross_profit: totals.grossProfit,
      gp_percentage: parseFloat(totals.gpPercentage),
      stock_deducted: true,
      staff_email: user?.email || '',
      staff_name: user?.full_name || '',
      sale_date: new Date().toISOString()
    };

    processSaleMutation.mutate(saleData);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory && item.is_active;
  });

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];
  const totals = calculateTotals();

  if (menuLoading) return <LoadingSpinner message="Loading menu..." />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Point of Sale"
        description="Process sales with automatic stock deduction"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Menu</CardTitle>
                <Select value={saleType} onValueChange={setSaleType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dine_in">Dine In</SelectItem>
                    <SelectItem value="takeaway">Takeaway</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <ScrollArea className="h-16">
                <div className="flex gap-2">
                  {categories.map(cat => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Button>
                  ))}
                </div>
              </ScrollArea>

              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredItems.map(item => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => addToCart(item)}
                    >
                      <CardContent className="p-4 space-y-2">
                        <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-emerald-600">
                            £{item.price?.toFixed(2)}
                          </span>
                          {item.dietary_tag && (
                            <Badge variant="outline" className="text-xs">
                              {item.dietary_tag}
                            </Badge>
                          )}
                        </div>
                        {item.cost && (
                          <div className="text-xs text-slate-500">
                            Cost: £{item.cost.toFixed(2)} | GP: {item.profit_margin?.toFixed(0)}%
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Cart */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Cart is empty
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[400px] mb-4">
                    <div className="space-y-3">
                      {cart.map(item => (
                        <Card key={item.menu_item_id}>
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{item.menu_item_name}</h4>
                                <p className="text-xs text-slate-500">
                                  £{item.unit_price.toFixed(2)} × {item.quantity}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => removeFromCart(item.menu_item_id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(item.menu_item_id, -1)}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(item.menu_item_id, 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                              <span className="font-semibold">
                                £{(item.unit_price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="space-y-3 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span className="font-semibold">£{totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Total Cost</span>
                      <span>£{totals.totalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Gross Profit</span>
                      <span className="text-emerald-600 font-semibold">
                        £{totals.grossProfit.toFixed(2)} ({totals.gpPercentage}%)
                      </span>
                    </div>
                    
                    <Button
                      onClick={handleCheckout}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      size="lg"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Complete Sale - £{totals.subtotal.toFixed(2)}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Sale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Stock will be deducted automatically</p>
                  <p>This action will reduce ingredient stock levels for all items in this sale.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Sale Type:</span>
                <span className="font-semibold capitalize">{saleType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Amount:</span>
                <span className="font-semibold text-lg">£{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Gross Profit:</span>
                <span className="font-semibold text-emerald-600">
                  £{totals.grossProfit.toFixed(2)} ({totals.gpPercentage}%)
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmSale}
                disabled={processSaleMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {processSaleMutation.isPending ? 'Processing...' : 'Confirm Sale'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
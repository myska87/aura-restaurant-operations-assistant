import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ShoppingCart,
  Truck,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  TrendingDown,
  TrendingUp,
  DollarSign,
  BarChart3,
  CheckCircle,
  Eye,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import PageHeader from '@/components/ui/PageHeader';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import DeliveryReceivingModal from '@/components/inventory/DeliveryReceivingModal';
import OrderDetailsDialog from '@/components/inventory/OrderDetailsDialog';
import OrderDraftManager from '@/components/inventory/OrderDraftManager';

const ingredientCategories = [
  { value: 'produce', label: 'Produce', color: 'bg-green-100 text-green-700' },
  { value: 'dairy', label: 'Dairy', color: 'bg-blue-100 text-blue-700' },
  { value: 'meat', label: 'Meat', color: 'bg-red-100 text-red-700' },
  { value: 'seafood', label: 'Seafood', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'dry_goods', label: 'Dry Goods', color: 'bg-amber-100 text-amber-700' },
  { value: 'beverages', label: 'Beverages', color: 'bg-purple-100 text-purple-700' },
  { value: 'spices', label: 'Spices', color: 'bg-orange-100 text-orange-700' },
  { value: 'frozen', label: 'Frozen', color: 'bg-slate-100 text-slate-700' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700' }
];

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('ingredients');
  const [showIngredientForm, setShowIngredientForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [orderCart, setOrderCart] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [editingStockId, setEditingStockId] = useState(null);
  const [tempStockValue, setTempStockValue] = useState('');
  const [user, setUser] = useState(null);
  const [receivingOrder, setReceivingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [editingDraftId, setEditingDraftId] = useState(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.log('User not authenticated');
      }
    };
    loadUser();
  }, []);

  const { data: ingredients = [], isLoading: loadingIngredients } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => base44.entities.Ingredient.list('name'),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list('name'),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const { data: drafts = [] } = useQuery({
    queryKey: ['drafts'],
    queryFn: async () => {
      const allOrders = await base44.entities.Order.list('-created_date');
      return allOrders.filter(o => o.status === 'draft');
    }
  });

  // Sort orders: uncompleted first (by date), then completed at bottom (by date)
  const sortedOrders = [...orders].sort((a, b) => {
    const aCompleted = a.status === 'received' || a.status === 'rejected';
    const bCompleted = b.status === 'received' || b.status === 'rejected';
    
    if (aCompleted && !bCompleted) return 1;
    if (!aCompleted && bCompleted) return -1;
    
    // Within same group, sort by date (newest first)
    return new Date(b.created_date) - new Date(a.created_date);
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const ingredientMutation = useMutation({
    mutationFn: ({ id, data }) => id 
      ? base44.entities.Ingredient.update(id, data)
      : base44.entities.Ingredient.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ingredients']);
      setShowIngredientForm(false);
      setEditingIngredient(null);
    }
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ ingredientId, newStock, previousStock, ingredientName, unit }) => {
      // Update ingredient stock
      await base44.entities.Ingredient.update(ingredientId, {
        current_stock: newStock
      });

      // Create audit log if entity exists
      try {
        await base44.entities.InventoryTransaction.create({
          transaction_type: 'adjustment',
          ingredient_id: ingredientId,
          ingredient_name: ingredientName,
          quantity_change: newStock - previousStock,
          unit: unit,
          stock_before: previousStock,
          stock_after: newStock,
          executed_by: user?.email || 'Unknown',
          notes: `Manual stock update from ${previousStock} to ${newStock}`,
        });
      } catch (e) {
        console.log('Audit log not created - entity may not exist');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ingredients']);
      setEditingStockId(null);
      setTempStockValue('');
    }
  });

  const supplierMutation = useMutation({
    mutationFn: ({ id, data }) => id 
      ? base44.entities.Supplier.update(id, data)
      : base44.entities.Supplier.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      setShowSupplierForm(false);
      setEditingSupplier(null);
    }
  });

  const orderMutation = useMutation({
    mutationFn: (data) => base44.entities.Order.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      setShowOrderForm(false);
      setOrderCart([]);
    }
  });

  const deleteIngredientMutation = useMutation({
    mutationFn: (id) => base44.entities.Ingredient.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['ingredients'])
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, newStatus }) => base44.entities.Order.update(orderId, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      toast.success('Order status updated');
    }
  });

  const refillOrderMutation = useMutation({
    mutationFn: async (originalOrder) => {
      const newOrderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      return base44.entities.Order.create({
        order_number: newOrderNumber,
        supplier_id: originalOrder.supplier_id,
        supplier_name: originalOrder.supplier_name,
        items: originalOrder.items,
        total_amount: originalOrder.total_amount,
        status: 'pending',
        order_type: 'stock_replenish',
        order_date: format(new Date(), 'yyyy-MM-dd'),
        notes: `Refill order based on ${originalOrder.order_number}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      toast.success('Refill order created successfully');
    }
  });

  const lowStockItems = ingredients.filter(i => i.current_stock <= i.min_stock_level);
  
  const filteredIngredients = ingredients.filter(ing => {
    const matchesSearch = ing.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || ing.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockPercentage = (item) => {
    if (!item.max_stock_level || item.max_stock_level === 0) return 50;
    return Math.min((item.current_stock / item.max_stock_level) * 100, 100);
  };

  const getStockStatus = (item) => {
    if (item.current_stock <= item.min_stock_level) return { color: 'bg-red-500', label: 'Low' };
    if (item.current_stock <= item.min_stock_level * 1.5) return { color: 'bg-amber-500', label: 'Medium' };
    return { color: 'bg-emerald-500', label: 'Good' };
  };

  const addToCart = async (ingredient) => {
    // Find or create draft for this supplier
    let targetDraft = drafts.find(d => d.supplier_id === ingredient.supplier_id);

    if (!targetDraft) {
      // Create new draft
      const newDraftNumber = `DRAFT-${Date.now().toString(36).toUpperCase()}`;
      const supplier = suppliers.find(s => s.id === ingredient.supplier_id);
      
      targetDraft = await base44.entities.Order.create({
        order_number: newDraftNumber,
        supplier_id: ingredient.supplier_id,
        supplier_name: supplier?.name || 'Unknown',
        items: [{
          ingredient_id: ingredient.id,
          ingredient_name: ingredient.name,
          quantity: ingredient.reorder_quantity || 1,
          unit: ingredient.unit,
          unit_cost: ingredient.cost_per_unit || 0,
          total_cost: (ingredient.reorder_quantity || 1) * (ingredient.cost_per_unit || 0)
        }],
        total_amount: (ingredient.reorder_quantity || 1) * (ingredient.cost_per_unit || 0),
        status: 'draft',
        order_type: 'manual'
      });

      queryClient.invalidateQueries(['drafts']);
      toast.success('New draft created');
    } else {
      // Add to existing draft
      const existing = targetDraft.items.find(i => i.ingredient_id === ingredient.id);
      let updatedItems;

      if (existing) {
        updatedItems = targetDraft.items.map(i =>
          i.ingredient_id === ingredient.id
            ? { ...i, quantity: i.quantity + (ingredient.reorder_quantity || 1), total_cost: (i.quantity + (ingredient.reorder_quantity || 1)) * i.unit_cost }
            : i
        );
      } else {
        updatedItems = [...targetDraft.items, {
          ingredient_id: ingredient.id,
          ingredient_name: ingredient.name,
          quantity: ingredient.reorder_quantity || 1,
          unit: ingredient.unit,
          unit_cost: ingredient.cost_per_unit || 0,
          total_cost: (ingredient.reorder_quantity || 1) * (ingredient.cost_per_unit || 0)
        }];
      }

      const newTotal = updatedItems.reduce((sum, i) => sum + i.total_cost, 0);
      
      await base44.entities.Order.update(targetDraft.id, {
        items: updatedItems,
        total_amount: newTotal
      });

      queryClient.invalidateQueries(['drafts']);
      toast.success('Added to draft');
    }
  };

  const sendOrderEmail = async (supplier) => {
    const supplierItems = orderCart.filter(i => {
      const ing = ingredients.find(x => x.id === i.ingredient_id);
      return ing?.supplier_id === supplier.id;
    });
    
    if (supplierItems.length === 0) return;
    
    const itemList = supplierItems.map(i => `- ${i.ingredient_name}: ${i.quantity} ${i.unit}`).join('\n');
    const total = supplierItems.reduce((sum, i) => sum + i.total_cost, 0);
    
    await base44.integrations.Core.SendEmail({
      to: supplier.email,
      subject: `New Order Request - ${format(new Date(), 'MMM d, yyyy')}`,
      body: `Dear ${supplier.contact_person || supplier.name},\n\nWe would like to place the following order:\n\n${itemList}\n\nEstimated Total: £${total.toFixed(2)}\n\nPlease confirm availability and delivery date.\n\nThank you.`
    });
    
    await orderMutation.mutateAsync({
      order_number: `ORD-${Date.now().toString(36).toUpperCase()}`,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      items: supplierItems,
      total_amount: total,
      status: 'pending',
      order_date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const handleIngredientSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    ['current_stock', 'min_stock_level', 'max_stock_level', 'cost_per_unit', 'reorder_quantity'].forEach(field => {
      if (data[field]) data[field] = parseFloat(data[field]);
    });
    
    // Add supplier_name based on supplier_id
    if (data.supplier_id) {
      const supplier = suppliers.find(s => s.id === data.supplier_id);
      if (supplier) {
        data.supplier_name = supplier.name;
      }
    }
    
    ingredientMutation.mutate({ 
      id: editingIngredient?.id, 
      data 
    });
  };

  const handleSupplierSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    supplierMutation.mutate({ 
      id: editingSupplier?.id, 
      data 
    });
  };

  // Calculate menu item costs
  const getMenuItemCost = (menuItem) => {
    if (!menuItem.ingredients) return 0;
    return menuItem.ingredients.reduce((total, ing) => {
      const ingredient = ingredients.find(i => i.id === ing.ingredient_id);
      return total + (ingredient?.cost_per_unit || 0) * (ing.quantity || 0);
    }, 0);
  };

  const menuProfitData = menuItems.map(item => ({
    ...item,
    cost: getMenuItemCost(item),
    profit: item.price - getMenuItemCost(item),
    margin: item.price > 0 ? ((item.price - getMenuItemCost(item)) / item.price * 100) : 0
  })).sort((a, b) => b.margin - a.margin);

  if (loadingIngredients) return <LoadingSpinner message="Loading inventory..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory & Production"
        description={`${ingredients.length} ingredients tracked`}
      />

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-800">Low Stock Alert</h3>
                <p className="text-sm text-amber-600">{lowStockItems.length} items need reordering</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                lowStockItems.forEach(addToCart);
                setShowOrderForm(true);
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add All to Cart
            </Button>
          </div>
        </motion.div>
      )}

      {/* Main Tabs */}
       <Tabs value={activeTab} onValueChange={setActiveTab}>
         <TabsList className="bg-white border">
           <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
           <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
           <TabsTrigger value="drafts">
             Drafts {drafts.length > 0 && <Badge className="ml-2 bg-amber-500">{drafts.length}</Badge>}
           </TabsTrigger>
           <TabsTrigger value="orders">Orders</TabsTrigger>
           <TabsTrigger value="ordered">Ordered</TabsTrigger>
           <TabsTrigger value="analysis">Cost Analysis</TabsTrigger>
         </TabsList>

        {/* Ingredients Tab */}
        <TabsContent value="ingredients" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {ingredientCategories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => { setEditingIngredient(null); setShowIngredientForm(true); }}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Ingredient
            </Button>

          </div>

          {filteredIngredients.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No ingredients found"
              description="Add your first ingredient to start tracking inventory."
              action={() => setShowIngredientForm(true)}
              actionLabel="Add Ingredient"
            />
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Quick Update</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Price/Unit
                      </div>
                    </TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIngredients.map((ing) => {
                    const stockStatus = getStockStatus(ing);
                    const categoryInfo = ingredientCategories.find(c => c.value === ing.category);
                    
                    return (
                      <TableRow key={ing.id}>
                        <TableCell className="font-medium">{ing.name}</TableCell>
                        <TableCell>
                          <Badge className={categoryInfo?.color}>
                            {categoryInfo?.label || ing.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Progress 
                              value={getStockPercentage(ing)} 
                              className="w-20 h-2"
                            />
                            <span className="text-sm">
                              {ing.current_stock} {ing.unit}
                            </span>
                            <Badge className={`${stockStatus.color} text-white text-xs`}>
                              {stockStatus.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingStockId === ing.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={tempStockValue}
                                onChange={(e) => setTempStockValue(e.target.value)}
                                className="w-20 h-8"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                className="h-8 bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => {
                                  const newStock = parseFloat(tempStockValue);
                                  if (!isNaN(newStock) && newStock >= 0) {
                                    updateStockMutation.mutate({
                                      ingredientId: ing.id,
                                      newStock,
                                      previousStock: ing.current_stock || 0,
                                      ingredientName: ing.name,
                                      unit: ing.unit
                                    });
                                  }
                                }}
                                disabled={updateStockMutation.isPending}
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8"
                                onClick={() => {
                                  setEditingStockId(null);
                                  setTempStockValue('');
                                }}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={() => {
                                setEditingStockId(ing.id);
                                setTempStockValue(ing.current_stock?.toString() || '0');
                              }}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Update
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-slate-800">£{ing.cost_per_unit?.toFixed(2) || '0.00'}</span>
                        </TableCell>
                        <TableCell>{ing.supplier_name || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => addToCart(ing)}
                            >
                              <ShoppingCart className="w-4 h-4 text-amber-600" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setEditingIngredient(ing); setShowIngredientForm(true); }}>
                                  <Edit className="w-4 h-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => deleteIngredientMutation.mutate(ing.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Drafts Tab */}
        <TabsContent value="drafts" className="space-y-4 mt-4">
          {editingDraftId ? (
            <OrderDraftManager
              draftId={editingDraftId}
              suppliers={suppliers}
              ingredients={ingredients}
              onClose={() => setEditingDraftId(null)}
            />
          ) : (
            <div className="space-y-4">
              {drafts.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="pt-12 text-center">
                    <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 text-lg">No draft orders yet</p>
                    <p className="text-slate-400 text-sm">Add items from Ingredients tab to create a draft</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {drafts.map((draft) => {
                    const supplier = suppliers.find(s => s.id === draft.supplier_id);
                    const lowStockCount = draft.items?.filter(item => {
                      const ing = ingredients.find(i => i.id === item.ingredient_id);
                      return ing && (ing.current_stock || 0) <= (ing.min_stock_level || 0);
                    }).length || 0;

                    return (
                      <motion.div
                        key={draft.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-bold text-slate-900">{draft.order_number}</h3>
                                <p className="text-slate-600">{supplier?.name || 'Unknown Supplier'}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-3xl font-bold text-emerald-600">
                                  £{draft.total_amount?.toFixed(2) || '0.00'}
                                </div>
                                <p className="text-sm text-slate-500">{draft.items?.length || 0} items</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                              <Badge className="bg-amber-100 text-amber-800">DRAFT</Badge>
                              {lowStockCount > 0 && (
                                <Badge className="bg-red-100 text-red-700">{lowStockCount} Low Stock</Badge>
                              )}
                            </div>

                            <Button
                              onClick={() => setEditingDraftId(draft.id)}
                              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700"
                            >
                              <Package className="w-4 h-4 mr-2" />
                              Edit & Review Draft
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button 
              onClick={() => { setEditingSupplier(null); setShowSupplierForm(true); }}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{supplier.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingSupplier(supplier); setShowSupplierForm(true); }}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-slate-600">
                    {supplier.contact_person && <p>Contact: {supplier.contact_person}</p>}
                    <p>{supplier.email}</p>
                    {supplier.phone && <p>{supplier.phone}</p>}
                  </div>
                  <Badge variant="outline" className="mt-3">
                    {ingredientCategories.find(c => c.value === supplier.category)?.label || supplier.category}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">{order.order_number}</TableCell>
                    <TableCell>{order.supplier_name}</TableCell>
                    <TableCell>{order.order_date}</TableCell>
                    <TableCell>{order.items?.length || 0} items</TableCell>
                    <TableCell>£{order.total_amount?.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={
                        order.status === 'received' ? 'bg-emerald-500 text-white' :
                        order.status === 'delivered' ? 'bg-purple-500 text-white' :
                        order.status === 'confirmed' ? 'bg-blue-500 text-white' :
                        order.status === 'rejected' ? 'bg-red-500 text-white' :
                        order.status === 'pending' ? 'bg-amber-500 text-white' :
                        'bg-slate-400 text-white'
                      }>
                        {order.status === 'pending' ? 'Order Placed' :
                         order.status === 'confirmed' ? 'Confirmed' :
                         order.status === 'delivered' ? 'Arrived' :
                         order.status === 'received' ? 'Received' :
                         order.status === 'rejected' ? 'Rejected' :
                         order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {/* View/Manage button for all orders */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingOrder(order)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>

                        {/* Status Management Dropdown for pending/confirmed orders */}
                        {(order.status === 'pending' || order.status === 'confirmed') && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                Manage <ChevronDown className="w-3 h-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {order.status === 'pending' && (
                                <DropdownMenuItem 
                                  onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, newStatus: 'confirmed' })}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                                  Confirm Order
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, newStatus: 'delivered' })}
                              >
                                <Truck className="w-4 h-4 mr-2 text-purple-600" />
                                Mark as Arrived
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}

                        {/* Receive button for delivered orders */}
                        {order.status === 'delivered' && (
                          <Button
                            size="sm"
                            onClick={() => setReceivingOrder(order)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Receive
                          </Button>
                        )}

                        {/* Refill button for received orders */}
                        {order.status === 'received' && (
                          <Button
                            size="sm"
                            onClick={() => refillOrderMutation.mutate(order)}
                            disabled={refillOrderMutation.isPending}
                            className="bg-amber-600 hover:bg-amber-700"
                          >
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            {refillOrderMutation.isPending ? 'Creating...' : 'Refill Order'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Ordered Tab */}
        <TabsContent value="ordered" className="space-y-4 mt-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => navigate(createPageUrl('Ordered'))}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700"
            >
              <Package className="w-4 h-4 mr-2" />
              View All Placed Orders
            </Button>
          </div>
          <iframe
            src={createPageUrl('Ordered')}
            className="w-full h-screen border-0 rounded-2xl"
            title="Placed Orders"
          />
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Top 5 Profit Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {menuProfitData.slice(0, 5).map((item, i) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-slate-500">Cost: £{item.cost.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">£{item.profit.toFixed(2)}</p>
                        <p className="text-xs text-emerald-600">{item.margin.toFixed(0)}% margin</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  Bottom 5 Profit Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {menuProfitData.slice(-5).reverse().map((item, i) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-slate-500">Cost: £{item.cost.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">£{item.profit.toFixed(2)}</p>
                        <p className="text-xs text-red-600">{item.margin.toFixed(0)}% margin</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Ingredient Form Dialog */}
      <Dialog open={showIngredientForm} onOpenChange={setShowIngredientForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleIngredientSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Name *</Label>
                <Input name="name" defaultValue={editingIngredient?.name} required />
              </div>
              <div>
                <Label>Category *</Label>
                <Select name="category" defaultValue={editingIngredient?.category || 'produce'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ingredientCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unit *</Label>
                <Select name="unit" defaultValue={editingIngredient?.unit || 'kg'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="units">units</SelectItem>
                    <SelectItem value="boxes">boxes</SelectItem>
                    <SelectItem value="bags">bags</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Current Stock</Label>
                <Input name="current_stock" type="number" step="0.01" defaultValue={editingIngredient?.current_stock || 0} />
              </div>
              <div>
                <Label>Min Stock Level</Label>
                <Input name="min_stock_level" type="number" step="0.01" defaultValue={editingIngredient?.min_stock_level} />
              </div>
              <div>
                <Label>Max Stock Level</Label>
                <Input name="max_stock_level" type="number" step="0.01" defaultValue={editingIngredient?.max_stock_level} />
              </div>
              <div className="col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Label className="text-amber-900 font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Cost per Unit (£) *
                </Label>
                <Input 
                  name="cost_per_unit" 
                  type="number" 
                  step="0.01" 
                  defaultValue={editingIngredient?.cost_per_unit} 
                  placeholder="0.00"
                  className="mt-1 border-amber-300 focus:border-amber-500"
                  required
                />
                <p className="text-xs text-amber-700 mt-1">Price per unit used for menu costing calculations</p>
              </div>
              <div>
                <Label>Reorder Quantity</Label>
                <Input name="reorder_quantity" type="number" step="0.01" defaultValue={editingIngredient?.reorder_quantity} />
              </div>
              <div>
                <Label>Supplier</Label>
                <Select name="supplier_id" defaultValue={editingIngredient?.supplier_id || ''}>
                  <SelectTrigger><SelectValue placeholder="Select supplier..." /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(sup => (
                      <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Storage Location</Label>
                <Input name="storage_location" defaultValue={editingIngredient?.storage_location} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowIngredientForm(false)}>Cancel</Button>
              <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-emerald-700">
                {editingIngredient ? 'Update' : 'Add'} Ingredient
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Supplier Form Dialog */}
      <Dialog open={showSupplierForm} onOpenChange={setShowSupplierForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSupplierSubmit} className="space-y-4">
            <div>
              <Label>Company Name *</Label>
              <Input name="name" defaultValue={editingSupplier?.name} required />
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input name="contact_person" defaultValue={editingSupplier?.contact_person} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input name="email" type="email" defaultValue={editingSupplier?.email} required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input name="phone" defaultValue={editingSupplier?.phone} />
            </div>
            <div>
              <Label>Category</Label>
              <Select name="category" defaultValue={editingSupplier?.category || 'produce'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ingredientCategories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowSupplierForm(false)}>Cancel</Button>
              <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-emerald-700">
                {editingSupplier ? 'Update' : 'Add'} Supplier
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Cart Dialog */}
      <Dialog open={showOrderForm} onOpenChange={setShowOrderForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Order Cart
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {orderCart.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.ingredient_name}</p>
                    <p className="text-sm text-slate-500">{item.quantity} {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">£{item.total_cost.toFixed(2)}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setOrderCart(orderCart.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>£{orderCart.reduce((sum, i) => sum + i.total_cost, 0).toFixed(2)}</span>
            </div>
            <div>
              <Label>Send to Supplier</Label>
              <Select value={selectedSupplier?.id || ''} onValueChange={(v) => setSelectedSupplier(suppliers.find(s => s.id === v))}>
                <SelectTrigger><SelectValue placeholder="Select supplier..." /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(sup => (
                    <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowOrderForm(false)}>Cancel</Button>
              <Button 
                onClick={async () => {
                  if (selectedSupplier) {
                    await sendOrderEmail(selectedSupplier);
                    setShowOrderForm(false);
                    setOrderCart([]);
                    setSelectedSupplier(null);
                  }
                }}
                disabled={!selectedSupplier || orderCart.length === 0 || orderMutation.isPending}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                {orderMutation.isPending ? 'Sending...' : 'Send Order'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delivery Receiving Modal */}
      <DeliveryReceivingModal
        order={receivingOrder}
        open={!!receivingOrder}
        onClose={() => setReceivingOrder(null)}
      />

      {/* Order Details, Print & Email Modal */}
      <OrderDetailsDialog 
        order={viewingOrder}
        open={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
      />
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Sparkles,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Download,
  Upload,
  AlertTriangle,
  Eye,
  FileText,
  ShoppingCart,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import MenuItemCard from '@/components/menu/MenuItemCard';
import MenuItemForm from '@/components/menu/MenuItemForm';
import AIMenuAssistant from '@/components/menu/AIMenuAssistant';
import OrderByDishDialog from '@/components/menu/OrderByDishDialog';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Menu() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('grid'); // grid or table
  const [showForm, setShowForm] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [orderingItem, setOrderingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterProfit, setFilterProfit] = useState('all');

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list('name'),
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => base44.entities.Ingredient.list(),
  });

  const { data: sops = [] } = useQuery({
    queryKey: ['sops'],
    queryFn: () => base44.entities.SOP.filter({ status: 'active' }),
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Creating menu item:', data);
      return await base44.entities.MenuItem.create(data);
    },
    onSuccess: (result) => {
      console.log('Menu item created successfully:', result);
      queryClient.invalidateQueries(['menuItems']);
      setShowForm(false);
      setEditingItem(null);
      alert('✅ Menu item created successfully!');
    },
    onError: (error) => {
      console.error('Error creating menu item:', error);
      alert('❌ Failed to create menu item: ' + (error.message || 'Unknown error'));
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      console.log('Updating menu item:', id, data);
      return await base44.entities.MenuItem.update(id, data);
    },
    onSuccess: (result) => {
      console.log('Menu item updated successfully:', result);
      queryClient.invalidateQueries(['menuItems']);
      setShowForm(false);
      setEditingItem(null);
      alert('✅ Menu item updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating menu item:', error);
      alert('❌ Failed to update menu item: ' + (error.message || 'Unknown error'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MenuItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['menuItems'])
  });

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesLocation = filterLocation === 'all' || item.preparation_location === filterLocation;
    
    let matchesProfit = true;
    if (filterProfit !== 'all') {
      const margin = item.profit_margin || 0;
      if (filterProfit === 'high') matchesProfit = margin >= 50;
      else if (filterProfit === 'medium') matchesProfit = margin >= 30 && margin < 50;
      else if (filterProfit === 'low') matchesProfit = margin < 30;
    }
    
    return matchesSearch && matchesCategory && matchesLocation && matchesProfit;
  });

  const handleSubmit = (data) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDuplicate = (item) => {
    const duplicated = {
      ...item,
      id: undefined,
      name: `${item.name} (Copy)`,
    };
    setEditingItem(duplicated);
    setShowForm(true);
  };

  const handleAIGenerate = (generatedData) => {
    setEditingItem(generatedData);
    setShowForm(true);
  };

  const handleViewSOP = (sopId) => {
    window.location.href = createPageUrl('SOPView') + '?id=' + sopId;
  };

  // Calculate stats
  const activeItems = menuItems.filter(i => i.is_active).length;
  const avgMargin = menuItems.length > 0 
    ? menuItems.reduce((sum, i) => sum + (i.profit_margin || 0), 0) / menuItems.length 
    : 0;
  const totalValue = menuItems.reduce((sum, i) => sum + (i.price || 0), 0);
  const lowMarginCount = menuItems.filter(i => (i.profit_margin || 0) < 30).length;

  const canEdit = ['manager', 'owner', 'admin'].includes(user?.role);

  if (isLoading) return <LoadingSpinner message="Loading menu..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu Management"
        description={`${menuItems.length} items • ${activeItems} active`}
      >
        <Button
          variant="outline"
          onClick={() => window.open(createPageUrl('MenuCostingDashboard'))}
          className="border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Costing Dashboard
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowAI(true)}
          className="border-purple-300 text-purple-700 hover:bg-purple-50"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          AI Assistant
        </Button>
        {canEdit && (
          <Button
            onClick={() => { setEditingItem(null); setShowForm(true); }}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Menu Item
          </Button>
        )}
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{menuItems.length}</p>
                <p className="text-xs text-slate-500">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgMargin.toFixed(0)}%</p>
                <p className="text-xs text-slate-500">Avg Margin</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">£{totalValue.toFixed(0)}</p>
                <p className="text-xs text-slate-500">Menu Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowMarginCount}</p>
                <p className="text-xs text-slate-500">Low Margin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="desi_breakfast">🍳 Desi Breakfast</SelectItem>
            <SelectItem value="desi_crepes">🥞 Desi Crepes</SelectItem>
            <SelectItem value="parotta_rolls">🌯 Parotta Rolls</SelectItem>
            <SelectItem value="parotta_kebabs">🍢 Parotta Kebabs</SelectItem>
            <SelectItem value="patta_bakes">🥖 Patta Bakes</SelectItem>
            <SelectItem value="fryer_heroes">🍟 Fryer Heroes</SelectItem>
            <SelectItem value="chaat">🥗 Chaat</SelectItem>
            <SelectItem value="chaipatta_bowls">🍜 Chai Patta Bowls</SelectItem>
            <SelectItem value="chai_street_presses">🥪 Chai Street Presses</SelectItem>
            <SelectItem value="vegetarian_street_food">🌱 Vegetarian Street Food</SelectItem>
            <SelectItem value="little_pattas">👶 Little Pattas</SelectItem>
            <SelectItem value="signature_karak_chai">☕ Signature Karak Chai</SelectItem>
            <SelectItem value="iced_karak">🧊 Iced Karak</SelectItem>
            <SelectItem value="coffee">☕ Coffee</SelectItem>
            <SelectItem value="speciality_drinks">🍹 Speciality Drinks</SelectItem>
            <SelectItem value="coolers_lassi">🥤 Coolers & Lassi</SelectItem>
            <SelectItem value="sweets_desserts">🍰 Sweets & Desserts</SelectItem>
            <SelectItem value="kids_drinks">🧃 Kids Drinks</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterProfit} onValueChange={setFilterProfit}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Profit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Profit</SelectItem>
            <SelectItem value="high">High (50%+)</SelectItem>
            <SelectItem value="medium">Medium (30-50%)</SelectItem>
            <SelectItem value="low">Low (&lt;30%)</SelectItem>
          </SelectContent>
        </Select>
        
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="grid">
              <Grid className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="table">
              <List className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Menu Items Display */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="No menu items found"
          description="Create your first menu item to get started."
          action={canEdit ? () => setShowForm(true) : undefined}
          actionLabel="Add Menu Item"
        />
      ) : view === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredItems.map((item, index) => (
              <MenuItemCard
                key={item.id}
                item={item}
                ingredients={ingredients}
                onEdit={canEdit ? (i) => { setEditingItem(i); setShowForm(true); } : undefined}
                onDuplicate={canEdit ? handleDuplicate : undefined}
                onDelete={canEdit ? (i) => deleteMutation.mutate(i.id) : undefined}
                onView={(i) => { setViewingItem(i); setShowDetails(true); }}
                onOrderIngredients={canEdit ? (i) => { setOrderingItem(i); setShowOrderDialog(true); } : undefined}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const profit = (item.price || 0) - (item.cost || 0);
                  const margin = item.profit_margin || 0;
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category?.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>£{item.price?.toFixed(2)}</TableCell>
                      <TableCell>£{item.cost?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        <Badge className={
                          margin >= 50 ? 'bg-emerald-100 text-emerald-700' :
                          margin >= 30 ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }>
                          {margin.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.preparation_location?.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.is_active ? (
                          <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => { setViewingItem(item); setShowDetails(true); }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}

      {/* Menu Item Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? 'Edit Menu Item' : 'Create Menu Item'}</DialogTitle>
          </DialogHeader>
          <MenuItemForm
            item={editingItem}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingItem(null); }}
            aiGenerating={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {viewingItem && (() => {
            const itemSOP = sops.find(s => s.id === viewingItem.sop_id);
            const itemRecipe = recipes.find(r => r.menu_item_id === viewingItem.id);
            
            return (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{viewingItem.name}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Image */}
                {viewingItem.image_url && (
                  <div className="aspect-video rounded-xl overflow-hidden">
                    <img src={viewingItem.image_url} alt={viewingItem.name} className="w-full h-full object-cover" />
                  </div>
                )}
                
                {/* Description */}
                <div>
                  <p className="text-slate-600">{viewingItem.description}</p>
                </div>
                
                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-slate-500 mb-1">Price</p>
                      <p className="text-2xl font-bold text-emerald-600">£{viewingItem.price?.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-slate-500 mb-1">Cost</p>
                      <p className="text-2xl font-bold text-slate-700">£{viewingItem.cost?.toFixed(2) || '0.00'}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-slate-500 mb-1">Profit Margin</p>
                      <p className={`text-2xl font-bold ${
                        viewingItem.profit_margin >= 50 ? 'text-emerald-600' :
                        viewingItem.profit_margin >= 30 ? 'text-blue-600' :
                        'text-amber-600'
                      }`}>
                        {viewingItem.profit_margin?.toFixed(0) || '0'}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-slate-500 mb-1">Prep Time</p>
                      <p className="text-2xl font-bold text-purple-600">{viewingItem.prep_time_minutes || 0} min</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Category & Location */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-sm">
                    Category: {viewingItem.category?.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    Prep Area: {viewingItem.preparation_location?.replace(/_/g, ' ')}
                  </Badge>
                  {viewingItem.dietary_tag && (
                    <Badge className="bg-green-100 text-green-700 text-sm">
                      {viewingItem.dietary_tag}
                    </Badge>
                  )}
                </div>

                {/* Recipe Information */}
                {itemRecipe && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Recipe Details
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-blue-700">Portion Yield:</span>
                          <span className="font-semibold ml-2">{itemRecipe.portion_yield} {itemRecipe.portion_type}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Prep Area:</span>
                          <span className="font-semibold ml-2">{itemRecipe.prep_area?.replace(/_/g, ' ')}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Dietary:</span>
                          <span className="font-semibold ml-2">{itemRecipe.dietary_tag || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Prep Time:</span>
                          <span className="font-semibold ml-2">{itemRecipe.prep_time_minutes || 0} min</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Ingredients */}
                {viewingItem.ingredients?.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">Ingredients & Consumption</h4>
                        <p className="text-xs text-slate-500 mt-1">Quantities consumed per serving</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => { setOrderingItem(viewingItem); setShowOrderDialog(true); setShowDetails(false); }}
                        className="bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Order by Dish
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {viewingItem.ingredients.map((ing, i) => {
                        const inventoryItem = ingredients.find(inv => 
                          inv.name?.toLowerCase().includes(ing.ingredient_name?.toLowerCase()) ||
                          ing.ingredient_name?.toLowerCase().includes(inv.name?.toLowerCase())
                        );
                        const currentStock = inventoryItem?.current_stock || 0;
                        const availableServings = ing.quantity > 0 ? Math.floor(currentStock / ing.quantity) : 0;
                        
                        return (
                          <div key={i} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-semibold text-slate-800">{ing.ingredient_name}</span>
                                <Badge variant="outline" className="text-xs font-semibold text-emerald-700 border-emerald-300">
                                  Consumes: {ing.quantity} {ing.unit}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                {inventoryItem ? (
                                  <Badge className={
                                    availableServings > 20 ? 'bg-emerald-100 text-emerald-700' :
                                    availableServings > 5 ? 'bg-amber-100 text-amber-700' :
                                    'bg-red-100 text-red-700'
                                  }>
                                    📦 Stock: {currentStock.toFixed(1)} {ing.unit} • {availableServings} servings available
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-slate-500">
                                    Not in inventory
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-sm font-bold text-slate-800">
                                £{ing.total_cost?.toFixed(2) || '0.00'}
                              </div>
                              <div className="text-xs text-slate-500">per serving</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Allergens */}
                {viewingItem.allergens?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Allergens</h4>
                    <div className="flex flex-wrap gap-2">
                      {viewingItem.allergens.map((allergen, i) => (
                        <Badge key={i} variant="outline" className="border-red-200 text-red-600">
                          {allergen}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* SOP Details */}
                {itemSOP && (
                  <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                    <CardContent className="pt-4">
                      <h4 className="font-bold text-emerald-900 mb-4 flex items-center gap-2 text-lg">
                        <FileText className="w-6 h-6" />
                        Standard Operating Procedure
                      </h4>
                      
                      <div className="space-y-4">
                        {/* Pre-Service Prep */}
                        {itemSOP.pre_service_prep && (
                          <div className="bg-white/80 rounded-lg p-4 border border-emerald-200">
                            <h5 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Pre-Service Preparation
                            </h5>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{itemSOP.pre_service_prep}</p>
                          </div>
                        )}
                        
                        {/* Live Order Execution */}
                        {itemSOP.live_order_execution && (
                          <div className="bg-white/80 rounded-lg p-4 border border-emerald-200">
                            <h5 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                              <ChefHat className="w-4 h-4" />
                              Live Order Execution
                            </h5>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{itemSOP.live_order_execution}</p>
                          </div>
                        )}
                        
                        {/* Assembly & Plating */}
                        {itemSOP.assembly_plating && (
                          <div className="bg-white/80 rounded-lg p-4 border border-emerald-200">
                            <h5 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              Assembly & Plating
                            </h5>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{itemSOP.assembly_plating}</p>
                          </div>
                        )}
                        
                        {/* Quality Check */}
                        {itemSOP.quality_check && (
                          <div className="bg-white/80 rounded-lg p-4 border border-amber-200">
                            <h5 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Quality Standards
                            </h5>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{itemSOP.quality_check}</p>
                          </div>
                        )}
                        
                        {/* Hygiene & Safety */}
                        {itemSOP.hygiene_safety && (
                          <div className="bg-white/80 rounded-lg p-4 border border-red-200">
                            <h5 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              Hygiene & Safety
                            </h5>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{itemSOP.hygiene_safety}</p>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          onClick={() => handleViewSOP(viewingItem.sop_id)}
                          className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Full SOP Page
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {!itemSOP && viewingItem.sop_id && (
                  <Button
                    variant="outline"
                    onClick={() => handleViewSOP(viewingItem.sop_id)}
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Preparation SOP
                  </Button>
                )}
              </div>
            </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* AI Assistant */}
      <AIMenuAssistant
        open={showAI}
        onClose={() => setShowAI(false)}
        onGenerate={handleAIGenerate}
        ingredients={ingredients}
      />

      {/* Order by Dish Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col overflow-hidden">
          {orderingItem && (
            <OrderByDishDialog
              menuItem={orderingItem}
              onClose={() => { setShowOrderDialog(false); setOrderingItem(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
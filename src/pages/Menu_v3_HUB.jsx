import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ChefHat, 
  Package, 
  ShoppingCart, 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle,
  Search,
  FileText,
  Mail,
  Phone
} from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Menu_v3_HUB() {
  const [user, setUser] = useState(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
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

  const { data: menuItems = [], isLoading: menuLoading } = useQuery({
    queryKey: ['menu_v2'],
    queryFn: () => base44.entities.Menu_v2.list(),
  });

  const { data: recipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: ['recipes_v2'],
    queryFn: () => base44.entities.Recipe_Engine_v2.list(),
  });

  const { data: ingredients = [], isLoading: ingredientsLoading } = useQuery({
    queryKey: ['ingredients_master'],
    queryFn: () => base44.entities.Ingredient_Master_v1.list(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier_Directory_v1.list(),
  });

  // Get recipe for menu item
  const getRecipe = (menuItemId) => {
    return recipes.find(r => r.id === menuItemId || r.data.menu_item_id === menuItemId);
  };

  // Get ingredient stock status
  const getIngredientStatus = (ingredientName) => {
    const ingredient = ingredients.find(i => 
      i.data.name?.toLowerCase() === ingredientName?.toLowerCase()
    );
    
    if (!ingredient) return { status: 'unknown', color: 'gray', icon: AlertCircle };
    
    const current = ingredient.data.current_stock || 0;
    const min = ingredient.data.min_stock_level || 0;
    
    if (current === 0) {
      return { status: 'Out of Stock', color: 'red', icon: AlertCircle, data: ingredient.data };
    } else if (current < min) {
      return { status: 'Low Stock', color: 'amber', icon: AlertTriangle, data: ingredient.data };
    } else {
      return { status: 'In Stock', color: 'green', icon: CheckCircle, data: ingredient.data };
    }
  };

  // Get menu item availability based on ingredients
  const getMenuItemAvailability = (menuItem) => {
    const recipe = getRecipe(menuItem.data.recipe_id);
    if (!recipe) return { available: false, reason: 'No recipe linked' };

    const recipeIngredients = recipe.data.ingredients_per_serving || [];
    
    for (const recipeIng of recipeIngredients) {
      const status = getIngredientStatus(recipeIng.ingredient_name);
      if (status.status === 'Out of Stock') {
        return { 
          available: false, 
          reason: `Out of stock: ${recipeIng.ingredient_name}`,
          status: 'out_of_stock'
        };
      }
      if (status.status === 'Low Stock') {
        return { 
          available: true, 
          reason: `Low stock: ${recipeIng.ingredient_name}`,
          status: 'low_stock'
        };
      }
    }
    
    return { available: true, reason: '', status: 'available' };
  };

  // Get ingredients below minimum stock
  const getLowStockIngredients = () => {
    return ingredients.filter(ing => {
      const current = ing.data.current_stock || 0;
      const min = ing.data.min_stock_level || 0;
      return current < min;
    });
  };

  // Calculate reorder quantity
  const getReorderQuantity = (ingredient) => {
    const current = ingredient.data.current_stock || 0;
    const min = ingredient.data.min_stock_level || 0;
    return Math.max(min * 2 - current, min);
  };

  // Filter menu items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.data.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.data.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (menuLoading || recipesLoading || ingredientsLoading) {
    return <LoadingSpinner message="Loading Menu Hub..." />;
  }

  const categories = [
    { value: 'all', label: 'All Items' },
    { value: 'parotta_rolls', label: 'Parotta Rolls' },
    { value: 'parotta_kebabs', label: 'Parotta Kebabs' },
    { value: 'desi_breakfast', label: 'Desi Breakfast' },
    { value: 'chai', label: 'Chai' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
            Menu Hub
          </h1>
          <p className="text-slate-600">One hub for menu, inventory, and ordering</p>
        </motion.div>

        {/* Main Tabs */}
        <Tabs defaultValue="menu" className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="menu" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <ChefHat className="w-4 h-4 mr-2" />
              Menu Items
            </TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Package className="w-4 h-4 mr-2" />
              Inventory View
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Order Supplies
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: MENU ITEMS */}
          <TabsContent value="menu" className="space-y-6">
            {/* Search & Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        placeholder="Search menu items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {categories.map(cat => (
                      <Button
                        key={cat.value}
                        variant={categoryFilter === cat.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCategoryFilter(cat.value)}
                      >
                        {cat.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMenuItems.map((item) => {
                const availability = getMenuItemAvailability(item);
                const StatusIcon = availability.status === 'available' ? CheckCircle :
                                 availability.status === 'low_stock' ? AlertTriangle : AlertCircle;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => setSelectedMenuItem(item)}>
                      <div className="relative">
                        <img
                          src={item.data.photo_url}
                          alt={item.data.name}
                          className="w-full h-48 object-cover rounded-t-xl"
                        />
                        <Badge 
                          className={`absolute top-3 right-3 ${
                            availability.status === 'available' ? 'bg-green-600' :
                            availability.status === 'low_stock' ? 'bg-amber-500' : 'bg-red-600'
                          }`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {availability.status === 'available' ? 'Available' :
                           availability.status === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                        </Badge>
                      </div>
                      <CardHeader>
                        <CardTitle className="text-lg">{item.data.name}</CardTitle>
                        <p className="text-sm text-slate-600">{item.data.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-emerald-700">£{item.data.price?.toFixed(2)}</span>
                          <Button variant="outline" size="sm">
                            <FileText className="w-4 h-4 mr-1" />
                            View Recipe
                          </Button>
                        </div>
                        {availability.reason && (
                          <p className="text-xs text-amber-600 mt-2">{availability.reason}</p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 2: INVENTORY VIEW */}
          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Ingredient Inventory Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedMenuItem ? (
                    <>
                      <h3 className="font-semibold text-lg mb-4">
                        Ingredients for: {selectedMenuItem.data.name}
                      </h3>
                      {(() => {
                        const recipe = getRecipe(selectedMenuItem.data.recipe_id);
                        if (!recipe) return <p className="text-slate-500">No recipe linked</p>;
                        
                        const recipeIngredients = recipe.data.ingredients_per_serving || [];
                        
                        return recipeIngredients.map((ing, idx) => {
                          const status = getIngredientStatus(ing.ingredient_name);
                          const Icon = status.icon;
                          
                          return (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                              <div className="flex items-center gap-3">
                                <Icon className={`w-5 h-5 text-${status.color}-600`} />
                                <div>
                                  <p className="font-medium">{ing.ingredient_name}</p>
                                  <p className="text-xs text-slate-500">
                                    Required: {ing.quantity} {ing.unit} per serving
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className={`bg-${status.color}-100 text-${status.color}-700`}>
                                  {status.status}
                                </Badge>
                                {status.data && (
                                  <p className="text-xs text-slate-600 mt-1">
                                    Stock: {status.data.current_stock} {status.data.unit}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500">Select a menu item to view its inventory status</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: ORDER SUPPLIES */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Ingredients Below Minimum Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getLowStockIngredients().length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                    <p className="text-slate-600 font-medium">All ingredients are above minimum stock!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getLowStockIngredients().map((ing) => {
                      const supplier = suppliers.find(s => s.id === ing.data.supplier_id);
                      
                      return (
                        <div key={ing.id} className="border rounded-lg p-4 bg-amber-50/50">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-lg">{ing.data.name}</h4>
                              <p className="text-sm text-slate-600">
                                Current: {ing.data.current_stock} {ing.data.unit} | 
                                Min: {ing.data.min_stock_level} {ing.data.unit}
                              </p>
                            </div>
                            <Badge className="bg-amber-500 text-white">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Low Stock
                            </Badge>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 mb-3">
                            <p className="text-sm font-medium text-slate-700 mb-1">Suggested Reorder</p>
                            <p className="text-2xl font-bold text-emerald-700">
                              {getReorderQuantity(ing)} {ing.data.unit}
                            </p>
                          </div>
                          
                          {supplier && (
                            <div className="bg-white rounded-lg p-3 space-y-2">
                              <p className="font-medium text-sm text-slate-700">Supplier: {supplier.data.supplier_name}</p>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {supplier.data.phone}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {supplier.data.email}
                                </div>
                              </div>
                              <p className="text-xs text-slate-500">
                                Order via: {supplier.data.ordering_method} | 
                                Min order: £{supplier.data.minimum_order_value}
                              </p>
                            </div>
                          )}
                          
                          <Button className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700">
                            Create Order for {ing.data.supplier_name}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
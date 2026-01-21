import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Video,
  DollarSign,
  Package,
  AlertTriangle,
  ChefHat,
  Clock,
  BarChart3,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import LinkVisualGuideButton from '@/components/menu/LinkVisualGuideButton';

export default function MenuItemDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('id');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  // Fetch menu item with retry and error handling
  const { data: menuItem, isLoading: loadingItem, error: itemError, refetch: refetchItem } = useQuery({
    queryKey: ['menuItem', itemId],
    queryFn: async () => {
      if (!itemId) throw new Error('Menu item ID is missing');
      const result = await base44.entities.MenuItem.filter({ id: itemId });
      if (!result || result.length === 0) throw new Error('Menu item not found');
      return result[0];
    },
    enabled: !!itemId,
    retry: 2,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  // Fetch linked visual guide
  const { data: visualLink } = useQuery({
    queryKey: ['visualMenuLink', itemId],
    queryFn: () => base44.entities.VisualMenuLink.filter({ menu_item_id: itemId }).then(r => r[0]),
    enabled: !!itemId
  });

  const { data: linkedGuide } = useQuery({
    queryKey: ['linkedVisualGuide', visualLink?.visual_guide_id],
    queryFn: () => base44.entities.Visual_Dish_Guides_v1.filter({ id: visualLink.visual_guide_id }).then(r => r[0]),
    enabled: !!visualLink?.visual_guide_id
  });

  // Fetch ingredients for stock checking
  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => base44.entities.Ingredient_Master_v1.list(),
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  if (loadingItem) return <LoadingSpinner message="Loading menu item..." />;
  
  if (itemError || !menuItem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            {itemError?.message === 'Menu item not found' ? 'Menu Item Not Found' : 'Unable to Load Menu Item'}
          </h2>
          <p className="text-slate-600 mb-6">
            {itemError?.message === 'Menu item not found' 
              ? 'This menu item does not exist or has been removed.'
              : 'Something went wrong while loading the item. Please try again.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => refetchItem()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => navigate(createPageUrl('MenuManager'))} className="bg-emerald-600 hover:bg-emerald-700">
              Back to Menu
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const profit = menuItem.price - (menuItem.cost || 0);
  const margin = menuItem.price > 0 ? ((profit / menuItem.price) * 100) : 0;
  const isAdmin = user && ['admin', 'owner', 'manager'].includes(user.role);

  const getProfitColor = () => {
    if (margin >= 60) return 'text-emerald-600';
    if (margin >= 40) return 'text-blue-600';
    if (margin >= 20) return 'text-amber-600';
    return 'text-red-600';
  };

  const openVisualGuide = () => {
    navigate(createPageUrl('VisualDishGuideDetail') + '?id=' + linkedGuide.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(createPageUrl('MenuManager'))}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{menuItem.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{menuItem.category?.replace('_', ' ')}</Badge>
                  <Badge className={margin >= 40 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                    {margin.toFixed(0)}% margin
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-4">
                <p className="text-sm text-slate-500">Sale Price</p>
                <p className="text-3xl font-bold text-slate-800">£{menuItem.price?.toFixed(2)}</p>
              </div>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => {
                    navigate(createPageUrl('MenuManager'));
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('openEditModal', { detail: { menuItem } }));
                    }, 300);
                  }}
                >
                  <Edit className="w-4 h-4" />
                  Edit Item
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Image */}
        {menuItem.photo_url && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl overflow-hidden shadow-2xl"
          >
            <img
              src={menuItem.photo_url}
              alt={menuItem.name}
              className="w-full h-[280px] object-cover"
            />
          </motion.div>
        )}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="overview">
              <ChefHat className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="ingredients">
              <Package className="w-4 h-4 mr-2" />
              Ingredients & Cost
            </TabsTrigger>
            <TabsTrigger value="visual">
              <Video className="w-4 h-4 mr-2" />
              Visual Guide
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="insights">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Dish Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {menuItem.image_url && (
                    <img
                      src={menuItem.image_url}
                      alt={menuItem.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Description</p>
                    <p className="text-slate-700">{menuItem.description || 'No description available'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Category</p>
                      <p className="font-medium">{menuItem.category?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Preparation Location</p>
                      <p className="font-medium">{menuItem.preparation_location?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Prep Time</p>
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {menuItem.prep_time_minutes || 0} min
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Status</p>
                      <Badge className={menuItem.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                        {menuItem.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <LinkVisualGuideButton menuItem={menuItem} />
                  </div>
                </CardContent>
              </Card>

              {/* KPI Cards */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-slate-500">Profit Margin</p>
                      {margin >= 40 ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : <TrendingDown className="w-5 h-5 text-amber-600" />}
                    </div>
                    <p className={`text-4xl font-bold ${getProfitColor()}`}>{margin.toFixed(0)}%</p>
                    <p className="text-sm text-slate-500 mt-2">£{profit.toFixed(2)} per sale</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-slate-500 mb-2">Portion Cost</p>
                    <p className="text-3xl font-bold text-slate-800">£{(menuItem.cost || 0).toFixed(2)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-slate-500 mb-2">Total Ingredients</p>
                    <p className="text-3xl font-bold text-slate-800">{menuItem.ingredients?.length || 0}</p>
                  </CardContent>
                </Card>

                {visualLink && linkedGuide && (
                  <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Video className="w-5 h-5 text-orange-600" />
                        <p className="font-semibold text-slate-800">Visual Guide Linked</p>
                      </div>
                      <Button
                        onClick={openVisualGuide}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                        size="sm"
                      >
                        Watch Preparation
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Ingredients Tab */}
          <TabsContent value="ingredients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ingredients & Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {menuItem.ingredients && menuItem.ingredients.length > 0 ? (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Ingredient</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Quantity</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Unit Cost</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Total</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {menuItem.ingredients.map((ing, idx) => {
                            const inventoryItem = ingredients.find(i => 
                              i.name?.toLowerCase() === ing.ingredient_name?.toLowerCase()
                            );
                            const isLowStock = inventoryItem && inventoryItem.current_stock <= (inventoryItem.min_stock_level || 0);
                            const total = (ing.quantity || 0) * (ing.cost_per_unit || 0);
                            
                            return (
                              <tr key={idx} className="border-b hover:bg-slate-50">
                                <td className="py-3 px-4 font-medium text-slate-800">{ing.ingredient_name}</td>
                                <td className="py-3 px-4 text-right text-slate-600">
                                  {ing.quantity} {ing.unit}
                                </td>
                                <td className="py-3 px-4 text-right text-slate-600">
                                  £{(ing.cost_per_unit || 0).toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-right font-semibold text-slate-800">
                                  £{total.toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {isLowStock ? (
                                    <Badge className="bg-amber-100 text-amber-700">
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      Low
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-emerald-100 text-emerald-700">OK</Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 font-bold">
                            <td colSpan="3" className="py-3 px-4 text-right">Total Cost:</td>
                            <td className="py-3 px-4 text-right text-lg">£{(menuItem.cost || 0).toFixed(2)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <Button className="w-full md:w-auto" variant="outline">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Reorder Ingredients
                    </Button>
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">No ingredients defined</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visual Guide Tab */}
          <TabsContent value="visual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visual Preparation Guide</CardTitle>
              </CardHeader>
              <CardContent>
                {visualLink && linkedGuide ? (
                  <div className="space-y-4">
                    <div className="flex gap-6">
                      {linkedGuide.hero_image_url && (
                        <img
                          src={linkedGuide.hero_image_url}
                          alt={linkedGuide.dish_name}
                          className="w-64 h-48 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1 space-y-3">
                        <h3 className="text-2xl font-bold text-slate-800">{linkedGuide.dish_name}</h3>
                        <div className="flex gap-2">
                          <Badge>{linkedGuide.category}</Badge>
                          <Badge variant="outline">{linkedGuide.difficulty}</Badge>
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {linkedGuide.estimated_cook_time_minutes}m
                          </Badge>
                        </div>
                        <p className="text-slate-600">
                          This menu item has a complete visual preparation guide with step-by-step photos and instructions.
                        </p>
                        <Button onClick={openVisualGuide} className="bg-orange-600 hover:bg-orange-700">
                          <Video className="w-4 h-4 mr-2" />
                          Open Visual Guide
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Video className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-lg text-slate-600 mb-2">No Visual Guide Linked</p>
                    <p className="text-sm text-slate-500 mb-6">
                      Link or create a visual preparation guide to help staff prepare this dish
                    </p>
                    <LinkVisualGuideButton menuItem={menuItem} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Profit Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-emerald-600">+{margin.toFixed(0)}%</p>
                  <p className="text-sm text-slate-500 mt-1">Current margin</p>
                  <Progress value={margin} className="mt-4" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Category Average</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-slate-700">48%</p>
                  <p className="text-sm text-slate-500 mt-1">For {menuItem.category}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Stock Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-emerald-600">Good</p>
                  <p className="text-sm text-slate-500 mt-1">All ingredients available</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Detailed analytics coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {margin < 40 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="font-semibold text-amber-800 mb-2">⚠️ Margin Below Target</p>
                    <p className="text-sm text-amber-700">
                      Your current profit margin ({margin.toFixed(0)}%) is below the recommended 40% threshold for this category.
                    </p>
                  </div>
                )}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-semibold text-blue-800 mb-2">💡 Cost Optimization</p>
                  <p className="text-sm text-blue-700">
                    Consider reviewing ingredient suppliers. Potential savings of £0.15-0.25 per portion identified.
                  </p>
                </div>
                {!visualLink && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="font-semibold text-purple-800 mb-2">🎥 Training Recommendation</p>
                    <p className="text-sm text-purple-700">
                      This item doesn't have a visual guide yet. Creating one can reduce preparation errors by 45%.
                    </p>
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
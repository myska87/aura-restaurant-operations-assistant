import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';

export default function MenuAnalyticsDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: menuItems = [], isLoading: menuLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers_directory'],
    queryFn: () => base44.entities.Supplier_Directory_v1.list(),
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients_master'],
    queryFn: () => base44.entities.Ingredient_Master_v1.list(),
  });

  if (menuLoading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  // Calculate analytics
  const totalMenuItems = menuItems.length;
  const totalSuppliers = suppliers.length;
  
  // Calculate total inventory value
  const totalInventoryValue = ingredients.reduce((sum, ing) => {
    const stock = ing.data?.current_stock || 0;
    const cost = ing.data?.cost_per_unit || 0;
    return sum + (stock * cost);
  }, 0);

  // Sort by profitability (highest margin first)
  const sortedByProfit = [...menuItems]
    .filter(item => item.profit_margin !== undefined && item.profit_margin !== null)
    .sort((a, b) => (b.profit_margin || 0) - (a.profit_margin || 0));

  const mostProfitable = sortedByProfit.slice(0, 10);
  const leastProfitable = sortedByProfit.slice(-10).reverse();

  // Low stock items (ingredients)
  const lowStockItems = ingredients.filter(ing => {
    const current = ing.data?.current_stock || 0;
    const min = ing.data?.min_stock_level || 0;
    return current < min && min > 0;
  }).slice(0, 10);

  // Calculate average margin
  const avgMargin = menuItems.length > 0
    ? menuItems.reduce((sum, item) => sum + (item.profit_margin || 0), 0) / menuItems.length
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu Analytics Dashboard"
        description="Performance insights and profitability metrics"
      >
        <Button variant="outline" className="border-emerald-300">
          <BarChart3 className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </PageHeader>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-900 mb-2">{totalMenuItems}</div>
                <p className="text-blue-700 font-medium">Menu Items</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-purple-900 mb-2">{totalSuppliers}</div>
                <p className="text-purple-700 font-medium">Suppliers</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-emerald-900 mb-2">£{totalInventoryValue.toFixed(2)}</div>
                <p className="text-emerald-700 font-medium">Total Inventory Value</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profitable" className="space-y-6">
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="profitable">
            <TrendingUp className="w-4 h-4 mr-2" />
            Most Profitable
          </TabsTrigger>
          <TabsTrigger value="least">
            <TrendingDown className="w-4 h-4 mr-2" />
            Least Profitable
          </TabsTrigger>
          <TabsTrigger value="lowstock">
            <AlertCircle className="w-4 h-4 mr-2" />
            Low Stock Items
          </TabsTrigger>
        </TabsList>

        {/* Most Profitable Items */}
        <TabsContent value="profitable">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <TrendingUp className="w-5 h-5" />
                Most Profitable Items
              </CardTitle>
              <p className="text-sm text-slate-500">Top 10 items by profit margin</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mostProfitable.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No items with profit data</p>
                ) : (
                  mostProfitable.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 hover:shadow-md transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{item.name}</h4>
                            <p className="text-xs text-slate-500">
                              Price: £{item.price?.toFixed(2)} | Cost: £{item.cost?.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-emerald-600 text-white text-lg px-4 py-2">
                        {item.profit_margin?.toFixed(1)}%
                      </Badge>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Least Profitable Items */}
        <TabsContent value="least">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <TrendingDown className="w-5 h-5" />
                Least Profitable Items
              </CardTitle>
              <p className="text-sm text-slate-500">Bottom 10 items by profit margin - needs attention</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leastProfitable.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No items with profit data</p>
                ) : (
                  leastProfitable.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 hover:shadow-md transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{item.name}</h4>
                            <p className="text-xs text-slate-500">
                              Price: £{item.price?.toFixed(2)} | Cost: £{item.cost?.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Badge className={`text-lg px-4 py-2 ${
                        item.profit_margin < 0 ? 'bg-red-600 text-white' :
                        item.profit_margin < 20 ? 'bg-orange-600 text-white' :
                        'bg-amber-600 text-white'
                      }`}>
                        {item.profit_margin?.toFixed(1)}%
                      </Badge>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Low Stock Items */}
        <TabsContent value="lowstock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="w-5 h-5" />
                Low Stock Ingredients
              </CardTitle>
              <p className="text-sm text-slate-500">Ingredients below minimum stock level</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto text-green-500 mb-3" />
                    <p className="text-slate-600 font-medium">All ingredients are stocked!</p>
                  </div>
                ) : (
                  lowStockItems.map((item, idx) => {
                    const current = item.data?.current_stock || 0;
                    const min = item.data?.min_stock_level || 0;
                    const percentage = min > 0 ? (current / min) * 100 : 0;
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-slate-800">{item.data?.name}</h4>
                            <p className="text-xs text-slate-500">
                              Stock: {current} {item.data?.unit} / Reorder at: {min} {item.data?.unit}
                            </p>
                          </div>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            Reorder
                          </Button>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              percentage < 25 ? 'bg-red-600' :
                              percentage < 50 ? 'bg-orange-600' :
                              'bg-amber-600'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Average Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-blue-900 mb-2">
              {avgMargin.toFixed(1)}%
            </div>
            <p className="text-sm text-blue-700">
              Across {menuItems.length} menu items
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-900">Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-emerald-900 mb-2">
              {lowStockItems.length}
            </div>
            <p className="text-sm text-emerald-700">
              Ingredients need reordering
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingDown, TrendingUp, Package, DollarSign, Clock, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';

export default function StockDashboard() {
  const { data: ingredients = [], isLoading: ingredientsLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => base44.entities.Ingredient.list(),
  });

  const { data: stockAlerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['stockAlerts'],
    queryFn: () => base44.entities.StockAlert.filter({ resolved: false }),
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['recentSales'],
    queryFn: () => base44.entities.Sale.list('-created_date', 50),
  });

  // Calculate metrics
  const lowStockCount = ingredients.filter(i => 
    i.current_stock <= i.min_stock_level && i.current_stock > 0
  ).length;

  const outOfStockCount = ingredients.filter(i => i.current_stock <= 0).length;

  const totalStockValue = ingredients.reduce((sum, ing) => 
    sum + (ing.current_stock * ing.cost_per_unit), 0
  );

  const expiringItems = ingredients.filter(i => {
    if (!i.expiry_date) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(i.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  }).length;

  // Calculate daily food cost (from sales)
  const today = new Date().toISOString().split('T')[0];
  const todaysSales = sales.filter(s => s.sale_date?.startsWith(today));
  const dailyRevenue = todaysSales.reduce((sum, s) => sum + s.total_price, 0);
  const dailyCost = todaysSales.reduce((sum, s) => sum + s.total_cost, 0);
  const dailyGP = dailyRevenue > 0 ? ((dailyRevenue - dailyCost) / dailyRevenue * 100).toFixed(1) : 0;

  // Low margin items
  const lowMarginItems = menuItems.filter(item => 
    item.profit_margin && item.profit_margin < 50
  ).sort((a, b) => a.profit_margin - b.profit_margin);

  // Top selling items (from sales)
  const itemSalesCount = {};
  sales.forEach(sale => {
    sale.items?.forEach(item => {
      itemSalesCount[item.menu_item_id] = (itemSalesCount[item.menu_item_id] || 0) + item.quantity;
    });
  });
  const topSelling = Object.entries(itemSalesCount)
    .map(([id, count]) => {
      const item = menuItems.find(m => m.id === id);
      return { item, count };
    })
    .filter(x => x.item)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (ingredientsLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Stock & Costing Dashboard"
        description="Live stock levels, costing insights, and alerts"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Stock Value</p>
                <p className="text-2xl font-bold text-slate-800">
                  £{totalStockValue.toFixed(2)}
                </p>
              </div>
              <Package className="w-10 h-10 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Daily Food Cost</p>
                <p className="text-2xl font-bold text-slate-800">
                  £{dailyCost.toFixed(2)}
                </p>
                <p className="text-xs text-emerald-600 mt-1">GP: {dailyGP}%</p>
              </div>
              <DollarSign className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
                <p className="text-xs text-red-600 mt-1">
                  {outOfStockCount} out of stock
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">{expiringItems}</p>
                <p className="text-xs text-slate-500 mt-1">Within 7 days</p>
              </div>
              <Clock className="w-10 h-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stockAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Active Stock Alerts ({stockAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stockAlerts.slice(0, 5).map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alert.message}</p>
                    <p className="text-xs text-slate-500">
                      {alert.ingredient_name || alert.menu_item_name}
                      {alert.current_stock !== undefined && ` - Current: ${alert.current_stock}`}
                    </p>
                  </div>
                  <Badge 
                    variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                    className={
                      alert.severity === 'high' ? 'bg-orange-500' :
                      alert.severity === 'medium' ? 'bg-yellow-500' : ''
                    }
                  >
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link to={createPageUrl('Inventory')}>View All & Generate Orders</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="low-stock" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="expiring">Expiring</TabsTrigger>
          <TabsTrigger value="low-margin">Low Margin</TabsTrigger>
          <TabsTrigger value="top-selling">Top Selling</TabsTrigger>
        </TabsList>

        <TabsContent value="low-stock" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Ingredients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ingredients
                  .filter(i => i.current_stock <= i.min_stock_level)
                  .sort((a, b) => (a.current_stock / a.min_stock_level) - (b.current_stock / b.min_stock_level))
                  .slice(0, 15)
                  .map(ing => {
                    const stockPercent = (ing.current_stock / ing.min_stock_level) * 100;
                    return (
                      <div key={ing.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{ing.name}</span>
                          <Badge variant={ing.current_stock <= 0 ? 'destructive' : 'default'}>
                            {ing.current_stock} {ing.unit}
                          </Badge>
                        </div>
                        <Progress value={Math.min(stockPercent, 100)} className="h-2" />
                        <p className="text-xs text-slate-500">
                          Min: {ing.min_stock_level} {ing.unit} | 
                          Reorder: {ing.reorder_quantity} {ing.unit}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Items Expiring Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ingredients
                  .filter(i => {
                    if (!i.expiry_date) return false;
                    const daysUntilExpiry = Math.ceil(
                      (new Date(i.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
                    );
                    return daysUntilExpiry <= 14;
                  })
                  .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
                  .map(ing => {
                    const daysLeft = Math.ceil(
                      (new Date(ing.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div key={ing.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium">{ing.name}</p>
                          <p className="text-sm text-slate-600">
                            {ing.current_stock} {ing.unit} in stock
                          </p>
                        </div>
                        <Badge variant={daysLeft <= 3 ? 'destructive' : daysLeft <= 7 ? 'default' : 'outline'}>
                          {daysLeft <= 0 ? 'Expired' : `${daysLeft}d left`}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-margin" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Low Margin Menu Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowMarginItems.slice(0, 15).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-slate-600">
                        Price: £{item.price?.toFixed(2)} | Cost: £{item.cost?.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={item.profit_margin < 40 ? 'destructive' : 'default'}>
                        {item.profit_margin?.toFixed(1)}% GP
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">
                        £{((item.price - item.cost) || 0).toFixed(2)} profit
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-selling" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topSelling.map(({ item, count }, index) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-slate-600">
                        {count} sold | GP: {item.profit_margin?.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">
                        £{(item.price * count).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-4">
        <Button asChild className="flex-1">
          <Link to={createPageUrl('POSSystem')}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Go to POS
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link to={createPageUrl('Inventory')}>
            Generate Orders
          </Link>
        </Button>
      </div>
    </div>
  );
}
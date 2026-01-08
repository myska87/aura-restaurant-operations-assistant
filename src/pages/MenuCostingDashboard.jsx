import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  Download,
  BarChart3,
  PieChart,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function MenuCostingDashboard() {
  const [filterCategory, setFilterCategory] = useState('all');

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => base44.entities.Ingredient.list(),
  });

  if (isLoading) return <LoadingSpinner message="Loading analytics..." />;

  // Calculate analytics
  const filteredItems = filterCategory === 'all' 
    ? menuItems 
    : menuItems.filter(i => i.category === filterCategory);

  const totalItems = filteredItems.length;
  const avgMargin = filteredItems.length > 0
    ? filteredItems.reduce((sum, i) => sum + (i.profit_margin || 0), 0) / filteredItems.length
    : 0;
  
  const totalRevenuePotential = filteredItems.reduce((sum, i) => sum + (i.price || 0), 0);
  const totalCost = filteredItems.reduce((sum, i) => sum + (i.cost || 0), 0);
  
  const inventoryValue = ingredients.reduce((sum, i) => 
    sum + ((i.current_stock || 0) * (i.cost_per_unit || 0)), 0
  );

  // Sort by profitability
  const sortedByMargin = [...filteredItems].sort((a, b) => 
    (b.profit_margin || 0) - (a.profit_margin || 0)
  );
  
  const topProfitable = sortedByMargin.slice(0, 5);
  const leastProfitable = sortedByMargin.slice(-5).reverse();

  // Category breakdown
  const categoryStats = {};
  menuItems.forEach(item => {
    const cat = item.category || 'uncategorized';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { count: 0, totalMargin: 0, totalRevenue: 0 };
    }
    categoryStats[cat].count++;
    categoryStats[cat].totalMargin += item.profit_margin || 0;
    categoryStats[cat].totalRevenue += item.price || 0;
  });

  const categoryArray = Object.entries(categoryStats).map(([category, stats]) => ({
    category,
    count: stats.count,
    avgMargin: stats.totalMargin / stats.count,
    revenue: stats.totalRevenue
  })).sort((a, b) => b.revenue - a.revenue);

  const exportToCSV = () => {
    const headers = ['Name', 'Category', 'Price', 'Cost', 'Profit', 'Margin %'];
    const rows = filteredItems.map(item => [
      item.name,
      item.category,
      item.price?.toFixed(2) || '0.00',
      item.cost?.toFixed(2) || '0.00',
      ((item.price || 0) - (item.cost || 0)).toFixed(2),
      (item.profit_margin || 0).toFixed(1)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menu-costing-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Menu')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Menu Costing Dashboard</h1>
            <p className="text-slate-500">Analyze profitability and performance</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="hot_drinks">Hot Drinks</SelectItem>
              <SelectItem value="cold_drinks">Cold Drinks</SelectItem>
              <SelectItem value="starters">Starters</SelectItem>
              <SelectItem value="mains">Mains</SelectItem>
              <SelectItem value="desserts">Desserts</SelectItem>
              <SelectItem value="sides">Sides</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Items</p>
                  <p className="text-3xl font-bold text-slate-800">{totalItems}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Avg Margin</p>
                  <p className="text-3xl font-bold text-emerald-600">{avgMargin.toFixed(0)}%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Revenue Potential</p>
                  <p className="text-3xl font-bold text-purple-600">£{totalRevenuePotential.toFixed(0)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Inventory Value</p>
                  <p className="text-3xl font-bold text-amber-600">£{inventoryValue.toFixed(0)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top & Bottom Performers */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top 5 Most Profitable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <TrendingUp className="w-5 h-5" />
              Top 5 Most Profitable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProfitable.map((item, index) => {
                const profit = (item.price || 0) - (item.cost || 0);
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        £{item.price?.toFixed(2)} • Cost: £{item.cost?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">
                        {item.profit_margin?.toFixed(0) || '0'}%
                      </p>
                      <p className="text-xs text-emerald-600">+£{profit.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Bottom 5 Least Profitable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <TrendingDown className="w-5 h-5" />
              Bottom 5 Least Profitable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leastProfitable.map((item, index) => {
                const profit = (item.price || 0) - (item.cost || 0);
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        £{item.price?.toFixed(2)} • Cost: £{item.cost?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        {item.profit_margin?.toFixed(0) || '0'}%
                      </p>
                      <p className="text-xs text-red-600">£{profit.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Category Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryArray.map((cat, index) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium capitalize">{cat.category.replace('_', ' ')}</span>
                    <Badge variant="outline">{cat.count} items</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500">
                      Revenue: £{cat.revenue.toFixed(0)}
                    </span>
                    <span className={`font-bold ${
                      cat.avgMargin >= 50 ? 'text-emerald-600' :
                      cat.avgMargin >= 30 ? 'text-blue-600' :
                      'text-amber-600'
                    }`}>
                      {cat.avgMargin.toFixed(0)}% avg
                    </span>
                  </div>
                </div>
                <Progress 
                  value={(cat.revenue / totalRevenuePotential) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Full Table */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Menu Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Ingredients</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const profit = (item.price || 0) - (item.cost || 0);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.category?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>£{item.price?.toFixed(2)}</TableCell>
                      <TableCell>£{item.cost?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className={profit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                        £{profit.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          (item.profit_margin || 0) >= 50 ? 'bg-emerald-100 text-emerald-700' :
                          (item.profit_margin || 0) >= 30 ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }>
                          {item.profit_margin?.toFixed(0) || '0'}%
                        </Badge>
                      </TableCell>
                      <TableCell>{item.ingredients?.length || 0}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
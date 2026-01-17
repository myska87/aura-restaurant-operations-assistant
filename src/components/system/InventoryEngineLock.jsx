import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, CheckCircle, Shield, Package, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function InventoryEngineLock() {
  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients-inventory'],
    queryFn: () => base44.entities.Ingredient.list(),
    initialData: []
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['inventory-transactions-count'],
    queryFn: () => base44.entities.InventoryTransaction.list('-created_date', 100),
    initialData: []
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ['daily-snapshots-count'],
    queryFn: () => base44.entities.DailyStockSnapshot.list('-snapshot_date', 7),
    initialData: []
  });

  const lowStock = ingredients.filter(i => 
    i.is_active && i.current_stock <= (i.min_stock_level || 0) && i.current_stock > 0
  );
  
  const outOfStock = ingredients.filter(i => 
    i.is_active && i.current_stock === 0
  );

  const recipeExecutions = transactions.filter(t => t.transaction_type === 'recipe_execution');

  return (
    <Card className="border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            Inventory Engine v1 - LOCKED
          </CardTitle>
          <Badge className="bg-blue-600 text-white">
            <Shield className="w-3 h-3 mr-1" />
            Protected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-white/60 rounded-lg border border-blue-200">
          <p className="text-sm text-slate-700 mb-3">
            <span className="font-bold text-blue-700">Auto-deduction engine</span> active - stock tracked per recipe execution.
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Deducts ONLY on Recipe Execution</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Exact Quantities Per Serving</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Real-Time Stock Levels</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Daily Snapshots & Reorder Alerts</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Out-of-Stock Prevention</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="p-3 bg-blue-100/50 rounded-lg">
            <p className="text-xs text-blue-700 font-medium mb-1">Transactions</p>
            <p className="text-lg font-bold text-blue-900">{transactions.length}</p>
          </div>
          <div className="p-3 bg-green-100/50 rounded-lg">
            <p className="text-xs text-green-700 font-medium mb-1">Recipe Execs</p>
            <p className="text-lg font-bold text-green-900">{recipeExecutions.length}</p>
          </div>
          <div className="p-3 bg-amber-100/50 rounded-lg">
            <p className="text-xs text-amber-700 font-medium mb-1">Low Stock</p>
            <p className="text-lg font-bold text-amber-900">{lowStock.length}</p>
          </div>
          <div className="p-3 bg-red-100/50 rounded-lg">
            <p className="text-xs text-red-700 font-medium mb-1">Out of Stock</p>
            <p className="text-lg font-bold text-red-900">{outOfStock.length}</p>
          </div>
        </div>

        {(lowStock.length > 0 || outOfStock.length > 0) && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-amber-900">Stock Alerts Active</p>
                <p className="text-amber-700">
                  {lowStock.length} low stock, {outOfStock.length} out of stock items require attention.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-slate-500 space-y-1 border-t pt-3">
          <p><strong>Locked Date:</strong> 2026-01-17</p>
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Status:</strong> Inventory Engine Active ✅</p>
          <p><strong>Snapshots:</strong> {snapshots.length} daily snapshots stored</p>
          <p><strong>Rules:</strong> Recipe-driven deduction • Reads Ingredient_Master • Reads Recipe_Engine • No manual menu deduction</p>
        </div>
      </CardContent>
    </Card>
  );
}
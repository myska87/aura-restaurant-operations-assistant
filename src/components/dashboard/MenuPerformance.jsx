import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat, TrendingUp, TrendingDown, ArrowRight, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MenuPerformance({ menuItems = [] }) {
  if (menuItems.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Menu Performance</h3>
        <div className="text-center py-8 text-slate-400">
          <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No menu items yet</p>
        </div>
      </div>
    );
  }

  const avgMargin = menuItems.reduce((sum, i) => sum + (i.profit_margin || 0), 0) / menuItems.length;
  const topItem = [...menuItems].sort((a, b) => (b.profit_margin || 0) - (a.profit_margin || 0))[0];
  const lowMarginItems = menuItems.filter(i => (i.profit_margin || 0) < 30);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Menu Performance</h3>
            <p className="text-sm text-slate-500">{menuItems.length} items tracked</p>
          </div>
        </div>
        <Link to={createPageUrl('MenuCostingDashboard')}>
          <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Average Margin */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-600">Average Profit Margin</span>
          <span className="text-lg font-bold text-emerald-600">{avgMargin.toFixed(0)}%</span>
        </div>
        <Progress value={avgMargin} className="h-2" />
      </div>

      {/* Top Performer */}
      {topItem && (
        <div className="p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">Top Performer</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800">{topItem.name}</span>
            <Badge className="bg-emerald-600 text-white">
              {topItem.profit_margin?.toFixed(0)}% margin
            </Badge>
          </div>
        </div>
      )}

      {/* Low Margin Alert */}
      {lowMarginItems.length > 0 && (
        <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-700">
              {lowMarginItems.length} item(s) with low margin
            </span>
          </div>
          <p className="text-xs text-amber-600">Consider reviewing pricing or ingredients</p>
        </div>
      )}
    </div>
  );
}
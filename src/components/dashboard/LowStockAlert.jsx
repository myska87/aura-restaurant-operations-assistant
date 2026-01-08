import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LowStockAlert({ ingredients = [] }) {
  const lowStockItems = ingredients.filter(
    item => item.current_stock <= item.min_stock_level
  );

  if (lowStockItems.length === 0) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Package className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-800">Stock Levels Good</h3>
            <p className="text-sm text-emerald-600">All ingredients are well stocked</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-800">Low Stock Alert</h3>
            <p className="text-sm text-amber-600">{lowStockItems.length} items need reordering</p>
          </div>
        </div>
        <Link to={createPageUrl('Inventory')}>
          <Button variant="ghost" size="sm" className="text-amber-700 hover:text-amber-800 hover:bg-amber-100">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
      
      <div className="space-y-2">
        {lowStockItems.slice(0, 4).map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 bg-white/60 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-semibold text-xs">
                {item.name?.charAt(0)}
              </div>
              <span className="font-medium text-slate-700">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white border-amber-300 text-amber-700">
                {item.current_stock} {item.unit}
              </Badge>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
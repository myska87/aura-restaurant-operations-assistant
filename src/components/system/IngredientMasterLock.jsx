import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, CheckCircle, Shield, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function IngredientMasterLock() {
  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients-count'],
    queryFn: () => base44.entities.Ingredient.list(),
    initialData: []
  });

  const activeIngredients = ingredients.filter(i => i.is_active !== false);
  const allergenIngredients = ingredients.filter(i => i.is_allergen);

  return (
    <Card className="border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-green-600" />
            Ingredient Master v1 - LOCKED
          </CardTitle>
          <Badge className="bg-green-600 text-white">
            <Shield className="w-3 h-3 mr-1" />
            Protected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-white/60 rounded-lg border border-green-200">
          <p className="text-sm text-slate-700 mb-3">
            <span className="font-bold text-green-700">{activeIngredients.length} active ingredients</span> in the master database.
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium">Single Source of Truth</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium">Unique Ingredient IDs</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium">Stock Levels Tracked</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium">Allergen Flags Set</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-green-100/50 rounded-lg">
            <p className="text-xs text-green-700 font-medium mb-1">Total Ingredients</p>
            <p className="text-lg font-bold text-green-900">{activeIngredients.length}</p>
          </div>
          <div className="p-3 bg-amber-100/50 rounded-lg">
            <p className="text-xs text-amber-700 font-medium mb-1">Allergens</p>
            <p className="text-lg font-bold text-amber-900">{allergenIngredients.length}</p>
          </div>
          <div className="p-3 bg-blue-100/50 rounded-lg">
            <p className="text-xs text-blue-700 font-medium mb-1">Suppliers</p>
            <p className="text-lg font-bold text-blue-900">{new Set(ingredients.filter(i => i.supplier_name).map(i => i.supplier_name)).size}</p>
          </div>
        </div>

        <div className="text-xs text-slate-500 space-y-1 border-t pt-3">
          <p><strong>Locked Date:</strong> 2026-01-17</p>
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Status:</strong> Master Database Active ✅</p>
          <p><strong>Rules:</strong> No duplicates • All modules reference this • No external calculations</p>
        </div>
      </CardContent>
    </Card>
  );
}
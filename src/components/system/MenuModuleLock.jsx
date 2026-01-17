import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, CheckCircle, Shield, UtensilsCrossed } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function MenuModuleLock() {
  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items-count'],
    queryFn: () => base44.entities.MenuItem.list(),
    initialData: []
  });

  const activeItems = menuItems.filter(i => i.is_active !== false);
  const itemsWithPhotos = menuItems.filter(i => i.photo_url);
  const itemsWithRecipes = menuItems.filter(i => i.recipe_id);

  return (
    <Card className="border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-600" />
            Menu v1 - LOCKED (Display Only)
          </CardTitle>
          <Badge className="bg-purple-600 text-white">
            <Shield className="w-3 h-3 mr-1" />
            Protected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-white/60 rounded-lg border border-purple-200">
          <p className="text-sm text-slate-700 mb-3">
            <span className="font-bold text-purple-700">{activeItems.length} active menu items</span> for customer display.
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-purple-600" />
              <span className="font-medium">Display Only - No Stock Logic</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-purple-600" />
              <span className="font-medium">No Ingredient Data</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-purple-600" />
              <span className="font-medium">No Cost Calculations</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-purple-600" />
              <span className="font-medium">Links to Recipe Module Only</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-purple-100/50 rounded-lg">
            <p className="text-xs text-purple-700 font-medium mb-1">Active Items</p>
            <p className="text-lg font-bold text-purple-900">{activeItems.length}</p>
          </div>
          <div className="p-3 bg-pink-100/50 rounded-lg">
            <p className="text-xs text-pink-700 font-medium mb-1">With Photos</p>
            <p className="text-lg font-bold text-pink-900">{itemsWithPhotos.length}</p>
          </div>
          <div className="p-3 bg-indigo-100/50 rounded-lg">
            <p className="text-xs text-indigo-700 font-medium mb-1">Linked Recipes</p>
            <p className="text-lg font-bold text-indigo-900">{itemsWithRecipes.length}</p>
          </div>
        </div>

        <div className="text-xs text-slate-500 space-y-1 border-t pt-3">
          <p><strong>Locked Date:</strong> 2026-01-17</p>
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Status:</strong> Display Module Active ✅</p>
          <p><strong>Rules:</strong> Display only • No ingredients • No stock deduction • Recipe ID only</p>
        </div>
      </CardContent>
    </Card>
  );
}
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, CheckCircle, Shield, ChefHat } from 'lucide-react';

export default function MenuDataLock() {
  return (
    <Card className="border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-600" />
            Menu Data v1 - LOCKED
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
            <span className="font-bold text-purple-700">59 menu items</span> and <span className="font-bold text-purple-700">12 add-ons</span> have been imported and locked.
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-purple-600" />
              <span className="font-medium">Full Chai Patta Menu Imported</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-purple-600" />
              <span className="font-medium">All Categories Active</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-purple-600" />
              <span className="font-medium">Prices Set Correctly</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-purple-600" />
              <span className="font-medium">Ready for Recipe/SOP Linking</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-purple-100/50 rounded-lg">
            <p className="text-xs text-purple-700 font-medium mb-1">Food Items</p>
            <p className="text-lg font-bold text-purple-900">40</p>
          </div>
          <div className="p-3 bg-pink-100/50 rounded-lg">
            <p className="text-xs text-pink-700 font-medium mb-1">Drinks</p>
            <p className="text-lg font-bold text-pink-900">15</p>
          </div>
          <div className="p-3 bg-amber-100/50 rounded-lg">
            <p className="text-xs text-amber-700 font-medium mb-1">Desserts</p>
            <p className="text-lg font-bold text-amber-900">7</p>
          </div>
        </div>

        <div className="text-xs text-slate-500 space-y-1 border-t pt-3">
          <p><strong>Locked Date:</strong> 2026-01-17</p>
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Status:</strong> Import Complete ✅</p>
          <p><strong>Next Step:</strong> Link recipes and SOPs</p>
        </div>
      </CardContent>
    </Card>
  );
}
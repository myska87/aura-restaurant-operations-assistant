import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  Minus,
  TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function StockDeductionHelper({ 
  open, 
  onClose, 
  menuItem, 
  ingredients,
  onComplete 
}) {
  const [servings, setServings] = useState(1);
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();

  if (!menuItem) return null;

  const updateInventoryMutation = useMutation({
    mutationFn: async ({ ingredientId, newStock }) => {
      return base44.entities.Ingredient.update(ingredientId, { current_stock: newStock });
    }
  });

  const handleDeductStock = async () => {
    setProcessing(true);
    
    try {
      // Deduct stock for each ingredient
      for (const recipeIng of menuItem.ingredients || []) {
        const inventoryItem = ingredients.find(i => i.id === recipeIng.ingredient_id);
        if (!inventoryItem) continue;
        
        const quantityNeeded = (recipeIng.quantity || 0) * servings;
        const newStock = Math.max(0, (inventoryItem.current_stock || 0) - quantityNeeded);
        
        await updateInventoryMutation.mutateAsync({
          ingredientId: inventoryItem.id,
          newStock
        });
      }
      
      queryClient.invalidateQueries(['ingredients']);
      
      if (onComplete) onComplete();
      onClose();
    } catch (error) {
      console.error('Stock deduction error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const checkStockAvailability = () => {
    const issues = [];
    
    (menuItem.ingredients || []).forEach(recipeIng => {
      const inventoryItem = ingredients.find(i => i.id === recipeIng.ingredient_id);
      if (!inventoryItem) {
        issues.push({
          name: recipeIng.ingredient_name,
          issue: 'Not found in inventory'
        });
        return;
      }
      
      const needed = (recipeIng.quantity || 0) * servings;
      const available = inventoryItem.current_stock || 0;
      
      if (available < needed) {
        issues.push({
          name: recipeIng.ingredient_name,
          issue: `Need ${needed}${recipeIng.unit}, only ${available}${recipeIng.unit} available`
        });
      } else if (available - needed <= inventoryItem.min_stock_level) {
        issues.push({
          name: recipeIng.ingredient_name,
          issue: `Will go below minimum stock`,
          warning: true
        });
      }
    });
    
    return issues;
  };

  const stockIssues = checkStockAvailability();
  const canProceed = stockIssues.filter(i => !i.warning).length === 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            Deduct Stock for Production
          </DialogTitle>
          <DialogDescription>
            {menuItem.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Servings Input */}
          <div>
            <Label>Number of Servings</Label>
            <Input
              type="number"
              min="1"
              value={servings}
              onChange={(e) => setServings(parseInt(e.target.value) || 1)}
              className="text-lg font-semibold"
            />
          </div>

          {/* Stock Check Results */}
          <Card>
            <CardContent className="pt-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                {stockIssues.length === 0 ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Stock Available</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-amber-700">{stockIssues.length} Issue(s)</span>
                  </>
                )}
              </h4>
              
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {menuItem.ingredients?.map((ing, i) => {
                    const inventoryItem = ingredients.find(inv => inv.id === ing.ingredient_id);
                    const needed = (ing.quantity || 0) * servings;
                    const available = inventoryItem?.current_stock || 0;
                    const afterDeduction = available - needed;
                    const issue = stockIssues.find(iss => iss.name === ing.ingredient_name);
                    
                    return (
                      <div 
                        key={i} 
                        className={`p-3 rounded-lg ${
                          issue 
                            ? issue.warning 
                              ? 'bg-amber-50 border border-amber-200' 
                              : 'bg-red-50 border border-red-200'
                            : 'bg-emerald-50 border border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{ing.ingredient_name}</span>
                          {issue ? (
                            <Badge variant="outline" className={
                              issue.warning ? 'border-amber-500 text-amber-700' : 'border-red-500 text-red-700'
                            }>
                              {issue.warning ? 'Warning' : 'Insufficient'}
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700">OK</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">
                            Need: {needed.toFixed(2)} {ing.unit}
                          </span>
                          <span className="text-slate-600">
                            Available: {available.toFixed(2)} {ing.unit}
                          </span>
                        </div>
                        {!issue && (
                          <div className="text-xs text-slate-500 mt-1">
                            After: {afterDeduction.toFixed(2)} {ing.unit}
                          </div>
                        )}
                        {issue && (
                          <p className="text-xs text-red-600 mt-1">{issue.issue}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleDeductStock}
              disabled={!canProceed || processing}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700"
            >
              {processing ? (
                'Processing...'
              ) : (
                <>
                  <Minus className="w-4 h-4 mr-2" />
                  Deduct Stock ({servings} serving{servings > 1 ? 's' : ''})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RecipeEditor({ menuItem, open, onClose }) {
  const queryClient = useQueryClient();
  const [baseServings, setBaseServings] = useState(1);
  const [recipeIngredients, setRecipeIngredients] = useState([]);

  // Fetch inventory ingredients
  const { data: inventoryIngredients = [] } = useQuery({
    queryKey: ['ingredients-master'],
    queryFn: () => base44.entities.Ingredient_Master_v1.list(),
    enabled: open
  });

  // Fetch existing recipe
  const { data: existingRecipe } = useQuery({
    queryKey: ['recipe-engine', menuItem?.id],
    queryFn: async () => {
      const recipes = await base44.entities.Recipe_Engine_v2.filter({ menu_item_id: menuItem.id });
      return recipes[0] || null;
    },
    enabled: !!menuItem?.id && open
  });

  // Initialize form with existing data
  useEffect(() => {
    if (existingRecipe) {
      setBaseServings(existingRecipe.portion_size || 1);
      setRecipeIngredients(existingRecipe.ingredients_per_serving || []);
    } else if (menuItem?.ingredients && menuItem.ingredients.length > 0) {
      // Fallback to MenuItem ingredients if Recipe_Engine_v2 doesn't exist
      setRecipeIngredients(menuItem.ingredients.map(ing => ({
        ingredient_id: ing.ingredient_id || '',
        ingredient_name: ing.ingredient_name || '',
        quantity: ing.quantity || 0,
        unit: ing.unit || 'g',
        cost_per_unit: ing.cost_per_unit || 0
      })));
    }
  }, [existingRecipe, menuItem, open]);

  const saveRecipeMutation = useMutation({
    mutationFn: async (recipeData) => {
      if (existingRecipe?.id) {
        return base44.entities.Recipe_Engine_v2.update(existingRecipe.id, recipeData);
      } else {
        return base44.entities.Recipe_Engine_v2.create(recipeData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recipe-engine']);
      queryClient.invalidateQueries(['menuItem']);
      toast.success('Recipe saved successfully');
      onClose();
    },
    onError: (error) => {
      console.error('Recipe save error:', error);
      toast.error('Failed to save recipe');
    }
  });

  const addIngredient = () => {
    setRecipeIngredients([
      ...recipeIngredients,
      { ingredient_id: '', ingredient_name: '', quantity: 0, unit: 'g', cost_per_unit: 0 }
    ]);
  };

  const removeIngredient = (index) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...recipeIngredients];
    updated[index][field] = value;

    // Auto-fill ingredient details when ingredient is selected
    if (field === 'ingredient_id') {
      const selectedIng = inventoryIngredients.find(ing => ing.id === value);
      if (selectedIng) {
        updated[index].ingredient_name = selectedIng.name;
        updated[index].cost_per_unit = selectedIng.cost_per_unit || 0;
        updated[index].unit = selectedIng.unit || 'g';
      }
    }

    setRecipeIngredients(updated);
  };

  const handleSave = () => {
    // Validation
    if (recipeIngredients.length === 0) {
      toast.error('Recipe must have at least 1 ingredient');
      return;
    }

    const hasInvalidIngredients = recipeIngredients.some(ing => 
      !ing.ingredient_id || !ing.ingredient_name || ing.quantity <= 0
    );

    if (hasInvalidIngredients) {
      toast.error('All ingredients must have a name and valid quantity');
      return;
    }

    const recipeData = {
      menu_item_id: menuItem.id,
      menu_item_name: menuItem.name,
      ingredients_per_serving: recipeIngredients,
      portion_size: baseServings,
      total_cost_per_serving: recipeIngredients.reduce((sum, ing) => 
        sum + (ing.quantity * ing.cost_per_unit), 0
      ),
      preparation_method: existingRecipe?.preparation_method || [],
      notes: existingRecipe?.notes || '',
      is_locked: false
    };

    saveRecipeMutation.mutate(recipeData);
  };

  const totalCost = recipeIngredients.reduce((sum, ing) => 
    sum + (ing.quantity * ing.cost_per_unit), 0
  );

  const isValid = recipeIngredients.length > 0 && 
    recipeIngredients.every(ing => ing.ingredient_id && ing.quantity > 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Recipe - {menuItem?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recipe Status */}
          <Card className={isValid ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                {isValid ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-800">
                      Recipe is complete - Portion ordering enabled
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <p className="text-sm font-semibold text-amber-800">
                      Recipe incomplete - Add ingredients to enable portion ordering
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Base Servings */}
          <div>
            <Label>Base Recipe Servings</Label>
            <p className="text-xs text-slate-500 mb-2">
              How many servings does this recipe make? (e.g., 1 portion, 10 portions)
            </p>
            <Input
              type="number"
              min="1"
              value={baseServings}
              onChange={(e) => setBaseServings(parseInt(e.target.value) || 1)}
              placeholder="Enter number of servings"
            />
          </div>

          {/* Ingredients List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Ingredients Per Serving</Label>
              <Button onClick={addIngredient} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Ingredient
              </Button>
            </div>

            {recipeIngredients.length === 0 ? (
              <Card className="bg-slate-50">
                <CardContent className="pt-6 text-center">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600 mb-4">No ingredients added yet</p>
                  <Button onClick={addIngredient} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Ingredient
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recipeIngredients.map((ing, index) => (
                  <Card key={index} className="border-2">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-12 gap-3 items-end">
                        {/* Ingredient Selector */}
                        <div className="col-span-5">
                          <Label className="text-xs">Ingredient</Label>
                          <Select
                            value={ing.ingredient_id}
                            onValueChange={(val) => updateIngredient(index, 'ingredient_id', val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select ingredient..." />
                            </SelectTrigger>
                            <SelectContent>
                              {inventoryIngredients.map(invIng => (
                                <SelectItem key={invIng.id} value={invIng.id}>
                                  {invIng.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Quantity */}
                        <div className="col-span-2">
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={ing.quantity}
                            onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>

                        {/* Unit */}
                        <div className="col-span-2">
                          <Label className="text-xs">Unit</Label>
                          <Select
                            value={ing.unit}
                            onValueChange={(val) => updateIngredient(index, 'unit', val)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="ml">ml</SelectItem>
                              <SelectItem value="pcs">pcs</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Cost Display */}
                        <div className="col-span-2">
                          <Label className="text-xs">Cost</Label>
                          <div className="h-10 flex items-center justify-center bg-slate-50 rounded-md border px-3">
                            <span className="text-sm font-semibold">
                              £{(ing.quantity * ing.cost_per_unit).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <div className="col-span-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeIngredient(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cost Summary */}
          {recipeIngredients.length > 0 && (
            <Card className="bg-slate-50">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-600">Total Cost Per Serving</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {recipeIngredients.length} ingredients tracked
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-slate-800">£{totalCost.toFixed(2)}</p>
                    {menuItem?.price && (
                      <p className="text-xs text-slate-500 mt-1">
                        Margin: {(((menuItem.price - totalCost) / menuItem.price) * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || saveRecipeMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveRecipeMutation.isPending ? 'Saving...' : 'Save Recipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
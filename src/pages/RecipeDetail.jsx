import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Edit, Plus, Trash2, ChefHat, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function RecipeDetail() {
  const [user, setUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const recipeId = urlParams.get('id');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () => base44.entities.Recipe_Engine_v2.filter({ id: recipeId }).then(r => r[0]),
    enabled: !!recipeId
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => base44.entities.Ingredient_Master_v1.list()
  });

  const { data: menuItem } = useQuery({
    queryKey: ['menuItem', recipe?.menu_item_id],
    queryFn: () => base44.entities.MenuItem.filter({ id: recipe.menu_item_id }).then(m => m[0]),
    enabled: !!recipe?.menu_item_id
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Recipe_Engine_v2.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['recipe', recipeId]);
      setShowEditDialog(false);
    }
  });

  if (isLoading) return <LoadingSpinner />;
  if (!recipe) return <div className="p-8 text-center">Recipe not found</div>;

  const isAdmin = user && ['admin', 'owner', 'manager'].includes(user.role);
  const totalCost = recipe.total_cost_per_serving || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('MenuManager')}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-800">{recipe.menu_item_name}</h1>
          <p className="text-slate-600">Recipe Details & Ingredients</p>
        </div>
        <div className="flex items-center gap-3">
          {recipe.is_locked && (
            <Badge variant="outline" className="border-red-300 text-red-700">
              🔒 READ-ONLY
            </Badge>
          )}
          {isAdmin && !recipe.is_locked && (
            <Button onClick={() => setShowEditDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Edit className="w-4 h-4 mr-2" />
              Edit Recipe
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500 mb-1">Portion Size</p>
            <p className="text-2xl font-bold text-slate-800">{recipe.portion_size || 1}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500 mb-1">Total Cost</p>
            <p className="text-2xl font-bold text-emerald-600">£{totalCost.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500 mb-1">Ingredients</p>
            <p className="text-2xl font-bold text-blue-600">{recipe.ingredients_per_serving?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500 mb-1">Menu Price</p>
            <p className="text-2xl font-bold text-purple-600">
              £{menuItem?.price?.toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ingredients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            Ingredients Per Serving
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recipe.ingredients_per_serving?.map((ing, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{ing.ingredient_name}</p>
                  <p className="text-sm text-slate-500">
                    {ing.quantity} {ing.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">
                    £{(ing.cost_per_unit * ing.quantity || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">per serving</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preparation Method */}
      {recipe.preparation_method?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preparation Method</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {recipe.preparation_method.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    {i + 1}
                  </div>
                  <p className="flex-1 pt-1 text-slate-700">{step}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {recipe.notes && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">Notes & Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-wrap">{recipe.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Recipe</DialogTitle>
          </DialogHeader>
          <RecipeForm
            recipe={recipe}
            ingredients={ingredients}
            onSubmit={(data) => updateMutation.mutate({ id: recipeId, data })}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecipeForm({ recipe, ingredients, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(recipe || {
    menu_item_name: '',
    portion_size: 1,
    ingredients_per_serving: [],
    preparation_method: [],
    notes: ''
  });

  const [newIngredient, setNewIngredient] = useState({
    ingredient_id: '',
    ingredient_name: '',
    quantity: 0,
    unit: 'g'
  });

  const [newStep, setNewStep] = useState('');

  const handleAddIngredient = () => {
    const selectedIng = ingredients.find(i => i.id === newIngredient.ingredient_id);
    if (!selectedIng) return;

    const newIng = {
      ingredient_id: selectedIng.id,
      ingredient_name: selectedIng.name,
      quantity: parseFloat(newIngredient.quantity),
      unit: newIngredient.unit,
      cost_per_unit: selectedIng.cost_per_unit || 0
    };

    setFormData(prev => ({
      ...prev,
      ingredients_per_serving: [...(prev.ingredients_per_serving || []), newIng]
    }));

    setNewIngredient({ ingredient_id: '', ingredient_name: '', quantity: 0, unit: 'g' });
  };

  const handleRemoveIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients_per_serving: prev.ingredients_per_serving.filter((_, i) => i !== index)
    }));
  };

  const handleAddStep = () => {
    if (!newStep.trim()) return;
    setFormData(prev => ({
      ...prev,
      preparation_method: [...(prev.preparation_method || []), newStep]
    }));
    setNewStep('');
  };

  const handleRemoveStep = (index) => {
    setFormData(prev => ({
      ...prev,
      preparation_method: prev.preparation_method.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calculate total cost
    const totalCost = formData.ingredients_per_serving.reduce((sum, ing) => {
      return sum + (ing.cost_per_unit * ing.quantity || 0);
    }, 0);

    onSubmit({
      ...formData,
      total_cost_per_serving: totalCost
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">Portion Size</label>
        <Input
          type="number"
          value={formData.portion_size}
          onChange={(e) => setFormData(prev => ({ ...prev, portion_size: parseInt(e.target.value) }))}
          min="1"
        />
      </div>

      {/* Ingredients */}
      <div>
        <label className="block text-sm font-medium mb-2">Ingredients</label>
        <div className="space-y-2 mb-3">
          {formData.ingredients_per_serving?.map((ing, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
              <span className="flex-1 text-sm">{ing.ingredient_name} - {ing.quantity} {ing.unit}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveIngredient(i)}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select value={newIngredient.ingredient_id} onValueChange={(v) => setNewIngredient(prev => ({ ...prev, ingredient_id: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select ingredient" />
            </SelectTrigger>
            <SelectContent>
              {ingredients.map(ing => (
                <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Quantity"
              value={newIngredient.quantity}
              onChange={(e) => setNewIngredient(prev => ({ ...prev, quantity: e.target.value }))}
              step="0.01"
            />
            <Select value={newIngredient.unit} onValueChange={(v) => setNewIngredient(prev => ({ ...prev, unit: v }))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="g">g</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="pcs">pcs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="button" onClick={handleAddIngredient} className="mt-2 w-full" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Ingredient
        </Button>
      </div>

      {/* Preparation Steps */}
      <div>
        <label className="block text-sm font-medium mb-2">Preparation Method</label>
        <div className="space-y-2 mb-3">
          {formData.preparation_method?.map((step, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 text-sm">{step}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveStep(i)}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Add preparation step..."
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStep())}
          />
          <Button type="button" onClick={handleAddStep} variant="outline">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1">Notes & Instructions</label>
        <textarea
          className="w-full min-h-[100px] p-3 border rounded-lg"
          value={formData.notes || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Allergens, hygiene notes, special instructions..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          Update Recipe
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Calculator, Sparkles, Upload, FileText, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const allergensList = [
  'Gluten', 'Dairy', 'Eggs', 'Nuts', 'Peanuts', 'Soy', 'Fish', 'Shellfish', 
  'Sesame', 'Mustard', 'Celery', 'Lupin', 'Sulphites', 'Molluscs'
];

export default function MenuItemForm({ item, onSubmit, onCancel, aiGenerating }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'mains',
    price: '',
    preparation_location: 'kitchen',
    prep_time_minutes: '',
    servings_per_batch: 1,
    wastage_percent: 5,
    allergens: [],
    ingredients: [],
    sop_id: '',
    is_active: true,
    is_available: true,
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
    calories: '',
    image_url: '',
    ...item
  });

  const [uploading, setUploading] = useState(false);
  const [selectedAllergen, setSelectedAllergen] = useState('');
  const [showNewIngredient, setShowNewIngredient] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    category: 'spice',
    unit: 'g',
    cost_per_unit: ''
  });

  const queryClient = useQueryClient();

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => base44.entities.Ingredient.list('name'),
  });

  const { data: sops = [] } = useQuery({
    queryKey: ['sops'],
    queryFn: () => base44.entities.SOP.filter({ status: 'active' }),
  });

  const createIngredientMutation = useMutation({
    mutationFn: (data) => base44.entities.Ingredient_Master_v1.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ingredients']);
      setShowNewIngredient(false);
      setNewIngredient({ name: '', category: 'spice', unit: 'g', cost_per_unit: '' });
      alert('✅ Ingredient created successfully!');
    },
    onError: (error) => {
      alert('❌ Failed to create ingredient: ' + (error.message || 'Unknown error'));
    }
  });

  useEffect(() => {
    calculateCosting();
  }, [formData.ingredients, formData.wastage_percent]);

  const calculateCosting = () => {
    if (!formData.ingredients || formData.ingredients.length === 0) return;
    
    const totalCost = formData.ingredients.reduce((sum, ing) => {
      return sum + ((ing.quantity || 0) * (ing.cost_per_unit || 0));
    }, 0);
    
    const wastageMultiplier = 1 + ((formData.wastage_percent || 0) / 100);
    const finalCost = totalCost * wastageMultiplier;
    const profit = (parseFloat(formData.price) || 0) - finalCost;
    const margin = formData.price > 0 ? (profit / formData.price * 100) : 0;
    
    setFormData(prev => ({
      ...prev,
      cost: finalCost,
      profit_margin: margin
    }));
  };

  const addIngredient = (ingredientId) => {
    const ingredient = ingredients.find(i => i.id === ingredientId);
    if (!ingredient) return;
    
    const newIngredient = {
      ingredient_id: ingredient.id,
      ingredient_name: ingredient.name,
      quantity: 0,
      unit: ingredient.unit,
      cost_per_unit: ingredient.cost_per_unit || 0,
      total_cost: 0
    };
    
    setFormData(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), newIngredient]
    }));
  };

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: parseFloat(value) || 0
    };
    
    if (field === 'quantity' || field === 'cost_per_unit') {
      newIngredients[index].total_cost = 
        newIngredients[index].quantity * newIngredients[index].cost_per_unit;
    }
    
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
  };

  const removeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const addAllergen = () => {
    if (!selectedAllergen || formData.allergens.includes(selectedAllergen)) return;
    setFormData(prev => ({
      ...prev,
      allergens: [...prev.allergens, selectedAllergen]
    }));
    setSelectedAllergen('');
  };

  const removeAllergen = (allergen) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.filter(a => a !== allergen)
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }
    
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      if (result && result.file_url) {
        setFormData(prev => ({ 
          ...prev, 
          photo_url: result.file_url,
          image_url: result.file_url 
        }));
      } else {
        throw new Error('Upload failed - no URL returned');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Ensure photo_url is set
    const photoUrl = formData.photo_url || formData.image_url;
    
    if (!photoUrl) {
      alert('Please upload a menu item image before submitting');
      return;
    }
    
    const submitData = {
      ...formData,
      photo_url: photoUrl,
      image_url: photoUrl,
      price: parseFloat(formData.price) || 0,
      prep_time_minutes: parseInt(formData.prep_time_minutes) || 0,
      servings_per_batch: parseInt(formData.servings_per_batch) || 1,
      wastage_percent: parseFloat(formData.wastage_percent) || 5,
      calories: parseInt(formData.calories) || 0,
      ingredients: formData.ingredients || [],
      allergens: formData.allergens || [],
      last_costed: new Date().toISOString()
    };
    
    onSubmit(submitData);
  };

  const totalCost = formData.cost || 0;
  const profit = (parseFloat(formData.price) || 0) - totalCost;
  const margin = formData.price > 0 ? (profit / formData.price * 100) : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label>Item Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Masala Chai, Butter Chicken"
            required
          />
        </div>
        
        <div className="md:col-span-2">
          <Label>Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the item..."
            rows={2}
          />
        </div>
        
        <div>
          <Label>Category *</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hot_drinks">☕ Hot Drinks</SelectItem>
              <SelectItem value="cold_drinks">🥤 Cold Drinks</SelectItem>
              <SelectItem value="starters">🥗 Starters</SelectItem>
              <SelectItem value="mains">🍛 Mains</SelectItem>
              <SelectItem value="desserts">🍰 Desserts</SelectItem>
              <SelectItem value="sides">🍟 Sides</SelectItem>
              <SelectItem value="breakfast">🍳 Breakfast</SelectItem>
              <SelectItem value="snacks">🥨 Snacks</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Preparation Location *</Label>
          <Select value={formData.preparation_location} onValueChange={(v) => setFormData({ ...formData, preparation_location: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="kitchen">Kitchen</SelectItem>
              <SelectItem value="bar">Bar</SelectItem>
              <SelectItem value="tandoor">Tandoor</SelectItem>
              <SelectItem value="grill">Grill</SelectItem>
              <SelectItem value="coffee_station">Coffee Station</SelectItem>
              <SelectItem value="prep_area">Prep Area</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Sale Price (£) *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />
        </div>
        
        <div>
          <Label>Prep Time (minutes)</Label>
          <Input
            type="number"
            value={formData.prep_time_minutes}
            onChange={(e) => setFormData({ ...formData, prep_time_minutes: e.target.value })}
          />
        </div>
        
        <div>
          <Label>Servings per Batch</Label>
          <Input
            type="number"
            value={formData.servings_per_batch}
            onChange={(e) => setFormData({ ...formData, servings_per_batch: e.target.value })}
          />
        </div>
        
        <div>
          <Label>Wastage % (default 5%)</Label>
          <Input
            type="number"
            step="0.1"
            value={formData.wastage_percent}
            onChange={(e) => setFormData({ ...formData, wastage_percent: e.target.value })}
          />
        </div>
      </div>

      {/* Ingredients Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Recipe Ingredients & Quantities
            </CardTitle>
            <Badge className="bg-emerald-100 text-emerald-700 text-xs">Quantity Used Per Serving</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Select onValueChange={addIngredient}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Add ingredient..." />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-64">
                    {ingredients.map(ing => (
                      <SelectItem key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit}) - £{ing.cost_per_unit?.toFixed(2) || '0.00'}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                onClick={() => setShowNewIngredient(!showNewIngredient)}
                variant={showNewIngredient ? "default" : "outline"}
                className={showNewIngredient ? "bg-emerald-600" : ""}
              >
                <Plus className="w-4 h-4" />
                New
              </Button>
            </div>

            {showNewIngredient && (
              <div className="p-4 border-2 border-emerald-200 rounded-lg bg-emerald-50 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-emerald-900">Create New Ingredient</h4>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowNewIngredient(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Ingredient Name *</Label>
                    <Input
                      value={newIngredient.name}
                      onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
                      placeholder="e.g., Turmeric Powder"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Category *</Label>
                    <Select 
                      value={newIngredient.category} 
                      onValueChange={(v) => setNewIngredient({...newIngredient, category: v})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meat">Meat</SelectItem>
                        <SelectItem value="dairy">Dairy</SelectItem>
                        <SelectItem value="veg">Vegetables</SelectItem>
                        <SelectItem value="spice">Spices</SelectItem>
                        <SelectItem value="dry_goods">Dry Goods</SelectItem>
                        <SelectItem value="sauce">Sauces</SelectItem>
                        <SelectItem value="oil">Oils</SelectItem>
                        <SelectItem value="beverage">Beverages</SelectItem>
                        <SelectItem value="bread">Bread</SelectItem>
                        <SelectItem value="frozen">Frozen</SelectItem>
                        <SelectItem value="garnish">Garnish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Unit *</Label>
                    <Select 
                      value={newIngredient.unit} 
                      onValueChange={(v) => setNewIngredient({...newIngredient, unit: v})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">Grams (g)</SelectItem>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                        <SelectItem value="ml">Milliliters (ml)</SelectItem>
                        <SelectItem value="L">Liters (L)</SelectItem>
                        <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Cost per Unit (£) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newIngredient.cost_per_unit}
                      onChange={(e) => setNewIngredient({...newIngredient, cost_per_unit: e.target.value})}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    if (!newIngredient.name || !newIngredient.cost_per_unit) {
                      alert('Please fill all required fields');
                      return;
                    }
                    createIngredientMutation.mutate({
                      ...newIngredient,
                      cost_per_unit: parseFloat(newIngredient.cost_per_unit),
                      current_stock: 0,
                      is_active: true
                    });
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={createIngredientMutation.isPending}
                >
                  <Check className="w-4 h-4 mr-2" />
                  {createIngredientMutation.isPending ? 'Creating...' : 'Create Ingredient'}
                </Button>
              </div>
            )}
          </div>
          
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {formData.ingredients?.map((ing, index) => {
                const inventoryItem = ingredients.find(i => i.id === ing.ingredient_id);
                const currentStock = inventoryItem?.current_stock || 0;
                const servingsAvailable = ing.quantity > 0 ? Math.floor(currentStock / ing.quantity) : 0;
                
                return (
                  <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{ing.ingredient_name}</p>
                        {inventoryItem && (
                          <Badge className={
                            servingsAvailable > 20 ? 'bg-emerald-100 text-emerald-700 text-xs mt-1' :
                            servingsAvailable > 5 ? 'bg-amber-100 text-amber-700 text-xs mt-1' :
                            'bg-red-100 text-red-700 text-xs mt-1'
                          }>
                            Stock: {currentStock.toFixed(1)} {ing.unit} • {servingsAvailable} servings
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeIngredient(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Label className="text-xs text-slate-600 mb-1">Quantity per serving</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={ing.quantity}
                          onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <span className="text-sm text-slate-600 min-w-12 mt-5">{ing.unit}</span>
                      <div className="min-w-24 text-right mt-5">
                        <div className="text-sm font-bold text-emerald-700">£{ing.total_cost?.toFixed(2) || '0.00'}</div>
                        <div className="text-xs text-slate-500">cost/serving</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          
          {/* Cost Summary */}
          {formData.ingredients?.length > 0 && (
            <>
              <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-slate-500">Total Cost</p>
                    <p className="text-lg font-bold text-slate-800">£{totalCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Profit</p>
                    <p className={`text-lg font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      £{profit.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Margin</p>
                    <p className={`text-lg font-bold ${margin >= 40 ? 'text-emerald-600' : margin >= 20 ? 'text-amber-600' : 'text-red-600'}`}>
                      {margin.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-sm">
                <Sparkles className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                <div className="text-blue-900">
                  <p className="font-medium">Smart Ordering Ready</p>
                  <p className="text-xs text-blue-700 mt-1">
                    After saving, use "Order by Dish" to calculate and order exact ingredient quantities for any number of servings.
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Allergens */}
      <div>
        <Label>Allergens</Label>
        <div className="flex gap-2 mb-2">
          <Select value={selectedAllergen} onValueChange={setSelectedAllergen}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Add allergen..." />
            </SelectTrigger>
            <SelectContent>
              {allergensList.map(allergen => (
                <SelectItem key={allergen} value={allergen}>{allergen}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={addAllergen} disabled={!selectedAllergen}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.allergens?.map(allergen => (
            <Badge key={allergen} variant="outline" className="border-red-200 text-red-600">
              {allergen}
              <button
                type="button"
                onClick={() => removeAllergen(allergen)}
                className="ml-2 hover:text-red-800"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* SOP Link */}
      <div>
        <Label>Linked SOP (Preparation Guide)</Label>
        <Select value={formData.sop_id || ''} onValueChange={(v) => setFormData({ ...formData, sop_id: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select preparation SOP..." />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-64">
              {sops.map(sop => (
                <SelectItem key={sop.id} value={sop.id}>
                  <FileText className="w-4 h-4 mr-2 inline" />
                  {sop.title}
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>

      {/* Dietary Flags */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_vegetarian}
            onCheckedChange={(v) => setFormData({ ...formData, is_vegetarian: v })}
            id="vegetarian"
          />
          <Label htmlFor="vegetarian">🌱 Vegetarian</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_vegan}
            onCheckedChange={(v) => setFormData({ ...formData, is_vegan: v })}
            id="vegan"
          />
          <Label htmlFor="vegan">🌿 Vegan</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_gluten_free}
            onCheckedChange={(v) => setFormData({ ...formData, is_gluten_free: v })}
            id="gluten_free"
          />
          <Label htmlFor="gluten_free">GF</Label>
        </div>
      </div>

      {/* Status Toggles */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
            id="active"
          />
          <Label htmlFor="active">Active on Menu</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_available}
            onCheckedChange={(v) => setFormData({ ...formData, is_available: v })}
            id="available"
          />
          <Label htmlFor="available">Currently Available</Label>
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <Label>Menu Item Image *</Label>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              disabled={uploading}
              className="flex-1"
            />
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                Uploading...
              </div>
            )}
          </div>
          {(formData.image_url || formData.photo_url) && (
            <div className="relative inline-block">
              <img 
                src={formData.photo_url || formData.image_url} 
                alt="Preview" 
                className="w-48 h-48 object-cover rounded-lg border-2 border-emerald-200 shadow-md" 
              />
              <Badge className="absolute top-2 right-2 bg-emerald-600 text-white">
                ✓ Uploaded
              </Badge>
            </div>
          )}
          {!formData.image_url && !formData.photo_url && (
            <div className="w-48 h-48 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Upload image</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-emerald-700" disabled={aiGenerating}>
          {aiGenerating ? 'Generating...' : item ? 'Update' : 'Create'} Menu Item
        </Button>
      </div>
    </form>
  );
}
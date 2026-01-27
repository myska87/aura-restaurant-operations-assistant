import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calculator, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Printer, 
  Download, 
  Mail, 
  Package,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SmartOrderCreator from './SmartOrderCreator';

export default function PortionOrderingDialog({ menuItem, onClose }) {
  const [selectedPortions, setSelectedPortions] = useState(50);
  const [customPortions, setCustomPortions] = useState('');
  const [basket, setBasket] = useState({});
  const [activeTab, setActiveTab] = useState('calculator');
  const [showOrderCreator, setShowOrderCreator] = useState(false);

  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes_v2'],
    queryFn: () => base44.entities.Recipe_Engine_v2.list(),
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients_master'],
    queryFn: () => base44.entities.Ingredient_Master_v1.list(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers_directory'],
    queryFn: () => base44.entities.Supplier_Directory_v1.list(),
  });

  // Find recipe for this menu item
  const recipe = recipes.find(r => r.menu_item_id === menuItem.id);

  // Calculate required quantities
  const calculateQuantities = () => {
    if (!recipe || !recipe.ingredients_per_serving) return [];

    const portions = customPortions ? parseInt(customPortions) : selectedPortions;
    
    return recipe.ingredients_per_serving.map(ing => {
      const totalQty = ing.quantity * portions;
      const ingredientData = ingredients.find(i => i.id === ing.ingredient_id)?.data || {};
      const currentStock = ingredientData.current_stock || 0;
      const minStock = ingredientData.min_stock_level || 0;
      const supplierData = suppliers.find(s => s.id === ingredientData.supplier_id)?.data || {};

      return {
        ...ing,
        ingredientData,
        supplierData,
        totalQty,
        currentStock,
        minStock,
        needed: Math.max(0, totalQty - currentStock),
        hasEnough: currentStock >= totalQty,
        inBasket: basket[ing.ingredient_id] || false
      };
    });
  };

  const calculatedIngredients = calculateQuantities();

  // Group by supplier
  const groupedBySupplier = calculatedIngredients.reduce((acc, ing) => {
    const supplierName = ing.supplierData.supplier_name || 'No Supplier';
    if (!acc[supplierName]) acc[supplierName] = [];
    acc[supplierName].push(ing);
    return acc;
  }, {});

  // Basket summary
  const basketItems = calculatedIngredients.filter(ing => basket[ing.ingredient_id]);
  const basketBySupplier = basketItems.reduce((acc, ing) => {
    const supplierName = ing.supplierData.supplier_name || 'No Supplier';
    if (!acc[supplierName]) acc[supplierName] = [];
    acc[supplierName].push(ing);
    return acc;
  }, {});

  const handleAddToBasket = (ingredientId) => {
    setBasket(prev => ({ ...prev, [ingredientId]: true }));
  };

  const handleRemoveFromBasket = (ingredientId) => {
    setBasket(prev => {
      const newBasket = { ...prev };
      delete newBasket[ingredientId];
      return newBasket;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const portions = customPortions ? parseInt(customPortions) : selectedPortions;
    let csv = `Ingredient Order List\n`;
    csv += `Menu Item: ${menuItem.name}\n`;
    csv += `Portions: ${portions}\n`;
    csv += `Date: ${new Date().toLocaleDateString()}\n\n`;
    csv += `Ingredient,Quantity,Unit,Supplier,Current Stock,Status\n`;

    basketItems.forEach(ing => {
      csv += `"${ing.ingredient_name}",${ing.totalQty.toFixed(2)},${ing.unit},"${ing.supplierData.supplier_name || 'N/A'}",${ing.currentStock.toFixed(2)},${ing.hasEnough ? 'In Stock' : 'Order Needed'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-${menuItem.name.replace(/\s/g, '_')}-${portions}portions.csv`;
    a.click();
  };

  const portions = customPortions ? parseInt(customPortions) : selectedPortions;

  if (!recipe) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-amber-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Recipe Required</h3>
        <p className="text-slate-600 mb-6">
          "{menuItem.name}" needs a recipe with ingredient quantities before you can order by portions.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-blue-900 font-semibold mb-2">What's a recipe?</p>
          <p className="text-sm text-blue-800">
            A recipe links your menu item to specific ingredients with exact quantities. This allows automatic calculation when ordering multiple portions.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={() => {
              onClose();
              // Trigger recipe editor via event
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('openRecipeEditor', { detail: { menuItem } }));
              }, 100);
            }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Recipe
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">{menuItem.name}</h2>
            <p className="text-slate-600">Order Ingredients by Portions</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Portion Selector */}
        <div className="bg-white rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-800">Select Portions</h3>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {[20, 50, 100, 150].map(num => (
              <Button
                key={num}
                variant={selectedPortions === num && !customPortions ? 'default' : 'outline'}
                onClick={() => { setSelectedPortions(num); setCustomPortions(''); }}
                className={selectedPortions === num && !customPortions ? 'bg-emerald-600' : ''}
              >
                {num} portions
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Custom portions..."
              value={customPortions}
              onChange={(e) => setCustomPortions(e.target.value)}
              min="1"
              className="flex-1"
            />
            <Button variant="outline" onClick={() => setCustomPortions('')}>
              Clear
            </Button>
          </div>

          {portions > 0 && (
            <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
              <p className="text-sm text-emerald-800">
                <span className="font-bold text-lg">{portions}</span> portions selected
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-6 pt-4">
          <TabsList className="bg-white border">
            <TabsTrigger value="calculator">
              <Calculator className="w-4 h-4 mr-2" />
              Calculate
            </TabsTrigger>
            <TabsTrigger value="basket">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Basket ({basketItems.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-6 pb-6">
            <div className="space-y-4">
              {Object.entries(groupedBySupplier).map(([supplierName, ings]) => (
                <Card key={supplierName}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="w-5 h-5 text-purple-600" />
                      {supplierName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {ings.map((ing) => (
                      <div
                        key={ing.ingredient_id}
                        className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800 mb-1">{ing.ingredient_name}</h4>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge className="bg-emerald-600 text-white">
                                Need: {ing.totalQty.toFixed(2)} {ing.unit}
                              </Badge>
                              <Badge variant="outline">
                                Stock: {ing.currentStock.toFixed(2)} {ing.unit}
                              </Badge>
                              {ing.hasEnough ? (
                                <Badge className="bg-green-100 text-green-700">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Sufficient
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-700">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Order {ing.needed.toFixed(2)} {ing.unit}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {ing.quantity.toFixed(2)} {ing.unit} × {portions} portions = {ing.totalQty.toFixed(2)} {ing.unit}
                            </div>
                          </div>
                          <div className="ml-4">
                            {ing.inBasket ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveFromBasket(ing.ingredient_id)}
                                className="border-red-300 text-red-600"
                              >
                                <Minus className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleAddToBasket(ing.ingredient_id)}
                                className="bg-emerald-600"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Stock bar */}
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              ing.hasEnough ? 'bg-green-600' : 'bg-amber-600'
                            }`}
                            style={{ width: `${Math.min((ing.currentStock / ing.totalQty) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Basket Tab */}
        <TabsContent value="basket" className="flex-1 overflow-hidden flex flex-col">
          {basketItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <ShoppingCart className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Basket is Empty</h3>
                <p className="text-slate-500">Add ingredients from the Calculate tab</p>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 px-6 pb-6">
                <div className="space-y-4">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-blue-900">{basketItems.length}</p>
                          <p className="text-xs text-blue-700">Items</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-900">{portions}</p>
                          <p className="text-xs text-blue-700">Portions</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-900">{Object.keys(basketBySupplier).length}</p>
                          <p className="text-xs text-blue-700">Suppliers</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {Object.entries(basketBySupplier).map(([supplierName, ings]) => (
                    <Card key={supplierName}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-purple-600" />
                            {supplierName}
                          </span>
                          <Badge>{ings.length} items</Badge>
                        </CardTitle>
                        {ings[0].supplierData.contact_person && (
                          <p className="text-sm text-slate-500">
                            Contact: {ings[0].supplierData.contact_person} • {ings[0].supplierData.phone}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {ings.map((ing) => (
                          <div
                            key={ing.ingredient_id}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800">{ing.ingredient_name}</p>
                              <p className="text-sm text-slate-600">
                                Order: <span className="font-bold">{ing.totalQty.toFixed(2)} {ing.unit}</span>
                                {!ing.hasEnough && (
                                  <span className="text-amber-600 ml-2">
                                    (Need {ing.needed.toFixed(2)} more)
                                  </span>
                                )}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveFromBasket(ing.ingredient_id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {/* Action Buttons */}
              <div className="p-6 border-t bg-white space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Button onClick={handlePrint} variant="outline">
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button onClick={handleExport} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" disabled>
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  size="lg"
                  onClick={() => setShowOrderCreator(true)}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Create Orders ({Object.keys(basketBySupplier).length} supplier{Object.keys(basketBySupplier).length > 1 ? 's' : ''})
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Smart Order Creator */}
      <SmartOrderCreator
        ingredientsList={basketItems.map(ing => ({
          ingredient_id: ing.ingredient_id,
          ingredient_name: ing.ingredient_name,
          quantity: ing.needed > 0 ? ing.needed : ing.totalQty,
          unit: ing.unit,
          cost_per_unit: ing.ingredientData?.cost_per_unit || 0,
          supplier_id: ing.ingredientData?.supplier_id,
          supplier_name: ing.supplierData?.supplier_name || ing.ingredientData?.supplier_name
        }))}
        orderType="menu_based"
        menuItemName={menuItem.name}
        open={showOrderCreator}
        onClose={() => setShowOrderCreator(false)}
      />
    </div>
  );
}
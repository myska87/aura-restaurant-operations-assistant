import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { allergenList } from '@/components/pos/AllergenConfirmation';

// Common ingredient to allergen mapping
const ingredientAllergenMap = {
  // Dairy
  'milk': ['milk'],
  'cream': ['milk'],
  'butter': ['milk'],
  'ghee': ['milk'],
  'cheese': ['milk'],
  'paneer': ['milk'],
  'yogurt': ['milk'],
  'yoghurt': ['milk'],
  'dahi': ['milk'],
  'khoya': ['milk'],
  'mawa': ['milk'],
  
  // Eggs
  'egg': ['eggs'],
  'mayo': ['eggs'],
  'mayonnaise': ['eggs'],
  
  // Gluten
  'wheat': ['gluten'],
  'flour': ['gluten'],
  'atta': ['gluten'],
  'maida': ['gluten'],
  'bread': ['gluten'],
  'roti': ['gluten'],
  'paratha': ['gluten'],
  'naan': ['gluten'],
  'pasta': ['gluten'],
  'soy sauce': ['gluten', 'soy'],
  
  // Nuts
  'almond': ['nuts'],
  'cashew': ['nuts'],
  'kaju': ['nuts'],
  'badam': ['nuts'],
  'pistachio': ['nuts'],
  'pista': ['nuts'],
  'walnut': ['nuts'],
  'hazelnut': ['nuts'],
  'peanut': ['peanuts'],
  
  // Soy
  'soy': ['soy'],
  'soya': ['soy'],
  'tofu': ['soy'],
  
  // Sesame
  'sesame': ['sesame'],
  'til': ['sesame'],
  
  // Mustard
  'mustard': ['mustard'],
  'sarson': ['mustard'],
  
  // Celery
  'celery': ['celery'],
  
  // Fish
  'fish': ['fish'],
  'salmon': ['fish'],
  'tuna': ['fish'],
  'cod': ['fish'],
  
  // Shellfish
  'prawn': ['crustaceans'],
  'shrimp': ['crustaceans'],
  'crab': ['crustaceans'],
  'lobster': ['crustaceans'],
  'mussel': ['molluscs'],
  'oyster': ['molluscs'],
  'clam': ['molluscs'],
  'squid': ['molluscs'],
  
  // Sulphites
  'wine': ['sulphites'],
  'vinegar': ['sulphites'],
  'dried fruit': ['sulphites']
};

export default function AllergenHelper({ menuItem, onUpdate }) {
  const [detectedAllergens, setDetectedAllergens] = useState([]);
  const [hasScanned, setHasScanned] = useState(false);

  const scanIngredients = () => {
    if (!menuItem?.ingredients) {
      setDetectedAllergens([]);
      setHasScanned(true);
      return;
    }

    const allergens = new Set();
    
    menuItem.ingredients.forEach(ing => {
      const ingredientName = (ing.ingredient_name || '').toLowerCase();
      
      Object.entries(ingredientAllergenMap).forEach(([key, allergenIds]) => {
        if (ingredientName.includes(key)) {
          allergenIds.forEach(id => allergens.add(id));
        }
      });
    });

    setDetectedAllergens(Array.from(allergens));
    setHasScanned(true);
  };

  const applyAllergens = () => {
    onUpdate(detectedAllergens);
  };

  const currentAllergens = menuItem?.allergens || [];
  const hasChanges = JSON.stringify(detectedAllergens.sort()) !== JSON.stringify(currentAllergens.sort());

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <Sparkles className="w-5 h-5" />
          Allergen Auto-Detection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-amber-800">
          Automatically detect allergens from ingredients. This helps ensure accuracy and compliance.
        </p>

        {!hasScanned ? (
          <Button onClick={scanIngredients} className="w-full bg-amber-600 hover:bg-amber-700">
            <Sparkles className="w-4 h-4 mr-2" />
            Scan Ingredients for Allergens
          </Button>
        ) : (
          <>
            {detectedAllergens.length === 0 ? (
              <Card className="bg-emerald-50 border-emerald-300">
                <CardContent className="pt-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <p className="text-sm text-emerald-800 font-semibold">
                    No allergens detected in ingredients
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="bg-red-50 border-red-300">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-red-900 font-semibold mb-2">
                          Detected Allergens ({detectedAllergens.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {detectedAllergens.map(allergenId => {
                            const allergen = allergenList.find(a => a.id === allergenId);
                            return (
                              <Badge key={allergenId} className={`${allergen?.color} text-sm px-3 py-1`}>
                                {allergen?.icon} {allergen?.label}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {hasChanges && (
                  <Button onClick={applyAllergens} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Apply Detected Allergens to Menu Item
                  </Button>
                )}
              </>
            )}

            <Button onClick={scanIngredients} variant="outline" className="w-full" size="sm">
              Re-scan Ingredients
            </Button>
          </>
        )}

        {currentAllergens.length > 0 && (
          <div className="pt-3 border-t border-amber-200">
            <p className="text-xs text-amber-700 font-semibold mb-2">Current Allergens on Menu Item:</p>
            <div className="flex flex-wrap gap-1">
              {currentAllergens.map(allergenId => {
                const allergen = allergenList.find(a => a.id === allergenId);
                return (
                  <Badge key={allergenId} variant="outline" className="text-xs">
                    {allergen?.icon} {allergen?.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
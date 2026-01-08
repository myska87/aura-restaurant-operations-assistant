import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Lightbulb, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AIMenuAssistant({ open, onClose, onGenerate, ingredients }) {
  const [mode, setMode] = useState('create'); // create, optimize, analyze, sop
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      if (mode === 'create') {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Create a restaurant menu item based on this description: "${prompt}"
          
          Available ingredients: ${ingredients.map(i => `${i.name} (${i.unit}, £${i.cost_per_unit}/unit)`).join(', ')}
          
          Generate a complete menu item with:
          {
            "name": "Item name",
            "description": "Appetizing description",
            "category": "one of: hot_drinks, cold_drinks, starters, mains, desserts, sides",
            "price": suggested price in GBP,
            "preparation_location": "kitchen/bar/tandoor/grill",
            "prep_time_minutes": estimated time,
            "ingredients": [
              {
                "ingredient_name": "name from available list",
                "quantity": amount needed,
                "unit": "kg/g/L/ml"
              }
            ],
            "allergens": ["list of allergens"],
            "is_vegetarian": boolean,
            "is_vegan": boolean
          }`,
          response_json_schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              category: { type: "string" },
              price: { type: "number" },
              preparation_location: { type: "string" },
              prep_time_minutes: { type: "number" },
              ingredients: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    ingredient_name: { type: "string" },
                    quantity: { type: "number" },
                    unit: { type: "string" }
                  }
                }
              },
              allergens: { type: "array", items: { type: "string" } },
              is_vegetarian: { type: "boolean" },
              is_vegan: { type: "boolean" }
            }
          }
        });
        
        // Match ingredients with IDs
        const matchedIngredients = response.ingredients?.map(ing => {
          const matched = ingredients.find(i => 
            i.name.toLowerCase().includes(ing.ingredient_name.toLowerCase()) ||
            ing.ingredient_name.toLowerCase().includes(i.name.toLowerCase())
          );
          return {
            ingredient_id: matched?.id || '',
            ingredient_name: ing.ingredient_name,
            quantity: ing.quantity,
            unit: matched?.unit || ing.unit,
            cost_per_unit: matched?.cost_per_unit || 0,
            total_cost: (ing.quantity || 0) * (matched?.cost_per_unit || 0)
          };
        });
        
        onGenerate({ ...response, ingredients: matchedIngredients });
        onClose();
        
      } else if (mode === 'optimize') {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this menu item request and suggest cheaper ingredient alternatives:
          
          "${prompt}"
          
          Available ingredients: ${ingredients.map(i => `${i.name} (£${i.cost_per_unit}/unit)`).join(', ')}
          
          Provide suggestions in JSON format:
          {
            "analysis": "brief analysis of the request",
            "suggestions": [
              {
                "original": "ingredient name",
                "alternative": "cheaper alternative",
                "savings": "estimated savings in GBP"
              }
            ]
          }`,
          response_json_schema: {
            type: "object",
            properties: {
              analysis: { type: "string" },
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    original: { type: "string" },
                    alternative: { type: "string" },
                    savings: { type: "string" }
                  }
                }
              }
            }
          }
        });
        
        setResult(response);
        
      } else if (mode === 'analyze') {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze menu profitability: ${prompt}
          
          Provide analysis in JSON:
          {
            "insights": ["list of insights"],
            "recommendations": ["list of recommendations"]
          }`,
          response_json_schema: {
            type: "object",
            properties: {
              insights: { type: "array", items: { type: "string" } },
              recommendations: { type: "array", items: { type: "string" } }
            }
          }
        });
        
        setResult(response);
      }
    } catch (error) {
      console.error('AI generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            AI Menu Assistant
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Mode Selection */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={mode === 'create' ? 'default' : 'outline'}
              onClick={() => setMode('create')}
              className="justify-start"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create Item
            </Button>
            <Button
              variant={mode === 'optimize' ? 'default' : 'outline'}
              onClick={() => setMode('optimize')}
              className="justify-start"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Optimize Cost
            </Button>
            <Button
              variant={mode === 'analyze' ? 'default' : 'outline'}
              onClick={() => setMode('analyze')}
              className="justify-start"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Analyze Menu
            </Button>
          </div>

          {/* Prompt Input */}
          <div>
            <Textarea
              placeholder={
                mode === 'create' ? 'Describe the menu item you want to create, e.g., "A spicy tandoori chicken wrap with mint yogurt sauce"' :
                mode === 'optimize' ? 'Enter a menu item name or ingredients to find cheaper alternatives' :
                'Ask about menu profitability, popular items, or get recommendations'
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600"
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {mode === 'create' ? 'Generate Menu Item' : 
                 mode === 'optimize' ? 'Get Suggestions' : 
                 'Analyze'}
              </>
            )}
          </Button>

          {/* Results Display */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-64">
                  {mode === 'optimize' && result.suggestions && (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-600">{result.analysis}</p>
                      {result.suggestions.map((sug, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{sug.original}</span>
                            <Badge className="bg-emerald-100 text-emerald-700">
                              Save {sug.savings}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">→ Use {sug.alternative} instead</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {mode === 'analyze' && result.insights && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Insights</h4>
                        <ul className="space-y-1">
                          {result.insights.map((insight, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-emerald-600">•</span>
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Recommendations</h4>
                        <ul className="space-y-1">
                          {result.recommendations.map((rec, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-amber-600">→</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DataConsistencyCheck() {
  const [checking, setChecking] = useState(false);
  const [issues, setIssues] = useState(null);

  const runCheck = async () => {
    setChecking(true);
    try {
      const menuItems = await base44.entities.MenuItem.list();
      const sops = await base44.entities.SOP.list();
      const ingredients = await base44.entities.Ingredient.list();

      const foundIssues = {
        menuItemsWithoutRecipes: [],
        menuItemsWithoutSOPs: [],
        menuItemsWithMissingIngredients: [],
        orphanedSOPs: []
      };

      // Check menu items
      for (const item of menuItems) {
        // Check for recipe (ingredients array)
        if (!item.ingredients || item.ingredients.length === 0) {
          foundIssues.menuItemsWithoutRecipes.push({
            id: item.id,
            name: item.name,
            issue: 'No recipe/ingredients defined',
            suggestion: 'Add ingredients array to menu item'
          });
        } else {
          // Check if ingredients exist in inventory
          for (const ing of item.ingredients) {
            if (ing.ingredient_id) {
              const exists = ingredients.find(i => i.id === ing.ingredient_id);
              if (!exists) {
                foundIssues.menuItemsWithMissingIngredients.push({
                  id: item.id,
                  name: item.name,
                  ingredientName: ing.ingredient_name,
                  issue: `Ingredient "${ing.ingredient_name}" not found in inventory`,
                  suggestion: 'Create ingredient in Inventory or update recipe'
                });
              }
            }
          }
        }

        // Check for SOP link
        if (!item.sop_id) {
          foundIssues.menuItemsWithoutSOPs.push({
            id: item.id,
            name: item.name,
            issue: 'No SOP linked',
            suggestion: 'Create and link SOP for preparation instructions'
          });
        } else {
          const sopExists = sops.find(s => s.id === item.sop_id);
          if (!sopExists) {
            foundIssues.menuItemsWithoutSOPs.push({
              id: item.id,
              name: item.name,
              issue: 'Linked SOP does not exist',
              suggestion: 'Update SOP link or create missing SOP'
            });
          }
        }
      }

      // Check for orphaned SOPs (SOPs not linked to any menu item)
      for (const sop of sops) {
        const linkedItem = menuItems.find(m => m.sop_id === sop.id);
        if (!linkedItem && sop.menu_item_id) {
          const referencedItem = menuItems.find(m => m.id === sop.menu_item_id);
          if (!referencedItem) {
            foundIssues.orphanedSOPs.push({
              id: sop.id,
              name: sop.title,
              issue: 'SOP references non-existent menu item',
              suggestion: 'Update menu_item_id or link to existing menu item'
            });
          }
        }
      }

      setIssues(foundIssues);
    } catch (error) {
      console.error('Check failed:', error);
    } finally {
      setChecking(false);
    }
  };

  const totalIssues = issues 
    ? Object.values(issues).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Data Consistency Check
          </CardTitle>
          <Button 
            onClick={runCheck} 
            disabled={checking}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            Run Check
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {checking && <LoadingSpinner message="Checking data consistency..." />}
        
        {issues && !checking && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
              {totalIssues === 0 ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700">All checks passed! No issues found.</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-700">{totalIssues} issues found</span>
                </>
              )}
            </div>

            {/* Menu Items Without Recipes */}
            {issues.menuItemsWithoutRecipes.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-red-600 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Menu Items Without Recipes ({issues.menuItemsWithoutRecipes.length})
                </h4>
                {issues.menuItemsWithoutRecipes.map(issue => (
                  <div key={issue.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-medium text-sm">{issue.name}</p>
                    <p className="text-xs text-red-600 mt-1">{issue.issue}</p>
                    <p className="text-xs text-slate-600 mt-1">💡 {issue.suggestion}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Missing Ingredients */}
            {issues.menuItemsWithMissingIngredients.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-amber-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Missing Ingredients ({issues.menuItemsWithMissingIngredients.length})
                </h4>
                {issues.menuItemsWithMissingIngredients.map((issue, idx) => (
                  <div key={idx} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="font-medium text-sm">{issue.name}</p>
                    <p className="text-xs text-amber-600 mt-1">{issue.issue}</p>
                    <p className="text-xs text-slate-600 mt-1">💡 {issue.suggestion}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Menu Items Without SOPs */}
            {issues.menuItemsWithoutSOPs.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Menu Items Without SOPs ({issues.menuItemsWithoutSOPs.length})
                </h4>
                {issues.menuItemsWithoutSOPs.map(issue => (
                  <div key={issue.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-medium text-sm">{issue.name}</p>
                    <p className="text-xs text-blue-600 mt-1">{issue.issue}</p>
                    <p className="text-xs text-slate-600 mt-1">💡 {issue.suggestion}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Orphaned SOPs */}
            {issues.orphanedSOPs.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Orphaned SOPs ({issues.orphanedSOPs.length})
                </h4>
                {issues.orphanedSOPs.map(issue => (
                  <div key={issue.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="font-medium text-sm">{issue.name}</p>
                    <p className="text-xs text-purple-600 mt-1">{issue.issue}</p>
                    <p className="text-xs text-slate-600 mt-1">💡 {issue.suggestion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!issues && !checking && (
          <p className="text-slate-500 text-sm text-center py-4">
            Click "Run Check" to scan for data inconsistencies
          </p>
        )}
      </CardContent>
    </Card>
  );
}
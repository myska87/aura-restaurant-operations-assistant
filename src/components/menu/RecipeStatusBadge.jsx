import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export default function RecipeStatusBadge({ menuItem }) {
  // Fetch recipe from Recipe_Engine_v2
  const { data: recipe } = useQuery({
    queryKey: ['recipe-status', menuItem?.id],
    queryFn: async () => {
      if (!menuItem?.id) return null;
      const recipes = await base44.entities.Recipe_Engine_v2.filter({ menu_item_id: menuItem.id });
      return recipes[0] || null;
    },
    enabled: !!menuItem?.id
  });

  // Check recipe completion
  const hasRecipe = !!recipe;
  const hasIngredients = recipe?.ingredients_per_serving?.length > 0;
  const isComplete = hasIngredients && recipe.ingredients_per_serving.every(ing => 
    ing.ingredient_id && ing.ingredient_name && ing.quantity > 0
  );

  if (isComplete) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
        <CheckCircle className="w-3 h-3 mr-1" />
        Recipe Complete
      </Badge>
    );
  }

  if (hasRecipe && !isComplete) {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-300">
        <AlertCircle className="w-3 h-3 mr-1" />
        Recipe Incomplete
      </Badge>
    );
  }

  return (
    <Badge className="bg-red-100 text-red-700 border-red-300">
      <XCircle className="w-3 h-3 mr-1" />
      No Recipe
    </Badge>
  );
}
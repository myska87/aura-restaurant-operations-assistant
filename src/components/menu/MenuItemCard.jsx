import React from 'react';
import { motion } from 'framer-motion';
import { 
  Edit, 
  MoreVertical, 
  Copy, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChefHat,
  DollarSign,
  Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

const locationColors = {
  kitchen: 'bg-orange-100 text-orange-700',
  bar: 'bg-blue-100 text-blue-700',
  tandoor: 'bg-red-100 text-red-700',
  grill: 'bg-amber-100 text-amber-700',
  coffee_station: 'bg-purple-100 text-purple-700',
  prep_area: 'bg-slate-100 text-slate-700'
};

const categoryEmojis = {
  hot_drinks: '☕',
  cold_drinks: '🥤',
  food: '🍽️',
  starters: '🥗',
  mains: '🍛',
  desserts: '🍰',
  sides: '🍟',
  breakfast: '🍳',
  lunch: '🥙',
  dinner: '🍽️',
  snacks: '🥨'
};

export default function MenuItemCard({ item, onEdit, onDuplicate, onDelete, onView }) {
  const profit = item.price - (item.cost || 0);
  const margin = item.price > 0 ? ((profit / item.price) * 100) : 0;
  
  const getProfitColor = () => {
    if (margin >= 60) return 'text-emerald-600 bg-emerald-50';
    if (margin >= 40) return 'text-blue-600 bg-blue-50';
    if (margin >= 20) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const hasLowStockIngredients = item.ingredients?.some(ing => {
    // This would need to check against actual inventory
    return false; // Placeholder
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all"
    >
      {/* Image */}
      <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {categoryEmojis[item.category] || '🍽️'}
          </div>
        )}
        
        {/* Status badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {!item.is_active && (
            <Badge className="bg-slate-600 text-white text-xs">Inactive</Badge>
          )}
          {!item.is_available && (
            <Badge className="bg-red-600 text-white text-xs">Out of Stock</Badge>
          )}
          {hasLowStockIngredients && (
            <Badge className="bg-amber-600 text-white text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Low Stock
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 backdrop-blur">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(item)}>
                <Eye className="w-4 h-4 mr-2" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(item)}>
                <Copy className="w-4 h-4 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(item)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-slate-800 text-lg line-clamp-1">{item.name}</h3>
          <p className="text-sm text-slate-500 line-clamp-2 mt-1">{item.description}</p>
        </div>

        {/* Pricing & Profit */}
        <div className="flex items-center justify-between mb-3 p-3 bg-slate-50 rounded-xl">
          <div>
            <p className="text-xs text-slate-500">Sale Price</p>
            <p className="text-xl font-bold text-slate-800">£{item.price?.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Profit</p>
            <div className={`flex items-center gap-1 ${getProfitColor()} px-2 py-1 rounded-lg`}>
              {margin >= 40 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-bold text-sm">{margin.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Info badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className="text-xs">
            {item.category?.replace('_', ' ')}
          </Badge>
          <Badge className={locationColors[item.preparation_location] || 'bg-slate-100'}>
            <ChefHat className="w-3 h-3 mr-1" />
            {item.preparation_location?.replace('_', ' ')}
          </Badge>
          {item.prep_time_minutes && (
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {item.prep_time_minutes}m
            </Badge>
          )}
        </div>

        {/* Ingredients count */}
        <div className="flex items-center justify-between text-sm text-slate-500 pt-3 border-t border-slate-100">
          <span>{item.ingredients?.length || 0} ingredients</span>
          <span>Cost: £{(item.cost || 0).toFixed(2)}</span>
        </div>

        {/* Allergen tags */}
        {item.allergens?.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap gap-1">
              {item.allergens.slice(0, 3).map((allergen, i) => (
                <Badge key={i} variant="outline" className="text-xs text-red-600 border-red-200">
                  {allergen}
                </Badge>
              ))}
              {item.allergens.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{item.allergens.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Dietary tags */}
        <div className="mt-2 flex gap-1">
          {item.is_vegetarian && <Badge className="bg-green-100 text-green-700 text-xs">🌱 Veg</Badge>}
          {item.is_vegan && <Badge className="bg-green-100 text-green-700 text-xs">🌿 Vegan</Badge>}
          {item.is_gluten_free && <Badge className="bg-blue-100 text-blue-700 text-xs">GF</Badge>}
        </div>
      </div>
    </motion.div>
  );
}
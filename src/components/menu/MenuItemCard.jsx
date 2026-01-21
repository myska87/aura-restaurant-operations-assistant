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
  Eye,
  ShoppingCart,
  Video
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
import LinkVisualGuideButton from './LinkVisualGuideButton';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

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

export default function MenuItemCard({ item, onEdit, onDuplicate, onDelete, onView, onOrderIngredients, ingredients = [] }) {
  const [isHovered, setIsHovered] = React.useState(false);
  const profit = item.price - (item.cost || 0);
  const margin = item.price > 0 ? ((profit / item.price) * 100) : 0;

  // Check if linked to visual guide
  const { data: visualLink } = useQuery({
    queryKey: ['visualMenuLink', item?.id],
    queryFn: () => base44.entities.VisualMenuLink.filter({ menu_item_id: item?.id }).then(r => r[0]),
    enabled: !!item?.id
  });
  
  const getProfitColor = () => {
    if (margin >= 60) return 'text-emerald-600 bg-emerald-50';
    if (margin >= 40) return 'text-blue-600 bg-blue-50';
    if (margin >= 20) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  // Calculate stock status
  const getStockStatus = () => {
    if (!item.ingredients || item.ingredients.length === 0) return { status: 'unknown', color: 'bg-slate-500' };
    
    let hasLowStock = false;
    let hasOutOfStock = false;
    
    item.ingredients.forEach(ing => {
      const inventoryItem = ingredients.find(inv => 
        inv.name?.toLowerCase().includes(ing.ingredient_name?.toLowerCase()) ||
        ing.ingredient_name?.toLowerCase().includes(inv.name?.toLowerCase())
      );
      
      if (!inventoryItem) return;
      
      const currentStock = inventoryItem.current_stock || 0;
      const minStock = inventoryItem.min_stock_level || 0;
      
      if (currentStock === 0) hasOutOfStock = true;
      else if (currentStock <= minStock) hasLowStock = true;
    });
    
    if (hasOutOfStock) return { status: 'out', color: 'bg-red-600', icon: AlertTriangle, text: 'Out of Stock' };
    if (hasLowStock) return { status: 'low', color: 'bg-amber-600', icon: AlertTriangle, text: 'Low Stock' };
    return { status: 'good', color: 'bg-emerald-600', icon: CheckCircle, text: 'In Stock' };
  };

  const stockStatus = getStockStatus();
  const hasLowStockIngredients = stockStatus.status === 'low' || stockStatus.status === 'out';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onView?.(item)}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg hover:border-emerald-400 transition-all cursor-pointer group"
    >
      {/* Image */}
      <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden group">
        {(item.photo_url || item.image_url) ? (
          <img src={item.photo_url || item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl transition-transform duration-300 group-hover:scale-110">
            {categoryEmojis[item.category] || '🍽️'}
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-emerald-900/80 via-emerald-900/40 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'} flex items-center justify-center`}>
          <div className="text-center text-white p-4">
            <Eye className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-semibold">View Recipe & Details</p>
          </div>
        </div>
        
        {/* Status badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {!item.is_active && (
            <Badge className="bg-slate-600 text-white text-xs">Inactive</Badge>
          )}
          {!item.is_available && (
            <Badge className="bg-red-600 text-white text-xs">Out of Stock</Badge>
          )}
          {stockStatus.status !== 'unknown' && stockStatus.status !== 'good' && (
            <Badge className={`${stockStatus.color} text-white text-xs`}>
              <stockStatus.icon className="w-3 h-3 mr-1" />
              {stockStatus.text}
            </Badge>
          )}
          {visualLink && (
            <Badge className="bg-orange-600 text-white text-xs">
              <Video className="w-3 h-3 mr-1" />
              Visual Guide
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 backdrop-blur">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(item); }}>
                <Eye className="w-4 h-4 mr-2" /> View Recipe Details
              </DropdownMenuItem>
              {onOrderIngredients && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOrderIngredients(item); }} className="text-emerald-600">
                  <ShoppingCart className="w-4 h-4 mr-2" /> Order Ingredients by Portions
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(item); }}>
                <Copy className="w-4 h-4 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(item); }} className="text-red-600">
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

        {/* Visual Guide Link */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <LinkVisualGuideButton menuItem={item} />
        </div>
      </div>
    </motion.div>
  );
}
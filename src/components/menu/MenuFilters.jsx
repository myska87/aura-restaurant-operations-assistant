import React from 'react';
import { Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MenuFilters({
  searchQuery,
  onSearchChange,
  filterCategory,
  onCategoryChange,
  filterLocation,
  onLocationChange,
  filterProfit,
  onProfitChange,
  filterDietary,
  onDietaryChange
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {/* Category Filter */}
      <Select value={filterCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
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
      
      {/* Location Filter */}
      <Select value={filterLocation} onValueChange={onLocationChange}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Location" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Locations</SelectItem>
          <SelectItem value="kitchen">Kitchen</SelectItem>
          <SelectItem value="bar">Bar</SelectItem>
          <SelectItem value="tandoor">Tandoor</SelectItem>
          <SelectItem value="grill">Grill</SelectItem>
          <SelectItem value="coffee_station">Coffee Station</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Profit Filter */}
      <Select value={filterProfit} onValueChange={onProfitChange}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Profit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Profit</SelectItem>
          <SelectItem value="high">High (50%+)</SelectItem>
          <SelectItem value="medium">Medium (30-50%)</SelectItem>
          <SelectItem value="low">Low (&lt;30%)</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Dietary Filter */}
      {onDietaryChange && (
        <Tabs value={filterDietary} onValueChange={onDietaryChange}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="vegetarian">🌱 Veg</TabsTrigger>
            <TabsTrigger value="vegan">🌿 Vegan</TabsTrigger>
            <TabsTrigger value="gluten_free">GF</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
    </div>
  );
}
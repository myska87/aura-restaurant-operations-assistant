import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  ChefHat,
  Clock,
  BarChart3,
  Filter,
  Printer,
  Edit,
  Sparkles,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import DishShareButton from '@/components/dishes/DishShareButton';
import AddCategoryDialog from '@/components/dishes/AddCategoryDialog';

const defaultCategories = ['wrap', 'curry', 'drink', 'bakery', 'chai', 'dessert', 'appetizer', 'main'];

const difficultyColors = {
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700'
};

const categoryColors = {
  wrap: 'bg-purple-100 text-purple-700',
  curry: 'bg-orange-100 text-orange-700',
  drink: 'bg-blue-100 text-blue-700',
  bakery: 'bg-amber-100 text-amber-700',
  chai: 'bg-emerald-100 text-emerald-700',
  dessert: 'bg-pink-100 text-pink-700',
  appetizer: 'bg-indigo-100 text-indigo-700',
  main: 'bg-red-100 text-red-700'
};

export default function VisualDishGuides() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [categories, setCategories] = useState(defaultCategories);
  const [categoryColors, setColorMapping] = useState({
    wrap: 'bg-purple-100 text-purple-700',
    curry: 'bg-orange-100 text-orange-700',
    drink: 'bg-blue-100 text-blue-700',
    bakery: 'bg-amber-100 text-amber-700',
    chai: 'bg-emerald-100 text-emerald-700',
    dessert: 'bg-pink-100 text-pink-700',
    appetizer: 'bg-indigo-100 text-indigo-700',
    main: 'bg-red-100 text-red-700'
  });

  const handleAddCategory = (newCategory) => {
    if (!categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      // Add color mapping for new category
      const colors = ['bg-teal-100 text-teal-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700', 'bg-lime-100 text-lime-700'];
      const colorIndex = (categories.length) % colors.length;
      setColorMapping(prev => ({
        ...prev,
        [newCategory]: colors[colorIndex]
      }));
    }
  };

  const handlePrintGuide = (guideId) => {
    window.open(createPageUrl('VisualDishGuidePrint') + '?id=' + guideId, '_blank');
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: guides = [], isLoading, refetch } = useQuery({
    queryKey: ['visualDishGuides'],
    queryFn: async () => {
      console.log('Fetching Visual Dish Guides from database...');
      const result = await base44.entities.Visual_Dish_Guides_v1.filter({ is_published: true }, '-updated_date');
      console.log('Fetched guides:', result);
      return result;
    },
    refetchOnMount: 'always',
    staleTime: 0
  });

  // Get visual menu links to show which guides are linked
  const { data: visualLinks = [] } = useQuery({
    queryKey: ['allVisualMenuLinks'],
    queryFn: () => base44.entities.VisualMenuLink.list()
  });

  const isAdmin = user && ['admin', 'owner', 'manager'].includes(user.role);

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = guide.dish_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || guide.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || guide.difficulty === difficultyFilter;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const stats = {
    total: guides.length,
    easy: guides.filter(g => g.difficulty === 'easy').length,
    medium: guides.filter(g => g.difficulty === 'medium').length,
    advanced: guides.filter(g => g.difficulty === 'advanced').length
  };

  if (isLoading) return <LoadingSpinner message="Loading dish guides..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visual Dish Guides"
        description="Step-by-step cooking guides with photos and videos"
      >
        {isAdmin && (
          <div className="flex gap-2">
            <Link to={createPageUrl('VisualDishGuideForm')}>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Create Guide
              </Button>
            </Link>
            <Link to={createPageUrl('VisualDishGuideForm')}>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Manual Create
              </Button>
            </Link>
          </div>
        )}
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Guides</p>
                <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
              </div>
              <ChefHat className="w-10 h-10 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Easy</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.easy}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Medium</p>
                <p className="text-3xl font-bold text-amber-600">{stats.medium}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Advanced</p>
                <p className="text-3xl font-bold text-red-600">{stats.advanced}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="wrap">Wrap</SelectItem>
                <SelectItem value="curry">Curry</SelectItem>
                <SelectItem value="drink">Drink</SelectItem>
                <SelectItem value="bakery">Bakery</SelectItem>
                <SelectItem value="chai">Chai</SelectItem>
                <SelectItem value="dessert">Dessert</SelectItem>
                <SelectItem value="appetizer">Appetizer</SelectItem>
                <SelectItem value="main">Main</SelectItem>
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuides.map((guide, index) => (
          <motion.div
            key={guide.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <Link to={createPageUrl('VisualDishGuideDetail') + '?id=' + guide.id}>
                <div className="aspect-video overflow-hidden bg-slate-100">
                  {guide.hero_image_url ? (
                    <img
                      src={guide.hero_image_url}
                      alt={guide.dish_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ChefHat className="w-16 h-16 text-slate-300" />
                    </div>
                  )}
                </div>
              </Link>
              <CardContent className="p-5">
                <Link to={createPageUrl('VisualDishGuideDetail') + '?id=' + guide.id}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                      {guide.dish_name}
                    </h3>
                    <Badge className={difficultyColors[guide.difficulty]}>
                      {guide.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className={categoryColors[guide.category]}>
                      {guide.category}
                    </Badge>
                    {guide.cooking_steps?.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {guide.cooking_steps.length} steps
                      </Badge>
                    )}
                    {visualLinks.some(link => link.visual_guide_id === guide.id) && (
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                        <ChefHat className="w-3 h-3 mr-1" />
                        Linked
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {guide.estimated_cook_time_minutes || 0}m
                    </div>
                    <div className="text-xs text-slate-500">
                      v{guide.version}
                    </div>
                  </div>
                </Link>
                <div className="flex gap-2 pt-3 border-t">
                  <Link to={createPageUrl('VisualDishGuideDetail') + '?id=' + guide.id} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      View
                    </Button>
                  </Link>
                  <DishShareButton guideId={guide.id} dishName={guide.dish_name} />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePrintGuide(guide.id);
                    }}
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                  {isAdmin && (
                    <Link to={createPageUrl('VisualDishGuideForm') + '?id=' + guide.id}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredGuides.length === 0 && (
        <Card>
          <CardContent className="py-20 text-center">
            <ChefHat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg text-slate-600">No dish guides found</p>
            <p className="text-sm text-slate-500 mt-2">Try adjusting your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
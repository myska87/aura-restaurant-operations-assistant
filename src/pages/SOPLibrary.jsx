import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen, Search, Filter, CheckCircle, Clock, Lock,
  ChefHat, Coffee, IceCream, Printer, Eye
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const menuCategories = [
  { value: 'all', label: 'All Items', icon: BookOpen },
  { value: 'parotta_rolls', label: 'Parotta Rolls', icon: ChefHat },
  { value: 'parotta_kebabs', label: 'Parotta Kebabs', icon: ChefHat },
  { value: 'patta_bakes', label: 'Patta Bakes', icon: ChefHat },
  { value: 'desi_crepes_savoury', label: 'Desi Crepes (Savoury)', icon: ChefHat },
  { value: 'desi_crepes_sweet', label: 'Desi Crepes (Sweet)', icon: IceCream },
  { value: 'desi_breakfast', label: 'Desi Breakfast', icon: ChefHat },
  { value: 'chaipatta_bowls', label: 'Chai Patta Bowls', icon: ChefHat },
  { value: 'fryer_heroes', label: 'Fryer Heroes', icon: ChefHat },
  { value: 'vegetarian_street_food', label: 'Vegetarian Street Food', icon: ChefHat },
  { value: 'chaat', label: 'Chaat', icon: ChefHat },
  { value: 'little_pattas', label: 'Little Pattas (Kids)', icon: ChefHat },
  { value: 'signature_karak_chai', label: 'Signature Karak Chai', icon: Coffee },
  { value: 'iced_karak', label: 'Iced Karak', icon: Coffee },
  { value: 'coffee', label: 'Coffee', icon: Coffee },
  { value: 'speciality_drinks', label: 'Speciality Drinks', icon: Coffee },
  { value: 'coolers_lassi', label: 'Coolers & Lassi', icon: Coffee },
  { value: 'kids_drinks', label: 'Kids Drinks', icon: Coffee },
  { value: 'display_desserts', label: 'Display Desserts', icon: IceCream },
  { value: 'chilled_desserts', label: 'Chilled Desserts', icon: IceCream },
  { value: 'warm_desserts', label: 'Warm Desserts', icon: IceCream }
];

export default function SOPLibrary() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: sops = [], isLoading } = useQuery({
    queryKey: ['sops'],
    queryFn: () => base44.entities.SOP.list('-created_date')
  });

  const { data: trainingProgress = [] } = useQuery({
    queryKey: ['myTraining', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.TrainingProgress.filter({
        staff_email: user.email,
        completion_percentage: 100
      });
    },
    enabled: !!user?.email
  });

  const filteredSOPs = sops.filter(sop => {
    const matchesSearch = sop.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || sop.menu_category === filterCategory;
    const matchesStatus = filterStatus === 'all' || sop.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Group SOPs by category - if a specific category is selected, only show that one
  const groupedSOPs = menuCategories.reduce((acc, cat) => {
    if (cat.value === 'all') return acc;
    
    // If a specific category is selected, only include that category
    if (filterCategory !== 'all' && cat.value !== filterCategory) return acc;
    
    // Filter SOPs for this category (from all SOPs, not pre-filtered)
    const categorySOPs = sops.filter(sop => {
      const matchesThisCategory = sop.menu_category === cat.value;
      const matchesSearch = sop.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || sop.status === filterStatus;
      return matchesThisCategory && matchesSearch && matchesStatus;
    });
    
    if (categorySOPs.length > 0) {
      acc[cat.value] = { ...cat, sops: categorySOPs };
    }
    return acc;
  }, {});

  const canAccessSOP = (sop) => {
    if (!sop.required_training_level) return true;
    const hasLevel = trainingProgress.some(p => p.level === sop.required_training_level);
    return hasLevel;
  };

  if (isLoading) return <LoadingSpinner message="Loading SOP Library..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chai Patta Recipe & SOP Library"
        description={`${sops.length} recipes documented`}
      >
        <Link to={createPageUrl('ChemicalStockList')}>
          <Button variant="outline">
            <Coffee className="w-4 h-4 mr-2" />
            Chemical Stock
          </Button>
        </Link>
      </PageHeader>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {menuCategories.map(cat => {
          const count = cat.value === 'all' 
            ? filteredSOPs.length 
            : filteredSOPs.filter(s => s.menu_category === cat.value).length;
          
          return (
            <Button
              key={cat.value}
              variant={filterCategory === cat.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory(cat.value)}
              className={filterCategory === cat.value ? 'bg-emerald-600' : ''}
            >
              <cat.icon className="w-3 h-3 mr-2" />
              {cat.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* SOP Groups */}
      <div className="space-y-8">
        {Object.values(groupedSOPs).map(group => (
          <div key={group.value}>
            <div className="flex items-center gap-3 mb-4">
              <group.icon className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl font-bold text-slate-800">{group.label}</h2>
              <Badge variant="outline">{group.sops.length} recipes</Badge>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {group.sops.map(sop => {
                const isLocked = !canAccessSOP(sop);
                
                return (
                  <Card
                    key={sop.id}
                    className={`hover:shadow-lg transition-all ${
                      isLocked ? 'opacity-60' : 'cursor-pointer'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        {sop.photo_final_product ? (
                          <div className="w-full h-32 rounded-lg overflow-hidden mb-3 bg-slate-100">
                            <img 
                              src={sop.photo_final_product} 
                              alt={sop.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                            <ChefHat className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-base line-clamp-2">{sop.title}</CardTitle>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sop.status === 'active' && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        {sop.is_locked && (
                          <Badge variant="outline" className="text-xs">
                            <Lock className="w-3 h-3 mr-1" />
                            HQ Locked
                          </Badge>
                        )}
                        {isLocked && (
                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                            Training Required
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-xs text-slate-600 mb-3">
                        {sop.prep_time_minutes && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Prep: {sop.prep_time_minutes} min
                          </div>
                        )}
                        {sop.cooking_time_minutes && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Cook: {sop.cooking_time_minutes} min
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link 
                          to={createPageUrl(`SOPView?id=${sop.id}`)}
                          className="flex-1"
                        >
                          <Button 
                            size="sm" 
                            className="w-full bg-emerald-600"
                            disabled={isLocked}
                          >
                            <Eye className="w-3 h-3 mr-2" />
                            View
                          </Button>
                        </Link>
                        <Link to={createPageUrl(`SOPPrint?id=${sop.id}`)}>
                          <Button size="sm" variant="outline" disabled={isLocked}>
                            <Printer className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredSOPs.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No SOPs Found</h3>
          <p className="text-slate-500">Try adjusting your filters or search query</p>
        </div>
      )}
    </div>
  );
}
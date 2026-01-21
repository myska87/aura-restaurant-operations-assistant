import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, ArrowRight, ChefHat, Utensils, Timer } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PrepComponentsList from '@/components/prep/PrepComponentsList';
import DishAssemblyFlow from '@/components/prep/DishAssemblyFlow';
import ServiceExecution from '@/components/prep/ServiceExecution';

export default function PrepWorkflow() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('prep');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: prepComponents = [] } = useQuery({
    queryKey: ['prep_components'],
    queryFn: () => base44.entities.Prep_Components_v1.list('-created_date'),
    initialData: []
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu_items'],
    queryFn: () => base44.entities.MenuItem.list('-created_date'),
    initialData: []
  });

  // Stats
  const preparedCount = prepComponents.filter(p => p.data?.status === 'prepared').length;
  const lowStockCount = prepComponents.filter(p => p.data?.status === 'low_stock').length;
  const totalPrep = prepComponents.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Prep & Service Workflow</h1>
          <p className="text-slate-500 mt-1">Manage prep components → assembly → service execution</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{preparedCount}/{totalPrep}</p>
                <p className="text-sm text-slate-500">Prep Ready</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowStockCount}</p>
                <p className="text-sm text-slate-500">Low Stock Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Utensils className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{menuItems.length}</p>
                <p className="text-sm text-slate-500">Menu Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prep" className="flex items-center gap-2">
            <ChefHat className="w-4 h-4" />
            Flow 1: Prep Components
          </TabsTrigger>
          <TabsTrigger value="assembly" className="flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            Flow 2: Dish Assembly
          </TabsTrigger>
          <TabsTrigger value="service" className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            Flow 3: Service Execution
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prep">
          <PrepComponentsList prepComponents={prepComponents} user={user} />
        </TabsContent>

        <TabsContent value="assembly">
          <DishAssemblyFlow prepComponents={prepComponents} menuItems={menuItems} user={user} />
        </TabsContent>

        <TabsContent value="service">
          <ServiceExecution menuItems={menuItems} user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
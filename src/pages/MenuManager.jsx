import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChefHat, TrendingUp, Calendar, AlertCircle, Package, Shield } from 'lucide-react';
import Menu from './Menu';
import MenuAnalyticsDashboard from './MenuAnalyticsDashboard';
import PrepPlanner from './PrepPlanner';
import AllergenDashboard from './AllergenDashboard';
import AllergenReport from './AllergenReport';
import Inventory from './Inventory';

export default function MenuManager() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Menu Manager</h1>
        <p className="text-slate-600">Manage menu, analytics, inventory, and operations</p>
      </div>

      <Tabs defaultValue="menu" className="space-y-6">
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="menu">
            <ChefHat className="w-4 h-4 mr-2" />
            Menu
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Menu Analytics
          </TabsTrigger>
          <TabsTrigger value="prep">
            <Calendar className="w-4 h-4 mr-2" />
            Prep Planner
          </TabsTrigger>
          <TabsTrigger value="allergen">
            <AlertCircle className="w-4 h-4 mr-2" />
            Allergen Orders
          </TabsTrigger>
          <TabsTrigger value="allergen-report">
            <Shield className="w-4 h-4 mr-2" />
            Allergen Matrix
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="w-4 h-4 mr-2" />
            Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="menu">
          <Menu />
        </TabsContent>

        <TabsContent value="analytics">
          <MenuAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="prep">
          <PrepPlanner />
        </TabsContent>

        <TabsContent value="allergen">
          <AllergenDashboard />
        </TabsContent>

        <TabsContent value="allergen-report">
          <AllergenReport />
        </TabsContent>

        <TabsContent value="inventory">
          <Inventory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
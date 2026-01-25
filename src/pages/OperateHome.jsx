import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ClipboardCheck, 
  ThermometerSun, 
  Sparkles, 
  ChefHat, 
  Box,
  AlertTriangle,
  Clock,
  TrendingUp,
  ShieldAlert,
  AlertCircle,
  LayoutDashboard
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import TodaysRequiredActions from '@/components/operate/TodaysRequiredActions';

export default function OperateHome() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const operateTiles = [
    {
      id: 1,
      title: 'Dashboard',
      description: 'Overview and key metrics',
      icon: LayoutDashboard,
      color: 'bg-indigo-600',
      page: 'AllergenDashboard'
    },
    {
      id: 2,
      title: "Today's Tasks",
      description: 'Opening, closing, shift tasks',
      icon: ClipboardCheck,
      color: 'bg-blue-500',
      page: 'DailyOperationsHub'
    },
    {
      id: 3,
      title: 'Food Safety Logs',
      description: 'Temp checks, fridge, freezer, hot hold',
      icon: ThermometerSun,
      color: 'bg-red-500',
      page: 'Operations'
    },
    {
      id: 4,
      title: 'Cleaning & Hygiene',
      description: 'Daily, weekly, deep clean, COSHH',
      icon: Sparkles,
      color: 'bg-purple-500',
      page: 'FoodSafetyChecklist'
    },
    {
      id: 5,
      title: 'Prep & Stock',
      description: 'Prep workflow, components, deliveries',
      icon: ChefHat,
      color: 'bg-amber-500',
      page: 'PrepWorkflow'
    },
    {
      id: 6,
      title: 'Dish Assembly',
      description: 'Visual guides, step-by-step build',
      icon: Box,
      color: 'bg-emerald-500',
      page: 'VisualDishGuides'
    },
    {
      id: 7,
      title: 'Waste & Issues',
      description: 'Log waste, equipment faults, recovery',
      icon: AlertTriangle,
      color: 'bg-orange-500',
      page: 'ServiceRecovery'
    },
    {
      id: 8,
      title: 'Shift & Clock',
      description: 'Clock in/out, shift schedule',
      icon: Clock,
      color: 'bg-slate-600',
      page: 'Shifts'
    },
    {
      id: 9,
      title: 'Flow Board',
      description: 'Live orders, kitchen flow',
      icon: TrendingUp,
      color: 'bg-blue-600',
      page: 'FlowBoard'
    },
    {
      id: 10,
      title: 'Allergens',
      description: 'Search dishes, check allergens',
      icon: ShieldAlert,
      color: 'bg-red-600',
      page: 'AllergenDashboard'
    },
    {
      id: 11,
      title: 'Emergency / Help',
      description: 'Procedures, contacts, manuals',
      icon: AlertCircle,
      color: 'bg-red-700',
      page: 'QualitySafety'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
            Operate Mode
          </h1>
          <p className="text-lg text-slate-600">
            Live service operations
          </p>
          <div className="mt-4">
            <Badge className="bg-blue-600 text-white text-sm px-4 py-2">
              {format(new Date(), 'EEEE, d MMMM yyyy')}
            </Badge>
          </div>
        </div>

        {/* Welcome Message */}
        {user && (
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-blue-200">
            <CardContent className="pt-6 text-center">
              <p className="text-lg text-slate-700">
                Welcome back, <strong className="text-blue-600">{user.full_name || user.email}</strong>
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Role: <span className="capitalize font-medium">{user.role}</span>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Today's Required Actions */}
        {user && <TodaysRequiredActions user={user} />}

        {/* Main Grid */}
        {/* CRITICAL: Cards use Button-based navigation - NO full-card Link wrappers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {operateTiles.map((tile, idx) => {
            const Icon = tile.icon;
            return (
              <motion.div
                key={tile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="h-full hover:shadow-2xl transition-all border-2 border-slate-200 hover:border-blue-400">
                  <CardContent className="pt-8 pb-8 text-center">
                    <div className={`${tile.color} w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                      {tile.title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">
                      {tile.description}
                    </p>
                    <Link to={createPageUrl(tile.page)}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Open
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-sm text-slate-600">
              <strong>Operate Mode</strong> is designed for live service. All actions are logged.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Staff have access to operational tools only. No reports, no admin, no data management.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
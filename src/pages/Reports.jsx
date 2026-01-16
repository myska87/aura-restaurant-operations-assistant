import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, AlertTriangle, GraduationCap, Shield, Wrench, Trophy, BarChart3 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

const reportOptions = [
  {
    title: 'Training Insights',
    description: 'Staff training progress & compliance',
    icon: GraduationCap,
    page: 'TrainingInsights',
    color: 'from-blue-500 to-blue-600'
  },
  {
    title: 'Performance',
    description: 'Staff performance & metrics',
    icon: TrendingUp,
    page: 'Performance',
    color: 'from-emerald-500 to-green-600'
  },
  {
    title: 'Allergen Compliance',
    description: 'Allergen safety reports',
    icon: Shield,
    page: 'AllergenDashboard',
    color: 'from-red-500 to-red-600'
  },
  {
    title: 'Chemical Safety',
    description: 'COSHH compliance dashboard',
    icon: AlertTriangle,
    page: 'ChemicalDashboard',
    color: 'from-purple-500 to-purple-600'
  },
  {
    title: 'Equipment Reports',
    description: 'Equipment downtime & maintenance',
    icon: Wrench,
    page: 'EquipmentHealth',
    color: 'from-orange-500 to-orange-600'
  },
  {
    title: 'Leadership Progress',
    description: 'Leadership pathway tracking',
    icon: Trophy,
    page: 'LeadershipPathway',
    color: 'from-amber-500 to-amber-600'
  },
  {
    title: 'Stock & Inventory',
    description: 'Stock levels & usage',
    icon: BarChart3,
    page: 'StockDashboard',
    color: 'from-indigo-500 to-indigo-600'
  }
];

export default function Reports() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const isManager = ['admin', 'manager', 'owner'].includes(user?.role);

  if (!isManager) {
    return (
      <div className="py-12 text-center">
        <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold mb-2">Manager Access Only</h2>
        <p className="text-slate-600">Reports are restricted to management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Insights, analytics & performance tracking"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Link key={option.page} to={createPageUrl(option.page)}>
              <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-emerald-400 h-full">
                <CardContent className="pt-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{option.title}</h3>
                  <p className="text-slate-600">{option.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
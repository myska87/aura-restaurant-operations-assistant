import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Shield, Heart, Wrench, ClipboardCheck, FlaskConical } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

const safetyOptions = [
  {
    title: 'Allergen Safety',
    description: 'Allergen orders & compliance dashboard',
    icon: Shield,
    page: 'AllergenDashboard',
    color: 'from-red-500 to-red-600',
    roles: ['manager', 'owner', 'admin']
  },
  {
    title: 'Service Recovery',
    description: 'Log issues & guest recovery actions',
    icon: Heart,
    page: 'ServiceRecovery',
    color: 'from-pink-500 to-pink-600',
    roles: ['all']
  },
  {
    title: 'Equipment Health',
    description: 'Equipment checks, faults & maintenance',
    icon: Wrench,
    page: 'EquipmentHealth',
    color: 'from-orange-500 to-orange-600',
    roles: ['manager', 'owner', 'admin']
  },
  {
    title: 'Chemical Safety',
    description: 'COSHH register & chemical compliance',
    icon: FlaskConical,
    page: 'ChemicalRegister',
    color: 'from-purple-500 to-purple-600',
    roles: ['all']
  },
  {
    title: 'Quality Audits',
    description: 'Quality checks & compliance logs',
    icon: ClipboardCheck,
    page: 'Quality',
    color: 'from-blue-500 to-blue-600',
    roles: ['manager', 'owner', 'admin']
  },
  {
    title: 'Incidents & Forms',
    description: 'Report incidents & complete forms',
    icon: AlertTriangle,
    page: 'Forms',
    color: 'from-amber-500 to-amber-600',
    roles: ['all']
  }
];

export default function QualitySafety() {
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

  const visibleOptions = safetyOptions.filter(
    opt => opt.roles.includes('all') || opt.roles.includes(user?.role)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quality & Safety"
        description="Protect people, food & reputation"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleOptions.map((option) => {
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
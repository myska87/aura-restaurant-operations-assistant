import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardCheck, Thermometer, Tag, MessageSquare, Wrench, ListChecks } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

const operationsOptions = [
  {
    title: 'Daily Check-In',
    description: 'Opening & closing checklists',
    icon: ClipboardCheck,
    page: 'DailyCheckIn',
    color: 'from-blue-500 to-blue-600',
    roles: ['all']
  },
  {
    title: 'Shift Handover',
    description: 'Pass information between shifts',
    icon: MessageSquare,
    page: 'ShiftHandovers',
    color: 'from-purple-500 to-purple-600',
    roles: ['all']
  },
  {
    title: 'Temperature Logs',
    description: 'Equipment temperature monitoring',
    icon: Thermometer,
    page: 'OperationsHistory',
    color: 'from-red-500 to-red-600',
    roles: ['all']
  },
  {
    title: 'Label Printing',
    description: 'Food safety labels & prep tracking',
    icon: Tag,
    page: 'OperationsHistory',
    color: 'from-green-500 to-green-600',
    roles: ['all']
  },
  {
    title: 'Equipment Status',
    description: 'Log equipment checks & faults',
    icon: Wrench,
    page: 'EquipmentHealth',
    color: 'from-orange-500 to-orange-600',
    roles: ['all']
  },
  {
    title: 'Operations History',
    description: 'View all logged operations',
    icon: ListChecks,
    page: 'OperationsHistory',
    color: 'from-slate-500 to-slate-600',
    roles: ['manager', 'owner', 'admin']
  }
];

export default function Operations() {
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

  const visibleOptions = operationsOptions.filter(
    opt => opt.roles.includes('all') || opt.roles.includes(user?.role)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations"
        description="Everything needed to run a shift"
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
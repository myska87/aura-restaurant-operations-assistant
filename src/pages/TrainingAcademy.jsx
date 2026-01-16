import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Leaf, Shield, ChefHat, Trophy } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

const trainingOptions = [
  {
    title: 'Culture & Values',
    description: 'Chai Patta culture, values & behaviour standards',
    icon: Leaf,
    page: 'Culture',
    color: 'from-emerald-500 to-green-600',
    roles: ['all']
  },
  {
    title: 'Hygiene & Safety',
    description: 'Level 1, 2 & 3 hygiene training + certificates',
    icon: Shield,
    page: 'Training',
    color: 'from-blue-500 to-blue-600',
    roles: ['all']
  },
  {
    title: 'Skills & SOPs',
    description: 'Kitchen skills, FOH training & SOP library',
    icon: ChefHat,
    page: 'SOPs',
    color: 'from-amber-500 to-orange-600',
    roles: ['all']
  },
  {
    title: 'Leadership Pathway',
    description: 'Progress levels, requirements & leadership journal',
    icon: Trophy,
    page: 'LeadershipPathway',
    color: 'from-purple-500 to-pink-600',
    roles: ['all']
  }
];

export default function TrainingAcademy() {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Academy"
        description="Learning, culture & leadership development"
      />

      <div className="grid md:grid-cols-2 gap-6">
        {trainingOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Link key={option.page} to={createPageUrl(option.page)}>
              <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-emerald-400 h-full">
                <CardContent className="pt-6">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{option.title}</h3>
                  <p className="text-slate-600 text-lg">{option.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { User, FileText, Calendar, ListChecks, GraduationCap, Users, UserPlus } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function People() {
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

  const myOptions = [
    {
      title: 'My Profile',
      description: 'Personal details, documents & training',
      icon: User,
      page: 'Profile',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'My Shifts',
      description: 'View my rota & schedule',
      icon: Calendar,
      page: 'Shifts',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'My Tasks',
      description: 'Assigned tasks & to-dos',
      icon: ListChecks,
      page: 'Profile',
      color: 'from-emerald-500 to-green-600'
    },
    {
      title: 'My Training',
      description: 'Certificates & progress',
      icon: GraduationCap,
      page: 'Training',
      color: 'from-amber-500 to-orange-600'
    }
  ];

  const teamOptions = [
    {
      title: 'Team Directory',
      description: 'View all staff & roles',
      icon: Users,
      page: 'Staff',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      title: 'Invite Staff',
      description: 'Send team invitations',
      icon: UserPlus,
      page: 'Invitations',
      color: 'from-pink-500 to-pink-600'
    },
    {
      title: 'Performance',
      description: 'Team performance tracking',
      icon: ListChecks,
      page: 'Performance',
      color: 'from-red-500 to-red-600'
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="People"
        description="Your personal hub & team management"
      />

      <div>
        <h2 className="text-xl font-bold mb-4">My Personal Space</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {myOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Link key={option.page} to={createPageUrl(option.page)}>
                <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-emerald-400 h-full">
                  <CardContent className="pt-6">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-3 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-1">{option.title}</h3>
                    <p className="text-sm text-slate-600">{option.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {isManager && (
        <div>
          <h2 className="text-xl font-bold mb-4">Team Management</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {teamOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Link key={option.page} to={createPageUrl(option.page)}>
                  <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-emerald-400 h-full">
                    <CardContent className="pt-6">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-3 shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-bold mb-1">{option.title}</h3>
                      <p className="text-sm text-slate-600">{option.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
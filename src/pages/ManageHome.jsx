import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  FileText, 
  Users, 
  AlertTriangle,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function ManageHome() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: tasks = [] } = useQuery({
    queryKey: ['allTasks'],
    queryFn: () => base44.entities.Task.list()
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['allStaff'],
    queryFn: () => base44.entities.Staff.list()
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list()
  });

  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const activeStaff = staff.filter(s => s.status === 'active').length;
  const draftDocuments = documents.filter(d => d.status === 'draft').length;

  const controlCenters = [
    {
      title: 'Dashboard',
      icon: BarChart3,
      color: 'bg-red-500',
      link: 'Dashboard',
      description: 'Business Overview'
    },
    {
      title: 'Reports',
      icon: FileText,
      color: 'bg-purple-500',
      link: 'Reports',
      description: 'Analytics & Insights'
    },
    {
      title: 'People',
      icon: Users,
      color: 'bg-blue-500',
      link: 'People',
      description: 'Team Management'
    },
    {
      title: 'Documents',
      icon: FileText,
      color: 'bg-emerald-500',
      link: 'Documents',
      description: 'Policies & SOPs'
    },
    {
      title: 'Menu Costing',
      icon: DollarSign,
      color: 'bg-amber-500',
      link: 'MenuCostingDashboard',
      description: 'Profit Analysis'
    },
    {
      title: 'Compliance',
      icon: CheckCircle,
      color: 'bg-teal-500',
      link: 'ComplianceHub',
      description: 'Audit Logs'
    }
  ];

  const statusIndicators = [
    {
      label: 'Food Safety',
      status: 'green',
      value: '100%'
    },
    {
      label: 'Training',
      status: 'amber',
      value: '85%'
    },
    {
      label: 'Tasks',
      status: pendingTasks > 10 ? 'red' : 'green',
      value: `${pendingTasks} pending`
    },
    {
      label: 'Documents',
      status: draftDocuments > 5 ? 'amber' : 'green',
      value: `${draftDocuments} drafts`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Control Mode</h1>
          <p className="text-slate-600">Manage. Monitor. Optimize.</p>
        </motion.div>

        {/* Status Dashboard */}
        <Card className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {statusIndicators.map(indicator => (
                <div key={indicator.label} className="text-center">
                  <div className={`
                    w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2
                    ${indicator.status === 'green' ? 'bg-emerald-500' : 
                      indicator.status === 'amber' ? 'bg-amber-500' : 'bg-red-600'}
                  `}>
                    {indicator.status === 'green' ? (
                      <CheckCircle className="w-8 h-8" />
                    ) : (
                      <AlertTriangle className="w-8 h-8" />
                    )}
                  </div>
                  <p className="text-sm opacity-90">{indicator.label}</p>
                  <p className="text-lg font-bold">{indicator.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Control Centers */}
        <div className="grid grid-cols-3 gap-4">
          {controlCenters.map((center, idx) => {
            const Icon = center.icon;
            return (
              <motion.div
                key={center.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link to={createPageUrl(center.link)}>
                  <Card className="hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-red-300">
                    <CardContent className="pt-6 text-center">
                      <div className={`${center.color} w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <p className="font-bold text-slate-800">{center.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{center.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-slate-800">{activeStaff}</p>
              <p className="text-sm text-slate-600">Active Staff</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-slate-800">{pendingTasks}</p>
              <p className="text-sm text-slate-600">Pending Tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-slate-800">{documents.length}</p>
              <p className="text-sm text-slate-600">Documents</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
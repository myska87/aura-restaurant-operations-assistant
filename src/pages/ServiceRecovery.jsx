import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ServiceRecoveryForm from '@/components/recovery/ServiceRecoveryForm';
import RecoveryList from '@/components/recovery/RecoveryList';
import {
  Heart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Users,
  Clock,
  Award
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function ServiceRecovery() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  // Fetch this month's recoveries
  const { data: recoveries = [], isLoading } = useQuery({
    queryKey: ['service-recoveries'],
    queryFn: () => base44.entities.ServiceRecovery.list('-issue_date', 200)
  });

  // Stats
  const thisMonth = recoveries.filter(r => {
    const date = new Date(r.issue_date);
    return date >= startOfMonth(new Date()) && date <= endOfMonth(new Date());
  });

  const satisfiedCount = thisMonth.filter(r => r.guest_outcome === 'satisfied').length;
  const recoveryRate = thisMonth.length > 0 ? Math.round((satisfiedCount / thisMonth.length) * 100) : 0;
  const totalCost = thisMonth.reduce((sum, r) => sum + (r.recovery_value || 0), 0);
  const avgResolutionTime = thisMonth.length > 0 
    ? Math.round(thisMonth.reduce((sum, r) => sum + (r.resolution_time_minutes || 0), 0) / thisMonth.length)
    : 0;

  // Issue type breakdown
  const issueTypes = thisMonth.reduce((acc, r) => {
    acc[r.issue_type] = (acc[r.issue_type] || 0) + 1;
    return acc;
  }, {});

  const topIssues = Object.entries(issueTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (isLoading) {
    return <LoadingSpinner message="Loading service recovery..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Recovery"
        description="Turn mistakes into Raving Fans"
        action={() => setShowForm(true)}
        actionLabel="Log Issue"
        actionIcon={Heart}
      />

      {/* Philosophy Banner */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900 mb-2">Our Service Recovery Philosophy</h3>
              <p className="text-purple-800 leading-relaxed">
                "Mistakes happen. How we recover defines us. Recovery is not weakness — it's leadership."
              </p>
              <p className="text-sm text-purple-700 mt-2">
                Every issue is an opportunity to create a Raving Fan. Handle with care, honesty, and speed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Recovery Rate</p>
                <p className="text-2xl font-bold text-emerald-600">{recoveryRate}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Issues This Month</p>
                <p className="text-2xl font-bold text-slate-700">{thisMonth.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Recovery Cost</p>
                <p className="text-2xl font-bold text-slate-700">£{totalCost.toFixed(0)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Avg Resolution</p>
                <p className="text-2xl font-bold text-blue-600">{avgResolutionTime}m</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="log" className="space-y-4">
        <TabsList>
          <TabsTrigger value="log">Recovery Log</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="empowerment">Empowerment Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="log">
          <RecoveryList recoveries={recoveries} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Top Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Top Issues This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topIssues.length === 0 ? (
                  <p className="text-center text-slate-500 py-4">No issues logged this month</p>
                ) : (
                  <div className="space-y-3">
                    {topIssues.map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{type.replace(/_/g, ' ')}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guest Outcomes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Guest Outcomes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium">Satisfied / Raving Fans</span>
                    </div>
                    <Badge className="bg-emerald-600">{satisfiedCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <span className="font-medium">Neutral</span>
                    </div>
                    <Badge className="bg-amber-600">
                      {thisMonth.filter(r => r.guest_outcome === 'neutral').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="font-medium">Unhappy / Lost</span>
                    </div>
                    <Badge className="bg-red-600">
                      {thisMonth.filter(r => r.guest_outcome === 'unhappy').length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="empowerment">
          <div className="grid md:grid-cols-3 gap-4">
            {/* FOH Staff */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">🧑‍💼 FOH Staff Can:</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <span>Remake items</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <span>Replace drinks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <span>Offer free chai</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <span>Apologise & reassure</span>
                  </li>
                </ul>
                <p className="text-xs text-blue-700 mt-3 p-2 bg-white/50 rounded">
                  No manager approval needed for these actions
                </p>
              </CardContent>
            </Card>

            {/* Managers */}
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-purple-900">👔 Managers Can:</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-purple-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5" />
                    <span>Issue refunds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5" />
                    <span>Offer vouchers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5" />
                    <span>Approve discounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5" />
                    <span>Handle escalations</span>
                  </li>
                </ul>
                <p className="text-xs text-purple-700 mt-3 p-2 bg-white/50 rounded">
                  Higher authority for critical situations
                </p>
              </CardContent>
            </Card>

            {/* HQ */}
            <Card className="border-emerald-200 bg-emerald-50">
              <CardHeader>
                <CardTitle className="text-emerald-900">🏢 HQ Can:</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-emerald-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <span>Review trends</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <span>Set recovery limits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <span>Update policy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <span>Identify training needs</span>
                  </li>
                </ul>
                <p className="text-xs text-emerald-700 mt-3 p-2 bg-white/50 rounded">
                  System-level oversight and improvement
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-amber-50 border-amber-200 mt-4">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">Important Reminder</h4>
                  <p className="text-sm text-amber-800">
                    Staff cannot exceed their authority without escalation. If unsure, always ask a manager. 
                    When in doubt, focus on listening, apologizing, and getting help.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      {showForm && (
        <ServiceRecoveryForm
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
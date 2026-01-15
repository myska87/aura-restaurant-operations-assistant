import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Performance() {
  const [user, setUser] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [selectedStaff, setSelectedStaff] = useState('all');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: staff = [], isLoading: loadingStaff } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.list(),
  });

  const { data: performance = [], isLoading: loadingPerformance } = useQuery({
    queryKey: ['staffPerformance'],
    queryFn: () => base44.entities.StaffPerformance.list('-date', 100),
  });

  const { data: qualityChecks = [] } = useQuery({
    queryKey: ['qualityChecks'],
    queryFn: () => base44.entities.QualityCheck.list('-check_date', 100),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 100),
  });

  const { data: trainingProgress = [] } = useQuery({
    queryKey: ['trainingProgress'],
    queryFn: () => base44.entities.TrainingProgress.list(),
  });

  // Calculate staff KPIs
  const staffKPIs = staff.map(s => {
    const staffPerf = performance.filter(p => p.staff_email === s.email);
    const staffQuality = qualityChecks.filter(q => q.prepared_by === s.email);
    const staffTraining = trainingProgress.filter(t => t.staff_email === s.email);
    
    const ordersCompleted = staffPerf.reduce((sum, p) => sum + (p.orders_completed || 0), 0);
    const prepTasksCompleted = staffPerf.reduce((sum, p) => sum + (p.prep_tasks_completed || 0), 0);
    const qualityPassed = staffQuality.filter(q => q.status === 'passed').length;
    const qualityFailed = staffQuality.filter(q => q.status === 'failed').length;
    const totalQuality = qualityPassed + qualityFailed;
    const qualityPassRate = totalQuality > 0 ? (qualityPassed / totalQuality) * 100 : 0;
    
    const trainingCompleted = staffTraining.filter(t => t.status === 'completed').length;
    const trainingInProgress = staffTraining.filter(t => t.status === 'in_progress').length;
    const totalTraining = trainingCompleted + trainingInProgress;
    const trainingCompletionRate = totalTraining > 0 ? (trainingCompleted / totalTraining) * 100 : 0;
    
    const mistakes = staffPerf.reduce((sum, p) => sum + (p.mistakes?.length || 0), 0);
    
    const overallScore = (
      (ordersCompleted > 0 ? 20 : 0) +
      (prepTasksCompleted > 0 ? 20 : 0) +
      (qualityPassRate / 5) +
      (trainingCompletionRate / 5) +
      (mistakes === 0 ? 20 : Math.max(0, 20 - mistakes * 2))
    );

    return {
      ...s,
      ordersCompleted,
      prepTasksCompleted,
      qualityPassRate,
      qualityPassed,
      qualityFailed,
      trainingCompletionRate,
      trainingCompleted,
      mistakes,
      overallScore
    };
  });

  const topPerformers = staffKPIs
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 5);

  const needsImprovement = staffKPIs
    .filter(s => s.qualityPassRate < 80 || s.mistakes > 3)
    .sort((a, b) => a.qualityPassRate - b.qualityPassRate)
    .slice(0, 5);

  // Store KPIs
  const totalSales = sales.reduce((sum, s) => sum + (s.total_price || 0), 0);
  const totalCost = sales.reduce((sum, s) => sum + (s.total_cost || 0), 0);
  const avgGPPercentage = sales.length > 0 
    ? sales.reduce((sum, s) => sum + (s.gp_percentage || 0), 0) / sales.length 
    : 0;
  const foodCostPercentage = totalSales > 0 ? (totalCost / totalSales) * 100 : 0;

  const avgQualityScore = qualityChecks.length > 0
    ? qualityChecks.reduce((sum, q) => sum + (q.overall_score || 0), 0) / qualityChecks.length
    : 0;

  const canView = ['manager', 'owner', 'admin'].includes(user?.role);

  if (loadingStaff || loadingPerformance) return <LoadingSpinner message="Loading performance data..." />;

  if (!canView) {
    return (
      <div className="py-12 text-center">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
        <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
        <p className="text-slate-600">Only managers and admins can view performance data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Dashboard"
        description="Staff KPIs and store metrics"
      />

      <Tabs defaultValue="staff" className="w-full">
        <TabsList>
          <TabsTrigger value="staff">Staff Performance</TabsTrigger>
          <TabsTrigger value="store">Store KPIs</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-6 mt-6">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers.map((staff, idx) => (
                  <div key={staff.id} className="flex items-center gap-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold">
                      #{idx + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{staff.full_name}</h4>
                      <p className="text-sm text-slate-600">{staff.position}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Progress value={staff.overallScore} className="w-24 h-2" />
                        <span className="text-sm font-bold">{staff.overallScore.toFixed(0)}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {staff.ordersCompleted} orders • {staff.qualityPassRate.toFixed(0)}% quality
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* All Staff Performance */}
          <Card>
            <CardHeader>
              <CardTitle>All Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staffKPIs.map(staff => (
                  <Card key={staff.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg">{staff.full_name}</h4>
                          <p className="text-sm text-slate-600">{staff.position} • {staff.department}</p>
                        </div>
                        <Badge className={
                          staff.overallScore >= 80 ? 'bg-emerald-600' :
                          staff.overallScore >= 60 ? 'bg-blue-600' :
                          staff.overallScore >= 40 ? 'bg-amber-600' :
                          'bg-red-600'
                        }>
                          {staff.overallScore.toFixed(0)} Score
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Orders</p>
                          <p className="text-xl font-bold text-blue-600">{staff.ordersCompleted}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Prep Tasks</p>
                          <p className="text-xl font-bold text-emerald-600">{staff.prepTasksCompleted}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Quality Rate</p>
                          <p className={`text-xl font-bold ${staff.qualityPassRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {staff.qualityPassRate.toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Training</p>
                          <p className="text-xl font-bold text-purple-600">{staff.trainingCompletionRate.toFixed(0)}%</p>
                        </div>
                      </div>

                      {staff.mistakes > 0 && (
                        <div className="mt-3 p-2 bg-amber-50 rounded-lg flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span className="text-sm text-amber-700">{staff.mistakes} mistakes recorded</span>
                        </div>
                      )}

                      {staff.qualityPassRate < 80 && (
                        <div className="mt-3 p-2 bg-red-50 rounded-lg flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-700">Quality below target - retraining recommended</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="store" className="space-y-6 mt-6">
          {/* Store KPIs */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">£{totalSales.toFixed(0)}</p>
                    <p className="text-xs text-slate-500">Total Sales</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{avgGPPercentage.toFixed(1)}%</p>
                    <p className="text-xs text-slate-500">Avg Profit Margin</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Target className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{foodCostPercentage.toFixed(1)}%</p>
                    <p className="text-xs text-slate-500">Food Cost %</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{avgQualityScore.toFixed(1)}/5</p>
                    <p className="text-xs text-slate-500">Quality Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Intelligent Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {foodCostPercentage > 35 && (
                  <div className="p-3 bg-amber-100 rounded-lg border border-amber-300">
                    <p className="font-semibold text-amber-900 mb-1">⚠️ High Food Cost</p>
                    <p className="text-sm text-amber-800">
                      Food cost is {foodCostPercentage.toFixed(1)}% - review portion sizes and ingredient costs
                    </p>
                  </div>
                )}

                {avgQualityScore < 4 && (
                  <div className="p-3 bg-red-100 rounded-lg border border-red-300">
                    <p className="font-semibold text-red-900 mb-1">🔴 Quality Below Target</p>
                    <p className="text-sm text-red-800">
                      Average quality score is {avgQualityScore.toFixed(1)}/5 - increase training and checks
                    </p>
                  </div>
                )}

                {needsImprovement.length > 0 && (
                  <div className="p-3 bg-orange-100 rounded-lg border border-orange-300">
                    <p className="font-semibold text-orange-900 mb-1">👥 Staff Need Support</p>
                    <p className="text-sm text-orange-800">
                      {needsImprovement.length} staff members need retraining or coaching
                    </p>
                  </div>
                )}

                {totalSales > 0 && avgGPPercentage > 50 && (
                  <div className="p-3 bg-emerald-100 rounded-lg border border-emerald-300">
                    <p className="font-semibold text-emerald-900 mb-1">✅ Strong Performance</p>
                    <p className="text-sm text-emerald-800">
                      Excellent profit margins at {avgGPPercentage.toFixed(1)}% - keep up the great work!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
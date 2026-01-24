import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, AlertTriangle, GraduationCap, Shield, Wrench, Trophy, BarChart3, Thermometer, CheckCircle, Sparkles, Tag } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

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
    title: 'Hygiene Compliance',
    description: 'Daily hygiene checks & compliance tracking',
    icon: Shield,
    page: 'HygieneReports',
    color: 'from-blue-500 to-blue-600'
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

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const isManager = ['admin', 'manager', 'owner'].includes(user?.role);

  // Fetch weekly KPI data
  const { data: weeklyAudits = [], isLoading: auditsLoading } = useQuery({
    queryKey: ['weeklyAudits', weekStart],
    queryFn: async () => {
      const audits = await base44.entities.WeeklyAudit.filter({
        submission_date: { $gte: weekStart }
      });
      return audits;
    },
    enabled: !!user && isManager
  });

  const { data: temperatureLogs = [], isLoading: tempLoading } = useQuery({
    queryKey: ['weekTemps', weekStart],
    queryFn: async () => {
      const logs = await base44.entities.TemperatureLog.filter({
        log_date: { $gte: weekStart, $lte: weekEnd }
      });
      return logs;
    },
    enabled: !!user && isManager
  });

  const { data: hygieneChecks = [], isLoading: hygieneLoading } = useQuery({
    queryKey: ['weekHygiene', weekStart],
    queryFn: async () => {
      const checks = await base44.entities.ChecklistCompletion.filter({
        date: { $gte: weekStart, $lte: weekEnd },
        checklist_category: 'hygiene'
      });
      return checks;
    },
    enabled: !!user && isManager
  });

  const { data: operationReports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['operationReports', weekStart],
    queryFn: async () => {
      const reports = await base44.entities.OperationReport.filter({
        reportDate: { $gte: weekStart, $lte: weekEnd },
        reportType: 'HYGIENE'
      });
      return reports;
    },
    enabled: !!user && isManager
  });

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ['weekShifts', weekStart],
    queryFn: async () => {
      const shifts = await base44.entities.Shift.filter({
        date: { $gte: weekStart, $lte: weekEnd }
      });
      return shifts;
    },
    enabled: !!user && isManager
  });

  const { data: labelReports = [], isLoading: labelsLoading } = useQuery({
    queryKey: ['labelReports', weekStart],
    queryFn: async () => {
      const reports = await base44.entities.OperationReport.filter({
        reportType: 'LABEL',
        reportDate: { $gte: weekStart, $lte: weekEnd }
      });
      return reports;
    },
    enabled: !!user && isManager
  });

  // Calculate KPIs
  const avgAuditScore = weeklyAudits.length > 0 
    ? weeklyAudits.reduce((sum, a) => sum + (a.audit_score || 0), 0) / weeklyAudits.length 
    : 0;

  const hygieneComplianceRate = hygieneChecks.length > 0
    ? (hygieneChecks.filter(c => c.status === 'completed').length / hygieneChecks.length) * 100
    : 0;

  const tempLogCompletionRate = temperatureLogs.length > 0
    ? (temperatureLogs.filter(t => t.is_in_range !== false).length / temperatureLogs.length) * 100
    : 0;

  const shiftCompletionRate = shifts.length > 0
    ? (shifts.filter(s => s.status === 'approved').length / shifts.length) * 100
    : 0;

  // Generate weekly trend data (last 7 days)
  const weeklyTrendData = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const dayName = format(subDays(new Date(), 6 - i), 'EEE');
    
    const dayHygiene = hygieneChecks.filter(h => h.date === date);
    const dayTemps = temperatureLogs.filter(t => t.log_date === date);
    
    return {
      day: dayName,
      hygiene: dayHygiene.length > 0 ? (dayHygiene.filter(h => h.status === 'completed').length / dayHygiene.length) * 100 : 0,
      temperature: dayTemps.length > 0 ? (dayTemps.filter(t => t.is_in_range !== false).length / dayTemps.length) * 100 : 0,
    };
  });

  if (!isManager) {
    return (
      <div className="py-12 text-center">
        <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold mb-2">Manager Access Only</h2>
        <p className="text-slate-600">Reports are restricted to management.</p>
      </div>
    );
  }

  const [selectedHygieneReport, setSelectedHygieneReport] = useState(null);
  const [selectedLabelReport, setSelectedLabelReport] = useState(null);

  const isLoading = auditsLoading || tempLoading || hygieneLoading || shiftsLoading || reportsLoading || labelsLoading;

  if (isLoading) {
    return <LoadingSpinner message="Loading reports data..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports Dashboard"
        description="Live KPI analytics and comprehensive performance reports"
      />

      {/* Weekly KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                Hygiene Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-700">
                {Math.round(hygieneComplianceRate)}%
              </div>
              <p className="text-xs text-slate-500 mt-1">This week</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-blue-600" />
                Temperature Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">
                {Math.round(tempLogCompletionRate)}%
              </div>
              <p className="text-xs text-slate-500 mt-1">{temperatureLogs.length} logs this week</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-600" />
                Staff Shift Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-700">
                {Math.round(shiftCompletionRate)}%
              </div>
              <p className="text-xs text-slate-500 mt-1">{shifts.length} shifts this week</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                Audit Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">
                {Math.round(avgAuditScore)}/100
              </div>
              <p className="text-xs text-slate-500 mt-1">Average this week</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Weekly Compliance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="hygiene" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Hygiene %"
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Temperature %"
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Weekly Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { category: 'Hygiene', value: hygieneComplianceRate, fill: '#10b981' },
                  { category: 'Temperature', value: tempLogCompletionRate, fill: '#3b82f6' },
                  { category: 'Shifts', value: shiftCompletionRate, fill: '#f59e0b' },
                  { category: 'Audit', value: avgAuditScore, fill: '#a855f7' },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="category" stroke="#64748b" />
                  <YAxis stroke="#64748b" domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Label Reports Section */}
      {labelReports.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-bold text-slate-900">Food Safety Labels</h3>
          </div>
          <p className="text-slate-600 mb-4">
            {labelReports.length} labels printed this week
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {labelReports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSelectedLabelReport(report)}
                className="cursor-pointer"
              >
                <Card className="hover:shadow-lg transition-all h-full">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-slate-900 text-sm line-clamp-2">
                        {report.checklistItems?.[0]?.item_name || 'Label'}
                      </p>
                      <Badge className="bg-purple-100 text-purple-700 text-xs">Label</Badge>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{report.staffName}</p>
                    <p className="text-xs text-slate-500">{report.reportDate}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Hygiene Reports Section */}
      <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-6 border-2 border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-slate-900">Hygiene Compliance Reports</h3>
        </div>
        <p className="text-slate-600 mb-4">
          {operationReports.length} hygiene reports this week • {operationReports.filter(r => r.status === 'pass').length} passed
        </p>
        {operationReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {operationReports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSelectedHygieneReport(report)}
                className="cursor-pointer"
              >
                <Card className="hover:shadow-lg transition-all h-full">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-slate-900 text-sm">{report.staffName}</p>
                      <Badge className={report.status === 'pass' ? 'bg-emerald-500' : 'bg-red-500'}>
                        {report.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{report.reportDate}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-emerald-600">{Math.round(report.completionPercentage)}%</span>
                      <Sparkles className="w-4 h-4 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 text-center py-8">No hygiene reports yet this week</p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t-2 border-slate-200 my-8" />

      {/* Original Report Options */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Detailed Reports</h2>
        <p className="text-slate-600 mb-6">Access comprehensive data tables and export options</p>
      </div>

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

      {/* Label Report Detail Modal */}
      <Dialog open={!!selectedLabelReport} onOpenChange={(open) => !open && setSelectedLabelReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-purple-600" />
              Food Safety Label Details
            </DialogTitle>
            <DialogDescription>
              Complete label information & traceability
            </DialogDescription>
          </DialogHeader>
          {selectedLabelReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-50">
                  <CardContent className="pt-4">
                    <p className="text-xs text-slate-600 mb-1">Item Name</p>
                    <p className="font-bold text-sm">{selectedLabelReport.checklistItems?.[0]?.item_name}</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50">
                  <CardContent className="pt-4">
                    <p className="text-xs text-slate-600 mb-1">Printed By</p>
                    <p className="font-bold text-sm">{selectedLabelReport.staffName}</p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-50">
                  <CardContent className="pt-4">
                    <p className="text-xs text-slate-600 mb-1">Print Date</p>
                    <p className="font-bold text-sm">{selectedLabelReport.reportDate}</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50">
                  <CardContent className="pt-4">
                    <p className="text-xs text-slate-600 mb-1">Print Time</p>
                    <p className="font-bold text-sm">
                      {new Date(selectedLabelReport.timestamp).toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hygiene Report Detail Modal */}
      <Dialog open={!!selectedHygieneReport} onOpenChange={(open) => !open && setSelectedHygieneReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Hygiene Compliance Report
            </DialogTitle>
            <DialogDescription>
              Detailed hygiene check results
            </DialogDescription>
          </DialogHeader>
          {selectedHygieneReport && (
            <div className="space-y-4">
              {/* Staff & Date Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-50">
                  <CardContent className="pt-4">
                    <p className="text-xs text-slate-600 mb-1">Staff Member</p>
                    <p className="font-bold">{selectedHygieneReport.staffName}</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50">
                  <CardContent className="pt-4">
                    <p className="text-xs text-slate-600 mb-1">Report Date</p>
                    <p className="font-bold">{selectedHygieneReport.reportDate}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Completion & Status */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-emerald-50 border-emerald-200">
                  <CardContent className="pt-4">
                    <p className="text-xs text-emerald-700 mb-1">Completion %</p>
                    <p className="text-2xl font-bold text-emerald-700">{Math.round(selectedHygieneReport.completionPercentage)}%</p>
                  </CardContent>
                </Card>
                <Card className={selectedHygieneReport.status === 'pass' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}>
                  <CardContent className="pt-4">
                    <p className={`text-xs mb-1 ${selectedHygieneReport.status === 'pass' ? 'text-emerald-700' : 'text-red-700'}`}>Status</p>
                    <Badge className={selectedHygieneReport.status === 'pass' ? 'bg-emerald-500 text-lg' : 'bg-red-500 text-lg'}>
                      {selectedHygieneReport.status.toUpperCase()}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Checklist Items */}
              {selectedHygieneReport.checklistItems && selectedHygieneReport.checklistItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Completed Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedHygieneReport.checklistItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                          <span className="text-sm text-slate-700">{item.item_name}</span>
                          <Badge variant="outline">{item.answer}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Failed Items */}
              {selectedHygieneReport.failedItems && selectedHygieneReport.failedItems.length > 0 && (
                <Card className="bg-red-50 border-red-200">
                  <CardHeader>
                    <CardTitle className="text-sm text-red-900">⚠️ Failed Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {selectedHygieneReport.failedItems.map((item, idx) => (
                        <p key={idx} className="text-sm text-red-700">• {item}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
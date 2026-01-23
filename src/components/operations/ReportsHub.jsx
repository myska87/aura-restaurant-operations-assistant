import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ReportBuilder from './ReportBuilder';

export default function ReportsHub({ user }) {
  const [reportType, setReportType] = useState('daily');
  const [dateRange, setDateRange] = useState({
    from: format(new Date(), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailedMode, setDetailedMode] = useState(true);

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', dateRange],
    queryFn: () => base44.entities.DailyCheckIn.list('-created_date', 100)
  });

  const { data: temperatures = [] } = useQuery({
    queryKey: ['temperatures', dateRange],
    queryFn: () => base44.entities.TemperatureLog.list('-created_date', 100)
  });

  const { data: labels = [] } = useQuery({
    queryKey: ['labels', dateRange],
    queryFn: () => base44.entities.FoodLabel.list('-created_date', 100)
  });

  const { data: handovers = [] } = useQuery({
    queryKey: ['handovers', dateRange],
    queryFn: () => base44.entities.ShiftHandover.list('-created_date', 100)
  });

  const { data: globalInfo = {} } = useQuery({
    queryKey: ['globalInfo'],
    queryFn: async () => {
      const items = await base44.entities.GlobalInfo.list(null, 1);
      return items[0] || {};
    }
  });

  const updateDateRange = (type) => {
    const today = new Date();
    if (type === 'daily') {
      setDateRange({
        from: format(today, 'yyyy-MM-dd'),
        to: format(today, 'yyyy-MM-dd')
      });
    } else if (type === 'weekly') {
      setDateRange({
        from: format(startOfWeek(today), 'yyyy-MM-dd'),
        to: format(today, 'yyyy-MM-dd')
      });
    } else if (type === 'monthly') {
      setDateRange({
        from: format(startOfMonth(today), 'yyyy-MM-dd'),
        to: format(today, 'yyyy-MM-dd')
      });
    }
  };

  const filterByDateRange = (data) => {
    return data.filter(item => {
      const itemDate = item.created_date?.split('T')[0] || item.shift_date || item.prep_date;
      return itemDate >= dateRange.from && itemDate <= dateRange.to;
    });
  };

  const generateReportData = () => {
    const filteredCheckIns = filterByDateRange(checkIns);
    const filteredTemps = filterByDateRange(temperatures);
    const filteredLabels = filterByDateRange(labels);
    const filteredHandovers = filterByDateRange(handovers);

    return {
      checkIns: {
        total: filteredCheckIns.length,
        completed: filteredCheckIns.filter(c => c.status === 'completed').length
      },
      temperatures: {
        total: filteredTemps.length,
        compliant: filteredTemps.filter(t => t.is_in_range === true).length,
        issues: filteredTemps.filter(t => t.is_in_range === false).length
      },
      labels: {
        total: filteredLabels.length,
        active: filteredLabels.filter(l => new Date(l.use_by_date) >= new Date()).length,
        expiringSoon: filteredLabels.filter(l => {
          const useBy = new Date(l.use_by_date);
          const now = new Date();
          const diffHours = (useBy - now) / (1000 * 60 * 60);
          return diffHours > 0 && diffHours < 6;
        }).length
      },
      handovers: {
        total: filteredHandovers.length,
        acknowledged: filteredHandovers.filter(h => h.acknowledged_by).length,
        withIssues: filteredHandovers.filter(h => h.stock_issues || h.equipment_issues).length
      },
      insights: [
        filteredLabels.filter(l => new Date(l.use_by_date) < new Date()).length > 0
          ? `⚠️ ${filteredLabels.filter(l => new Date(l.use_by_date) < new Date()).length} expired labels detected`
          : '✅ All labels within expiry date',
        `📊 ${filteredCheckIns.filter(c => c.status === 'completed').length}/${filteredCheckIns.length} check-ins completed`,
        `🌡️ ${filteredTemps.filter(t => t.is_in_range === true).length}/${filteredTemps.length} temperature logs compliant`
      ],
      allRecords: [...filteredCheckIns, ...filteredTemps, ...filteredLabels, ...filteredHandovers],
      rawData: {
        checkIns: filteredCheckIns,
        temperatures: filteredTemps,
        labels: filteredLabels,
        handovers: filteredHandovers,
        issues: []
      }
    };
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setShowReport(true);
    setLoading(false);
  };

  const reportData = generateReportData();

  return (
    <div className="space-y-6">
      {!showReport ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Generate Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Type */}
              <div>
                <label className="text-sm font-medium block mb-2">Report Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: 'daily', label: 'Daily Summary' },
                    { value: 'weekly', label: 'Weekly Review' },
                    { value: 'monthly', label: 'Monthly Audit' },
                    { value: 'custom', label: 'Custom' }
                  ].map(type => (
                    <Button
                      key={type.value}
                      onClick={() => {
                        setReportType(type.value);
                        updateDateRange(type.value);
                      }}
                      variant={reportType === type.value ? 'default' : 'outline'}
                      className={reportType === type.value ? 'bg-emerald-600' : ''}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">From</label>
                  <Input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">To</label>
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="pt-3">
                    <p className="text-xs text-slate-600">Check-Ins</p>
                    <p className="text-xl font-bold text-emerald-600">{reportData.checkIns.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-3">
                    <p className="text-xs text-slate-600">Temperatures</p>
                    <p className="text-xl font-bold text-blue-600">{reportData.temperatures.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-3">
                    <p className="text-xs text-slate-600">Labels</p>
                    <p className="text-xl font-bold text-purple-600">{reportData.labels.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-3">
                    <p className="text-xs text-slate-600">Handovers</p>
                    <p className="text-xl font-bold text-amber-600">{reportData.handovers.total}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Report Detail Toggle */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setDetailedMode(false)}
                  variant={!detailedMode ? 'default' : 'outline'}
                  className={!detailedMode ? 'bg-emerald-600' : ''}
                >
                  Summary Only
                </Button>
                <Button
                  onClick={() => setDetailedMode(true)}
                  variant={detailedMode ? 'default' : 'outline'}
                  className={detailedMode ? 'bg-emerald-600' : ''}
                >
                  Full Details
                </Button>
              </div>

              <Button
                onClick={handleGenerateReport}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 text-base"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 flex gap-2">
            <Button
              onClick={() => setShowReport(false)}
              variant="outline"
            >
              ← Back to Settings
            </Button>
          </div>
          <ReportBuilder
            reportData={reportData}
            reportType={reportType}
            dateRange={dateRange}
            globalInfo={globalInfo}
            user={user}
            detailedMode={detailedMode}
          />
        </motion.div>
      )}
    </div>
  );
}
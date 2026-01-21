import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, Download, RefreshCw, Plus, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';
import SalesTab from './kpi-tabs/SalesTab';
import OperationsTab from './kpi-tabs/OperationsTab';
import MarketingTab from './kpi-tabs/MarketingTab';
import TrainingTab from './kpi-tabs/TrainingTab';

export default function DataFeedManager() {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const weekStart = format(currentWeekStart, 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(currentWeekStart), 'yyyy-MM-dd');
  const weekLabel = `${format(currentWeekStart, 'MMM d')} – ${format(endOfWeek(currentWeekStart), 'MMM d, yyyy')}`;

  // Fetch KPI data for current week
  const { data: kpiData, isLoading } = useQuery({
    queryKey: ['kpi-data', weekStart],
    queryFn: async () => {
      const results = await base44.entities.KPIData.filter({
        week_start_date: weekStart
      });
      return results[0] || {};
    }
  });

  // Initialize form data when KPI loads
  React.useEffect(() => {
    if (kpiData?.id) {
      setFormData(kpiData);
    } else {
      setFormData({
        week_start_date: weekStart,
        week_end_date: weekEnd,
        status: 'draft'
      });
    }
  }, [kpiData, weekStart, weekEnd]);

  // Save/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (data.id) {
        return base44.entities.KPIData.update(data.id, data);
      } else {
        return base44.entities.KPIData.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-data'] });
      setSaving(false);
    }
  });

  const handleSave = async () => {
    setSaving(true);
    saveMutation.mutate(formData);
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = () => {
    const csv = [
      ['Week', 'Revenue', 'Avg Order Value', 'Total Customers', 'Returning %', 'Staff Cost', 'Ingredient Cost', 'Marketing Reach', 'Engagement %', 'Training Completion %', 'Profit', 'Profit Margin %', 'Notes'],
      [
        weekLabel,
        formData.revenue || '',
        formData.avg_order_value || '',
        formData.total_customers || '',
        formData.returning_customers_pct || '',
        formData.staff_cost || '',
        formData.ingredient_cost || '',
        formData.marketing_reach || '',
        formData.engagement_pct || '',
        formData.training_completion_pct || '',
        formData.profit || '',
        formData.profit_margin_pct || '',
        formData.notes || ''
      ]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kpi-data-${weekStart}.csv`;
    a.click();
  };

  const prevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const nextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const thisWeek = () => setCurrentWeekStart(startOfWeek(new Date()));

  if (isLoading) return <div className="animate-pulse">Loading KPI data...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Data Feed Manager</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Week of {weekLabel}</p>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800">{formData.status || 'draft'}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={prevWeek}>←</Button>
              <Button size="sm" variant="outline" onClick={thisWeek}>Today</Button>
              <Button size="sm" variant="outline" onClick={nextWeek}>→</Button>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleExport} className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save & Sync'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Entry Tabs */}
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="sales">💰 Sales</TabsTrigger>
          <TabsTrigger value="operations">⚙️ Operations</TabsTrigger>
          <TabsTrigger value="marketing">📢 Marketing</TabsTrigger>
          <TabsTrigger value="training">🎓 Training</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <SalesTab data={formData} onChange={handleFieldChange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <OperationsTab data={formData} onChange={handleFieldChange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <MarketingTab data={formData} onChange={handleFieldChange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <TrainingTab data={formData} onChange={handleFieldChange} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Save className="w-4 h-4" />
          {saving ? 'Syncing...' : 'Save & Sync to Dashboard'}
        </Button>
      </div>
    </motion.div>
  );
}
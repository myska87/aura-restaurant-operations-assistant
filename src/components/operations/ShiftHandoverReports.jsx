import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Wrench, TrendingUp, Users, Download, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';

export default function ShiftHandoverReports({ handovers = [] }) {
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });

  // Filter handovers by date range
  const filteredHandovers = handovers.filter(h => {
    const hDate = h.shift_date;
    return hDate >= dateRange.from && hDate <= dateRange.to;
  });

  // Calculate statistics
  const stats = {
    total: filteredHandovers.length,
    acknowledged: filteredHandovers.filter(h => h.acknowledged_by).length,
    pending: filteredHandovers.filter(h => !h.acknowledged_by).length,
    withStockIssues: filteredHandovers.filter(h => h.stock_issues).length,
    withEquipmentIssues: filteredHandovers.filter(h => h.equipment_issues).length,
    acknowledgementRate: filteredHandovers.length > 0 
      ? Math.round((filteredHandovers.filter(h => h.acknowledged_by).length / filteredHandovers.length) * 100)
      : 0
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Date', 'Shift', 'From', 'To', 'Stock Issues', 'Equipment Issues', 'Status'],
      ...filteredHandovers.map(h => [
        h.shift_date,
        h.shift_type,
        h.handover_from_name,
        h.handover_to_name || '-',
        h.stock_issues ? 'Yes' : 'No',
        h.equipment_issues ? 'Yes' : 'No',
        h.acknowledged_by ? 'Acknowledged' : 'Pending'
      ])
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shift-handover-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium block mb-1">From</label>
          <Input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium block mb-1">To</label>
          <Input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
          />
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-1">Total Handovers</p>
                <p className="text-4xl font-bold text-emerald-600">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-1">Acknowledgement Rate</p>
                <p className="text-4xl font-bold text-blue-600">{stats.acknowledgementRate}%</p>
                <p className="text-xs text-slate-500 mt-2">{stats.acknowledged} of {stats.total}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-1">Pending Review</p>
                <p className="text-4xl font-bold text-amber-600">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Issue Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Stock Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">{stats.withStockIssues}</p>
              <p className="text-sm text-slate-500 mt-2">
                {Math.round((stats.withStockIssues / (stats.total || 1)) * 100)}% of handovers
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="w-5 h-5 text-red-600" />
                Equipment Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{stats.withEquipmentIssues}</p>
              <p className="text-sm text-slate-500 mt-2">
                {Math.round((stats.withEquipmentIssues / (stats.total || 1)) * 100)}% of handovers
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Issue Details Table */}
      {(stats.withStockIssues > 0 || stats.withEquipmentIssues > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Issues Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredHandovers
                .filter(h => h.stock_issues || h.equipment_issues)
                .map((h) => (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-slate-800">{format(new Date(h.shift_date), 'MMM d')} - {h.shift_type?.toUpperCase()}</p>
                        <p className="text-xs text-slate-500">{h.handover_from_name}</p>
                      </div>
                      {h.acknowledged_by ? (
                        <Badge className="bg-emerald-100 text-emerald-700">Acknowledged</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
                      )}
                    </div>
                    {h.stock_issues && (
                      <p className="text-sm text-slate-600 mb-1 line-clamp-2">📦 {h.stock_issues}</p>
                    )}
                    {h.equipment_issues && (
                      <p className="text-sm text-slate-600 line-clamp-2">🔧 {h.equipment_issues}</p>
                    )}
                  </motion.div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredHandovers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No handovers in selected date range</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
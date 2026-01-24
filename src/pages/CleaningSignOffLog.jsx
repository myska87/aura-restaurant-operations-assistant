import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, Lock, Shield, Filter, Download } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function CleaningSignOffLog() {
  const [user, setUser] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch cleaning sign-off logs
  const { data: signOffLogs = [], isLoading } = useQuery({
    queryKey: ['cleaningSignOffLogs', filterType, filterDate],
    queryFn: async () => {
      let query = {};
      if (filterType !== 'all') {
        query.task_type = filterType;
      }
      if (filterDate) {
        query.log_date = filterDate;
      }
      return base44.entities.CleaningSignOffLog?.filter?.(query, '-approval_time', 100) || [];
    },
    enabled: !!user,
  });

  if (!user) return <LoadingSpinner />;

  const totalLogs = signOffLogs.length;
  const dailyCleaningLogs = signOffLogs.filter(log => log.task_type === 'daily_cleaning').length;
  const deepCleaningLogs = signOffLogs.filter(log => log.task_type === 'deep_cleaning').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-24">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
                Cleaning Sign-Off Log
              </h1>
              <p className="text-lg text-slate-600">
                Legal evidence record for inspections
              </p>
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <Card className="border-2 border-blue-400 bg-blue-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-900">Legal Record Notice</p>
              <p className="text-sm text-blue-700">
                All signed-off cleaning records are locked and cannot be modified or deleted. These records serve as evidence during health inspections.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className="border-2 border-slate-200">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600 mb-2">Total Records</p>
                <p className="text-3xl font-bold text-slate-800">{totalLogs}</p>
                <p className="text-xs text-slate-500 mt-2">All locked & verified</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-2 border-blue-200">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600 mb-2">Daily Cleaning</p>
                <p className="text-3xl font-bold text-blue-600">{dailyCleaningLogs}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-2 border-purple-200">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600 mb-2">Deep Cleaning</p>
                <p className="text-3xl font-bold text-purple-600">{deepCleaningLogs}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Task Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tasks</SelectItem>
                    <SelectItem value="daily_cleaning">Daily Cleaning Only</SelectItem>
                    <SelectItem value="deep_cleaning">Deep Cleaning Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Date</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {filterDate && (
                <div className="flex items-end">
                  <Button
                    onClick={() => setFilterDate('')}
                    variant="outline"
                    className="w-full"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        {isLoading ? (
          <LoadingSpinner />
        ) : signOffLogs.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-300">
            <CardContent className="pt-12 text-center">
              <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No Records Found</h3>
              <p className="text-slate-500">
                Cleaning logs will appear here once they have been completed and supervisor approved.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {signOffLogs.map((log, idx) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-all border-l-4 border-emerald-400 bg-gradient-to-r from-emerald-50 to-white">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        {/* Task Info */}
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className={log.task_type === 'daily_cleaning' ? 'bg-blue-600' : 'bg-purple-600'}>
                            {log.task_type === 'daily_cleaning' ? 'Daily' : 'Deep'}
                          </Badge>
                          <h3 className="font-bold text-lg text-slate-800">{log.task_name}</h3>
                          <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                            <Lock className="w-4 h-4" />
                            <span className="text-xs">LOCKED</span>
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 mb-3">{log.area_equipment}</p>

                        {/* Staff & Supervisor */}
                        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                          <div className="bg-slate-50 p-2 rounded border border-slate-200">
                            <p className="text-xs text-slate-600 font-semibold">Completed By</p>
                            <p className="text-slate-800 font-medium">{log.completed_by_name}</p>
                            <p className="text-xs text-slate-500">{format(new Date(log.completion_time), 'HH:mm')}</p>
                          </div>

                          <div className="bg-emerald-50 p-2 rounded border border-emerald-200">
                            <p className="text-xs text-emerald-600 font-semibold">Supervisor Approved</p>
                            <p className="text-slate-800 font-medium">{log.supervisor_name}</p>
                            <p className="text-xs text-slate-500">{format(new Date(log.approval_time), 'HH:mm')}</p>
                          </div>
                        </div>

                        {/* Timestamps */}
                        <div className="text-xs text-slate-500 space-y-1">
                          <p><strong>Log Date:</strong> {format(new Date(log.log_date), 'd MMMM yyyy')}</p>
                          <p><strong>Completed:</strong> {format(new Date(log.completion_time), 'd MMM yyyy HH:mm')}</p>
                          <p><strong>Approved:</strong> {format(new Date(log.approval_time), 'd MMM yyyy HH:mm')}</p>
                        </div>

                        {/* Notes */}
                        {log.notes && (
                          <div className="mt-3 p-2 bg-slate-50 rounded border border-slate-200">
                            <p className="text-xs text-slate-600 font-semibold mb-1">Notes</p>
                            <p className="text-sm text-slate-700">{log.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Lock Icon */}
                      <div className="flex flex-col items-center gap-2">
                        <Shield className="w-8 h-8 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-700">READ-ONLY</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Export Notice */}
        {signOffLogs.length > 0 && (
          <Card className="bg-slate-50 border-slate-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">Inspection Ready</p>
                  <p className="text-sm text-slate-600">All records are locked, verified, and ready for health inspections.</p>
                </div>
                <Button disabled className="gap-2" variant="outline">
                  <Download className="w-4 h-4" />
                  Export (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';

export default function HACCPInspectorView({ onBack, dateRange }) {
  const [expandedCCP, setExpandedCCP] = useState(null);

  // Fetch active HACCP plan
  const { data: haccpPlan } = useQuery({
    queryKey: ['haccpPlan'],
    queryFn: async () => {
      const plans = await base44.entities.HACCPPlan.filter({
        is_active: true,
        compliance_status: 'implemented'
      }, '-last_updated', 1);
      return plans[0];
    }
  });

  // Fetch CCPs
  const { data: ccps = [] } = useQuery({
    queryKey: ['ccpsInspector', haccpPlan?.id],
    queryFn: () => base44.entities.CriticalControlPoint.filter({
      haccp_plan_id: haccpPlan?.id,
      is_active: true
    }, '-created_date', 100),
    enabled: !!haccpPlan?.id
  });

  // Fetch CCP checks for date range
  const getDateRange = () => {
    const today = new Date();
    if (dateRange === 'today') return { start: today, days: 1 };
    if (dateRange === 'last_7') return { start: subDays(today, 7), days: 7 };
    if (dateRange === 'last_30') return { start: subDays(today, 30), days: 30 };
    if (dateRange === 'last_60') return { start: subDays(today, 60), days: 60 };
    if (dateRange === 'last_90') return { start: subDays(today, 90), days: 90 };
    return { start: subDays(today, 30), days: 30 };
  };

  const { start: startDate } = getDateRange();
  const startDateStr = format(startDate, 'yyyy-MM-dd');

  const { data: ccpChecks = [] } = useQuery({
    queryKey: ['ccpChecksInspector', startDateStr],
    queryFn: () => base44.entities.CriticalControlPointCheck.filter({
      check_date: { $gte: startDateStr }
    }, '-timestamp', 500),
    enabled: !!startDateStr
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidentsInspector', startDateStr],
    queryFn: () => base44.entities.IncidentRecord.filter({
      incident_time: { $gte: new Date(startDate).toISOString() }
    }, '-incident_time', 100),
    enabled: !!startDateStr
  });

  const getCCPStats = (ccpId) => {
    const ccpSpecificChecks = ccpChecks.filter(c => c.ccp_id === ccpId);
    const passed = ccpSpecificChecks.filter(c => c.status === 'pass').length;
    const failed = ccpSpecificChecks.filter(c => c.status === 'fail').length;
    const total = ccpSpecificChecks.length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    
    return { passed, failed, total, passRate, checks: ccpSpecificChecks };
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button onClick={onBack} variant="outline" className="bg-white/20 hover:bg-white/30 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">HACCP Plan & CCPs</h1>
            <p className="text-slate-300 text-sm mt-1">Active control points and verification records</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8 space-y-8">
        {/* HACCP Plan Summary */}
        {haccpPlan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  Active HACCP Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Location</p>
                    <p className="font-bold text-slate-900">{haccpPlan.location_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Version</p>
                    <p className="font-bold text-slate-900">{haccpPlan.version}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">CCPs Identified</p>
                    <p className="font-bold text-emerald-600">{haccpPlan.ccps_identified}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Status</p>
                    <Badge className="bg-emerald-500">IMPLEMENTED</Badge>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-600 mb-2">Verified By</p>
                  <p className="font-semibold">{haccpPlan.verified_by}</p>
                  <p className="text-xs text-slate-500">on {format(new Date(haccpPlan.verified_date), 'PPP')}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* CCPs List */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
            Critical Control Points ({ccps.length})
          </h2>

          {ccps.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No CCPs defined</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {ccps.map((ccp, idx) => {
                const stats = getCCPStats(ccp.id);
                const isExpanded = expandedCCP === ccp.id;

                return (
                  <motion.div
                    key={ccp.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-slate-400"
                      onClick={() => setExpandedCCP(isExpanded ? null : ccp.id)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{ccp.name}</h3>
                            <p className="text-sm text-slate-600 mt-1">
                              Stage: <span className="font-semibold capitalize">{ccp.stage}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-600">{stats.passRate}%</p>
                            <p className="text-xs text-slate-500">Pass Rate</p>
                          </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-4 gap-2 text-center text-sm mb-4">
                          <div className="bg-emerald-50 p-2 rounded">
                            <p className="font-bold text-emerald-700">{stats.passed}</p>
                            <p className="text-xs text-emerald-600">Passed</p>
                          </div>
                          <div className="bg-red-50 p-2 rounded">
                            <p className="font-bold text-red-700">{stats.failed}</p>
                            <p className="text-xs text-red-600">Failed</p>
                          </div>
                          <div className="bg-blue-50 p-2 rounded">
                            <p className="font-bold text-blue-700">{stats.total}</p>
                            <p className="text-xs text-blue-600">Total</p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded">
                            <p className="font-bold text-slate-700">{ccp.check_frequency}</p>
                            <p className="text-xs text-slate-600">Frequency</p>
                          </div>
                        </div>

                        {/* Key Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm pb-4 border-b">
                          <div>
                            <p className="text-slate-600">Critical Limit</p>
                            <p className="font-bold text-slate-900">{ccp.critical_limit}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Monitoring Method</p>
                            <p className="font-bold text-slate-900">{ccp.monitoring_method}</p>
                          </div>
                        </div>

                        {/* Expandable Details */}
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-4 space-y-4"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-700 mb-2">Responsible Role</p>
                              <p className="text-slate-600">{ccp.responsible_role}</p>
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-slate-700 mb-2">Corrective Actions</p>
                              {ccp.corrective_actions && ccp.corrective_actions.length > 0 ? (
                                <div className="space-y-2">
                                  {ccp.corrective_actions.map((action, i) => (
                                    <div key={i} className="bg-slate-50 p-3 rounded text-sm">
                                      <p className="font-semibold">{action.action}</p>
                                      <p className="text-slate-600 text-xs mt-1">
                                        Responsible: {action.responsible_person} • Time limit: {action.time_limit}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-slate-500">None defined</p>
                              )}
                            </div>

                            {/* Recent Checks */}
                            {stats.checks.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-slate-700 mb-2">Recent Checks</p>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {stats.checks.slice(0, 10).map((check) => (
                                    <div key={check.id} className="bg-slate-50 p-2 rounded text-xs flex items-center justify-between">
                                      <div>
                                        <p className="font-semibold">{check.recorded_value} {check.unit}</p>
                                        <p className="text-slate-500">{check.check_date} {check.check_time}</p>
                                      </div>
                                      <Badge className={check.status === 'pass' ? 'bg-emerald-500' : 'bg-red-500'}>
                                        {check.status.toUpperCase()}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Incidents in Period */}
        {incidents.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-2 border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertCircle className="w-5 h-5" />
                  Incidents Recorded ({incidents.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {incidents.map((incident) => (
                  <div key={incident.id} className="bg-white p-3 rounded border border-red-200 text-sm">
                    <p className="font-bold text-red-900">{incident.ccp_name}</p>
                    <p className="text-red-700 text-xs">
                      Failure: {incident.failure_value} | Action: {incident.corrective_action_type}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
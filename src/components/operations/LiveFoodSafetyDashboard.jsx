import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Thermometer, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subHours } from 'date-fns';

export default function LiveFoodSafetyDashboard({ user, autoRefreshInterval = 30000 }) {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Fetch active CCPs
  const { data: activeCCPs = [] } = useQuery({
    queryKey: ['activeCCPs'],
    queryFn: () => base44.entities.CriticalControlPoint.filter({ is_active: true }, '-created_date', 50),
    refetchInterval: autoRefreshInterval,
    enabled: !!user
  });

  // Fetch today's CCP checks
  const { data: todayChecks = [] } = useQuery({
    queryKey: ['todayChecks', format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      return base44.entities.CriticalControlPointCheck.filter({
        check_date: today
      }, '-timestamp', 100);
    },
    refetchInterval: autoRefreshInterval,
    enabled: !!user
  });

  // Fetch open incidents
  const { data: openIncidents = [] } = useQuery({
    queryKey: ['openIncidents'],
    queryFn: () => base44.entities.IncidentRecord.filter({
      resolution_result: 'pending'
    }, '-incident_time', 50),
    refetchInterval: autoRefreshInterval,
    enabled: !!user
  });

  // Fetch today's temperature logs
  const { data: tempLogs = [] } = useQuery({
    queryKey: ['todayTemps', format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      return base44.entities.TemperatureLog.filter({
        log_date: today
      }, '-created_date', 100);
    },
    refetchInterval: autoRefreshInterval,
    enabled: !!user
  });

  // Calculate CCP status
  const getCCPStatus = (ccp) => {
    const ccpChecks = todayChecks.filter(c => c.ccp_id === ccp.id);
    if (ccpChecks.length === 0) return { status: 'amber', reason: 'No checks today' };
    
    const latestCheck = ccpChecks[0];
    if (latestCheck.status === 'fail') return { status: 'red', reason: 'Failed check' };
    return { status: 'green', reason: 'Passing' };
  };

  // Get last fridge temp
  const lastFridgeTemp = tempLogs
    .filter(t => t.equipment_name?.toLowerCase().includes('fridge'))
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

  // Get last hot-hold temp
  const lastHotTemp = tempLogs
    .filter(t => t.equipment_name?.toLowerCase().includes('hot') || t.equipment_name?.toLowerCase().includes('hold'))
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

  // Count missed checks
  const missedChecks = activeCCPs.filter(ccp => {
    const checks = todayChecks.filter(c => c.ccp_id === ccp.id);
    const expectedChecks = ccp.check_frequency === 'hourly' ? new Date().getHours() : 1;
    return checks.length < expectedChecks;
  }).length;

  const statusColors = {
    green: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-900' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-900' },
    red: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-900' }
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Live Food Safety Status</h2>
          <p className="text-sm text-slate-500 mt-1">
            Last updated: {format(lastRefresh, 'HH:mm:ss')} • Auto-refreshing every {autoRefreshInterval / 1000}s
          </p>
        </div>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <RefreshCw className="w-5 h-5 text-emerald-600" />
        </motion.div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* CCPs Status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-l-4 border-emerald-500">
            <CardContent className="pt-4">
              <p className="text-xs text-slate-500 mb-1">Active CCPs</p>
              <p className="text-3xl font-bold text-slate-900">{activeCCPs.length}</p>
              <p className="text-xs text-emerald-600 mt-1">Being monitored</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Passed Checks */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-l-4 border-emerald-500">
            <CardContent className="pt-4">
              <p className="text-xs text-slate-500 mb-1">Passed Today</p>
              <p className="text-3xl font-bold text-emerald-600">
                {todayChecks.filter(c => c.status === 'pass').length}
              </p>
              <p className="text-xs text-emerald-600 mt-1">Checks</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Failed Checks */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className={`border-l-4 ${todayChecks.filter(c => c.status === 'fail').length > 0 ? 'border-red-500' : 'border-slate-300'}`}>
            <CardContent className="pt-4">
              <p className="text-xs text-slate-500 mb-1">Failed Today</p>
              <p className={`text-3xl font-bold ${todayChecks.filter(c => c.status === 'fail').length > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                {todayChecks.filter(c => c.status === 'fail').length}
              </p>
              <p className="text-xs text-red-600 mt-1">Requires action</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Open Incidents */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className={`border-l-4 ${openIncidents.length > 0 ? 'border-red-500' : 'border-slate-300'}`}>
            <CardContent className="pt-4">
              <p className="text-xs text-slate-500 mb-1">Open Incidents</p>
              <p className={`text-3xl font-bold ${openIncidents.length > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                {openIncidents.length}
              </p>
              <p className="text-xs text-red-600 mt-1">Unresolved</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* CCP Status Grid */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          Critical Control Points Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeCCPs.map((ccp) => {
            const status = getCCPStatus(ccp);
            const colors = statusColors[status.status];
            const ccpChecks = todayChecks.filter(c => c.ccp_id === ccp.id);
            const latestCheck = ccpChecks[0];

            return (
              <motion.div
                key={ccp.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className={`${colors.bg} border-2 ${colors.border}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-base ${colors.text}`}>{ccp.name}</CardTitle>
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {status.status === 'green' ? (
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        ) : status.status === 'amber' ? (
                          <AlertCircle className="w-6 h-6 text-amber-600" />
                        ) : (
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        )}
                      </motion.div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Limit:</span>
                        <span className="font-semibold">{ccp.critical_limit}</span>
                      </div>
                      {latestCheck && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Latest Value:</span>
                            <span className="font-semibold">{latestCheck.recorded_value}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Time:</span>
                            <span>{latestCheck.check_time}</span>
                          </div>
                        </>
                      )}
                      <Badge className={
                        status.status === 'green' ? 'bg-emerald-500 w-full justify-center' :
                        status.status === 'amber' ? 'bg-amber-500 w-full justify-center' :
                        'bg-red-500 w-full justify-center'
                      }>
                        {status.reason}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Temperature Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fridge Temp */}
        <Card className={`border-2 ${lastFridgeTemp && lastFridgeTemp.temperature <= 5 ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="w-5 h-5" />
              Refrigerator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lastFridgeTemp ? (
              <>
                <div className="text-4xl font-bold text-slate-900">
                  {lastFridgeTemp.temperature}°C
                </div>
                <p className="text-sm text-slate-600">
                  Safe Range: 0-5°C
                </p>
                <p className="text-xs text-slate-500">
                  {format(new Date(lastFridgeTemp.created_date), 'HH:mm')}
                </p>
                <Badge className={lastFridgeTemp.temperature <= 5 ? 'bg-emerald-500' : 'bg-red-500'}>
                  {lastFridgeTemp.temperature <= 5 ? '✓ SAFE' : '⚠ WARNING'}
                </Badge>
              </>
            ) : (
              <p className="text-slate-500">No reading today</p>
            )}
          </CardContent>
        </Card>

        {/* Hot Hold Temp */}
        <Card className={`border-2 ${lastHotTemp && lastHotTemp.temperature >= 63 ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="w-5 h-5" />
              Hot Hold Equipment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lastHotTemp ? (
              <>
                <div className="text-4xl font-bold text-slate-900">
                  {lastHotTemp.temperature}°C
                </div>
                <p className="text-sm text-slate-600">
                  Safe Range: 63°C+
                </p>
                <p className="text-xs text-slate-500">
                  {format(new Date(lastHotTemp.created_date), 'HH:mm')}
                </p>
                <Badge className={lastHotTemp.temperature >= 63 ? 'bg-emerald-500' : 'bg-red-500'}>
                  {lastHotTemp.temperature >= 63 ? '✓ SAFE' : '⚠ WARNING'}
                </Badge>
              </>
            ) : (
              <p className="text-slate-500">No reading today</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Missed Checks Warning */}
      {missedChecks > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border-2 border-amber-300 p-4 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">⏰ {missedChecks} CCP Check(s) Overdue Today</p>
              <p className="text-sm text-amber-800 mt-1">
                Complete pending checks to maintain food safety compliance.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Open Incidents */}
      {openIncidents.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Open Incidents ({openIncidents.length})
          </h3>
          <div className="space-y-3">
            {openIncidents.map((incident) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="border-l-4 border-red-500 bg-red-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-red-900">{incident.ccp_name}</p>
                      <Badge className={
                        incident.incident_severity === 'critical' ? 'bg-red-600' :
                        incident.incident_severity === 'major' ? 'bg-amber-600' :
                        'bg-blue-600'
                      }>
                        {incident.incident_severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-red-700">
                      Failure: {incident.failure_value} (Limit: {incident.critical_limit})
                    </p>
                    <p className="text-xs text-red-600 mt-2">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {format(new Date(incident.incident_time), 'HH:mm')} • Action: {incident.corrective_action_type}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
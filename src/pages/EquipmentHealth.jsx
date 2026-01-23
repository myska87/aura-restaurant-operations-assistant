import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Thermometer,
  Calendar,
  DollarSign,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import EquipmentCheckForm from '@/components/equipment/EquipmentCheckForm';
import EquipmentFaultForm from '@/components/equipment/EquipmentFaultForm';
import EquipmentList from '@/components/equipment/EquipmentList';
import QuickFaultReportForm from '@/components/equipment/QuickFaultReportForm';
import EquipmentAuditForm from '@/components/equipment/EquipmentAuditForm';

export default function EquipmentHealth() {
  const [showCheckForm, setShowCheckForm] = useState(false);
  const [showFaultForm, setShowFaultForm] = useState(false);
  const [showQuickFaultForm, setShowQuickFaultForm] = useState(false);
  const [showAuditForm, setShowAuditForm] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  // Fetch all equipment from Assets Registry
  const { data: equipment = [], isLoading: loadingEquipment } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Assets_Registry_v1.filter({ 
      status: { $ne: 'deactivated' }
    }, '-created_date', 100)
  });

  // Fetch today's checks
  const { data: todayChecks = [] } = useQuery({
    queryKey: ['equipment-checks-today'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      return base44.entities.EquipmentCheck.filter({ check_date: today }, '-created_date', 100);
    }
  });

  // Fetch active faults
  const { data: activeFaults = [] } = useQuery({
    queryKey: ['equipment-faults-active'],
    queryFn: () => base44.entities.EquipmentFault.filter({ 
      status: { $in: ['reported', 'temporary_fix', 'engineer_called', 'in_progress'] }
    }, '-fault_date', 50)
  });

  // Fetch all faults for analytics
  const { data: allFaults = [] } = useQuery({
    queryKey: ['equipment-faults-all'],
    queryFn: () => base44.entities.EquipmentFault.list('-fault_date', 200)
  });

  // Fetch temperature logs with issues
  const { data: tempIssues = [] } = useQuery({
    queryKey: ['temp-issues'],
    queryFn: async () => {
      const logs = await base44.entities.TemperatureLog.filter({ is_in_range: false }, '-log_date', 20);
      return logs;
    }
  });

  // Calculate stats
  const criticalEquipment = equipment.filter(e => ['fault', 'out_of_service', 'warning'].includes(e.status));
  const checkedToday = todayChecks.filter(c => c.status === 'ok').length;
  const warningsToday = todayChecks.filter(c => c.status === 'warning').length;
  const faultsToday = todayChecks.filter(c => c.status === 'fault').length;
  const totalRepairCost = equipment.reduce((sum, e) => sum + (e.total_repair_cost || 0), 0);
  const criticalFaults = activeFaults.filter(f => f.severity === 'critical').length;

  const handleReportFault = (equipment) => {
    setSelectedEquipment(equipment);
    setShowFaultForm(true);
  };

  const handleCheckEquipment = (equipment) => {
    setSelectedEquipment(equipment);
    setShowCheckForm(true);
  };

  if (loadingEquipment) {
    return <LoadingSpinner message="Loading equipment health..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipment Health & Maintenance"
        description="Proactive equipment monitoring and maintenance tracking"
      />

      {/* Critical Alerts */}
      {(criticalFaults > 0 || tempIssues.length > 0) && (
        <Card className="bg-red-50 border-red-300">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Critical Issues Require Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalFaults > 0 && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">{criticalFaults} Critical Equipment Fault{criticalFaults !== 1 ? 's' : ''}</p>
                  <p className="text-sm text-red-700">Immediate action required - food safety or service at risk</p>
                </div>
              </div>
            )}
            {tempIssues.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-orange-200">
                <Thermometer className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-900">{tempIssues.length} Temperature Alert{tempIssues.length !== 1 ? 's' : ''}</p>
                  <p className="text-sm text-orange-700">Refrigeration equipment out of range</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Checked Today</p>
                <p className="text-2xl font-bold text-emerald-600">{checkedToday}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Faults</p>
                <p className="text-2xl font-bold text-red-600">{activeFaults.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Warnings</p>
                <p className="text-2xl font-bold text-amber-600">{warningsToday}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Repair Costs (Total)</p>
                <p className="text-2xl font-bold text-slate-700">£{totalRepairCost.toFixed(0)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="checks">Daily Checks</TabsTrigger>
          <TabsTrigger value="faults">Active Faults</TabsTrigger>
          <TabsTrigger value="equipment">Equipment List</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {/* Today's Check Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Today's Equipment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayChecks.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No equipment checks performed today</p>
                  <p className="text-sm text-slate-500">Start daily checks to monitor equipment health</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                      <div>
                        <p className="text-2xl font-bold text-emerald-900">{checkedToday}</p>
                        <p className="text-sm text-emerald-700">OK Status</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-8 h-8 text-amber-600" />
                      <div>
                        <p className="text-2xl font-bold text-amber-900">{warningsToday}</p>
                        <p className="text-sm text-amber-700">Warnings</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                      <div>
                        <p className="text-2xl font-bold text-red-900">{faultsToday}</p>
                        <p className="text-sm text-red-700">Faults</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Equipment Requiring Attention */}
          {criticalEquipment.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <Wrench className="w-5 h-5" />
                  Equipment Requiring Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {criticalEquipment.map(eq => (
                    <div key={eq.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="font-semibold">{eq.asset_name}</p>
                          <p className="text-sm text-slate-600 capitalize">{eq.location?.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 capitalize">
                        {eq.status?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="checks">
          <EquipmentList
            equipment={equipment}
            todayChecks={todayChecks}
            onCheck={handleCheckEquipment}
            onReportFault={handleReportFault}
          />
        </TabsContent>

        <TabsContent value="faults" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowFaultForm(true)} className="bg-red-600 hover:bg-red-700">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Report New Fault
            </Button>
          </div>

          {activeFaults.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No active faults</p>
                <p className="text-sm text-slate-500">All equipment is functioning normally</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeFaults.map(fault => (
                <Card key={fault.id} className={
                  fault.severity === 'critical' ? 'border-red-300 bg-red-50' :
                  fault.severity === 'medium' ? 'border-amber-300 bg-amber-50' :
                  'border-slate-300'
                }>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <AlertTriangle className={`w-5 h-5 ${
                            fault.severity === 'critical' ? 'text-red-600' :
                            fault.severity === 'medium' ? 'text-amber-600' :
                            'text-slate-600'
                          }`} />
                          <div>
                            <h3 className="font-semibold text-lg">{fault.equipment_name}</h3>
                            <p className="text-sm text-slate-600">{fault.fault_type}</p>
                          </div>
                        </div>
                        <p className="text-slate-700 mb-3">{fault.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={
                            fault.severity === 'critical' ? 'bg-red-600' :
                            fault.severity === 'medium' ? 'bg-amber-600' :
                            'bg-slate-600'
                          }>
                            {fault.severity}
                          </Badge>
                          <Badge variant="outline">{fault.impact}</Badge>
                          <Badge variant="outline">{fault.status}</Badge>
                        </div>
                        <div className="mt-3 text-sm text-slate-600">
                          <p>Reported by {fault.reported_by_name} on {format(new Date(fault.fault_date), 'MMM d, yyyy HH:mm')}</p>
                          {fault.downtime_hours && <p>Downtime: {fault.downtime_hours} hours</p>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Equipment Dashboard</CardTitle>
                <Button 
                  onClick={() => setShowQuickFaultForm(true)}
                  className="bg-red-600 hover:bg-red-700"
                  size="sm"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Quick Report Fault
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter */}
              <div className="flex gap-2 mb-4">
                {['all', 'faulty', 'under_maintenance', 'needs_audit'].map(filter => (
                  <Button
                    key={filter}
                    onClick={() => setEquipmentFilter(filter)}
                    variant={equipmentFilter === filter ? 'default' : 'outline'}
                    size="sm"
                  >
                    {filter === 'all' ? 'All Equipment' :
                     filter === 'faulty' ? '🔴 Faulty' :
                     filter === 'under_maintenance' ? '🟠 Maintenance' :
                     '⚠️ Needs Audit'}
                  </Button>
                ))}
              </div>

              {/* Equipment Grid */}
              <div className="grid md:grid-cols-2 gap-3">
                {equipment
                  .filter(eq => {
                    if (equipmentFilter === 'all') return true;
                    if (equipmentFilter === 'faulty') return eq.status === 'fault';
                    if (equipmentFilter === 'under_maintenance') return ['warning', 'out_of_service'].includes(eq.status);
                    if (equipmentFilter === 'needs_audit') return !eq.last_audit_date;
                    return true;
                  })
                  .map(eq => {
                    const hasFault = activeFaults.some(f => f.equipment_name === eq.asset_name && f.severity === 'critical');
                    return (
                      <div 
                        key={eq.id}
                        className={`p-4 rounded-lg border-2 ${
                          hasFault ? 'border-red-300 bg-red-50' :
                          eq.status === 'warning' ? 'border-amber-300 bg-amber-50' :
                          'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold">{eq.asset_name}</p>
                            <p className="text-xs text-slate-600">{eq.location?.replace(/_/g, ' ')}</p>
                          </div>
                          <Badge variant="outline" className={
                            hasFault ? 'bg-red-100 text-red-800' :
                            eq.status === 'warning' ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }>
                            {hasFault ? '🔴 Fault' : eq.status === 'ok' ? '🟢 OK' : '🟠 ' + eq.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-600 space-y-1 mb-3">
                          {eq.last_audit_date && <p>Last Audit: {format(new Date(eq.last_audit_date), 'MMM d')}</p>}
                          {eq.warranty_expiry && <p>Warranty: {format(new Date(eq.warranty_expiry), 'MMM d, yyyy')}</p>}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => handleReportFault(eq)}>
                            🪛 Report Fault
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 text-xs">
                            📋 Logs
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>🧾 Equipment Audit & Inspection</CardTitle>
                <Button 
                  onClick={() => setShowAuditForm(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Start Audit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Conduct weekly or monthly audits to ensure all equipment is maintained to standard.
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                {equipment.map(eq => {
                  const daysAgo = eq.last_audit_date ? Math.floor((new Date() - new Date(eq.last_audit_date)) / (1000 * 60 * 60 * 24)) : 999;
                  const auditNeeded = !eq.last_audit_date || daysAgo > 7;
                  return (
                    <div key={eq.id} className={`p-3 rounded-lg border ${auditNeeded ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                      <p className="font-semibold text-sm">{eq.asset_name}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {eq.last_audit_date 
                          ? `Last audited ${daysAgo} days ago`
                          : '⚠️ Never audited'}
                      </p>
                      {auditNeeded && <Badge className="mt-2 text-xs bg-amber-600">Audit Due</Badge>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forms */}
      {showCheckForm && (
        <EquipmentCheckForm
          equipment={selectedEquipment}
          onClose={() => {
            setShowCheckForm(false);
            setSelectedEquipment(null);
          }}
        />
      )}

      {showFaultForm && (
        <EquipmentFaultForm
          equipment={selectedEquipment}
          allEquipment={equipment}
          onClose={() => {
            setShowFaultForm(false);
            setSelectedEquipment(null);
          }}
        />
      )}

      {showQuickFaultForm && (
        <QuickFaultReportForm
          open={showQuickFaultForm}
          onClose={() => setShowQuickFaultForm(false)}
          equipment={selectedEquipment}
          allEquipment={equipment}
          user={user}
        />
      )}

      {showAuditForm && (
        <EquipmentAuditForm
          open={showAuditForm}
          onClose={() => setShowAuditForm(false)}
          equipment={selectedEquipment}
          allEquipment={equipment}
          user={user}
        />
      )}
    </div>
  );
}
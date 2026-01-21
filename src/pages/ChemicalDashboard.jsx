import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FlaskConical, AlertTriangle, TrendingUp, Shield, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ChemicalListView from '@/components/chemical/ChemicalListView';
import ChemicalStockAlerts from '@/components/chemical/ChemicalStockAlerts';
import ChemicalIncidentForm from '@/components/chemical/ChemicalIncidentForm';
import DailyChemicalChecklist from '@/components/chemical/DailyChemicalChecklist';

export default function ChemicalDashboard() {
  const [user, setUser] = useState(null);
  const [showIncidentForm, setShowIncidentForm] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: chemicals = [] } = useQuery({
    queryKey: ['chemicals'],
    queryFn: () => base44.entities.Chemical.list()
  });

  const { data: stock = [] } = useQuery({
    queryKey: ['chemicalStock'],
    queryFn: () => base44.entities.ChemicalStock.list()
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['chemicalIncidents'],
    queryFn: () => base44.entities.ChemicalIncident.list('-incident_date', 50)
  });

  const { data: checks = [] } = useQuery({
    queryKey: ['chemicalChecks'],
    queryFn: () => base44.entities.ChemicalCheck.list('-check_date', 30)
  });

  const { data: trainingProgress = [] } = useQuery({
    queryKey: ['chemicalTraining'],
    queryFn: () => base44.entities.TrainingProgress.filter({ 
      course_title: { $regex: 'Chemical|COSHH|Safety', $options: 'i' }
    })
  });

  if (!user) return <LoadingSpinner />;

  const canView = ['admin', 'manager', 'owner'].includes(user.role);

  if (!canView) {
    return (
      <div className="py-12 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold mb-2">Manager Access Only</h2>
        <p className="text-slate-600">Chemical dashboard is restricted to management.</p>
      </div>
    );
  }

  // Analytics
  const approvedCount = chemicals.filter(c => c.is_approved).length;
  const complianceRate = checks.length > 0 
    ? Math.round((checks.filter(c => c.all_checks_passed).length / checks.length) * 100)
    : 0;
  const lowStockCount = stock.filter(s => s.status === 'low' || s.status === 'out_of_stock').length;
  const expiredCount = stock.filter(s => s.is_expired).length;
  const activeIncidents = incidents.filter(i => i.status !== 'resolved').length;
  const trainedStaff = trainingProgress.filter(t => t.completion_percentage === 100).length;

  const recentIncidents = incidents.slice(0, 10);
  const todayChecks = checks.filter(c => c.check_date === format(new Date(), 'yyyy-MM-dd'));

  const exportReport = () => {
    const csv = [
      ['Chemical Safety Report', format(new Date(), 'yyyy-MM-dd')],
      [],
      ['Metric', 'Value'],
      ['Total Chemicals', chemicals.length],
      ['Approved Chemicals', approvedCount],
      ['Compliance Rate', `${complianceRate}%`],
      ['Low Stock Items', lowStockCount],
      ['Expired Items', expiredCount],
      ['Active Incidents', activeIncidents],
      ['Trained Staff', trainedStaff],
      [],
      ['Recent Incidents'],
      ['Date', 'Type', 'Chemical', 'Reported By', 'Severity', 'Status'],
      ...incidents.slice(0, 20).map(i => [
        format(new Date(i.incident_date), 'yyyy-MM-dd'),
        i.incident_type,
        i.chemical_name,
        i.reported_by_name,
        i.severity,
        i.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chemical-safety-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chemical Safety Dashboard"
        description="COSHH compliance, stock control & incident tracking"
      />

      <div className="flex gap-2 flex-wrap">
        <Button onClick={exportReport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
        <Button onClick={() => window.print()} variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
        <Button onClick={() => setShowIncidentForm(!showIncidentForm)} className="ml-auto">
          ⚠️ Report Incident
        </Button>
      </div>

      {/* Incident Form Modal */}
      {showIncidentForm && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <ChemicalIncidentForm onClose={() => setShowIncidentForm(false)} />
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <FlaskConical className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedCount}/{chemicals.length}</p>
                <p className="text-xs text-slate-500">Approved Chemicals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{complianceRate}%</p>
                <p className="text-xs text-slate-500">Check Compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={lowStockCount > 0 ? 'bg-amber-50 border-amber-300' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-amber-100' : 'bg-slate-100'}`}>
                <AlertTriangle className={`w-6 h-6 ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowStockCount}</p>
                <p className="text-xs text-slate-500">Low/Out Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={activeIncidents > 0 ? 'bg-red-50 border-red-300' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${activeIncidents > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
                <Shield className={`w-6 h-6 ${activeIncidents > 0 ? 'text-red-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeIncidents}</p>
                <p className="text-xs text-slate-500">Active Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="chemicals">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chemicals">📚 Chemical Library</TabsTrigger>
          <TabsTrigger value="stock">📦 Stock Alerts</TabsTrigger>
          <TabsTrigger value="checks">✅ Daily Checks</TabsTrigger>
          <TabsTrigger value="incidents">⚠️ Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="chemicals" className="mt-6">
          <ChemicalListView chemicals={chemicals} />
        </TabsContent>

        <TabsContent value="stock" className="mt-6">
          <ChemicalStockAlerts chemicals={chemicals} />
        </TabsContent>

        <TabsContent value="checks" className="mt-6">
          <DailyChemicalChecklist />
        </TabsContent>

        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle>Recent Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentIncidents.map(incident => (
                  <Card key={incident.id} className={
                    incident.severity === 'critical' ? 'bg-red-50 border-red-300' :
                    incident.severity === 'high' ? 'bg-orange-50 border-orange-300' :
                    'bg-slate-50'
                  }>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={
                              incident.severity === 'critical' ? 'bg-red-600' :
                              incident.severity === 'high' ? 'bg-orange-600' :
                              incident.severity === 'medium' ? 'bg-amber-600' :
                              'bg-slate-600'
                            }>
                              {incident.severity}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {incident.incident_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="font-semibold">{incident.chemical_name}</p>
                          <p className="text-sm text-slate-600">{incident.description}</p>
                        </div>
                        <Badge className={
                          incident.status === 'resolved' ? 'bg-emerald-600' :
                          incident.status === 'investigating' ? 'bg-blue-600' :
                          'bg-amber-600'
                        }>
                          {incident.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 pt-2 border-t">
                        {incident.reported_by_name} • {format(new Date(incident.incident_date), 'PPp')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {recentIncidents.length === 0 && (
                  <p className="text-center text-slate-500 py-8">No incidents reported</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  );
}
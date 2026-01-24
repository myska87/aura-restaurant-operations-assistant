import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { AlertTriangle, CheckCircle, Clock, Shield, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function IncidentCenter() {
  const [user, setUser] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [managerNotes, setManagerNotes] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const isManager = ['manager', 'owner', 'admin'].includes(user?.role);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.IncidentRecord.list('-incident_time', 100),
    enabled: !!user && isManager
  });

  const handleAddNotes = async () => {
    if (!managerNotes.trim()) return;
    
    setSaving(true);
    try {
      await base44.entities.IncidentRecord.update(selectedIncident.id, {
        manager_notes: managerNotes,
        manager_notes_by_id: user?.id,
        manager_notes_by_email: user?.email,
        manager_notes_time: new Date().toISOString()
      });

      setSelectedIncident({
        ...selectedIncident,
        manager_notes: managerNotes,
        manager_notes_by_email: user?.email,
        manager_notes_time: new Date().toISOString()
      });
      setManagerNotes('');
    } catch (error) {
      console.error('Failed to add notes:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isManager) {
    return (
      <div className="py-12 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold mb-2">Manager Access Only</h2>
        <p className="text-slate-600">Incident records are restricted to management.</p>
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner message="Loading incidents..." />;

  const critical = incidents.filter(i => i.incident_severity === 'critical');
  const major = incidents.filter(i => i.incident_severity === 'major');
  const resolved = incidents.filter(i => i.resolution_result === 'resolved');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Food Safety Incident Records"
        description="Permanent legal audit trail of all CCP failures and corrective actions"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="border-l-4 border-red-500">
            <CardContent className="pt-4">
              <p className="text-xs text-slate-500 mb-1">Total Incidents</p>
              <p className="text-3xl font-bold text-slate-900">{incidents.length}</p>
              <p className="text-xs text-slate-400 mt-1">Permanent records</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="border-l-4 border-red-600">
            <CardContent className="pt-4">
              <p className="text-xs text-slate-500 mb-1">Critical</p>
              <p className="text-3xl font-bold text-red-600">{critical.length}</p>
              <p className="text-xs text-slate-400 mt-1">Immediate action</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Card className="border-l-4 border-amber-500">
            <CardContent className="pt-4">
              <p className="text-xs text-slate-500 mb-1">Major</p>
              <p className="text-3xl font-bold text-amber-600">{major.length}</p>
              <p className="text-xs text-slate-400 mt-1">Requires review</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <Card className="border-l-4 border-emerald-500">
            <CardContent className="pt-4">
              <p className="text-xs text-slate-500 mb-1">Resolved</p>
              <p className="text-3xl font-bold text-emerald-600">{resolved.length}</p>
              <p className="text-xs text-slate-400 mt-1">Corrective action taken</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            All Incident Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
              <p className="text-slate-500">No incidents recorded</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedIncident(incident)}
                  className="cursor-pointer"
                >
                  <Card className="hover:shadow-lg transition-all hover:border-slate-400">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-slate-900">{incident.ccp_name}</p>
                          <p className="text-xs text-slate-500">{format(new Date(incident.incident_time), 'PPP HH:mm')}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Badge className={
                            incident.incident_severity === 'critical' ? 'bg-red-600' :
                            incident.incident_severity === 'major' ? 'bg-amber-600' :
                            'bg-blue-600'
                          }>
                            {incident.incident_severity.toUpperCase()}
                          </Badge>
                          <Badge className={
                            incident.resolution_result === 'resolved' ? 'bg-emerald-500' :
                            incident.resolution_result === 'escalated' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }>
                            {incident.resolution_result.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500 text-xs">Failure Value</p>
                          <p className="font-semibold">{incident.failure_value}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Critical Limit</p>
                          <p className="font-semibold">{incident.critical_limit}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Detected By</p>
                          <p className="font-semibold text-slate-700">{incident.detected_by_name}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incident Detail Modal */}
      <Dialog open={!!selectedIncident} onOpenChange={(open) => !open && setSelectedIncident(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-600" />
              Incident Record (PERMANENT)
            </DialogTitle>
          </DialogHeader>

          {selectedIncident && (
            <div className="space-y-6">
              {/* Incident Details */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Incident Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">CCP Name</p>
                    <p className="font-semibold">{selectedIncident.ccp_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Date & Time</p>
                    <p className="font-semibold">{format(new Date(selectedIncident.incident_time), 'PPP HH:mm')}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Failure Value</p>
                    <p className="font-bold text-red-600">{selectedIncident.failure_value}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Critical Limit</p>
                    <p className="font-semibold">{selectedIncident.critical_limit}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Severity</p>
                    <Badge className={
                      selectedIncident.incident_severity === 'critical' ? 'bg-red-600' :
                      selectedIncident.incident_severity === 'major' ? 'bg-amber-600' :
                      'bg-blue-600'
                    }>
                      {selectedIncident.incident_severity.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-slate-500">Blocked Items</p>
                    <p className="font-semibold text-slate-700">
                      {selectedIncident.blocked_menu_items?.length || 0} items
                    </p>
                  </div>
                </div>
              </div>

              {/* Detection */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-bold text-slate-900 mb-3">Detected By</h4>
                <div className="text-sm space-y-1">
                  <p><span className="text-slate-600">Name:</span> <span className="font-semibold">{selectedIncident.detected_by_name}</span></p>
                  <p><span className="text-slate-600">Email:</span> <span className="font-semibold">{selectedIncident.detected_by_email}</span></p>
                </div>
              </div>

              {/* Corrective Action */}
              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Corrective Action
                </h4>
                <div className="text-sm space-y-2">
                  <p><span className="text-slate-600">Type:</span> <span className="font-semibold">{selectedIncident.corrective_action_type}</span></p>
                  <p><span className="text-slate-600">Description:</span> <span className="font-semibold">{selectedIncident.corrective_action_description}</span></p>
                  <p><span className="text-slate-600">Time:</span> <span className="font-semibold">{format(new Date(selectedIncident.action_time), 'PPP HH:mm')}</span></p>
                  <p><span className="text-slate-600">Result:</span> 
                    <Badge className={
                      selectedIncident.resolution_result === 'resolved' ? 'bg-emerald-500' :
                      selectedIncident.resolution_result === 'escalated' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }>
                      {selectedIncident.resolution_result.toUpperCase()}
                    </Badge>
                  </p>
                </div>
              </div>

              {/* Manager Notes Section */}
              {user?.role === 'manager' || user?.role === 'owner' || user?.role === 'admin' ? (
                <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-bold text-slate-900">📋 Manager Notes (Audit Only)</h4>
                  {selectedIncident.manager_notes ? (
                    <div>
                      <p className="text-sm text-slate-700 bg-white p-3 rounded border-l-2 border-purple-500 mb-3">
                        "{selectedIncident.manager_notes}"
                      </p>
                      <p className="text-xs text-slate-500">
                        Added by {selectedIncident.manager_notes_by_email} on {format(new Date(selectedIncident.manager_notes_time), 'PPP HH:mm')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">No notes yet</p>
                  )}
                  <textarea
                    className="w-full p-3 border rounded text-sm"
                    placeholder="Add manager notes for audit trail..."
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                    rows="3"
                  />
                  <Button
                    onClick={handleAddNotes}
                    disabled={!managerNotes.trim() || saving}
                    className="w-full"
                  >
                    {saving ? 'Saving...' : 'Add Notes to Record'}
                  </Button>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Manager notes only visible to management</p>
                </div>
              )}

              {/* Legal Hold Notice */}
              <div className="bg-red-50 border-2 border-red-300 p-4 rounded-lg">
                <p className="text-sm font-bold text-red-900 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  PERMANENT LEGAL RECORD
                </p>
                <p className="text-xs text-red-700 mt-1">
                  This incident record cannot be deleted. It serves as a permanent audit trail for regulatory compliance and food safety investigations.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
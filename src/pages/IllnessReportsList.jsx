import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { AlertCircle, Edit, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import IllnessReportingForm from '@/components/hygiene/IllnessReportingForm';

export default function IllnessReportsList() {
  const [user, setUser] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: illnessReports = [] } = useQuery({
    queryKey: ['illnessReports'],
    queryFn: () => base44.entities.IllnessReport.list('-report_date', 50),
    enabled: !!user
  });

  const handleEdit = (report) => {
    setEditingReport(report);
    setShowEditDialog(true);
  };

  const getStatusBadge = (report) => {
    if (report.status === 'cleared') {
      return <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3 mr-1" /> Cleared</Badge>;
    }
    if (report.status === 'reviewed') {
      return <Badge className="bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" /> Reviewed</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
  };

  const getResponseBadge = (response) => {
    const badges = {
      'approved_work': <Badge className="bg-green-600 text-white">✓ Clear to Work</Badge>,
      'approved_alternative': <Badge className="bg-blue-600 text-white">Alternative Duties</Badge>,
      'go_home': <Badge className="bg-red-600 text-white">Sent Home</Badge>,
      'pending': <Badge variant="outline">Pending Decision</Badge>
    };
    return badges[response] || badges['pending'];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Illness Reports</h1>
          <p className="text-lg text-slate-600">Manage staff illness notifications and clearances</p>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {illnessReports.length === 0 ? (
            <Card className="border-2 border-slate-200">
              <CardContent className="pt-8 pb-8 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <p className="text-lg text-slate-600">No illness reports on file</p>
                <p className="text-sm text-slate-500 mt-2">All staff are cleared to work</p>
              </CardContent>
            </Card>
          ) : (
            illnessReports.map((report, idx) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-2 border-slate-200 hover:border-red-300 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-3 mb-2">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          {report.staff_name}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {getStatusBadge(report)}
                          {report.manager_response && getResponseBadge(report.manager_response)}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(report)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Report Date</p>
                        <p className="text-sm text-slate-800">
                          {report.report_date ? format(new Date(report.report_date), 'd MMM yyyy') : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Email</p>
                        <p className="text-sm text-slate-800">{report.staff_email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Symptoms</p>
                        <p className="text-sm text-slate-800">
                          {report.symptoms?.join(', ') || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Symptoms Started</p>
                        <p className="text-sm text-slate-800">
                          {report.date_symptoms_started ? format(new Date(report.date_symptoms_started), 'd MMM yyyy') : '-'}
                        </p>
                      </div>
                    </div>

                    {report.manager_notes && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-700 uppercase font-semibold mb-1">Manager Notes</p>
                        <p className="text-sm text-slate-800">{report.manager_notes}</p>
                      </div>
                    )}

                    {report.clearance_date && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <p className="text-xs text-emerald-700 uppercase font-semibold mb-1">Cleared to Return</p>
                        <p className="text-sm text-slate-800">
                          {format(new Date(report.clearance_date), 'd MMM yyyy')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Illness Report</DialogTitle>
          </DialogHeader>
          {user && editingReport && (
            <IllnessReportingForm
              user={user}
              existingReport={editingReport}
              onSuccess={() => {
                queryClient.invalidateQueries(['illnessReports']);
                setShowEditDialog(false);
                setEditingReport(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Clock,
  AlertTriangle,
  Package,
  Wrench,
  ClipboardList,
  Users,
  TrendingUp,
  Plus,
  Eye,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ShiftHandoverReports from '@/components/operations/ShiftHandoverReports';
import { format } from 'date-fns';

export default function ShiftHandovers() {
  const [user, setUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [viewHandover, setViewHandover] = useState(null);
  const [formData, setFormData] = useState({
    shift_date: format(new Date(), 'yyyy-MM-dd'),
    shift_type: 'morning',
    stock_issues: '',
    equipment_issues: '',
    sales_notes: '',
    staff_notes: '',
    general_notes: '',
    pending_tasks: []
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: handovers = [], isLoading } = useQuery({
    queryKey: ['shiftHandovers'],
    queryFn: () => base44.entities.ShiftHandover.list('-created_date', 20),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ShiftHandover.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shiftHandovers']);
      setShowDialog(false);
      setFormData({
        shift_date: format(new Date(), 'yyyy-MM-dd'),
        shift_type: 'morning',
        stock_issues: '',
        equipment_issues: '',
        sales_notes: '',
        staff_notes: '',
        general_notes: '',
        pending_tasks: []
      });
    }
  });

  const acknowledgeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ShiftHandover.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['shiftHandovers'])
  });

  const handleSubmit = () => {
    createMutation.mutate({
      ...formData,
      handover_from: user?.email,
      handover_from_name: user?.full_name || user?.email
    });
  };

  const handleAcknowledge = (handover) => {
    acknowledgeMutation.mutate({
      id: handover.id,
      data: {
        ...handover,
        acknowledged_by: user?.email,
        acknowledged_at: new Date().toISOString()
      }
    });
  };

  const canEdit = ['manager', 'owner', 'admin'].includes(user?.role);

  if (isLoading) return <LoadingSpinner message="Loading handovers..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shift Handovers"
        description="Communication between shifts"
        action={canEdit ? () => setShowDialog(true) : undefined}
        actionLabel="Create Handover"
      />

      {/* Tabs for Recent vs Reports */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="recent">Recent Handovers</TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          {/* Recent Handovers */}
      <div className="space-y-4">
        {handovers.map((handover, idx) => {
          const isAcknowledged = !!handover.acknowledged_by;
          const needsAttention = !isAcknowledged && (handover.stock_issues || handover.equipment_issues);

          return (
            <motion.div
              key={handover.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={needsAttention ? 'border-amber-300 bg-amber-50' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {handover.shift_type?.toUpperCase()} Shift
                      </CardTitle>
                      <p className="text-sm text-slate-500">
                        {format(new Date(handover.shift_date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAcknowledged ? (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Acknowledged
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700">
                          Pending
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewHandover(handover)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">From:</p>
                      <p className="text-sm text-slate-600">{handover.handover_from_name}</p>
                    </div>
                    {handover.handover_to_name && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">To:</p>
                        <p className="text-sm text-slate-600">{handover.handover_to_name}</p>
                      </div>
                    )}
                  </div>

                  {/* Quick Preview */}
                  <div className="mt-4 space-y-2">
                    {handover.stock_issues && (
                      <div className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                        <span className="text-slate-600 line-clamp-2">{handover.stock_issues}</span>
                      </div>
                    )}
                    {handover.equipment_issues && (
                      <div className="flex items-start gap-2 text-sm">
                        <Wrench className="w-4 h-4 text-red-600 mt-0.5" />
                        <span className="text-slate-600 line-clamp-2">{handover.equipment_issues}</span>
                      </div>
                    )}
                  </div>

                  {!isAcknowledged && canEdit && (
                    <Button
                      size="sm"
                      onClick={() => handleAcknowledge(handover)}
                      className="mt-4 w-full bg-emerald-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Acknowledge Handover
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

          {handovers.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No shift handovers yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports">
          <ShiftHandoverReports handovers={handovers} />
        </TabsContent>
      </Tabs>

      {/* Create Handover Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Shift Handover</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={formData.shift_date}
                  onChange={(e) => setFormData({...formData, shift_date: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Shift</label>
                <Select value={formData.shift_type} onValueChange={(v) => setFormData({...formData, shift_type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Package className="w-4 h-4" />
                Stock Issues
              </label>
              <Textarea
                value={formData.stock_issues}
                onChange={(e) => setFormData({...formData, stock_issues: e.target.value})}
                placeholder="Any stock shortages or issues..."
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Equipment Issues
              </label>
              <Textarea
                value={formData.equipment_issues}
                onChange={(e) => setFormData({...formData, equipment_issues: e.target.value})}
                placeholder="Equipment problems or maintenance needed..."
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Sales Notes
              </label>
              <Textarea
                value={formData.sales_notes}
                onChange={(e) => setFormData({...formData, sales_notes: e.target.value})}
                placeholder="Sales performance, busy periods, customer feedback..."
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Staff Notes
              </label>
              <Textarea
                value={formData.staff_notes}
                onChange={(e) => setFormData({...formData, staff_notes: e.target.value})}
                placeholder="Staff performance, issues, or recognition..."
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                General Notes
              </label>
              <Textarea
                value={formData.general_notes}
                onChange={(e) => setFormData({...formData, general_notes: e.target.value})}
                placeholder="Any other important information..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="bg-emerald-600">
                Create Handover
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Handover Dialog */}
      <Dialog open={!!viewHandover} onOpenChange={() => setViewHandover(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewHandover && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {viewHandover.shift_type?.toUpperCase()} Shift Handover
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Date</p>
                    <p className="text-sm">{format(new Date(viewHandover.shift_date), 'MMMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">From</p>
                    <p className="text-sm">{viewHandover.handover_from_name}</p>
                  </div>
                </div>

                {viewHandover.stock_issues && (
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Stock Issues
                      </h4>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{viewHandover.stock_issues}</p>
                    </CardContent>
                  </Card>
                )}

                {viewHandover.equipment_issues && (
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        Equipment Issues
                      </h4>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{viewHandover.equipment_issues}</p>
                    </CardContent>
                  </Card>
                )}

                {viewHandover.sales_notes && (
                  <Card>
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Sales Notes
                      </h4>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{viewHandover.sales_notes}</p>
                    </CardContent>
                  </Card>
                )}

                {viewHandover.staff_notes && (
                  <Card>
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Staff Notes
                      </h4>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{viewHandover.staff_notes}</p>
                    </CardContent>
                  </Card>
                )}

                {viewHandover.general_notes && (
                  <Card>
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-2">General Notes</h4>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{viewHandover.general_notes}</p>
                    </CardContent>
                  </Card>
                )}

                {viewHandover.acknowledged_by && (
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <p className="text-sm text-emerald-700">
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Acknowledged on {format(new Date(viewHandover.acknowledged_at), 'PPpp')}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
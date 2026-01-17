import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  GitPullRequest,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { format } from 'date-fns';

export default function ChangeRequests() {
  const [user, setUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  // Form state
  const [formData, setFormData] = useState({
    module_affected: '',
    change_type: '',
    reason: '',
    priority: 'medium',
    impact_assessment: '',
    change_details: {}
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

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['changeRequests'],
    queryFn: () => base44.entities.ChangeRequest.list('-requested_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ChangeRequest.create({
      ...data,
      requested_by: user?.email,
      requested_by_name: user?.full_name,
      requested_date: new Date().toISOString(),
      request_code: `CHG-${Date.now().toString().slice(-6)}`
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['changeRequests']);
      setShowCreateDialog(false);
      resetForm();
    }
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }) => base44.entities.ChangeRequest.update(id, {
      status: 'approved',
      approved_by: user?.email,
      approved_by_name: user?.full_name,
      approval_date: new Date().toISOString(),
      implementation_notes: notes
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['changeRequests']);
      setShowReviewDialog(false);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => base44.entities.ChangeRequest.update(id, {
      status: 'rejected',
      approved_by: user?.email,
      approved_by_name: user?.full_name,
      approval_date: new Date().toISOString(),
      rejection_reason: reason
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['changeRequests']);
      setShowReviewDialog(false);
    }
  });

  const resetForm = () => {
    setFormData({
      module_affected: '',
      change_type: '',
      reason: '',
      priority: 'medium',
      impact_assessment: '',
      change_details: {}
    });
  };

  const handleSubmitRequest = () => {
    createMutation.mutate(formData);
  };

  const pending = requests.filter(r => r.status === 'pending');
  const approved = requests.filter(r => r.status === 'approved');
  const rejected = requests.filter(r => r.status === 'rejected');
  const implemented = requests.filter(r => r.status === 'implemented');

  const isAdmin = ['admin', 'owner', 'manager'].includes(user?.role);

  if (isLoading) return <LoadingSpinner message="Loading change requests..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Change Requests"
        description={`${pending.length} pending • ${approved.length} approved • ${rejected.length} rejected`}
      >
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-orange-600 to-amber-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Change Request
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pending.length}</p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approved.length}</p>
                <p className="text-xs text-slate-500">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejected.length}</p>
                <p className="text-xs text-slate-500">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <GitPullRequest className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{implemented.length}</p>
                <p className="text-xs text-slate-500">Implemented</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
          <TabsTrigger value="implemented">Implemented ({implemented.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pending.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No pending requests"
              description="All change requests have been reviewed."
            />
          ) : (
            pending.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                isAdmin={isAdmin}
                onReview={(req) => { setSelectedRequest(req); setShowReviewDialog(true); }}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-4">
          {approved.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No approved requests"
              description="Approved requests will appear here."
            />
          ) : (
            approved.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-4">
          {rejected.length === 0 ? (
            <EmptyState
              icon={XCircle}
              title="No rejected requests"
              description="Rejected requests will appear here."
            />
          ) : (
            rejected.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          )}
        </TabsContent>

        <TabsContent value="implemented" className="space-y-4 mt-4">
          {implemented.length === 0 ? (
            <EmptyState
              icon={GitPullRequest}
              title="No implemented requests"
              description="Implemented changes will appear here."
            />
          ) : (
            implemented.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Change Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Module Affected</label>
              <Select value={formData.module_affected} onValueChange={(v) => setFormData({...formData, module_affected: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Menu_v1">Menu v1</SelectItem>
                  <SelectItem value="Recipe_Engine_v1">Recipe Engine v1</SelectItem>
                  <SelectItem value="Ingredient_Master_v1">Ingredient Master v1</SelectItem>
                  <SelectItem value="Inventory_Engine_v1">Inventory Engine v1</SelectItem>
                  <SelectItem value="SOP_Library_v1">SOP Library v1</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Change Type</label>
              <Select value={formData.change_type} onValueChange={(v) => setFormData({...formData, change_type: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create">Create New</SelectItem>
                  <SelectItem value="update">Update Existing</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="bulk_update">Bulk Update</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Reason for Change</label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="Explain why this change is needed..."
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Impact Assessment</label>
              <Textarea
                value={formData.impact_assessment}
                onChange={(e) => setFormData({...formData, impact_assessment: e.target.value})}
                placeholder="How will this affect operations?"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button
                onClick={handleSubmitRequest}
                disabled={!formData.module_affected || !formData.change_type || !formData.reason || createMutation.isPending}
                className="bg-gradient-to-r from-orange-600 to-amber-600"
              >
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      {selectedRequest && (
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Change Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <p><strong>Request Code:</strong> {selectedRequest.request_code}</p>
                <p><strong>Module:</strong> {selectedRequest.module_affected}</p>
                <p><strong>Type:</strong> {selectedRequest.change_type}</p>
                <p><strong>Priority:</strong> <Badge>{selectedRequest.priority}</Badge></p>
                <p><strong>Requested by:</strong> {selectedRequest.requested_by_name}</p>
                <p><strong>Date:</strong> {format(new Date(selectedRequest.requested_date), 'PPP')}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Reason</label>
                <p className="text-sm text-slate-700 p-3 bg-slate-50 rounded-lg">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.impact_assessment && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Impact Assessment</label>
                  <p className="text-sm text-slate-700 p-3 bg-slate-50 rounded-lg">{selectedRequest.impact_assessment}</p>
                </div>
              )}

              {isAdmin && (
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => {
                      const reason = prompt('Rejection reason:');
                      if (reason) rejectMutation.mutate({ id: selectedRequest.id, reason });
                    }}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      const notes = prompt('Approval notes (optional):') || '';
                      approveMutation.mutate({ id: selectedRequest.id, notes });
                    }}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function RequestCard({ request, isAdmin, onReview }) {
  const statusConfig = {
    pending: { color: 'bg-amber-100 text-amber-700', icon: Clock },
    approved: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { color: 'bg-red-100 text-red-700', icon: XCircle },
    implemented: { color: 'bg-blue-100 text-blue-700', icon: GitPullRequest }
  };

  const config = statusConfig[request.status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="font-mono">{request.request_code}</Badge>
                <Badge className={config.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {request.status}
                </Badge>
                <Badge>{request.priority}</Badge>
              </div>
              <h3 className="font-semibold text-lg">{request.module_affected} - {request.change_type}</h3>
              <p className="text-sm text-slate-600 mt-1">{request.reason}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="text-xs text-slate-500">
              <p>Requested by {request.requested_by_name} • {format(new Date(request.requested_date), 'PP')}</p>
              {request.approved_by && (
                <p className="mt-1">Reviewed by {request.approved_by_name} • {format(new Date(request.approval_date), 'PP')}</p>
              )}
            </div>
            {isAdmin && onReview && request.status === 'pending' && (
              <Button size="sm" variant="outline" onClick={() => onReview(request)}>
                <Eye className="w-4 h-4 mr-2" />
                Review
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
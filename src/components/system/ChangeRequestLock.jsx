import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, CheckCircle, Shield, GitPullRequest, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ChangeRequestLock() {
  const { data: changeRequests = [] } = useQuery({
    queryKey: ['change-requests-count'],
    queryFn: () => base44.entities.ChangeRequest.list('-requested_date', 100),
    initialData: []
  });

  const pending = changeRequests.filter(r => r.status === 'pending');
  const approved = changeRequests.filter(r => r.status === 'approved');
  const rejected = changeRequests.filter(r => r.status === 'rejected');
  const implemented = changeRequests.filter(r => r.status === 'implemented');

  return (
    <Card className="border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-orange-600" />
            Change Request System - ACTIVE
          </CardTitle>
          <Badge className="bg-orange-600 text-white">
            <Shield className="w-3 h-3 mr-1" />
            Governance
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-white/60 rounded-lg border border-orange-200">
          <p className="text-sm text-slate-700 mb-3">
            <span className="font-bold text-orange-700">All critical module changes</span> require admin approval.
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-orange-600" />
              <span className="font-medium">No Silent Changes Allowed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-orange-600" />
              <span className="font-medium">Reason Must Be Provided</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-orange-600" />
              <span className="font-medium">Admin Approval Required</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-orange-600" />
              <span className="font-medium">Full Audit Trail Logged</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="p-3 bg-amber-100/50 rounded-lg">
            <p className="text-xs text-amber-700 font-medium mb-1">Pending</p>
            <p className="text-lg font-bold text-amber-900">{pending.length}</p>
          </div>
          <div className="p-3 bg-green-100/50 rounded-lg">
            <p className="text-xs text-green-700 font-medium mb-1">Approved</p>
            <p className="text-lg font-bold text-green-900">{approved.length}</p>
          </div>
          <div className="p-3 bg-red-100/50 rounded-lg">
            <p className="text-xs text-red-700 font-medium mb-1">Rejected</p>
            <p className="text-lg font-bold text-red-900">{rejected.length}</p>
          </div>
          <div className="p-3 bg-blue-100/50 rounded-lg">
            <p className="text-xs text-blue-700 font-medium mb-1">Implemented</p>
            <p className="text-lg font-bold text-blue-900">{implemented.length}</p>
          </div>
        </div>

        {pending.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-amber-900">Pending Approvals</p>
                <p className="text-amber-700">
                  {pending.length} change request(s) awaiting admin approval.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-slate-500 space-y-1 border-t pt-3">
          <p><strong>Activated:</strong> 2026-01-17</p>
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Status:</strong> Governance Active ✅</p>
          <p><strong>Protected Modules:</strong> Menu • Recipes • Ingredients • Inventory • SOPs</p>
          <p><strong>Total Requests:</strong> {changeRequests.length} requests logged</p>
        </div>
      </CardContent>
    </Card>
  );
}
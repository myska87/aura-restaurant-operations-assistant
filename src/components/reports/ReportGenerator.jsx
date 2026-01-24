import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Download, Loader } from 'lucide-react';

export default function ReportGenerator({
  open,
  onClose,
  reportType,
  dateRange,
  startDate,
  endDate,
  staffFilter,
  statusFilter,
  user,
  filteredData,
  onGenerate
}) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGenerate();
    } finally {
      setGenerating(false);
    }
  };

  const isSummary = reportType === 'summary';
  const dataCount = {
    checklists: filteredData?.completions?.length || 0,
    checkIns: filteredData?.checkIns?.length || 0,
    temps: filteredData?.temps?.length || 0,
    labels: filteredData?.labels?.length || 0,
    ccps: filteredData?.ccpChecks?.length || 0,
    handovers: filteredData?.handovers?.length || 0
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Generate {isSummary ? 'Summary' : 'Full Operations'} Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Alert */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">
                  {isSummary ? 'Summary Report' : 'Full Operations Report'}
                </p>
                <p>
                  {isSummary 
                    ? 'Generates a 2-3 page executive summary with compliance status snapshots.'
                    : 'Generates a comprehensive document with all operational data including checklists, hygiene, temperatures, labels, CCPs, handovers, and audit trail.'}
                </p>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-slate-700 mb-2">Report Period</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{startDate}</span>
              <span className="text-slate-500">to</span>
              <span className="font-medium">{endDate}</span>
              <Badge variant="outline" className="ml-auto">{dateRange}</Badge>
            </div>
          </div>

          {/* Filters Applied */}
          <div className="bg-slate-50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-semibold text-slate-700">Filters Applied</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-slate-600">Staff</p>
                <p className="font-medium capitalize">{staffFilter === 'all' ? 'All Staff' : 'Selected'}</p>
              </div>
              <div>
                <p className="text-slate-600">Status</p>
                <p className="font-medium capitalize">{statusFilter === 'all' ? 'All Status' : statusFilter}</p>
              </div>
              <div>
                <p className="text-slate-600">Type</p>
                <p className="font-medium capitalize">{isSummary ? 'Summary' : 'Full'}</p>
              </div>
            </div>
          </div>

          {/* Data Summary */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-slate-700 mb-3">Data to Include</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-slate-600">Checklists</span>
                <Badge className="bg-emerald-600">{dataCount.checklists}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-slate-600">Check-Ins</span>
                <Badge className="bg-blue-600">{dataCount.checkIns}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-slate-600">Temps Logged</span>
                <Badge className="bg-orange-600">{dataCount.temps}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-slate-600">Labels</span>
                <Badge className="bg-purple-600">{dataCount.labels}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-slate-600">CCP Checks</span>
                <Badge className="bg-red-600">{dataCount.ccps}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-slate-600">Handovers</span>
                <Badge className="bg-slate-600">{dataCount.handovers}</Badge>
              </div>
            </div>
            {!isSummary && (
              <p className="text-xs text-slate-600 mt-3">
                ✓ Staff check-ins
                ✓ Daily checklists
                ✓ Hygiene reports
                ✓ Temperature logs
                ✓ Labels
                ✓ CCP records
                ✓ Equipment issues
                ✓ Shift handovers
                ✓ Audit trail
              </p>
            )}
          </div>

          {/* Info */}
          <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 space-y-1">
            <p>✓ Report will be saved and available for download</p>
            <p>✓ PDF format suitable for inspectors and auditors</p>
            <p>✓ Can be re-downloaded anytime from reports history</p>
            {!isSummary && <p>✓ Includes complete chronological audit trail</p>}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {generating ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
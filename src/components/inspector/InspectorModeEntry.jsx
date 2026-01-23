import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, Clock, FileText, AlertCircle } from 'lucide-react';

export default function InspectorModeEntry({ open, onClose }) {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate(createPageUrl('InspectorMode'));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-6 h-6 text-red-600" />
            Open Inspector Mode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-800 mb-3">
              Read-Only Compliance View
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <Eye className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span>All data is read-only - no editing allowed</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span>Auto-logout after 20 minutes of inactivity</span>
              </li>
              <li className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span>All export actions are logged</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span>Designed for health inspector & audit reviews</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <p className="text-sm text-slate-600 mb-1">
              Perfect for EHO inspections
            </p>
            <p className="text-xs text-slate-500">
              Export complete audit packs in seconds
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStart}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <Shield className="w-4 h-4 mr-2" />
              Start Inspector Mode
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
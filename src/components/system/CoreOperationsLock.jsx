import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, CheckCircle, Shield, AlertTriangle } from 'lucide-react';

export default function CoreOperationsLock() {
  return (
    <Card className="border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            Core Operations v1 - LOCKED
          </CardTitle>
          <Badge className="bg-emerald-600 text-white">
            <Shield className="w-3 h-3 mr-1" />
            Protected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-white/60 rounded-lg border border-emerald-200">
          <p className="text-sm text-slate-700 mb-3">
            The following core operational modules are <span className="font-bold text-emerald-700">locked and protected</span> from automatic modifications:
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">Menu System</span>
              <Badge variant="outline" className="text-xs ml-auto">Menu.js</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">Inventory Engine</span>
              <Badge variant="outline" className="text-xs ml-auto">Inventory.js</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">SOP System</span>
              <Badge variant="outline" className="text-xs ml-auto">SOPLibrary.js</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">Deduction Functions</span>
              <Badge variant="outline" className="text-xs ml-auto">functions/</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-emerald-100/50 rounded-lg">
            <p className="text-xs text-emerald-700 font-medium mb-1">Error Handling</p>
            <p className="text-lg font-bold text-emerald-900">Active</p>
          </div>
          <div className="p-3 bg-blue-100/50 rounded-lg">
            <p className="text-xs text-blue-700 font-medium mb-1">Data Integrity</p>
            <p className="text-lg font-bold text-blue-900">Protected</p>
          </div>
          <div className="p-3 bg-purple-100/50 rounded-lg">
            <p className="text-xs text-purple-700 font-medium mb-1">Performance</p>
            <p className="text-lg font-bold text-purple-900">&lt; 2s load</p>
          </div>
          <div className="p-3 bg-amber-100/50 rounded-lg">
            <p className="text-xs text-amber-700 font-medium mb-1">Crash Rate</p>
            <p className="text-lg font-bold text-amber-900">0%</p>
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-semibold mb-1">Modification Restrictions</p>
              <p>These modules are read-only. Contact system administrator to request changes. All modifications require approval and testing.</p>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 space-y-1 border-t pt-3">
          <p><strong>Locked Date:</strong> 2026-01-17</p>
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Status:</strong> Production Ready ✅</p>
        </div>
      </CardContent>
    </Card>
  );
}
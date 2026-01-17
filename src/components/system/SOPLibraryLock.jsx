import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, CheckCircle, Shield, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function SOPLibraryLock() {
  const { data: sops = [] } = useQuery({
    queryKey: ['sops-count'],
    queryFn: () => base44.entities.SOP.list(),
    initialData: []
  });

  const activeSops = sops.filter(s => s.status === 'active');
  const approvedSops = sops.filter(s => s.approved_by);
  const sopsWithPhotos = sops.filter(s => s.photos && s.photos.length > 0);

  return (
    <Card className="border-teal-300 bg-gradient-to-br from-teal-50 to-cyan-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-teal-600" />
            SOP Library v1 - LOCKED (Read-Only)
          </CardTitle>
          <Badge className="bg-teal-600 text-white">
            <Shield className="w-3 h-3 mr-1" />
            Protected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-white/60 rounded-lg border border-teal-200">
          <p className="text-sm text-slate-700 mb-3">
            <span className="font-bold text-teal-700">{activeSops.length} active SOPs</span> providing step-by-step guidance.
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-teal-600" />
              <span className="font-medium">Read-Only for Staff</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-teal-600" />
              <span className="font-medium">Linked to Recipe Module</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-teal-600" />
              <span className="font-medium">No Stock or Cost Impact</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-teal-600" />
              <span className="font-medium">Hygiene & Allergen Integrated</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-teal-600" />
              <span className="font-medium">Opens from Menu & Recipe Views</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-teal-100/50 rounded-lg">
            <p className="text-xs text-teal-700 font-medium mb-1">Active SOPs</p>
            <p className="text-lg font-bold text-teal-900">{activeSops.length}</p>
          </div>
          <div className="p-3 bg-green-100/50 rounded-lg">
            <p className="text-xs text-green-700 font-medium mb-1">Approved</p>
            <p className="text-lg font-bold text-green-900">{approvedSops.length}</p>
          </div>
          <div className="p-3 bg-blue-100/50 rounded-lg">
            <p className="text-xs text-blue-700 font-medium mb-1">With Photos</p>
            <p className="text-lg font-bold text-blue-900">{sopsWithPhotos.length}</p>
          </div>
        </div>

        <div className="text-xs text-slate-500 space-y-1 border-t pt-3">
          <p><strong>Locked Date:</strong> 2026-01-17</p>
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Status:</strong> SOP Library Active ✅</p>
          <p><strong>Rules:</strong> Read-only • Recipe-linked • No stock impact • Hygiene/allergen notes included</p>
        </div>
      </CardContent>
    </Card>
  );
}
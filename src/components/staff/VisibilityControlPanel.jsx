import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Eye, EyeOff, Shield, Save } from 'lucide-react';

export default function VisibilityControlPanel({ staffId, staffName, user }) {
  const [controls, setControls] = useState({
    can_view_reports: false,
    can_view_labour_costs: false,
    can_view_performance_data: false,
    can_view_operations_logs: true,
    can_view_sensitive_metrics: false,
    can_view_staff_details: false
  });
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'admin' || user?.role === 'owner';
  const isManager = user?.role === 'manager' || isAdmin;

  const { data: existingControls } = useQuery({
    queryKey: ['visibilityControls', staffId],
    queryFn: async () => {
      const list = await base44.entities.StaffVisibilityControl.filter({ staff_id: staffId });
      return list[0];
    },
    enabled: !!staffId && isManager
  });

  useEffect(() => {
    if (existingControls) {
      setControls({
        can_view_reports: existingControls.can_view_reports || false,
        can_view_labour_costs: existingControls.can_view_labour_costs || false,
        can_view_performance_data: existingControls.can_view_performance_data || false,
        can_view_operations_logs: existingControls.can_view_operations_logs !== false,
        can_view_sensitive_metrics: existingControls.can_view_sensitive_metrics || false,
        can_view_staff_details: existingControls.can_view_staff_details || false
      });
      setNotes(existingControls.notes || '');
    }
  }, [existingControls]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (existingControls?.id) {
        return base44.entities.StaffVisibilityControl.update(existingControls.id, data);
      }
      return base44.entities.StaffVisibilityControl.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['visibilityControls']);
      base44.entities.StaffAuditLog.create({
        staff_id: staffId,
        staff_name: staffName,
        action_type: 'visibility_changed',
        action_description: 'Access permissions updated',
        performed_by_id: user?.id,
        performed_by_name: user?.full_name,
        performed_by_role: user?.role,
        action_date: new Date().toISOString()
      });
    }
  });

  const handleSave = () => {
    saveMutation.mutate({
      staff_id: staffId,
      staff_name: staffName,
      ...controls,
      updated_by_id: user?.id,
      updated_by_name: user?.full_name,
      notes
    });
  };

  if (!isAdmin) return null;

  const permissions = [
    { key: 'can_view_reports', label: 'Business Reports', description: 'Revenue, sales, analytics' },
    { key: 'can_view_labour_costs', label: 'Labour Cost Data', description: 'Staff costs and wages' },
    { key: 'can_view_performance_data', label: 'Team Performance', description: 'Performance metrics and reviews' },
    { key: 'can_view_operations_logs', label: 'Operations Logs', description: 'Daily check-ins, temperatures' },
    { key: 'can_view_sensitive_metrics', label: 'Sensitive Metrics', description: 'Profit margins, detailed costs' },
    { key: 'can_view_staff_details', label: 'Staff Directory', description: 'View other staff member details' }
  ];

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-600" />
          Access Control (Admin Only)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {permissions.map(perm => (
          <div key={perm.key} className="flex items-start justify-between p-3 bg-white rounded-lg border">
            <div className="flex-1">
              <Label className="font-semibold">{perm.label}</Label>
              <p className="text-xs text-slate-600">{perm.description}</p>
            </div>
            <Switch
              checked={controls[perm.key]}
              onCheckedChange={(checked) => setControls({ ...controls, [perm.key]: checked })}
            />
          </div>
        ))}

        <div>
          <Label>Access Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Why these permissions were granted..."
          />
        </div>

        <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Save Access Controls
        </Button>
      </CardContent>
    </Card>
  );
}
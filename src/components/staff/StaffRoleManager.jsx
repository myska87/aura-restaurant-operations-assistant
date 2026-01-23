import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, X, Briefcase } from 'lucide-react';

export default function StaffRoleManager({ staffId, staffName, user }) {
  const [showAddRole, setShowAddRole] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const queryClient = useQueryClient();

  const { data: allRoles = [] } = useQuery({
    queryKey: ['staffRoles'],
    queryFn: () => base44.entities.StaffRole.filter({ is_active: true })
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['staffRoleAssignments', staffId],
    queryFn: () => base44.entities.StaffRoleAssignment.filter({ staff_id: staffId }),
    enabled: !!staffId
  });

  const assignRoleMutation = useMutation({
    mutationFn: (data) => base44.entities.StaffRoleAssignment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['staffRoleAssignments']);
      base44.entities.StaffAuditLog.create({
        staff_id: staffId,
        staff_name: staffName,
        action_type: 'role_assigned',
        action_description: `Role assigned`,
        performed_by_id: user?.id,
        performed_by_name: user?.full_name,
        performed_by_role: user?.role,
        action_date: new Date().toISOString()
      });
      setShowAddRole(false);
      setSelectedRoleId('');
    }
  });

  const removeRoleMutation = useMutation({
    mutationFn: (assignmentId) => base44.entities.StaffRoleAssignment.delete(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['staffRoleAssignments']);
      base44.entities.StaffAuditLog.create({
        staff_id: staffId,
        staff_name: staffName,
        action_type: 'role_removed',
        action_description: `Role removed`,
        performed_by_id: user?.id,
        performed_by_name: user?.full_name,
        performed_by_role: user?.role,
        action_date: new Date().toISOString()
      });
    }
  });

  const handleAssignRole = () => {
    if (!selectedRoleId) return;
    const role = allRoles.find(r => r.id === selectedRoleId);
    assignRoleMutation.mutate({
      staff_id: staffId,
      staff_name: staffName,
      role_id: selectedRoleId,
      role_name: role.role_name,
      assigned_date: new Date().toISOString(),
      assigned_by_id: user?.id,
      assigned_by_name: user?.full_name,
      is_primary: isPrimary
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Assigned Roles
          </CardTitle>
          <Button size="sm" onClick={() => setShowAddRole(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Role
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-sm text-slate-500">No roles assigned</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assignments.map(assignment => (
              <Badge key={assignment.id} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 flex items-center gap-2">
                {assignment.role_name}
                {assignment.is_primary && <span className="text-xs">(Primary)</span>}
                <button onClick={() => removeRoleMutation.mutate(assignment.id)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showAddRole} onOpenChange={setShowAddRole}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Role</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.role_name} ({role.role_category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                id="is-primary"
              />
              <Label htmlFor="is-primary">Set as primary role</Label>
            </div>
            <Button onClick={handleAssignRole} disabled={!selectedRoleId} className="w-full">
              Assign Role
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
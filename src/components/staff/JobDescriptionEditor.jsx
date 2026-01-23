import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Save } from 'lucide-react';

export default function JobDescriptionEditor({ staffId, staffData, user }) {
  const [jobTitle, setJobTitle] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [expectations, setExpectations] = useState('');
  const [kpis, setKpis] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const isManager = ['admin', 'manager', 'owner'].includes(user?.role);

  useEffect(() => {
    if (staffData) {
      setJobTitle(staffData.job_title || '');
      setResponsibilities(staffData.job_responsibilities || '');
      setExpectations(staffData.job_expectations || '');
      setKpis(staffData.job_kpis || '');
    }
  }, [staffData]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Staff.update(staffId, data),
    onSuccess: () => {
      base44.entities.StaffAuditLog.create({
        staff_id: staffId,
        staff_name: staffData?.full_name,
        action_type: 'profile_updated',
        action_description: 'Job description updated',
        performed_by_id: user?.id,
        performed_by_name: user?.full_name,
        performed_by_role: user?.role,
        action_date: new Date().toISOString()
      });
      setIsEditing(false);
    }
  });

  const handleSave = () => {
    updateMutation.mutate({
      job_title: jobTitle,
      job_responsibilities: responsibilities,
      job_expectations: expectations,
      job_kpis: kpis
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Job Description
          </CardTitle>
          {isManager && (
            <Button size="sm" variant={isEditing ? 'default' : 'outline'} onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Job Title</Label>
          {isEditing ? (
            <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g., Senior Chef" />
          ) : (
            <p className="text-sm text-slate-700 mt-1">{jobTitle || 'Not set'}</p>
          )}
        </div>

        <div>
          <Label>Responsibilities & Duties</Label>
          {isEditing ? (
            <Textarea value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} rows={4} placeholder="Key responsibilities..." />
          ) : (
            <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{responsibilities || 'Not set'}</p>
          )}
        </div>

        <div>
          <Label>Expectations</Label>
          {isEditing ? (
            <Textarea value={expectations} onChange={(e) => setExpectations(e.target.value)} rows={3} placeholder="What is expected..." />
          ) : (
            <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{expectations || 'Not set'}</p>
          )}
        </div>

        <div>
          <Label>KPIs (Optional)</Label>
          {isEditing ? (
            <Textarea value={kpis} onChange={(e) => setKpis(e.target.value)} rows={2} placeholder="Key performance indicators..." />
          ) : (
            <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{kpis || 'Not set'}</p>
          )}
        </div>

        {isEditing && (
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Save Job Description
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
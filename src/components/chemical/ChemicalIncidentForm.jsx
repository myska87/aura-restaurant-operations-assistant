import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChemicalIncidentForm({ chemical, onClose }) {
  const [formData, setFormData] = useState({
    chemical_id: chemical?.id || '',
    chemical_name: chemical?.product_name || '',
    incident_type: '',
    severity: 'low',
    description: '',
    staff_involved: [],
    action_taken: ''
  });

  const [staffInput, setStaffInput] = useState('');
  const queryClient = useQueryClient();

  const createIncidentMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.ChemicalIncident.create({
        ...data,
        incident_date: new Date().toISOString(),
        reported_by_id: user.id,
        reported_by_name: user.full_name
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      onClose?.();
    }
  });

  const handleAddStaff = () => {
    if (staffInput.trim()) {
      setFormData(prev => ({
        ...prev,
        staff_involved: [...prev.staff_involved, staffInput]
      }));
      setStaffInput('');
    }
  };

  const handleRemoveStaff = (name) => {
    setFormData(prev => ({
      ...prev,
      staff_involved: prev.staff_involved.filter(s => s !== name)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createIncidentMutation.mutate(formData);
  };

  return (
    <motion.form onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900">Report Incident</p>
            <p className="text-amber-800 text-xs">Document the incident details for safety compliance</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Incident Type *</Label>
          <Select value={formData.incident_type} onValueChange={(value) => setFormData({...formData, incident_type: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spill">Chemical Spill</SelectItem>
              <SelectItem value="exposure">Staff Exposure</SelectItem>
              <SelectItem value="storage_error">Storage Error</SelectItem>
              <SelectItem value="disposal_error">Disposal Error</SelectItem>
              <SelectItem value="labeling_issue">Labeling Issue</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Severity Level *</Label>
          <Select value={formData.severity} onValueChange={(value) => setFormData({...formData, severity: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description *</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Describe what happened..."
          required
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Staff Involved</Label>
        <div className="flex gap-2">
          <Input
            value={staffInput}
            onChange={(e) => setStaffInput(e.target.value)}
            placeholder="Enter name"
          />
          <Button type="button" variant="outline" onClick={handleAddStaff}>Add</Button>
        </div>
        {formData.staff_involved.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.staff_involved.map((name) => (
              <div key={name} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1">
                {name}
                <button
                  type="button"
                  onClick={() => handleRemoveStaff(name)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Action Taken</Label>
        <Textarea
          value={formData.action_taken}
          onChange={(e) => setFormData({...formData, action_taken: e.target.value})}
          placeholder="What action was taken to resolve this?"
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={createIncidentMutation.isPending}>
          {createIncidentMutation.isPending ? 'Reporting...' : 'Report Incident'}
        </Button>
      </div>
    </motion.form>
  );
}
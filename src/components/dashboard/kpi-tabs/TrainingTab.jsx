import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TrainingTab({ data, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label>Training Completion Rate (%)</Label>
        <Input
          type="number"
          step="0.1"
          max="100"
          value={data.training_completion_pct || ''}
          onChange={(e) => onChange('training_completion_pct', parseFloat(e.target.value) || 0)}
          placeholder="e.g., 85"
          className="text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label>Culture Score (Notes)</Label>
        <Input
          type="text"
          value={data.notes || ''}
          onChange={(e) => onChange('notes', e.target.value)}
          placeholder="e.g., Team morale high, 3 new certifications"
          className="text-lg"
        />
      </div>
    </div>
  );
}
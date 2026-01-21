import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OperationsTab({ data, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label>Staff Cost (£)</Label>
        <Input
          type="number"
          step="0.01"
          value={data.staff_cost || ''}
          onChange={(e) => onChange('staff_cost', parseFloat(e.target.value) || 0)}
          placeholder="e.g., 2,480"
          className="text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label>Ingredient Cost (£)</Label>
        <Input
          type="number"
          step="0.01"
          value={data.ingredient_cost || ''}
          onChange={(e) => onChange('ingredient_cost', parseFloat(e.target.value) || 0)}
          placeholder="e.g., 4,200"
          className="text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label>Profit (£)</Label>
        <Input
          type="number"
          step="0.01"
          value={data.profit || ''}
          onChange={(e) => onChange('profit', parseFloat(e.target.value) || 0)}
          placeholder="e.g., 6,730"
          className="text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label>Profit Margin (%)</Label>
        <Input
          type="number"
          step="0.1"
          max="100"
          value={data.profit_margin_pct || ''}
          onChange={(e) => onChange('profit_margin_pct', parseFloat(e.target.value) || 0)}
          placeholder="e.g., 28"
          className="text-lg"
        />
      </div>
    </div>
  );
}
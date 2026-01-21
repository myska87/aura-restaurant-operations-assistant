import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SalesTab({ data, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label>Revenue (£)</Label>
        <Input
          type="number"
          step="0.01"
          value={data.revenue || ''}
          onChange={(e) => onChange('revenue', parseFloat(e.target.value) || 0)}
          placeholder="e.g., 13,410"
          className="text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label>Avg Order Value (£)</Label>
        <Input
          type="number"
          step="0.01"
          value={data.avg_order_value || ''}
          onChange={(e) => onChange('avg_order_value', parseFloat(e.target.value) || 0)}
          placeholder="e.g., 37.56"
          className="text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label>Total Customers</Label>
        <Input
          type="number"
          value={data.total_customers || ''}
          onChange={(e) => onChange('total_customers', parseInt(e.target.value) || 0)}
          placeholder="e.g., 303"
          className="text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label>Returning Customers (%)</Label>
        <Input
          type="number"
          step="0.1"
          max="100"
          value={data.returning_customers_pct || ''}
          onChange={(e) => onChange('returning_customers_pct', parseFloat(e.target.value) || 0)}
          placeholder="e.g., 32"
          className="text-lg"
        />
      </div>
    </div>
  );
}
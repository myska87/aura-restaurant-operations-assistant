import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MarketingTab({ data, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label>Social Media Reach</Label>
        <Input
          type="number"
          value={data.marketing_reach || ''}
          onChange={(e) => onChange('marketing_reach', parseInt(e.target.value) || 0)}
          placeholder="e.g., 2,340"
          className="text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label>Engagement Rate (%)</Label>
        <Input
          type="number"
          step="0.1"
          max="100"
          value={data.engagement_pct || ''}
          onChange={(e) => onChange('engagement_pct', parseFloat(e.target.value) || 0)}
          placeholder="e.g., 5.7"
          className="text-lg"
        />
      </div>
    </div>
  );
}
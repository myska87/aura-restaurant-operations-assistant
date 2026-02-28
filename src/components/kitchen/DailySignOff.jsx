import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function DailySignOff({ openingBy, middayBy, closingBy, onSave, saving }) {
  return (
    <div className="rounded-lg border-2 border-slate-300 overflow-hidden">
      <div className="bg-slate-800 px-4 py-2">
        <span className="font-bold text-white text-sm">🧾 DAILY ACCOUNTABILITY SIGN-OFF</span>
      </div>
      <div className="bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {[
            { label: '🌅 Opening Checked By', value: openingBy.name, onChange: openingBy.onChange },
            { label: '☀️ Midday Checked By', value: middayBy.name, onChange: middayBy.onChange },
            { label: '🌙 Closing Checked By', value: closingBy.name, onChange: closingBy.onChange },
          ].map((field, i) => (
            <div key={i}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{field.label}</label>
              <Input
                placeholder="Name & time..."
                value={field.value}
                onChange={e => field.onChange(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={onSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Runsheet'}
          </Button>
        </div>
      </div>
    </div>
  );
}
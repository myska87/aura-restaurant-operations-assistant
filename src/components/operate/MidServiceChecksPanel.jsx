import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import QuickCheckForm from './QuickCheckForm';

const checks = [
  { type: 'temperature', label: '🌡️ Temperature', icon: '🌡️' },
  { type: 'hygiene', label: '🧼 Hygiene', icon: '🧼' },
  { type: 'cleaning', label: '🧹 Cleaning', icon: '🧹' },
  { type: 'allergen', label: '⚠️ Allergen', icon: '⚠️' }
];

export default function MidServiceChecksPanel({ user, shiftDate }) {
  const [showCheckForm, setShowCheckForm] = useState(null);

  // Fetch today's mid-service checks
  const { data: todayChecks = [] } = useQuery({
    queryKey: ['midServiceChecks', shiftDate],
    queryFn: () => base44.entities.MidServiceCheck.filter({ shift_date: shiftDate }),
    enabled: !!user
  });

  // Get latest check for each type
  const getLatestCheck = (type) => {
    const checks = todayChecks.filter(c => c.check_type === type);
    if (checks.length === 0) return null;
    return checks.sort((a, b) => new Date(b.check_time) - new Date(a.check_time))[0];
  };

  return (
    <>
      <Card className="border-2 border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              🚀 Mid-Service Mandatory Checks
            </h3>
            <p className="text-sm text-slate-700">
              Quick compliance confirmations during service — tap to confirm standards are being met
            </p>
          </div>

          {/* Check Buttons Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {checks.map((check) => {
              const latest = getLatestCheck(check.type);
              return (
                <div key={check.type} className="space-y-2">
                  <Button
                    onClick={() => setShowCheckForm(check.type)}
                    className="w-full h-auto py-3 flex flex-col items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 border-2 border-amber-300 hover:border-amber-400 shadow-sm"
                    variant="outline"
                  >
                    <span className="text-2xl">{check.icon}</span>
                    <span className="text-xs font-bold text-center leading-tight">{check.label}</span>
                  </Button>

                  {/* Last Checked Info */}
                  {latest ? (
                    <div className="text-center">
                      <Badge variant="outline" className="text-xs bg-emerald-50 border-emerald-300 text-emerald-700">
                        ✓ {format(new Date(latest.check_time), 'HH:mm')}
                      </Badge>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Not checked yet</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Check Forms */}
      {checks.map((check) => (
        <QuickCheckForm
          key={check.type}
          open={showCheckForm === check.type}
          onClose={() => setShowCheckForm(null)}
          checkType={check.type}
          user={user}
          shiftDate={shiftDate}
          onSuccess={() => setShowCheckForm(null)}
        />
      ))}
    </>
  );
}
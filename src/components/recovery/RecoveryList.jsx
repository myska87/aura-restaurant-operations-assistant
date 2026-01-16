import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Meh, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const issueTypeLabels = {
  wrong_item: 'Wrong Item',
  food_quality: 'Food Quality',
  long_wait: 'Long Wait',
  missing_item: 'Missing Item',
  temperature: 'Temperature',
  allergen_concern: 'Allergen Concern',
  service_attitude: 'Service Attitude',
  cleanliness: 'Cleanliness',
  other: 'Other'
};

const recoveryActionLabels = {
  remade: 'Remade',
  replaced: 'Replaced',
  refunded: 'Refunded',
  free_chai: 'Free Chai',
  free_dessert: 'Free Dessert',
  voucher: 'Voucher',
  discount: 'Discount',
  apology_only: 'Apology'
};

export default function RecoveryList({ recoveries }) {
  if (recoveries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No issues logged yet</p>
          <p className="text-sm text-slate-500">Great work maintaining excellent service!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {recoveries.map(recovery => {
        const OutcomeIcon = 
          recovery.guest_outcome === 'satisfied' ? CheckCircle :
          recovery.guest_outcome === 'neutral' ? Meh :
          XCircle;
        
        const outcomeColor = 
          recovery.guest_outcome === 'satisfied' ? 'text-emerald-600' :
          recovery.guest_outcome === 'neutral' ? 'text-amber-600' :
          'text-red-600';

        const outcomeBg = 
          recovery.guest_outcome === 'satisfied' ? 'bg-emerald-50 border-emerald-200' :
          recovery.guest_outcome === 'neutral' ? 'bg-amber-50 border-amber-200' :
          'bg-red-50 border-red-200';

        return (
          <Card key={recovery.id} className={`${outcomeBg}`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <OutcomeIcon className={`w-6 h-6 ${outcomeColor} flex-shrink-0 mt-1`} />
                
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-800">
                        {issueTypeLabels[recovery.issue_type]}
                      </h4>
                      {recovery.menu_item_name && (
                        <p className="text-sm text-slate-600">{recovery.menu_item_name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {format(new Date(recovery.issue_date), 'MMM d, HH:mm')}
                      </p>
                      {recovery.resolution_time_minutes && (
                        <p className="text-xs text-slate-500">
                          Resolved in {recovery.resolution_time_minutes}m
                        </p>
                      )}
                    </div>
                  </div>

                  {recovery.description && (
                    <p className="text-sm text-slate-700 mb-3">{recovery.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="outline" className="bg-white">
                      {recoveryActionLabels[recovery.recovery_action]}
                    </Badge>
                    {recovery.recovery_value > 0 && (
                      <Badge variant="outline" className="bg-white">
                        £{recovery.recovery_value.toFixed(2)}
                      </Badge>
                    )}
                    <Badge 
                      className={
                        recovery.guest_outcome === 'satisfied' ? 'bg-emerald-600' :
                        recovery.guest_outcome === 'neutral' ? 'bg-amber-600' :
                        'bg-red-600'
                      }
                    >
                      {recovery.guest_outcome === 'satisfied' ? '✅ Raving Fan' :
                       recovery.guest_outcome === 'neutral' ? '⚠️ Neutral' :
                       '❌ Lost Guest'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Handled by {recovery.staff_name}</span>
                    {recovery.incident_created && (
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                        Incident Created
                      </Badge>
                    )}
                  </div>

                  {recovery.notes && (
                    <p className="text-xs text-slate-600 mt-2 p-2 bg-white/50 rounded">
                      Note: {recovery.notes}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CCPEnforcement({ user, blockedItems, onBlockedItemsChange }) {
  const today = new Date().toISOString().split('T')[0];

  // Fetch all CCP checks for today
  const { data: todayChecks = [] } = useQuery({
    queryKey: ['ccpChecks', today],
    queryFn: () => base44.entities.CriticalControlPointCheck.filter({ check_date: today }),
    enabled: !!user
  });

  // Fetch all active CCPs
  const { data: activeCCPs = [] } = useQuery({
    queryKey: ['activeCCPs'],
    queryFn: () => base44.entities.CriticalControlPoint.filter({ is_active: true }),
    enabled: !!user
  });

  // Calculate blocked menu items from failed CCPs
  useEffect(() => {
    const blockedMenuItems = new Set();
    
    const failedCCPs = todayChecks.filter(check => check.status === 'fail');
    failedCCPs.forEach(failedCheck => {
      if (failedCheck.blocked_menu_items && Array.isArray(failedCheck.blocked_menu_items)) {
        failedCheck.blocked_menu_items.forEach(item => blockedMenuItems.add(item));
      }
    });

    if (onBlockedItemsChange) {
      onBlockedItemsChange(Array.from(blockedMenuItems));
    }
  }, [todayChecks, onBlockedItemsChange]);

  const failedChecks = todayChecks.filter(check => check.status === 'fail');
  const passedChecks = todayChecks.filter(check => check.status === 'pass');
  const pendingCCPs = activeCCPs.filter(ccp =>
    !todayChecks.some(check => check.ccp_id === ccp.id)
  );

  if (failedChecks.length === 0 && pendingCCPs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Failed CCPs Alert */}
      {failedChecks.length > 0 && (
        <Card className="bg-red-50 border-2 border-red-300">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-red-900 mb-2">🚨 CCP FAILURES - Menu Items Blocked</h4>
                <div className="space-y-2">
                  {failedChecks.map(check => (
                    <div key={check.id} className="bg-white rounded p-2 text-sm">
                      <p className="font-semibold text-red-700">{check.ccp_name}</p>
                      <p className="text-xs text-red-600">
                        Value: {check.recorded_value} &lt; {check.critical_limit}
                      </p>
                      {check.blocked_menu_items && check.blocked_menu_items.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1">
                          {check.blocked_menu_items.slice(0, 3).map(item => (
                            <Badge key={item} className="bg-red-500 text-xs">
                              <Lock className="w-2.5 h-2.5 mr-1" />
                              {item}
                            </Badge>
                          ))}
                          {check.blocked_menu_items.length > 3 && (
                            <Badge className="bg-red-600 text-xs">
                              +{check.blocked_menu_items.length - 3} more blocked
                            </Badge>
                          )}
                        </div>
                      )}
                      {check.corrective_actions_triggered && check.corrective_actions_triggered.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-red-200">
                          <p className="text-xs font-semibold text-red-700 mb-1">Corrective Actions:</p>
                          {check.corrective_actions_triggered.map((action, idx) => (
                            <p key={idx} className="text-xs text-red-600">
                              • {action.action} ({action.status})
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending CCPs Warning */}
      {pendingCCPs.length > 0 && (
        <Card className="bg-amber-50 border-2 border-amber-300">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-amber-900 mb-2">⚠️ Mandatory CCP Checks Pending</h4>
                <p className="text-sm text-amber-700 mb-2">
                  {pendingCCPs.length} Critical Control Point(s) must be checked before continuing operations.
                </p>
                <div className="flex gap-1 flex-wrap">
                  {pendingCCPs.map(ccp => (
                    <Badge key={ccp.id} variant="outline" className="border-amber-300 text-amber-700 bg-white text-xs">
                      {ccp.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CCP Status Summary */}
      {passedChecks.length > 0 && (
        <Card className="bg-emerald-50 border-emerald-300">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-emerald-700">
                ✓ {passedChecks.length} CCP check(s) passed
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
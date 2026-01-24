import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Shield, AlertTriangle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

/**
 * Calculate safety status based on CCP checks for a menu item
 * Green: All CCPs passed
 * Amber: Warning/approaching limit
 * Red: Any CCP failed - SERVING BLOCKED
 */
export function useSafetyStatus(menuItem) {
  const today = format(new Date(), 'yyyy-MM-dd');

  // Get active CCPs linked to this menu item
  const { data: linkedCCPs = [] } = useQuery({
    queryKey: ['linkedCCPs', menuItem?.id],
    queryFn: async () => {
      if (!menuItem?.id) return [];
      const allCCPs = await base44.entities.CriticalControlPoint.list('-created_date', 500);
      return allCCPs.filter(ccp => 
        ccp.linked_menu_items?.includes(menuItem.id) && ccp.is_active
      );
    },
    enabled: !!menuItem?.id
  });

  // Get today's CCP checks
  const { data: todayCCPChecks = [] } = useQuery({
    queryKey: ['ccpChecks', today],
    queryFn: () => base44.entities.CriticalControlPointCheck.filter({ 
      check_date: today 
    }, '-timestamp', 500),
    enabled: !!today
  });

  // Calculate status
  const status = useMemo(() => {
    if (linkedCCPs.length === 0) {
      return { status: 'safe', color: 'bg-emerald-100 text-emerald-700', icon: 'shield', label: 'Safe' };
    }

    // Get checks for linked CCPs
    const relevantChecks = todayCCPChecks.filter(check => 
      linkedCCPs.some(ccp => ccp.id === check.ccp_id)
    );

    if (relevantChecks.length === 0) {
      // No checks yet - warning
      return { status: 'pending', color: 'bg-amber-100 text-amber-700', icon: 'warning', label: 'Pending Checks' };
    }

    // Check if any failed
    const failedChecks = relevantChecks.filter(c => c.status === 'fail');
    if (failedChecks.length > 0) {
      return { status: 'blocked', color: 'bg-red-100 text-red-700', icon: 'alert', label: 'Serving Blocked' };
    }

    // All passed
    return { status: 'safe', color: 'bg-emerald-100 text-emerald-700', icon: 'shield', label: 'Safe' };
  }, [linkedCCPs, todayCCPChecks]);

  return status;
}

export default function MenuSafetyStatus({ menuItem, size = 'md', showLabel = true }) {
  const safetyStatus = useSafetyStatus(menuItem);

  const iconMap = {
    shield: Shield,
    warning: AlertTriangle,
    alert: AlertCircle
  };

  const Icon = iconMap[safetyStatus.icon];

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${safetyStatus.color} text-xs font-semibold`}>
        <Icon className="w-3 h-3" />
        {showLabel && safetyStatus.label}
      </div>
    );
  }

  return (
    <Badge className={`${safetyStatus.color} text-sm px-3 py-1 flex items-center gap-2`}>
      <Icon className="w-4 h-4" />
      {safetyStatus.label}
    </Badge>
  );
}
import React from 'react';
import { Lock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function MenuItemBlocker({ menuItemId, menuItemName, blockedItems, reason }) {
  const isBlocked = blockedItems && blockedItems.includes(menuItemId);

  if (!isBlocked) {
    return null;
  }

  return (
    <Card className="bg-red-50 border-2 border-red-400">
      <CardContent className="pt-3 pb-3">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-red-600" />
          <div className="flex-1">
            <p className="font-bold text-red-900 text-sm">Menu Item Blocked</p>
            <p className="text-xs text-red-700 mt-0.5">
              {menuItemName} cannot be served until failed CCP is resolved.
            </p>
            {reason && (
              <p className="text-xs text-red-600 mt-1">{reason}</p>
            )}
          </div>
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PageEmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          {Icon && <Icon className="w-16 h-16 mx-auto mb-4 text-slate-400" />}
          <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
          {description && <p className="text-slate-600 mb-6">{description}</p>}
          {actionLabel && onAction && (
            <Button onClick={onAction} className="bg-emerald-600 hover:bg-emerald-700">
              {actionLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
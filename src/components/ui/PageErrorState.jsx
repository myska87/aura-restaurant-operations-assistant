import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function PageErrorState({ error, onRetry }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full border-2 border-red-300">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load Data</h3>
          <p className="text-slate-600 mb-2">
            {error?.message || 'An unexpected error occurred while loading the page.'}
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Please try again or contact support if the issue persists.
          </p>
          {onRetry && (
            <Button 
              onClick={onRetry} 
              className="bg-red-600 hover:bg-red-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
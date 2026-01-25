import React from 'react';
import { Loader2 } from 'lucide-react';

export default function PageLoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-emerald-600 animate-spin" />
        <p className="text-slate-600 font-medium">{message}</p>
      </div>
    </div>
  );
}
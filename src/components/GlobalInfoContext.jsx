import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const GlobalInfoContext = createContext(null);

export function GlobalInfoProvider({ children }) {
  const { data: globalInfo, isLoading } = useQuery({
    queryKey: ['global-info'],
    queryFn: async () => {
      const results = await base44.entities.GlobalInfo.list('-created_date', 1);
      return results[0] || null;
    },
    refetchInterval: 60000 // Refresh every minute
  });

  return (
    <GlobalInfoContext.Provider value={{ globalInfo, isLoading }}>
      {children}
    </GlobalInfoContext.Provider>
  );
}

export function useGlobalInfo() {
  const context = useContext(GlobalInfoContext);
  if (!context) {
    throw new Error('useGlobalInfo must be used within GlobalInfoProvider');
  }
  return context;
}
import React, { createContext, useContext, useState, useEffect } from 'react';

const ModeContext = createContext();

export const MODES = {
  OPERATE: 'operate',
  TRAIN: 'train',
  MANAGE: 'manage'
};

export const MODE_CONFIG = {
  [MODES.OPERATE]: {
    label: 'Operate',
    color: 'bg-blue-600',
    description: 'Service Mode',
    allowedRoles: ['staff', 'manager', 'owner', 'admin'],
    homePage: 'OperateHome'
  },
  [MODES.TRAIN]: {
    label: 'Train',
    color: 'bg-amber-500',
    description: 'Learning Mode',
    allowedRoles: ['staff', 'manager', 'owner', 'admin'],
    homePage: 'TrainHome'
  },
  [MODES.MANAGE]: {
    label: 'Manage',
    color: 'bg-red-600',
    description: 'Control Mode',
    allowedRoles: ['manager', 'owner', 'admin'],
    homePage: 'ManageHome'
  }
};

export function ModeProvider({ children }) {
  const [currentMode, setCurrentMode] = useState(() => {
    return localStorage.getItem('aura_mode') || MODES.OPERATE;
  });

  useEffect(() => {
    localStorage.setItem('aura_mode', currentMode);
  }, [currentMode]);

  const canAccessMode = (mode, userRole) => {
    return MODE_CONFIG[mode]?.allowedRoles.includes(userRole);
  };

  return (
    <ModeContext.Provider value={{ currentMode, setCurrentMode, canAccessMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within ModeProvider');
  }
  return context;
}
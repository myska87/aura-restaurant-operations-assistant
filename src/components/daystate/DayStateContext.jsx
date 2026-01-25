import React, { createContext, useContext, useState } from 'react';

// Day State Constants
export const DAY_STATES = {
  NOT_STARTED: 'NOT_STARTED',
  OPENING: 'OPENING',
  OPEN: 'OPEN',
  CLOSING: 'CLOSING',
  CLOSED: 'CLOSED'
};

// Context
const DayStateContext = createContext();

// Provider
export function DayStateProvider({ children }) {
  const [dayState, setDayState] = useState(DAY_STATES.NOT_STARTED);

  return (
    <DayStateContext.Provider value={{ dayState, setDayState }}>
      {children}
    </DayStateContext.Provider>
  );
}

// Hook to use DayState
export function useDayState() {
  const context = useContext(DayStateContext);
  if (!context) {
    throw new Error('useDayState must be used within DayStateProvider');
  }
  return context;
}
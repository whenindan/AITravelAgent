'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TravelPreferences {
  destination: string;
  travelingFrom: string;
  startDate: string;
  endDate: string;
  travelers: number;
  totalBudget: string;
}

interface TravelContextType {
  travelPreferences: TravelPreferences;
  updateTravelPreferences: (preferences: Partial<TravelPreferences>) => void;
}

const defaultPreferences: TravelPreferences = {
  destination: '',
  travelingFrom: '',
  startDate: '',
  endDate: '',
  travelers: 0,
  totalBudget: '',
};

const TravelContext = createContext<TravelContextType | undefined>(undefined);

export function TravelProvider({ children }: { children: ReactNode }) {
  const [travelPreferences, setTravelPreferences] = useState<TravelPreferences>(defaultPreferences);

  const updateTravelPreferences = (preferences: Partial<TravelPreferences>) => {
    setTravelPreferences(prev => ({ ...prev, ...preferences }));
  };

  return (
    <TravelContext.Provider value={{ travelPreferences, updateTravelPreferences }}>
      {children}
    </TravelContext.Provider>
  );
}

export function useTravel() {
  const context = useContext(TravelContext);
  if (context === undefined) {
    throw new Error('useTravel must be used within a TravelProvider');
  }
  return context;
} 
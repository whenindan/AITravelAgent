'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Listing {
  title: string;
  price_text: string;
  rating: string;
  url: string;
  image_url?: string;
}

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
  selectedListings: Listing[];
  setSelectedListings: (listings: Listing[]) => void;
  fetchListingsWithImages: (destination: string, startDate: string) => Promise<Listing[]>;
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
  const [selectedListings, setSelectedListings] = useState<Listing[]>([]);

  const updateTravelPreferences = (preferences: Partial<TravelPreferences>) => {
    setTravelPreferences(prev => ({ ...prev, ...preferences }));
  };

  const fetchListingsWithImages = async (destination: string, startDate: string): Promise<Listing[]> => {
    try {
      const formattedDate = startDate.replace(/-/g, '');
      const response = await fetch(`/api/listings?destination=${encodeURIComponent(destination)}&date=${formattedDate}`);
      
      if (!response.ok) {
        console.error('Error fetching listings');
        return [];
      }
      
      const data = await response.json();
      
      // Process listings to ensure image URLs
      const listingsWithImages = data.map(listing => ({
        ...listing,
        image_url: listing.image_url || listing.thumbnail_url
      }));
      
      setSelectedListings(listingsWithImages);
      return listingsWithImages;
    } catch (error) {
      console.error('Error fetching listings:', error);
      return [];
    }
  };

  return (
    <TravelContext.Provider value={{ 
      travelPreferences, 
      updateTravelPreferences,
      selectedListings,
      setSelectedListings,
      fetchListingsWithImages
    }}>
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
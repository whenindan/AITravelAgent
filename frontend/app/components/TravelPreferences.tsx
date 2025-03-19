'use client';

import { useState } from 'react';
import { useTravel } from '../context/TravelContext';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface TravelPreferencesForm {
  destination: string;
  travelingFrom: string;
  startDate: string;
  endDate: string;
  totalBudget: string;
  travelers: string;
  interests: string[];
}

interface TravelPreferencesProps {
  closeModal?: () => void;
}

const INTEREST_OPTIONS = [
  'Beach',
  'Mountains',
  'Culture',
  'Food',
  'Adventure',
  'Relaxation',
  'Shopping',
  'Nightlife',
];

export default function TravelPreferences({ closeModal }: TravelPreferencesProps) {
  const { updateTravelPreferences, setSelectedListings } = useTravel();
  const [preferences, setPreferences] = useState<TravelPreferencesForm>({
    destination: '',
    travelingFrom: '',
    startDate: '',
    endDate: '',
    totalBudget: '',
    travelers: '',
    interests: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapingStatus, setScrapingStatus] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  const handleInterestToggle = (interest: string) => {
    setPreferences((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const selectDiverseListings = (listings: any[]): any[] => {
    if (!listings || listings.length === 0) return [];
    
    // Extract price from price_text and convert to number
    const listingsWithPrice = listings.map(listing => {
      const priceMatch = listing.price_text.match(/\$(\d+)/);
      const price = priceMatch ? parseInt(priceMatch[1], 10) : 0;
      return { ...listing, numericPrice: price };
    }).filter(listing => listing.numericPrice > 0);
    
    // Sort by price
    listingsWithPrice.sort((a, b) => a.numericPrice - b.numericPrice);
    
    const result = [];
    const totalListings = listingsWithPrice.length;
    
    if (totalListings <= 5) {
      return listingsWithPrice;
    }
    
    // Select listings at different price points
    for (let i = 0; i < 5; i++) {
      const index = Math.floor((i * (totalListings - 1)) / 4);
      result.push(listingsWithPrice[index]);
    }
    
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setScrapingStatus('');

    try {
      if (!preferences.destination || !preferences.travelingFrom || !preferences.startDate || !preferences.endDate || 
          !preferences.travelers || !preferences.totalBudget) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate total budget
      const totalBudget = parseFloat(preferences.totalBudget);
      if (isNaN(totalBudget) || totalBudget <= 0) {
        setError('Total budget must be a positive number');
        return;
      }

      setIsLoading(true);
  

      // Check if backend is running
      const healthCheckResponse = await fetch(`${API_URL}/health-check`);
      if (!healthCheckResponse.ok) {
        setScrapingStatus('Backend server is not responding properly. Please check server status.');
        return;
      }

      
      const response = await fetch(`${API_URL}/api/scrape-airbnb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({
          destination: preferences.destination,
          travelingFrom: preferences.travelingFrom,
          startDate: preferences.startDate,
          endDate: preferences.endDate,
          travelers: parseInt(preferences.travelers) || 1,
          totalBudget: preferences.totalBudget
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      
      if (data.success) {
        // Update the travel preferences in the context
        updateTravelPreferences({
          destination: preferences.destination,
          travelingFrom: preferences.travelingFrom,
          startDate: preferences.startDate,
          endDate: preferences.endDate,
          travelers: parseInt(preferences.travelers) || 1,
          totalBudget: preferences.totalBudget
        });
        
        // Select 5 diverse listings and store them in context
        const diverseListings = selectDiverseListings(data.listings.listings);
        setSelectedListings(diverseListings);
        
        // Close the modal if the function is provided
        if (closeModal) closeModal();
      } else {
        setError(data.error || 'An error occurred while processing your request');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Error connecting to the server. Please make sure the backend server is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#151515] rounded-lg p-6 border border-[#151515]">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-400 rounded">
            {error}
          </div>
        )}
        {scrapingStatus && (
          <div className="mb-4 p-3 bg-gray-800/50 border border-[#151515] text-gray-300 rounded flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {scrapingStatus}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Traveling From*
            </label>
            <Input
              type="text"
              value={preferences.travelingFrom}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  travelingFrom: e.target.value,
                }))
              }
              placeholder="Enter your departure city"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Destination*
            </label>
            <Input
              type="text"
              value={preferences.destination}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  destination: e.target.value,
                }))
              }
              placeholder="Where would you like to go?"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Total Budget for Trip ($)*
            </label>
            <Input
              type="text"
              value={preferences.totalBudget}
              onChange={(e) =>
                setPreferences((prev) => ({ ...prev, totalBudget: e.target.value }))
              }
              placeholder="Enter total budget (e.g., 2000)"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Number of Travelers*
            </label>
            <Input
              type="number"
              min="1"
              value={preferences.travelers}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  travelers: e.target.value,
                }))
              }
              placeholder="Enter number of travelers"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Start Date*
            </label>
            <Input
              type="date"
              value={preferences.startDate}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              End Date*
            </label>
            <Input
              type="date"
              value={preferences.endDate}
              onChange={(e) =>
                setPreferences((prev) => ({ ...prev, endDate: e.target.value }))
              }
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Interests (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => (
              <Button
                key={interest}
                type="button"
                onClick={() => handleInterestToggle(interest)}
                variant={preferences.interests.includes(interest) ? "default" : "outline"}
                size="sm"
                disabled={isLoading}
              >
                {interest}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-[#232323]">
          <div className="flex justify-center w-full">
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                "Update Preferences"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 
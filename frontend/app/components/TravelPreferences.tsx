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
}

interface TravelPreferencesProps {
  closeModal?: () => void;
}

export default function TravelPreferences({ closeModal }: TravelPreferencesProps) {
  const { updateTravelPreferences, setSelectedListings } = useTravel();
  const [preferences, setPreferences] = useState<TravelPreferencesForm>({
    destination: '',
    travelingFrom: '',
    startDate: '',
    endDate: '',
    totalBudget: '',
    travelers: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!preferences.destination || !preferences.travelingFrom || !preferences.startDate || 
        !preferences.endDate || !preferences.travelers || !preferences.totalBudget) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate budget
    const totalBudget = parseFloat(preferences.totalBudget);
    if (isNaN(totalBudget) || totalBudget <= 0) {
      setError('Total budget must be a positive number');
      return;
    }

    setIsLoading(true);

    try {
      // Health check
      const healthCheckResponse = await fetch(`${API_URL}/health-check`);
      if (!healthCheckResponse.ok) {
        throw new Error('Backend server is not responding');
      }

      // Scrape listings
      const response = await fetch(`${API_URL}/api/scrape-airbnb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        throw new Error('Failed to fetch listings');
      }

      const data = await response.json();
      
      if (data.success) {
        // Update preferences
        updateTravelPreferences({
          destination: preferences.destination,
          travelingFrom: preferences.travelingFrom,
          startDate: preferences.startDate,
          endDate: preferences.endDate,
          travelers: parseInt(preferences.travelers) || 1,
          totalBudget: preferences.totalBudget
        });
        
        // Set listings (take first 5)
        const listings = data.listings.listings || [];
        setSelectedListings(listings.slice(0, 5));
        
        closeModal?.();
      } else {
        setError(data.error || 'Failed to process request');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error connecting to server. Please check if the backend is running.');
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Traveling From*
            </label>
            <Input
              type="text"
              value={preferences.travelingFrom}
              onChange={(e) => setPreferences(prev => ({ ...prev, travelingFrom: e.target.value }))}
              placeholder="e.g., New York"
              className="w-full bg-[#232323] border-[#151515] text-white placeholder-gray-400"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Destination*
            </label>
            <Input
              type="text"
              value={preferences.destination}
              onChange={(e) => setPreferences(prev => ({ ...prev, destination: e.target.value }))}
              placeholder="e.g., Paris"
              className="w-full bg-[#232323] border-[#151515] text-white placeholder-gray-400"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Check-in Date*
            </label>
            <Input
              type="date"
              value={preferences.startDate}
              onChange={(e) => setPreferences(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full bg-[#232323] border-[#151515] text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Check-out Date*
            </label>
            <Input
              type="date"
              value={preferences.endDate}
              onChange={(e) => setPreferences(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full bg-[#232323] border-[#151515] text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Number of Travelers*
            </label>
            <Input
              type="number"
              value={preferences.travelers}
              onChange={(e) => setPreferences(prev => ({ ...prev, travelers: e.target.value }))}
              placeholder="1"
              min="1"
              className="w-full bg-[#232323] border-[#151515] text-white placeholder-gray-400"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Total Budget*
            </label>
            <Input
              type="number"
              value={preferences.totalBudget}
              onChange={(e) => setPreferences(prev => ({ ...prev, totalBudget: e.target.value }))}
              placeholder="1000"
              min="0"
              step="0.01"
              className="w-full bg-[#232323] border-[#151515] text-white placeholder-gray-400"
              required
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={closeModal}
            className="px-6 py-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2"
          >
            {isLoading ? 'Searching...' : 'Find Listings'}
          </Button>
        </div>
      </form>
    </div>
  );
} 
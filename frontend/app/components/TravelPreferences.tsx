'use client';

import { useState } from 'react';
import { useTravel } from '../context/TravelContext';

interface TravelPreferencesForm {
  destination: string;
  travelingFrom: string;
  startDate: string;
  endDate: string;
  totalBudget: string;
  travelers: string;
  interests: string[];
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

export default function TravelPreferences() {
  const { updateTravelPreferences } = useTravel();
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
      setScrapingStatus('Initializing scraper...');

      // Check if backend is running
      const healthCheckResponse = await fetch(`${API_URL}/health-check`);
      if (!healthCheckResponse.ok) {
        setScrapingStatus('Backend server is not responding properly. Please check server status.');
        return;
      }

      setScrapingStatus('Starting to scrape Airbnb listings...');
      
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
        
        setScrapingStatus(`Successfully scraped ${data.listings?.listings?.length || 0} listings!`);
        setTimeout(() => {
          alert(`Successfully scraped listings! Saved to: ${data.message}`);
          setScrapingStatus('');
        }, 2000);
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
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-black">Travel Preferences</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {scrapingStatus && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {scrapingStatus}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Traveling From*
            </label>
            <input
              type="text"
              value={preferences.travelingFrom}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  travelingFrom: e.target.value,
                }))
              }
              placeholder="Enter your departure city"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-500"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination*
            </label>
            <input
              type="text"
              value={preferences.destination}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  destination: e.target.value,
                }))
              }
              placeholder="Where would you like to go?"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-500"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Budget for Trip*
            </label>
            <input
              type="text"
              value={preferences.totalBudget}
              onChange={(e) =>
                setPreferences((prev) => ({ ...prev, totalBudget: e.target.value }))
              }
              placeholder="Enter total budget (e.g., 2000)"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-500"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Travelers*
            </label>
            <input
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
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date*
            </label>
            <input
              type="date"
              value={preferences.startDate}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date*
            </label>
            <input
              type="date"
              value={preferences.endDate}
              onChange={(e) =>
                setPreferences((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interests (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => handleInterestToggle(interest)}
                className={`px-4 py-2 rounded-full text-sm ${
                  preferences.interests.includes(interest)
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                disabled={isLoading}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className={`w-full py-3 rounded-lg transition-colors ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800'
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Update Preferences'}
        </button>
      </form>
    </div>
  );
} 
'use client';

import { useState } from 'react';

interface TravelPreferences {
  destination: string;
  startDate: string;
  endDate: string;
  budget: string;
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
  const [preferences, setPreferences] = useState<TravelPreferences>({
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    travelers: '',
    interests: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

    try {
      if (!preferences.destination || !preferences.startDate || !preferences.endDate || !preferences.budget || !preferences.travelers) {
        setError('Please fill in all required fields');
        return;
      }

      setIsLoading(true);

      // First check if the server is available
      try {
        await fetch(`${API_URL}/health-check`);
      } catch (error) {
        throw new Error('Backend server is not running. Please start the server and try again.');
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
          startDate: preferences.startDate,
          endDate: preferences.endDate,
          travelers: parseInt(preferences.travelers) || 1,
          budget: preferences.budget,
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
        alert(`Successfully scraped listings! Saved to: ${data.message}`);
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              Budget per night*
            </label>
            <input
              type="text"
              value={preferences.budget}
              onChange={(e) =>
                setPreferences((prev) => ({ ...prev, budget: e.target.value }))
              }
              placeholder="Enter amount (e.g., 200)"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-500"
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
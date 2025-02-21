'use client';

import { useState } from 'react';

interface TravelPreferences {
  destination: string;
  startDate: string;
  endDate: string;
  budget: string;
  travelers: number;
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
    travelers: 1,
    interests: [],
  });

  const handleInterestToggle = (interest: string) => {
    setPreferences((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle form submission
    console.log(preferences);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-black">Travel Preferences</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination
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
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget
            </label>
            <input
              type="text"
              value={preferences.budget}
              onChange={(e) =>
                setPreferences((prev) => ({ ...prev, budget: e.target.value }))
              }
              placeholder="Your budget"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
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
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={preferences.endDate}
              onChange={(e) =>
                setPreferences((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Travelers
          </label>
          <input
            type="number"
            min="1"
            value={preferences.travelers}
            onChange={(e) =>
              setPreferences((prev) => ({
                ...prev,
                travelers: parseInt(e.target.value),
              }))
            }
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interests
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
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Update Preferences
        </button>
      </form>
    </div>
  );
} 
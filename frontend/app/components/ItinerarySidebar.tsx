'use client';

import React, { useState, useEffect } from 'react';
import { useTravelPreferencesStore } from '../store/travel-preferences';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';

export const ItinerarySidebar: React.FC = () => {
  const store = useTravelPreferencesStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [customRequest, setCustomRequest] = useState('');

  useEffect(() => {
    if (store.showItinerary && !store.generatedItinerary) {
      generateItinerary();
    }
  }, [store.showItinerary, store.generatedItinerary]);

  const generateItinerary = async () => {
    setIsGenerating(true);
    
    try {
      // Prepare the preferences data for the API call
      const preferences = {
        destinations: store.destinations.map(d => d.name),
        vibes: store.vibes,
        customVibe: store.customVibe,
        climatePreference: store.climatePreference,
        budgetLevel: store.budgetLevel,
        customBudget: store.customBudget,
        tripLength: store.tripLength,
        travelPartySize: store.travelPartySize,
        isFlexibleDates: store.isFlexibleDates,
        travelDates: store.travelDates,
        mustDo: store.mustDo,
        avoid: store.avoid,
      };

      // Call the backend itinerary generation API
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/itinerary/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: preferences
        })
      });

      const data = await response.json();
      
      if (data.itinerary) {
        store.setGeneratedItinerary(data.itinerary);
      } else {
        // Fallback if API fails
        store.setGeneratedItinerary(generateFallbackItinerary());
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
      store.setGeneratedItinerary(generateFallbackItinerary());
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackItinerary = () => {
    const destinations = store.destinations.map(d => d.name).join(', ');
    const days = store.tripLength || 7;
    const people = store.travelPartySize;
    const budget = store.budgetLevel;
    
    return `# Your ${days}-Day ${destinations} Itinerary

## Trip Overview
- **Destinations:** ${destinations}
- **Duration:** ${days} days
- **Travelers:** ${people} ${people === 1 ? 'person' : 'people'}
- **Budget:** ${budget}${store.customBudget ? ` ($${store.customBudget})` : ''}

## Day-by-Day Breakdown

### Day 1: Arrival & Orientation
- **Morning:** Arrive at destination
- **Afternoon:** Check into accommodation and get oriented
- **Evening:** Welcome dinner at local restaurant

### Day 2: Cultural Exploration
- **Morning:** Visit main cultural attractions
- **Afternoon:** Explore local markets and neighborhoods
- **Evening:** Traditional dining experience

### Day 3: Adventure Activities
- **Morning:** Outdoor activities and adventures
- **Afternoon:** Continue exploration
- **Evening:** Relaxation and local nightlife

${Array.from({ length: Math.max(0, days - 3) }, (_, i) => `
### Day ${i + 4}: ${i % 2 === 0 ? 'Discovery' : 'Relaxation'}
- **Morning:** Explore new areas
- **Afternoon:** ${store.mustDo.length > 0 ? `Must-do activity: ${store.mustDo[0]}` : 'Free time'}
- **Evening:** Local cuisine and entertainment
`).join('')}

## Accommodation Recommendations
- Budget-friendly options near city center
- Mid-range hotels with good reviews
- Luxury resorts for special occasions

## Must-Do Activities
${store.mustDo.map(activity => `- ${activity}`).join('\n')}

## Food Recommendations
- Local specialties to try
- Popular restaurants and cafes
- Street food experiences

## Travel Tips
- Best time to visit attractions
- Transportation recommendations
- Cultural etiquette guidelines
- Safety considerations

*This itinerary can be customized based on your preferences and real-time availability.*`;
  };

  const handleCustomRequest = async () => {
    if (!customRequest.trim()) return;
    
    setIsGenerating(true);
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/itinerary/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentItinerary: store.generatedItinerary,
          updateRequest: customRequest
        })
      });

      const data = await response.json();
      
      if (data.itinerary) {
        store.setGeneratedItinerary(data.itinerary);
      }
    } catch (error) {
      console.error('Error updating itinerary:', error);
    } finally {
      setIsGenerating(false);
      setCustomRequest('');
    }
  };

  const handleCloseItinerary = () => {
    store.setShowItinerary(false);
  };

  const handleNewTrip = () => {
    store.resetPreferences();
    store.setShowItinerary(false);
  };

  if (!store.showItinerary) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 right-0 w-1/2 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xl font-bold">Your Travel Itinerary</h2>
        <div className="flex space-x-2">
          <Button onClick={handleNewTrip} variant="outline" size="sm">
            New Trip
          </Button>
          <Button onClick={handleCloseItinerary} variant="outline" size="sm">
            ×
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Trip Summary */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Trip Summary</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Destinations:</strong> {store.destinations.map(d => d.name).join(', ')}</p>
            <p><strong>Duration:</strong> {store.tripLength} days</p>
            <p><strong>Travelers:</strong> {store.travelPartySize} {store.travelPartySize === 1 ? 'person' : 'people'}</p>
            <p><strong>Budget:</strong> {store.budgetLevel}{store.customBudget ? ` ($${store.customBudget})` : ''}</p>
            {store.vibes.length > 0 && (
              <p><strong>Vibes:</strong> {store.vibes.join(', ')}</p>
            )}
          </div>
        </Card>

        {/* Itinerary Content */}
        <Card className="p-4">
          {isGenerating ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Generating your personalized itinerary...</p>
            </div>
          ) : store.generatedItinerary ? (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
                {store.generatedItinerary}
              </pre>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No itinerary generated yet.</p>
              <Button onClick={generateItinerary} className="mt-4">
                Generate Itinerary
              </Button>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button 
              onClick={() => handleCustomRequest()}
              disabled={isGenerating}
              className="w-full text-left justify-start"
              variant="outline"
            >
              🔄 Regenerate Itinerary
            </Button>
            <Button 
              onClick={() => setCustomRequest('Add more budget-friendly options')}
              disabled={isGenerating}
              className="w-full text-left justify-start"
              variant="outline"
            >
              💰 Add Budget Options
            </Button>
            <Button 
              onClick={() => setCustomRequest('Add more adventurous activities')}
              disabled={isGenerating}
              className="w-full text-left justify-start"
              variant="outline"
            >
              🏃 More Adventures
            </Button>
            <Button 
              onClick={() => setCustomRequest('Add more relaxing activities')}
              disabled={isGenerating}
              className="w-full text-left justify-start"
              variant="outline"
            >
              🧘 More Relaxation
            </Button>
          </div>
        </Card>

        {/* Custom Request */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Customize Your Itinerary</h3>
          <div className="space-y-3">
            <Input
              placeholder="What would you like to change? (e.g., 'Add more food experiences', 'Remove outdoor activities')"
              value={customRequest}
              onChange={(e) => setCustomRequest(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCustomRequest();
                }
              }}
            />
            <Button 
              onClick={handleCustomRequest}
              disabled={!customRequest.trim() || isGenerating}
              className="w-full"
            >
              {isGenerating ? 'Updating...' : 'Update Itinerary'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}; 
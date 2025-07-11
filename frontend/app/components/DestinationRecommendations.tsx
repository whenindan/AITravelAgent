'use client';

import React, { useState, useEffect } from 'react';
import { useTravelPreferencesStore } from '../store/travel-preferences';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { BubbleButton } from './ui/bubble-button';

interface DestinationRecommendation {
  name: string;
  description: string;
  matchingVibes: string[];
  climate: string;
  budgetFriendly: boolean;
  image: string;
}

export const DestinationRecommendations: React.FC<{
  onNext: () => void;
  onBack: () => void;
}> = ({ onNext, onBack }) => {
  const store = useTravelPreferencesStore();
  const [recommendations, setRecommendations] = useState<DestinationRecommendation[]>([]);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);

  useEffect(() => {
    // Generate recommendations based on user preferences
    const generateRecommendations = () => {
      const allDestinations: DestinationRecommendation[] = [
        {
          name: "Tokyo, Japan",
          description: "Perfect blend of tradition and modernity with amazing food scene",
          matchingVibes: ["Culture", "Foodie", "Adventure"],
          climate: "Mild",
          budgetFriendly: false,
          image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300&h=200&fit=crop"
        },
        {
          name: "Bali, Indonesia",
          description: "Tropical paradise with beautiful beaches and rich culture",
          matchingVibes: ["Relaxing", "Culture", "Romantic"],
          climate: "Warm",
          budgetFriendly: true,
          image: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=300&h=200&fit=crop"
        },
        {
          name: "Paris, France",
          description: "City of love with world-class museums and cuisine",
          matchingVibes: ["Romantic", "Culture", "Foodie"],
          climate: "Mild",
          budgetFriendly: false,
          image: "https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=300&h=200&fit=crop"
        },
        {
          name: "Costa Rica",
          description: "Adventure paradise with incredible wildlife and nature",
          matchingVibes: ["Adventure", "Relaxing"],
          climate: "Warm",
          budgetFriendly: true,
          image: "https://images.unsplash.com/photo-1516036754864-8b2e5b61e30d?w=300&h=200&fit=crop"
        },
        {
          name: "Iceland",
          description: "Dramatic landscapes with Northern Lights and unique culture",
          matchingVibes: ["Adventure", "Culture"],
          climate: "Cold",
          budgetFriendly: false,
          image: "https://images.unsplash.com/photo-1539066834-3d0c1b853b05?w=300&h=200&fit=crop"
        },
        {
          name: "Thailand",
          description: "Perfect combination of beaches, culture, and amazing street food",
          matchingVibes: ["Relaxing", "Culture", "Foodie", "Adventure"],
          climate: "Warm",
          budgetFriendly: true,
          image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop"
        },
        {
          name: "New Zealand",
          description: "Adventure capital with stunning landscapes and outdoor activities",
          matchingVibes: ["Adventure", "Relaxing"],
          climate: "Mild",
          budgetFriendly: false,
          image: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=300&h=200&fit=crop"
        },
        {
          name: "Portugal",
          description: "Charming coastal country with great food and warm people",
          matchingVibes: ["Relaxing", "Culture", "Foodie"],
          climate: "Warm",
          budgetFriendly: true,
          image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=300&h=200&fit=crop"
        },
        {
          name: "Morocco",
          description: "Exotic culture with vibrant markets and desert adventures",
          matchingVibes: ["Culture", "Adventure", "Foodie"],
          climate: "Warm",
          budgetFriendly: true,
          image: "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=300&h=200&fit=crop"
        },
        {
          name: "Swiss Alps",
          description: "Mountain paradise perfect for winter sports and scenic views",
          matchingVibes: ["Adventure", "Relaxing", "Romantic"],
          climate: "Cold",
          budgetFriendly: false,
          image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=300&h=200&fit=crop"
        }
      ];

      // Filter and score destinations based on user preferences
      const scored = allDestinations.map(dest => {
        let score = 0;
        
        // Score based on vibe match
        const vibeMatches = dest.matchingVibes.filter(vibe => 
          store.vibes.includes(vibe as any)
        ).length;
        score += vibeMatches * 3;
        
        // Score based on climate preference
        if (store.climatePreference === "Warm" && dest.climate === "Warm") score += 2;
        if (store.climatePreference === "Cold" && dest.climate === "Cold") score += 2;
        if (store.climatePreference === "Doesn't matter") score += 1;
        
        // Score based on budget
        if (store.budgetLevel === "Budget" && dest.budgetFriendly) score += 2;
        if (store.budgetLevel === "Luxury" && !dest.budgetFriendly) score += 1;
        
        return { ...dest, score };
      });

      // Sort by score and take top 6
      const topRecommendations = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

      setRecommendations(topRecommendations);
    };

    generateRecommendations();
  }, [store.vibes, store.climatePreference, store.budgetLevel]);

  const handleDestinationToggle = (destinationName: string) => {
    setSelectedDestinations(prev => {
      if (prev.includes(destinationName)) {
        return prev.filter(name => name !== destinationName);
      } else {
        return [...prev, destinationName];
      }
    });
  };

  const handleConfirmSelections = () => {
    // Add selected destinations to store
    selectedDestinations.forEach(dest => {
      store.addDestination(dest, true); // true indicates it's a recommendation
    });
    
    if (selectedDestinations.length > 0) {
      onNext();
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Perfect Destinations for You</h2>
        <p className="text-gray-600">
          Based on your preferences, here are some destinations we think you'll love. 
          Select one or more that interest you!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((dest, index) => (
          <div
            key={dest.name}
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedDestinations.includes(dest.name)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleDestinationToggle(dest.name)}
          >
            <div className="flex items-start space-x-3">
              <img
                src={dest.image}
                alt={dest.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{dest.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{dest.description}</p>
                <div className="flex flex-wrap gap-1">
                  {dest.matchingVibes.map(vibe => (
                    <span
                      key={vibe}
                      className={`px-2 py-1 text-xs rounded-full ${
                        store.vibes.includes(vibe as any)
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {vibe}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0">
                {selectedDestinations.includes(dest.name) && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Selected: {selectedDestinations.length} destination{selectedDestinations.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex justify-between">
          <Button onClick={onBack} variant="outline">
            Back
          </Button>
          <Button
            onClick={handleConfirmSelections}
            disabled={selectedDestinations.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Continue with Selected Destinations
          </Button>
        </div>
      </div>
    </Card>
  );
}; 
'use client';

import { useTravel } from '../context/TravelContext';
import { useState } from 'react';

export default function BudgetDisplay() {
  const { travelPreferences, setTravelPreferences } = useTravel();
  const [accommodationCost, setAccommodationCost] = useState<number>(0);
  const [transportationCost, setTransportationCost] = useState<number>(0);
  const [foodCost, setFoodCost] = useState<number>(0);
  const [activitiesCost, setActivitiesCost] = useState<number>(0);
  const [miscCost, setMiscCost] = useState<number>(0);
  
  const totalBudget = parseInt(travelPreferences.totalBudget || '0', 10);
  const totalAllocated = accommodationCost + transportationCost + foodCost + activitiesCost + miscCost;
  const remainingBudget = totalBudget - totalAllocated;
  
  const handleCostUpdate = (category: string, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    
    switch(category) {
      case 'accommodation':
        setAccommodationCost(numValue);
        break;
      case 'transportation':
        setTransportationCost(numValue);
        break;
      case 'food':
        setFoodCost(numValue);
        break;
      case 'activities':
        setActivitiesCost(numValue);
        break;
      case 'misc':
        setMiscCost(numValue);
        break;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Budget Tracker</h3>
      
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-gray-700">Total Budget:</span>
          <span className="font-medium">${totalBudget.toLocaleString()}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${remainingBudget > 0 ? 'bg-green-600' : 'bg-red-600'}`}
            style={{ width: `${Math.min(100, (totalAllocated / totalBudget) * 100)}%` }}
          ></div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-gray-700">Accommodation:</label>
          <div className="flex items-center">
            <span className="mr-2">$</span>
            <input 
              type="number" 
              value={accommodationCost || ''}
              onChange={(e) => handleCostUpdate('accommodation', e.target.value)}
              className="w-24 p-1 border rounded text-right"
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <label className="text-gray-700">Transportation:</label>
          <div className="flex items-center">
            <span className="mr-2">$</span>
            <input 
              type="number" 
              value={transportationCost || ''}
              onChange={(e) => handleCostUpdate('transportation', e.target.value)}
              className="w-24 p-1 border rounded text-right"
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <label className="text-gray-700">Food:</label>
          <div className="flex items-center">
            <span className="mr-2">$</span>
            <input 
              type="number" 
              value={foodCost || ''}
              onChange={(e) => handleCostUpdate('food', e.target.value)}
              className="w-24 p-1 border rounded text-right"
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <label className="text-gray-700">Activities:</label>
          <div className="flex items-center">
            <span className="mr-2">$</span>
            <input 
              type="number" 
              value={activitiesCost || ''}
              onChange={(e) => handleCostUpdate('activities', e.target.value)}
              className="w-24 p-1 border rounded text-right"
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <label className="text-gray-700">Miscellaneous:</label>
          <div className="flex items-center">
            <span className="mr-2">$</span>
            <input 
              type="number" 
              value={miscCost || ''}
              onChange={(e) => handleCostUpdate('misc', e.target.value)}
              className="w-24 p-1 border rounded text-right"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between text-lg font-medium">
          <span>Remaining Budget:</span>
          <span className={remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}>
            ${remainingBudget.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
} 
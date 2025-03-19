'use client';

import { useTravel } from '../context/TravelContext';
import { Progress } from './ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';

// Add proper TypeScript interface
interface BudgetBreakdown {
  accommodation: number;
  food: number;
  transportation: number;
  activities: number;
  misc: number;
}

export default function BudgetDisplay() {
  const { travelPreferences } = useTravel();
  
  // Check if we have budget information
  const hasBudget = !!travelPreferences.totalBudget;
  
  // Calculate trip days
  const calculateTripDays = () => {
    if (travelPreferences.startDate && travelPreferences.endDate) {
      const start = new Date(travelPreferences.startDate);
      const end = new Date(travelPreferences.endDate);
      return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }
    return 0;
  };
  
  const tripDays = calculateTripDays();
  
  // Calculate estimated budget breakdown
  const calculateBudgetBreakdown = () => {
    if (!hasBudget) return null;
    
    const totalBudget = parseInt(travelPreferences.totalBudget.replace(/[^0-9]/g, ''), 10);
    
    // Standard budget allocation percentages
    return {
      accommodation: Math.round(totalBudget * 0.4), // 40% for accommodation
      food: Math.round(totalBudget * 0.25),         // 25% for food
      transportation: Math.round(totalBudget * 0.15), // 15% for transportation
      activities: Math.round(totalBudget * 0.15),   // 15% for activities
      misc: Math.round(totalBudget * 0.05)          // 5% for miscellaneous
    };
  };
  
  const budgetBreakdown = calculateBudgetBreakdown();
  
  if (!hasBudget) {
    return (
      <Card className="border-[#151515]">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Budget Breakdown
          </CardTitle>
          <CardDescription>
            Please complete your travel preferences to see your budget breakdown.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="border-[#151515]">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Budget Breakdown for {tripDays} {tripDays === 1 ? 'day' : 'days'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-medium">Total Budget:</span>
            <span className="text-gray-300 font-bold">${travelPreferences.totalBudget}</span>
          </div>
          <Progress value={100} className="h-4" />
        </div>
        
        <div className="space-y-4">
          {/* Accommodation */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400">Accommodation (40%)</span>
              <span className="text-white">${budgetBreakdown?.accommodation}</span>
            </div>
            <Progress value={40} />
          </div>
          
          {/* Food */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400">Food (25%)</span>
              <span className="text-white">${budgetBreakdown?.food}</span>
            </div>
            <Progress value={25} />
          </div>
          
          {/* Transportation */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400">Transportation (15%)</span>
              <span className="text-white">${budgetBreakdown?.transportation}</span>
            </div>
            <Progress value={15} />
          </div>
          
          {/* Activities */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400">Activities (15%)</span>
              <span className="text-white">${budgetBreakdown?.activities}</span>
            </div>
            <Progress value={15} />
          </div>
          
          {/* Miscellaneous */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400">Miscellaneous (5%)</span>
              <span className="text-white">${budgetBreakdown?.misc}</span>
            </div>
            <Progress value={5} />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="text-sm text-gray-400 border-t border-[#151515] pt-4">
        This is an estimated breakdown based on typical travel expenses. Actual costs may vary based on destination, season, and personal preferences.
      </CardFooter>
    </Card>
  );
} 
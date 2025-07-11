'use client';

import React, { useState } from 'react';
import { useTravelPreferencesStore } from '../store/travel-preferences';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { BubbleButton } from './ui/bubble-button';
import { DestinationRecommendations } from './DestinationRecommendations';

export const QnAFlow: React.FC = () => {
  const store = useTravelPreferencesStore();
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const handleInputChange = (key: string, value: string) => {
    setInputValues(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    store.setCurrentStep(store.currentStep + 1);
  };

  const handleBack = () => {
    store.setCurrentStep(Math.max(0, store.currentStep - 1));
  };

  const renderStep = () => {
    switch (store.currentStep) {
      case 0:
        return (
          <QuestionCard
            question="Do you have a specific destination in mind?"
            onNext={handleNext}
          >
            <div className="space-y-3">
              <BubbleButton
                onClick={() => {
                  store.setHasDestination(true);
                  handleNext();
                }}
                variant="primary"
              >
                Yes, I know where I want to go
              </BubbleButton>
              <BubbleButton
                onClick={() => {
                  store.setHasDestination(false);
                  handleNext();
                }}
                variant="secondary"
              >
                No, I need recommendations
              </BubbleButton>
            </div>
          </QuestionCard>
        );

      case 1:
        if (store.hasDestination) {
          return (
            <QuestionCard
              question="Where would you like to go?"
              onNext={() => {
                if (inputValues.destination) {
                  // Split destinations by comma and add them
                  const destinations = inputValues.destination.split(',').map(d => d.trim()).filter(d => d);
                  destinations.forEach(dest => store.addDestination(dest));
                  handleNext();
                }
              }}
              onBack={handleBack}
              canProceed={!!inputValues.destination}
            >
              <div className="space-y-4">
                <Input
                  placeholder="Enter your destination(s)"
                  value={inputValues.destination || ''}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && inputValues.destination) {
                      // Split destinations by comma and add them
                      const destinations = inputValues.destination.split(',').map(d => d.trim()).filter(d => d);
                      destinations.forEach(dest => store.addDestination(dest));
                      handleNext();
                    }
                  }}
                />
                <p className="text-sm text-gray-600">
                  You can add multiple destinations separated by commas
                </p>
              </div>
            </QuestionCard>
          );
        } else {
          return (
            <QuestionCard
              question="What kind of vibe are you going for?"
              onNext={handleNext}
              onBack={handleBack}
              canProceed={store.vibes.length > 0}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {(['Relaxing', 'Adventure', 'Romantic', 'Culture', 'Foodie'] as const).map(vibe => (
                    <BubbleButton
                      key={vibe}
                      onClick={() => {
                        if (store.vibes.includes(vibe)) {
                          store.removeVibe(vibe);
                        } else {
                          store.addVibe(vibe);
                        }
                      }}
                      variant={store.vibes.includes(vibe) ? 'primary' : 'outline'}
                    >
                      {vibe}
                    </BubbleButton>
                  ))}
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Custom vibe (optional)"
                    value={inputValues.customVibe || ''}
                    onChange={(e) => handleInputChange('customVibe', e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && inputValues.customVibe) {
                        store.setCustomVibe(inputValues.customVibe);
                        store.addVibe('Custom');
                      }
                    }}
                  />
                </div>
              </div>
            </QuestionCard>
          );
        }

      case 2:
        if (store.hasDestination) {
          return (
            <QuestionCard
              question="When are you planning to travel?"
              onNext={() => {
                if (!store.isFlexibleDates && inputValues.startDate && inputValues.endDate) {
                  store.setTravelDates({ start: inputValues.startDate, end: inputValues.endDate });
                }
                handleNext();
              }}
              canProceed={store.isFlexibleDates || (inputValues.startDate && inputValues.endDate)}
              onBack={handleBack}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <BubbleButton
                    onClick={() => {
                      store.setIsFlexibleDates(false);
                      handleNext();
                    }}
                    variant={!store.isFlexibleDates ? 'primary' : 'outline'}
                  >
                    Fixed dates
                  </BubbleButton>
                  <BubbleButton
                    onClick={() => {
                      store.setIsFlexibleDates(true);
                      handleNext();
                    }}
                    variant={store.isFlexibleDates ? 'primary' : 'outline'}
                  >
                    Flexible
                  </BubbleButton>
                </div>
                {!store.isFlexibleDates && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date</label>
                      <Input
                        type="date"
                        value={inputValues.startDate || ''}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date</label>
                      <Input
                        type="date"
                        value={inputValues.endDate || ''}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </QuestionCard>
          );
        } else {
          return (
            <QuestionCard
              question="What's your budget preference?"
              onNext={handleNext}
              onBack={handleBack}
              canProceed={!!store.budgetLevel}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {(['Budget', 'Mid-range', 'Luxury'] as const).map(level => (
                    <BubbleButton
                      key={level}
                      onClick={() => {
                        store.setBudgetLevel(level);
                        handleNext();
                      }}
                      variant={store.budgetLevel === level ? 'primary' : 'outline'}
                    >
                      {level}
                    </BubbleButton>
                  ))}
                </div>
                <div className="space-y-2">
                  <BubbleButton
                    onClick={() => store.setBudgetLevel('Custom')}
                    variant={store.budgetLevel === 'Custom' ? 'primary' : 'outline'}
                  >
                    Custom Budget
                  </BubbleButton>
                  {store.budgetLevel === 'Custom' && (
                    <Input
                      type="number"
                      placeholder="Enter your budget in USD"
                      value={inputValues.customBudget || ''}
                      onChange={(e) => handleInputChange('customBudget', e.target.value)}
                      onBlur={() => {
                        if (inputValues.customBudget) {
                          store.setCustomBudget(parseInt(inputValues.customBudget));
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            </QuestionCard>
          );
        }

      case 3:
        if (store.hasDestination) {
          return (
            <QuestionCard
              question="How many days will you be traveling?"
              onNext={handleNext}
              onBack={handleBack}
              canProceed={!!inputValues.tripLength}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 7, 10, 14].map(days => (
                    <BubbleButton
                      key={days}
                      onClick={() => {
                        store.setTripLength(days);
                        handleInputChange('tripLength', days.toString());
                        handleNext();
                      }}
                      variant={store.tripLength === days ? 'primary' : 'outline'}
                    >
                      {days} days
                    </BubbleButton>
                  ))}
                </div>
                <Input
                  type="number"
                  placeholder="Or enter custom number of days"
                  value={inputValues.tripLength || ''}
                  onChange={(e) => handleInputChange('tripLength', e.target.value)}
                  onBlur={() => {
                    if (inputValues.tripLength) {
                      store.setTripLength(parseInt(inputValues.tripLength));
                    }
                  }}
                />
              </div>
            </QuestionCard>
          );
        } else {
          return (
            <QuestionCard
              question="What's your preferred climate?"
              onNext={handleNext}
              onBack={handleBack}
              canProceed={!!store.climatePreference}
            >
              <div className="grid grid-cols-3 gap-3">
                {(['Warm', 'Cold', "Doesn't matter"] as const).map(climate => (
                  <BubbleButton
                    key={climate}
                    onClick={() => {
                      store.setClimatePreference(climate);
                      handleNext();
                    }}
                    variant={store.climatePreference === climate ? 'primary' : 'outline'}
                  >
                    {climate}
                  </BubbleButton>
                ))}
              </div>
            </QuestionCard>
          );
        }

      case 4:
        if (store.hasDestination) {
          return (
            <QuestionCard
              question="How many people will be traveling?"
              onNext={handleNext}
              onBack={handleBack}
              canProceed={store.travelPartySize > 0}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(size => (
                    <BubbleButton
                      key={size}
                      onClick={() => {
                        store.setTravelPartySize(size);
                        handleNext();
                      }}
                      variant={store.travelPartySize === size ? 'primary' : 'outline'}
                    >
                      {size} {size === 1 ? 'person' : 'people'}
                    </BubbleButton>
                  ))}
                </div>
                <Input
                  type="number"
                  placeholder="Or enter custom number"
                  value={inputValues.partySize || ''}
                  onChange={(e) => handleInputChange('partySize', e.target.value)}
                  onBlur={() => {
                    if (inputValues.partySize) {
                      store.setTravelPartySize(parseInt(inputValues.partySize));
                    }
                  }}
                />
              </div>
            </QuestionCard>
          );
        } else {
          return (
            <QuestionCard
              question="Do you have flexible travel dates?"
              onNext={handleNext}
              onBack={handleBack}
            >
              <div className="grid grid-cols-2 gap-3">
                <BubbleButton
                  onClick={() => {
                    store.setIsFlexibleDates(false);
                    handleNext();
                  }}
                  variant={!store.isFlexibleDates ? 'primary' : 'outline'}
                >
                  Fixed dates
                </BubbleButton>
                <BubbleButton
                  onClick={() => {
                    store.setIsFlexibleDates(true);
                    handleNext();
                  }}
                  variant={store.isFlexibleDates ? 'primary' : 'outline'}
                >
                  Flexible
                </BubbleButton>
              </div>
            </QuestionCard>
          );
        }

      case 5:
        if (store.hasDestination) {
          return (
            <QuestionCard
              question="Any must-do activities or things to avoid?"
              onNext={() => {
                store.completeQnA();
                handleNext();
              }}
              onBack={handleBack}
              nextText="Complete Setup"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Must-do activities</label>
                  <Input
                    placeholder="Enter activities (press Enter to add)"
                    value={inputValues.mustDo || ''}
                    onChange={(e) => handleInputChange('mustDo', e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && inputValues.mustDo) {
                        store.addMustDo(inputValues.mustDo);
                        handleInputChange('mustDo', '');
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {store.mustDo.map(activity => (
                      <span
                        key={activity}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm cursor-pointer hover:bg-blue-200"
                        onClick={() => store.removeMustDo(activity)}
                      >
                        {activity} ×
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Things to avoid</label>
                  <Input
                    placeholder="Enter things to avoid (press Enter to add)"
                    value={inputValues.avoid || ''}
                    onChange={(e) => handleInputChange('avoid', e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && inputValues.avoid) {
                        store.addAvoid(inputValues.avoid);
                        handleInputChange('avoid', '');
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {store.avoid.map(activity => (
                      <span
                        key={activity}
                        className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm cursor-pointer hover:bg-red-200"
                        onClick={() => store.removeAvoid(activity)}
                      >
                        {activity} ×
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </QuestionCard>
          );
        } else {
          return (
            <QuestionCard
              question="How many days will you be traveling?"
              onNext={handleNext}
              onBack={handleBack}
              canProceed={!!store.tripLength}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 7, 10, 14].map(days => (
                    <BubbleButton
                      key={days}
                      onClick={() => {
                        store.setTripLength(days);
                        handleNext();
                      }}
                      variant={store.tripLength === days ? 'primary' : 'outline'}
                    >
                      {days} days
                    </BubbleButton>
                  ))}
                </div>
                <Input
                  type="number"
                  placeholder="Or enter custom number of days"
                  value={inputValues.tripLength || ''}
                  onChange={(e) => handleInputChange('tripLength', e.target.value)}
                  onBlur={() => {
                    if (inputValues.tripLength) {
                      store.setTripLength(parseInt(inputValues.tripLength));
                    }
                  }}
                />
              </div>
            </QuestionCard>
          );
        }

      case 6:
        if (!store.hasDestination) {
          return <DestinationRecommendations onNext={handleNext} onBack={handleBack} />;
        }
        // Completion step for hasDestination path (they already had activities at step 5)
        return (
          <div className="text-center space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                🎉 Setup Complete!
              </h2>
              <p className="text-green-700">
                Great! I've collected all your travel preferences. Ready to generate your personalized itinerary?
              </p>
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={() => {
                  // This will trigger itinerary generation
                  store.setShowItinerary(true);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
              >
                Generate My Itinerary
              </Button>
              
              <Button
                onClick={() => store.setCurrentStep(0)}
                variant="outline"
                className="w-full"
              >
                Start Over
              </Button>
            </div>
          </div>
        );

      case 7:
        if (!store.hasDestination) {
          // Party size step for no destination path
          return (
            <QuestionCard
              question="How many people will be traveling?"
              onNext={handleNext}
              onBack={handleBack}
              canProceed={store.travelPartySize > 0}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(size => (
                    <BubbleButton
                      key={size}
                      onClick={() => {
                        store.setTravelPartySize(size);
                        handleNext();
                      }}
                      variant={store.travelPartySize === size ? 'primary' : 'outline'}
                    >
                      {size} {size === 1 ? 'person' : 'people'}
                    </BubbleButton>
                  ))}
                </div>
                <Input
                  type="number"
                  placeholder="Or enter custom number"
                  value={inputValues.partySize || ''}
                  onChange={(e) => handleInputChange('partySize', e.target.value)}
                  onBlur={() => {
                    if (inputValues.partySize) {
                      store.setTravelPartySize(parseInt(inputValues.partySize));
                    }
                  }}
                />
              </div>
            </QuestionCard>
          );
        }
        // This case should not be reached for hasDestination path
        return null;

      case 8:
        // Activities step for no destination path
        return (
          <QuestionCard
            question="Any must-do activities or things to avoid?"
            onNext={() => {
              store.completeQnA();
              handleNext();
            }}
            onBack={handleBack}
            nextText="Complete Setup"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Must-do activities</label>
                <Input
                  placeholder="Enter activities (press Enter to add)"
                  value={inputValues.mustDo || ''}
                  onChange={(e) => handleInputChange('mustDo', e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && inputValues.mustDo) {
                      store.addMustDo(inputValues.mustDo);
                      handleInputChange('mustDo', '');
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {store.mustDo.map(activity => (
                    <span
                      key={activity}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm cursor-pointer hover:bg-blue-200"
                      onClick={() => store.removeMustDo(activity)}
                    >
                      {activity} ×
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Things to avoid</label>
                <Input
                  placeholder="Enter things to avoid (press Enter to add)"
                  value={inputValues.avoid || ''}
                  onChange={(e) => handleInputChange('avoid', e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && inputValues.avoid) {
                      store.addAvoid(inputValues.avoid);
                      handleInputChange('avoid', '');
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {store.avoid.map(activity => (
                    <span
                      key={activity}
                      className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm cursor-pointer hover:bg-red-200"
                      onClick={() => store.removeAvoid(activity)}
                    >
                      {activity} ×
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </QuestionCard>
        );

      case 9:
        // Completion step for no destination path
        return (
          <div className="text-center space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                🎉 Setup Complete!
              </h2>
              <p className="text-green-700">
                Great! I've collected all your travel preferences. Ready to generate your personalized itinerary?
              </p>
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={() => {
                  // This will trigger itinerary generation
                  store.setShowItinerary(true);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
              >
                Generate My Itinerary
              </Button>
              
              <Button
                onClick={() => store.setCurrentStep(0)}
                variant="outline"
                className="w-full"
              >
                Start Over
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (store.isComplete && store.showItinerary) {
    return null; // The itinerary sidebar will handle the display
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">Plan Your Perfect Trip</h1>
          <span className="text-sm text-gray-500">
            Step {store.currentStep + 1} of {store.hasDestination ? 7 : 10}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((store.currentStep + 1) / (store.hasDestination ? 7 : 10)) * 100}%`
            }}
          />
        </div>
      </div>
      
      {renderStep()}
    </div>
  );
};

// Helper component for consistent question layout
const QuestionCard: React.FC<{
  question: string;
  children: React.ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  canProceed?: boolean;
  nextText?: string;
}> = ({ question, children, onNext, onBack, canProceed = true, nextText = "Next" }) => {
  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">{question}</h2>
      {children}
      <div className="flex justify-between">
        {onBack && (
          <Button onClick={onBack} variant="outline">
            Back
          </Button>
        )}
        {onNext && (
          <Button
            onClick={onNext}
            disabled={!canProceed}
            className="ml-auto"
          >
            {nextText}
          </Button>
        )}
      </div>
    </Card>
  );
}; 
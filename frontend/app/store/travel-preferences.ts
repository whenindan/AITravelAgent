import { create } from 'zustand';

export type BudgetLevel = "Budget" | "Mid-range" | "Luxury" | "Custom";
export type ClimatePreference = "Warm" | "Cold" | "Doesn't matter";
export type TravelTimePreference = "Fixed dates" | "Flexible";
export type VibeType = "Relaxing" | "Adventure" | "Romantic" | "Culture" | "Foodie" | "Custom";

export interface Destination {
  name: string;
  isRecommended?: boolean; // For destinations recommended by the system
  userConfirmed?: boolean; // Whether user confirmed this destination
}

export interface TravelPreferences {
  // Step tracking
  currentStep: number;
  isComplete: boolean;
  
  // Basic flow
  hasDestination: boolean;
  destinations: Destination[];
  
  // Travel details
  travelDates?: { start: string; end: string };
  isFlexibleDates: boolean;
  tripLength?: number;
  travelPartySize: number;
  
  // Budget
  budgetLevel: BudgetLevel;
  customBudget?: number;
  
  // Preferences (for when user doesn't have destination)
  vibes: VibeType[];
  customVibe?: string;
  climatePreference?: ClimatePreference;
  
  // Activities
  mustDo: string[];
  avoid: string[];
  
  // Itinerary
  generatedItinerary?: string;
  showItinerary: boolean;
}

export interface TravelPreferencesStore extends TravelPreferences {
  // Actions
  setCurrentStep: (step: number) => void;
  setHasDestination: (hasDestination: boolean) => void;
  addDestination: (destination: string, isRecommended?: boolean) => void;
  removeDestination: (destinationName: string) => void;
  confirmDestination: (destinationName: string) => void;
  setTravelDates: (dates: { start: string; end: string }) => void;
  setIsFlexibleDates: (flexible: boolean) => void;
  setTripLength: (days: number) => void;
  setTravelPartySize: (size: number) => void;
  setBudgetLevel: (level: BudgetLevel) => void;
  setCustomBudget: (budget: number) => void;
  addVibe: (vibe: VibeType) => void;
  removeVibe: (vibe: VibeType) => void;
  setCustomVibe: (vibe: string) => void;
  setClimatePreference: (climate: ClimatePreference) => void;
  addMustDo: (activity: string) => void;
  removeMustDo: (activity: string) => void;
  addAvoid: (activity: string) => void;
  removeAvoid: (activity: string) => void;
  setGeneratedItinerary: (itinerary: string) => void;
  setShowItinerary: (show: boolean) => void;
  resetPreferences: () => void;
  completeQnA: () => void;
}

const initialState: TravelPreferences = {
  currentStep: 0,
  isComplete: false,
  hasDestination: false,
  destinations: [],
  isFlexibleDates: false,
  travelPartySize: 1,
  budgetLevel: "Mid-range",
  vibes: [],
  mustDo: [],
  avoid: [],
  showItinerary: false,
};

export const useTravelPreferencesStore = create<TravelPreferencesStore>((set, get) => ({
  ...initialState,
  
  // Step management
  setCurrentStep: (step) => set({ currentStep: step }),
  
  // Destination management
  setHasDestination: (hasDestination) => set({ hasDestination }),
  addDestination: (destination, isRecommended = false) => 
    set((state) => ({
      destinations: [...state.destinations, { name: destination, isRecommended, userConfirmed: !isRecommended }]
    })),
  removeDestination: (destinationName) =>
    set((state) => ({
      destinations: state.destinations.filter(d => d.name !== destinationName)
    })),
  confirmDestination: (destinationName) =>
    set((state) => ({
      destinations: state.destinations.map(d => 
        d.name === destinationName ? { ...d, userConfirmed: true } : d
      )
    })),
  
  // Travel details
  setTravelDates: (dates) => set({ travelDates: dates }),
  setIsFlexibleDates: (flexible) => set({ isFlexibleDates: flexible }),
  setTripLength: (days) => set({ tripLength: days }),
  setTravelPartySize: (size) => set({ travelPartySize: size }),
  
  // Budget
  setBudgetLevel: (level) => set({ budgetLevel: level }),
  setCustomBudget: (budget) => set({ customBudget: budget }),
  
  // Preferences
  addVibe: (vibe) =>
    set((state) => ({
      vibes: state.vibes.includes(vibe) ? state.vibes : [...state.vibes, vibe]
    })),
  removeVibe: (vibe) =>
    set((state) => ({
      vibes: state.vibes.filter(v => v !== vibe)
    })),
  setCustomVibe: (vibe) => set({ customVibe: vibe }),
  setClimatePreference: (climate) => set({ climatePreference: climate }),
  
  // Activities
  addMustDo: (activity) =>
    set((state) => ({
      mustDo: [...state.mustDo, activity]
    })),
  removeMustDo: (activity) =>
    set((state) => ({
      mustDo: state.mustDo.filter(a => a !== activity)
    })),
  addAvoid: (activity) =>
    set((state) => ({
      avoid: [...state.avoid, activity]
    })),
  removeAvoid: (activity) =>
    set((state) => ({
      avoid: state.avoid.filter(a => a !== activity)
    })),
  
  // Itinerary
  setGeneratedItinerary: (itinerary) => set({ generatedItinerary: itinerary }),
  setShowItinerary: (show) => set({ showItinerary: show }),
  
  // Utility functions
  resetPreferences: () => set(initialState),
  completeQnA: () => set({ isComplete: true }),
})); 
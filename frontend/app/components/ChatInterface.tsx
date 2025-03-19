'use client';

import { useState, useEffect, useRef } from 'react';
import { useTravel } from '../context/TravelContext';
import AirbnbListings from './AirbnbListings';
import TravelPreferences from './TravelPreferences';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  showListings?: boolean;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { travelPreferences, selectedListings, setSelectedListings, fetchListingsWithImages } = useTravel();
  const [showAirbnbSection, setShowAirbnbSection] = useState(false);
  
  // Travel Details dropdown state
  const [showTravelDropdown, setShowTravelDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Travel Preferences modal state
  const [showTravelPreferences, setShowTravelPreferences] = useState(false);
  
  // Multi-city Trip coming soon dialog
  const [showMultiCityDialog, setShowMultiCityDialog] = useState(false);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTravelDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if travel preferences are complete
  const areTravelPreferencesComplete = () => {
    return (
      travelPreferences.destination &&
      travelPreferences.travelingFrom &&
      travelPreferences.startDate &&
      travelPreferences.endDate &&
      travelPreferences.travelers > 0 &&
      travelPreferences.totalBudget
    );
  };

  // Calculate trip days
  const calculateTripDays = () => {
    if (travelPreferences.startDate && travelPreferences.endDate) {
      const start = new Date(travelPreferences.startDate);
      const end = new Date(travelPreferences.endDate);
      return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }
    return 1;
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, currentTypingText]);

  // Update the effect that shows listings after preferences are complete
  useEffect(() => {
    // Only run this effect if we have no messages yet
    if (messages.length === 0) {
      const preferencesComplete = areTravelPreferencesComplete();
      
      if (preferencesComplete) {
        // Add a slight delay before starting the welcome message
        const timer = setTimeout(() => {
          const welcomeMessage = `Hey there! 👋 I'm so excited to help you plan your trip to ${travelPreferences.destination}! Let me find you some amazing places to stay within your budget of $${travelPreferences.totalBudget}!`;
          
          simulateTyping(welcomeMessage);
          
          // After the welcome message, show a loading indicator for 5 seconds
          setTimeout(() => {
            setIsTyping(true);
            setCurrentTypingText("Searching for the best accommodations...");
            setIsLoading(true); // Set loading state while fetching listings
            
            // After the loading indicator has shown for 5 seconds, show the listings
            setTimeout(() => {
              handleShowListings();
            }, 5000); // Wait for 5 seconds
          }, 1000);
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [
    // Keep a stable dependency array with individual properties
    messages.length,
    travelPreferences.destination,
    travelPreferences.travelingFrom,
    travelPreferences.startDate,
    travelPreferences.endDate,
    travelPreferences.travelers,
    travelPreferences.totalBudget
  ]);

  // Add this effect to load initial listings when preferences are complete
  useEffect(() => {
    const preferencesComplete = areTravelPreferencesComplete();
    
    // Fetch listings when preferences are complete
    if (preferencesComplete && selectedListings.length === 0) {
      fetchListingsWithImages(travelPreferences.destination, travelPreferences.startDate);
    }
  }, [
    travelPreferences.destination,
    travelPreferences.startDate,
    selectedListings.length
  ]);

  // Function to simulate typing effect - FIXED to include the first letter
  const simulateTyping = (text: string, showListings: boolean = false) => {
    setIsTyping(true);
    setCurrentTypingText(''); // Start with empty string
    
    let i = 0;
    const typingSpeed = 20;
    
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        // Make sure to include the first character by starting at index 0
        setCurrentTypingText(prev => text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: text,
          showListings 
        }]);
        
        // If this message should show listings, set the showAirbnbSection flag
        if (showListings) {
          setShowAirbnbSection(true);
        }
      }
    }, typingSpeed);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading || isTyping) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    // Normalize the message for easier intent detection
    const normalizedMessage = userMessage.toLowerCase();
    
    // Check for stay/accommodation related requests - expanded patterns
    if ((normalizedMessage.includes('show me') && 
         (normalizedMessage.includes('listing') || normalizedMessage.includes('airbnb'))) ||
        (normalizedMessage.includes('place') && normalizedMessage.includes('stay')) ||
        (normalizedMessage.includes('accommodation')) ||
        (normalizedMessage.includes('where') && normalizedMessage.includes('stay')) ||
        (normalizedMessage.includes('need') && 
         (normalizedMessage.includes('hotel') || normalizedMessage.includes('place') || 
          normalizedMessage.includes('airbnb') || normalizedMessage.includes('apartment') || 
          normalizedMessage.includes('room'))) ||
        (normalizedMessage.includes('find') && 
         (normalizedMessage.includes('hotel') || normalizedMessage.includes('place') || 
          normalizedMessage.includes('airbnb') || normalizedMessage.includes('apartment') || 
          normalizedMessage.includes('room')))
       ) {
      handleShowListings();
    } 
    // Check for requests for cheaper options
    else if (normalizedMessage.includes('cheaper') || 
             normalizedMessage.includes('less expensive') ||
             normalizedMessage.includes('budget friendly') ||
             normalizedMessage.includes('affordable') ||
             normalizedMessage.includes('lower price')) {
      handleCheaperOptions();
    }
    // Handle "yes" responses to the welcome message
    else if (messages.length === 1 && 
             messages[0].role === 'assistant' && 
             (normalizedMessage.includes('yes') || normalizedMessage.includes('yeah') || 
              normalizedMessage.includes('sure') || normalizedMessage.includes('ok'))) {
      setIsLoading(false);
      handleShowListings();
    }
    // Default: send to chatbot API
    else {
      try {
        const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify({ message: userMessage }),
        });
        
        let data;
        try {
          data = await response.json();
        } catch (error) {
          // If JSON parsing fails or backend is unavailable, offer to show listings
          if (normalizedMessage.includes('stay') || 
              normalizedMessage.includes('place') || 
              normalizedMessage.includes('accommodation')) {
            setIsLoading(false);
            handleShowListings();
            return;
          }
          
          // Otherwise fallback to a default response
          data = { 
            response: "I'd be happy to help with that! Would you like to see some accommodation options for your trip?"
          };
        }
        
        simulateTyping(data.response || "I didn't get a proper response. Would you like to see some accommodation options while we wait?");
      } catch (error) {
        console.error('Error:', error);
        // Even on error, if accommodation-related, show listings
        if (normalizedMessage.includes('stay') || 
            normalizedMessage.includes('place') || 
            normalizedMessage.includes('accommodation')) {
          setIsLoading(false);
          handleShowListings();
          return;
        }
        simulateTyping("I'd be happy to help you find a great place to stay! Let me show you some options that fit your budget:");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle showing listings - update this function to always show at least 5 listings
  const handleShowListings = async () => {
    // Don't set isLoading to false yet, we're still working
    
    if (selectedListings.length === 0) {
      // First try to fetch listings if we don't have any
      try {
        setIsTyping(true);
        setCurrentTypingText("Searching for the best accommodations...");
        
        await fetchListingsWithImages(travelPreferences.destination, travelPreferences.startDate);
        
        // If after fetching we still have no listings, show a message
        if (selectedListings.length === 0) {
          setIsLoading(false); // Done loading
          simulateTyping("I'd love to show you some great places to stay! I'm currently searching for options that match your preferences. Can you tell me what's most important to you - location, amenities, or staying within budget?");
          return;
        }
      } catch (error) {
        console.error("Error fetching listings:", error);
        setIsLoading(false); // Done loading
        simulateTyping("I'm having trouble finding listings for your destination. Could you please check your internet connection or try again later?");
        return;
      }
    }
    
    // Get the total budget
    const totalBudget = parseInt(travelPreferences.totalBudget.replace(/[^0-9]/g, ''), 10);
    
    // Use 60% of budget as the maximum for accommodation
    const maxAccommodationBudget = totalBudget * 0.6;
    
    // Filter listings by budget and sort by price (lowest first)
    const listingsWithPrices = selectedListings.map(listing => {
      // Extract total price from listing
      const totalMatch = listing.price_text.match(/\$([0-9,]+)\s+total/i);
      let totalPrice = 0;
      
      if (totalMatch) {
        totalPrice = parseInt(totalMatch[1].replace(/,/g, ''), 10);
      } else {
        const nightMatch = listing.price_text.match(/\$(\d+)/);
        const pricePerNight = nightMatch ? parseInt(nightMatch[1], 10) : 0;
        totalPrice = pricePerNight * calculateTripDays();
      }
      
      return { ...listing, totalPrice };
    }).sort((a, b) => a.totalPrice - b.totalPrice); // Sort by price, lowest first
    
    // Always take at least 5 listings if available, but filter out any above 60% of budget
    const affordableListings = listingsWithPrices.filter(listing => listing.totalPrice <= maxAccommodationBudget);
    
    // Take at least 5 listings or all affordable ones, whichever is smaller
    const listingsToShow = affordableListings.slice(0, Math.max(5, affordableListings.length));
    
    // If we have fewer than 5 affordable listings but more total listings, take some more expensive ones
    if (listingsToShow.length < 5 && listingsWithPrices.length > listingsToShow.length) {
      // Add more listings up to 5 total, regardless of budget
      const additionalListings = listingsWithPrices
        .filter(listing => !listingsToShow.includes(listing))
        .slice(0, 5 - listingsToShow.length);
      
      listingsToShow.push(...additionalListings);
    }
    
    // Update the selected listings
    setSelectedListings(listingsToShow);
    
    // Create a more accurate message based on the actual number of listings
    const getResponse = (count: number, allAffordable: boolean) => {
      if (count === 0) {
        return `I've searched for accommodations in ${travelPreferences.destination}, but couldn't find any that match your criteria right now. Would you like me to try a different search?`;
      } else if (count === 1) {
        return `I found a fantastic place in ${travelPreferences.destination} for your stay! It's in a great location with excellent amenities. What do you think? 🏠✨`;
      } else {
        let response = `I found ${count} wonderful places in ${travelPreferences.destination} for your stay! These are all highly-rated options with great amenities.`;
        
        if (!allAffordable) {
          response += ` Some options are above 60% of your total budget, but I'm showing them to give you more choices.`;
        }
        
        return response + ` Which one catches your eye? 🏠✨`;
      }
    };

    // Check if all listings shown are affordable
    const allAffordable = listingsToShow.every(listing => 
      listing.totalPrice <= maxAccommodationBudget
    );

    // Use the count-aware response
    const response = getResponse(listingsToShow.length, allAffordable);
    setIsLoading(false); // Done loading before showing the response
    simulateTyping(response, true);
  };

  // Handle requests for cheaper options
  const handleCheaperOptions = () => {
    setIsLoading(false);
    
    if (selectedListings.length === 0) {
      simulateTyping("I don't have any listings to compare yet. Let me search for some budget-friendly options for your trip.");
      return;
    }
    
    // Get the total budget
    const totalBudget = parseInt(travelPreferences.totalBudget.replace(/[^0-9]/g, ''), 10);
    const maxAccommodationBudget = totalBudget * 0.4; // 40% of total budget (more strict)
    
    // Extract and filter listings by a stricter budget
    const cheaperListings = selectedListings.filter(listing => {
      // Extract total price from listing
      const totalMatch = listing.price_text.match(/\$([0-9,]+)\s+total/i);
      let totalPrice = 0;
      
      if (totalMatch) {
        // Remove commas and convert to number
        totalPrice = parseInt(totalMatch[1].replace(/,/g, ''), 10);
      } else {
        // Extract price per night
        const nightMatch = listing.price_text.match(/\$(\d+)/);
        const pricePerNight = nightMatch ? parseInt(nightMatch[1], 10) : 0;
        totalPrice = pricePerNight * calculateTripDays();
      }
      
      // Check if listing is within the stricter budget
      return totalPrice <= maxAccommodationBudget;
    });
    
    if (cheaperListings.length === 0) {
      simulateTyping(`I've looked for cheaper options, but couldn't find any listings below 40% of your total budget. The current options I've shown are the most affordable ones available that meet your criteria.`);
      return;
    }
    
    setSelectedListings(cheaperListings);
    simulateTyping(`I've found some more budget-friendly options for you. These listings cost less than 40% of your total budget, which would leave you with more money for other aspects of your trip:`, true);
  };

  // Travel dropdown option handlers
  const handleRoundTripClick = () => {
    setShowTravelDropdown(false);
    setShowTravelPreferences(true);
  };

  const handleMultiCityClick = () => {
    setShowTravelDropdown(false);
    setShowMultiCityDialog(true);
  };

  // Calculate trip days for display
  const tripDays = calculateTripDays();
  
  // Check if preferences are complete
  const preferencesComplete = areTravelPreferencesComplete();

  return (
    <div className="space-y-2 w-full flex flex-col items-center">
      {/* Travel Details Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <Button
          onClick={() => setShowTravelDropdown(!showTravelDropdown)}
          variant="outline"
          size="sm"
          className="mb-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Travel Details
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
        
        {showTravelDropdown && (
          <div className="absolute z-50 mt-1 w-48 bg-[#232323] border border-[#151515] rounded-md shadow-lg overflow-hidden">
            <button
              className="w-full text-left px-4 py-2 text-gray-200 hover:bg-[#151515] transition-colors"
              onClick={handleRoundTripClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Round Trip
            </button>
            <button
              className="w-full text-left px-4 py-2 text-gray-200 hover:bg-[#151515] transition-colors"
              onClick={handleMultiCityClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Multi-city Trip
            </button>
          </div>
        )}
      </div>
      
      {/* Chat Interface */}
      <div className="flex flex-col w-full sm:w-[350px] md:w-[900px] h-[400px] bg-transparent rounded-lg shadow-lg overflow-hidden">
        <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto bg-transparent">
          {messages.map((message, index) => (
            <div key={index} className="mb-4">
              <div
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-[#303031] text-white rounded-tr-none ml-auto'
                      : 'bg-transparent text-white rounded-tl-none'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          
          {/* Show Airbnb listings with loading state */}
          {showAirbnbSection && (
            <div className="mt-4">
              {selectedListings.length > 0 ? (
                <AirbnbListings 
                  listings={selectedListings.map(listing => ({
                    ...listing,
                    description: listing.title || '',
                    location: listing.price_text || '',
                    amenities: []
                  }))}
                  tripDays={tripDays}
                />
              ) : isLoading ? (
                <div className="flex justify-center items-center p-8 bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-700 border-t-gray-500 mb-4"></div>
                    <p className="text-white">Loading accommodations in {travelPreferences.destination}...</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[75%] rounded-lg px-4 py-3 bg-transparent text-white rounded-tl-none">
                {currentTypingText}
                <div className="flex space-x-1 mt-1">
                  <div className="h-2 w-2 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-2 w-2 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-2 w-2 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          {!preferencesComplete && messages.length === 0 && (
            <div className="flex justify-center items-center h-full">
              <div className="text-center text-white">
                <p className="mb-2">Please complete your travel preferences first</p>
                <p className="text-sm text-gray-400">Click on "Travel Details" and choose "Round Trip" to set your preferences</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="p-4 flex gap-2 bg-black">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || isTyping}
            placeholder={isLoading || isTyping ? "Please wait..." : "Type your message..."}
            className={`flex-1 bg-black border-white ${
              (isLoading || isTyping) ? 'text-gray-400 placeholder-gray-500' : 'text-white placeholder-gray-400'
            }`}
          />
          <Button
            type="submit"
            disabled={isLoading || isTyping || !input.trim()}
            variant={isLoading || isTyping || !input.trim() ? "secondary" : "default"}
            size="icon"
            className="text-white bg-[#303031] hover:bg-[#3a3a3b]"
          >
            {isLoading ? (
              <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
            ) : isTyping ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </Button>
        </form>
      </div>
      
      {/* Travel Preferences Dialog */}
      <Dialog open={showTravelPreferences} onOpenChange={setShowTravelPreferences}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Round Trip Preferences</DialogTitle>
          </DialogHeader>
          <TravelPreferences closeModal={() => setShowTravelPreferences(false)} />
        </DialogContent>
      </Dialog>
      
      {/* Multi-city Trip Coming Soon Dialog */}
      <Dialog open={showMultiCityDialog} onOpenChange={setShowMultiCityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Multi-city Trip</DialogTitle>
          </DialogHeader>
          <div className="mt-4 p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">Coming Soon!</h3>
            <p className="text-gray-400">
              We're working on adding support for multi-city trips. Check back later for this feature!
            </p>
            <Button className="mt-6" onClick={() => setShowMultiCityDialog(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
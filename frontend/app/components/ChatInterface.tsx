'use client';

import { useState, useEffect, useRef } from 'react';
import { useTravel } from '../context/TravelContext';
import AirbnbListings from './AirbnbListings';

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

  // Calculate trip days for display
  const tripDays = calculateTripDays();
  
  // Check if preferences are complete
  const preferencesComplete = areTravelPreferencesComplete();

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
        {messages.map((message, index) => (
          <div key={index} className="mb-4">
            <div 
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-800'
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
              <AirbnbListings listings={selectedListings} tripDays={tripDays} />
            ) : isLoading ? (
              <div className="flex justify-center items-center p-8 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-black mb-4"></div>
                  <p className="text-gray-600">Loading accommodations in {travelPreferences.destination}...</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-lg p-3 bg-gray-100 text-gray-800">
              {currentTypingText}
              <span className="inline-block animate-pulse">▋</span>
            </div>
          </div>
        )}
        
        {!preferencesComplete && messages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <div className="text-center text-gray-500">
              <p className="mb-2">Please complete your travel preferences first</p>
              <p className="text-sm">Fill in all required fields in the travel preferences form</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading || isTyping}
          placeholder={isLoading || isTyping ? "Please wait..." : "Type your message..."}
          className={`flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            (isLoading || isTyping) ? 'bg-gray-100 text-gray-400' : 'text-black'
          }`}
        />
        <button
          type="submit"
          disabled={isLoading || isTyping || !input.trim()}
          className={`px-4 py-2 rounded-md ${
            isLoading || isTyping || !input.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          {isLoading ? (
            <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
          ) : isTyping ? (
            "Wait..."
          ) : (
            "Send"
          )}
        </button>
      </form>
    </div>
  );
} 
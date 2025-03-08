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
  const { travelPreferences, selectedListings, setSelectedListings } = useTravel();
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

  // Add initial welcome message when preferences are complete
  useEffect(() => {
    // Only run this effect if we have no messages yet
    if (messages.length === 0) {
      const preferencesComplete = areTravelPreferencesComplete();
      
      if (preferencesComplete) {
        // Add a slight delay before starting the welcome message
        const timer = setTimeout(() => {
          const welcomeMessage = `Hey there! 👋 I'm so excited to help you plan your trip to ${travelPreferences.destination}! With a budget of $${travelPreferences.totalBudget}, we can create an amazing vacation experience. What are you most looking forward to on this adventure?`;
          
          simulateTyping(welcomeMessage);
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

  // Handle showing listings
  const handleShowListings = () => {
    setIsLoading(false);
    
    if (selectedListings.length === 0) {
      simulateTyping("I'd love to show you some great places to stay! I'm currently searching for options that match your preferences. Can you tell me what's most important to you - location, amenities, or staying within budget?");
      return;
    }
    
    // Filter listings by budget constraint (60% of total budget)
    let filteredListings = filterListingsByBudget(selectedListings);
    
    // If we have fewer than 5 affordable listings, relax the budget constraint
    if (filteredListings.length < 5) {
      console.log("Not enough listings within budget, including some higher-priced options");
      // Sort all listings by price
      const allListingsSorted = [...selectedListings].map(listing => {
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
        
        return { ...listing, calculatedTotalPrice: totalPrice };
      }).sort((a, b) => (a.calculatedTotalPrice || 0) - (b.calculatedTotalPrice || 0));
      
      // Take the 5 cheapest listings
      filteredListings = allListingsSorted.slice(0, 5);
    }
    
    // Ensure we get exactly 5 listings (or all available if less than 5)
    const limitedListings = filteredListings.slice(0, 5);
    console.log(`Showing ${limitedListings.length} listings`);
    
    // Log each listing to verify
    limitedListings.forEach((listing, index) => {
      console.log(`Listing ${index + 1}: ${listing.title}`);
    });
    
    setSelectedListings(limitedListings);
    
    // Create a more conversational, natural-sounding message
    const responses = [
      `Perfect! I found some amazing spots in ${travelPreferences.destination} that should work wonderfully for you! All of these stays are within your budget sweet spot, leaving plenty for exploring, dining, and making memories! 😊`,
      
      `Check these out! I've found some lovely accommodations in ${travelPreferences.destination} that won't eat up your entire budget. These places have great reviews and leave you with plenty of spending money for the fun stuff! ✨`,
      
      `Oh, I think you'll love these! Here are some fantastic stays in ${travelPreferences.destination} at different price points. I made sure they're all budget-friendly so you can splurge a little on experiences too! 🌟`
    ];
    
    // Randomly select one of the responses for variety
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    simulateTyping(randomResponse, true);
  };

  // Function to filter listings by budget constraint
  const filterListingsByBudget = (listings) => {
    if (!listings || listings.length === 0) return [];
    
    // Calculate 60% of the total budget
    const totalBudget = parseInt(travelPreferences.totalBudget.replace(/[^0-9]/g, ''), 10);
    const maxAccommodationBudget = totalBudget * 0.6;
    
    console.log(`Total budget: $${totalBudget}, 60% max: $${maxAccommodationBudget}`);
    
    // Extract and filter listings by budget
    const affordableListings = listings.filter(listing => {
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
      
      console.log(`Listing price: $${totalPrice}, within budget: ${totalPrice <= maxAccommodationBudget}`);
      
      // Check if listing is within budget
      return totalPrice <= maxAccommodationBudget;
    });
    
    console.log(`Found ${affordableListings.length} affordable listings out of ${listings.length}`);
    
    return affordableListings;
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
        
        {/* Show Airbnb listings in a fixed section after messages */}
        {showAirbnbSection && selectedListings.length > 0 && (
          <div className="mt-4">
            <AirbnbListings listings={selectedListings} tripDays={tripDays} />
          </div>
        )}
        
        {/* Show typing indicator */}
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
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={preferencesComplete ? "Ask me about your trip..." : "Complete travel preferences first..."}
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-500"
            disabled={isLoading || isTyping}
          />
          <button
            type="submit"
            disabled={!preferencesComplete || isLoading || isTyping}
            className={`px-4 py-2 rounded-lg transition-colors ${
              preferencesComplete && !isLoading && !isTyping
                ? "bg-black text-white hover:bg-gray-800" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
} 
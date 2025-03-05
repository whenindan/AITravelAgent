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
  const { travelPreferences, selectedListings } = useTravel();

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

  // Auto-scroll to bottom when messages change, but only within the chat container
  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      // Only scroll the chat container, not the whole page
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, currentTypingText]);

  // Add initial welcome message when preferences are complete
  useEffect(() => {
    const preferencesComplete = areTravelPreferencesComplete();
    
    if (preferencesComplete && messages.length === 0 && selectedListings.length > 0) {
      // Add a slight delay before starting the welcome message
      const timer = setTimeout(() => {
        const welcomeMessage = `Hi there! I see you're planning a trip to ${travelPreferences.destination} from ${travelPreferences.startDate} to ${travelPreferences.endDate} for ${travelPreferences.travelers} traveler(s) with a budget of ${travelPreferences.totalBudget}. I've found some great Airbnb listings that might interest you. Would you like to see them?`;
        
        simulateTyping(welcomeMessage, false); // Don't show listings immediately
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [travelPreferences, selectedListings, messages.length]);

  // Function to simulate typing effect
  const simulateTyping = (text: string, showListings: boolean = false) => {
    setIsTyping(true);
    setCurrentTypingText('');
    
    let i = 0;
    const typingSpeed = 20; // slightly slower for better readability
    
    // Clear any existing intervals to prevent conflicts
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setCurrentTypingText(prev => prev + text.charAt(i));
        i++;
        
        // Scroll only within the chat container
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: text,
          showListings
        }]);
        setCurrentTypingText('');
      }
    }, typingSpeed);

    // Store the interval ID to clear it if component unmounts
    return () => clearInterval(typingInterval);
  };

  // Add this function to check for affirmative responses
  const isAffirmativeResponse = (text: string): boolean => {
    const affirmativeWords = ['yes', 'yeah', 'sure', 'ok', 'okay', 'yep', 'please', 'show', 'see'];
    const lowerText = text.toLowerCase();
    
    return affirmativeWords.some(word => lowerText.includes(word));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !areTravelPreferencesComplete()) return;

    const userInput = input.trim();
    const newMessage: Message = {
      role: 'user',
      content: userInput,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    // Check if this is an affirmative response to the "Would you like to see listings?" question
    const isFirstUserMessage = messages.length === 1 && messages[0].role === 'assistant';
    const isAskingAboutListings = messages.length > 0 && 
                                 messages[messages.length - 1].role === 'assistant' && 
                                 messages[messages.length - 1].content.includes('Would you like to see them?');
    
    if ((isFirstUserMessage || isAskingAboutListings) && isAffirmativeResponse(userInput)) {
      // User said yes to seeing listings
      setIsLoading(false);
      
      setTimeout(() => {
        simulateTyping("Great! Here are 5 Airbnb listings at different price points for your trip:", true);
      }, 500);
      
      return;
    }

    try {
      // Call the backend API - make sure the URL is correct
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userInput }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get response from server: ${response.status}`);
      }

      const data = await response.json();
      
      // Check if the user is asking to see listings
      const showListings = userInput.toLowerCase().includes('listing') || 
                          userInput.toLowerCase().includes('airbnb') ||
                          userInput.toLowerCase().includes('show me') ||
                          userInput.toLowerCase().includes('see');
      
      // Add a small delay before the assistant starts typing
      setTimeout(() => {
        simulateTyping(data.response, showListings);
      }, 500);
      
    } catch (error) {
      console.error('Error:', error);
      
      // Add a small delay before the error message
      setTimeout(() => {
        simulateTyping('Sorry, I encountered an error. Please try again later.');
      }, 500);
      
    } finally {
      setIsLoading(false);
    }
  };

  // Check if preferences are complete
  const preferencesComplete = areTravelPreferencesComplete();

  // Calculate trip duration
  const calculateTripDays = () => {
    if (!travelPreferences.startDate || !travelPreferences.endDate) return 0;
    
    const start = new Date(travelPreferences.startDate);
    const end = new Date(travelPreferences.endDate);
    
    // Calculate the difference in milliseconds
    const diffTime = Math.abs(end.getTime() - start.getTime());
    
    // Convert to days
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const tripDays = calculateTripDays();

  // Function to handle showing listings when user asks for them
  const handleShowListings = () => {
    if (input.toLowerCase().includes('show') || 
        input.toLowerCase().includes('see') || 
        input.toLowerCase().includes('listing') || 
        input.toLowerCase().includes('airbnb')) {
      return true;
    }
    return false;
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div 
        ref={chatContainerRef}
        className="h-[500px] overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message, index) => (
          <div key={index}>
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
            
            {/* Show Airbnb listings after certain assistant messages */}
            {message.role === 'assistant' && 
             message.showListings && 
             selectedListings.length > 0 && 
             index === messages.length - 1 && (
              <div className="mt-4 ml-4">
                <AirbnbListings listings={selectedListings} tripDays={tripDays} />
              </div>
            )}
          </div>
        ))}
        
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
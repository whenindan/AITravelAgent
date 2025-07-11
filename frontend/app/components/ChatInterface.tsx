'use client';

import { useState, useEffect, useRef } from 'react';
import { useTravelPreferencesStore } from '../store/travel-preferences';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { BubbleButton } from './ui/bubble-button';
import { IoMdSend } from "react-icons/io";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  qnaStep?: string;
  qnaOptions?: Array<{
    value: string;
    label: string;
  }>;
  showCustomInput?: boolean;
  customInputType?: 'text' | 'date-range';
  customInputLabel?: string;
  selectedOption?: string;
  isAnswered?: boolean;
  showItinerary?: boolean;
  expectingCustomInput?: boolean;
}

interface QnAState {
  [key: string]: {
    answered: boolean;
    answer: string;
  };
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState('');
  const [questionPath, setQuestionPath] = useState<'A' | 'B' | null>(null);
  const [qnaState, setQnaState] = useState<QnAState>({});
  const [generatedItinerary, setGeneratedItinerary] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showDateDialog, setShowDateDialog] = useState(false);
  const [currentExpectingInput, setCurrentExpectingInput] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // QnA Flow state
  const { 
    currentStep, 
    destinations,
    vibes,
    budgetLevel,
    climatePreference,
    travelDates,
    travelPartySize,
    mustDo,
    setCurrentStep,
    addDestination,
    setHasDestination,
    setBudgetLevel,
    setClimatePreference,
    setTravelDates,
    setTripLength,
    setTravelPartySize,
    addVibe,
    addMustDo,
    completeQnA
  } = useTravelPreferencesStore();
  
  // Initialize QnA flow when component mounts
  useEffect(() => {
    if (messages.length === 0) {
      // Start with initial greeting and path selection
      const greeting = "Hello! I'm your AI travel assistant. Let me help you plan your perfect trip! 🌍";
      simulateTyping(greeting, false, () => {
        setTimeout(() => {
          askInitialQuestion();
        }, 500);
      });
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, currentTypingText]);

  const askInitialQuestion = () => {
    const pathQuestion = "Do you already have a destination in mind, or would you like me to recommend some places based on your preferences?";
    const pathOptions = [
      { value: 'has_destination', label: 'I have a destination' },
      { value: 'need_destination', label: 'Recommend destinations' }
    ];
    
    simulateTyping(pathQuestion, false, () => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: pathQuestion,
        qnaStep: 'path_selection',
        qnaOptions: pathOptions,
        isAnswered: false
      }]);
    });
  };

  const handleQnAResponse = (step: string, value: string, label: string) => {
    // Check if this question was already answered
    if (qnaState[step]?.answered) {
      return;
    }

    // Mark question as answered
    setQnaState(prev => ({
      ...prev,
      [step]: { answered: true, answer: value }
    }));

    // Mark the message as answered
    setMessages(prev => prev.map(msg => 
      msg.qnaStep === step ? { ...msg, isAnswered: true } : msg
    ));

    // Add user response to messages
    setMessages(prev => [...prev, {
      role: 'user',
      content: label,
      selectedOption: value
    }]);

    // Process the response and ask next question
    setTimeout(() => {
      processQnAStep(step, value);
    }, 500);
  };

  const calculateTripDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const processQnAStep = (step: string, value: string) => {
    switch (step) {
      case 'path_selection':
        if (value === 'has_destination') {
          setQuestionPath('A');
          setHasDestination(true);
          setCurrentStep(1);
          askDestinationQuestion();
        } else {
          setQuestionPath('B');
          setHasDestination(false);
          setCurrentStep(1);
          askVibesQuestion();
        }
        break;
      
      case 'destination':
        addDestination(value);
        setCurrentStep(2);
        askDatesQuestion();
        break;
      
      case 'vibes':
        addVibe(value as any);
        setCurrentStep(2);
        askBudgetQuestion();
        break;
      
      case 'budget':
        setBudgetLevel(value as any);
        setCurrentStep(3);
        askClimateQuestion();
        break;
      
      case 'climate':
        setClimatePreference(value as any);
        setCurrentStep(4);
        askDatesQuestion();
        break;
      
      case 'dates':
        if (value.includes('|')) {
          const [start, end] = value.split('|');
          setTravelDates({ start, end });
          // Calculate and set trip length automatically
          const days = calculateTripDays(start, end);
          setTripLength(days);
        }
        setCurrentStep(5);
        askPartySizeQuestion();
        break;
      
      case 'party_size':
        setTravelPartySize(parseInt(value));
        setCurrentStep(6);
        askActivitiesQuestion();
        break;
      
      case 'activities':
        if (value === 'done') {
          completeQnAFlow();
          return;
        }
        addMustDo(value);
        // Don't ask again, just acknowledge the addition
        const ackMessage = `Great! I've added "${value}" to your activities. You can add more activities by typing them, or say "done" when you're finished.`;
        simulateTyping(ackMessage);
        setCurrentExpectingInput('activities');
        break;
      
      case 'destination_selected':
        // For path B - destination recommendation
        addDestination(value);
        setCurrentStep(7);
        askPartySizeQuestion();
        break;
    }
  };

  const askDestinationQuestion = () => {
    const question = "What's your destination? ✈️";
    
    simulateTyping(question, false, () => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: question + "\n\nPlease type your destination below:",
        qnaStep: 'destination',
        expectingCustomInput: true,
        isAnswered: false
      }]);
      setCurrentExpectingInput('destination');
    });
  };

  const askVibesQuestion = () => {
    const question = "What kind of vibe are you looking for? 🌟";
    const options = [
      { value: 'Adventure', label: 'Adventure & Outdoor' },
      { value: 'Relaxing', label: 'Relaxation & Wellness' },
      { value: 'Culture', label: 'Culture & History' },
      { value: 'Romantic', label: 'Romantic & Intimate' },
      { value: 'Foodie', label: 'Food & Culinary' }
    ];
    
    simulateTyping(question, false, () => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: question + "\n\nHere are some popular options, or feel free to describe your own vibe:",
        qnaStep: 'vibes',
        qnaOptions: options,
        expectingCustomInput: true,
        isAnswered: false
      }]);
      setCurrentExpectingInput('vibes');
    });
  };

  const askBudgetQuestion = () => {
    const question = "What's your budget range? 💰";
    const options = [
      { value: 'Budget', label: 'Budget ($500-$1,500)' },
      { value: 'Mid-range', label: 'Mid-range ($1,500-$3,000)' },
      { value: 'Luxury', label: 'Luxury ($3,000+)' }
    ];
    
    simulateTyping(question, false, () => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: question + "\n\nHere are some common ranges, or tell me your specific budget:",
        qnaStep: 'budget',
        qnaOptions: options,
        expectingCustomInput: true,
        isAnswered: false
      }]);
      setCurrentExpectingInput('budget');
    });
  };

  const askClimateQuestion = () => {
    const question = "What's your preferred climate? 🌡️";
    const options = [
      { value: 'Warm', label: 'Warm & Tropical' },
      { value: 'Cold', label: 'Cold & Snowy' },
      { value: "Doesn't matter", label: 'No preference' }
    ];
    
    simulateTyping(question, false, () => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: question,
        qnaStep: 'climate',
        qnaOptions: options,
        isAnswered: false
      }]);
    });
  };

  const askDatesQuestion = () => {
    const question = "When are you planning to travel? 📅";
    
    simulateTyping(question, false, () => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: question + "\n\nClick the button below to select your travel dates:",
        qnaStep: 'dates',
        qnaOptions: [{ value: 'date_picker', label: '📅 Select travel dates' }],
        isAnswered: false
      }]);
    });
  };

  const askPartySizeQuestion = () => {
    const question = "How many people are traveling? 👥";
    const options = [
      { value: '1', label: 'Solo traveler' },
      { value: '2', label: 'Couple' },
      { value: '3', label: '3 people' },
      { value: '4', label: '4 people' },
      { value: '5', label: '5+ people' }
    ];
    
    simulateTyping(question, false, () => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: question,
        qnaStep: 'party_size',
        qnaOptions: options,
        isAnswered: false
      }]);
    });
  };

  const askActivitiesQuestion = () => {
    const question = "What activities are you most interested in? 🎯";
    
    const allActivities = [
      { value: 'Sightseeing & Tours', label: 'Sightseeing & Tours' },
      { value: 'Museums & Galleries', label: 'Museums & Galleries' },
      { value: 'Food Tours', label: 'Food Tours' },
      { value: 'Outdoor Adventures', label: 'Outdoor Adventures' },
      { value: 'Nightlife & Bars', label: 'Nightlife & Bars' },
      { value: 'Shopping', label: 'Shopping' },
      { value: 'Beaches & Swimming', label: 'Beaches & Swimming' },
      { value: 'Hiking & Nature', label: 'Hiking & Nature' },
      { value: 'Photography', label: 'Photography' },
      { value: 'Spa & Relaxation', label: 'Spa & Relaxation' }
    ];
    
    // Always show done option
    const options = [...allActivities, { value: 'done', label: '✅ Done selecting activities' }];
    
    simulateTyping(question, false, () => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: question + (mustDo.length > 0 ? `\n\nSelected so far: ${mustDo.join(', ')}\n\nChoose more from the options below, type custom activities, or click Done:` : "\n\nChoose from the popular options below, or type your own activities:"),
        qnaStep: 'activities',
        qnaOptions: options,
        expectingCustomInput: true,
        isAnswered: false
      }]);
      setCurrentExpectingInput('activities');
    });
  };

  const handleDateSelection = () => {
    setShowDateDialog(true);
  };

  const submitDateRange = () => {
    if (!dateRange.start || !dateRange.end) return;

    const displayValue = `${dateRange.start} to ${dateRange.end}`;
    const value = `${dateRange.start}|${dateRange.end}`;

    // Mark question as answered
    setQnaState(prev => ({
      ...prev,
      ['dates']: { answered: true, answer: value }
    }));

    // Mark the message as answered
    setMessages(prev => prev.map(msg => 
      msg.qnaStep === 'dates' ? { ...msg, isAnswered: true } : msg
    ));

    // Add user response to messages
    setMessages(prev => [...prev, {
      role: 'user',
      content: displayValue
    }]);

    // Close dialog and reset
    setShowDateDialog(false);
    setDateRange({ start: '', end: '' });
    setCurrentExpectingInput('');

    // Process the response
    setTimeout(() => {
      processQnAStep('dates', value);
    }, 500);
  };

  const completeQnAFlow = async () => {
    const completionMessage = "Perfect! I have all the information I need to plan your amazing trip! 🎉 Let me generate your personalized itinerary now...";
    
    // Mark activities as answered
    setQnaState(prev => ({
      ...prev,
      ['activities']: { answered: true, answer: 'done' }
    }));
    
    setMessages(prev => prev.map(msg => 
      msg.qnaStep === 'activities' ? { ...msg, isAnswered: true } : msg
    ));
    
    setCurrentExpectingInput('');
    
    simulateTyping(completionMessage, false, () => {
      setTimeout(async () => {
        setIsLoading(true);
        
        try {
          // Calculate trip length from dates
          const tripDays = travelDates ? calculateTripDays(travelDates.start, travelDates.end) : 7;
          
          // Prepare preferences for API call
          const preferences = {
            destination: destinations[0]?.name || '',
            dates: travelDates ? `${travelDates.start} to ${travelDates.end}` : '',
            tripLength: tripDays,
            partySize: travelPartySize,
            budget: budgetLevel,
            vibes: vibes.join(', '),
            climate: climatePreference,
            activities: mustDo
          };

          console.log('Sending preferences to API:', preferences);

          // Call the itinerary generation API
          const response = await fetch('/api/itinerary', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ preferences }),
          });

          console.log('API Response status:', response.status);

          if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(errorData.response || 'Failed to generate itinerary');
          }

          const data = await response.json();
          console.log('API Response data:', data);
          
          setGeneratedItinerary(data.itinerary);
          
          // Mark QnA as complete
          completeQnA();
          
          const finalMessage = "Here's your personalized itinerary! 🌟 I've crafted it based on all your preferences. Feel free to ask me any questions about your trip or request modifications!";
          simulateTyping(finalMessage, false, () => {
            // Add the itinerary as a message
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: data.itinerary,
              showItinerary: true
            }]);
          });
        } catch (error) {
          console.error('Error generating itinerary:', error);
          simulateTyping("I apologize, but I encountered an error generating your itinerary. The backend service might not be running. Please make sure the Node.js backend is started with your OpenAI API key configured.");
        } finally {
          setIsLoading(false);
        }
      }, 2000);
    });
  };

  // Function to simulate typing effect
  const simulateTyping = (text: string, showListings: boolean = false, callback?: () => void) => {
    setIsTyping(true);
    setCurrentTypingText('');
    
    let i = 0;
    const typingSpeed = 20;
    
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setCurrentTypingText(prev => text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        
        if (callback) {
          callback();
        } else {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: text
          }]);
        }
      }
    }, typingSpeed);
  };

  // Handle form submission for chat and custom inputs
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading || isTyping) return;

    const userMessage = input.trim();
    setInput('');

    // Check if we're expecting a custom input for QnA
    if (currentExpectingInput) {
      // Handle the custom input based on what we're expecting
      handleCustomQnAInput(currentExpectingInput, userMessage);
      return;
    }

    // Add user message for regular chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

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
        data = { 
          response: "I'd be happy to help with that! Is there anything specific about your travel plans you'd like to discuss?"
        };
      }
      
      simulateTyping(data.response || "I'd be happy to help with that!");
    } catch (error) {
      console.error('Error:', error);
      simulateTyping("I'd be happy to help you with your travel planning! What would you like to know?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomQnAInput = (step: string, value: string) => {
    // Mark question as answered
    setQnaState(prev => ({
      ...prev,
      [step]: { answered: true, answer: value }
    }));

    // Mark the message as answered
    setMessages(prev => prev.map(msg => 
      msg.qnaStep === step ? { ...msg, isAnswered: true } : msg
    ));

    // Add user response to messages
    setMessages(prev => [...prev, {
      role: 'user',
      content: value
    }]);

    // Clear expecting input
    setCurrentExpectingInput('');

    // Process the response
    setTimeout(() => {
      processQnAStep(step, value);
    }, 500);
  };

  return (
    <div className="space-y-8 w-full flex flex-col items-center">
      {/* Logo text in top left corner */}
      <div className="w-full px-8 py-6 absolute top-0 left-0 z-50">
        <div className="flex items-center">
          <h2 className="text-3xl md:text-3xl font-bold tracking-tight text-white">
            voyagen
          </h2>
        </div>
      </div>

      {/* Space for pushing content down */}
      <div className="h-64 w-full"></div>
      
      {/* Central Greeting */}
      <div className="mb-20 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          Good evening, Aditya.
        </h1>
        <p className="text-gray-400 text-xl md:text-2xl mt-2 font-normal">
          What's the vacation stop?
        </p>
      </div>
      
      {/* Chat Interface */}
      <div className="flex flex-col w-full sm:w-[900px] md:w-[1000px] bg-[#18181a] rounded-3xl shadow-lg overflow-hidden">
        <div 
          ref={chatContainerRef} 
          className="flex-1 p-6 overflow-y-auto bg-transparent h-[500px] max-h-[70vh]"
          style={{ scrollBehavior: 'smooth' }}
        >
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
                      ? 'bg-[#303031] text-white rounded-tr-none ml-auto shadow-sm'
                      : 'bg-transparent text-white rounded-tl-none'
                  }`}
                >
                  {message.showItinerary ? (
                    <div className="bg-[#2a2a2a] p-4 rounded-lg border border-gray-700">
                      <h3 className="text-lg font-semibold mb-3 text-blue-400">🗺️ Your Personalized Itinerary</h3>
                      <div className="prose prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans">
                          {message.content}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    message.content
                  )}
                  
                  {/* Render QnA options as bubble buttons */}
                  {message.qnaOptions && !message.isAnswered && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.qnaOptions.map((option, optionIndex) => (
                        <BubbleButton
                          key={optionIndex}
                          variant={option.value === 'done' ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => {
                            if (option.value === 'date_picker') {
                              handleDateSelection();
                            } else {
                              handleQnAResponse(message.qnaStep!, option.value, option.label);
                            }
                          }}
                        >
                          {option.label}
                        </BubbleButton>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
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
          
          {/* Loading indicator for itinerary generation */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[75%] rounded-lg px-4 py-3 bg-transparent text-white rounded-tl-none">
                <div className="flex items-center space-x-2">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-white"></div>
                  <span>Generating your personalized itinerary...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <div className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="flex flex-col bg-[#272727] rounded-3xl p-2 pl-4 pb-4">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <button type="button" className="flex items-center bg-[#1F1F1F] rounded-full px-2 py-1.5 text-gray-300 hover:bg-[#333] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
              </div>
              
              <div className="relative flex-1">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading || isTyping}
                  placeholder={
                    currentExpectingInput 
                      ? `Type your ${currentExpectingInput === 'activities' ? 'activity or "done" to finish' : currentExpectingInput}...`
                      : isLoading || isTyping 
                        ? "Please wait..." 
                        : "Ask me anything about your trip..."
                  }
                  className="w-full border-none bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-none text-lg shadow-none focus:shadow-none"
                  style={{ boxShadow: 'none' }}
                />
              </div>
              
              <Button
                type="submit"
                disabled={isLoading || isTyping || !input.trim()}
                className="rounded-full bg-black hover:bg-[#1a1a1a] p-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <IoMdSend className="h-5 w-5 text-white" />
              </Button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Date Range Dialog */}
      <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select your travel dates</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full"
              />
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={submitDateRange}>
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
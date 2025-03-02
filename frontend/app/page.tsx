import ChatInterface from './components/ChatInterface';
import TravelPreferences from './components/TravelPreferences';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-50">
      {/* Hero Section */}
      <div className="w-full bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Your AI Travel Companion
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-300">
              Plan your perfect trip with our intelligent travel assistant. Just tell us your preferences, and we'll create your dream itinerary.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Chat Interface */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-black">Chat with Your Travel Assistant</h2>
            <ChatInterface />
          </div>

          {/* Right Column - Travel Preferences */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-black">Your Travel Preferences</h2>
            <TravelPreferences />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 AI Travel Agent. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

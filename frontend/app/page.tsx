import { TravelProvider } from './context/TravelContext';
import ChatInterface from './components/ChatInterface';
import BudgetDisplay from './components/BudgetDisplay';

export default function Home() {
  return (
    <TravelProvider>
      <main className="min-h-screen bg-[#18181a] flex flex-col justify-center items-center">
        {/* Main Content */}
        <div className="w-full max-w-7xl px-4 py-0 flex-1 flex flex-col justify-center">
          {/* Chat Interface */}
          <div className="flex flex-col items-center justify-center flex-1" id="chat-section">
            <div className="flex justify-center w-full">
              <ChatInterface />
            </div>
          </div>
          
          {/* Budget Display Section - Hidden initially */}
          <div className="hidden">
            <BudgetDisplay />
          </div>
        </div>

        {/* Simplified Footer */}
        <footer className="w-full py-4 text-center text-gray-500 text-sm">
          <p>&copy; 2024 AI Travel Agent</p>
        </footer>
      </main>
    </TravelProvider>
  );
}

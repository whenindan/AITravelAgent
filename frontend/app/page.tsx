'use client';

import { Suspense } from 'react';
import { TravelProvider } from './context/TravelContext';
import ChatInterface from './components/ChatInterface';

export default function Home() {
  return (
    <TravelProvider>
      <main className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]">
        <div className="container mx-auto px-4 py-8">
          <Suspense fallback={<div>Loading...</div>}>
            <ChatInterface />
          </Suspense>
        </div>
      </main>
    </TravelProvider>
  );
}

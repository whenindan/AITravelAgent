'use client';

import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: Message = {
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');

    // TODO: Add API call to backend here
    const aiResponse: Message = {
      role: 'assistant',
      content: 'I\'m processing your travel request...',
    };
    setMessages((prev) => [...prev, aiResponse]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="h-[500px] overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
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
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me about your dream vacation..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 
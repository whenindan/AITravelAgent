import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    // Connect to the backend chatbot service
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    
    const response = await fetch(`${backendUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    
    if (!response.ok) {
      // Fall back to a simple response if the backend fails
      return NextResponse.json({
        response: "I'm having trouble connecting to my backend services right now. Can you ask me something else or try again later?"
      });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in chat API:', error);
    
    // Return a friendly error response
    return NextResponse.json(
      { response: "Sorry, I encountered an error processing your request. Please try again." },
      { status: 200 } // Still return 200 to avoid frontend errors
    );
  }
} 
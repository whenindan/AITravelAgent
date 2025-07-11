import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, conversationHistory } = await request.json();
    
    // Connect to the new Node.js backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    
    const response = await fetch(`${backendUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message,
        conversationHistory: conversationHistory || []
      }),
    });
    
    if (!response.ok) {
      // Try to get error details from the backend
      let errorMessage = "I'm having trouble connecting to my backend services right now. Can you ask me something else or try again later?";
      
      try {
        const errorData = await response.json();
        if (errorData.response) {
          errorMessage = errorData.response;
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      
      return NextResponse.json({
        response: errorMessage
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
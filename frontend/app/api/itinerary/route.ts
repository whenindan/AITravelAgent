import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { preferences } = await request.json();
    
    if (!preferences) {
      return NextResponse.json({
        error: 'Preferences are required',
        response: 'Please provide travel preferences to generate an itinerary.'
      }, { status: 400 });
    }
    
    // Connect to the Node.js backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    
    const response = await fetch(`${backendUrl}/api/itinerary/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferences }),
    });
    
    if (!response.ok) {
      // Try to get error details from the backend
      let errorMessage = "I'm having trouble generating your itinerary right now. Please try again later.";
      
      try {
        const errorData = await response.json();
        if (errorData.response) {
          errorMessage = errorData.response;
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      
      return NextResponse.json({
        error: 'Backend error',
        response: errorMessage
      });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in itinerary API:', error);
    
    // Return a friendly error response
    return NextResponse.json(
      { 
        error: 'Internal server error',
        response: "Sorry, I encountered an error generating your itinerary. Please try again." 
      },
      { status: 200 } // Still return 200 to avoid frontend errors
    );
  }
} 
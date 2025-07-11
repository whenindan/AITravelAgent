import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Add a simple in-memory cache to avoid redundant file reads
const listingsCache = new Map();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get('destination');
  const budget = searchParams.get('budget');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const guests = searchParams.get('guests');
  
  if (!destination) {
    return NextResponse.json({ error: 'Destination is required' }, { status: 400 });
  }
  
  // Create a cache key
  const cacheKey = `${destination.toLowerCase()}_${checkIn}_${checkOut}_${guests}`;
  
  // Check if we have cached results
  if (listingsCache.has(cacheKey)) {
    console.log(`Using cached listings for ${cacheKey}`);
    return NextResponse.json(listingsCache.get(cacheKey));
  }
  
  try {
    // Connect to the new Node.js backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('destination', destination);
    if (budget) params.append('budget', budget);
    if (checkIn) params.append('checkIn', checkIn);
    if (checkOut) params.append('checkOut', checkOut);
    if (guests) params.append('guests', guests);
    
    const response = await fetch(`${backendUrl}/api/listings?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Backend listings API error:', response.status, response.statusText);
      // Fall back to mock data
      const fallbackListings = generateMockListings(destination, 10);
      return NextResponse.json(fallbackListings);
    }
    
    const data = await response.json();
    
    // Extract listings from the backend response
    const backendListings = data.listings || [];
    
    // Map the listings to the format expected by the frontend
    const mappedListings = backendListings.map((listing: any, index: number) => {
      return {
        title: listing.title || `Listing in ${destination}`,
        price_text: listing.price_text || `$${Math.floor(Math.random() * 200) + 50} night`,
        url: listing.url || "https://www.airbnb.com/",
        rating: listing.rating || listing.rating_text || `${(Math.random() * 1 + 4).toFixed(1)}`,
        image_url: listing.image_url || listing.thumbnail || `https://images.unsplash.com/photo-${1500000000000 + index}?w=400&h=300&fit=crop&crop=entropy&auto=format`,
        fallback_image: `https://source.unsplash.com/featured/600x400/?${encodeURIComponent(destination)},accommodation&t=${Date.now() + index}`
      };
    });
    
    // Cache the results for future requests
    listingsCache.set(cacheKey, mappedListings);
    
    return NextResponse.json(mappedListings);
  } catch (error) {
    console.error('Error in listings API:', error);
    
    // Fall back to mock data
    const fallbackListings = generateMockListings(destination, 10);
    return NextResponse.json(fallbackListings);
  }
}

// Helper function to generate mock listings with images - more efficient version
function generateMockListings(destination: string, count: number) {
  const imageTypes = ['apartment', 'house', 'condo', 'villa', 'room', 'airbnb', 'rental', 'vacation'];
  const timestamp = Date.now(); // Use a single timestamp for all images
  
  return Array.from({ length: count }, (_, i) => {
    const pricePerNight = Math.floor(Math.random() * 200) + 50;
    const totalPrice = pricePerNight * 5;
    const imageType = imageTypes[i % imageTypes.length];
    
    return {
      title: `Beautiful ${imageType} in ${destination} #${i + 1}`,
      price_text: `$${pricePerNight} night · $${totalPrice} total`,
      url: "https://www.airbnb.com/",
      rating: `${(Math.random() * 1 + 4).toFixed(1)} (${Math.floor(Math.random() * 100) + 20})`,
      thumbnail: `https://source.unsplash.com/600x400/?${encodeURIComponent(destination)},${imageType}&t=${timestamp + i}`
    };
  });
} 
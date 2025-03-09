import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Add a simple in-memory cache to avoid redundant file reads
const listingsCache = new Map();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get('destination');
  const date = searchParams.get('date') || '';
  
  if (!destination) {
    return NextResponse.json({ error: 'Destination is required' }, { status: 400 });
  }
  
  // Create a cache key
  const cacheKey = `${destination.toLowerCase()}_${date}`;
  
  // Check if we have cached results
  if (listingsCache.has(cacheKey)) {
    console.log(`Using cached listings for ${cacheKey}`);
    return NextResponse.json(listingsCache.get(cacheKey));
  }
  
  try {
    let listingsData = null;
    
    // Define possible file paths to check
    const normalizedDestination = destination.replace(/\s+/g, '_');
    const possiblePaths = [
      // Most specific first
      path.join(process.cwd(), '..', 'backend', `airbnb_listings_${normalizedDestination}_${date}.json`),
      // Then any file for this destination
      ...fs.existsSync(path.join(process.cwd(), '..', 'backend')) 
        ? fs.readdirSync(path.join(process.cwd(), '..', 'backend'))
            .filter(file => file.startsWith(`airbnb_listings_${normalizedDestination}`))
            .map(file => path.join(process.cwd(), '..', 'backend', file))
        : []
    ];
    
    // Find the first existing file
    let filePath = null;
    for (const potentialPath of possiblePaths) {
      if (fs.existsSync(potentialPath)) {
        filePath = potentialPath;
        break;
      }
    }
    
    // If we found a file, read and parse it
    if (filePath) {
      try {
        const fileData = fs.readFileSync(filePath, 'utf8');
        const rawData = JSON.parse(fileData);
        
        // Extract listings - either from nested structure or direct array
        listingsData = (rawData.listings && Array.isArray(rawData.listings)) 
          ? rawData.listings 
          : (Array.isArray(rawData) ? rawData : null);
      } catch (error) {
        console.error("Error parsing file:", error);
      }
    }
    
    // If we still don't have listings data, use mock data
    if (!listingsData || listingsData.length === 0) {
      listingsData = generateMockListings(destination, 10);
    }
    
    // Map the listings with minimal processing
    const mappedListings = listingsData.map((listing, index) => {
      // Get the raw thumbnail URL
      const rawThumbnail = listing.thumbnail;
      
      // Log the raw thumbnail value
      console.log(`Raw thumbnail for listing ${index + 1}:`, rawThumbnail);
      
      // Generate a high-quality fallback image that will definitely work
      const fallbackImage = `https://source.unsplash.com/featured/600x400/?${encodeURIComponent(destination)},accommodation&t=${Date.now() + index}`;
      
      return {
        title: listing.title || `Listing in ${destination}`,
        price_text: listing.price_text || `$${Math.floor(Math.random() * 200) + 50} night`,
        url: listing.url || "https://www.airbnb.com/",
        rating: listing.rating || `${(Math.random() * 1 + 4).toFixed(1)}`,
        // Set both image properties for maximum compatibility
        image_url: rawThumbnail || fallbackImage,
        fallback_image: fallbackImage
      };
    });
    
    // Debug the final processed listings
    console.log(`Processed ${mappedListings.length} listings with thumbnails`);
    mappedListings.forEach((listing, i) => {
      console.log(`Final listing ${i + 1}: ${listing.title}, image: ${listing.image_url}`);
    });
    
    // Cache the results for future requests
    listingsCache.set(cacheKey, mappedListings);
    
    return NextResponse.json(mappedListings);
  } catch (error) {
    console.error('Error in listings API:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
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
'use client';

interface Listing {
  title: string;
  price_text: string;
  url: string;
}

interface AirbnbListingsProps {
  listings: Listing[];
  tripDays: number;
}

export default function AirbnbListings({ listings, tripDays = 1 }: AirbnbListingsProps) {
  if (!listings || listings.length === 0) {
    console.log("No listings to display");
    return null;
  }
  
  console.log(`Displaying ${listings.length} listings for ${tripDays} days`);

  // Function to extract numeric price from price_text
  const extractPrice = (priceText: string): number => {
    const match = priceText.match(/\$(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Calculate total price for the trip duration
  const calculateTotalPrice = (pricePerNight: number, days: number): string => {
    return `$${(pricePerNight * days).toLocaleString()}`;
  };

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-800">Recommended Airbnb Listings</h3>
      <div className="grid grid-cols-1 gap-3">
        {listings.map((listing, index) => {
          const pricePerNight = extractPrice(listing.price_text);
          const totalPrice = calculateTotalPrice(pricePerNight, tripDays);
          
          return (
            <div 
              key={index} 
              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex flex-col">
                <h4 className="font-medium text-gray-800 mb-2">{listing.title}</h4>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-gray-800 font-medium">{listing.price_text} per night</span>
                    <span className="text-gray-600 text-sm">Total: {totalPrice} for {tripDays} nights</span>
                  </div>
                  <a 
                    href={listing.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <span>View on Airbnb</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 
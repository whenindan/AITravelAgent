'use client';

interface Listing {
  title: string;
  price_text: string;
  url: string;
  rating?: string;
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
  
  console.log(`AirbnbListings component received ${listings.length} listings`);
  
  // Function to extract numeric price from price_text
  const extractPriceInfo = (priceText: string): { pricePerNight: number, totalPrice: number } => {
    // Extract price per night - look for the first dollar amount
    const nightMatch = priceText.match(/\$(\d+)/);
    const pricePerNight = nightMatch ? parseInt(nightMatch[1], 10) : 0;
    
    // Extract total price - find the first occurrence of "$X total"
    const totalRegex = /\$([0-9,]+)\s+total/i;
    const totalMatch = priceText.match(totalRegex);
    let totalPrice = 0;
    
    if (totalMatch) {
      // Remove commas and convert to number
      totalPrice = parseInt(totalMatch[1].replace(/,/g, ''), 10);
    } else {
      // If no total is found, calculate based on price per night
      totalPrice = pricePerNight * tripDays;
    }
    
    return { pricePerNight, totalPrice };
  };

  // Calculate total price with tax
  const calculateTotalWithTax = (totalPrice: number): number => {
    const taxRate = 0.08; // 8% tax
    return totalPrice + (totalPrice * taxRate);
  };

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-800">Recommended Airbnb Listings</h3>
      
      {/* Price estimate disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 text-sm text-blue-800">
        <p><strong>Note:</strong> The prices shown are estimates based on the information provided by Airbnb. 
        Actual prices may vary due to seasonal changes, additional fees, or host adjustments. 
        When you decide on a listing, please let me know the actual total cost so I can update your budget accordingly.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {listings.map((listing, index) => {
          console.log(`Rendering listing ${index + 1}: ${listing.title}`);
          const { pricePerNight, totalPrice } = extractPriceInfo(listing.price_text);
          const totalWithTax = calculateTotalWithTax(totalPrice);
          
          return (
            <div 
              key={index} 
              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex flex-col">
                <h4 className="font-medium text-gray-800 mb-2">{listing.title}</h4>
                {listing.rating && (
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm text-gray-600 ml-1">{listing.rating}</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-gray-800 font-medium">${pricePerNight} per night</span>
                  <span className="text-gray-600 text-sm">
                    ${totalPrice.toLocaleString()} total before taxes
                  </span>
                  <span className="text-gray-600 text-sm">
                    ${totalWithTax.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} total with taxes (8%)
                  </span>
                </div>
                <div className="mt-3 flex justify-end">
                  <a 
                    href={listing.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm bg-black text-white px-3 py-1 rounded hover:bg-gray-800 transition-colors"
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
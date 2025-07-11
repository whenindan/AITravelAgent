const express = require('express');
const router = express.Router();

// GET listings endpoint
router.get('/', async (req, res) => {
  try {
    const { destination, budget, checkIn, checkOut, guests = 1 } = req.query;

    if (!destination) {
      return res.status(400).json({
        error: 'Destination is required',
        message: 'Please provide a destination to search for listings.'
      });
    }

    // For now, return mock data - this will be replaced with actual scraping logic
    const mockListings = generateMockListings(destination, 10);

    res.json({
      listings: mockListings,
      query: {
        destination,
        budget,
        checkIn,
        checkOut,
        guests
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Listings API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch listings. Please try again later.'
    });
  }
});

// POST endpoint for more complex searches
router.post('/', async (req, res) => {
  try {
    const { destination, budget, dates, preferences = {} } = req.body;

    if (!destination) {
      return res.status(400).json({
        error: 'Destination is required',
        message: 'Please provide a destination to search for listings.'
      });
    }

    // For now, return mock data - this will be replaced with actual scraping logic
    const mockListings = generateMockListings(destination, 15);

    res.json({
      listings: mockListings,
      query: {
        destination,
        budget,
        dates,
        preferences
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Listings API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch listings. Please try again later.'
    });
  }
});

// Helper function to generate mock listings
function generateMockListings(destination, count = 10) {
  const accommodationTypes = ['apartment', 'house', 'condo', 'villa', 'studio', 'loft'];
  const listings = [];

  for (let i = 0; i < count; i++) {
    const pricePerNight = Math.floor(Math.random() * 200) + 50;
    const rating = (Math.random() * 1 + 4).toFixed(1);
    const reviewCount = Math.floor(Math.random() * 200) + 20;
    const accommodationType = accommodationTypes[Math.floor(Math.random() * accommodationTypes.length)];

    listings.push({
      id: `listing_${i + 1}`,
      title: `Beautiful ${accommodationType} in ${destination} #${i + 1}`,
      price_text: `$${pricePerNight} night`,
      price_per_night: pricePerNight,
      total_price: pricePerNight * 5, // Assuming 5 nights
      url: `https://www.airbnb.com/rooms/${Math.floor(Math.random() * 100000)}`,
      rating: rating,
      review_count: reviewCount,
      rating_text: `${rating} (${reviewCount} reviews)`,
      thumbnail: `https://images.unsplash.com/photo-${1500000000000 + i}?w=400&h=300&fit=crop&crop=entropy&auto=format`,
      image_url: `https://images.unsplash.com/photo-${1500000000000 + i}?w=400&h=300&fit=crop&crop=entropy&auto=format`,
      location: destination,
      accommodation_type: accommodationType,
      amenities: ['WiFi', 'Kitchen', 'Parking', 'Air conditioning'].slice(0, Math.floor(Math.random() * 4) + 1),
      instant_book: Math.random() > 0.5,
      host_superhost: Math.random() > 0.7
    });
  }

  return listings;
}

// Health check for listings service
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'listings',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 
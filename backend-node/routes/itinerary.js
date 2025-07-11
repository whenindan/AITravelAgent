const express = require('express');
const { OpenAI } = require('openai');
const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate itinerary endpoint
router.post('/generate', async (req, res) => {
  try {
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({
        error: 'Preferences are required',
        response: 'Please provide travel preferences to generate an itinerary.'
      });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        response: 'I apologize, but my AI services are not properly configured. Please ensure the OpenAI API key is set up.'
      });
    }

    // Build the prompt for itinerary generation
    const itineraryPrompt = `Generate a detailed, personalized travel itinerary based on these preferences:

**Travel Details:**
- Destination: ${preferences.destination || 'Not specified'}
- Travel Dates: ${preferences.dates || 'Not specified'}
- Trip Length: ${preferences.tripLength || 'Not specified'} days
- Party Size: ${preferences.partySize || 'Not specified'} people
- Budget: ${preferences.budget || 'Not specified'}

**Preferences:**
- Vibe: ${preferences.vibes || 'Not specified'}
- Climate Preference: ${preferences.climate || 'Not specified'}
- Activities: ${preferences.activities ? preferences.activities.join(', ') : 'Not specified'}

**Instructions:**
1. Create a day-by-day itinerary that matches their preferences
2. Include specific activities, attractions, and experiences
3. Consider their budget level and party size
4. Match the vibe they're looking for
5. Include practical tips like best times to visit attractions
6. Add food recommendations that fit their interests
7. Include approximate costs where relevant
8. Make it engaging and personalized
9. Format it clearly with headings and bullet points

Generate a comprehensive itinerary that they'll be excited to follow!`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert travel planner who creates detailed, personalized itineraries. Always provide comprehensive, well-structured itineraries with specific recommendations.' 
        },
        { role: 'user', content: itineraryPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const itinerary = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate an itinerary. Please try again.';

    res.json({
      itinerary: itinerary,
      preferences: preferences,
      model: 'gpt-4o-mini',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Handle specific OpenAI errors
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({
        error: 'Invalid API key',
        response: 'There seems to be an issue with my configuration. Please check the API key setup.'
      });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        response: 'I apologize, but I\'m experiencing high traffic right now. Please try again in a moment.'
      });
    }

    if (error.code === 'insufficient_quota') {
      return res.status(403).json({
        error: 'Insufficient quota',
        response: 'I apologize, but my AI services are temporarily unavailable due to quota limitations.'
      });
    }

    // Generic error response
    res.status(500).json({
      error: 'Internal server error',
      response: 'I apologize, but I encountered an unexpected error generating your itinerary. Please try again later.'
    });
  }
});

// Health check for itinerary service
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'itinerary',
    openai_configured: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 
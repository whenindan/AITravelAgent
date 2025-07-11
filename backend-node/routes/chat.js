const express = require('express');
const { OpenAI } = require('openai');
const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for the travel agent
const SYSTEM_PROMPT = `You are an expert AI travel agent assistant. Your role is to help users plan their perfect trips by providing personalized travel recommendations.

Key responsibilities:
- Help users find destinations, accommodations, and activities
- Provide budget-friendly travel advice
- Suggest itineraries based on user preferences
- Answer questions about travel requirements, weather, and local customs
- Be enthusiastic and helpful while maintaining professionalism

Guidelines:
- Always ask clarifying questions to better understand user needs
- Provide specific, actionable recommendations
- Consider budget constraints and travel dates
- Mention when you can help find Airbnb listings for specific destinations
- Be conversational and friendly
- If users ask about accommodation searches, let them know you can help find listings based on their preferences

Remember: You're here to make travel planning easier and more enjoyable!`;

// Chat endpoint
router.post('/', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        error: 'Message is required',
        response: 'Please provide a message to continue our conversation.'
      });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        response: 'I apologize, but my AI services are not properly configured. Please ensure the OpenAI API key is set up.'
      });
    }

    // Build conversation messages
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.map(msg => ({
        role: msg.role || (msg.isUser ? 'user' : 'assistant'),
        content: msg.content || msg.message
      })),
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';

    res.json({
      response: response,
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
      response: 'I apologize, but I encountered an unexpected error. Please try again later.'
    });
  }
});

// Health check for chat service
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'chat',
    openai_configured: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 
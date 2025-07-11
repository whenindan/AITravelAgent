const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const chatRoutes = require('./routes/chat');
const listingsRoutes = require('./routes/listings');
const itineraryRoutes = require('./routes/itinerary');

app.use('/api/chat', chatRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/itinerary', itineraryRoutes);

// Health check endpoint
app.get('/health-check', (req, res) => {
  res.json({ 
    status: 'healthy',
    message: 'AI Travel Agent Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Travel Agent Backend API',
    version: '1.0.0',
    endpoints: {
      chat: '/api/chat',
      listings: '/api/listings',
      itinerary: '/api/itinerary',
      health: '/health-check'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `${req.method} ${req.originalUrl} not found`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Travel Agent Backend server running on port ${PORT}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health-check`);
}); 
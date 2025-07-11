# AI Travel Agent - Node.js Backend

A Node.js/Express backend for the AI Travel Agent application with OpenAI integration.

## Features

- 🤖 OpenAI GPT-4o-mini integration for intelligent travel assistance
- 🏠 Airbnb listings API (mock data for now, ready for scraping integration)
- 🔒 Security middleware (Helmet, CORS)
- 📊 Request logging with Morgan
- 🚀 Fast and lightweight Express server
- 🔧 Environment-based configuration

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` file and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Start the server**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:8000`

## API Endpoints

### Chat
- `POST /api/chat` - Send message to AI travel agent
- `GET /api/chat/health` - Check chat service health

### Listings
- `GET /api/listings` - Get accommodation listings
- `POST /api/listings` - Advanced listing search
- `GET /api/listings/health` - Check listings service health

### Health Check
- `GET /health-check` - Overall server health
- `GET /` - API information

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | **Required** |
| `PORT` | Server port | `8000` |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `CORS_ORIGIN` | CORS allowed origins | `http://localhost:3000` |

## API Usage Examples

### Chat with AI
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to travel to Paris for 5 days with a budget of $2000"}'
```

### Get Listings
```bash
curl "http://localhost:8000/api/listings?destination=Paris&budget=2000&guests=2"
```

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload

### Dependencies
- **express** - Web framework
- **openai** - OpenAI API client
- **cors** - Cross-origin resource sharing
- **helmet** - Security middleware
- **morgan** - HTTP request logger
- **dotenv** - Environment variable loader

## Next Steps

1. **Add Airbnb Scraping**: Replace mock data with actual scraping logic
2. **Add Database**: Store user preferences and conversation history
3. **Add Authentication**: User accounts and session management
4. **Add Flight Search**: Integrate flight search APIs
5. **Add Caching**: Redis for API response caching

## Troubleshooting

- **"OpenAI API key not configured"**: Make sure your `.env` file has the correct `OPENAI_API_KEY`
- **CORS errors**: Check that `FRONTEND_URL` matches your frontend development server
- **Port conflicts**: Change the `PORT` environment variable if 8000 is in use 
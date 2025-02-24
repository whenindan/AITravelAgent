# AI Travel Agent

An AI-powered travel agent application that helps users plan their trips by scraping Airbnb listings based on user preferences.

# test

## Project Structure

```
Travel_agent_app/
├── frontend/           # Next.js frontend application
│   └── ai-travel-agent/
│       ├── app/       # Next.js app directory
│       └── ...
└── backend/           # FastAPI backend application
    ├── airbnb/        # Airbnb scraper module
    ├── main.py        # FastAPI application
    └── requirements.txt
```

## Setup and Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Run the start script:
```bash
./start.sh
```

This will:
- Create a virtual environment
- Install required dependencies
- Start the FastAPI server

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend/ai-travel-agent
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Features

- Modern, responsive UI built with Next.js and Tailwind CSS
- Real-time Airbnb listing scraping
- User preference-based search
- Interactive chat interface
- Travel preferences form with:
  - Destination input
  - Budget settings
  - Date selection
  - Number of travelers
  - Interest selection

## Technologies Used

- Frontend:
  - Next.js 13+
  - React
  - TypeScript
  - Tailwind CSS

- Backend:
  - FastAPI
  - Python
  - Selenium
  - Pydantic

## Development

The application runs on:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

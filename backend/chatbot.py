from fastapi import FastAPI, APIRouter, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import logging
import json
import os
from openai import OpenAI
from dotenv import load_dotenv
import traceback


# Load environment variables
load_dotenv()


# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI client without explicitly passing the API key
# This will automatically use the OPENAI_API_KEY environment variable
try:
    logger.info("Initializing OpenAI client...")
    client = OpenAI()
    
    # Test the client with a simple request
    logger.info("Testing OpenAI client...")
    test_response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Hello"}],
        max_tokens=5
    )
    logger.info(f"OpenAI client test successful: {test_response.choices[0].message.content}")
except Exception as e:
    logger.error(f"Error initializing OpenAI client: {str(e)}")
    logger.error(traceback.format_exc())  # Print full traceback
    client = None

# Create a router for chat endpoints
chat_router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

# System message to define the AI assistant's behavior
SYSTEM_MESSAGE = """
You are an AI travel assistant. Your job is to help users plan their trips by:
1. Suggesting destinations based on their preferences
2. Recommending activities, attractions, and local experiences
3. Providing information about accommodations, transportation, and budgeting
4. Offering tips on local customs, weather, and what to pack

Be friendly, enthusiastic, and knowledgeable about global travel destinations.
If you don't know something specific, be honest and suggest alternatives.
"""

@chat_router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint that uses OpenAI to generate responses
    """
    try:
        logger.info(f"Received chat request: {request.message}")
        
        # Check if OpenAI client is properly initialized
        if client is None:
            logger.error("OpenAI client not initialized")
            return ChatResponse(response="I'm sorry, but I'm having trouble connecting to my brain right now. Please check the server logs for details on the OpenAI API key issue.")
        
        try:
            # Call OpenAI API
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": SYSTEM_MESSAGE},
                    {"role": "user", "content": request.message}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            # Extract the response text
            response_text = response.choices[0].message.content
            logger.info(f"Generated response: {response_text[:50]}...")
            
            return ChatResponse(response=response_text)
        except Exception as api_error:
            logger.error(f"OpenAI API error: {str(api_error)}")
            logger.error(traceback.format_exc())
            # Fallback response if OpenAI call fails
            return ChatResponse(response="I'm sorry, I encountered an issue while processing your request. Please check the server logs for details.")
            
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        # Return a response instead of raising an exception to prevent 500 errors
        return ChatResponse(response="I apologize, but I'm experiencing technical difficulties. Please check the server logs for details.")

@chat_router.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # Store conversation history
    conversation_history = [
        {"role": "system", "content": SYSTEM_MESSAGE}
    ]
    
    try:
        while True:
            # Receive message from client
            user_message = await websocket.receive_text()
            logger.info(f"Received WebSocket message: {user_message[:50]}...")
            
            # Add user message to conversation history
            conversation_history.append({"role": "user", "content": user_message})
            
            # Check if OpenAI client is properly initialized
            if client is None:
                await websocket.send_text("I'm sorry, but my connection to OpenAI is not configured properly. Please check the server logs for details on the API key issue.")
                continue
            
            try:
                # Call OpenAI API
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=conversation_history,
                    temperature=0.7,
                    max_tokens=500
                )
                
                # Extract the response text
                response_text = response.choices[0].message.content
                
                # Add assistant response to conversation history
                conversation_history.append({"role": "assistant", "content": response_text})
                
                # Keep conversation history at a reasonable size (last 10 messages)
                if len(conversation_history) > 11:  # system message + 10 conversation turns
                    conversation_history = [conversation_history[0]] + conversation_history[-10:]
                
                await websocket.send_text(response_text)
            except Exception as api_error:
                logger.error(f"OpenAI API error in WebSocket: {str(api_error)}")
                logger.error(traceback.format_exc())
                await websocket.send_text("I'm sorry, I encountered an issue while processing your request. Please check the server logs for details.")
                
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        logger.error(traceback.format_exc())
        try:
            await websocket.send_text(f"Error: {str(e)}")
        except:
            logger.error("Could not send error message to WebSocket")

# Create the main FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include the chat router with a prefix
app.include_router(chat_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
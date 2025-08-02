#!/usr/bin/env python
"""
Simple test to verify WebSocket connections work
"""
import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://127.0.0.1:8000/ws/video_call/test-room/?username=test_user"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("WebSocket connected successfully!")
            
            # Send a test message
            test_message = {
                "type": "chat_message",
                "data": {
                    "content": "Hello from test client!"
                }
            }
            
            await websocket.send(json.dumps(test_message))
            print("Test message sent!")
            
            # Wait for response
            response = await websocket.recv()
            print(f"Received response: {response}")
            
    except Exception as e:
        print(f"WebSocket test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket()) 
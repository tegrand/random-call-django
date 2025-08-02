import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import VideoCall, User

User = get_user_model()

class VideoCallConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print(f"WebSocket connect attempt: {self.scope}")
        
        # Accept the connection immediately
        await self.accept()
        print(f"WebSocket connection accepted")
        
        # Get call ID from URL
        self.call_id = self.scope['url_route']['kwargs']['call_id']
        self.room_group_name = f'video_call_{self.call_id}'
        
        # Get username from query params
        query_string = self.scope.get('query_string', b'').decode()
        username = None
        if query_string:
            params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
            username = params.get('username')
        
        self.username = username
        print(f"User {username} connecting to call {self.call_id}")
        
        # Join the room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        print(f"Added to room group: {self.room_group_name}")
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to video call',
            'call_id': self.call_id,
            'username': self.username
        }))

    async def disconnect(self, close_code):
        print(f"WebSocket disconnect: {close_code}")
        
        # Leave the room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        print(f"Received message: {text_data}")
        
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'webrtc_signal':
                # Forward WebRTC signaling to other users in the room
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'webrtc_signal',
                        'message': data.get('message'),
                        'username': self.username
                    }
                )
            elif message_type == 'chat_message':
                # Handle chat messages
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': data.get('message'),
                        'username': self.username
                    }
                )
            else:
                # Echo back unknown message types
                await self.send(text_data=json.dumps({
                    'type': 'echo',
                    'message': data
                }))
                
        except json.JSONDecodeError:
            print(f"Invalid JSON received: {text_data}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))

    async def webrtc_signal(self, event):
        """Handle WebRTC signaling messages"""
        print(f"Forwarding WebRTC signal: {event}")
        
        # Send to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'webrtc_signal',
            'message': event['message'],
            'username': event['username']
        }))

    async def chat_message(self, event):
        """Handle chat messages"""
        print(f"Forwarding chat message: {event}")
        
        # Send to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'username': event['username']
        }))

    async def user_join(self, event):
        """Handle user join notifications"""
        await self.send(text_data=json.dumps({
            'type': 'user_join',
            'username': event['username']
        }))

    async def user_leave(self, event):
        """Handle user leave notifications"""
        await self.send(text_data=json.dumps({
            'type': 'user_leave',
            'username': event['username']
        }))


class MatchingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print(f"Matching WebSocket connect attempt: {self.scope}")
        
        # Accept the connection immediately
        await self.accept()
        print(f"Matching WebSocket connection accepted")
        
        # Get username from query params
        query_string = self.scope.get('query_string', b'').decode()
        username = None
        if query_string:
            params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
            username = params.get('username')
        
        self.username = username
        self.room_group_name = 'matching_room'
        
        print(f"User {username} connecting to matching room")
        
        # Join the matching room
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to matching service',
            'username': self.username
        }))

    async def disconnect(self, close_code):
        print(f"Matching WebSocket disconnect: {close_code}")
        
        # Leave the matching room
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        print(f"Received matching message: {text_data}")
        
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'looking_for_match':
                # Notify other users that this user is looking for a match
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'user_looking_for_match',
                        'username': self.username,
                        'call_id': data.get('call_id')
                    }
                )
            elif message_type == 'match_found':
                # Notify users about a match
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'match_found',
                        'call_id': data.get('call_id'),
                        'matched_users': data.get('matched_users', [])
                    }
                )
                
        except json.JSONDecodeError:
            print(f"Invalid JSON received: {text_data}")

    async def user_looking_for_match(self, event):
        """Handle user looking for match notifications"""
        await self.send(text_data=json.dumps({
            'type': 'user_looking_for_match',
            'username': event['username'],
            'call_id': event['call_id']
        }))

    async def match_found(self, event):
        """Handle match found notifications"""
        await self.send(text_data=json.dumps({
            'type': 'match_found',
            'call_id': event['call_id'],
            'matched_users': event['matched_users']
        })) 
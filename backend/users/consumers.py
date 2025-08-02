import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import User, VideoCall, ChatMessage


class VideoCallConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print(f"WebSocket connect attempt for room: {self.scope['url_route']['kwargs']['room_name']}")
        
        try:
            self.user = self.scope['user']
            self.room_name = self.scope['url_route']['kwargs']['room_name']
            self.room_group_name = f'video_call_{self.room_name}'

            print(f"User: {self.user}, Room: {self.room_name}")

            # Accept the connection first
            await self.accept()
            print("WebSocket connection accepted")

            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            print(f"Joined room group: {self.room_group_name}")

            # Update user status if authenticated
            if hasattr(self.user, 'id') and self.user.id:
                await self.update_user_status(True)
                print(f"Updated user status for user: {self.user.username}")

        except Exception as e:
            print(f"WebSocket connect error: {e}")
            # Still accept the connection even if there's an error
            await self.accept()

    async def disconnect(self, close_code):
        print(f"WebSocket disconnect with code: {close_code}")
        try:
            # Leave room group
            if hasattr(self, 'room_group_name'):
                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name
                )

            # Update user status if authenticated
            if hasattr(self, 'user') and hasattr(self.user, 'id') and self.user.id:
                await self.update_user_status(False)
        except Exception as e:
            print(f"WebSocket disconnect error: {e}")

    async def receive(self, text_data):
        print(f"Received WebSocket message: {text_data}")
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            data = text_data_json.get('data', {})

            print(f"Message type: {message_type}")

            if message_type == 'offer':
                # Handle WebRTC offer
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'video_offer',
                        'data': data,
                        'user_id': getattr(self.user, 'id', None)
                    }
                )
            elif message_type == 'answer':
                # Handle WebRTC answer
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'video_answer',
                        'data': data,
                        'user_id': getattr(self.user, 'id', None)
                    }
                )
            elif message_type == 'ice_candidate':
                # Handle ICE candidate
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'ice_candidate',
                        'data': data,
                        'user_id': getattr(self.user, 'id', None)
                    }
                )
            elif message_type == 'chat_message':
                # Handle chat message
                if hasattr(self.user, 'id') and self.user.id:
                    await self.save_chat_message(data.get('content'))
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'data': {
                            'content': data.get('content'),
                            'sender': getattr(self.user, 'username', 'Anonymous'),
                            'timestamp': timezone.now().isoformat()
                        },
                        'user_id': getattr(self.user, 'id', None)
                    }
                )
            else:
                print(f"Unknown message type: {message_type}")

        except Exception as e:
            print(f"WebSocket receive error: {e}")

    async def video_offer(self, event):
        # Send offer to other users in the room
        current_user_id = getattr(self.user, 'id', None)
        if event['user_id'] != current_user_id:
            await self.send(text_data=json.dumps({
                'type': 'offer',
                'data': event['data'],
                'user_id': event['user_id']
            }))

    async def video_answer(self, event):
        # Send answer to other users in the room
        current_user_id = getattr(self.user, 'id', None)
        if event['user_id'] != current_user_id:
            await self.send(text_data=json.dumps({
                'type': 'answer',
                'data': event['data'],
                'user_id': event['user_id']
            }))

    async def ice_candidate(self, event):
        # Send ICE candidate to other users in the room
        current_user_id = getattr(self.user, 'id', None)
        if event['user_id'] != current_user_id:
            await self.send(text_data=json.dumps({
                'type': 'ice_candidate',
                'data': event['data'],
                'user_id': event['user_id']
            }))

    async def chat_message(self, event):
        # Send chat message to all users in the room
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'data': event['data'],
            'user_id': event['user_id']
        }))

    @database_sync_to_async
    def update_user_status(self, is_online):
        try:
            if hasattr(self.user, 'id') and self.user.id:
                User.objects.filter(id=self.user.id).update(
                    is_online=is_online,
                    last_seen=timezone.now()
                )
        except Exception as e:
            print(f"Error updating user status: {e}")

    @database_sync_to_async
    def save_chat_message(self, content):
        try:
            call = VideoCall.objects.get(id=self.room_name)
            ChatMessage.objects.create(
                call=call,
                sender=self.user,
                content=content
            )
        except Exception as e:
            print(f"Error saving chat message: {e}")


class MatchingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("Matching WebSocket connect attempt")
        try:
            self.user = self.scope['user']
            self.room_group_name = 'matching'

            # Accept the connection
            await self.accept()
            print("Matching WebSocket connection accepted")

            # Join matching group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

        except Exception as e:
            print(f"Matching WebSocket connect error: {e}")
            await self.accept()

    async def disconnect(self, close_code):
        print(f"Matching WebSocket disconnect with code: {close_code}")
        try:
            # Leave matching group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        except Exception as e:
            print(f"Matching WebSocket disconnect error: {e}")

    async def receive(self, text_data):
        print(f"Received matching message: {text_data}")
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            data = text_data_json.get('data', {})

            if message_type == 'looking_for_match':
                # User is looking for a match
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'user_looking_for_match',
                        'data': {
                            'user_id': getattr(self.user, 'id', None),
                            'username': getattr(self.user, 'username', 'Anonymous')
                        }
                    }
                )
            elif message_type == 'match_found':
                # Match found notification
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'match_found',
                        'data': data
                    }
                )
        except Exception as e:
            print(f"Matching WebSocket receive error: {e}")

    async def user_looking_for_match(self, event):
        # Send user looking for match notification
        await self.send(text_data=json.dumps({
            'type': 'user_looking_for_match',
            'data': event['data']
        }))

    async def match_found(self, event):
        # Send match found notification
        await self.send(text_data=json.dumps({
            'type': 'match_found',
            'data': event['data']
        })) 
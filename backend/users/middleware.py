from channels.middleware import BaseMiddleware
from channels.auth import AuthMiddlewareStack
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
import json

User = get_user_model()

class WebSocketAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        print(f"WebSocket middleware processing: {scope}")
        
        # Extract username from query parameters
        query_string = scope.get('query_string', b'').decode()
        username = None
        if query_string:
            params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
            username = params.get('username')
        
        print(f"Extracted username: {username}")
        
        # Try to get user by username, but don't fail if not found
        if username:
            try:
                user = await self.get_user_by_username(username)
                scope['user'] = user
                print(f"User found: {user.username if user else 'None'}")
            except Exception as e:
                print(f"Error getting user: {e}")
                scope['user'] = AnonymousUser()
        else:
            scope['user'] = AnonymousUser()
            print("No username provided, using AnonymousUser")
        
        return await super().__call__(scope, receive, send)
    
    async def get_user_by_username(self, username):
        """Get user by username asynchronously"""
        try:
            return await self.database_sync_to_async(User.objects.get)(username=username)
        except User.DoesNotExist:
            return AnonymousUser()
    
    def database_sync_to_async(self, func):
        """Simple database sync to async wrapper"""
        from channels.db import database_sync_to_async
        return database_sync_to_async(func) 
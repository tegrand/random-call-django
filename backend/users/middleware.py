from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import User


class WebSocketAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Get the user from the scope
        scope['user'] = await self.get_user(scope)
        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def get_user(self, scope):
        try:
            # Get query parameters
            query_string = scope.get('query_string', b'').decode()
            print(f"WebSocket query string: {query_string}")
            
            if query_string:
                # Parse query parameters
                params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
                username = params.get('username')
                print(f"Extracted username: {username}")
                
                if username:
                    try:
                        user = User.objects.get(username=username)
                        print(f"Found user: {user.username}")
                        return user
                    except User.DoesNotExist:
                        print(f"User not found: {username}")
                        pass
        except Exception as e:
            print(f"WebSocket auth error: {e}")
        
        print("Returning AnonymousUser")
        return AnonymousUser() 
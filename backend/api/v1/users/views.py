from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import Q
import uuid
import random
import string
from datetime import timedelta

from users.models import User, VideoCall, ChatMessage, UserSession
from users.serializers import (
    UserSerializer, VideoCallSerializer, ChatMessageSerializer,
    CreateVideoCallSerializer, JoinVideoCallSerializer, SendMessageSerializer
)


class UserRegistrationView(APIView):
    permission_classes = [AllowAny]
    
    def generate_username(self):
        """Generate a unique username"""
        while True:
            # Generate a random username like "User_ABC123"
            prefix = "User"
            suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            username = f"{prefix}_{suffix}"
            
            if not User.objects.filter(username=username).exists():
                return username
    
    def post(self, request):
        try:
            # Generate unique username and password
            username = self.generate_username()
            password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
            
            print(f"Creating user: {username}")
            
            # Create user with generated credentials
            user = User.objects.create_user(
                username=username,
                password=password
            )
            user.is_online = True
            user.last_seen = timezone.now()
            user.save()
            
            # Create session
            session = UserSession.objects.create(user=user)
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            serializer = UserSerializer(user)
            print(f"User created successfully: {username}")
            return Response({
                'user': serializer.data,
                'access_token': access_token,
                'refresh_token': refresh_token
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Error creating user: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserStatusView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        user.is_online = True
        user.last_seen = timezone.now()
        user.save()
        
        return Response({'status': 'online'})


class CreateVideoCallView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        print(f"Creating video call for user: {user.username}")
        
        # Check if user is already in a call
        if user.current_call:
            print(f"User {user.username} is already in a call")
            return Response({'error': 'User is already in a call'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create new video call
        call = VideoCall.objects.create(initiator=user)
        user.current_call = call
        user.is_looking_for_call = True
        user.save()
        
        print(f"Created call {call.id} for user {user.username}")
        
        serializer = VideoCallSerializer(call)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FindMatchView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        print(f"Finding match for user: {user.username}")
        
        # Check if user has an active call
        if not user.current_call:
            print(f"User {user.username} has no active call")
            return Response({'error': 'No active call found'}, status=status.HTTP_400_BAD_REQUEST)
        
        # First, try to find users who are currently looking for calls
        available_users = User.objects.filter(
            is_looking_for_call=True,
            is_online=True,
            current_call__isnull=False
        ).exclude(id=user.id)
        
        print(f"Currently looking for calls: {available_users.count()}")
        for available_user in available_users:
            print(f"  - {available_user.username} (call: {available_user.current_call.id})")
        
        if available_users.exists():
            # Get the first available user
            matched_user = available_users.first()
            matched_call = matched_user.current_call
            
            print(f"Matched {user.username} with {matched_user.username} (current user)")
            
            # Update both calls to connect them
            with transaction.atomic():
                user.current_call.participant = matched_user
                user.current_call.status = 'active'
                user.current_call.started_at = timezone.now()
                user.current_call.save()
                
                matched_user.current_call.participant = user
                matched_user.current_call.status = 'active'
                matched_user.current_call.started_at = timezone.now()
                matched_user.current_call.save()
                
                # Update user status
                user.is_looking_for_call = False
                matched_user.is_looking_for_call = False
                user.save()
                matched_user.save()
            
            serializer = VideoCallSerializer(user.current_call)
            return Response({
                'matched': True,
                'call': serializer.data,
                'matched_user': UserSerializer(matched_user).data,
                'match_type': 'current_user'
            })
        
        # If no current users, try to find users who recently ended calls (within last 5 minutes)
        recent_threshold = timezone.now() - timedelta(minutes=5)
        recent_users = User.objects.filter(
            is_online=True,
            last_seen__gte=recent_threshold,
            is_looking_for_call=False,
            current_call__isnull=True
        ).exclude(id=user.id)
        
        print(f"Recently active users: {recent_users.count()}")
        for recent_user in recent_users:
            print(f"  - {recent_user.username} (last seen: {recent_user.last_seen})")
        
        if recent_users.exists():
            # Pick a random recent user
            matched_user = random.choice(recent_users)
            
            print(f"Matched {user.username} with {matched_user.username} (recent user)")
            
            # Create a new call for the matched user
            matched_call = VideoCall.objects.create(initiator=matched_user)
            matched_user.current_call = matched_call
            matched_user.is_looking_for_call = False
            matched_user.save()
            
            # Update both calls to connect them
            with transaction.atomic():
                user.current_call.participant = matched_user
                user.current_call.status = 'active'
                user.current_call.started_at = timezone.now()
                user.current_call.save()
                
                matched_call.participant = user
                matched_call.status = 'active'
                matched_call.started_at = timezone.now()
                matched_call.save()
                
                # Update user status
                user.is_looking_for_call = False
                user.save()
            
            serializer = VideoCallSerializer(user.current_call)
            return Response({
                'matched': True,
                'call': serializer.data,
                'matched_user': UserSerializer(matched_user).data,
                'match_type': 'recent_user'
            })
        
        # If still no match, try to find any online user (even if they're not looking)
        online_users = User.objects.filter(
            is_online=True
        ).exclude(id=user.id)
        
        print(f"Online users: {online_users.count()}")
        for online_user in online_users:
            print(f"  - {online_user.username} (looking: {online_user.is_looking_for_call})")
        
        if online_users.exists():
            # Pick a random online user
            matched_user = random.choice(online_users)
            
            print(f"Matched {user.username} with {matched_user.username} (online user)")
            
            # If the matched user has a current call, end it first
            if matched_user.current_call:
                old_call = matched_user.current_call
                old_call.status = 'ended'
                old_call.ended_at = timezone.now()
                old_call.save()
                matched_user.current_call = None
                matched_user.is_looking_for_call = False
                matched_user.save()
            
            # Create a new call for the matched user
            matched_call = VideoCall.objects.create(initiator=matched_user)
            matched_user.current_call = matched_call
            matched_user.is_looking_for_call = False
            matched_user.save()
            
            # Update both calls to connect them
            with transaction.atomic():
                user.current_call.participant = matched_user
                user.current_call.status = 'active'
                user.current_call.started_at = timezone.now()
                user.current_call.save()
                
                matched_call.participant = user
                matched_call.status = 'active'
                matched_call.started_at = timezone.now()
                matched_call.save()
                
                # Update user status
                user.is_looking_for_call = False
                user.save()
            
            serializer = VideoCallSerializer(user.current_call)
            return Response({
                'matched': True,
                'call': serializer.data,
                'matched_user': UserSerializer(matched_user).data,
                'match_type': 'online_user'
            })
        
        print(f"No users available for {user.username}")
        return Response({'matched': False, 'message': 'No users available for matching'})


class SkipCallView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        print(f"User {user.username} skipping call")
        
        if not user.current_call:
            return Response({'error': 'No active call found'}, status=status.HTTP_400_BAD_REQUEST)
        
        call = user.current_call
        
        with transaction.atomic():
            # Mark call as skipped
            call.status = 'skipped'
            call.ended_at = timezone.now()
            call.save()
            
            # If there's a participant, also update their call
            if call.participant:
                participant_call = call.participant.current_call
                if participant_call:
                    participant_call.status = 'skipped'
                    participant_call.ended_at = timezone.now()
                    participant_call.save()
                    
                    # Reset participant's call status
                    call.participant.current_call = None
                    call.participant.is_looking_for_call = False
                    call.participant.save()
            
            # Reset user's call status
            user.current_call = None
            user.is_looking_for_call = False
            user.save()
        
        return Response({'status': 'skipped'})


class EndCallView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        print(f"User {user.username} ending call")
        
        if not user.current_call:
            return Response({'error': 'No active call found'}, status=status.HTTP_400_BAD_REQUEST)
        
        call = user.current_call
        
        with transaction.atomic():
            # Mark call as ended
            call.status = 'ended'
            call.ended_at = timezone.now()
            if call.started_at:
                call.duration = int((call.ended_at - call.started_at).total_seconds())
            call.save()
            
            # If there's a participant, also update their call
            if call.participant:
                participant_call = call.participant.current_call
                if participant_call:
                    participant_call.status = 'ended'
                    participant_call.ended_at = timezone.now()
                    if participant_call.started_at:
                        participant_call.duration = int((participant_call.ended_at - participant_call.started_at).total_seconds())
                    participant_call.save()
                    
                    # Reset participant's call status
                    call.participant.current_call = None
                    call.participant.is_looking_for_call = False
                    call.participant.save()
            
            # Reset user's call status
            user.current_call = None
            user.is_looking_for_call = False
            user.save()
        
        return Response({'status': 'ended'})


class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        call_id = request.data.get('call_id')
        content = request.data.get('content')
        
        if not call_id or not content:
            return Response({'error': 'Call ID and content are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            call = VideoCall.objects.get(id=call_id)
        except VideoCall.DoesNotExist:
            return Response({'error': 'Call not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user is part of this call
        if call.initiator != user and call.participant != user:
            return Response({'error': 'Not authorized for this call'}, status=status.HTTP_403_FORBIDDEN)
        
        # Create message
        message = ChatMessage.objects.create(
            call=call,
            sender=user,
            content=content
        )
        
        serializer = ChatMessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class GetMessagesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, call_id):
        user = request.user
        
        try:
            call = VideoCall.objects.get(id=call_id)
        except VideoCall.DoesNotExist:
            return Response({'error': 'Call not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user is part of this call
        if call.initiator != user and call.participant != user:
            return Response({'error': 'Not authorized for this call'}, status=status.HTTP_403_FORBIDDEN)
        
        messages = ChatMessage.objects.filter(call=call).order_by('timestamp')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)


class ClearMessagesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, call_id):
        user = request.user
        
        try:
            call = VideoCall.objects.get(id=call_id)
        except VideoCall.DoesNotExist:
            return Response({'error': 'Call not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user is part of this call
        if call.initiator != user and call.participant != user:
            return Response({'error': 'Not authorized for this call'}, status=status.HTTP_403_FORBIDDEN)
        
        # Delete all messages for this call
        ChatMessage.objects.filter(call=call).delete()
        
        return Response({'status': 'messages_cleared'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_logout(request):
    user = request.user
    print(f"User {user.username} logging out")
    user.is_online = False
    user.last_seen = timezone.now()
    user.is_looking_for_call = False
    
    # End current call if any
    if user.current_call:
        user.current_call.status = 'ended'
        user.current_call.ended_at = timezone.now()
        user.current_call.save()
        user.current_call = None
    
    user.save()
    
    return Response({'status': 'logged_out'})

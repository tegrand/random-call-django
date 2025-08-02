from rest_framework import serializers
from .models import User, VideoCall, ChatMessage


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'is_online', 'last_seen', 'session_id', 'is_looking_for_call']
        read_only_fields = ['id', 'session_id']


class VideoCallSerializer(serializers.ModelSerializer):
    initiator = UserSerializer(read_only=True)
    participant = UserSerializer(read_only=True)
    
    class Meta:
        model = VideoCall
        fields = ['id', 'initiator', 'participant', 'status', 'created_at', 'started_at', 'ended_at', 'duration']
        read_only_fields = ['id', 'created_at', 'started_at', 'ended_at', 'duration']


class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'call', 'sender', 'content', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class CreateVideoCallSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoCall
        fields = ['id']
        read_only_fields = ['id']


class JoinVideoCallSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoCall
        fields = ['id']


class SendMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['content'] 
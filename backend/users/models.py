from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid

from .manager import UserManager


class User(AbstractUser):
    username = models.CharField(max_length=255, unique=True)
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(default=timezone.now)
    session_id = models.UUIDField(default=uuid.uuid4, editable=False)
    
    # Video call preferences
    is_looking_for_call = models.BooleanField(default=False)
    current_call = models.ForeignKey('VideoCall', on_delete=models.SET_NULL, null=True, blank=True, related_name='participants')

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        db_table = 'user_user'
        verbose_name = 'user'
        verbose_name_plural = 'users'
        ordering = ["-id"]

    def __str__(self):
        return self.username


class VideoCall(models.Model):
    CALL_STATUS_CHOICES = [
        ('waiting', 'Waiting for match'),
        ('active', 'Active'),
        ('ended', 'Ended'),
        ('skipped', 'Skipped'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    initiator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='initiated_calls')
    participant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='joined_calls', null=True, blank=True)
    status = models.CharField(max_length=20, choices=CALL_STATUS_CHOICES, default='waiting')
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration = models.IntegerField(default=0)  # in seconds
    
    class Meta:
        db_table = 'video_calls'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Call {self.id} - {self.status}"


class ChatMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    call = models.ForeignKey(VideoCall, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'chat_messages'
        ordering = ['timestamp']
    
    def __str__(self):
        return f"Message from {self.sender.username} in {self.call.id}"


class UserSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_id = models.UUIDField(default=uuid.uuid4, editable=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_sessions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Session {self.session_id} for {self.user.username}"
    
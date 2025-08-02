from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/video_call/(?P<call_id>[^/]+)/$', consumers.VideoCallConsumer.as_asgi()),
    re_path(r'ws/matching/$', consumers.MatchingConsumer.as_asgi()),
] 
from django.urls import path
from . import views

urlpatterns = [
    # User management
    path('register/', views.UserRegistrationView.as_view(), name='user-register'),
    path('status/', views.UserStatusView.as_view(), name='user-status'),
    path('logout/', views.user_logout, name='user-logout'),
    
    # Video call management
    path('call/create/', views.CreateVideoCallView.as_view(), name='create-call'),
    path('call/find-match/', views.FindMatchView.as_view(), name='find-match'),
    path('call/skip/', views.SkipCallView.as_view(), name='skip-call'),
    path('call/end/', views.EndCallView.as_view(), name='end-call'),
    
    # Chat management
    path('call/<str:call_id>/messages/', views.GetMessagesView.as_view(), name='get-messages'),
    path('call/<str:call_id>/messages/send/', views.SendMessageView.as_view(), name='send-message'),
    path('call/<str:call_id>/messages/clear/', views.ClearMessagesView.as_view(), name='clear-messages'),
]

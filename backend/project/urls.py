from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from django.http import JsonResponse

def health_check(request):
    """Health check endpoint for Railway"""
    return JsonResponse({"status": "healthy", "message": "Django app is running"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('api.v1.users.urls')),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', health_check, name='health_check'),
]


if settings.DEBUG:
    urlpatterns += (
        static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) +
        static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    )
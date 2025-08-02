from django.http import JsonResponse
from django.conf import settings

class HealthCheckMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Handle Railway healthcheck requests
        if request.get_host() == 'healthcheck.railway.app':
            return JsonResponse({
                "status": "healthy",
                "message": "Django app is running"
            })
        
        return self.get_response(request) 
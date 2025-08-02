from django.http import JsonResponse
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin

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


class CSRFExemptMiddleware(MiddlewareMixin):
    """Middleware to exempt API endpoints from CSRF protection"""
    
    def process_request(self, request):
        # Exempt all API endpoints from CSRF
        if request.path.startswith('/api/'):
            setattr(request, '_dont_enforce_csrf_checks', True)
        return None 
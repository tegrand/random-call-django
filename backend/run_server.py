#!/usr/bin/env python
"""
Run Django server with ASGI support for WebSocket connections
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
    django.setup()
    
    # Run the server with ASGI support
    execute_from_command_line(['manage.py', 'runserver', '127.0.0.1:8000']) 
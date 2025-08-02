#!/usr/bin/env python3
"""
Script to help set Railway environment variables
Run this locally to get the commands to run in Railway CLI
"""

import secrets
import string

def generate_secret_key():
    """Generate a secure secret key"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*(-_=+)"
    return ''.join(secrets.choice(alphabet) for _ in range(50))

def main():
    print("🚀 Railway Environment Variables Setup")
    print("=" * 50)
    print()
    print("Run these commands in Railway CLI or set in Railway dashboard:")
    print()
    
    secret_key = generate_secret_key()
    
    print("1. Set DEBUG to False:")
    print("   railway variables set DEBUG=False")
    print()
    
    print("2. Set SECRET_KEY:")
    print(f"   railway variables set SECRET_KEY={secret_key}")
    print()
    
    print("3. Set ALLOWED_HOSTS (replace with your actual domain):")
    print("   railway variables set ALLOWED_HOSTS=your-app-name.railway.app")
    print()
    
    print("4. Or set all at once:")
    print(f"   railway variables set DEBUG=False SECRET_KEY={secret_key} ALLOWED_HOSTS=your-app-name.railway.app")
    print()
    
    print("📝 Note: Replace 'your-app-name.railway.app' with your actual Railway domain")
    print("🔗 You can find your domain in the Railway dashboard under your app's settings")

if __name__ == "__main__":
    main() 
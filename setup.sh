#!/bin/bash

echo "🚀 Setting up Random Video Call Application"
echo "=========================================="

# Backend Setup
echo "📦 Setting up Backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp env.example .env
fi

# Run migrations
echo "Running database migrations..."
python manage.py makemigrations
python manage.py migrate

echo "✅ Backend setup complete!"
echo ""

# Frontend Setup
echo "📦 Setting up Frontend..."
cd ../frontend

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

echo "✅ Frontend setup complete!"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Backend (with ASGI support): cd backend && source venv/bin/activate && daphne -b 127.0.0.1 -p 8000 project.asgi:application"
echo "2. Frontend: cd frontend && npm run dev"
echo ""
echo "Access the application at: http://localhost:5173"
echo ""
echo "Note: Use daphne instead of python manage.py runserver for WebSocket support!" 
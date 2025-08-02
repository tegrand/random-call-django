@echo off
echo 🚀 Setting up Random Video Call Application
echo ==========================================

REM Backend Setup
echo 📦 Setting up Backend...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install Python dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    copy env.example .env
)

REM Run migrations
echo Running database migrations...
python manage.py makemigrations
python manage.py migrate

echo ✅ Backend setup complete!
echo.

REM Frontend Setup
echo 📦 Setting up Frontend...
cd ..\frontend

REM Install Node.js dependencies
echo Installing Node.js dependencies...
npm install

echo ✅ Frontend setup complete!
echo.

echo 🎉 Setup complete!
echo.
echo To start the application:
echo 1. Backend (with ASGI support): cd backend ^&^& venv\Scripts\activate ^&^& daphne -b 127.0.0.1 -p 8000 project.asgi:application
echo 2. Frontend: cd frontend ^&^& npm run dev
echo.
echo Access the application at: http://localhost:5173
echo.
echo Note: Use daphne instead of python manage.py runserver for WebSocket support!
pause 
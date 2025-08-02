# Random Video Call Application

A real-time random video call application built with React (frontend) and Django (backend) with WebRTC for peer-to-peer video communication.

## Features

- **User Registration**: Simple username-based registration
- **Age Verification**: Ensures users are 18+ years old
- **Camera Permission**: Requests camera and microphone access
- **Random Matching**: Automatically matches users for video calls
- **Real-time Video Calls**: WebRTC peer-to-peer video communication
- **Text Chat**: Real-time chat during video calls
- **Skip Functionality**: Skip to the next person anytime
- **Call Controls**: Mute, video toggle, and call management
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React 19
- React Router DOM
- Tailwind CSS
- Simple Peer (WebRTC)
- Axios (HTTP client)

### Backend
- Django 4.2
- Django REST Framework
- Django Channels (WebSocket)
- Daphne (ASGI server)
- PostgreSQL (recommended)

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- PostgreSQL (optional, SQLite works for development)

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory:
```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
TIME_ZONE=UTC
```

5. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

6. Create a superuser (optional):
```bash
python manage.py createsuperuser
```

7. Run the development server with ASGI support (for WebSocket):
```bash
daphne -b 127.0.0.1 -p 8000 project.asgi:application
```

The backend will be available at `http://127.0.0.1:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

1. **Registration**: Enter a username to create an account
2. **Age Verification**: Confirm you are 18+ years old
3. **Camera Permission**: Allow camera and microphone access
4. **Start Call**: Click "Start Random Call" to begin matching
5. **Video Call**: Once matched, you can:
   - See and hear the other person
   - Use text chat
   - Mute/unmute audio
   - Turn video on/off
   - Skip to next person
   - End the call

## API Endpoints

### User Management
- `POST /api/v1/users/register/` - Register new user
- `POST /api/v1/users/status/` - Update user status
- `POST /api/v1/users/logout/` - User logout

### Video Calls
- `POST /api/v1/users/call/create/` - Create new video call
- `POST /api/v1/users/call/find-match/` - Find match for call
- `POST /api/v1/users/call/skip/` - Skip current call
- `POST /api/v1/users/call/end/` - End current call

### Chat
- `GET /api/v1/users/call/{call_id}/messages/` - Get chat messages
- `POST /api/v1/users/call/{call_id}/messages/send/` - Send message
- `POST /api/v1/users/call/{call_id}/messages/clear/` - Clear messages

### WebSocket
- `ws://localhost:8000/ws/video_call/{call_id}/` - Video call WebSocket
- `ws://localhost:8000/ws/matching/` - Matching WebSocket

## Project Structure

```
src/
├── backend/
│   ├── api/v1/users/
│   │   ├── urls.py
│   │   └── views.py
│   ├── users/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── consumers.py
│   │   ├── routing.py
│   │   └── middleware.py
│   ├── project/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── asgi.py
│   └── manage.py
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Home.jsx
    │   │   └── VideoCall.jsx
    │   ├── context/
    │   │   └── AppContext.jsx
    │   ├── services/
    │   │   ├── api.js
    │   │   ├── websocket.js
    │   │   └── webrtc.js
    │   └── App.jsx
    └── package.json
```

## Development

### Running in Development Mode

1. Start the backend server:
```bash
cd backend
python manage.py runserver
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Building for Production

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. The built files will be in the `frontend/dist` directory

## Environment Variables

### Backend (.env)
- `DEBUG`: Set to False in production
- `SECRET_KEY`: Django secret key
- `DATABASE_URL`: Database connection string
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts
- `TIME_ZONE`: Timezone for the application

## Security Considerations

- Implement proper JWT authentication for production
- Use HTTPS in production
- Add rate limiting
- Implement user verification
- Add content moderation
- Use secure WebRTC configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository. 
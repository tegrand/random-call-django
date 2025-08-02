# Backend Deployment Guide

## 🚀 Deploy to Railway (Recommended)

### Step 1: Prepare Your Code
1. Make sure all files are committed to GitHub
2. Ensure your repository is public or you have Railway Pro

### Step 2: Deploy to Railway
1. Go to [Railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Select the `backend` folder as the source
7. Click "Deploy"

### Step 3: Configure Environment Variables
In Railway dashboard, go to your project → Variables tab and add:

```env
DEBUG=False
SECRET_KEY=your-super-secret-key-here
ALLOWED_HOSTS=your-app-name.railway.app
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=your-db-host
DB_PORT=5432
```

### Step 4: Add PostgreSQL Database
1. In Railway dashboard, click "New"
2. Select "Database" → "PostgreSQL"
3. Connect it to your app
4. Railway will automatically set the database environment variables

### Step 5: Get Your Backend URL
- Your backend URL will be: `https://your-app-name.railway.app`
- Update your frontend to use this URL

## 🌐 Alternative: Render

### Step 1: Deploy to Render
1. Go to [Render.com](https://render.com)
2. Sign up/Login with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: random-call-backend
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn project.wsgi:application --bind 0.0.0.0:$PORT`
   - **Root Directory**: `backend`

### Step 2: Add Environment Variables
```env
DEBUG=False
SECRET_KEY=your-super-secret-key-here
ALLOWED_HOSTS=your-app-name.onrender.com
```

### Step 3: Add PostgreSQL Database
1. Create a new PostgreSQL database in Render
2. Connect it to your web service
3. Render will automatically set database environment variables

## 🔧 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DEBUG` | Debug mode | `False` |
| `SECRET_KEY` | Django secret key | `your-secret-key` |
| `ALLOWED_HOSTS` | Allowed domains | `your-app.railway.app` |
| `DB_NAME` | Database name | `railway` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `password123` |
| `DB_HOST` | Database host | `containers-us-west-1.railway.app` |
| `DB_PORT` | Database port | `5432` |

## 📝 Update Frontend

After deployment, update your frontend API URL:

```javascript
// In frontend/src/services/api.js
const API_BASE_URL = 'https://your-app-name.railway.app';
```

## 🚨 Important Notes

1. **WebSocket Support**: Railway and Render support WebSockets
2. **Database**: Use PostgreSQL in production (SQLite is for development only)
3. **Static Files**: WhiteNoise handles static files automatically
4. **CORS**: Update CORS settings with your frontend domain
5. **Security**: Never commit SECRET_KEY to version control

## 🔍 Troubleshooting

### Common Issues:
1. **Build fails**: Check requirements.txt and Python version
2. **Database connection**: Verify environment variables
3. **CORS errors**: Update CORS_ALLOWED_ORIGINS
4. **Static files**: Ensure WhiteNoise is configured

### Debug Commands:
```bash
# Check logs
railway logs

# Run migrations manually
railway run python manage.py migrate

# Create superuser
railway run python manage.py createsuperuser
``` 
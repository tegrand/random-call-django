# Frontend Setup Guide

## 🚀 Connect to Deployed Backend

### Step 1: Get Your Railway Backend URL
1. Go to your [Railway Dashboard](https://railway.app)
2. Click on your deployed Django app
3. Copy the domain URL (e.g., `https://your-app-name.railway.app`)

### Step 2: Update Backend URL
1. Open `src/config.js`
2. Replace `'https://your-app-name.railway.app'` with your actual Railway URL:

```javascript
const config = {
    API_BASE_URL: 'https://your-actual-app-name.railway.app', // Your Railway URL here
    // ... rest of config
};
```

### Step 3: Test the Connection
1. Start your frontend: `npm run dev`
2. Open the app in your browser
3. Try to start a call - it should connect to your deployed backend

## 🔧 Configuration Details

### API Endpoints
Your frontend will now connect to these endpoints:
- **Registration**: `https://your-app.railway.app/api/v1/users/register/`
- **Create Call**: `https://your-app.railway.app/api/v1/users/call/create/`
- **Find Match**: `https://your-app.railway.app/api/v1/users/find-match/`
- **WebSocket**: `wss://your-app.railway.app/ws/video_call/`

### Environment Variables
The frontend will automatically:
- ✅ Use HTTPS for API calls
- ✅ Use WSS for WebSocket connections
- ✅ Handle JWT token authentication
- ✅ Refresh tokens automatically

## 🎯 Expected Behavior

After updating the URL:
1. **User registration** should work
2. **Call creation** should work
3. **User matching** should work
4. **Video calls** should work (with WebSocket)

## 🚨 Troubleshooting

### If API calls fail:
1. Check your Railway URL is correct
2. Verify your backend is running (check Railway logs)
3. Check CORS settings in backend

### If WebSocket fails:
1. Ensure your Railway URL uses HTTPS
2. Check WebSocket support in Railway
3. Verify the WebSocket endpoint is accessible

## 📝 Next Steps

1. **Update the URL** in `src/config.js`
2. **Test the connection**
3. **Deploy frontend** to Vercel/Netlify (optional)
4. **Share your app** with others!

Your random video call app should now be fully functional with the deployed backend! 🎉 
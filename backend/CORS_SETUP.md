# CORS Configuration Setup

This document explains how to configure CORS (Cross-Origin Resource Sharing) for your Railway backend and Vercel frontend.

## What Was Changed

The backend CORS configuration has been updated to:
- Properly handle preflight OPTIONS requests
- Support environment variables for frontend URLs
- Allow Vercel preview deployments automatically (via regex pattern)
- Cache preflight requests for better performance

## Environment Variables to Add

### Railway Backend (.env or Railway Variables)

Add these environment variables in your Railway dashboard:

```env
# Required: Your main production frontend URL
FRONTEND_URL=https://lokal-tau.vercel.app

# Optional: Additional frontend URLs (comma-separated)
# Use this if you have staging/preview environments
FRONTEND_URLS=https://preview-branch.vercel.app,https://staging.example.com

# Database Configuration (you should already have this)
DATABASE_POOLER_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=disable
```

### Vercel Frontend (.env.local or Vercel Environment Variables)

Add this environment variable in your Vercel dashboard:

```env
# Your Railway backend API URL
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
```

## How to Add Environment Variables

### Railway (Backend)

1. Go to your Railway project dashboard
2. Select your backend service
3. Click on the "Variables" tab
4. Click "New Variable"
5. Add each variable:
   - **Name**: `FRONTEND_URL`
   - **Value**: `https://lokal-tau.vercel.app`
6. Repeat for `FRONTEND_URLS` if needed
7. Railway will automatically redeploy your service

### Vercel (Frontend)

1. Go to your Vercel project dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Click "Add New"
5. Add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-railway-app.railway.app` (your Railway backend URL)
   - **Environment**: Select "Production", "Preview", and "Development" as needed
6. Redeploy your application

## Local Development (.env.local files)

### Backend `.env` file (in `backend/` directory):

```env
FRONTEND_URL=http://localhost:3000
DATABASE_POOLER_URL=your-local-database-url
```

### Frontend `.env.local` file (in `frontend/` directory):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

## How It Works

1. **Preflight Requests**: When your frontend makes a request to the backend, the browser first sends an OPTIONS request to check if CORS is allowed.

2. **CORS Headers**: The backend responds with appropriate headers:
   - `Access-Control-Allow-Origin`: Your frontend URL
   - `Access-Control-Allow-Methods`: Allowed HTTP methods
   - `Access-Control-Allow-Headers`: Allowed headers
   - `Access-Control-Max-Age`: How long to cache the preflight response (1 hour)

3. **Vercel Preview Deployments**: The regex pattern `https://.*\.vercel\.app` automatically allows all Vercel preview deployments, so you don't need to add each preview URL manually.

## Testing

After adding the environment variables:

1. **Test Backend CORS**:
   ```bash
   curl -X OPTIONS https://your-railway-app.railway.app/businesses \
     -H "Origin: https://lokal-tau.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -v
   ```
   You should see `Access-Control-Allow-Origin` in the response headers.

2. **Test Frontend Connection**:
   - Open your Vercel frontend
   - Open browser DevTools → Network tab
   - Check if requests to your Railway backend succeed
   - Look for CORS errors in the console

## Troubleshooting

If you still see CORS errors:

1. **Check Environment Variables**: Make sure `FRONTEND_URL` is set correctly in Railway
2. **Check URL Format**: Ensure URLs don't have trailing slashes
3. **Check Browser Console**: Look for specific CORS error messages
4. **Verify Backend is Running**: Test the backend health endpoint
5. **Check Railway Logs**: Look for any errors in Railway deployment logs

## Notes

- The CORS middleware caches preflight requests for 1 hour (`max_age=3600`)
- Local development URLs (`localhost:3000`, `localhost:5173`) are always allowed
- Vercel preview deployments are automatically allowed via regex pattern
- All HTTP methods and headers are allowed (you can restrict these if needed for security)



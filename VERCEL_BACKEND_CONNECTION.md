# Backend Connection Troubleshooting Guide

## Quick Checklist

### 1. ✅ Check Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and ensure these are set:

**REQUIRED:**
- `DATABASE_URL` - Your PostgreSQL connection string (use Neon.tech for serverless)
- `SESSION_SECRET` - A random secret string for session encryption
- `NODE_ENV=production`

**OPTIONAL (for AI features):**
- `OPENAI_API_KEY` - For AI chat
- `GEMINI_API_KEY` - For document analysis
- `BYTEZ_API_KEY` - For image generation
- `MURF_API_KEY` - For voice generation

### 2. ✅ Check Database Connection

**Important**: Vercel serverless functions need a **serverless-compatible database**.

**Recommended: Neon.tech** (Free tier available)
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string
4. Add it to Vercel as `DATABASE_URL`

**Connection String Format:**
```
postgresql://user:password@host/database?sslmode=require
```

### 3. ✅ Check Vercel Function Logs

1. Go to Vercel Dashboard
2. Select your project
3. Click "Functions" tab
4. Click on `/api/index.js`
5. View the logs for specific errors

**Common errors to look for:**
- `DATABASE_URL` not set
- Database connection timeout
- Module not found errors
- Initialization errors

### 4. ✅ Verify API Endpoint is Working

Test the API directly:
```bash
# Replace with your Vercel URL
curl https://your-project.vercel.app/api/projects
```

Or check in browser console:
```javascript
fetch('/api/projects')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

### 5. ✅ Check Browser Console

Open browser DevTools (F12) → Console tab
- Look for CORS errors
- Look for 500/503 errors
- Check network tab for failed requests

### 6. ✅ Verify Vercel Deployment

1. Check that the latest commit is deployed
2. Verify `api/index.js` exists in the deployment
3. Check build logs for errors

## Common Issues & Solutions

### Issue: "500 Internal Server Error"

**Solution:**
1. Check Vercel function logs (see step 3 above)
2. Verify `DATABASE_URL` is set correctly
3. Ensure database is accessible from Vercel (use Neon.tech)
4. Check that `SESSION_SECRET` is set

### Issue: "FUNCTION_INVOCATION_FAILED"

**Solution:**
1. This means the function crashed
2. Check Vercel logs for the exact error
3. Common causes:
   - Missing environment variables
   - Database connection failed
   - Import/module errors

### Issue: "CORS Error"

**Solution:**
- CORS is already configured in `api/index.source.ts`
- If still seeing errors, check that the API endpoint is correct
- Verify the request is going to `/api/*` path

### Issue: "Cannot connect to database"

**Solution:**
1. Use a serverless-compatible database (Neon.tech recommended)
2. Traditional PostgreSQL may not work with serverless functions
3. Check connection string format
4. Ensure database allows connections from Vercel IPs

## Testing Locally

Test the Vercel function locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally (will use your .env file)
vercel dev
```

This will help you debug issues before deploying.

## Next Steps

1. **Set up environment variables** in Vercel dashboard
2. **Use Neon.tech** for database (free, serverless-compatible)
3. **Check function logs** for specific errors
4. **Test API endpoints** directly
5. **Share error logs** if issues persist


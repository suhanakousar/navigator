# How to Fix Backend Connection Issues

## Step-by-Step Solution

### Step 1: Check Vercel Environment Variables ⚙️

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add these **REQUIRED** variables:

```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
SESSION_SECRET=your-random-secret-key-here
NODE_ENV=production
```

**To generate SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Set Up Database (Neon.tech - Recommended) 🗄️

1. **Sign up** at https://neon.tech (free tier available)
2. **Create a new project**
3. **Copy the connection string** (looks like: `postgresql://user:pass@host/db?sslmode=require`)
4. **Add it to Vercel** as `DATABASE_URL` environment variable
5. **Run database migrations:**
   ```bash
   npm run db:push
   ```
   (You can do this locally, or set up a script to run on Vercel)

### Step 3: Check Vercel Function Logs 📊

1. Go to **Vercel Dashboard** → Your Project
2. Click **"Functions"** tab
3. Click on **`/api/index.js`**
4. View the **logs** to see specific errors

**Look for:**
- ❌ "DATABASE_URL is not defined"
- ❌ "Connection timeout"
- ❌ "Module not found"
- ❌ Any initialization errors

### Step 4: Test the API Endpoint 🧪

**Option A: Browser Console**
```javascript
// Open browser DevTools (F12) → Console
fetch('/api/projects')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Option B: Terminal (curl)**
```bash
curl https://your-project.vercel.app/api/projects
```

**Option C: Check Network Tab**
1. Open DevTools (F12)
2. Go to **Network** tab
3. Try to use the app
4. Look for failed `/api/*` requests
5. Click on them to see error details

### Step 5: Verify Deployment ✅

1. **Check latest commit** is deployed
2. **Verify build succeeded** (no errors in build logs)
3. **Check that `api/index.js` exists** in the deployment

## Common Issues & Quick Fixes

### ❌ "500 Internal Server Error"
**Fix:** Check Vercel function logs (Step 3) for the exact error

### ❌ "FUNCTION_INVOCATION_FAILED"
**Fix:** 
- Verify `DATABASE_URL` is set correctly
- Use Neon.tech (serverless-compatible database)
- Check function logs for crash details

### ❌ "Cannot connect to database"
**Fix:**
- Use **Neon.tech** (not traditional PostgreSQL)
- Verify connection string format
- Check that database allows external connections

### ❌ "DATABASE_URL is not defined"
**Fix:**
- Add `DATABASE_URL` to Vercel environment variables
- Redeploy after adding variables

## Quick Test Checklist

- [ ] `DATABASE_URL` is set in Vercel
- [ ] `SESSION_SECRET` is set in Vercel
- [ ] `NODE_ENV=production` is set
- [ ] Database is accessible (using Neon.tech)
- [ ] Latest code is deployed
- [ ] Checked Vercel function logs
- [ ] Tested API endpoint directly

## Still Not Working?

1. **Share the error message** from Vercel function logs
2. **Check browser console** for specific errors
3. **Verify environment variables** are set correctly
4. **Test locally** with `vercel dev` to debug

## Need Help?

Share:
- The error message from Vercel logs
- What happens when you test `/api/projects`
- Browser console errors (if any)
- Whether environment variables are set


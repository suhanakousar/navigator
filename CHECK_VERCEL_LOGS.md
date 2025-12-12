# How to Check Vercel Function Logs

## Quick Steps to Find the Error

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Select your project

2. **Open Functions Tab**
   - Click on **"Functions"** in the top menu
   - Find **`/api/index.js`** in the list
   - Click on it

3. **View Logs**
   - You'll see a list of function invocations
   - Click on a failed one (red status)
   - Scroll down to see the **logs**

4. **Look for These Error Messages:**

   **Missing DATABASE_URL:**
   ```
   DATABASE_URL must be set
   DATABASE_URL environment variable is required
   ```

   **Database Connection Error:**
   ```
   Connection timeout
   ECONNREFUSED
   Connection refused
   ```

   **Other Errors:**
   - Module not found
   - Import errors
   - Initialization errors

## What to Do Based on Error

### Error: "DATABASE_URL must be set"
**Solution:**
1. Go to Vercel → Settings → Environment Variables
2. Add `DATABASE_URL` with your database connection string
3. Redeploy

### Error: "Connection timeout" or "ECONNREFUSED"
**Solution:**
- Use a **serverless-compatible database** (Neon.tech recommended)
- Traditional PostgreSQL won't work with serverless functions
- Get a free database at https://neon.tech

### Error: "Module not found"
**Solution:**
- Check that the build completed successfully
- Verify `api/index.js` exists in the deployment
- Check build logs for TypeScript errors

## Screenshot Locations

The logs will show:
- ✅ Initialization messages
- ❌ Error messages
- 📋 Environment variable checks
- 🔄 Route registration status

## Still Need Help?

Share:
1. The **exact error message** from the logs
2. The **timestamp** of the failed request
3. Whether `DATABASE_URL` is set in Vercel


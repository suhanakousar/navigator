# Vercel Deployment Troubleshooting

## Common 500 Errors and Solutions

### 1. FUNCTION_INVOCATION_FAILED Error

This error means the serverless function is crashing. Check Vercel function logs for details.

#### Common Causes:

**A. Missing Environment Variables**
- Check that `DATABASE_URL` is set in Vercel
- Check that `SESSION_SECRET` is set
- Verify all required env vars are present

**B. Database Connection Issues**
- Use a serverless-compatible database (Neon.tech, Supabase)
- Traditional PostgreSQL may not work with serverless functions
- Check connection string format

**C. TypeScript Compilation Issues**
- Vercel should auto-compile TypeScript in `api/` folder
- If not working, check `vercel.json` configuration
- Ensure `tsconfig.json` includes the `api` folder

**D. Import Path Issues**
- Check that all imports use correct paths
- Verify `@shared` and `@/` aliases work in serverless environment

### 2. How to Check Vercel Logs

1. Go to Vercel Dashboard
2. Select your project
3. Click on "Functions" tab
4. Click on a function to see logs
5. Look for error messages and stack traces

### 3. Testing Locally

Test the serverless function locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
vercel dev
```

### 4. Database Connection for Serverless

**Recommended: Neon.tech**
- Free tier available
- Serverless-compatible
- Connection pooling built-in
- Get connection string from Neon dashboard

**Connection String Format:**
```
postgresql://user:password@host/database?sslmode=require
```

### 5. Environment Variables Checklist

Required:
- ✅ `DATABASE_URL`
- ✅ `SESSION_SECRET`
- ✅ `NODE_ENV=production`

Optional (for AI features):
- `GEMINI_API_KEY`
- `BYTEZ_API_KEY`
- `OPENAI_API_KEY`
- `MURF_API_KEY`
- `SAMBANOVA_API_KEY`

Firebase (if using):
- `FIREBASE_SERVICE_ACCOUNT` (JSON string)
- `FIREBASE_PROJECT_ID`

### 6. Debugging Steps

1. **Check Function Logs**
   - Go to Vercel Dashboard → Functions → View Logs
   - Look for initialization errors
   - Check for database connection errors

2. **Verify Build Success**
   - Check that build completes without errors
   - Verify `dist/public` contains built files
   - Check that `api/index.ts` is present

3. **Test Database Connection**
   - Verify `DATABASE_URL` is correct
   - Test connection from local machine
   - Ensure database allows connections from Vercel IPs

4. **Check Import Paths**
   - Verify all imports resolve correctly
   - Check TypeScript compilation
   - Ensure shared code is accessible

### 7. Common Fixes

**Fix: Database Connection Timeout**
```typescript
// Use connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // Important for serverless
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Fix: Missing Environment Variables**
- Double-check all env vars in Vercel dashboard
- Redeploy after adding new variables
- Use Vercel's environment variable UI

**Fix: TypeScript Errors**
- Ensure `tsconfig.json` includes `api` folder
- Check that all types are properly imported
- Verify no circular dependencies

### 8. Getting More Detailed Errors

Add more logging to `api/index.ts`:

```typescript
console.log("Request received:", req.method, req.path);
console.log("Environment:", {
  NODE_ENV: process.env.NODE_ENV,
  hasDb: !!process.env.DATABASE_URL,
});
```

### 9. Vercel Function Limits

- **Memory**: 1024 MB (configurable in vercel.json)
- **Timeout**: 30 seconds (configurable)
- **Cold Start**: First request may be slower

### 10. Still Not Working?

1. Check Vercel status page
2. Review function logs in detail
3. Test with a simple endpoint first
4. Verify all dependencies are in package.json
5. Check for any missing build steps


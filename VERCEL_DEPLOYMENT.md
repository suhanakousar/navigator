# Vercel Deployment Guide

This guide will help you deploy the Neon Interface / LifeNavigator application to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Your GitHub repository connected to Vercel
3. Environment variables configured in Vercel

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will automatically detect the project settings from `vercel.json`

### 2. Configure Build Settings

Vercel should automatically detect:
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`

### 3. Set Environment Variables

In your Vercel project settings, add the following environment variables:

#### Required:
```
DATABASE_URL=your-postgresql-connection-string
SESSION_SECRET=your-session-secret-key
NODE_ENV=production
```

#### Optional (for AI features):
```
GEMINI_API_KEY=your-gemini-api-key
BYTEZ_API_KEY=your-bytez-api-key
BYTEZ_VIDEO_API_KEY=your-bytez-video-key
BYTEZ_DOCUMENT_API_KEY=your-bytez-document-key
OPENAI_API_KEY=your-openai-api-key
MURF_API_KEY=your-murf-api-key
SAMBANOVA_API_KEY=your-sambanova-api-key
```

### 4. Database Setup

**Important**: Vercel serverless functions require a database that supports serverless connections.

#### Recommended Options:

1. **Neon.tech** (Recommended)
   - Serverless PostgreSQL
   - Free tier available
   - Perfect for Vercel deployments
   - Get connection string from Neon dashboard

2. **Supabase**
   - PostgreSQL with serverless support
   - Free tier available

3. **Vercel Postgres** (if available)
   - Native Vercel integration

**Note**: Traditional PostgreSQL databases may have connection pooling issues with serverless functions. Use a serverless-compatible database.

### 5. Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your app will be live at `https://your-project.vercel.app`

## Troubleshooting

### Build Failures

**Issue**: Build fails with TypeScript errors
- **Solution**: Ensure all TypeScript files compile correctly locally with `npm run check`

**Issue**: Build fails with missing dependencies
- **Solution**: Check that all dependencies are in `package.json` and run `npm install` locally to verify

### Runtime Errors

**Issue**: Database connection errors
- **Solution**: 
  - Verify `DATABASE_URL` is set correctly in Vercel
  - Ensure your database supports serverless connections
  - Check database connection pooling settings

**Issue**: API routes return 404
- **Solution**: 
  - Verify `api/index.ts` exists
  - Check Vercel function logs in the dashboard
  - Ensure routes are properly registered in `server/routes.ts`

**Issue**: Static files not loading
- **Solution**: 
  - Verify build output is in `dist/public`
  - Check `vercel.json` rewrites configuration
  - Ensure `outputDirectory` is set to `dist/public`

### Function Timeout

**Issue**: Functions timeout after 10 seconds
- **Solution**: 
  - The `vercel.json` config sets `maxDuration` to 30 seconds
  - For longer operations, consider using background jobs
  - Optimize database queries and API calls

### Environment Variables

**Issue**: Environment variables not working
- **Solution**: 
  - Verify variables are set in Vercel project settings
  - Redeploy after adding new environment variables
  - Check variable names match exactly (case-sensitive)

## Project Structure for Vercel

```
.
├── api/
│   └── index.ts          # Vercel serverless function handler
├── client/               # React frontend
├── server/               # Express backend
├── dist/
│   └── public/          # Build output (served as static files)
├── vercel.json          # Vercel configuration
└── package.json
```

## Important Notes

1. **Serverless Functions**: The Express app runs as a serverless function in Vercel. Each API request invokes the function.

2. **Cold Starts**: First request after inactivity may be slower due to cold starts. This is normal for serverless functions.

3. **Database Connections**: Use connection pooling or serverless-compatible databases to avoid connection issues.

4. **File Uploads**: Large file uploads may hit size limits. Consider using external storage (S3, Cloudinary) for large files.

5. **WebSocket Support**: WebSocket connections may not work in serverless functions. Consider using Vercel's WebSocket support or external services.

## Monitoring

- Check Vercel dashboard for deployment logs
- Monitor function logs in the Vercel dashboard
- Set up error tracking (Sentry, etc.) for production

## Next Steps

After deployment:
1. Test all API endpoints
2. Verify database connections
3. Test authentication flows
4. Monitor performance and errors
5. Set up custom domain (optional)


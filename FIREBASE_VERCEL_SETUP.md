# Firebase + Vercel Setup Guide

## Fixing "auth/unauthorized-domain" Error

When you deploy to Vercel, Firebase blocks authentication from unauthorized domains. You need to add your Vercel domain to Firebase's authorized domains list.

## Steps to Fix

### 1. Get Your Vercel Domain

After deploying to Vercel, you'll get a domain like:
- `your-project.vercel.app` (default)
- Or your custom domain if configured

### 2. Add Domain to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **navigator-4fc34**
3. Click on the **Authentication** section in the left sidebar
4. Click on **Settings** tab
5. Scroll down to **Authorized domains**
6. Click **Add domain**
7. Add your Vercel domain(s):
   - `your-project.vercel.app`
   - `*.vercel.app` (for preview deployments - optional)
   - Your custom domain if you have one

### 3. Authorized Domains Should Include:

```
localhost (already there for development)
your-project.vercel.app
*.vercel.app (optional - for preview deployments)
your-custom-domain.com (if applicable)
```

### 4. Save and Wait

- Click **Save**
- Changes may take a few minutes to propagate
- Try signing in again after a few minutes

## For Preview Deployments

If you want preview deployments (from pull requests) to work:

1. Add `*.vercel.app` as a wildcard domain
2. Or add each preview deployment URL individually

**Note**: Wildcard domains (`*.vercel.app`) allow any Vercel preview deployment to work, which is convenient but less secure. For production, consider adding specific domains only.

## Current Firebase Project

- **Project ID**: `navigator-4fc34`
- **Auth Domain**: `navigator-4fc34.firebaseapp.com`

## Testing

After adding the domain:

1. Wait 2-5 minutes for changes to propagate
2. Clear your browser cache/cookies
3. Try signing in again
4. Check browser console for any remaining errors

## Alternative: Environment-Based Configuration

If you want different Firebase configs for different environments, you can use environment variables:

```typescript
// client/src/lib/firebase.ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // ... other config
};
```

Then set these in Vercel's environment variables.

## Troubleshooting

**Still getting the error?**
- Verify the domain is exactly as shown in Vercel (check for typos)
- Wait a few more minutes for propagation
- Check Firebase console to confirm the domain was added
- Try in an incognito/private window
- Check browser console for the exact error message

**Multiple environments?**
- Add all your domains (production, staging, preview)
- Or use wildcard domains if appropriate


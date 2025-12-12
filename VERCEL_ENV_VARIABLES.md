# Vercel Environment Variables Guide

## How to Add Environment Variables in Vercel

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter the **Name** and **Value**
5. Select **Environment** (Production, Preview, Development - or all)
6. Click **Save**
7. **Redeploy** your project for changes to take effect

---

## 🔴 REQUIRED (Must Have)

These are **essential** for the application to work:

### 1. `DATABASE_URL`
**Required:** ✅ Yes  
**Description:** PostgreSQL database connection string  
**Example:**
```
postgresql://user:password@host.neon.tech/dbname?sslmode=require
```
**How to get:**
- Sign up at https://neon.tech (free)
- Create a new project
- Copy the connection string from dashboard
- **Important:** Use Neon.tech or Supabase (serverless-compatible)

### 2. `SESSION_SECRET`
**Required:** ✅ Yes  
**Description:** Secret key for encrypting sessions  
**How to generate:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**Example:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### 3. `NODE_ENV`
**Required:** ✅ Yes  
**Description:** Environment mode  
**Value:**
```
production
```

---

## 🟡 OPTIONAL (For AI Features)

These enable specific AI features. Add only the ones you want to use:

### Video Generation

#### `GOOGLE_API_KEY` (Recommended for Video)
**Required:** ⚠️ For video generation  
**Description:** Google API key for Veo 1.5 video generation  
**Current value in code:**
```
AIzaSyDMUiPPecWYiH0IdfT6ubMQvyXaRBe0EXM
```
**Note:** Video generation uses Google Veo first, then falls back to Bytez

#### `BYTEZ_VIDEO_API_KEY` (Fallback for Video)
**Required:** ⚠️ If Google Veo fails  
**Description:** Bytez API key for video generation (fallback)  
**Current value in code:**
```
72766a8ab41bb8e6ee002cc4e4dd42c6
```

### Image Generation

#### `BYTEZ_API_KEY`
**Required:** ⚠️ For image generation  
**Description:** Bytez API key for image generation  
**Current value in code:**
```
349c88bd7835622d5760900f6b0f8a51
```

### AI Chat

#### `OPENAI_API_KEY`
**Required:** ⚠️ For AI chat  
**Description:** OpenAI API key for chat completions  
**Format:**
```
sk-...
```
**Get from:** https://platform.openai.com/api-keys

#### `GEMINI_API_KEY`
**Required:** ⚠️ Alternative for AI chat  
**Description:** Google Gemini API key  
**Get from:** https://makersuite.google.com/app/apikey

#### `SAMBANOVA_API_KEY`
**Required:** ⚠️ Alternative for AI chat  
**Description:** SambaNova AI API key  
**Current value in code:**
```
c8238532-f38b-4180-8ab1-bae5a4f1fd30
```

### Voice Generation

#### `MURF_API_KEY`
**Required:** ⚠️ For voice generation  
**Description:** Murf.ai API key for text-to-speech  
**Current value in code:**
```
ap2_7416f00f-4e9a-4368-8ca2-707a27a26196
```
**Get from:** https://www.murf.ai/

### Document Analysis

#### `BYTEZ_DOCUMENT_API_KEY`
**Required:** ⚠️ For document analysis  
**Description:** Bytez API key for document processing  
**Current value in code:**
```
e05bb4f31ced25f7d0bd7340eb8d6688
```

#### `BYTEZ_DIALOGUE_API_KEY`
**Required:** ⚠️ For dialogue summarization  
**Description:** Bytez API key for dialogue processing  
**Current value in code:**
```
19ddd0a5c384c7365b8e0bd620351a1e
```

### Firebase Authentication (if using)

#### `FIREBASE_SERVICE_ACCOUNT`
**Required:** ⚠️ For Firebase auth  
**Description:** Firebase service account JSON (as string)  
**Format:** JSON string (minified)

#### `FIREBASE_PROJECT_ID`
**Required:** ⚠️ For Firebase auth  
**Description:** Firebase project ID  
**Example:**
```
navigator-4fc34
```

---

## 📋 Quick Copy-Paste List

### Minimum Required (App will work):
```
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
SESSION_SECRET=your-random-secret-here
NODE_ENV=production
```

### Recommended (Full AI Features):
```
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
SESSION_SECRET=your-random-secret-here
NODE_ENV=production
GOOGLE_API_KEY=AIzaSyDMUiPPecWYiH0IdfT6ubMQvyXaRBe0EXM
BYTEZ_API_KEY=349c88bd7835622d5760900f6b0f8a51
BYTEZ_VIDEO_API_KEY=72766a8ab41bb8e6ee002cc4e4dd42c6
OPENAI_API_KEY=sk-your-key-here
GEMINI_API_KEY=your-gemini-key-here
MURF_API_KEY=ap2_7416f00f-4e9a-4368-8ca2-707a27a26196
```

---

## 🎯 Priority Order

1. **Start with REQUIRED** (DATABASE_URL, SESSION_SECRET, NODE_ENV)
2. **Add GOOGLE_API_KEY** for video generation (most important for videos)
3. **Add other keys** as needed for specific features

---

## ⚠️ Important Notes

- **API keys in code are fallbacks** - Always set them in Vercel for production
- **DATABASE_URL must be serverless-compatible** (Neon.tech recommended)
- **After adding variables, redeploy** your project
- **Test with `/api/health`** endpoint to verify configuration

---

## 🔍 Verify Your Setup

After adding variables, test:
```bash
# Test health endpoint
curl https://your-project.vercel.app/api/health

# Should return:
{
  "status": "ok",
  "environment": {
    "hasDatabaseUrl": true,
    "hasSessionSecret": true,
    ...
  },
  "database": "connected"
}
```


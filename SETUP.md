# Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database

You have several options:

#### Option A: Docker (Recommended for Local Development)
```bash
docker run --name neon-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=neon -p 5432:5432 -d postgres:15
```

Then update `.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/neon
```

#### Option B: Free Cloud Database (Neon.tech)
1. Go to https://neon.tech
2. Sign up and create a new project
3. Copy the connection string
4. Update `.env` with your `DATABASE_URL`

#### Option C: Local PostgreSQL Installation
If you have PostgreSQL installed locally, update `.env`:
```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

### 3. Initialize Database Schema
```bash
npm run db:push
```

This will create all the required tables in your database.

### 4. Configure Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

**Required variables:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/neon
SESSION_SECRET=dev-secret-change-in-production
```

**Optional AI Service API Keys:**
```env
# Google Gemini AI - for document analysis and chat
GEMINI_API_KEY=your-gemini-api-key-here
# Get from: https://makersuite.google.com/app/apikey

# Bytez.js API Keys - for various AI models
BYTEZ_API_KEY=your-bytez-image-key          # Image generation
BYTEZ_VIDEO_API_KEY=your-bytez-video-key    # Video generation
BYTEZ_DIALOGUE_API_KEY=your-dialogue-key     # Dialogue summarization
BYTEZ_DOCUMENT_API_KEY=your-document-key     # Document analysis (recommended)

# OpenAI - for AI chat and image generation fallback
OPENAI_API_KEY=sk-your-key-here
# Get from: https://platform.openai.com/api-keys

# Murf.ai - for voice generation
MURF_API_KEY=your-murf-api-key
# Get from: https://www.murf.ai/

# Server Configuration
PORT=5678                         # Server port (defaults to 5678)
NODE_ENV=development              # development or production
```

### 6. Configure AI Services (Optional but Recommended)

#### Document Analysis (Recommended)
For best document analysis results, configure:

1. **Google Gemini AI** (for PDF and image analysis):
   - Go to https://makersuite.google.com/app/apikey
   - Create an API key
   - Add to `.env`:
     ```env
     GEMINI_API_KEY=your-gemini-api-key-here
     ```

2. **Bytez Document API** (for document analysis):
   - Add to `.env`:
     ```env
     BYTEZ_DOCUMENT_API_KEY=your-bytez-document-api-key
     ```

#### Image Generation (Bytez.js)
- **Bytez.js is already configured** with a default API key
- Image generation will work out of the box
- To use your own key, add to `.env`:
  ```env
  BYTEZ_API_KEY=your-bytez-api-key
  ```

#### Voice Assistant Chat (SambaNova AI)
For the voice assistant chat feature:

1. Add to `.env`:
   ```env
   SAMBANOVA_API_KEY=your-sambanova-api-key-here
   ```
2. The voice assistant will use SambaNova AI (ALLaM-7B-Instruct-preview model) for responses
3. Restart the development server

**Note**: SambaNova is the primary chat provider for the voice assistant. If not configured, it will fallback to Gemini, then OpenAI.

#### OpenAI (Optional - for Chat & Image Fallback)
To enable AI chat and image generation fallback:

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in to your OpenAI account
3. Create a new API key
4. Add it to your `.env` file:
   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
5. Restart the development server

**Note**: 
- **Voice Assistant** uses **SambaNova AI** (primary), then **Gemini** (fallback), then **OpenAI** (final fallback)
- Document analysis uses **Gemini AI** (primary) and **Bytez Document API** (fallback)
- Image generation uses **Bytez.js by default** (works immediately)
- OpenAI is used for chat fallback and image generation fallback
- Without any AI keys, chat will show a friendly message instead of an error

### 5. Start Development Server
```bash
npm run dev
```

The server will start on http://localhost:5678

## Troubleshooting

### Database Connection Issues
- Make sure PostgreSQL is running
- Verify the `DATABASE_URL` in `.env` is correct
- Check that the database exists
- Ensure the port (default 5432) is not blocked

### Authentication Issues
- **Local Development**: If `REPL_ID` is not set, the app automatically runs in local development mode with authentication bypassed. A mock user will be created automatically.
- **Replit Deployment**: Set `REPL_ID` and `ISSUER_URL` environment variables for Replit Auth to work.

### Missing Environment Variables
All required variables are listed in `.env.example`. Copy it to `.env` and fill in the values.


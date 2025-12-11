# LifeNavigator - AI-Powered Creative Assistant Platform

## Overview
LifeNavigator is a premium AI-powered creative and intelligent assistant platform featuring futuristic glassmorphic UI with neon holographic elements. The platform includes multiple AI-powered modules for voice, image, video, document analysis, and workflow automation.

## Project Architecture

### Frontend (`client/`)
- **Framework**: React with TypeScript, Vite bundler
- **Routing**: wouter for client-side navigation
- **State Management**: TanStack Query v5 for server state
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Shadcn/ui with custom futuristic glassmorphic styling

### Backend (`server/`)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Real-time**: WebSocket for streaming updates
- **AI Integration**: OpenAI GPT-4o for chat, DALL-E 3 for images

### Shared (`shared/`)
- **schema.ts**: All database models and Zod validation schemas

## Key Design Choices
- **Dark-first design**: Futuristic neon aesthetic with glassmorphism
- **Color palette**: Purple, cyan, magenta gradients with pink-gold accents
- **Animations**: Custom float, glow-pulse, gradient-shift, shimmer effects
- **Responsive**: Desktop (1024px+), Tablet (768-1023px), Mobile (<768px)

## Database Schema
- **users**: User accounts (Replit Auth integration)
- **sessions**: Session storage for authentication
- **projects**: User project containers
- **assets**: Media assets (images, videos, audio, documents)
- **conversations**: AI chat conversations
- **messages**: Individual chat messages
- **memories**: AI long-term memory storage
- **jobs**: Background processing jobs
- **workflows**: Automation workflow definitions
- **workflow_runs**: Workflow execution history
- **voice_models**: Custom voice model configurations

## API Routes
### Authentication
- `GET /api/login` - Initiate Replit Auth login
- `GET /api/logout` - End session and logout
- `GET /api/auth/user` - Get current authenticated user

### Projects & Assets
- `GET/POST /api/projects` - List/create projects
- `GET/PATCH/DELETE /api/projects/:id` - Manage specific project
- `GET/POST/DELETE /api/assets` - Manage media assets

### AI Features
- `POST /api/chat` - AI chat completion (OpenAI GPT-4o)
- `POST /api/images/generate` - Image generation (DALL-E 3)

### Conversations & Memory
- `GET/POST/DELETE /api/conversations` - Manage conversations
- `GET/POST /api/conversations/:id/messages` - Manage messages
- `GET/POST/DELETE /api/memories` - AI memory management

### Automation
- `GET/POST/PATCH/DELETE /api/workflows` - Workflow management
- `GET/POST /api/jobs` - Background job management

### Voice
- `GET/POST/DELETE /api/voice-models` - Voice model management

## File Structure
```
├── client/
│   └── src/
│       ├── components/
│       │   ├── ui/           # Shadcn/ui components
│       │   ├── animated-orb.tsx
│       │   ├── app-sidebar.tsx
│       │   ├── bottom-nav.tsx
│       │   ├── glass-card.tsx
│       │   ├── loading-skeleton.tsx
│       │   ├── empty-state.tsx
│       │   └── waveform.tsx
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── use-mobile.tsx
│       │   └── use-toast.ts
│       ├── lib/
│       │   ├── authUtils.ts
│       │   ├── queryClient.ts
│       │   └── utils.ts
│       └── pages/
│           ├── landing.tsx
│           ├── dashboard.tsx
│           ├── voice-assistant.tsx
│           ├── voice-studio.tsx
│           ├── image-studio.tsx
│           ├── video-studio.tsx
│           ├── documents.tsx
│           ├── automations.tsx
│           ├── projects.tsx
│           └── settings.tsx
├── server/
│   ├── db.ts
│   ├── index.ts
│   ├── replitAuth.ts
│   ├── routes.ts
│   └── storage.ts
└── shared/
    └── schema.ts
```

## User Preferences
- Dark mode by default
- Futuristic glassmorphic design
- Smooth animations and transitions
- No emojis in UI

## Recent Changes
- 2024-12-11: Implemented complete database schema with all models
- 2024-12-11: Set up Replit Auth with OIDC
- 2024-12-11: Created full backend API with all routes
- 2024-12-11: Built all frontend pages with futuristic UI
- 2024-12-11: Configured custom Tailwind design system

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-provided)
- `SESSION_SECRET`: Session encryption key (required)
- `OPENAI_API_KEY`: OpenAI API key for AI features (optional)
- `REPL_ID`: Replit project ID (auto-provided)
- `ISSUER_URL`: OIDC issuer URL (defaults to Replit)

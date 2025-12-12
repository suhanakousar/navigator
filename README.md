# Neon Interface / LifeNavigator

A futuristic, AI-powered creative platform that combines multiple AI services for document analysis, image/video/voice generation, and workflow automation. Built with a stunning glassmorphic UI inspired by premium OS interfaces and sci-fi aesthetics.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18.3-blue)
![Node](https://img.shields.io/badge/Node-Express-green)

## ✨ Features

### 🤖 AI-Powered Capabilities
- **Voice Assistant** - Interactive AI chat with multi-provider support (SambaNova, Gemini, OpenAI)
- **Document Analysis** - Upload PDFs/images, extract data, OCR, and generate actionable insights
- **Image Generation** - Create stunning images from text prompts using Bytez.js or DALL-E
- **Video Generation** - Generate videos from text descriptions
- **Voice Synthesis** - Text-to-speech with customizable voices via Murf.ai
- **Smart Workflows** - Visual workflow builder for automation

### 🎨 Modern UI/UX
- **Futuristic Design** - Glassmorphic cards, neon gradients, and 3D animated orbs
- **Dark Theme** - Immersive dark interface with ambient glows
- **Responsive** - Seamless experience across desktop, tablet, and mobile
- **Component Library** - Comprehensive UI component system built on Radix UI

### 📦 Project Management
- **Projects & Assets** - Organize your creations into projects
- **Asset Library** - Manage images, videos, voice files, and documents
- **Public/Private Projects** - Share your work or keep it private
- **Conversation History** - Persistent chat history with AI assistant

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+ (or Docker)
- (Optional) API keys for AI services

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Neon-Interface
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**

   **Option A: Docker (Recommended)**
   ```bash
   docker run --name neon-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=neon -p 5432:5432 -d postgres:15
   ```

   **Option B: Cloud Database (Neon.tech)**
   - Sign up at https://neon.tech
   - Create a new project
   - Copy the connection string

   **Option C: Local PostgreSQL**
   - Install PostgreSQL locally
   - Create a database

4. **Configure environment variables**

   Create a `.env` file in the project root:
   ```env
   # Required
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/neon
   SESSION_SECRET=dev-secret-change-in-production
   
   # Optional AI Services
   GEMINI_API_KEY=your-gemini-api-key
   BYTEZ_API_KEY=your-bytez-api-key
   BYTEZ_VIDEO_API_KEY=your-bytez-video-key
   BYTEZ_DOCUMENT_API_KEY=your-bytez-document-key
   OPENAI_API_KEY=sk-your-openai-key
   MURF_API_KEY=your-murf-api-key
   SAMBANOVA_API_KEY=your-sambanova-api-key
   
   # Server Configuration
   PORT=5678
   NODE_ENV=development
   ```

5. **Initialize database schema**
   ```bash
   npm run db:push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5678`

## 📚 Project Structure

```
Neon-Interface/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── pages/         # Route pages (dashboard, studios, etc.)
│   │   ├── components/    # UI components
│   │   │   ├── layout/    # Layout components (sidebar, nav)
│   │   │   └── ui/        # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configurations
│   └── public/            # Static assets
├── server/                # Express backend
│   ├── routes.ts         # API route definitions
│   ├── services/         # AI service integrations
│   │   ├── geminiService.ts
│   │   ├── bytezService.ts
│   │   ├── murfService.ts
│   │   └── sambanovaService.ts
│   ├── db.ts             # Database connection
│   └── storage.ts        # Database operations
├── shared/               # Shared code between client/server
│   └── schema.ts         # Database schemas and types
├── script/               # Build scripts
└── dist/                 # Production build output
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Wouter** - Lightweight routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animations
- **Firebase** - Authentication

### Backend
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Drizzle ORM** - Type-safe database queries
- **WebSocket** - Real-time features
- **Multer** - File upload handling

### AI Services
- **SambaNova AI** - Primary chat provider
- **Google Gemini** - Document analysis & chat fallback
- **OpenAI** - Chat & image generation fallback
- **Bytez.js** - Image/video generation & document analysis
- **Murf.ai** - Voice synthesis

## 🔑 API Keys Setup

### Required for Full Functionality

1. **Google Gemini** (Document Analysis & Chat)
   - Get key: https://makersuite.google.com/app/apikey
   - Add: `GEMINI_API_KEY=your-key`

2. **Bytez.js** (Image/Video Generation)
   - Image generation works with default key
   - Add custom: `BYTEZ_API_KEY=your-key`

3. **SambaNova AI** (Voice Assistant Chat)
   - Get key from SambaNova
   - Add: `SAMBANOVA_API_KEY=your-key`

### Optional

4. **OpenAI** (Chat & Image Fallback)
   - Get key: https://platform.openai.com/api-keys
   - Add: `OPENAI_API_KEY=sk-your-key`

5. **Murf.ai** (Voice Generation)
   - Get key: https://www.murf.ai/
   - Add: `MURF_API_KEY=your-key`

**Note**: The app gracefully degrades if API keys are missing. Features will show friendly messages instead of errors.

## 📖 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type check TypeScript
- `npm run db:push` - Push database schema changes

## 🎯 Key Features Explained

### Voice Assistant
Interactive AI chat interface with multi-provider fallback:
1. SambaNova AI (primary)
2. Google Gemini (fallback)
3. OpenAI (final fallback)

### Document Analysis
Upload documents (PDF, images) to:
- Extract structured data
- Perform OCR on images
- Generate suggested actions (autofill forms, create tasks, send emails)
- Store analysis results as assets

### Image Studio
Generate images from text prompts with:
- Multiple style options
- Size customization
- Automatic asset saving
- Project organization

### Video Studio
Create videos from text descriptions using Bytez.js video generation API.

### Voice Studio
Text-to-speech with:
- Multiple voice options from Murf.ai
- Customizable speed, pitch, and sample rate
- Voice model management

### Workflows
Visual workflow builder for:
- Creating automation pipelines
- Connecting AI services
- Executing workflows
- Tracking workflow runs

## 🔒 Authentication

The app supports multiple authentication methods:

- **Firebase Authentication** - Primary auth method
- **Replit Auth** - For Replit deployments (optional)
- **Local Development** - Auto-creates mock user when `REPL_ID` is not set

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts and preferences
- `projects` - User projects (public/private)
- `assets` - Generated content (images, videos, voice, documents)
- `conversations` - Chat conversation history
- `messages` - Individual chat messages
- `workflows` - Automation workflows
- `jobs` - Background processing jobs
- `memories` - User preferences and stored data
- `voice_models` - Custom voice configurations

## 🎨 Design System

The UI follows a futuristic design system with:

- **Glassmorphism** - Semi-transparent cards with backdrop blur
- **Neon Gradients** - Purple, cyan, and pink color schemes
- **3D Elements** - Animated orbs and holographic effects
- **Dark Theme** - Immersive dark backgrounds
- **Responsive Layout** - Adapts to all screen sizes

See `design_guidelines.md` for detailed design specifications.

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Ensure database exists
- Check port 5432 is not blocked

### Authentication Issues
- **Local Dev**: App auto-creates mock user if `REPL_ID` is not set
- **Replit**: Set `REPL_ID` and `ISSUER_URL` environment variables

### API Key Issues
- Check `.env` file exists and keys are correct
- Restart server after adding new keys
- Check API key permissions and quotas

### Build Issues
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (requires 18+)
- Verify TypeScript compilation: `npm run check`

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Session encryption secret |
| `GEMINI_API_KEY` | No | Google Gemini API key |
| `BYTEZ_API_KEY` | No | Bytez.js image generation key |
| `BYTEZ_VIDEO_API_KEY` | No | Bytez.js video generation key |
| `BYTEZ_DOCUMENT_API_KEY` | No | Bytez.js document analysis key |
| `OPENAI_API_KEY` | No | OpenAI API key |
| `MURF_API_KEY` | No | Murf.ai voice generation key |
| `SAMBANOVA_API_KEY` | No | SambaNova AI API key |
| `PORT` | No | Server port (default: 5678) |
| `NODE_ENV` | No | Environment (development/production) |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Radix UI** - For accessible component primitives
- **Tailwind CSS** - For the utility-first CSS framework
- **Drizzle ORM** - For type-safe database queries
- All AI service providers for their APIs

## 📞 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

Built with ❤️ using React, TypeScript, and Express.js


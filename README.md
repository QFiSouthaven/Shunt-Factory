<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Shunt Factory

A professional-grade, memory-efficient frontend interface for advanced AI-driven text transformation, system orchestration, and agentic development.

## Features

- **Shunt**: AI-powered text transformation (summarize, amplify, format, etc.)
- **Weaver**: Complex multi-step workflow orchestration
- **Foundry**: Multi-agent system for code review and design
- **Framework**: Architecture visualization and simulation
- **Mia Assistant**: Floating AI assistant with context awareness
- **MCP Integration**: Model Context Protocol for AI tool integration

## Tech Stack

**Frontend**: React 19, TypeScript, Vite, ReactFlow, Vitest
**Backend**: Express.js, TypeScript, Google Cloud Secret Manager, Jest
**AI**: Google Gemini API, Anthropic Claude API

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Frontend Only (Development)

```bash
npm install
# Set GEMINI_API_KEY in .env.local
npm run dev
```

### Full Stack (Production Mode)

```bash
# Terminal 1 - Backend
cd backend && npm install
npm run dev

# Terminal 2 - Frontend
# Set VITE_USE_BACKEND=true in .env.local
npm run dev
```

## Environment Setup

Create `.env.local` in project root:

```bash
# For frontend-only mode
GEMINI_API_KEY=your_key_here

# For backend mode
VITE_USE_BACKEND=true
VITE_BACKEND_URL=http://localhost:8080
VITE_API_KEY=your_client_api_key
```

For backend configuration, see `backend/.env.example`.

## Testing

```bash
# Frontend tests (Vitest)
npm test                    # Watch mode
npm run test:run            # Single run
npm run test:coverage       # Coverage report

# Backend tests (Jest)
cd backend && npm test
```

## Deployment

### Docker (Backend)

```bash
cd backend
docker build -t shunt-backend .
docker run -p 8080:8080 --env-file .env.local shunt-backend
```

### Google Cloud Run

```bash
# Initial setup
cd backend && ./scripts/setup-gcp.sh

# Deploy
gcloud builds submit --config=backend/cloudbuild.yaml
```

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive development guide
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment
- **[WINDOWS_SETUP.md](./WINDOWS_SETUP.md)** - Windows 11 setup
- **[backend/README.md](./backend/README.md)** - Backend API documentation
- **[backend/QUICK_START.md](./backend/QUICK_START.md)** - 5-minute backend setup

## Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run analyze      # Bundle size analysis
```

## Architecture

The application uses a modular, context-driven architecture with:
- **MissionControl**: Central navigation hub with lazy-loaded modules
- **Context Providers**: Global state management (Settings, Telemetry, MCP, Mailbox, Mia)
- **Service Layer**: Encapsulated API calls and business logic
- **Backend API**: Secure proxy for AI operations with rate limiting

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation.

## License

This project is proprietary software.

## AI Studio

View in AI Studio: https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221K-CWFE6D4bkUBMpv4yLR3WF6_nJIpTCl%22%5D,%22action%22:%22open%22,%22userId%22:%22104988959498628625918%22,%22resourceKeys%22:%7B%7D%7D

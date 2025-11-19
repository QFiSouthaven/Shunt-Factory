# Windows 11 Setup Guide

This guide covers how to set up and run Shunt Factory on Windows 11.

## Prerequisites

1. **Node.js 20+** - Download from [nodejs.org](https://nodejs.org/)
2. **Git** - Download from [git-scm.com](https://git-scm.com/)
3. **PowerShell 5.1+** (included with Windows 11)

## Quick Start

### 1. Clone the Repository

```powershell
git clone https://github.com/YourOrg/Shunt-Factory.git
cd Shunt-Factory
```

### 2. Install Dependencies

```powershell
npm install
```

### 3. Configure Environment

Create a `.env.local` file in the project root:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run Development Server

```powershell
npm run dev
```

The app will be available at http://localhost:3000

## Available npm Scripts

All npm scripts are cross-platform compatible and work on Windows:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run build:dev` | Build for development environment |
| `npm run build:staging` | Build for staging environment |
| `npm run build:prod` | Build for production environment |
| `npm run preview` | Preview production build locally |
| `npm run clean` | Remove build artifacts |
| `npm test` | Run tests |
| `npm run type-check` | Run TypeScript type checking |

## PowerShell Build Scripts

For more advanced build and deployment workflows, use the PowerShell scripts:

### Build Script

```powershell
# Build for production (default)
.\scripts\build.ps1

# Build for specific environment
.\scripts\build.ps1 -Environment development
.\scripts\build.ps1 -Environment staging
.\scripts\build.ps1 -Environment production
```

### Local Preview Script

```powershell
.\scripts\local-preview.ps1
```

### Deploy Script

```powershell
# Deploy to staging (default)
.\scripts\deploy.ps1

# Deploy to production
.\scripts\deploy.ps1 -Environment production
```

**Note:** The deploy script requires one of the following CLI tools to be installed:
- Vercel CLI: `npm install -g vercel`
- Netlify CLI: `npm install -g netlify-cli`
- AWS CLI: https://aws.amazon.com/cli/

### GCP Setup Script (Backend)

```powershell
.\backend\scripts\setup-gcp.ps1
```

**Prerequisites for GCP deployment:**
- Google Cloud SDK: https://cloud.google.com/sdk/docs/install

## Backend Setup

The backend is a Node.js Express server with its own dependencies:

```powershell
cd backend
npm install
npm run dev
```

### Backend Environment Variables

Create `backend/.env`:

```
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_API_KEY=your_client_api_key_here
PORT=8080
NODE_ENV=development
```

## Docker Setup (Optional)

If you want to run the multi-agent containers:

1. Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. Enable WSL 2 backend (recommended)

```powershell
cd multi-agent-containers
docker-compose up
```

## Troubleshooting

### PowerShell Execution Policy

If you get an error about script execution being disabled:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Node.js Version

Ensure you're using Node.js 20 or higher:

```powershell
node --version
```

### Port Already in Use

If port 3000 is in use, you can change it in `vite.config.ts` or kill the process:

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Clear Cache

If you encounter build issues:

```powershell
npm run clean
npm install
npm run dev
```

### Git Line Endings

If you see warnings about line endings, configure Git:

```powershell
git config --global core.autocrlf true
```

## IDE Recommendations

### Visual Studio Code

Recommended extensions:
- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- GitLens

### Settings

Add to your VS Code settings for consistent line endings:

```json
{
  "files.eol": "\n",
  "editor.formatOnSave": true
}
```

## Running Tests

```powershell
# Run all tests
npm test

# Run tests once (no watch mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Backend Tests

```powershell
cd backend
npm test
```

## Building for Production

```powershell
# Using npm script
npm run build:prod

# Or using PowerShell script
.\scripts\build.ps1 -Environment production
```

The production build will be output to the `dist/` folder.

## Common Issues

### 1. "cross-env is not recognized"

Run `npm install` to ensure dev dependencies are installed.

### 2. "rimraf is not recognized"

Run `npm install` to ensure dev dependencies are installed.

### 3. TypeScript errors

Run `npm run type-check` to see all TypeScript errors and fix them.

### 4. Network errors during npm install

Try using a different registry:

```powershell
npm config set registry https://registry.npmmirror.com
npm install
# Reset to default
npm config set registry https://registry.npmjs.org
```

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with:
   - Windows version
   - Node.js version
   - Error message
   - Steps to reproduce

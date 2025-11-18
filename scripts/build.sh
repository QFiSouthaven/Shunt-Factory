#!/bin/bash

# Production Build Script for Aether Shunt
# Usage: ./scripts/build.sh [environment]
# environment: development | staging | production (default: production)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get environment argument
ENV=${1:-production}

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  Aether Shunt Build Script${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "Environment: ${GREEN}$ENV${NC}"
echo -e "Node version: $(node --version)"
echo -e "npm version: $(npm --version)"
echo ""

# Validate environment
if [[ ! "$ENV" =~ ^(development|staging|production)$ ]]; then
  echo -e "${RED}❌ Invalid environment: $ENV${NC}"
  echo -e "Valid options: development, staging, production"
  exit 1
fi

# Set environment variable
export VITE_APP_ENV=$ENV

# Clean previous build
echo -e "${YELLOW}🧹 Cleaning previous build...${NC}"
rm -rf dist/
echo -e "${GREEN}✅ Clean complete${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci --silent
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Run TypeScript type checking
echo -e "${YELLOW}🔍 Running TypeScript type checking...${NC}"
npx tsc --noEmit
echo -e "${GREEN}✅ Type checking passed${NC}"
echo ""

# Run build
echo -e "${YELLOW}🏗️  Building application for $ENV...${NC}"
npm run build
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Verify build
echo -e "${YELLOW}✅ Verifying build output...${NC}"
if [ ! -f "dist/index.html" ]; then
  echo -e "${RED}❌ Build verification failed: index.html not found${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Build verification passed${NC}"
echo ""

# Display bundle sizes
echo -e "${BLUE}📦 Bundle Size Analysis:${NC}"
du -sh dist/
echo ""
echo -e "${BLUE}Top 10 JavaScript Bundles:${NC}"
find dist/assets -type f -name "*.js" -exec du -h {} + 2>/dev/null | sort -rh | head -10 || echo "No JS bundles found"
echo ""

# Check for console.log in production
if [ "$ENV" = "production" ]; then
  echo -e "${YELLOW}🔍 Checking for console.log in production build...${NC}"
  if grep -r "console\.log" dist/assets/*.js 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: console.log found in production build${NC}"
  else
    echo -e "${GREEN}✅ No console.log found${NC}"
  fi
  echo ""
fi

echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "Build output: ${BLUE}./dist/${NC}"
echo -e "Environment: ${GREEN}$ENV${NC}"
echo ""
echo -e "Next steps:"
echo -e "  - Test locally: ${BLUE}npm run preview${NC}"
echo -e "  - Deploy staging: ${BLUE}./scripts/deploy.sh staging${NC}"
echo -e "  - Deploy production: ${BLUE}./scripts/deploy.sh production${NC}"

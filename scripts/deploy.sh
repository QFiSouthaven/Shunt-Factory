#!/bin/bash

# Deployment Script for Aether Shunt
# Usage: ./scripts/deploy.sh [environment]
# environment: staging | production (default: staging)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get environment argument
ENV=${1:-staging}

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  Aether Shunt Deployment Script${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "Environment: ${GREEN}$ENV${NC}"
echo ""

# Validate environment
if [[ ! "$ENV" =~ ^(staging|production)$ ]]; then
  echo -e "${RED}❌ Invalid environment: $ENV${NC}"
  echo -e "Valid options: staging, production"
  exit 1
fi

# Production safety check
if [ "$ENV" = "production" ]; then
  echo -e "${YELLOW}⚠️  WARNING: You are about to deploy to PRODUCTION${NC}"
  echo -e "${YELLOW}This will affect live users!${NC}"
  echo ""
  read -p "Are you sure you want to continue? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 0
  fi
  echo ""
fi

# Check if dist/ exists
if [ ! -d "dist" ]; then
  echo -e "${YELLOW}📦 Build not found. Running build first...${NC}"
  ./scripts/build.sh $ENV
fi

# Verify build
echo -e "${YELLOW}🔍 Verifying build...${NC}"
if [ ! -f "dist/index.html" ]; then
  echo -e "${RED}❌ Build verification failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Build verified${NC}"
echo ""

# Check for deployment platform
echo -e "${YELLOW}🚀 Starting deployment to $ENV...${NC}"

# Detect which deployment platform to use
# Priority: Vercel > Netlify > AWS > GitHub Pages

# Check for Vercel
if command -v vercel &> /dev/null; then
  echo -e "${BLUE}Deploying to Vercel...${NC}"

  if [ "$ENV" = "production" ]; then
    vercel --prod
  else
    vercel
  fi

  echo -e "${GREEN}✅ Deployed to Vercel${NC}"

# Check for Netlify
elif command -v netlify &> /dev/null; then
  echo -e "${BLUE}Deploying to Netlify...${NC}"

  if [ "$ENV" = "production" ]; then
    netlify deploy --prod --dir=dist
  else
    netlify deploy --dir=dist
  fi

  echo -e "${GREEN}✅ Deployed to Netlify${NC}"

# Check for AWS CLI
elif command -v aws &> /dev/null; then
  echo -e "${BLUE}Deploying to AWS S3...${NC}"

  # Determine bucket name
  if [ "$ENV" = "production" ]; then
    BUCKET="aether-shunt-production"
  else
    BUCKET="aether-shunt-staging"
  fi

  echo -e "Bucket: ${BLUE}$BUCKET${NC}"

  # Sync to S3
  aws s3 sync dist/ s3://$BUCKET --delete --cache-control "public, max-age=31536000, immutable"

  echo -e "${GREEN}✅ Deployed to AWS S3${NC}"

  # Invalidate CloudFront (if configured)
  if [ ! -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}Invalidating CloudFront cache...${NC}"
    aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
    echo -e "${GREEN}✅ CloudFront cache invalidated${NC}"
  fi

else
  echo -e "${RED}❌ No deployment platform detected${NC}"
  echo -e "Please install one of the following:"
  echo -e "  - Vercel CLI: ${BLUE}npm install -g vercel${NC}"
  echo -e "  - Netlify CLI: ${BLUE}npm install -g netlify-cli${NC}"
  echo -e "  - AWS CLI: ${BLUE}https://aws.amazon.com/cli/${NC}"
  echo ""
  echo -e "Or manually deploy the ${BLUE}./dist/${NC} directory to your hosting platform"
  exit 1
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "Environment: ${GREEN}$ENV${NC}"
echo -e "Timestamp: $(date)"
echo ""

if [ "$ENV" = "production" ]; then
  echo -e "Production URL: ${BLUE}https://aethershunt.com${NC}"
else
  echo -e "Staging URL: ${BLUE}https://staging.aethershunt.com${NC}"
fi

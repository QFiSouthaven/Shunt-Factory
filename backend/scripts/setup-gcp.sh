#!/bin/bash

# Google Cloud Platform Setup Script for Shunt Factory Backend
# This script sets up all required GCP resources for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI not found. Please install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    print_error "No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

print_info "Using GCP Project: $PROJECT_ID"

# Enable required APIs
print_info "Enabling required Google Cloud APIs..."
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com

print_info "APIs enabled successfully"

# Prompt for Gemini API key
print_info "Setting up secrets..."
read -sp "Enter your Gemini API key: " GEMINI_API_KEY
echo

if [ -z "$GEMINI_API_KEY" ]; then
    print_error "Gemini API key cannot be empty"
    exit 1
fi

# Create Gemini API key secret
print_info "Creating gemini-api-key secret..."
echo -n "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=- || \
    (print_warn "Secret already exists, updating..." && \
     echo -n "$GEMINI_API_KEY" | gcloud secrets versions add gemini-api-key --data-file=-)

# Prompt for client API keys
print_info "Enter client API keys (comma-separated, or press Enter to generate random keys):"
read CLIENT_API_KEYS

if [ -z "$CLIENT_API_KEYS" ]; then
    # Generate random API keys
    KEY1=$(openssl rand -hex 32)
    KEY2=$(openssl rand -hex 32)
    CLIENT_API_KEYS="$KEY1,$KEY2"
    print_warn "Generated random API keys:"
    echo "Key 1: $KEY1"
    echo "Key 2: $KEY2"
    print_warn "Save these keys securely - they won't be shown again"
fi

# Create client API keys secret
print_info "Creating client-api-keys secret..."
echo -n "$CLIENT_API_KEYS" | gcloud secrets create client-api-keys --data-file=- || \
    (print_warn "Secret already exists, updating..." && \
     echo -n "$CLIENT_API_KEYS" | gcloud secrets versions add client-api-keys --data-file=-)

# Get project number
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Grant Cloud Run access to secrets
print_info "Granting Cloud Run service account access to secrets..."
gcloud secrets add-iam-policy-binding gemini-api-key \
    --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

gcloud secrets add-iam-policy-binding client-api-keys \
    --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

print_info "Secret access granted successfully"

# Optional: Create a service account specifically for the backend
print_info "Creating dedicated service account for backend..."
gcloud iam service-accounts create shunt-factory-backend \
    --display-name="Shunt Factory Backend Service Account" \
    --quiet || print_warn "Service account already exists"

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:shunt-factory-backend@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

print_info "Setup complete!"
print_info ""
print_info "Next steps:"
print_info "1. Deploy the backend: gcloud builds submit --config=backend/cloudbuild.yaml"
print_info "2. Update CORS origin after frontend deployment"
print_info "3. Configure your frontend to use the backend API URL"
print_info ""
print_info "Backend will be deployed to: https://shunt-factory-backend-<hash>-uc.a.run.app"

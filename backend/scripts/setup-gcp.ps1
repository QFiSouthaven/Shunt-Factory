# GCP Setup Script for Aether Shunt Backend (Windows PowerShell)
# Usage: .\backend\scripts\setup-gcp.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Aether Shunt GCP Setup (Windows)" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Check for gcloud CLI
if (-not (Get-Command "gcloud" -ErrorAction SilentlyContinue)) {
    Write-Host "gcloud CLI not found!" -ForegroundColor Red
    Write-Host "Please install: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Get current project
$PROJECT_ID = gcloud config get-value project 2>$null
if (-not $PROJECT_ID) {
    Write-Host "No GCP project configured!" -ForegroundColor Red
    Write-Host "Run: gcloud init" -ForegroundColor Yellow
    exit 1
}

Write-Host "GCP Project: $PROJECT_ID" -ForegroundColor Green
Write-Host ""

# Enable required APIs
Write-Host "Enabling required GCP APIs..." -ForegroundColor Yellow
$apis = @(
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudbuild.googleapis.com",
    "logging.googleapis.com",
    "cloudresourcemanager.googleapis.com"
)

foreach ($api in $apis) {
    Write-Host "  Enabling $api..." -ForegroundColor Cyan
    gcloud services enable $api --quiet
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to enable $api" -ForegroundColor Red
        exit 1
    }
}
Write-Host "APIs enabled" -ForegroundColor Green
Write-Host ""

# Get Gemini API key
Write-Host "Enter your Gemini API key:" -ForegroundColor Yellow
$geminiKey = Read-Host -AsSecureString
$geminiKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($geminiKey)
)

if (-not $geminiKeyPlain) {
    Write-Host "Gemini API key is required" -ForegroundColor Red
    exit 1
}

# Generate client API key
Write-Host "Generating client API key..." -ForegroundColor Yellow
$clientApiKey = -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
Write-Host "Client API key generated" -ForegroundColor Green
Write-Host ""

# Create secrets
Write-Host "Creating GCP secrets..." -ForegroundColor Yellow

# Create or update GEMINI_API_KEY secret
$secretExists = gcloud secrets describe GEMINI_API_KEY --project=$PROJECT_ID 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Updating GEMINI_API_KEY..." -ForegroundColor Cyan
    $geminiKeyPlain | gcloud secrets versions add GEMINI_API_KEY --data-file=- --project=$PROJECT_ID
} else {
    Write-Host "  Creating GEMINI_API_KEY..." -ForegroundColor Cyan
    $geminiKeyPlain | gcloud secrets create GEMINI_API_KEY --data-file=- --project=$PROJECT_ID
}

# Create or update CLIENT_API_KEY secret
$secretExists = gcloud secrets describe CLIENT_API_KEY --project=$PROJECT_ID 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Updating CLIENT_API_KEY..." -ForegroundColor Cyan
    $clientApiKey | gcloud secrets versions add CLIENT_API_KEY --data-file=- --project=$PROJECT_ID
} else {
    Write-Host "  Creating CLIENT_API_KEY..." -ForegroundColor Cyan
    $clientApiKey | gcloud secrets create CLIENT_API_KEY --data-file=- --project=$PROJECT_ID
}

Write-Host "Secrets created" -ForegroundColor Green
Write-Host ""

# Get Cloud Run service account
$projectNumber = (gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
$serviceAccount = "$projectNumber-compute@developer.gserviceaccount.com"

# Grant Secret Manager access
Write-Host "Granting secret access to service account..." -ForegroundColor Yellow
gcloud secrets add-iam-policy-binding GEMINI_API_KEY `
    --member="serviceAccount:$serviceAccount" `
    --role="roles/secretmanager.secretAccessor" `
    --project=$PROJECT_ID --quiet

gcloud secrets add-iam-policy-binding CLIENT_API_KEY `
    --member="serviceAccount:$serviceAccount" `
    --role="roles/secretmanager.secretAccessor" `
    --project=$PROJECT_ID --quiet

Write-Host "Permissions granted" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "GCP Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your Client API Key (save this for frontend config):" -ForegroundColor Yellow
Write-Host $clientApiKey -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "  1. Add CLIENT_API_KEY to your frontend .env.local"
Write-Host "  2. Deploy backend: gcloud run deploy"
Write-Host "  3. Configure frontend VITE_BACKEND_URL"

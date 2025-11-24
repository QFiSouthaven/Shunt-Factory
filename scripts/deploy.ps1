# Deployment Script for Aether Shunt (Windows PowerShell)
# Usage: .\scripts\deploy.ps1 [environment]
# environment: staging | production (default: staging)

param(
    [string]$Environment = "staging"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Aether Shunt Deploy Script (Windows)" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host "Environment: $Environment" -ForegroundColor Green
Write-Host ""

# Validate environment
$validEnvs = @("staging", "production")
if ($Environment -notin $validEnvs) {
    Write-Host "Invalid environment: $Environment" -ForegroundColor Red
    Write-Host "Valid options: staging, production"
    exit 1
}

# Confirm production deployment
if ($Environment -eq "production") {
    $confirm = Read-Host "Are you sure you want to deploy to PRODUCTION? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Deployment cancelled" -ForegroundColor Yellow
        exit 0
    }
}

# Build if dist doesn't exist
if (-not (Test-Path "dist")) {
    Write-Host "Building application..." -ForegroundColor Yellow
    & "$PSScriptRoot\build.ps1" -Environment $Environment
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed" -ForegroundColor Red
        exit 1
    }
}

# Detect deployment platform
$platform = $null

# Check for Vercel
if (Get-Command "vercel" -ErrorAction SilentlyContinue) {
    $platform = "vercel"
}
# Check for Netlify
elseif (Get-Command "netlify" -ErrorAction SilentlyContinue) {
    $platform = "netlify"
}
# Check for AWS CLI
elseif (Get-Command "aws" -ErrorAction SilentlyContinue) {
    $platform = "aws"
}

if (-not $platform) {
    Write-Host "No deployment platform detected!" -ForegroundColor Red
    Write-Host "Please install one of the following:" -ForegroundColor Yellow
    Write-Host "  - Vercel CLI: npm install -g vercel"
    Write-Host "  - Netlify CLI: npm install -g netlify-cli"
    Write-Host "  - AWS CLI: https://aws.amazon.com/cli/"
    exit 1
}

Write-Host "Deploying with: $platform" -ForegroundColor Cyan
Write-Host ""

# Deploy based on platform
switch ($platform) {
    "vercel" {
        if ($Environment -eq "production") {
            vercel --prod
        } else {
            vercel
        }
    }
    "netlify" {
        if ($Environment -eq "production") {
            netlify deploy --prod --dir=dist
        } else {
            netlify deploy --dir=dist
        }
    }
    "aws" {
        # You'll need to set these environment variables or modify these values
        $S3_BUCKET = $env:AWS_S3_BUCKET
        $CLOUDFRONT_ID = $env:AWS_CLOUDFRONT_DISTRIBUTION_ID

        if (-not $S3_BUCKET) {
            Write-Host "AWS_S3_BUCKET environment variable not set" -ForegroundColor Red
            exit 1
        }

        Write-Host "Syncing to S3 bucket: $S3_BUCKET" -ForegroundColor Yellow
        aws s3 sync dist "s3://$S3_BUCKET" --delete

        if ($CLOUDFRONT_ID) {
            Write-Host "Invalidating CloudFront cache..." -ForegroundColor Yellow
            aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"
        }
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Deployment complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Environment: $Environment"
    Write-Host "Platform: $platform"
    Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
} else {
    Write-Host "Deployment failed" -ForegroundColor Red
    exit 1
}

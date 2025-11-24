# Production Build Script for Aether Shunt (Windows PowerShell)
# Usage: .\scripts\build.ps1 [environment]
# environment: development | staging | production (default: production)

param(
    [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Aether Shunt Build Script (Windows)" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host "Environment: $Environment" -ForegroundColor Green
Write-Host "Node version: $(node --version)"
Write-Host "npm version: $(npm --version)"
Write-Host ""

# Validate environment
$validEnvs = @("development", "staging", "production")
if ($Environment -notin $validEnvs) {
    Write-Host "Invalid environment: $Environment" -ForegroundColor Red
    Write-Host "Valid options: development, staging, production"
    exit 1
}

# Set environment variable
$env:VITE_APP_ENV = $Environment

# Clean previous build
Write-Host "Cleaning previous build..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}
Write-Host "Clean complete" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm ci --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencies installed" -ForegroundColor Green
Write-Host ""

# Run TypeScript type checking
Write-Host "Running TypeScript type checking..." -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "Type checking failed" -ForegroundColor Red
    exit 1
}
Write-Host "Type checking passed" -ForegroundColor Green
Write-Host ""

# Run build
Write-Host "Building application for $Environment..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "Build complete" -ForegroundColor Green
Write-Host ""

# Verify build
Write-Host "Verifying build output..." -ForegroundColor Yellow
if (-not (Test-Path "dist\index.html")) {
    Write-Host "Build verification failed: index.html not found" -ForegroundColor Red
    exit 1
}
Write-Host "Build verification passed" -ForegroundColor Green
Write-Host ""

# Display bundle sizes
Write-Host "Bundle Size Analysis:" -ForegroundColor Blue
$distSize = (Get-ChildItem -Recurse "dist" | Measure-Object -Property Length -Sum).Sum
$distSizeMB = [math]::Round($distSize / 1MB, 2)
Write-Host "Total dist size: $distSizeMB MB"
Write-Host ""

Write-Host "Top 10 JavaScript Bundles:" -ForegroundColor Blue
Get-ChildItem -Path "dist\assets" -Filter "*.js" -Recurse |
    Sort-Object Length -Descending |
    Select-Object -First 10 |
    ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1KB, 2)
        Write-Host "$($_.Name): $sizeMB KB"
    }
Write-Host ""

# Check for console.log in production
if ($Environment -eq "production") {
    Write-Host "Checking for console.log in production build..." -ForegroundColor Yellow
    $consoleLogFound = Get-ChildItem -Path "dist\assets" -Filter "*.js" -Recurse |
        Select-String -Pattern "console\.log" -SimpleMatch
    if ($consoleLogFound) {
        Write-Host "Warning: console.log found in production build" -ForegroundColor Yellow
    } else {
        Write-Host "No console.log found" -ForegroundColor Green
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Build output: .\dist\"
Write-Host "Environment: $Environment"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  - Test locally: npm run preview" -ForegroundColor Blue
Write-Host "  - Deploy staging: .\scripts\deploy.ps1 staging" -ForegroundColor Blue
Write-Host "  - Deploy production: .\scripts\deploy.ps1 production" -ForegroundColor Blue

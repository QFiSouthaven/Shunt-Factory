#!/bin/bash

# Local Preview Script
# Builds and previews the production build locally

set -e

echo "🏗️  Building production bundle..."
npm run build

echo ""
echo "🚀 Starting preview server..."
echo "Press Ctrl+C to stop"
echo ""

npm run preview

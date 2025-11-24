# Frontend Direct API Backup

**Created:** 2025-11-19

This folder contains a backup of the frontend code that calls the Gemini API directly from the browser.

## Why This Backup Exists

The original code exposes your API key in the browser JavaScript bundle. This is a security risk because anyone can:
1. Open browser developer tools
2. Find your API key in the code
3. Steal and misuse your API quota

## Files Backed Up

- `services/geminiService.ts` - Main Gemini API service (direct calls)
- `services/miaService.ts` - Mia assistant service (direct calls)
- `features/mia/MiaService.ts` - Mia feature service (direct calls)
- `vite.config.ts` - Build config that injects API key

## How to Restore

If you need to go back to the direct API approach:

```bash
# From project root
cp backup/frontend-direct-api/services/geminiService.ts services/
cp backup/frontend-direct-api/services/miaService.ts services/
cp backup/frontend-direct-api/features/mia/MiaService.ts features/mia/
cp backup/frontend-direct-api/vite.config.ts .
```

## Security Warning

Only use this backup for local development. Never deploy the direct API version to production - your API key will be exposed!

# Landki Interview App

Fullscreen chat application powered by OpenAI ChatKit.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Configuration

Environment variables in `.env`:
- `VITE_WORKFLOW_ID` - OpenAI workflow ID
- `VITE_WORKFLOW_VERSION` - Workflow version

## Deployment

The app is deployed to `/var/www/landki/interview/dist/` and served at:
- https://landki.com/interview/

Build output includes SPA routing support via NGINX configuration.

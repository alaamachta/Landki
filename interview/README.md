# Landki Interview App

Fullscreen chat application powered by OpenAI ChatKit using the official quickstart integration.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY and VITE_WORKFLOW_ID
```

## Development

Start both the backend session server and frontend dev server:

```bash
npm run start
```

Or run them separately:

```bash
# Terminal 1 - Backend API server
npm run server

# Terminal 2 - Frontend dev server
npm run dev
```

## Build

```bash
npm run build
```

## Configuration

Environment variables in `.env`:
- `VITE_WORKFLOW_ID` - OpenAI workflow ID from Agent Builder (starts with wf_)
- `VITE_WORKFLOW_VERSION` - Workflow version (optional, for reference)
- `OPENAI_API_KEY` - OpenAI API key (required for session creation)

## Architecture

This implementation follows the official OpenAI ChatKit quickstart:

1. **CDN**: Uses the official `https://cdn.platform.openai.com/deployments/chatkit/chatkit.js`
2. **React Integration**: Uses `@openai/chatkit-react` package
3. **Session Management**: Backend API endpoint (`server.js`) handles secure session creation
4. **Auto-updates**: Changes in OpenAI Agent Builder appear live after page refresh

## Deployment

The app is deployed to `/var/www/landki/interview/dist/` and served at:
- https://landki.com/interview/

Build output includes SPA routing support via NGINX configuration.

For production deployment, ensure:
1. The backend server (`server.js`) is running on the production server
2. API endpoint is accessible at `/api/chatkit/session`
3. NGINX is configured to proxy `/api/*` requests to the backend server


# LandKI Interview Assistant - Workflow & RAG Setup

## Overview

This interview assistant uses a **custom React/Node.js implementation** instead of ChatKit CDN to provide full control over the chat interface while leveraging OpenAI's Agent Builder workflows for RAG (Retrieval-Augmented Generation) capabilities.

## Architecture

```
Browser (React/Vite)
    ↓ SSE streaming
Node.js/Express API (port 3001)
    ↓ OpenAI SDK v6.8.1
OpenAI Platform (Project-scoped)
    → Agent Builder Workflow (wf_...)
    → File Search with uploaded CV/knowledge
```

## Configuration (.env)

Located at `/var/www/landki/interview/.env`:

```bash
# OpenAI API Configuration (project-scoped key)
OPENAI_API_KEY="sk-proj-..."
OPENAI_PROJECT_ID="proj_..."
OPENAI_WORKFLOW_ID="wf_..."           # Agent Builder workflow ID
OPENAI_WORKFLOW_VERSION="4"           # Version or empty for "production"
OPENAI_MODEL="gpt-4-turbo-preview"    # Model used for chat

# CORS
ALLOWED_ORIGINS="https://landki.com,https://interview.landki.com"

# Server
PORT="3001"
NODE_ENV="production"
LOG_LEVEL="info"
```

**Important**: Values are quoted. PM2 loads them via `start.sh` which sources the `.env` file.

## OpenAI SDK Initialization

The SDK is configured in **project-mode** (no organization header):

```typescript
export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  project: OPENAI_PROJECT_ID || undefined,
});
```

This ensures compatibility with project-scoped API keys and avoids the "OpenAI-Organization header should match organization" error.

## RAG/Workflow Integration

### Current Implementation

The system uses **standard chat completions API** with project scoping. When `OPENAI_WORKFLOW_ID` is set in `.env`, it's logged for reference, but the actual RAG retrieval happens through:

1. **OpenAI Dashboard Configuration**:
   - Upload knowledge files (PDFs, docs) to the project
   - Configure File Search in Agent Builder
   - Associate files with the workflow/assistant

2. **Server-side API calls**:
   - API calls are scoped to `OPENAI_PROJECT_ID`
   - OpenAI automatically applies RAG if configured for that project
   - Responses include citations/grounded information from uploaded files

### Why Not ChatKit?

ChatKit is OpenAI's official embed widget but has limitations:
- No custom UI/UX control
- CDN dependency
- Limited customization of behavior
- Secrets exposed to browser

This custom implementation keeps:
- API keys server-side
- Full UI/styling control
- Custom fallback logic
- SSE streaming with real-time typing indicators

## Features

### 1. Streaming Responses (SSE)

```typescript
// Server streams chunks via Server-Sent Events
res.write(`data: ${JSON.stringify({ content: token })}\n\n`);

// Client receives and renders in real-time
fullContent += chunk;
setStreamingContent(fullContent);
```

### 2. Follow-Up Suggestions

After each response, the system generates 1-3 contextual follow-up questions:

```typescript
const suggestions = await generateFollowUpSuggestions(message, fullContent);
res.write(`data: ${JSON.stringify({ suggestions })}\n\n`);
```

### 3. Knowledge Gap Detection & Fallback

The 4-step polite fallback activates when the AI cannot answer:

**Detection keywords**:
- "leider"
- "keine information"
- "nicht beantworten"
- "nicht in meinen unterlagen"
- "weiterleiten"

**Fallback flow** (implemented in system prompt):
1. Politely state lack of information
2. Offer to forward the question to Alaa
3. Ask for name or anonymous preference
4. Thank and offer further assistance

**When triggered**:
```typescript
if (hasKnowledgeGap) {
  res.write(`data: ${JSON.stringify({ hasKnowledgeGap: true })}\n\n`);
}
```

Client opens feedback modal after 1 second delay.

### 4. Feedback Logging

User feedback is logged to `/var/www/landki/interview/_logs/feedback.jsonl`:

```json
{"timestamp":"2025-11-11T16:00:00.000Z","name":"Max Mustermann","message":"Wie viel Erfahrung...","consentForward":true,"userAgent":"..."}
```

## Deployment

### Backend

```bash
cd /var/www/landki/interview/api
npm install
npm run build
pm2 restart interview-api
pm2 save
```

PM2 configuration (`ecosystem.config.cjs`) uses `start.sh` which sources `.env`.

### Frontend

```bash
cd /var/www/landki/interview/frontend
npm install
npm run build
# Output: /var/www/landki/interview/dist/
```

NGINX serves `/interview/` from `/dist/` and proxies `/interview/api/` to `127.0.0.1:3001`.

### No NGINX changes needed

Proxy rules already configured for SSE streaming:

```nginx
location /interview/api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding on;
    ...
}
```

## Verification

### Health Check

```bash
curl https://landki.com/interview/api/health
# → {"status":"healthy","version":"1.0.0",...}
```

### Streaming Chat

```bash
curl -X POST https://landki.com/interview/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Was ist Alaas Berufserfahrung?"}'
```

Expected: Stream of `data: {"content":"..."}` chunks, then `data: [DONE]`.

### Browser Test

1. Visit `https://landki.com/interview/`
2. Ask about Alaa's CV/experience
3. Verify:
   - Streaming response with typing indicator
   - 1-3 follow-up suggestions appear
   - No 401 "organization header" errors
   - Dark theme, Markdown rendering

4. Ask something NOT in the knowledge base
5. Verify:
   - 4-step fallback response
   - Feedback modal opens automatically
   - Submission logged to `_logs/feedback.jsonl`

## Logs

- **PM2 logs**: `pm2 logs interview-api`
- **Chat sessions**: `/var/www/landki/interview/_logs/chat-sessions.jsonl`
- **Feedback**: `/var/www/landki/interview/_logs/feedback.jsonl`

## Troubleshooting

### 401 "OpenAI-Organization header should match organization"

**Cause**: Using organization-scoped key instead of project-scoped key.

**Fix**: Ensure `OPENAI_API_KEY` starts with `sk-proj-` and SDK is initialized without organization:

```typescript
export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  project: OPENAI_PROJECT_ID || undefined,
  // NO organization parameter
});
```

### RAG not returning knowledge from files

**Cause**: Files not uploaded or associated with the project.

**Fix**:
1. Go to OpenAI Dashboard → Project `OPENAI_PROJECT_ID`
2. Upload knowledge files (PDFs, docs)
3. Create/configure Assistant with File Search enabled
4. Associate files with the assistant
5. Ensure `OPENAI_WORKFLOW_ID` references this assistant/workflow

### Streaming not working

**Check**:
- NGINX `proxy_buffering off` and `chunked_transfer_encoding on`
- API response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`
- Browser console for errors

### .env not loaded

PM2 loads via `start.sh`:

```bash
set -a
source /var/www/landki/interview/.env
set +a
exec node /var/www/landki/interview/api/dist/server.js
```

Restart with: `pm2 restart interview-api --update-env`

## Future Enhancements

1. **Assistants API with Threads**: For true conversation memory across sessions
2. **Citations Display**: Show which documents were used for each answer
3. **Multi-language**: Auto-detect user language and respond accordingly
4. **Voice Input**: Azure Speech Services integration (env vars already present)
5. **Analytics**: Track most common questions, response quality metrics

## Security Notes

- API key is server-side only (never exposed to browser)
- CORS restricted to `ALLOWED_ORIGINS`
- Project-scoped key limits access to specific OpenAI project
- Feedback logging includes consent flag for GDPR compliance

## Last Updated

2025-11-11 by automated deployment process.


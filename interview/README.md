# Interview Assistent - Production Deployment

## Overview

Minimal, production-ready Interview Assistant using **OpenAI Agents SDK** with Python FastAPI backend.

- **URL**: https://landki.com/interview/
- **Dashboard**: https://landki.com/interview/dashboard
- **Stack**: Python 3.10+ | FastAPI | Agents SDK | Vanilla JS
- **Persona**: Alaa Mashta (Ich-Form, German "Sie", multilingual)

## Quick Start

```bash
cd /var/www/landki/interview
pip3 install -r requirements.txt

# Configure .env with your OpenAI credentials
# Then start server:
python3 server.py
```

## File Structure

```
/var/www/landki/interview/
├── server.py              # FastAPI server + Agents SDK integration
├── Agents_SDK.py          # OpenAI workflow definition
├── requirements.txt       # Python dependencies
├── .env                   # Secrets
├── static/               # Frontend assets
│   ├── index.html        # Chat UI
│   ├── app.js            # Chat logic
│   ├── dashboard.html    # Admin dashboard
│   └── dashboard.js      # Dashboard logic
├── _logs/                # JSONL logs
└── _backups/            # Rolling backups
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | OpenAI API key |
| `OPENAI_PROJECT_ID` | ✅ Yes | OpenAI project ID |
| `ADMIN_TOKEN` | ✅ Yes | Dashboard admin token |

See `.env.example` for full list.

## Features

✅ Dark ChatGPT-style UI  
✅ Ich-Form persona (as Alaa)  
✅ German "Sie", multilingual support  
✅ RAG from OpenAI Vector Store  
✅ 4-step fallback for knowledge gaps  
✅ Follow-up question suggestions  
✅ Admin dashboard with logs  
✅ JSONL logging with timestamps  

## API Endpoints

- `GET /` - Chat interface
- `GET /dashboard` - Admin dashboard
- `POST /api/chat` - SSE streaming chat
- `POST /api/feedback` - Submit feedback
- `GET /api/admin/logs` - Get logs (admin only)
- `GET /api/admin/stats` - Get statistics (admin only)

## Deployment

```bash
# Install
pip3 install -r requirements.txt

# Run with PM2
pm2 start server.py --name interview-api --interpreter python3
pm2 save

# NGINX config
location /interview/ {
    alias /var/www/landki/interview/static/;
}
location /interview/api/ {
    proxy_pass http://127.0.0.1:3001/api/;
}
```

---

**Version**: 1.0.0 | **Last Updated**: 2025-11-11

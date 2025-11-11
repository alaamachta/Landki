# Interview System - Dashboard Access Guide

## 🚀 System Overview

The Interview system now includes:
- ✅ **Workflow Integration**: Uses project-scoped OpenAI chat completions with RAG support
- ✅ **Metadata Streaming**: Emits label, confidence, lang, and route via SSE
- ✅ **JSONL Logging**: Separates qa.jsonl (high-confidence answers) from feedback.jsonl
- ✅ **Admin Dashboard**: Full-featured React dashboard for reviewing feedback and QA logs
- ✅ **Secured Endpoints**: All admin routes protected by X-Admin-Token header

## 📊 Dashboard Access

### Live URLs
- **Chat Interface**: https://landki.com/interview/
- **Admin Dashboard**: https://landki.com/interview/#dashboard

### Admin Token
The admin token is securely stored in `.env`:

```bash
# View the admin token
grep ADMIN_TOKEN /var/www/landki/interview/.env
```

**Token Value**: `3ce9a4b0cf6648ea1a1686b6c8b61e383ebcb67297d1b80afdc945eb9fa1d788`

### Dashboard Login
1. Navigate to https://landki.com/interview/#dashboard
2. Enter the admin token when prompted
3. Access all logs, stats, filters, and export features

## 🔧 API Endpoints

### Admin Endpoints (Require X-Admin-Token)

#### GET /api/admin/feedback
Returns filtered QA/feedback entries.

**Query Parameters**:
- `type`: 'qa' | 'feedback' | 'all' (default: 'all')
- `from`: ISO date string (filter by start date)
- `to`: ISO date string (filter by end date)
- `q`: Search query (searches question/answer text)
- `label`: Filter by label (technical|career|personal|product|other)
- `lang`: Filter by language (de|en|fr|...)
- `minConfidence`: Minimum confidence score (0-1)
- `maxConfidence`: Maximum confidence score (0-1)
- `limit`: Max results (default: 1000)

**Example**:
```bash
ADMIN_TOKEN=$(grep ADMIN_TOKEN /var/www/landki/interview/.env | cut -d'"' -f2)

curl -H "X-Admin-Token: $ADMIN_TOKEN" \
  "https://interview.landki.com/api/admin/feedback?type=feedback&limit=10"
```

#### GET /api/admin/stats
Returns aggregate statistics.

**Response**:
```json
{
  "today": { "qa": 5, "feedback": 2, "total": 7 },
  "last7days": { "qa": 42, "feedback": 8, "total": 50 },
  "allTime": { "qa": 150, "feedback": 20, "total": 170 },
  "percentageFeedback": 16
}
```

## 📝 JSONL Log Structure

### qa.jsonl
High-confidence internal QA (route=internal_qa, confidence ≥ 0.5)

```json
{
  "ts": "2025-11-11T18:22:23.172Z",
  "user_text": "Welche Ausbildung hat Alaa gemacht?",
  "label": "career",
  "confidence": 0.9,
  "lang": "de",
  "route": "internal_qa",
  "answer_preview": "Ich habe Informatik studiert..."
}
```

### feedback.jsonl
Low-confidence or off-topic questions (route=feedback OR confidence < 0.5)

```json
{
  "ts": "2025-11-11T18:23:22.706Z",
  "user_text": "Preis vom iPhone 16?",
  "label": "product",
  "confidence": 0.7,
  "lang": "de",
  "route": "feedback",
  "answer_preview": "Leider habe ich keine aktuellen Informationen..."
}
```

## 🎨 Dashboard Features

### Stats Overview
- **Today/7d/All-time counters**: Total QA vs Feedback
- **Feedback percentage**: Metric for knowledge gap tracking

### Filters
- **Type**: QA only, Feedback only, or All
- **Search**: Full-text search across questions and answers
- **Label**: Filter by technical, career, personal, product, other
- **Language**: de, en, fr, etc.
- **Confidence Range**: Slider to filter by confidence score
- **Date Range**: From/To date pickers

### Actions
- **📥 CSV Export**: Download filtered results as CSV
- **📚 Mark as Knowledge**: Download Markdown snippet for vector store
- **📋 Copy Q/A**: Copy question or answer to clipboard
- **🔍 Detail View**: Modal with full question, answer, and metadata

## 🔄 Workflow Configuration

The system uses project-scoped OpenAI chat completions which support:
- **RAG**: File Search configured in OpenAI dashboard
- **Workflows**: If configured via OPENAI_WORKFLOW_ID
- **Fallback**: Standard chat completions if Workflow unavailable

### Environment Variables
```bash
OPENAI_API_KEY="sk-proj-..."
OPENAI_PROJECT_ID="proj_..."
OPENAI_WORKFLOW_ID="wf_6910af26c670819097b24c11ebbe0b380a5bfa9945431f22"
OPENAI_WORKFLOW_VERSION=""  # Empty = production
ADMIN_TOKEN="3ce9a4b0cf6648ea1a1686b6c8b61e383ebcb67297d1b80afdc945eb9fa1d788"
ALLOWED_ORIGINS="https://landki.com,https://interview.landki.com"
```

## 🧪 Testing

### Test Chat Functionality
```bash
curl -N -X POST "https://interview.landki.com/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Welche Ausbildung hat Alaa gemacht?","locale":"de-DE"}'
```

### Test Admin Endpoint
```bash
ADMIN_TOKEN="3ce9a4b0cf6648ea1a1686b6c8b61e383ebcb67297d1b80afdc945eb9fa1d788"

curl -H "X-Admin-Token: $ADMIN_TOKEN" \
  "https://interview.landki.com/api/admin/stats"
```

### Check Logs
```bash
# View QA logs
tail -f /var/www/landki/interview/_logs/qa.jsonl

# View feedback logs
tail -f /var/www/landki/interview/_logs/feedback.jsonl

# View API logs
pm2 logs interview-api
```

## 🔐 Security

- **CORS**: Restricted to `landki.com` and `interview.landki.com`
- **Admin Token**: 256-bit random token stored in .env
- **HTTPS Only**: All endpoints require SSL
- **Token Header**: Must send `X-Admin-Token` header for admin routes

## 📦 Deployment

### Restart API
```bash
cd /var/www/landki/interview/api
npm run build
pm2 restart interview-api --update-env
pm2 save
```

### Rebuild Frontend
```bash
cd /var/www/landki/interview/frontend
npm run build
# Output: ../dist/
```

### Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## ✅ Acceptance Criteria Met

- ✅ Backend uses Workflow-configured project-scoped completions
- ✅ SSE includes metadata (label, confidence, lang, route)
- ✅ Logs split into qa.jsonl and feedback.jsonl
- ✅ /interview/dashboard exists, secured, shows/filters/exports feedback
- ✅ "Ausbildung"-Test pulls RAG-knowledge correctly
- ✅ "iPhone"-Test lands in Feedback-Log
- ✅ Chat renders Markdown & emojis cleanly
- ✅ No ChatKit CDN references
- ✅ CORS restricted to allowed origins

---

**Last Updated**: 2025-11-11  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

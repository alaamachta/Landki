# Interview Assistent (ChatKit) – Deployment & Betrieb
Produktiver Interview-Chat auf https://landki.com/interview/ basierend auf:
- Backend: Python FastAPI (`server.py`)
- UI: React + Vite + `@openai/chatkit-react`
- OpenAI: ChatKit Sessions API + Workflow (RAG)
- Dashboard: statische Admin-Seite zum Anzeigen von Logs/Feedback



## Verzeichnisstruktur
```
/var/www/landki/interview/
├── server.py                 # FastAPI API: Health, Session, Logs, Feedback
├── requirements.txt          # Python Abhängigkeiten
├── .env                      # Server-Umgebungsvariablen (API Key, Domain Key, Workflow ID, ...)
├── frontend/                 # React + Vite App (Chat UI)
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── App.jsx           # ChatKit-Einbindung
│       └── App.css           # Dark UI, Gradient, Layout
├── dashboard/
│   └── index.html            # Admin-Dashboard (Stats, Logs, Public Feedback)
├── _logs/                    # JSONL-Logs (chat.jsonl, feedback.jsonl)
├── _backups/                 # Backups & Snapshots

```

## Voraussetzungen
- Python 3.10+
- Node 20+ (für Frontend Build)
- OpenAI Account mit Workflow/Vector Store
- NGINX Reverse Proxy mit Präfix `/interview/`

## Environment (.env im Ordner `interview/`)
```
OPENAI_API_KEY=sk-proj-...
DOMAIN_PUBLIC_KEY=domain_pk_...
OPENAI_WORKFLOW_ID=wf_...
ALLOWED_ORIGINS=https://landki.com,http://localhost:5173
PORT=3001
# Optional:
# ADMIN_TOKEN=geheim
```

Wichtig:
- Der Domain Public Key wird als Header `OpenAI-Domain-Public-Key` zur Sessions API geschickt (Domain Allowlist).

## Installation & Start
Backend-Pakete installieren und Server starten:

```bash
cd /var/www/landki/interview
pip3 install -r requirements.txt
python3 server.py &
```

Frontend bauen:

```bash
cd /var/www/landki/interview/frontend
npm ci || npm install
npm run build
```

Health-Check:

```bash
curl -sS http://127.0.0.1:3001/interview/api/health
```

## Wichtige Endpunkte
- GET `/interview/api/health` – Health Check
- POST `/interview/api/chatkit/session` – Erstellt ChatKit Session (gibt `client_secret` an den Client)
- POST `/interview/api/log` – Generische Client-Logs (JSONL `chat.jsonl`)
- POST `/interview/api/feedback` – Öffentliches Feedback (JSONL `feedback.jsonl`)
- GET `/interview/api/feedback/list` – Liste der öffentlichen Feedbacks
- GET `/interview/api/admin/logs?log_type=chat|feedback&limit=100` – Letzte Log-Einträge (optional geschützt via `X-Admin-Token`)
- GET `/interview/api/admin/stats` – Einfache Zähler (optional geschützt)

Dashboard: https://landki.com/interview/dashboard

## NGINX (Beispiel)
```nginx
location /interview/ {
    # Statische Dateien der Frontend-App werden separat ausgeliefert
    # (Deployment je nach Setup; bei Vite-Build aus dist/ einspielen)
    try_files $uri $uri/ /interview/index.html;
}

location /interview/api/ {
    proxy_pass http://127.0.0.1:3001/interview/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

## Theme Hinweis
- ChatKit läuft im eigenen iframe/shadow DOM. API-seitige Theme-Parameter sind derzeit eingeschränkt.


## Troubleshooting
- 401 „Domain verification failed“: `DOMAIN_PUBLIC_KEY` prüfen (muss in `.env` stehen); Server neu starten.
- 404 auf `/interview/api/...`: NGINX-Präfix/Proxy prüfen.
- Port 3001 belegt: `lsof -i:3001` → Prozess beenden.
- `Unknown parameter: chatkit_configuration.theme`: Theme-Objekt aus Payload entfernen (bereits gefixt).
- `ERR_BLOCKED_BY_CLIENT`: Browser/AdBlock blockiert Analytics – kann ignoriert werden.

## Betrieb & Pflege

- Logs: `_logs/chat.jsonl`, `_logs/feedback.jsonl` (JSONL, zeilenbasiert)
- Rotation (einfach): Datei kopieren und truncaten
    ```bash
    cp _logs/chat.jsonl _backups/chat-$(date +%Y%m%d).jsonl && truncate -s0 _logs/chat.jsonl
    ```
- Upgrades: `@openai/chatkit-react` Changelog prüfen; Frontend neu bauen; Server-API stabil halten.

## Quick Commands
```bash
# Server starten
cd /var/www/landki/interview && python3 server.py &

# Health
curl -sS http://127.0.0.1:3001/interview/api/health

# Session testen
curl -sS -X POST http://127.0.0.1:3001/interview/api/chatkit/session \
    -H 'Content-Type: application/json' -d '{}'

# Feedback senden
curl -sS -X POST http://127.0.0.1:3001/interview/api/feedback \
    -H 'Content-Type: application/json' \
    -d '{"session_id":"demo","user_question":"Q?","assistant_reply":"A","category":"out_of_scope"}'

# Feedback-Liste
curl -sS http://127.0.0.1:3001/interview/api/feedback/list
```

---

Version: 1.2.0 · Letztes Update: 2025-11-12

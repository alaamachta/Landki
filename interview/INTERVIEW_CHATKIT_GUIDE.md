# INTERVIEW_CHATKIT_GUIDE

Dieser Leitfaden erklärt das Setup des Interview Assistenten (ChatKit + Workflow + Vector Store), die Feedback-Pipeline, Wartung und typische Fehlermeldungen.

## 1. Architektur Überblick

Komponenten:
- `server.py`: FastAPI Backend für Health, Session-Erstellung (ChatKit), Logs, Feedback.
- `frontend/`: Vite + React App mit `@openai/chatkit-react` zur Darstellung des Chats.
- OpenAI Ressourcen: Workflow (RAG + Bewertung), Vector Store mit Dokumenten, Domain Public Key (Domain Allowlist).
- Dashboard: `dashboard/index.html` zur Anzeige von Logs & öffentlichem Feedback.
- Logs: JSONL Dateien unter `_logs/` (`chat.jsonl`, `feedback.jsonl`).

Flow:
1. Browser lädt `index.html` (Frontend) und ChatKit Script.
2. React ruft `/interview/api/chatkit/session` auf → Backend erstellt ChatKit Session beim OpenAI API → liefert `client_secret` zurück.
3. React ChatKit Komponente baut Verbindung auf und führt Workflowschritte (RAG) aus.
4. Beim Out-of-Scope Fall zeigt UI Feedback Button → POST `/interview/api/feedback` → Eintrag in `feedback.jsonl` → Dashboard Tabelle aktualisiert.

## 2. Environment Variablen

Set in Systemd/Deployment (z.B. `.env` oder Service Unit):
- `OPENAI_API_KEY`: privater OpenAI Key (nicht im Frontend exponieren).
- `OPENAI_WORKFLOW_ID`: z.B. `wf_6910af26c6708190...` (Dein RAG Workflow).
- `OPENAI_PROJECT_ID` (optional für Organisation/Project Scoping).
- `OPENAI_DOMAIN_PUBLIC_KEY` oder `DOMAIN_PUBLIC_KEY`: Domain Allowlist Key falls benötigt.
- `ADMIN_TOKEN` (optional für geschützte Admin Endpoints `/admin/*`).
- `ALLOWED_ORIGINS`: Komma-getrennte Liste für CORS (z.B. `https://landki.com`).
- `PORT`: Standard `3001` für Backend.

## 3. Session-Erstellung (ChatKit)
Endpoint: `POST /interview/api/chatkit/session`
- Server ruft `https://api.openai.com/v1/chatkit/sessions` mit Header `OpenAI-Beta: chatkit_beta=v1`.
- Body enthält `workflow.id` und generiert eine UUID als `user`.
- Antwort liefert `client_secret` zurück → vom Frontend genutzt, um ChatKit Control aufzubauen.

Fehlerfälle:
- 400 Missing workflow id → Workflow setzen.
- 401 Unauthorized → API Key prüfen.
- Timeout → Netzwerk / Firewall / Rate Limit prüfen.

## 4. Frontend Integration
- Paket: `@openai/chatkit-react@^1.2.0`.
- Hook: `useChatKit({ api: { getClientSecret }, startScreen, composer, ...})`.
- StartScreen: Begrüßung & Prompt Buttons.
- Composer: Placeholder Text, Attachments deaktiviert.
- Dark Theme: `App.css` implementiert animierten Hintergrund + Glassmorphism Container.
- Out-of-Scope Erkennung: Naiver DOM-Scan nach Markern (konfigurierbar in `App.jsx`).

### Anpassung Farbschema
Passe `body` Gradient, Schatten, Container-Border in `frontend/src/App.css` an.
Vermeide harte Hex-Werte in Komponenten – style über CSS.

## 5. Feedback Mechanismus
Endpoints:
- Öffentlich: `POST /interview/api/feedback` speichert `public_feedback`.
- Liste: `GET /interview/api/feedback/list?limit=50` liefert jüngste Einträge.
- Admin: `POST /interview/api/admin/feedback` falls strukturierte Ratings benötigt.

Format (public):
```
{
  "session_id": "sess_...",
  "user_question": "Frage ...",
  "assistant_reply": "Antwort ...",
  "category": "out_of_scope",
  "comment": "Automatisch markiert (Demo)"
}
```

Datei: `_logs/feedback.jsonl` (jedes Objekt eine Zeile, gut für `tail -f`).

## 6. Dashboard Nutzung
- Datei: `dashboard/index.html`.
- Lädt Stats (`/admin/stats`) und Logs (`/admin/logs`).
- Neue Sektion: Public Feedback mit auto-refresh (30s).
- Admin Token: Wird bei 401 per Prompt abgefragt und in `localStorage` gespeichert.

## 7. Wartung & Betrieb
### Log Rotation
Bei Wachstum: Cron Job mit `logrotate` oder einfach periodisch archivieren:
```
cp _logs/chat.jsonl _backups/chat-$(date +%Y%m%d).jsonl && truncate -s0 _logs/chat.jsonl
```

### Fehleranalyse
- Prüfe `journalctl -u interview` für Backend Tracebacks.
- Nutze `curl -v` zum Debugging von Session Endpoint.
- Bei Frontend Build-Problemen: `npm ci && npm run build`.

### Sicherheit
- Niemals `OPENAI_API_KEY` im Frontend ausgeben.
- Setze `ADMIN_TOKEN` für geschützte Endpoints.
- Rate Limiting optional via Reverse Proxy (Nginx `limit_req`).

## 8. Typische Fehlermeldungen
| Fehler | Ursache | Lösung |
|--------|---------|-------|
| `ERR_BLOCKED_BY_CLIENT` | Browser Extension (AdBlock, Privacy Blocker) verhindert Analytics/Externes Script | Ignorieren; Funktionalität bleibt intakt. Dokumentiere dem Nutzer, dass Tracking geblockt wurde. |
| 404 `/interview/api/chatkit/session` | Nginx Pfadpräfix falsch | Location Block prüfen (`/interview/`) und Weiterleitung auf Uvicorn Port. |
| `ChatKit API error` 401 | Falscher/fehlender API Key | `OPENAI_API_KEY` validieren, Service neu starten. |
| Leere Antworten | Workflow ohne Treffer im Vector Store | Fallback definieren im Workflow oder Out-of-Scope Marker fördern. |

## 9. Out-of-Scope Strategie
Aktuell: Naiver DOM-Scan nach Schlüsselphrasen.
Empfohlen für Produktion:
- Nutze Workflow Branch mit strukturiertem Tagging (`classification: out_of_scope=true`).
- Sende Event im letzten Tool-Call; UI liest Meta aus ChatKit Nachrichtenobjekt statt DOM.

## 10. Erweiterungen (Roadmap)
- Persistente echte User-ID statt UUID pro Session.
- Bewertungsskala + optionaler Freitext Grund.
- Export zu CSV/Parquet für Analytics.
- Anbindung an Monitoring (Prometheus Gauge: Anzahl Sessions, Fehlerquote).

## 11. Schnelltests
Frontend Build:
```
npm run build
```
Health Check:
```
curl -sS http://127.0.0.1:3001/interview/api/health
```
Session Probe:
```
curl -sS -X POST http://127.0.0.1:3001/interview/api/chatkit/session | jq '.client_secret'
```
Feedback Probe:
```
curl -sS -X POST http://127.0.0.1:3001/interview/api/feedback \
  -H 'Content-Type: application/json' \
  -d '{"session_id":"demo","user_question":"Q?","assistant_reply":"A","category":"out_of_scope"}'
```
List Feedback:
```
curl -sS http://127.0.0.1:3001/interview/api/feedback/list | jq '.entries | length'
```

## 12. Upgrade Hinweise
Beim Update von `@openai/chatkit-react`:
1. `npm outdated` prüfen.
2. Changelog lesen (Breaking Prop Änderungen?).
3. Staging Build testen (`npm run build`).
4. Session Endpoint bleibt stabil solange Beta Header identisch.

## 13. Troubleshooting Quick Reference
| Symptom | Check | Command |
|---------|-------|---------|
| Keine Antworten | Workflow ID korrekt? | `grep OPENAI_WORKFLOW_ID .env` |
| Feedback Tabelle leer | Logs Datei vorhanden? | `ls -lh _logs/feedback.jsonl` |
| Session Fehler 500 | Netzwerk/Timeout? | `curl -v POST .../chatkit/session` |
| Stil nicht geladen | Cache alt? | Hard Reload (Ctrl+Shift+R) |

## 14. Sicherheit & DSGVO
- Keine personenbezogenen Daten speichern ohne Zustimmung.
- IP wird aktuell geloggt – für DSGVO optional anonymisieren (z.B. nur /24 Range). Anpassung Punkt in `server.py` möglich.

## 15. Anpassung Out-of-Scope Marker
In `App.jsx` Array `OUT_OF_SCOPE_MARKERS` anpassen oder aus Workflow strukturierter Flag übernehmen.

---
Letzte Aktualisierung: 2025-11-12

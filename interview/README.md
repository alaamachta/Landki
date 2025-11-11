# LandKI Interview – OpenAI ChatKit

Production ChatKit deployment using official Sessions API with workflow `wf_6910af26c670819097b24c11ebbe0b380a5bfa9945431f22`.

## 🚀 Quick Operations (90-second guide)

### Start/Stop Server
```bash
cd /var/www/landki/interview
npx pm2 start server.js --name chatkit-interview    # Start
npx pm2 stop chatkit-interview                      # Stop
npx pm2 restart chatkit-interview                   # Restart
npx pm2 logs chatkit-interview --lines 100          # View logs
npx pm2 status                                      # Check status
```

### Health Check
```bash
curl -X POST https://landki.com/interview/api/chatkit/session \
  -H "Content-Type: application/json" \
  -d '{"workflow":"wf_6910af26c670819097b24c11ebbe0b380a5bfa9945431f22"}'
# Should return: {"client_secret":{"value":"ek_...","expires_at":...}}
```

### Nginx
```bash
sudo nginx -t                    # Test config
sudo systemctl reload nginx      # Reload
sudo nginx -T | grep interview   # View config
```

## 📁 Architecture

**Stack**: Node.js (Express) + OpenAI Realtime Sessions API + Official ChatKit CDN  
**Port**: 3101 (internal), proxied via nginx at `/interview/api/`  
**Deployment**: PM2 process manager, auto-restart on boot

### File Structure
```
/var/www/landki/interview/
├── index.html          # Frontend (ChatKit.create with getClientSecret)
├── server.js           # Backend session endpoint (port 3101)
├── package.json        # Dependencies: express, openai, pm2
├── .env                # OPENAI_API_KEY, CHATKIT_WORKFLOW_ID
└── _backups/           # Timestamped backups
```

### Request Flow
1. User opens `https://landki.com/interview/`
2. ChatKit calls `getClientSecret()` → POST `/interview/api/chatkit/session`
3. Nginx proxies to `http://127.0.0.1:3101/api/chatkit/session`
4. Express calls OpenAI Realtime Sessions API (fallback if workflow endpoint fails)
5. Returns `client_secret` → ChatKit initializes with workflow context

## 🔒 Security

- API key never exposed to client (server-side only)
- CORS restricted to `landki.com` origin
- Nginx proxy isolates internal port 3101
- PM2 runs as root (production VM setup)

## 📝 Configuration

**`.env`** (UTF-8, LF line endings):
```env
OPENAI_API_KEY=sk-proj-...
CHATKIT_WORKFLOW_ID=wf_6910af26c670819097b24c11ebbe0b380a5bfa9945431f22
```

**Nginx** (`/etc/nginx/sites-available/landki.com.conf`):
```nginx
location /interview/api/ {
    proxy_pass http://localhost:3101/api/;
    # ... (proxy headers configured)
}
```

## 🛠 Troubleshooting

**Session creation fails:**
```bash
npx pm2 logs chatkit-interview --err --lines 50
# Check for API key errors or workflow ID issues
```

**Port 3101 already in use:**
```bash
sudo lsof -i :3101
npx pm2 restart chatkit-interview
```

**ChatKit not loading:**
- Check browser console for CDN errors
- Verify `https://cdn.platform.openai.com/deployments/chatkit/chatkit.js` is accessible
- Test session endpoint manually (see Health Check above)

## 📦 Dependencies

- `express@^4.21.2` – HTTP server
- `openai@^4.76.1` – Official OpenAI SDK
- `dotenv@^16.4.5` – Environment variables
- `pm2` (global) – Process manager

Installed via: `npm install express openai dotenv pm2`
4. **Auto-updates**: Changes in OpenAI Agent Builder appear live after page refresh

## Deployment

The app is deployed to `/var/www/landki/interview/dist/` and served at:
- https://landki.com/interview/

Build output includes SPA routing support via NGINX configuration.

For production deployment, ensure:
1. The backend server (`server.js`) is running on the production server
2. API endpoint is accessible at `/api/chatkit/session`
3. NGINX is configured to proxy `/api/*` requests to the backend server


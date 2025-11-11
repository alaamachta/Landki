# 🚀 Interview Chat - Quick Reference

## URLs
- **Frontend:** https://landki.com/interview/
- **API Base:** https://landki.com/interview/api/
- **Health:** https://landki.com/interview/api/health

## Service Management

### PM2 Commands
```bash
pm2 status                    # Check status
pm2 restart interview-api     # Restart
pm2 logs interview-api       # View logs
pm2 stop interview-api       # Stop
pm2 start /var/www/landki/interview/api/ecosystem.config.cjs  # Start
```

### NGINX
```bash
sudo nginx -t                # Test config
sudo systemctl reload nginx  # Reload
sudo systemctl status nginx  # Check status
```

## Logs
```bash
# API logs
tail -f /var/www/landki/interview/_logs/api-out.log
tail -f /var/www/landki/interview/_logs/api-error.log

# Application logs
tail -f /var/www/landki/interview/_logs/feedback.jsonl
tail -f /var/www/landki/interview/_logs/chat-sessions.jsonl

# PM2 logs
pm2 logs interview-api --lines 100
```

## Build & Deploy

### Frontend
```bash
cd /var/www/landki/interview/frontend
npm install
npm run build          # Outputs to ../dist/
```

### Backend
```bash
cd /var/www/landki/interview/api
npm install
npm run build          # Compiles TypeScript to dist/
pm2 restart interview-api
```

## Configuration
- **Environment:** `/var/www/landki/interview/.env`
- **NGINX:** `/etc/nginx/sites-available/landki.com.conf`
- **PM2:** `/var/www/landki/interview/api/ecosystem.config.cjs`

## Quick Tests
```bash
# Health check
curl https://landki.com/interview/api/health -k

# Chat test
curl -N -H "Content-Type: application/json" \
  -d '{"message":"Hallo"}' \
  https://landki.com/interview/api/chat -k

# Feedback test
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"Test","message":"Hi","consentForward":true}' \
  https://landki.com/interview/api/feedback -k
```

## Troubleshooting

### API not responding
```bash
pm2 status                    # Check if running
pm2 logs interview-api       # Check for errors
lsof -i :3001                # Check port
```

### Frontend not loading
```bash
ls -la /var/www/landki/interview/dist/   # Verify build output
sudo nginx -T | grep interview           # Check NGINX config
curl -I https://landki.com/interview/ -k # Check response
```

### Environment variables not loading
```bash
cat /var/www/landki/interview/.env       # Verify .env exists
pm2 restart interview-api                # Reload
```

## File Locations
```
/var/www/landki/interview/
├── dist/              # Frontend build (served by NGINX)
├── frontend/          # React source
├── api/              # Express backend
├── _logs/            # Runtime logs
├── _backups/         # Timestamped backups
├── .env              # Secrets (git-ignored)
└── DEPLOYMENT.md     # This deployment summary
```

## Emergency Rollback
```bash
# Restore previous version
sudo cp /var/www/landki/interview/_backups/index.html.20251111-163531 \
        /var/www/landki/interview/index.html
pm2 stop interview-api
sudo systemctl reload nginx
```

## Status Check (One Command)
```bash
pm2 status && curl -s https://landki.com/interview/api/health -k | head -c 100
```

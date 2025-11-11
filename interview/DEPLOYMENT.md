# ChatKit Integration Deployment Guide

## Prerequisites

1. **OpenAI API Key**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Must be from the same organization and project as your Agent Builder workflow
   
2. **Workflow ID**: Copy from [Agent Builder](https://platform.openai.com/agent-builder) after clicking "Publish"

## Setup Instructions

### 1. Configure Environment Variables

Edit `.env` and add your credentials:

```bash
VITE_WORKFLOW_ID=wf_6910af26c670819097b24c11ebbe0b380a5bfa9945431f22
VITE_WORKFLOW_VERSION=2
OPENAI_API_KEY=***REMOVED***
```

**Important**: The `OPENAI_API_KEY` must be from the same OpenAI organization and project as your workflow.

### 2. Run Setup Script

```bash
cd /var/www/landki/interview
./setup.sh
```

This will:
- Install dependencies
- Build the application
- Set correct permissions
- Restart the backend API service
- Reload NGINX

### 3. Manual Setup (Alternative)

If you prefer to set up manually:

```bash
# Install dependencies
npm install

# Build the app
npm run build

# Set permissions
chown -R www-data:www-data dist/
chmod -R 755 dist/

# Enable and start the API service
systemctl enable landki-interview-api.service
systemctl start landki-interview-api.service

# Reload NGINX
systemctl reload nginx
```

## Verification

### Check Service Status

```bash
# Check API service
systemctl status landki-interview-api.service

# Check logs
journalctl -u landki-interview-api.service -f
```

### Test the Application

1. Visit https://landki.com/interview/
2. Open browser DevTools (F12) → Console
3. Check for errors (should see no 404s or console errors)
4. Test the chat interface

### Verify Auto-Updates

1. Make changes in [OpenAI Agent Builder](https://platform.openai.com/agent-builder)
   - Update prompts
   - Modify starter buttons
   - Change UI settings
2. Refresh https://landki.com/interview/
3. Changes should appear immediately (no rebuild needed)

## Architecture

```
User Browser
    ↓
NGINX (https://landki.com/interview/)
    ↓
├─→ Static Files (dist/) → React App + ChatKit Widget
    ↓
└─→ /interview/api/* → Backend API (port 3001)
    ↓
    └─→ OpenAI ChatKit Sessions API
         ↓
         OpenAI Agent Builder Workflow (wf_...)
```

## Troubleshooting

### Service won't start

```bash
# Check logs
journalctl -u landki-interview-api.service -n 50

# Common issues:
# - Missing OPENAI_API_KEY in .env
# - Port 3001 already in use
# - Incorrect file permissions
```

### 404 on API calls

```bash
# Check NGINX config
nginx -t
cat /etc/nginx/sites-available/landki.com.conf | grep -A 10 "interview/api"

# Reload NGINX
systemctl reload nginx
```

### ChatKit not loading

```bash
# Check browser console for:
# - CDN script loading (https://cdn.platform.openai.com/deployments/chatkit/chatkit.js)
# - Network errors
# - CORS issues

# Verify CDN in built HTML
cat dist/index.html | grep chatkit.js
```

### Changes from Agent Builder not appearing

1. Verify workflow ID is correct in `.env`
2. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
3. Clear browser cache
4. Check that the workflow is published in Agent Builder

## Production Checklist

- [ ] OPENAI_API_KEY is set and valid
- [ ] VITE_WORKFLOW_ID matches the published workflow
- [ ] Backend service is running (`systemctl status landki-interview-api.service`)
- [ ] NGINX is configured and reloaded
- [ ] No console errors in browser
- [ ] Chat widget loads and responds
- [ ] Changes in Agent Builder appear after page refresh
- [ ] SSL certificate is valid
- [ ] Domain is allowlisted in OpenAI settings

## Security Notes

1. **API Key Protection**: The `OPENAI_API_KEY` is only used server-side (in `server.js`)
2. **Session Management**: Sessions are created per-user with unique IDs
3. **HTTPS**: All traffic is encrypted via SSL
4. **Environment Variables**: Never commit `.env` to version control

## Maintenance

### Update ChatKit Version

```bash
npm update @openai/chatkit-react
npm run build
systemctl reload nginx
```

### Update Workflow

Changes made in Agent Builder automatically appear on the live site after page refresh - no deployment needed!

### Rebuild and Deploy

```bash
npm run build
chown -R www-data:www-data dist/
systemctl reload nginx
```

## Support

- [ChatKit Documentation](https://platform.openai.com/docs/guides/chatkit)
- [ChatKit GitHub](https://github.com/openai/chatkit-js)
- [Agent Builder](https://platform.openai.com/agent-builder)

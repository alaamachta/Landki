# ChatKit Integration Deployment Guide

## Overview

This deployment uses the **official OpenAI ChatKit CDN** with direct mounting - no backend API or React wrapper required. Changes published in Agent Builder appear live after a page refresh.

## Prerequisites

1. **Workflow ID**: Copy from [Agent Builder](https://platform.openai.com/agent-builder) after clicking "Publish"
   - Current workflow: `wf_6910af26c670819097b24c11ebbe0b380a5bfa9945431f22`

## Setup Instructions

### Build and Deploy

```bash
cd /var/www/landki/interview

# Build the application
npm run build

# Set permissions
chown -R www-data:www-data dist/
chmod -R 755 dist/

# Reload NGINX
systemctl reload nginx
```

## Verification

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
2. **Hard refresh** https://landki.com/interview/ (Ctrl+Shift+R / Cmd+Shift+R)
3. Changes should appear immediately (no rebuild needed)

## Architecture

```
User Browser
    ↓
NGINX (https://landki.com/interview/)
    ↓
Static HTML + ChatKit CDN Script
    ↓
https://cdn.platform.openai.com/deployments/chatkit/chatkit.js (versionless)
    ↓
OpenAI Agent Builder Workflow (wf_...)
```

**Key Features:**
- ✅ No backend API required (direct CDN mount)
- ✅ No React wrapper dependencies
- ✅ Auto-updates from Agent Builder via versionless CDN
- ✅ Trailing-slash redirect: `/interview` → `/interview/`
- ✅ Favicon served from website root

## Troubleshooting

### ChatKit not loading

```bash
# Check browser console for:
# - CDN script loading (https://cdn.platform.openai.com/deployments/chatkit/chatkit.js)
# - Network errors

# Verify CDN in built HTML
cat dist/index.html | grep chatkit.js
```

### Changes from Agent Builder not appearing

1. Verify workflow ID is correct in `index.html`
2. **Hard refresh** browser (Ctrl+Shift+R / Cmd+Shift+R)
3. Clear browser cache
4. Check that the workflow is published in Agent Builder

## Production Checklist

- [ ] Workflow ID matches the published workflow in `index.html`
- [ ] NGINX is configured and reloaded
- [ ] No console errors in browser
- [ ] Chat widget loads and responds
- [ ] Changes in Agent Builder appear after hard refresh
- [ ] SSL certificate is valid
- [ ] Trailing-slash redirect works
- [ ] Favicon loads from `/favicon.ico`

## Maintenance

### Update Workflow ID

Edit `index.html` and update the workflow ID, then rebuild:

```bash
npm run build
chown -R www-data:www-data dist/
systemctl reload nginx
```

### Daily Updates

No deployment needed! Publish changes in Agent Builder and users see them after hard refresh.

## Support

- [Agent Builder](https://platform.openai.com/agent-builder)

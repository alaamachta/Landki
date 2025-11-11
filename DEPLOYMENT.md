# Landki ChatKit Implementation - Deployment Guide

## 📋 Overview

This implementation provides two ChatKit-based frontends:
1. **Fullscreen Interview App** - https://landki.com/interview/
2. **Floating Widget** - Embeddable chat widget on https://landki.com/

## 🏗️ Architecture

```
/var/www/landki/
├── interview/              # Fullscreen Chat App
│   ├── src/
│   │   ├── App.jsx        # Main app component with ChatKit Thread
│   │   ├── main.jsx       # React entry point
│   │   └── index.css      # Dark theme styles
│   ├── index.html         # HTML template
│   ├── vite.config.js     # Vite configuration (base: /interview/)
│   ├── package.json       # Dependencies (@assistant-ui/react, react, etc.)
│   ├── .env               # Workflow configuration
│   └── dist/              # Build output (gitignored)
│
├── website/               # Main Website
│   ├── index.html         # Homepage with widget integration
│   └── widget/            # Chat Widget
│       ├── src/
│       │   └── widget.jsx # Widget component (button + overlay)
│       ├── vite.config.js # Build as IIFE library
│       ├── package.json   # Dependencies
│       └── dist/          # Build output (gitignored)
│           └── widget.js  # Single compiled file (~734KB)
│
└── deploy.sh              # Deployment script

/etc/nginx/sites-available/
└── landki.com.conf        # NGINX configuration
```

## 🚀 Deployment

### Quick Deploy

```bash
cd /var/www/landki
./deploy.sh
```

### Manual Deployment

#### 1. Build Interview App
```bash
cd /var/www/landki/interview
npm install
npm run build
```

#### 2. Build Widget
```bash
cd /var/www/landki/website/widget
npm install
npm run build
```

#### 3. Reload NGINX
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Configuration

### Interview App Environment (.env)
```env
VITE_WORKFLOW_ID=wf_6910af26c670819097b24c11ebbe0b380a5bfa9945431f22
VITE_WORKFLOW_VERSION=2
```

### NGINX Configuration Highlights

**Interview App (SPA Routing):**
```nginx
location /interview/ {
    alias /var/www/landki/interview/dist/;
    try_files $uri $uri/ /interview/index.html;
}
```

**Widget (Static with Caching):**
```nginx
location /widget/ {
    alias /var/www/landki/website/widget/dist/;
    expires 7d;
    add_header Cache-Control "public, max-age=604800, immutable";
}
```

## 📦 Widget Integration

Add to any HTML page:

```html
<!-- Container element -->
<div id="landki-chat" 
     data-workflow-id="wf_6910af26c670819097b24c11ebbe0b380a5bfa9945431f22" 
     data-version="2"></div>

<!-- Widget script -->
<script src="/widget/widget.js" defer></script>
```

**Features:**
- Floating button (bottom-right)
- Click to open overlay panel
- Responsive design (mobile-friendly)
- Close button in panel header
- Custom workflow ID per instance

## ✅ Acceptance Criteria

- [x] https://landki.com/interview/ loads fullscreen chat
- [x] Floating bubble appears on https://landki.com/
- [x] Widget opens overlay with ChatKit
- [x] SPA routing works (no 404 on refresh)
- [x] Widget builds to single file
- [x] NGINX configuration with proper caching
- [x] Deploy script automates build + reload
- [x] All files committed to git

## 🔍 Verification

### Check Services
```bash
# NGINX status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check build outputs
ls -lh /var/www/landki/interview/dist/
ls -lh /var/www/landki/website/widget/dist/
```

### Test Endpoints
```bash
# Interview app HTML
curl -I https://landki.com/interview/

# Widget script
curl -I https://landki.com/widget/widget.js

# Main website
curl -I https://landki.com/
```

## 📊 Build Output

**Interview App:**
- `dist/index.html` (~1KB)
- `dist/assets/index-*.js` (~405KB)
- `dist/assets/index-*.css` (~1.5KB)

**Widget:**
- `dist/widget.js` (~734KB, includes React + ChatKit)

## 🛠️ Development

### Interview App
```bash
cd /var/www/landki/interview
npm run dev  # http://localhost:5173/interview/
```

### Widget
```bash
cd /var/www/landki/website/widget
npm run dev  # http://localhost:5173/
```

## 🔐 Security Headers

NGINX adds the following security headers:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`

Widget includes CORS headers for cross-domain usage:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, OPTIONS`

## 📝 Notes

- Widget is compiled as IIFE (Immediately Invoked Function Expression)
- All React/ChatKit dependencies are bundled into widget.js
- Interview app uses SPA routing with Vite base path `/interview/`
- Both projects use React 18 and @assistant-ui/react v0.5.0
- Build process includes tree-shaking for optimal bundle size

## 🎉 Success Indicators

After deployment:
1. Visit https://landki.com/ - should see homepage with chat bubble
2. Click chat bubble - overlay panel opens with ChatKit
3. Visit https://landki.com/interview/ - fullscreen dark chat interface
4. Refresh /interview/ - no 404, SPA routing works
5. Check browser console - no 404s or missing assets

## 📞 Support

For issues or questions:
- Check NGINX logs: `/var/log/nginx/landki.com.error.log`
- Check browser console for JavaScript errors
- Verify build outputs exist in dist/ directories
- Ensure NGINX has been reloaded after changes

#!/bin/bash

# Landki Verification Script
# Checks if all components are properly deployed

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Landki Deployment Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ERRORS=0

# Check interview app build
echo "📦 Checking Interview App build..."
if [ -f "/var/www/landki/interview/dist/index.html" ]; then
    echo "  ✅ dist/index.html exists"
else
    echo "  ❌ dist/index.html missing"
    ERRORS=$((ERRORS + 1))
fi

if [ -d "/var/www/landki/interview/dist/assets" ]; then
    ASSET_COUNT=$(ls /var/www/landki/interview/dist/assets/*.js 2>/dev/null | wc -l)
    echo "  ✅ Assets directory exists ($ASSET_COUNT JS files)"
else
    echo "  ❌ Assets directory missing"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check widget build
echo "📦 Checking Widget build..."
if [ -f "/var/www/landki/website/widget/dist/widget.js" ]; then
    SIZE=$(ls -lh /var/www/landki/website/widget/dist/widget.js | awk '{print $5}')
    echo "  ✅ widget.js exists ($SIZE)"
else
    echo "  ❌ widget.js missing"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check NGINX configuration
echo "🔧 Checking NGINX configuration..."
if [ -f "/etc/nginx/sites-available/landki.com.conf" ]; then
    echo "  ✅ landki.com.conf exists"
else
    echo "  ❌ landki.com.conf missing"
    ERRORS=$((ERRORS + 1))
fi

if [ -L "/etc/nginx/sites-enabled/landki.com.conf" ]; then
    echo "  ✅ landki.com.conf enabled (symlink exists)"
else
    echo "  ❌ landki.com.conf not enabled"
    ERRORS=$((ERRORS + 1))
fi

# Test NGINX syntax
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "  ✅ NGINX configuration valid"
else
    echo "  ❌ NGINX configuration has errors"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check NGINX service
echo "🚀 Checking NGINX service..."
if systemctl is-active --quiet nginx; then
    echo "  ✅ NGINX is running"
else
    echo "  ❌ NGINX is not running"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check website files
echo "🌐 Checking website files..."
if [ -f "/var/www/landki/website/index.html" ]; then
    echo "  ✅ Main website index.html exists"
else
    echo "  ❌ Main website index.html missing"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check deploy script
echo "🔨 Checking deploy script..."
if [ -x "/var/www/landki/deploy.sh" ]; then
    echo "  ✅ deploy.sh exists and is executable"
else
    echo "  ❌ deploy.sh missing or not executable"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check .env file
echo "⚙️  Checking configuration..."
if [ -f "/var/www/landki/interview/.env" ]; then
    echo "  ✅ Interview app .env exists"
    if grep -q "VITE_WORKFLOW_ID" /var/www/landki/interview/.env; then
        echo "  ✅ WORKFLOW_ID configured"
    else
        echo "  ⚠️  WORKFLOW_ID not found in .env"
    fi
else
    echo "  ⚠️  Interview app .env missing (using defaults)"
fi
echo ""

# Final summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed! Deployment looks good."
    echo ""
    echo "📊 Access Points:"
    echo "  • Main Site: https://landki.com/"
    echo "  • Interview: https://landki.com/interview/"
    echo "  • Widget JS: https://landki.com/widget/widget.js"
else
    echo "❌ Found $ERRORS error(s). Please review above."
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

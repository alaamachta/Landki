#!/bin/bash

# Landki Deployment Script
# Builds interview app and widget, then reloads NGINX

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INTERVIEW_DIR="$SCRIPT_DIR/interview"
WIDGET_DIR="$SCRIPT_DIR/website/widget"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Landki Deployment Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to handle errors
error_exit() {
    echo "❌ Error: $1" >&2
    exit 1
}

# Function to check if directory exists
check_directory() {
    if [ ! -d "$1" ]; then
        error_exit "Directory $1 does not exist"
    fi
}

# Check required directories
echo "📁 Checking directories..."
check_directory "$INTERVIEW_DIR"
check_directory "$WIDGET_DIR"
echo "✅ Directories found"
echo ""

# Build Interview App
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔨 Building Interview App..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd "$INTERVIEW_DIR" || error_exit "Cannot cd to $INTERVIEW_DIR"

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies for interview app..."
    npm install || error_exit "Failed to install interview app dependencies"
else
    echo "📦 Dependencies already installed, skipping npm install"
fi

echo "🔨 Building interview app..."
npm run build || error_exit "Failed to build interview app"
echo "✅ Interview app built successfully"
echo ""

# Build Widget
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔨 Building Widget..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd "$WIDGET_DIR" || error_exit "Cannot cd to $WIDGET_DIR"

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies for widget..."
    npm install || error_exit "Failed to install widget dependencies"
else
    echo "📦 Dependencies already installed, skipping npm install"
fi

echo "🔨 Building widget..."
npm run build || error_exit "Failed to build widget"
echo "✅ Widget built successfully"
echo ""

# Reload NGINX
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Reloading NGINX..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test NGINX configuration first
echo "🧪 Testing NGINX configuration..."
sudo nginx -t || error_exit "NGINX configuration test failed"

echo "🔄 Reloading NGINX..."
sudo systemctl reload nginx || error_exit "Failed to reload NGINX"
echo "✅ NGINX reloaded successfully"
echo ""

# Final status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment completed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Deployment Summary:"
echo "  • Interview App: https://landki.com/interview/"
echo "  • Widget: https://landki.com/widget/widget.js"
echo "  • Main Site: https://landki.com/"
echo ""
echo "🎉 All systems ready!"

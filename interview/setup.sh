#!/bin/bash
# Landki Interview ChatKit Setup Script

set -e

echo "🚀 Setting up Landki Interview ChatKit Integration"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "   Please copy .env.example to .env and add your OPENAI_API_KEY"
    exit 1
fi

# Check if OPENAI_API_KEY is set
source .env
if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your_openai_api_key_here" ]; then
    echo "⚠️  Warning: OPENAI_API_KEY is not set in .env"
    echo "   Please add your OpenAI API key to the .env file"
    echo "   Get your API key from: https://platform.openai.com/api-keys"
    echo ""
    read -p "   Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the app
echo "🔨 Building application..."
npm run build

# Set correct permissions
echo "🔒 Setting permissions..."
chown -R www-data:www-data dist/
chmod -R 755 dist/

# Restart services
echo "🔄 Restarting services..."
systemctl restart landki-interview-api.service
systemctl reload nginx

# Check service status
echo ""
echo "✅ Setup complete!"
echo ""
echo "Service status:"
systemctl status landki-interview-api.service --no-pager -l | head -10
echo ""
echo "🌐 Application available at: https://landki.com/interview/"
echo ""
echo "📋 Next steps:"
echo "   1. Ensure OPENAI_API_KEY is set in .env"
echo "   2. Test the application at https://landki.com/interview/"
echo "   3. Check logs: journalctl -u landki-interview-api.service -f"

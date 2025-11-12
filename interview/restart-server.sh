#!/bin/bash
# Restart Interview Server with correct environment

# Kill existing processes
lsof -ti:3001 | xargs -r kill -9
sleep 1

# Set environment variables (FILL THESE IN!)
export OPENAI_API_KEY="sk-proj-..."  # ← DEIN API KEY HIER
export DOMAIN_PUBLIC_KEY="domain_pk_..."  # ← DEIN DOMAIN KEY HIER
export OPENAI_WORKFLOW_ID="wf_6910af26c670819097b24c11ebbe0b380a5bfa9945431f22"
export ALLOWED_ORIGINS="https://landki.com"
export PORT="3001"

# Start server
cd /var/www/landki/interview
nohup python3 server.py > /tmp/interview-server.log 2>&1 &

sleep 2

# Check status
if curl -sf http://127.0.0.1:3001/interview/api/health > /dev/null; then
    echo "✅ Server started successfully on port 3001"
    echo "📋 Logs: tail -f /tmp/interview-server.log"
else
    echo "❌ Server failed to start. Check logs:"
    tail -20 /tmp/interview-server.log
    exit 1
fi

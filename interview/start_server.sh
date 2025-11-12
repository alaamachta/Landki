#!/bin/bash
# Start Interview Assistant Server

cd /var/www/landki/interview

# Kill any existing process
pkill -f "python3.*server.py" 2>/dev/null

# Wait a moment
sleep 2

# Start the server in background
nohup python3 server.py > _logs/server.log 2>&1 &

echo "Interview Assistant server started"

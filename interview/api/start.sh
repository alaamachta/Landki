#!/bin/bash
# Load environment variables from .env file
set -a
source /var/www/landki/interview/.env
set +a

# Start the server
exec node /var/www/landki/interview/api/dist/server.js

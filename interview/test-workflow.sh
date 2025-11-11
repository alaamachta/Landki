#!/bin/bash
# Test script for Workflow SSE streaming

API_URL="http://127.0.0.1:3001/api/chat"

echo "=== Test 1: Welche Ausbildung hat Alaa gemacht? (should route to internal_qa) ==="
curl -N -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"message":"Welche Ausbildung hat Alaa gemacht?","locale":"de-DE"}' \
  2>/dev/null &

PID1=$!
sleep 8
kill $PID1 2>/dev/null

echo -e "\n\n=== Test 2: Preis vom iPhone 16? (should route to feedback) ==="
curl -N -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"message":"Preis vom iPhone 16?","locale":"de-DE"}' \
  2>/dev/null &

PID2=$!
sleep 8
kill $PID2 2>/dev/null

echo -e "\n\n=== Checking JSONL logs ==="
echo "qa.jsonl entries:"
tail -2 /var/www/landki/interview/_logs/qa.jsonl 2>/dev/null || echo "No qa.jsonl yet"

echo -e "\nfeedback.jsonl entries:"
tail -2 /var/www/landki/interview/_logs/feedback.jsonl 2>/dev/null || echo "No feedback.jsonl yet"

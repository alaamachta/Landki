#!/usr/bin/env python3
"""
Interview Assistant - Admin API (minimal)
Only exposes admin logs and stats endpoints; no chat logic.
"""
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional
import logging

from fastapi import FastAPI, HTTPException, Header
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Minimal config
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")  # Optional; if unset, auth is disabled

# Paths
BASE_DIR = Path(__file__).parent
LOGS_DIR = BASE_DIR / "_logs"
LOGS_DIR.mkdir(exist_ok=True)

# App
app = FastAPI(title="Interview Admin API", version="1.0.0")

@app.get("/api/admin/logs")
async def get_logs(
    x_admin_token: Optional[str] = Header(None),
    log_type: str = "chat",
    limit: int = 100
):
    """Return the last N log entries from the JSONL file."""
    if ADMIN_TOKEN and x_admin_token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")

    log_file = LOGS_DIR / f"{log_type}.jsonl"
    if not log_file.exists():
        return {"entries": []}

    entries = []
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
            for line in reversed(lines[-limit:]):
                if line.strip():
                    entries.append(json.loads(line))
    except Exception as e:
        logger.error(f"Failed to read logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to read logs")

    return {"entries": entries}

@app.get("/api/admin/stats")
async def get_stats(x_admin_token: Optional[str] = Header(None)):
    """Return simple counters for chats and feedback (total and today)."""
    if ADMIN_TOKEN and x_admin_token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")

    stats = {
        "total_chats": 0,
        "total_feedback": 0,
        "today_chats": 0,
        "today_feedback": 0
    }

    today = datetime.now().date().isoformat()

    # Count chat logs
    chat_log = LOGS_DIR / "chat.jsonl"
    if chat_log.exists():
        with open(chat_log, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    stats["total_chats"] += 1
                    if today in line:
                        stats["today_chats"] += 1

    # Count feedback logs
    feedback_log = LOGS_DIR / "feedback.jsonl"
    if feedback_log.exists():
        with open(feedback_log, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    stats["total_feedback"] += 1
                    if today in line:
                        stats["today_feedback"] += 1

    return stats

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=3001, log_level="info")

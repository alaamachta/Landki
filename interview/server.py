#!/usr/bin/env python3
"""
Interview Assistant API

Exposes:
- GET /interview/api/health                     -> health check
- GET /interview/api/admin/logs                 -> tail JSONL logs (chat|feedback)
- GET /interview/api/admin/stats                -> simple counters
- POST /interview/api/admin/feedback            -> append feedback to JSONL
- POST /interview/api/chatkit/session           -> client token/session bootstrap (domain-allowlist mode)

Notes:
- Never exposes OpenAI API keys to the client.
- CORS restricted to ALLOWED_ORIGINS.
"""
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional
import logging

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
import openai

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
ALLOWED_ORIGINS = [o.strip() for o in (os.getenv("ALLOWED_ORIGINS", "").split(",")) if o.strip()]
PORT = int(os.getenv("PORT", "3001"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_WORKFLOW_ID = os.getenv("OPENAI_WORKFLOW_ID") or os.getenv("OPENAI_WORKFLOW_ID") or os.getenv("OPENAI_WORKFLOW_ID")
OPENAI_PROJECT_ID = os.getenv("OPENAI_PROJECT_ID")
DOMAIN_PUBLIC_KEY = os.getenv("OPENAI_DOMAIN_PUBLIC_KEY") or os.getenv("DOMAIN_PUBLIC_KEY")

# Initialize OpenAI client
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY
    client = openai.OpenAI(api_key=OPENAI_API_KEY)
else:
    client = None
    logger.warning("OPENAI_API_KEY not set - chat functionality will be disabled")

# Paths
BASE_DIR = Path(__file__).parent
LOGS_DIR = BASE_DIR / "_logs"
LOGS_DIR.mkdir(exist_ok=True)

# App
app = FastAPI(title="Interview API", version="1.2.0")

# CORS
if ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )

@app.get("/interview/api/health")
async def health():
    return {
        "status": "ok",
        "service": "interview-api",
        "time": datetime.utcnow().isoformat() + "Z",
        "workflow_configured": bool(OPENAI_WORKFLOW_ID),
    }

@app.get("/interview/api/admin/logs")
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

@app.get("/interview/api/admin/stats")
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

@app.post("/interview/api/admin/feedback")
async def submit_feedback(request: Request, x_admin_token: Optional[str] = Header(None)):
    """Append feedback entry to feedback.jsonl; auth optional via ADMIN_TOKEN.

    Expected JSON body example:
    {
      "session_id": "abc123",
      "rating": 5,               # or "thumbs_up"/"thumbs_down"
      "comment": "...",
      "message_id": "msg_...",  # optional
      "metadata": { ... }        # optional
    }
    """
    # Feedback is allowed without admin token; if you want to restrict, uncomment below
    # if ADMIN_TOKEN and x_admin_token != ADMIN_TOKEN:
    #     raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    entry = {
        "type": "feedback",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "session_id": payload.get("session_id") or payload.get("sessionId"),
        "rating": payload.get("rating"),
        "comment": payload.get("comment"),
        "message_id": payload.get("message_id") or payload.get("messageId"),
        "metadata": payload.get("metadata") or {},
        "user_agent": request.headers.get("user-agent"),
        "ip": request.client.host if request.client else None,
    }

    feedback_log = LOGS_DIR / "feedback.jsonl"
    try:
        with open(feedback_log, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception as e:
        logger.error(f"Failed to write feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to write feedback")

    return {"ok": True}

@app.post("/interview/api/chatkit/session")
async def chatkit_session():
    """Create a ChatKit session using the official ChatKit API.
    
    This endpoint follows the pattern from openai-chatkit-starter-app.
    It creates a session with the OpenAI ChatKit API for the workflow.
    """
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="Missing OPENAI_API_KEY")
    
    workflow_id = OPENAI_WORKFLOW_ID or "wf_6910af26c670819097b24c11ebbe0b380a5bfa9945431f22"
    
    if not workflow_id:
        raise HTTPException(status_code=400, detail="Missing workflow id")
    
    try:
        # Call OpenAI ChatKit Sessions API
        chatkit_api_base = "https://api.openai.com"
        url = f"{chatkit_api_base}/v1/chatkit/sessions"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "OpenAI-Beta": "chatkit_beta=v1",
        }
        
        # Add domain public key to headers if available
        if DOMAIN_PUBLIC_KEY:
            headers["OpenAI-Domain-Public-Key"] = DOMAIN_PUBLIC_KEY
        
        # Generate a user ID (in production, this should be a real user ID)
        import uuid
        user_id = str(uuid.uuid4())
        
        payload = {
            "workflow": {"id": workflow_id},  # Use latest/default version
            "user": user_id,
            "chatkit_configuration": {
                "file_upload": {
                    "enabled": False
                }
            }
        }
        
        logger.info(f"Creating ChatKit session for workflow: {workflow_id}")
        
        import httpx
        async with httpx.AsyncClient(timeout=30.0) as http_client:
            response = await http_client.post(url, headers=headers, json=payload)
            
            if response.status_code != 200:
                logger.error(f"ChatKit session creation failed: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"ChatKit API error: {response.text}"
                )
            
            session_data = response.json()
            logger.info(f"ChatKit session created successfully")
            
            return session_data
            
    except httpx.HTTPError as e:
        error_msg = f"HTTP error creating ChatKit session: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Error creating ChatKit session: {str(e) or repr(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)


@app.post("/interview/api/log")
async def ingest_log(request: Request):
    """Ingest generic client log events (chat + telemetry).

    Body is stored as-is with server-side timestamp. This endpoint is
    intentionally permissive to allow capturing events posted by ChatKit
    via postMessage hooks from the frontend without exposing secrets.
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    entry = {
        "type": payload.get("type") or payload.get("event") or "event",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        **payload,
        "user_agent": request.headers.get("user-agent"),
        "ip": request.client.host if request.client else None,
    }

    chat_log = LOGS_DIR / "chat.jsonl"
    try:
        with open(chat_log, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception as e:
        logger.error(f"Failed to write chat log: {e}")
        raise HTTPException(status_code=500, detail="Failed to write log")

    return {"ok": True}


@app.post("/interview/api/feedback")
async def public_feedback(request: Request):
    """Public feedback endpoint (no admin token required).

    Expected JSON body:
    {
      "session_id": "...",          # optional
      "user_question": "...",       # original user prompt (optional)
      "assistant_reply": "...",     # assistant answer snippet (optional)
      "category": "out_of_scope" | "general" | "error",  # optional tag
      "comment": "..."              # freeform user comment
    }
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    entry = {
        "type": "public_feedback",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "session_id": payload.get("session_id") or payload.get("sessionId"),
        "user_question": payload.get("user_question"),
        "assistant_reply": payload.get("assistant_reply"),
        "category": payload.get("category") or "general",
        "comment": payload.get("comment"),
        "user_agent": request.headers.get("user-agent"),
        "ip": request.client.host if request.client else None,
    }

    feedback_log = LOGS_DIR / "feedback.jsonl"
    try:
        with open(feedback_log, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception as e:
        logger.error(f"Failed to write public feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to write feedback")

    return {"ok": True}


@app.get("/interview/api/feedback/list")
async def list_public_feedback(limit: int = 100):
    """List recent public feedback entries (most recent first)."""
    feedback_log = LOGS_DIR / "feedback.jsonl"
    if not feedback_log.exists():
        return {"entries": []}
    entries = []
    try:
        with open(feedback_log, "r", encoding="utf-8") as f:
            lines = f.readlines()
        for line in reversed(lines[-limit:]):
            if line.strip():
                try:
                    obj = json.loads(line)
                    if obj.get("type") in ("public_feedback", "feedback"):
                        entries.append(obj)
                except Exception:
                    continue
    except Exception as e:
        logger.error(f"Failed to read feedback list: {e}")
        raise HTTPException(status_code=500, detail="Failed to read feedback")
    return {"entries": entries}


if __name__ == "__main__":
    import uvicorn
    # Single uvicorn run (duplicate removed)
    uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="info")

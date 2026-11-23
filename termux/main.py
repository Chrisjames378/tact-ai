import os
import sqlite3
from pathlib import Path
from datetime import datetime, timezone
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("TACT_DATA_DIR", str(ROOT / "data"))) / "approvals.sqlite3"
TOKEN = os.environ.get("TACT_LOCAL_TOKEN", "")
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="TACT AI Guardian Local Companion", version="1.0.0")

def require_token(authorization: str | None):
    if not TOKEN:
        raise HTTPException(status_code=503, detail="Local service token is not configured.")
    if authorization != f"Bearer {TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized.")

def db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("""
        CREATE TABLE IF NOT EXISTS approvals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            details TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL,
            decided_at TEXT
        )
    """)
    return connection

class ApprovalInput(BaseModel):
    title: str
    details: str = ""

@app.get("/health")
def health():
    return {"status": "ok", "service": "tact-termux-companion", "version": "1.0.0"}

@app.get("/v1/status")
def status(authorization: str | None = Header(default=None)):
    require_token(authorization)
    return {"status": "ready", "service": "tact-termux-companion", "approval_store": "sqlite"}

@app.get("/v1/approvals")
def list_approvals(authorization: str | None = Header(default=None)):
    require_token(authorization)
    with db() as connection:
        rows = connection.execute("SELECT * FROM approvals ORDER BY id DESC LIMIT 100").fetchall()
    return {"approvals": [dict(row) for row in rows]}

@app.post("/v1/approvals")
def create_approval(item: ApprovalInput, authorization: str | None = Header(default=None)):
    require_token(authorization)
    title = item.title.strip()
    if not title or len(title) > 160 or len(item.details) > 2000:
        raise HTTPException(status_code=400, detail="Invalid approval request.")
    created = datetime.now(timezone.utc).isoformat()
    with db() as connection:
        cursor = connection.execute(
            "INSERT INTO approvals(title, details, status, created_at) VALUES (?, ?, 'pending', ?)",
            (title, item.details, created)
        )
        approval_id = cursor.lastrowid
    return {"id": approval_id, "status": "pending", "executed": False}

@app.post("/v1/approvals/{approval_id}/decision")
def decide_approval(approval_id: int, decision: str, authorization: str | None = Header(default=None)):
    require_token(authorization)
    if decision not in ("approved", "denied"):
        raise HTTPException(status_code=400, detail="Decision must be approved or denied.")
    with db() as connection:
        cursor = connection.execute(
            "UPDATE approvals SET status = ?, decided_at = ? WHERE id = ? AND status = 'pending'",
            (decision, datetime.now(timezone.utc).isoformat(), approval_id)
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Pending approval not found.")
    return {"id": approval_id, "status": decision, "executed": False}

"""
Project Environment Variables API
===================================
Allows project leads/owners to store project-level .env variables that are
injected into the sandbox when users run code. Users can call os.getenv()
and see only their project vars — never any server secret.

Routes:
  GET    /api/projects/{project_id}/env       — list env keys (no values) 
  PUT    /api/projects/{project_id}/env       — set/update env vars (bulk)
  DELETE /api/projects/{project_id}/env/{key} — remove a single key
"""
import json
from uuid import UUID
from typing import Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from core.database import get_db
from core.deps import get_current_user, get_client_ip
from core.agent_security import load_project_env
from models.user import User, UserRole
from models.membership import Membership, MembershipRole
from routers.projects import _assert_project_access
from services.audit_service import log_action
from models.audit_log import AuditAction, ResourceType

router = APIRouter()

# ── DB helpers ────────────────────────────────────────────────────────────────

async def _ensure_env_table(db: AsyncSession) -> None:
    """Create project_env_vars table if it doesn't exist yet."""
    await db.execute(text("""
        CREATE TABLE IF NOT EXISTS project_env_vars (
            project_id  VARCHAR(64)  NOT NULL,
            env_key     VARCHAR(256) NOT NULL,
            env_value   TEXT         NOT NULL DEFAULT '',
            updated_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (project_id, env_key)
        )
    """))


async def _can_manage_env(db: AsyncSession, project_id: UUID, user: User) -> bool:
    """Only superadmin, admin, or project lead can manage env vars."""
    if user.role in (UserRole.superadmin, UserRole.admin):
        return True
    result = await db.execute(
        text("""
            SELECT 1 FROM memberships
            WHERE project_id = :pid AND user_id = :uid AND role = 'lead'
            LIMIT 1
        """),
        {"pid": str(project_id), "uid": str(user.id)},
    )
    return result.fetchone() is not None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/{project_id}/env", summary="List project env var keys (values hidden)")
async def list_project_env(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Returns the list of env variable KEYS for this project.
    Values are intentionally hidden — only the key names are shown.
    Any project member can see which keys exist (not values).
    """
    await _assert_project_access(db, project_id, user)
    await _ensure_env_table(db)

    res = await db.execute(
        text("SELECT env_key FROM project_env_vars WHERE project_id = :pid ORDER BY env_key"),
        {"pid": str(project_id)},
    )
    keys = [row[0] for row in res.fetchall()]
    return {"project_id": str(project_id), "keys": keys, "count": len(keys)}


@router.put("/{project_id}/env", summary="Set project environment variables (lead/admin only)")
async def set_project_env(
    project_id: UUID,
    payload: Dict[str, str],
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Bulk-upsert project env vars. Only project leads, admins, and superadmins
    can set these. Values are validated through load_project_env() to prevent
    injection of server credentials or system-reserved keys.

    Body: { "MY_API_URL": "https://...", "APP_MODE": "production" }
    """
    await _assert_project_access(db, project_id, user)

    if not await _can_manage_env(db, project_id, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project leads, admins, or superadmins can manage environment variables.",
        )

    if not payload or not isinstance(payload, dict):
        raise HTTPException(status_code=422, detail="Payload must be a non-empty JSON object.")

    if len(json.dumps(payload)) > 65536:  # 64KB total limit
        raise HTTPException(status_code=413, detail="Environment variables payload exceeds 64KB limit.")

    # Run through security filter — strips any attempt to shadow server secrets
    safe_env = load_project_env(payload)

    if not safe_env:
        raise HTTPException(
            status_code=422,
            detail=(
                "No valid environment variable keys found. Keys must be uppercase letters/digits/underscores "
                "and cannot shadow system or server credentials (DATABASE, JWT, SECRET, KEY, TOKEN, etc.)."
            ),
        )

    await _ensure_env_table(db)

    # Upsert each validated key
    for k, v in safe_env.items():
        await db.execute(
            text("""
                INSERT INTO project_env_vars (project_id, env_key, env_value, updated_at)
                VALUES (:pid, :key, :val, CURRENT_TIMESTAMP)
                ON CONFLICT (project_id, env_key) DO UPDATE
                SET env_value = EXCLUDED.env_value, updated_at = CURRENT_TIMESTAMP
            """),
            {"pid": str(project_id), "key": k, "val": v},
        )

    await db.commit()

    await log_action(
        db,
        actor_id=user.id,
        action=AuditAction.update,
        resource_type=ResourceType.project,
        resource_id=project_id,
        project_id=project_id,
        detail={"action": "set_env_vars", "keys": list(safe_env.keys())},
        ip_address=get_client_ip(request),
    )

    return {
        "status": "ok",
        "message": f"Set {len(safe_env)} environment variable(s).",
        "accepted_keys": list(safe_env.keys()),
        "rejected_count": len(payload) - len(safe_env),
    }


@router.delete("/{project_id}/env/{key}", status_code=status.HTTP_204_NO_CONTENT, summary="Remove a project env var")
async def delete_project_env_key(
    project_id: UUID,
    key: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Remove a single environment variable key from this project."""
    await _assert_project_access(db, project_id, user)

    if not await _can_manage_env(db, project_id, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project leads, admins, or superadmins can remove environment variables.",
        )

    await _ensure_env_table(db)
    await db.execute(
        text("DELETE FROM project_env_vars WHERE project_id = :pid AND env_key = :key"),
        {"pid": str(project_id), "key": key},
    )
    await db.commit()


async def get_project_env_for_execution(db: AsyncSession, project_id: Optional[UUID]) -> Dict[str, str]:
    """
    Internal helper: loads the project's env vars for sandbox injection.
    Called by terminal and AI sandbox before spawning a subprocess.
    Returns a dict safe to pass as extra_env to get_sanitized_execution_env().
    """
    if not project_id:
        return {}
    try:
        res = await db.execute(
            text("SELECT env_key, env_value FROM project_env_vars WHERE project_id = :pid"),
            {"pid": str(project_id)},
        )
        raw = {row[0]: row[1] for row in res.fetchall()}
        return load_project_env(raw)  # run through safety filter again
    except Exception:
        return {}

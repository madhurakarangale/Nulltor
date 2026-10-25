from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
import time
import threading

from core.database import get_db
from core.security import (
    verify_password, create_access_token, create_refresh_token,
    decode_refresh_token, get_password_hash
)
from core.deps import get_current_user, get_client_ip
from models.user import User
from models.audit_log import AuditAction, ResourceType
from schemas.user import LoginRequest, TokenResponse, UserRead, PasswordChangeRequest
from services.audit_service import log_action

from typing import Optional
from core.config import settings

router = APIRouter()

# ── Brute-Force Protection ────────────────────────────────────────────────────
# Tracks failed login attempts per IP address.
# Structure: { ip: {"count": int, "locked_until": float} }
_failed_logins: dict = {}
_failed_logins_lock = threading.Lock()

MAX_FAILED_ATTEMPTS = 5      # lock after this many failures
LOCKOUT_SECONDS = 30         # lockout duration
MAX_REQUESTS_PER_MINUTE = 20 # absolute per-IP rate cap (requests/min)
_rate_tracker: dict = {}     # { ip: [timestamps] }


def _check_rate_limit(ip: str) -> None:
    """Raises 429 if IP exceeds MAX_REQUESTS_PER_MINUTE auth requests."""
    now = time.time()
    with _failed_logins_lock:
        timestamps = _rate_tracker.get(ip, [])
        # Keep only timestamps within the last 60s
        timestamps = [t for t in timestamps if now - t < 60]
        if len(timestamps) >= MAX_REQUESTS_PER_MINUTE:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please wait before trying again.",
                headers={"Retry-After": "60"},
            )
        timestamps.append(now)
        _rate_tracker[ip] = timestamps


def _check_lockout(ip: str) -> None:
    """Raises 429 if the IP is currently locked out."""
    now = time.time()
    with _failed_logins_lock:
        entry = _failed_logins.get(ip)
        if entry and entry.get("locked_until", 0) > now:
            remaining = int(entry["locked_until"] - now)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account temporarily locked due to too many failed attempts. Try again in {remaining}s.",
                headers={"Retry-After": str(remaining)},
            )


def _record_failure(ip: str) -> None:
    """Increments failure counter; locks IP after MAX_FAILED_ATTEMPTS."""
    now = time.time()
    with _failed_logins_lock:
        entry = _failed_logins.get(ip, {"count": 0, "locked_until": 0})
        entry["count"] = entry.get("count", 0) + 1
        if entry["count"] >= MAX_FAILED_ATTEMPTS:
            entry["locked_until"] = now + LOCKOUT_SECONDS
            entry["count"] = 0  # reset after lockout begins
        _failed_logins[ip] = entry


def _clear_failure(ip: str) -> None:
    """Clears failure record on successful login."""
    with _failed_logins_lock:
        _failed_logins.pop(ip, None)



def _set_auth_cookies(response: Response, access_token: str, refresh_token: str, request: Optional[Request] = None):
    is_secure = False
    if request:
        proto = request.headers.get("x-forwarded-proto", "").lower()
        is_secure = (request.url.scheme == "https") or (proto == "https")
    if getattr(settings, "ENVIRONMENT", "development") == "production":
        is_secure = True

    response.set_cookie(
        key="nulltor_access_token",
        value=access_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=30 * 60,  # 30 minutes
        path="/",
    )
    response.set_cookie(
        key="nulltor_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=7 * 24 * 3600,  # 7 days
        path="/",
    )


def _clear_auth_cookies(response: Response):
    response.delete_cookie(key="nulltor_access_token", path="/")
    response.delete_cookie(key="nulltor_refresh_token", path="/")


@router.post("/login", response_model=TokenResponse, summary="Authenticate and get JWT")
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    client_ip = get_client_ip(request) or "unknown"

    # ── Rate limiting & brute-force protection ────────────────────────────────
    _check_rate_limit(client_ip)
    _check_lockout(client_ip)

    result = await db.execute(
        select(User).where(
            or_(User.email == payload.email, User.username == payload.email)
        )
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        _record_failure(client_ip)  # increment failure counter
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    _clear_failure(client_ip)  # successful login — reset failure counter

    if not user.is_active:
        user.is_active = True
        await db.flush()

    token = create_access_token(
        subject=str(user.id),
        extra_claims={"role": user.role.value, "username": user.username},
    )
    refresh = create_refresh_token(
        subject=str(user.id),
        extra_claims={"role": user.role.value, "username": user.username},
    )

    _set_auth_cookies(response, token, refresh, request=request)

    await log_action(
        db,
        actor_id=user.id,
        action=AuditAction.login,
        resource_type=ResourceType.session,
        resource_id=user.id,
        detail={"email": user.email},
        ip_address=client_ip,
    )

    return TokenResponse(
        access_token=token,
        refresh_token=refresh,
        user=UserRead.model_validate(user),
    )


@router.get("/me", response_model=UserRead, summary="Get current authenticated user")
async def get_me(current_user: User = Depends(get_current_user)):
    return UserRead.model_validate(current_user)


@router.post("/refresh", response_model=TokenResponse, summary="Silently renew access token with token rotation")
async def refresh_access_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Exchange a valid refresh token (from cookie or Authorization header) for a new access + refresh token pair."""
    client_ip = get_client_ip(request) or "unknown"
    _check_rate_limit(client_ip)
    # 1. Try reading from HttpOnly cookie first
    refresh_tok = request.cookies.get("nulltor_refresh_token")

    # 2. Fallback to Authorization header if cookie not present
    if not refresh_tok:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            refresh_tok = auth_header.removeprefix("Bearer ").strip()

    if not refresh_tok:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    payload = decode_refresh_token(refresh_tok)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    from uuid import UUID
    user_id = payload.get("sub")
    user = (await db.execute(select(User).where(User.id == UUID(user_id)))).scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    extra = {"role": user.role.value, "username": user.username}
    new_access = create_access_token(subject=str(user.id), extra_claims=extra)
    new_refresh = create_refresh_token(subject=str(user.id), extra_claims=extra)

    _set_auth_cookies(response, new_access, new_refresh, request=request)

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        user=UserRead.model_validate(user),
    )


@router.post("/logout", summary="Logout and clear authentication cookies")
async def logout(response: Response):
    _clear_auth_cookies(response)
    return {"message": "Logged out successfully"}


@router.post("/change-password", summary="Change user password")
async def change_password(
    payload: PasswordChangeRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if not verify_password(payload.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    user.hashed_password = get_password_hash(payload.new_password)
    user.requires_password_change = False
    await db.flush()
    
    await log_action(
        db,
        actor_id=user.id,
        action=AuditAction.update,
        resource_type=ResourceType.user,
        resource_id=user.id,
        detail={"field": "password"},
        ip_address=get_client_ip(request),
    )
    return {"message": "Password updated successfully"}

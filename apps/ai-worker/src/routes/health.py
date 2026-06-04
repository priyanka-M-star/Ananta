"""Liveness + readiness."""
from fastapi import APIRouter

from ..db import get_session


router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def liveness():
    return {"status": "ok"}


@router.get("/ready")
async def readiness():
    try:
        async with get_session() as session:
            await session.execute("SELECT 1")  # type: ignore[arg-type]
        return {"status": "ready", "database": "up"}
    except Exception as e:
        return {"status": "not-ready", "database": "down", "error": str(e)}

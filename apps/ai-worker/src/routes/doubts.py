"""Doubts route — Nest API POSTs to /doubts/answer with a doubt id.

We answer asynchronously and POST the result back to the API. The HTTP response
to Nest is just an ack so the Nest request doesn't hang.
"""
from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from ..services.doubts import answer_doubt


router = APIRouter(prefix="/doubts", tags=["doubts"])


class AnswerRequest(BaseModel):
    doubtId: str


@router.post("/answer")
async def answer(req: AnswerRequest, background: BackgroundTasks):
    if not req.doubtId:
        raise HTTPException(status_code=400, detail="doubtId required")
    background.add_task(answer_doubt, req.doubtId)
    return {"queued": True, "doubtId": req.doubtId}


@router.post("/answer/sync")
async def answer_sync(req: AnswerRequest):
    """Same as /answer but waits and returns the answer. Useful for tests."""
    return await answer_doubt(req.doubtId)

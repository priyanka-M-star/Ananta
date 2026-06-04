"""Answer a student doubt and POST the result back to the Nest API."""
from __future__ import annotations

from typing import Any

import httpx
from loguru import logger
from sqlalchemy import text

from ..config import settings
from ..db import get_session
from ..embeddings import embed_one
from ..personas.loader import load as load_persona
from ..rag import answer as rag_answer


_TEACHER_FOR_SUBJECT = {
    "MATHS": "praketa",
    "SCIENCE": "vihaan",
    "SOCIAL": "adhvara",
    "KANNADA": "harini",
    "ENGLISH": "anika",
    "HINDI": "amita",
}


async def answer_doubt(doubt_id: str) -> dict[str, Any]:
    """End-to-end flow for one doubt."""
    # 1. fetch the doubt + the class context (so we know which teacher to use)
    doubt = await _load_doubt(doubt_id)
    if not doubt:
        logger.warning(f"answer_doubt: doubt {doubt_id} not found")
        return {"ok": False, "reason": "not_found"}

    persona_slug = _TEACHER_FOR_SUBJECT.get(doubt["subject_code"], "vihaan")
    persona = load_persona(persona_slug)

    # 2. RAG answer
    answer_text, chunks = await rag_answer(
        question=doubt["question"],
        persona=persona,
        grade=doubt["grade"],
        medium=doubt["medium"],
    )

    # 3. persist answer + embedding (so future doubts can retrieve it)
    await _save_answer(doubt_id, answer_text)

    # 4. notify the API so the WebSocket can push it to the student
    await _post_back(doubt_id, answer_text)

    return {
        "ok": True,
        "answer": answer_text,
        "chunks_used": [{"id": c.id, "chapter": c.chapter, "subject": c.subject_code} for c in chunks],
    }


async def _load_doubt(doubt_id: str) -> dict | None:
    sql = text("""
        SELECT
          d.id::text AS id,
          d.question,
          s.code AS subject_code,
          COALESCE(cs.grade, 'GRADE_10') AS grade,
          COALESCE(cs.medium, 'ENGLISH') AS medium
        FROM "Doubt" d
        LEFT JOIN "ClassSession" cs ON cs.id = d."classSessionId"
        LEFT JOIN "Subject" s ON s.id = cs."subjectId"
        WHERE d.id = CAST(:id AS uuid)
    """)
    async with get_session() as session:
        r = (await session.execute(sql, {"id": doubt_id})).mappings().first()
        return dict(r) if r else None


async def _save_answer(doubt_id: str, answer_text: str) -> None:
    vec = embed_one(answer_text)
    sql = text("""
        UPDATE "Doubt"
        SET answer = :ans,
            status = 'ANSWERED',
            "answeredAt" = NOW(),
            embedding = CAST(:vec AS vector)
        WHERE id = CAST(:id AS uuid)
    """)
    async with get_session() as session:
        await session.execute(sql, {"ans": answer_text, "vec": str(vec), "id": doubt_id})


async def _post_back(doubt_id: str, answer_text: str) -> None:
    """Tell the Nest API the answer is ready so it can push to the student's WebSocket."""
    url = f"{settings.api_url}/doubts/{doubt_id}/answer"
    headers = {"x-internal-secret": settings.internal_shared_secret}
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(url, json={"answer": answer_text}, headers=headers)
    except httpx.HTTPError as e:
        logger.warning(f"Failed to POST answer back to API: {e}")

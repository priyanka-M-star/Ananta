"""Retrieval-augmented generation.

Phase 1 architecture:
  1. embed the query (BGE-M3)
  2. pgvector cosine search over lesson chunks + textbook + prior doubts
  3. assemble the prompt: persona system + few-shot + retrieved chunks + question
  4. call Groq/Sarvam, return answer + which chunks were used
"""
from __future__ import annotations

from dataclasses import dataclass

from loguru import logger
from sqlalchemy import text

from .config import settings
from .db import get_session
from .embeddings import embed_one
from .llm import Message, llm
from .personas.loader import Persona


@dataclass
class RetrievedChunk:
    id: str
    source: str           # 'lesson' | 'textbook' | 'doubt'
    subject_code: str
    chapter: str | None
    text: str
    distance: float


async def retrieve(
    query: str,
    *,
    subject_code: str | None = None,
    grade: str = "GRADE_10",
    top_k: int | None = None,
) -> list[RetrievedChunk]:
    """Top-K relevant chunks for the query. Filters by subject when given."""
    k = top_k or settings.rag_top_k
    qvec = embed_one(query)

    # NOTE: in the live system we'd have a dedicated lesson_chunks table; for this
    # skeleton we use Lesson.embedding as the source of truth (one embedding per
    # lesson summary). A follow-up migration will split lessons into chunks.
    sql = text("""
        SELECT
          l.id::text AS id,
          'lesson' AS source,
          s.code AS subject_code,
          c.number::text AS chapter,
          COALESCE(l."scriptText", l.summary) AS text,
          l.embedding <=> CAST(:qvec AS vector) AS distance
        FROM "Lesson" l
        JOIN "Subject" s ON s.id = l."subjectId"
        JOIN "Chapter" c ON c.id = l."chapterId"
        WHERE l.embedding IS NOT NULL
          AND l.grade = :grade
          AND (:subject_code IS NULL OR s.code = :subject_code)
        ORDER BY l.embedding <=> CAST(:qvec AS vector)
        LIMIT :k
    """)

    rows = []
    async with get_session() as session:
        result = await session.execute(
            sql,
            {"qvec": str(qvec), "grade": grade, "subject_code": subject_code, "k": k},
        )
        for r in result.mappings():
            rows.append(
                RetrievedChunk(
                    id=r["id"],
                    source=r["source"],
                    subject_code=r["subject_code"],
                    chapter=r["chapter"],
                    text=r["text"] or "",
                    distance=float(r["distance"] or 0.0),
                )
            )
    logger.debug(f"RAG retrieved {len(rows)} chunks for: {query[:60]!r}")
    return rows


def build_context_block(chunks: list[RetrievedChunk]) -> str:
    if not chunks:
        return "(no relevant chunks found)"
    parts = []
    for i, c in enumerate(chunks, 1):
        header = f"[{i}] Ch.{c.chapter or '?'} · {c.subject_code}"
        parts.append(f"{header}\n{c.text.strip()}\n")
    return "\n".join(parts)


async def answer(
    *,
    question: str,
    persona: Persona,
    grade: str = "GRADE_10",
    medium: str = "ENGLISH",
) -> tuple[str, list[RetrievedChunk]]:
    """Single-shot RAG answer. Returns (answer_text, chunks_used)."""
    chunks = await retrieve(question, subject_code=_subject_from_persona(persona), grade=grade)
    context = build_context_block(chunks[: settings.rag_rerank_to])

    messages: list[Message] = [Message(role="system", content=persona.system_prompt(medium=medium, grade=grade))]
    for ex in persona.few_shot():
        messages.append(Message(role=ex["role"], content=ex["content"]))  # type: ignore[arg-type]
    messages.append(
        Message(
            role="user",
            content=(
                f"CONTEXT YOU HAVE ACCESS TO:\n{context}\n\n"
                f"STUDENT'S QUESTION:\n{question}\n\nYOUR ANSWER (as {persona.name}):"
            ),
        )
    )

    text_answer = await llm.complete(messages, temperature=0.5, max_tokens=400)
    return text_answer, chunks


def _subject_from_persona(p: Persona) -> str | None:
    return {
        "Mathematics": "MATHS",
        "Science": "SCIENCE",
        "Social Science": "SOCIAL",
        "Kannada": "KANNADA",
        "English": "ENGLISH",
        "Hindi": "HINDI",
    }.get(p.subject)

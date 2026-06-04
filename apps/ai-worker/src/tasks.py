"""Celery tasks. Each task is sync (Celery isn't great with async), so we use
asyncio.run() at the boundary to call the async services.
"""
from __future__ import annotations

import asyncio

from loguru import logger

from .celery_app import celery
from .services.doubts import answer_doubt


@celery.task(name="src.tasks.answer_doubt_task", autoretry_for=(Exception,), max_retries=2)
def answer_doubt_task(doubt_id: str) -> dict:
    """Background processing of a doubt (alternative to the inline HTTP path)."""
    return asyncio.run(answer_doubt(doubt_id))


@celery.task(name="src.tasks.generate_tomorrow_lessons")
def generate_tomorrow_lessons() -> dict:
    """Nightly cron — finds tomorrow's class sessions and generates their assets.

    Phase 1 stub. Wires up to lesson_gen service once chapter content for each
    subject is ingested into the knowledge base.
    """
    logger.info("Nightly lesson generation tick")
    # TODO: query ClassSession for tomorrow's scheduled lessons, then for each:
    #   1. generate_script (LLM)
    #   2. generate_animation_plan
    #   3. render Manim/Remotion to MP4
    #   4. render TTS to WAV
    #   5. ffmpeg mux to MP4
    #   6. upload to R2, mark Lesson.status = READY
    return {"queued_for_generation": 0}


@celery.task(name="src.tasks.render_tts")
def render_tts(teacher_slug: str, text: str) -> dict:
    """Render a piece of text to audio using the teacher's voice."""
    logger.info(f"TTS render for {teacher_slug} ({len(text)} chars)")
    # TODO: call services.tts.synthesize and upload to R2
    return {"teacher": teacher_slug, "chars": len(text)}

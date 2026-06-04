"""Celery app for slow background work — overnight lesson generation,
TTS rendering, monthly evals, etc.

Run with:
  celery -A src.celery_app worker --loglevel=info
  celery -A src.celery_app beat   --loglevel=info     # scheduled tasks
"""
from __future__ import annotations

from celery import Celery
from celery.schedules import crontab

from .config import settings


celery = Celery(
    "ananta-ai-worker",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["src.tasks"],
)

celery.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Kolkata",
    enable_utc=False,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_default_queue="default",
    task_routes={
        "src.tasks.generate_tomorrow_lessons": {"queue": "heavy"},
        "src.tasks.render_tts": {"queue": "heavy"},
        "src.tasks.answer_doubt_task": {"queue": "default"},
    },
    beat_schedule={
        "generate-tomorrow-2am": {
            "task": "src.tasks.generate_tomorrow_lessons",
            "schedule": crontab(hour=2, minute=0),
        },
    },
)

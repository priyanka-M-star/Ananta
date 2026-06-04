"""Loguru setup — structured logs, pretty in dev, JSON in prod."""
from __future__ import annotations

import sys

from loguru import logger

from .config import settings


def setup_logging() -> None:
    logger.remove()
    if settings.is_dev:
        logger.add(
            sys.stdout,
            level="INFO",
            colorize=True,
            format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan> - <level>{message}</level>",
        )
    else:
        logger.add(sys.stdout, level="INFO", serialize=True)

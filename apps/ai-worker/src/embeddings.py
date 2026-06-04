"""BGE-M3 embeddings.

Multilingual (handles English + Kannada + Hindi). 1024-d output matches the
`vector(1024)` column type in Prisma.

The model is downloaded from Hugging Face on first run (~2 GB). In production
we mount a persistent volume to avoid re-download on each container restart.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Sequence

import numpy as np
from loguru import logger

from .config import settings


@lru_cache
def _get_model():
    # Lazy import so the worker process doesn't load the model unless needed.
    from sentence_transformers import SentenceTransformer  # type: ignore

    logger.info(f"Loading embedding model: {settings.embedding_model}")
    model = SentenceTransformer(settings.embedding_model, trust_remote_code=True)
    return model


def embed(text: str | Sequence[str]) -> np.ndarray:
    """Returns shape (N, D) array. Single-string input still returns (1, D)."""
    model = _get_model()
    texts = [text] if isinstance(text, str) else list(text)
    vectors = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return np.asarray(vectors, dtype=np.float32)


def embed_one(text: str) -> list[float]:
    """Returns a single 1024-d vector as plain list (pgvector friendly)."""
    return embed(text)[0].tolist()

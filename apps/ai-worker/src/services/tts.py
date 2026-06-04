"""TTS adapter — wraps AI4Bharat IndicTTS in Phase 1, with per-teacher LoRA
adapters loaded from R2 (cached on disk).

Real model integration lives behind this interface so callers don't care which
provider is active. In dev we just synthesise a tiny WAV header + silence so the
pipeline can be tested end-to-end without GPU.
"""
from __future__ import annotations

import struct
import wave
from io import BytesIO
from pathlib import Path

from loguru import logger

from ..config import settings


TEACHER_LANG = {
    "praketa": "en",
    "vihaan": "en",
    "adhvara": "en",
    "harini": "kn",
    "anika": "en",
    "amita": "hi",
}


async def synthesize(*, teacher_slug: str, text: str) -> bytes:
    """Returns WAV bytes for the given script."""
    if settings.is_dev or settings.tts_provider != "ai4bharat":
        logger.info(f"[dev TTS] would synthesize {len(text)} chars for {teacher_slug}")
        return _silence(0.5)

    # Production path — load the IndicTTS adapter for this teacher.
    # Pseudo-code; the real call depends on AI4Bharat's serving setup.
    voice_path = Path(settings.tts_voices_dir) / f"{teacher_slug}.onnx"
    if not voice_path.exists():
        logger.warning(f"Voice adapter missing for {teacher_slug}, falling back to base IndicTTS")

    # TODO: import indictts and run inference here
    return _silence(0.5)


def _silence(seconds: float, sample_rate: int = 22050) -> bytes:
    """Generates an empty WAV — useful for skeleton testing."""
    buf = BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        n = int(seconds * sample_rate)
        w.writeframes(struct.pack(f"<{n}h", *([0] * n)))
    return buf.getvalue()

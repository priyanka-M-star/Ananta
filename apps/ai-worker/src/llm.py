"""LLM client.

Phase 1 strategy: Groq (Llama 3.3 70B) as primary, OpenRouter (DeepSeek / Gemini
Flash) as automatic fallback when Groq rate-limits.

Both speak the OpenAI Chat Completions wire format, so we use the official
`openai` client pointed at their base URLs.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import AsyncIterator, Iterable, Literal

from loguru import logger
from openai import AsyncOpenAI
from openai._exceptions import RateLimitError, APIConnectionError, APIStatusError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from .config import settings


Role = Literal["system", "user", "assistant"]


@dataclass
class Message:
    role: Role
    content: str

    def to_dict(self) -> dict[str, str]:
        return {"role": self.role, "content": self.content}


class LlmClient:
    def __init__(self) -> None:
        self._groq: AsyncOpenAI | None = None
        self._openrouter: AsyncOpenAI | None = None

        if settings.groq_api_key:
            self._groq = AsyncOpenAI(
                api_key=settings.groq_api_key,
                base_url="https://api.groq.com/openai/v1",
            )
        else:
            logger.warning("GROQ_API_KEY not set — LLM calls will use OpenRouter or fail")

        if settings.openrouter_api_key:
            self._openrouter = AsyncOpenAI(
                api_key=settings.openrouter_api_key,
                base_url="https://openrouter.ai/api/v1",
            )

    async def complete(
        self,
        messages: Iterable[Message],
        *,
        temperature: float = 0.6,
        max_tokens: int = 1024,
        prefer: Literal["groq", "openrouter"] = "groq",
    ) -> str:
        """Single-shot completion. Tries primary, falls back automatically."""
        msg_dicts = [m.to_dict() for m in messages]
        try:
            return await self._call(prefer, msg_dicts, temperature, max_tokens)
        except (RateLimitError, APIStatusError, APIConnectionError) as e:
            other = "openrouter" if prefer == "groq" else "groq"
            logger.warning(f"{prefer} failed ({type(e).__name__}); falling back to {other}")
            return await self._call(other, msg_dicts, temperature, max_tokens)

    async def stream(
        self,
        messages: Iterable[Message],
        *,
        temperature: float = 0.6,
        max_tokens: int = 1024,
        prefer: Literal["groq", "openrouter"] = "groq",
    ) -> AsyncIterator[str]:
        """Token-stream. Used for live doubt answering so the student sees text
        appear as it's generated rather than after a full wait."""
        client, model = self._pick(prefer)
        if client is None:
            raise RuntimeError("No LLM client configured")
        msg_dicts = [m.to_dict() for m in messages]

        stream = await client.chat.completions.create(
            model=model,
            messages=msg_dicts,  # type: ignore[arg-type]
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )
        async for chunk in stream:
            piece = chunk.choices[0].delta.content if chunk.choices else None
            if piece:
                yield piece

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=0.5, max=3),
        retry=retry_if_exception_type((APIConnectionError,)),
        reraise=True,
    )
    async def _call(
        self,
        which: Literal["groq", "openrouter"],
        messages: list[dict[str, str]],
        temperature: float,
        max_tokens: int,
    ) -> str:
        client, model = self._pick(which)
        if client is None:
            raise RuntimeError(f"{which} not configured")
        resp = await client.chat.completions.create(
            model=model,
            messages=messages,  # type: ignore[arg-type]
            temperature=temperature,
            max_tokens=max_tokens,
        )
        text = resp.choices[0].message.content or ""
        return text.strip()

    def _pick(self, which: Literal["groq", "openrouter"]) -> tuple[AsyncOpenAI | None, str]:
        if which == "groq":
            return self._groq, settings.groq_model
        return self._openrouter, settings.openrouter_model


# Singleton — instantiated once per process
llm = LlmClient()

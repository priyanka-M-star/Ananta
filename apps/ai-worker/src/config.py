"""Settings — loaded from .env via pydantic-settings."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Server
    host: str = "0.0.0.0"
    port: int = 5000
    env: str = "development"

    # Database
    database_url: str = "postgresql+asyncpg://ananta:ananta@localhost:5432/ananta"

    # Redis / Celery
    redis_url: str = "redis://localhost:6379/0"

    # LLM
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    openrouter_api_key: str = ""
    openrouter_model: str = "deepseek/deepseek-chat"
    sarvam_api_key: str = ""

    # Embeddings + RAG
    embedding_model: str = "BAAI/bge-m3"
    embedding_dim: int = 1024
    rag_top_k: int = 8
    rag_rerank_to: int = 4

    # API callback
    api_url: str = "http://localhost:4000/v1"
    internal_shared_secret: str = "change-me"

    # TTS
    tts_provider: str = "ai4bharat"
    tts_voices_dir: str = "./models/voices"

    @property
    def is_dev(self) -> bool:
        return self.env != "production"

    @property
    def personas_dir(self) -> Path:
        return Path(__file__).parent / "personas"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

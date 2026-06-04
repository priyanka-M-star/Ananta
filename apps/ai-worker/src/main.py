"""FastAPI app bootstrap."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from .config import settings
from .db import shutdown as db_shutdown
from .logging import setup_logging
from .routes import doubts as doubts_routes
from .routes import generation as generation_routes
from .routes import health as health_routes
from .routes import tts as tts_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info(f"Ananta AI worker starting (env={settings.env})")
    yield
    logger.info("Ananta AI worker shutting down")
    await db_shutdown()


app = FastAPI(
    title="Ananta AI worker",
    description="RAG, lesson generation, doubt answering, TTS",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS only matters for the rare case where the browser talks directly to us
# (e.g. streaming a doubt answer). Normal path: browser → Nest → AI worker.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_routes.router)
app.include_router(doubts_routes.router)
app.include_router(generation_routes.router)
app.include_router(tts_routes.router)


@app.get("/")
async def root():
    return {
        "service": "ananta-ai-worker",
        "version": app.version,
        "env": settings.env,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.is_dev,
    )

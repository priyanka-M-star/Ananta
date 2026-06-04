# FastAPI AI worker (Python 3.11, slim).
# Final image: ~600 MB on linux/arm64 (heavier than Node because of ML deps).
FROM python:3.11-slim-bookworm AS build

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY apps/ai-worker/pyproject.toml ./
RUN pip install -U pip wheel && \
    pip install -e .

# ---------- runtime ----------
FROM python:3.11-slim-bookworm AS runtime
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOST=0.0.0.0 \
    PORT=5000

RUN apt-get update && apt-get install -y --no-install-recommends \
      libpq5 curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r app && useradd -r -g app app

COPY --from=build /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=build /usr/local/bin /usr/local/bin
COPY apps/ai-worker/src ./src
COPY apps/ai-worker/pyproject.toml ./

HEALTHCHECK --interval=20s --timeout=5s --retries=5 \
  CMD curl --fail http://localhost:5000/health || exit 1

USER app
EXPOSE 5000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "5000", "--workers", "2"]
